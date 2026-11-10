import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Shield,
  HeartHandshake,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sun,
  Moon,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import { useTheme } from '../context/ThemeContext';
import { INFO_NIVEIS_ACESSO } from '../utils/authUtils';

export const LoginScreen: React.FC = () => {
  const { login, quickSwitchUser, usuarios } = useAuth();
  const { state } = useClinic();
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const result = await login(username, password, remember);
      if (!result.success) {
        setErrorMsg(result.message || 'Falha ao autenticar.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado ao efetuar login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userLogin: string, defaultPass: string) => {
    setUsername(userLogin);
    setPassword(defaultPass);
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const result = await login(userLogin, defaultPass, true);
      if (!result.success) {
        // Tenta switch direto caso senha tenha sido alterada
        const switched = await quickSwitchUser(userLogin);
        if (!switched) {
          setErrorMsg(result.message || 'Credenciais inválidas.');
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao realizar login rápido.');
    } finally {
      setIsLoading(false);
    }
  };

  const clinicaNome = state.configuracoes?.nomeClinica || 'Ninho Aprendiz';
  const clinicaProfissional = state.configuracoes?.profissional || 'Ester Lopes';

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      {/* Top Bar with Theme Toggle */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo_ninho.jpg"
            alt="Logo Ninho"
            className="w-9 h-9 rounded-xl object-cover bg-white p-0.5 shadow-md shadow-emerald-950/20 border border-emerald-500/30 flex-shrink-0"
          />
          <div>
            <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
              {clinicaNome}
            </span>
            <span className="hidden sm:inline text-[11px] text-stone-500 dark:text-stone-400 ml-2">
              • Gestão Psicopedagógica Segura
            </span>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          title="Alternar tema claro/escuro"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
        </button>
      </div>

      {/* Main Login Card Center */}
      <div className="max-w-md w-full mx-auto my-6 sm:my-10">
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden">
          {/* Card Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-b from-emerald-50/70 to-transparent dark:from-emerald-950/30 dark:to-transparent border-b border-stone-100 dark:border-stone-800/80 text-center">
            <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-lg shadow-emerald-900/20 mb-3 border border-emerald-500/30 bg-white p-1">
              <img src="/logo_ninho.jpg" alt="Logo Ninho" className="w-full h-full object-cover rounded-xl" />
            </div>
            <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              Acesso ao Sistema
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xs mx-auto">
              Controle de acesso seguro por perfil profissional e proteção de prontuários clínicos
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Username / Email Field */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Usuário ou E-mail:
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: admin ou seu.email@clinica.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  Senha de Acesso:
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Checkbox */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-stone-600 dark:text-stone-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Lembrar login neste navegador</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Validando acesso...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Access Chips */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Perfis de Acesso Rápidos:
                </span>
                <span className="text-[10px] text-stone-400">Clique para testar</span>
              </div>

              <div className="space-y-1.5">
                {usuarios.map((u) => {
                  const nivelInfo = INFO_NIVEIS_ACESSO[u.nivelAcesso] || INFO_NIVEIS_ACESSO.estagiario;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickLogin(u.username, u.senha)}
                      className="w-full p-2 rounded-xl bg-stone-50 hover:bg-emerald-50 dark:bg-stone-800/50 dark:hover:bg-emerald-950/30 border border-stone-200/80 hover:border-emerald-300 dark:border-stone-700/60 dark:hover:border-emerald-800 flex items-center justify-between transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{nivelInfo.icone}</span>
                        <div>
                          <p className="text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                            {u.nome}
                          </p>
                          <p className="text-[10px] text-stone-500 dark:text-stone-400">
                            login: <code className="font-mono font-bold text-stone-700 dark:text-stone-300">{u.username}</code> • senha: <code className="font-mono">{u.senha}</code>
                          </p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${nivelInfo.badgeBg} ${nivelInfo.badgeText} ${nivelInfo.badgeBorder}`}>
                        {nivelInfo.nome.split('/')[0].trim()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-md w-full mx-auto text-center text-[11px] text-stone-400 dark:text-stone-500">
        <p>
          Sistema de Gestão Psicopedagógica com Níveis de Acesso e Sigilo Clínico
        </p>
        <p className="mt-0.5">
          Conforme diretrizes éticas e de privacidade de dados em saúde e educação
        </p>
      </div>
    </div>
  );
};
