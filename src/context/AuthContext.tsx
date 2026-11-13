import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UsuarioSistema, NivelAcesso, PermissoesPerfil, TabType } from '../types';
import { useClinic } from './ClinicContext';
import { PERMISSOES_POR_NIVEL, DEFAULT_USUARIOS_SISTEMA, verificarAcessoAba } from '../utils/authUtils';

interface AuthContextType {
  currentUser: UsuarioSistema | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  quickSwitchUser: (username: string) => Promise<boolean>;
  hasPermission: (permission: keyof PermissoesPerfil) => boolean;
  canAccessTab: (tab: TabType) => boolean;
  usuarios: UsuarioSistema[];
  exigirLogin: boolean;
  setExigirLogin: (exigir: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'ninho_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, updateUsuario, updateConfigSeguranca, forcarSincronizacao, recarregarDaNuvem } = useClinic();
  const usuarios = state.usuarios && state.usuarios.length > 0 ? state.usuarios : DEFAULT_USUARIOS_SISTEMA;
  const exigirLogin = state.configuracoes?.seguranca?.exigirLogin ?? true;

  const [currentUser, setCurrentUser] = useState<UsuarioSistema | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate if user exists in current users list
        const match = usuarios.find(u => u.id === parsed.id || u.username === parsed.username);
        if (match && match.ativo) {
          return match;
        }
      }
    } catch (e) {
      console.warn('Error reading auth session from storage', e);
    }
    // If login is NOT required, default to the first admin
    if (!exigirLogin) {
      return usuarios.find(u => u.nivelAcesso === 'admin') || usuarios[0] || null;
    }
    return null;
  });

  // Keep currentUser in sync if updated in state
  useEffect(() => {
    if (currentUser) {
      const match = usuarios.find(u => u.id === currentUser.id);
      if (match) {
        if (!match.ativo) {
          // If deactivated, log out
          setCurrentUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          sessionStorage.removeItem(AUTH_STORAGE_KEY);
        } else if (JSON.stringify(match) !== JSON.stringify(currentUser)) {
          setCurrentUser(match);
          if (localStorage.getItem(AUTH_STORAGE_KEY)) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(match));
          } else if (sessionStorage.getItem(AUTH_STORAGE_KEY)) {
            sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(match));
          }
        }
      }
    } else if (!exigirLogin) {
      const defaultUser = usuarios.find(u => u.nivelAcesso === 'admin') || usuarios[0] || null;
      setCurrentUser(defaultUser);
    }
  }, [usuarios, exigirLogin]);

  // Login handler: lê os usuários mais recentes diretamente do MariaDB antes de validar
  const login = useCallback(
    async (
      usernameInput: string,
      passwordInput: string,
      remember: boolean = true
    ): Promise<{ success: boolean; message?: string }> => {
      const cleanUser = usernameInput.trim().toLowerCase();
      const cleanPass = passwordInput.trim();

      if (!cleanUser || !cleanPass) {
        return { success: false, message: 'Informe o usuário/e-mail e a senha.' };
      }

      const dbState = await recarregarDaNuvem();
      const listaUsuarios =
        dbState?.usuarios && dbState.usuarios.length > 0 ? dbState.usuarios : usuarios;

      const match = listaUsuarios.find(
        u =>
          (u.username.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanUser)) &&
          u.senha === cleanPass
      );

      if (!match) {
        return { success: false, message: 'Usuário ou senha incorretos. Verifique suas credenciais.' };
      }

      if (!match.ativo) {
        return { success: false, message: 'Esta conta de usuário está desativada no sistema. Contate a administração.' };
      }

      // Update last access timestamp in MariaDB
      const agora = new Date().toISOString();
      await updateUsuario(match.id, { ultimoAcesso: agora });

      const updatedUser = { ...match, ultimoAcesso: agora };
      setCurrentUser(updatedUser);

      if (remember) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }

      return { success: true };
    },
    [usuarios, updateUsuario, recarregarDaNuvem]
  );

  // Quick switch for testing / dev / demo convenience (reads latest users from MariaDB)
  const quickSwitchUser = useCallback(
    async (username: string): Promise<boolean> => {
      const dbState = await recarregarDaNuvem();
      const listaUsuarios =
        dbState?.usuarios && dbState.usuarios.length > 0 ? dbState.usuarios : usuarios;
      const match = listaUsuarios.find(u => u.username.toLowerCase() === username.toLowerCase() && u.ativo);
      if (match) {
        const agora = new Date().toISOString();
        await updateUsuario(match.id, { ultimoAcesso: agora });
        const updated = { ...match, ultimoAcesso: agora };
        setCurrentUser(updated);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        return true;
      }
      return false;
    },
    [usuarios, updateUsuario, recarregarDaNuvem]
  );

  // Logout handler (preserva syncCode e garante flush no MariaDB antes de sair)
  const logout = useCallback(async () => {
    await forcarSincronizacao().catch(() => {});
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }, [forcarSincronizacao]);

  // Permission check
  const hasPermission = useCallback(
    (permissionKey: keyof PermissoesPerfil): boolean => {
      if (!currentUser) return false;
      const nivel = currentUser.nivelAcesso || 'estagiario';
      const perms = PERMISSOES_POR_NIVEL[nivel];
      return perms ? perms[permissionKey] : false;
    },
    [currentUser]
  );

  // Tab check
  const canAccessTab = useCallback(
    (tab: TabType): boolean => {
      if (!currentUser) return false;
      return verificarAcessoAba(tab, currentUser.nivelAcesso);
    },
    [currentUser]
  );

  const setExigirLogin = async (exigir: boolean) => {
    await updateConfigSeguranca({ exigirLogin: exigir });
  };

  const isAuthenticated = !exigirLogin || currentUser !== null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        logout,
        quickSwitchUser,
        hasPermission,
        canAccessTab,
        usuarios,
        exigirLogin,
        setExigirLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
