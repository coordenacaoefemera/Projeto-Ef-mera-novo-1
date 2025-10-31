

import React, { useState } from 'react';

export const SupabaseConfigScreen: React.FC<{ onConfigured: () => void }> = ({ onConfigured }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!url || !key) {
      setError('A URL e a Chave do Supabase são obrigatórias.');
      return;
    }
    // Simple validation
    if (!url.startsWith('https://') || !url.includes('supabase.co')) {
        setError('Por favor, insira uma URL válida do Supabase.');
        return;
    }
    localStorage.setItem('supabaseUrl', url);
    localStorage.setItem('supabaseKey', key);
    setError('');
    onConfigured();
  };

  return (
    <div className="min-h-screen bg-efemera-dark flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-efemera-gray p-8 rounded-xl shadow-2xl border border-efemera-light-gray">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-efemera-pink">EFÊMERA</h1>
          <p className="text-gray-400 mt-2">Configuração do Banco de Dados Online</p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-efemera-dark p-4 rounded-lg border border-efemera-light-gray">
             <h3 className="font-semibold text-lg text-gray-200 mb-2">Instruções</h3>
             <ol className="text-sm text-gray-400 list-decimal list-inside space-y-2">
              <li>Acesse o <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-efemera-pink underline">painel do seu projeto Supabase</a>.</li>
              <li>No menu esquerdo, clique no ícone de engrenagem (<code className="bg-black px-1.5 py-1 rounded">Project Settings</code>) e depois em <code className="bg-black px-1.5 py-1 rounded">API</code>.</li>
              <li>Copie a <strong className="text-white">URL do Projeto</strong> e a chave <strong className="text-white">anon public</strong> e cole nos campos abaixo.</li>
            </ol>
             <p className="text-xs text-yellow-300 mt-4 bg-yellow-900/50 p-3 rounded-md border border-yellow-700">
              <strong>Atenção:</strong> Use a chave que começa com <code className="bg-black px-1.5 py-1 rounded">eyJ...</code> no campo <code className="bg-black px-1.5 py-1 rounded">anon public</code>. Nunca use a chave `service_role` neste aplicativo.
            </p>
          </div>

          <div>
            <label htmlFor="supabaseUrl" className="block text-sm font-medium text-gray-300">
              Supabase URL
            </label>
            <input
              id="supabaseUrl"
              className="w-full mt-2 bg-efemera-light-gray border-2 border-efemera-light-gray rounded-lg p-3 focus:ring-efemera-pink focus:border-efemera-pink transition-colors"
              type="text"
              placeholder="https://xxxxxxxx.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="supabaseKey" className="block text-sm font-medium text-gray-300">
              Supabase Anon Key (Pública)
            </label>
            <input
              id="supabaseKey"
              className="w-full mt-2 bg-efemera-light-gray border-2 border-efemera-light-gray rounded-lg p-3 focus:ring-efemera-pink focus:border-efemera-pink transition-colors"
              type="password"
              placeholder="eyJhbGciOi..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div>
            <button 
              onClick={handleSave}
              className="w-full px-6 py-3 rounded-lg bg-efemera-pink hover:bg-efemera-pink-dark transition-all duration-300 font-semibold shadow-lg shadow-efemera-pink/20 hover:shadow-efemera-pink/40"
            >
              Salvar e Conectar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};