import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  MessageSquare, Settings, Compass, 
  Sparkles, CheckCheck, Send, Plus, Lock, Unlock, Trash2, X 
} from 'lucide-react';

const socket = io('http://localhost:4000');

export default function ChatLayout() {
  const [activeSpace, setActiveSpace] = useState('dms');
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState('geral');
  const [unlockedChannels, setUnlockedChannels] = useState(['geral']);
  
  const [message, setMessage] = useState('');
  const [messagesList, setMessagesList] = useState([]);
  const messagesEndRef = useRef(null);

  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelIsPrivate, setNewChannelIsPrivate] = useState(false);
  const [newChannelPassword, setNewChannelPassword] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [targetChannel, setTargetChannel] = useState(null);
  const [inputPassword, setInputPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 1. Eventos Socket Globais (Salas e Mensagens)
  useEffect(() => {
    // Pedir lista de salas no primeiro acesso
    socket.emit('get_channels');

    // Escutar recepção inicial de salas
    socket.on('load_channels', (data) => {
      setChannels(data);
    });

    // Nova sala criada por alguém
    socket.on('channel_created', (newChannel) => {
      setChannels((prev) => {
        if (prev.some((c) => c.slug === newChannel.slug)) return prev;
        return [...prev, newChannel];
      });
    });

    // Sala excluída em cascata por alguém
    socket.on('channel_deleted', (deletedSlug) => {
      setChannels((prev) => prev.filter((ch) => ch.slug !== deletedSlug));
      if (activeChannel === deletedSlug) {
        setActiveChannel('geral');
      }
    });

    // Histórico de mensagens recebido ao trocar de canal
    socket.on('load_messages', (messages) => {
      setMessagesList(messages);
    });

    // Nova mensagem individual
    socket.on('receive_message', (data) => {
      setMessagesList((prev) => [...prev, data]);
    });

    return () => {
      socket.off('load_channels');
      socket.off('channel_created');
      socket.off('channel_deleted');
      socket.off('load_messages');
      socket.off('receive_message');
    };
  }, [activeChannel]);

  // 2. Entrar na sala
  useEffect(() => {
    socket.emit('join_channel', { channelId: activeChannel });
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesList]);

  // Selecionar canal
  const handleSelectChannel = (channel) => {
    if (channel.isPrivate && !unlockedChannels.includes(channel.slug)) {
      setTargetChannel(channel);
      setShowPasswordModal(true);
      setPasswordError('');
      setInputPassword('');
    } else {
      setActiveChannel(channel.slug);
    }
  };

  // Validar senha
  const handleVerifyPassword = (e) => {
    e.preventDefault();
    socket.emit('verify_channel_password', { slug: targetChannel.slug, password: inputPassword }, (response) => {
      if (response.success) {
        setUnlockedChannels((prev) => [...prev, targetChannel.slug]);
        setActiveChannel(targetChannel.slug);
        setShowPasswordModal(false);
      } else {
        setPasswordError(response.error || 'Senha incorreta.');
      }
    });
  };

  // Criar Sala via Socket
  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    socket.emit('create_channel', {
      name: newChannelName,
      isPrivate: newChannelIsPrivate,
      password: newChannelPassword,
    }, (response) => {
      if (response.success) {
        if (response.channel.isPrivate) {
          setUnlockedChannels((prev) => [...prev, response.channel.slug]);
        }
        setActiveChannel(response.channel.slug);
        setShowCreateModal(false);
        setNewChannelName('');
        setNewChannelIsPrivate(false);
        setNewChannelPassword('');
      } else {
        alert(response.error || 'Erro ao criar sala.');
      }
    });
  };

  // Deletar Sala via Socket (Cascata)
  const handleDeleteChannel = (e, channelSlug) => {
    e.stopPropagation();
    if (!confirm(`Tem certeza que deseja apagar a sala #${channelSlug}? Todas as mensagens serão deletadas permanentemente.`)) return;

    socket.emit('delete_channel', channelSlug, (response) => {
      if (!response.success) {
        alert(response.error || 'Erro ao excluir sala.');
      }
    });
  };

  // Enviar Mensagem via Socket
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!message.trim()) return;

    socket.emit('send_message', {
      channelId: activeChannel,
      text: message,
      senderName: 'Você',
    });
    setMessage('');
  };

  return (
    <div className="flex h-screen w-screen bg-pulse-950 text-slate-100 overflow-hidden font-sans select-none">
      
      {/* SIDEBAR */}
      <aside className="w-80 bg-pulse-900 border-r border-pulse-700 flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-accent flex items-center justify-center font-black text-pulse-950 text-sm">
                P
              </div>
              <span className="font-bold text-base tracking-tight text-slate-100">
                Pulse Chat
              </span>
            </div>
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-pulse-800 transition">
              <Settings size={18} />
            </button>
          </div>

          <div className="bg-pulse-950 p-1 rounded-xl border border-pulse-700 flex space-x-1">
            <button 
              onClick={() => setActiveSpace('dms')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                activeSpace === 'dms' ? 'bg-pulse-800 text-emerald-accent' : 'text-slate-400'
              }`}
            >
              <MessageSquare size={14} />
              <span>Mensagens</span>
            </button>
            <button 
              onClick={() => setActiveSpace('pulse-community')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                activeSpace === 'pulse-community' ? 'bg-pulse-800 text-violet-accent' : 'text-slate-400'
              }`}
            >
              <Compass size={14} />
              <span>Comunidades</span>
            </button>
          </div>

          {/* Botão de Criar Sala */}
          <div className="mt-4 flex items-center justify-between px-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Salas / Canais
            </span>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="p-1 text-emerald-accent hover:bg-pulse-800 rounded-lg transition cursor-pointer"
              title="Criar Sala"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Lista de Salas */}
          <div className="space-y-1 overflow-y-auto max-h-[60vh] no-scrollbar">
            {channels.map((ch) => {
              const isActive = activeChannel === ch.slug;
              const isLocked = ch.isPrivate && !unlockedChannels.includes(ch.slug);

              return (
                <div
                  key={ch._id || ch.slug}
                  onClick={() => handleSelectChannel(ch)}
                  className={`group w-full p-2.5 rounded-xl transition flex items-center justify-between cursor-pointer ${
                    isActive ? 'bg-pulse-800 border-l-2 border-emerald-accent text-white' : 'text-slate-400 hover:bg-pulse-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {ch.isPrivate ? (
                      isLocked ? <Lock size={14} className="text-amber-400" /> : <Unlock size={14} className="text-emerald-accent" />
                    ) : (
                      <span className="text-slate-500">#</span>
                    )}
                    <span className="text-xs font-bold truncate">{ch.name}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteChannel(e, ch.slug)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 transition"
                    title="Excluir Sala em Cascata"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ÁREA DE CHAT */}
      <main className="flex-1 flex flex-col bg-pulse-950 relative min-w-0">
        <header className="h-16 px-8 border-b border-pulse-700 flex items-center justify-between bg-pulse-900/40 shrink-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-bold text-white tracking-tight">#{activeChannel}</h2>
          </div>
          <div className="flex items-center space-x-3 text-slate-400 text-xs">
            <span className="flex items-center text-emerald-accent font-medium">
              <Sparkles size={14} className="mr-1" /> Sistema 100% WebSockets Active
            </span>
          </div>
        </header>

        {/* Mensagens */}
        <div className="flex-1 p-8 space-y-4 overflow-y-auto no-scrollbar">
          {messagesList.length === 0 ? (
            <p className="text-center text-xs text-slate-500 my-10">
              Nenhuma mensagem em #{activeChannel}. Comece a conversar!
            </p>
          ) : (
            messagesList.map((msg) => {
              const isMyMessage = msg.senderId === socket.id;
              const formattedTime = msg.createdAt 
                ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div key={msg._id || Math.random()} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-md p-4 rounded-2xl shadow-md ${
                      isMyMessage 
                        ? 'bg-emerald-accent/10 border border-emerald-accent/30 rounded-tr-sm' 
                        : 'bg-pulse-900 border border-pulse-700 rounded-tl-sm'
                    }`}
                  >
                    {!isMyMessage && (
                      <span className="text-xs font-bold text-violet-accent block mb-1">
                        {msg.senderName}
                      </span>
                    )}
                    <p className="text-sm text-slate-100 leading-relaxed">{msg.text}</p>
                    <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-slate-400">
                      <span>{formattedTime}</span>
                      {isMyMessage && <CheckCheck size={14} className="text-emerald-accent" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-6 shrink-0">
          <div className="max-w-3xl mx-auto bg-pulse-900 border border-pulse-700 rounded-2xl p-2 pl-4 flex items-center space-x-3 shadow-xl focus-within:border-violet-accent transition">
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Enviar mensagem em #${activeChannel}...`}
              className="flex-1 bg-transparent text-sm text-slate-100 focus:outline-none placeholder-slate-500"
            />
            <button 
              type="submit"
              className="p-2.5 bg-emerald-accent text-pulse-950 rounded-xl font-bold hover:bg-emerald-400 transition cursor-pointer shadow-md"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </main>

      {/* MODAL: Criar Sala */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-pulse-900 border border-pulse-700 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Criar Nova Sala</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nome da Sala</label>
                <input 
                  type="text" 
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="ex: devs-frontend"
                  required
                  className="w-full bg-pulse-950 border border-pulse-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-accent"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="privateCheck"
                  checked={newChannelIsPrivate}
                  onChange={(e) => setNewChannelIsPrivate(e.target.checked)}
                  className="rounded border-pulse-700 accent-emerald-accent"
                />
                <label htmlFor="privateCheck" className="text-xs text-slate-300">Sala Privada (com senha)</label>
              </div>

              {newChannelIsPrivate && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Senha de Acesso</label>
                  <input 
                    type="password" 
                    value={newChannelPassword}
                    onChange={(e) => setNewChannelPassword(e.target.value)}
                    placeholder="Digite a senha..."
                    required
                    className="w-full bg-pulse-950 border border-pulse-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-accent"
                  />
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-2.5 bg-emerald-accent text-pulse-950 font-bold rounded-xl hover:bg-emerald-400 transition cursor-pointer"
              >
                Criar Sala
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Senha de Sala Privada */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-pulse-900 border border-pulse-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center">
                <Lock size={16} className="mr-2 text-amber-400" /> Sala Protegida
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              A sala <strong className="text-white">#{targetChannel?.name}</strong> é privada. Digite a senha para entrar:
            </p>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <input 
                  type="password" 
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="Sua senha..."
                  required
                  className="w-full bg-pulse-950 border border-pulse-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-accent"
                />
                {passwordError && <p className="text-xs text-red-400 mt-1">{passwordError}</p>}
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-emerald-accent text-pulse-950 font-bold rounded-xl hover:bg-emerald-400 transition cursor-pointer"
              >
                Entrar na Sala
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}