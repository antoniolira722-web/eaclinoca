import React, { useState } from 'react';
import {
  BellRing,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Smartphone,
  Trash2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  X,
  Sparkles,
  Check
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { Lembrete, PrioridadeLembrete, TabType } from '../types';
import { formatarData } from '../utils/dateUtils';

interface LembretesNotificacoesViewProps {
  setActiveTab: (tab: TabType) => void;
}

export const LembretesNotificacoesView: React.FC<LembretesNotificacoesViewProps> = ({
  setActiveTab
}) => {
  const {
    state,
    addLembrete,
    toggleLembrete,
    deleteLembrete,
    marcarNotificacaoLida,
    marcarTodasNotificacoesLidas,
    limparNotificacoes,
    adicionarNotificacao,
    solicitarPermissaoNavegador,
    updateConfiguracoes
  } = useClinic();

  const [activeSubTab, setActiveSubTab] = useState<'lembretes' | 'historico' | 'preferencias'>('lembretes');
  const [filterPrioridade, setFilterPrioridade] = useState<string>('Todas');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitulo, setFormTitulo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formData, setFormData] = useState(new Date().toISOString().slice(0, 10));
  const [formHora, setFormHora] = useState('09:00');
  const [formPacienteId, setFormPacienteId] = useState('');
  const [formPrioridade, setFormPrioridade] = useState<PrioridadeLembrete>('Média');

  const getPaciente = (id?: string) => id ? state.pacientes.find(p => p.id === id) : null;

  const handleSaveLembrete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim() || !formData) return;

    await addLembrete({
      titulo: formTitulo.trim(),
      descricao: formDescricao.trim(),
      data: formData,
      hora: formHora,
      pacienteId: formPacienteId || undefined,
      prioridade: formPrioridade
    });

    setFormTitulo('');
    setFormDescricao('');
    setIsModalOpen(false);
  };

  const handleTestNotification = () => {
    adicionarNotificacao({
      tipo: 'sistema',
      titulo: '🔔 Notificação Personalizada de Teste',
      mensagem: 'Suas notificações em tempo real e modo escuro estão funcionando perfeitamente!',
      linkTab: 'painel'
    });
  };

  const lembretesPendentes = state.lembretes.filter(l => {
    if (filterPrioridade !== 'Todas' && l.prioridade !== filterPrioridade) return false;
    return !l.concluido;
  }).sort((a, b) => (a.data + (a.hora || '')).localeCompare(b.data + (b.hora || '')));

  const lembretesConcluidos = state.lembretes.filter(l => l.concluido);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <BellRing className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            Lembretes & Notificações Personalizadas
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Alertas automáticos de sessões, reavaliações, financeiro e lembretes da rotina clínica
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestNotification}
            className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Testar Alerta</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lembrete</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('lembretes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeSubTab === 'lembretes'
              ? 'bg-rose-600 text-white'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          Lembretes Ativos ({lembretesPendentes.length})
        </button>
        <button
          onClick={() => setActiveSubTab('historico')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeSubTab === 'historico'
              ? 'bg-rose-600 text-white'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          Histórico de Alertas ({state.notificacoes.length})
        </button>
        <button
          onClick={() => setActiveSubTab('preferencias')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeSubTab === 'preferencias'
              ? 'bg-rose-600 text-white'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          Preferências de Alerta
        </button>
      </div>

      {/* TAB 1: Lembretes */}
      {activeSubTab === 'lembretes' && (
        <div className="space-y-6">
          {/* Priority filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium">Filtrar por prioridade:</span>
            {['Todas', 'Alta', 'Média', 'Baixa'].map((prio) => (
              <button
                key={prio}
                onClick={() => setFilterPrioridade(prio)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterPrioridade === prio
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                {prio}
              </button>
            ))}
          </div>

          {/* Active reminders */}
          {lembretesPendentes.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
              <h3 className="text-base font-bold text-stone-700 dark:text-stone-200">
                Nenhum lembrete pendente
              </h3>
              <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                Crie lembretes para reuniões escolares, envios de questionários ou contato com famílias.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Criar Lembrete
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {lembretesPendentes.map((lem) => {
                const p = getPaciente(lem.pacienteId);
                return (
                  <div
                    key={lem.id}
                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-xs hover:border-rose-500/40 transition-all flex items-start gap-3.5"
                  >
                    <input
                      type="checkbox"
                      checked={lem.concluido}
                      onChange={() => toggleLembrete(lem.id)}
                      className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {lem.titulo}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            lem.prioridade === 'Alta'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : lem.prioridade === 'Média'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                          }`}
                        >
                          {lem.prioridade}
                        </span>
                      </div>

                      {lem.descricao && (
                        <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                          {lem.descricao}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-3 text-xs text-stone-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatarData(lem.data)} {lem.hora ? `às ${lem.hora}` : ''}
                        </span>
                        {p && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            Paciente: {p.nome}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteLembrete(lem.id)}
                      className="text-stone-300 hover:text-rose-600 p-1"
                      title="Excluir lembrete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Completed Reminders */}
          {lembretesConcluidos.length > 0 && (
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                Concluídos ({lembretesConcluidos.length})
              </h3>
              <div className="space-y-2">
                {lembretesConcluidos.map((lem) => (
                  <div
                    key={lem.id}
                    className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={lem.concluido}
                        onChange={() => toggleLembrete(lem.id)}
                        className="rounded text-emerald-600 cursor-pointer"
                      />
                      <span className="text-xs font-medium line-through text-stone-700 dark:text-stone-300">
                        {lem.titulo} ({formatarData(lem.data)})
                      </span>
                    </div>
                    <button
                      onClick={() => deleteLembrete(lem.id)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Histórico de Notificações */}
      {activeSubTab === 'historico' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Registro de Alertas do Sistema
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={marcarTodasNotificacoesLidas}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Marcar todas como lidas
              </button>
              <button
                onClick={limparNotificacoes}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Limpar histórico
              </button>
            </div>
          </div>

          {state.notificacoes.length === 0 ? (
            <p className="text-center text-xs text-stone-400 py-8">
              Nenhuma notificação no histórico.
            </p>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {state.notificacoes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    marcarNotificacaoLida(n.id);
                    if (n.linkTab) setActiveTab(n.linkTab);
                  }}
                  className={`py-3.5 px-2 flex items-start justify-between gap-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/40 rounded-xl transition-colors ${
                    !n.lida ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                        !n.lida ? 'bg-emerald-500' : 'bg-transparent'
                      }`}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {n.titulo}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                        {n.mensagem}
                      </p>
                      <span className="text-[10px] text-stone-400 mt-1 block">
                        {new Date(n.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {n.linkTab && (
                    <span className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Preferências */}
      {activeSubTab === 'preferencias' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-6 max-w-2xl">
          <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
            Configurações de Notificações
          </h3>

          <div className="space-y-4">
            {/* Browser Push */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Notificações do Navegador / Web Push
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Receba avisos instantâneos mesmo com a aba em segundo plano.
                  </p>
                </div>
              </div>

              <button
                onClick={async () => {
                  const granted = await solicitarPermissaoNavegador();
                  if (!granted) {
                    alert('Permissão de notificação negada ou não suportada no navegador.');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  state.configuracoes.notificacoesNavegador
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {state.configuracoes.notificacoesNavegador ? 'Ativado ✓' : 'Habilitar'}
              </button>
            </div>

            {/* Sound Chimes */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-purple-600" />
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Sons e Alertas Sonoros Suaves
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Tocar aviso sonoro discreto ao registrar lembretes e sessões.
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={state.configuracoes.lembretesSonoros}
                onChange={(e) => updateConfiguracoes({ lembretesSonoros: e.target.checked })}
                className="rounded text-emerald-600 w-5 h-5 cursor-pointer"
              />
            </div>

            {/* General in-app notifications */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Alertas Automáticos de Reavaliação e Financeiro
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Monitoramento contínuo de planos a vencer e pagamentos pendentes.
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={state.configuracoes.notificacoesAtivas}
                onChange={(e) => updateConfiguracoes({ notificacoesAtivas: e.target.checked })}
                className="rounded text-emerald-600 w-5 h-5 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* New Reminder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Criar Novo Lembrete Personalizado
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLembrete} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Título do Lembrete *
                </label>
                <input
                  type="text"
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ex: Ligar para a coordenadora pedagógica do Lucas"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Descrição complementar
                </label>
                <textarea
                  rows={2}
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Detalhes ou encaminhamentos a lembrar..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Data do Alerta *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={formHora}
                    onChange={(e) => setFormHora(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Vincular a Paciente
                  </label>
                  <select
                    value={formPacienteId}
                    onChange={(e) => setFormPacienteId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value="">Nenhum (Lembrete geral)</option>
                    {state.pacientes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={formPrioridade}
                    onChange={(e) => setFormPrioridade(e.target.value as PrioridadeLembrete)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value="Alta">Alta (Urgente)</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs"
                >
                  Salvar Lembrete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
