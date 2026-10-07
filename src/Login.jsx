import React, { useState } from 'react';
import { supabase } from './supabase'; // Certifique-se de que o caminho do supabase.js está correto

export default function Login({ onLoginSucesso }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro(null);

    // Autenticação oficial direto no Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro('E-mail ou senha incorretos. Verifique os dados.');
    } else if (data.session) {
      onLoginSucesso(data.session);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
        <div className="text-center mb-8">
          <span className="text-4xl">🏍️</span>
          <h1 className="text-2xl font-bold text-white mt-4">MotoConta</h1>
          <p className="text-slate-400 text-sm mt-1">Entre com as credenciais para acessar o painel</p>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-200 text-sm rounded-lg text-center">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">E-mail de Acesso</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@email.com"
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50"
          >
            {carregando ? 'Entrando...' : 'Acessar Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}