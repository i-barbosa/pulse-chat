import { MessageSquare, ShieldCheck, Zap } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center p-6">
      <div className="bg-dark-800 border border-dark-700 p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <MessageSquare className="w-12 h-12 text-indigo-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Chat App Realtime
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          Vite + React + TailwindCSS v4
        </p>

        <div className="space-y-3 text-left">
          <div className="flex items-center gap-3 bg-dark-900/50 p-3 rounded-lg border border-dark-700">
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-xs text-slate-300">Socket.IO + Upstash Redis Configurados</span>
          </div>
          <div className="flex items-center gap-3 bg-dark-900/50 p-3 rounded-lg border border-dark-700">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300">Auth via JWT + Refresh Tokens</span>
          </div>
        </div>
      </div>
    </div>
  );
}