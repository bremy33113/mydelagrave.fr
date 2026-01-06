import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { supabase, isUsingMock } from '../lib/supabase';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setError(signInError.message);
                return;
            }

            navigate('/');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const demoAccounts = [
        { email: 'admin@delagrave.fr', password: 'admin123', role: 'Admin' },
        { email: 'jean.dupont@delagrave.fr', password: 'password123', role: "Chargé d'Affaires" },
        { email: 'marie.martin@delagrave.fr', password: 'password123', role: 'Superviseur' },
        { email: 'pierre.durand@delagrave.fr', password: 'password123', role: 'Poseur' },
    ];

    const fillDemoAccount = (demoEmail: string, demoPassword: string) => {
        setEmail(demoEmail);
        setPassword(demoPassword);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8 animate-fadeIn">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-xl">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">MyDelagrave</h1>
                    <p className="text-slate-400 mt-2">Connexion à votre espace</p>
                </div>

                {/* Login Card */}
                <div className="glass-card p-8 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error message */}
                        {error && (
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Email field */}
                        <div>
                            <label htmlFor="email" className="input-label">
                                Adresse email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field pl-12"
                                    placeholder="votre@email.fr"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div>
                            <label htmlFor="password" className="input-label">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-12"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Connexion...
                                </>
                            ) : (
                                'Se connecter'
                            )}
                        </button>
                    </form>
                </div>

                {/* Demo accounts - uniquement en mode dev */}
                {isUsingMock && (
                    <div
                        className="mt-6 glass-card p-4 animate-fadeIn"
                        style={{ animationDelay: '0.2s' }}
                    >
                        <p className="text-sm text-slate-400 mb-3 text-center">
                            Comptes de démonstration
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {demoAccounts.map((account) => (
                                <button
                                    key={account.email}
                                    onClick={() => fillDemoAccount(account.email, account.password)}
                                    className="p-2 text-left rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                                >
                                    <p className="text-xs font-medium text-white">{account.role}</p>
                                    <p className="text-xs text-slate-400 truncate">{account.email}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Version */}
                <p className="text-center text-xs text-slate-500 mt-6">
                    Version 2.1.0 {isUsingMock ? '(Mode Dev)' : '(Production)'}
                </p>
            </div>
        </div>
    );
}
