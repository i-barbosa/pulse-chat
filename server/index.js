const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('./src/config/db'); // ajuste o caminho se necessário
const Message = require('./src/models/Message');
const Channel = require('./src/models/Channel');

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

connectDB();

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*', // ou a URL do seu Vite ex: http://localhost:5173
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket] Conectado: ${socket.id}`);

  // 1. LISTAR SALAS
  socket.on('get_channels', async () => {
    try {
      const channels = await Channel.find().select('-password').sort({ createdAt: 1 });
      socket.emit('load_channels', channels);
    } catch (err) {
      console.error('Erro ao buscar salas:', err);
    }
  });

  // 2. CRIAR SALA (Pública ou Privada)
  socket.on('create_channel', async (data, callback) => {
    try {
      const { name, isPrivate, password } = data;
      const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const existing = await Channel.findOne({ slug });
      if (existing) {
        return callback({ success: false, error: 'Já existe uma sala com esse nome.' });
      }

      const channel = new Channel({
        name,
        slug,
        isPrivate: !!isPrivate,
        password: isPrivate ? password : null,
      });

      await channel.save();

      const newChannelData = {
        _id: channel._id,
        name: channel.name,
        slug: channel.slug,
        isPrivate: channel.isPrivate,
      };

      // Emite a nova sala para TODOS os usuários conectados em tempo real
      io.emit('channel_created', newChannelData);
      callback({ success: true, channel: newChannelData });
    } catch (err) {
      console.error('Erro ao criar sala:', err);
      callback({ success: false, error: 'Erro ao salvar sala.' });
    }
  });

  // 3. EXCLUSÃO EM CASCATA DA SALA E MENSAGENS
  socket.on('delete_channel', async (slug, callback) => {
    try {
      // Deleta todas as mensagens atreladas a esta sala
      await Message.deleteMany({ channelId: slug });

      // Deleta a sala
      await Channel.findOneAndDelete({ slug });

      // Notifica todos os clientes que a sala foi excluída
      io.emit('channel_deleted', slug);
      callback({ success: true });
    } catch (err) {
      console.error('Erro na exclusão em cascata:', err);
      callback({ success: false, error: 'Erro ao apagar sala.' });
    }
  });

  // 4. VALIDAR SENHA DE SALA PRIVADA
  socket.on('verify_channel_password', async ({ slug, password }, callback) => {
    try {
      const channel = await Channel.findOne({ slug });
      if (!channel || !channel.isPrivate) {
        return callback({ success: false, error: 'Sala inválida.' });
      }

      const isMatch = await bcrypt.compare(password, channel.password || '');
      if (isMatch) {
        callback({ success: true });
      } else {
        callback({ success: false, error: 'Senha incorreta!' });
      }
    } catch (err) {
      callback({ success: false, error: 'Erro ao verificar senha.' });
    }
  });

  // 5. ENTRAR EM SALA E CARREGAR MENSAGENS HISTÓRICAS
  socket.on('join_channel', async ({ channelId, previousChannel }) => {
    if (previousChannel) socket.leave(previousChannel);
    socket.join(channelId);

    // Carrega o histórico de mensagens salvas do MongoDB apenas do canal atual
    try {
      const messages = await Message.find({ channelId }).sort({ createdAt: 1 });
      socket.emit('load_messages', messages);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    }
  });

  // 6. ENVIAR MENSAGEM
  socket.on('send_message', async (data) => {
    try {
      const newMessage = await Message.create({
        channelId: data.channelId,
        senderName: data.senderName,
        senderId: socket.id,
        text: data.text,
      });

      io.to(data.channelId).emit('receive_message', {
        _id: newMessage._id,
        channelId: newMessage.channelId,
        senderName: newMessage.senderName,
        senderId: socket.id,
        text: newMessage.text,
        createdAt: newMessage.createdAt,
      });
    } catch (err) {
      console.error('Erro ao salvar mensagem:', err);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[Server] WebSockets rodando na porta ${PORT}`);
});