import React, { useState } from 'react';
import { supabaseClient } from '../lib/supabaseClient';

export const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setMessage('');
        const { error } = await supabaseClient.auth.signInWithOtp({ email });

        if (error) {
            setMessage(`Erro ao fazer login: ${error.message}`);
        } else {
            setMessage('Verifique seu e-mail para o link de acesso!');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-efemera-dark flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-efemera-gray p-8 rounded-xl shadow-2xl border border-efemera-light-gray">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-efemera-pink">EFÊMERA</h1>
                    <p className="text-gray-400 mt-2">Acesso ao Painel de Gestão</p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                            Seu E-mail
                        </label>
                        <input
                            id="email"
                            className="w-full mt-2 bg-efemera-light-gray border-2 border-efemera-light-gray rounded-lg p-3 focus:ring-efemera-pink focus:border-efemera-pink transition-colors"
                            type="email"
                            placeholder="seu.email@exemplo.com"
                            value={email}
                            required={true}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full px-6 py-3 rounded-lg bg-efemera-pink hover:bg-efemera-pink-dark transition-all duration-300 font-semibold shadow-lg shadow-efemera-pink/20 hover:shadow-efemera-pink/40 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {loading ? <span>Enviando...</span> : <span>Entrar com Link Mágico</span>}
                        </button>
                    </div>
                </form>

                {message && (
                    <p className="mt-6 text-center text-sm text-efemera-pink bg-efemera-pink/10 p-3 rounded-md border border-efemera-pink/30">
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
};
