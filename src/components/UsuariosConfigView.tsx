import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  AlertCircle,
  Save,
  Check,
  X,
  Eye,
  EyeOff,
  UserCheck,
  ShieldAlert,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { UsuarioSistema, NivelAcesso } from '../types';
import { INFO_NIVEIS_ACESSO, PERMISSOES_POR_NIVEL } from '../utils/authUtils';

export const UsuariosConfigView: React.FC = () => {
  const { state, addUsuario, updateUsuario, deleteUsuario, resetSenhaUsuario, updateConfigSeguranca } = useClinic();
  const { currentUser, exigirLogin, setExigirLogin, quickSwitchUser } = useAuth();

  const usuarios = state.usuarios && state.usuarios.length > 0 ? state.usuarios : [];

  // Modal State for New / Edit User
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSenha, setFormSenha] = useState('');
  const [formCargo, setFormCargo] = useState('');
  const [formNivel, setFormNivel] = useState<NivelAcesso>('psicopedagogo');
  const [formAtivo, setFormAtivo] = useState(true);
  const [showSenhaInput, setShowSenhaInput] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal State for Password Reset
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<UsuarioSistema | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Feedback toast helper
  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setFormNome('');
    setFormUsername('');
    setFormEmail('');
    setFormSenha('');
    setFormCargo('Psicopedagoga Clínica');
    setFormNivel('psicopedagogo');
    setFormAtivo(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: UsuarioSistema) => {
    setEditingUserId(u.id);
    setFormNome(u.nome);
    setFormUsername(u.username);
    setFormEmail(u.email || '');
    setFormSenha(u.senha);
    setFormCargo(u.cargo);
    setFormNivel(u.nivelAcesso);
    setFormAtivo(u.ativo);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = formUsername.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (!cleanUsername) {
      setFormError('Informe um nome de usuário válido (sem espaços).');
      return;
    }

    if (!formNome.trim()) {
      setFormError('Informe o nome completo do profissional.');
      return;
    }

    if (!formSenha.trim()) {
      setFormError('Informe uma senha para o usuário.');
      return;
    }

    // Check duplicate username
    const duplicate = usuarios.find(
      u => u.username.toLowerCase() === cleanUsername && u.id !== editingUserId
    );
    if (duplicate) {
      setFormError(`O nome de usuário "${cleanUsername}" já está em uso.`);
      return;
    }

    try {
      if (editingUserId) {
        await updateUsuario(editingUserId, {
          nome: formNome.trim(),
          username: cleanUsername,
          email: formEmail.trim() || undefined,
          senha: formSenha.trim(),
          cargo: formCargo.trim() || 'Profissional',
          nivelAcesso: formNivel,
          ativo: formAtivo
        });
        triggerToast('Usuário atualizado com sucesso!');
      } else {
        await addUsuario({
          nome: formNome.trim(),
          username: cleanUsername,
          email: formEmail.trim() || undefined,
          senha: formSenha.trim(),
          cargo: formCargo.trim() || 'Profissional',
          nivelAcesso: formNivel,
          ativo: formAtivo,
          avatarColor:
            formNivel === 'admin'
              ? 'bg-rose-600'
              : formNivel === 'psicopedagogo'
              ? 'bg-emerald-600'
              : formNivel === 'recepcao'
              ? 'bg-blue-600'
              : 'bg-amber-600'
        });
        triggerToast('Novo usuário cadastrado com sucesso!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar usuário.');
    }
  };

  const handleDeleteUser = async (u: UsuarioSistema) => {
    if (u.id === currentUser?.id) {
      alert('Você não pode excluir sua própria conta atualmente conectada.');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o usuário "${u.nome}" (${u.username})?`)) {
      try {
        await deleteUsuario(u.id);
        triggerToast('Usuário removido do sistema.');
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir usuário.');
      }
    }
  };

  const handleOpenResetPassword = (u: UsuarioSistema) => {
    setResetTargetUser(u);
    setNovaSenha('');
    setShowNovaSenha(false);
    setIsResetModalOpen(true);
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !novaSenha.trim()) return;

    try {
      await resetSenhaUsuario(resetTargetUser.id, novaSenha.trim());
      triggerToast(`Senha do usuário ${resetTargetUser.username} alterada com sucesso!`);
      setIsResetModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar senha.');
    }
  };

  const permissoesLabels: { key: keyof typeof PERMISSOES_POR_NIVEL.admin; label: string; desc: string }[] = [
    { key: 'verPainel', label: 'Painel Geral & Métricas', desc: 'Resumos e atalhos rápidos' },
    { key: 'verPacientes', label: 'Listar Pacientes', desc: 'Visualização da lista geral' },
    { key: 'gerenciarPacientes', label: 'Criar / Editar Pacientes', desc: 'Adicionar e alterar fichas' },
    { key: 'verAnamneseCompleta', label: 'Anamnese & Queixas Clínicas', desc: 'Dados e relatórios sigilosos' },
    { key: 'verAgenda', label: 'Ver Agenda', desc: 'Consultar horários e sessões' },
    { key: 'gerenciarAgenda', label: 'Gerenciar Agenda', desc: 'Marcar, confirmar e cancelar' },
    { key: 'verSessoes', label: 'Consultar Sessões Clínicas', desc: 'Evoluções anteriores' },
    { key: 'gerenciarSessoes', label: 'Registrar Novas Sessões', desc: 'Preencher prontuário clínico' },
    { key: 'verPlanosPEI', label: 'Consultar Planos PEI', desc: 'Metas e estratégias' },
    { key: 'gerenciarPlanosPEI', label: 'Criar / Editar Planos PEI', desc: 'Elaboração de intervenção' },
    { key: 'verFinanceiro', label: 'Módulo Financeiro', desc: 'Consultar faturamento e pagamentos' },
    { key: 'gerenciarFinanceiro', label: 'Lançamentos Financeiros', desc: 'Baixar e criar cobranças' },
    { key: 'verRelatoriosLaudos', label: 'Ver Relatórios & Laudos', desc: 'Visualizar e exportar PDF' },
    { key: 'gerenciarRelatoriosLaudos', label: 'Emitir / Editar Laudos', desc: 'Criação e diagnóstico' },
    { key: 'verLembretes', label: 'Lembretes & Tarefas', desc: 'Avisos da equipe' },
    { key: 'gerenciarConfiguracoes', label: 'Configurações da Clínica', desc: 'Personalizar dados e papel timbrado' },
    { key: 'gerenciarUsuarios', label: 'Gestão de Usuários & Níveis', desc: 'Criar contas e alterar permissões' }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-stone-900 text-white border border-stone-700 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
              Usuários e Níveis de Acesso
            </h3>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xl">
            Gerencie as contas da equipe psicopedagógica, controle quem tem acesso a prontuários sigilosos, módulo financeiro e emissão de laudos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-emerald-950/20 cursor-pointer transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Security Switch Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
              Exigir Login e Senha para Entrar no Sistema
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Quando ativado, o sistema bloqueia a visualização e exige autenticação individual com usuário e senha para cada profissional.
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={exigirLogin}
            onChange={(e) => {
              setExigirLogin(e.target.checked);
              triggerToast(
                e.target.checked
                  ? 'Proteção com login e senha ATIVADA.'
                  : 'Proteção desativada (Modo aberto).'
              );
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-stone-600 peer-checked:bg-emerald-600"></div>
          <span className="ml-2.5 text-xs font-bold text-stone-700 dark:text-stone-300">
            {exigirLogin ? 'Ativado' : 'Desativado'}
          </span>
        </label>
      </div>

      {/* Users List Table / Cards */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-stone-500" />
            <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
              Usuários Cadastrados ({usuarios.length})
            </h4>
          </div>
          <span className="text-[11px] text-stone-400">
            Você está conectado como: <strong className="text-stone-800 dark:text-stone-200">{currentUser?.nome}</strong>
          </span>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
          {usuarios.map((u) => {
            const nivelInfo = INFO_NIVEIS_ACESSO[u.nivelAcesso] || INFO_NIVEIS_ACESSO.estagiario;
            const isMe = u.id === currentUser?.id;

            return (
              <div
                key={u.id}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  !u.ativo ? 'opacity-60 bg-stone-50/50 dark:bg-stone-950/30' : 'hover:bg-stone-50/70 dark:hover:bg-stone-800/30'
                }`}
              >
                {/* Left: Avatar and Names */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl ${
                      u.avatarColor || 'bg-emerald-600'
                    } text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0`}
                  >
                    {u.nome.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {u.nome}
                      </span>
                      {isMe && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Sua Conta
                        </span>
                      )}
                      {!u.ativo && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          Inativo
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{u.cargo}</span>
                      <span>•</span>
                      <span>
                        Usuário: <code className="font-mono text-stone-700 dark:text-stone-300 font-semibold">{u.username}</code>
                      </span>
                      {u.email && (
                        <>
                          <span>•</span>
                          <span>{u.email}</span>
                        </>
                      )}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${nivelInfo.badgeBg} ${nivelInfo.badgeText} ${nivelInfo.badgeBorder}`}
                      >
                        <span>{nivelInfo.icone}</span>
                        <span>{nivelInfo.nome}</span>
                      </span>

                      {u.ultimoAcesso && (
                        <span className="text-[10px] text-stone-400">
                          Último acesso: {new Date(u.ultimoAcesso).toLocaleDateString('pt-BR')} às {new Date(u.ultimoAcesso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {!isMe && (
                    <button
                      onClick={() => quickSwitchUser(u.username)}
                      className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Alternar para esta conta para testar permissões"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Simular Acesso</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenResetPassword(u)}
                    className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                    title="Alterar / Redefinir Senha"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                    title="Editar Usuário"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {!isMe && (
                    <button
                      onClick={() => handleDeleteUser(u)}
                      className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                      title="Excluir Usuário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions Matrix breakdown */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Matriz de Permissões por Nível de Acesso</span>
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Tabela de autorizações de cada perfil de usuário no sistema
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300">
                <th className="p-3.5 font-bold">Módulo / Recurso</th>
                <th className="p-3.5 font-bold text-center">
                  <div className="flex flex-col items-center">
                    <span>👑 Admin</span>
                    <span className="text-[10px] text-stone-400 font-normal">Acesso Total</span>
                  </div>
                </th>
                <th className="p-3.5 font-bold text-center">
                  <div className="flex flex-col items-center">
                    <span>🩺 Psicopedagogo</span>
                    <span className="text-[10px] text-stone-400 font-normal">Clínico Completo</span>
                  </div>
                </th>
                <th className="p-3.5 font-bold text-center">
                  <div className="flex flex-col items-center">
                    <span>📋 Recepção</span>
                    <span className="text-[10px] text-stone-400 font-normal">Agenda & Contato</span>
                  </div>
                </th>
                <th className="p-3.5 font-bold text-center">
                  <div className="flex flex-col items-center">
                    <span>🎓 Estagiário</span>
                    <span className="text-[10px] text-stone-400 font-normal">Supervisionado</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {permissoesLabels.map((perm) => {
                return (
                  <tr key={perm.key} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20">
                    <td className="p-3.5">
                      <div className="font-semibold text-stone-900 dark:text-stone-100">
                        {perm.label}
                      </div>
                      <div className="text-[10px] text-stone-400">{perm.desc}</div>
                    </td>
                    {(['admin', 'psicopedagogo', 'recepcao', 'estagiario'] as NivelAcesso[]).map((niv) => {
                      const permitido = PERMISSOES_POR_NIVEL[niv][perm.key];
                      return (
                        <td key={niv} className="p-3.5 text-center">
                          {permitido ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-bold">
                              ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400">
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {editingUserId ? 'Editar Usuário do Sistema' : 'Cadastrar Novo Usuário'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Nome Completo: *
                </label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="ex: Ester Lopes"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Login / Usuário: *
                  </label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="ex: ester.lopes"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    E-mail (opcional):
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="ex: ester@eaclinica.com"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Cargo / Especialidade:
                  </label>
                  <input
                    type="text"
                    value={formCargo}
                    onChange={(e) => setFormCargo(e.target.value)}
                    placeholder="ex: Psicopedagoga Clínica"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Nível de Acesso (Perfil): *
                  </label>
                  <select
                    value={formNivel}
                    onChange={(e) => setFormNivel(e.target.value as NivelAcesso)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                  >
                    <option value="admin">👑 Administrador (Acesso Total)</option>
                    <option value="psicopedagogo">🩺 Psicopedagogo (Clínico)</option>
                    <option value="recepcao">📋 Recepção / Secretaria</option>
                    <option value="estagiario">🎓 Estagiário / Assistente</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Senha de Acesso: *
                </label>
                <div className="relative">
                  <input
                    type={showSenhaInput ? 'text' : 'password'}
                    required
                    value={formSenha}
                    onChange={(e) => setFormSenha(e.target.value)}
                    placeholder="Digite a senha"
                    className="w-full pl-3 pr-10 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenhaInput(!showSenhaInput)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showSenhaInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formAtivo}
                    onChange={(e) => setFormAtivo(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-stone-700 dark:text-stone-300">
                    Usuário ativo no sistema
                  </span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-sm shadow-emerald-950/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Usuário</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {isResetModalOpen && resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Alterar Senha de {resetTargetUser.nome}
                </h3>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="p-5 space-y-4 text-xs">
              <p className="text-stone-500 dark:text-stone-400">
                Defina uma nova senha para o usuário <strong className="text-stone-800 dark:text-stone-200">{resetTargetUser.username}</strong>:
              </p>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Nova Senha: *
                </label>
                <div className="relative">
                  <input
                    type={showNovaSenha ? 'text' : 'password'}
                    required
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Digite a nova senha"
                    className="w-full pl-3 pr-10 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNovaSenha(!showNovaSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-sm cursor-pointer"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
