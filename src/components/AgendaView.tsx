import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  MessageCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Filter,
  ArrowRight,
  FileText,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { AgendaItem, TipoAgendamento, StatusAgendamento, TabType } from '../types';
import { formatarData } from '../utils/dateUtils';

interface AgendaViewProps {
  setActiveTab: (tab: TabType) => void;
  onOpenNewSessionWithPatient?: (pacienteId: string) => void;
  initialPatientId?: string | null;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  setActiveTab,
  onOpenNewSessionWithPatient,
  initialPatientId
}) => {
  const { state, addAgendaItem, updateAgendaItem, deleteAgendaItem } = useClinic();

  const hojeStr = new Date().toISOString().slice(0, 10);
  const [selectedDateFilter, setSelectedDateFilter] = useState<'hoje' | 'todos' | 'custom'>('hoje');
  const [customDate, setCustomDate] = useState(hojeStr);
  const [typeFilter, setTypeFilter] = useState<string>('Todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);

  // Form State
  const [formPacienteId, setFormPacienteId] = useState(initialPatientId || (state.pacientes[0]?.id || ''));
  const [formData, setFormData] = useState(hojeStr);
  const [formHora, setFormHora] = useState('14:00');
  const [formTipo, setFormTipo] = useState<TipoAgendamento>('Sessão');
  const [formProf, setFormProf] = useState(state.configuracoes.profissional || 'Ester Lopes');
  const [formDuracao, setFormDuracao] = useState(50);
  const [formStatus, setFormStatus] = useState<StatusAgendamento>('Confirmado');
  const [formNotas, setFormNotas] = useState('');

  const getPaciente = (id: string) => state.pacientes.find(p => p.id === id);

  const openNewModal = (pacienteId?: string) => {
    setEditingItem(null);
    setFormPacienteId(pacienteId || state.pacientes[0]?.id || '');
    setFormData(selectedDateFilter === 'custom' ? customDate : hojeStr);
    setFormHora('14:00');
    setFormTipo('Sessão');
    setFormProf(state.configuracoes.profissional || 'Ester Lopes');
    setFormDuracao(50);
    setFormStatus('Confirmado');
    setFormNotas('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: AgendaItem) => {
    setEditingItem(item);
    setFormPacienteId(item.pacienteId);
    setFormData(item.data);
    setFormHora(item.hora);
    setFormTipo(item.tipo);
    setFormProf(item.prof);
    setFormDuracao(item.duracao || 50);
    setFormStatus(item.status);
    setFormNotas(item.notas || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPacienteId || !formData || !formHora) return;

    const payload = {
      pacienteId: formPacienteId,
      data: formData,
      hora: formHora,
      tipo: formTipo,
      prof: formProf,
      duracao: Number(formDuracao) || 50,
      status: formStatus,
      notas: formNotas.trim()
    };

    if (editingItem) {
      await updateAgendaItem(editingItem.id, payload);
    } else {
      await addAgendaItem(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja cancelar/excluir este agendamento?')) {
      await deleteAgendaItem(id);
    }
  };

  const handleSendWhatsApp = (telefone?: string, pacienteNome?: string, data?: string, hora?: string) => {
    if (!telefone) return;
    const numeroLimpo = telefone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá! Lembramos que ${pacienteNome || 'seu filho(a)'} tem atendimento psicopedagógico agendado para o dia ${formatarData(data)} às ${hora} na clínica ${state.configuracoes.nomeClinica}. Por favor, confirme o comparecimento.`
    );
    window.open(`https://wa.me/55${numeroLimpo}?text=${msg}`, '_blank');
  };

  // Filtering
  const filteredAgenda = state.agenda.filter((ag) => {
    if (selectedDateFilter === 'hoje' && ag.data !== hojeStr) return false;
    if (selectedDateFilter === 'custom' && ag.data !== customDate) return false;
    if (typeFilter !== 'Todos' && ag.tipo !== typeFilter) return false;
    return true;
  }).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Agenda Psicopedagógica
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Controle de sessões, avaliações, reuniões com escola e devolutivas
          </p>
        </div>

        <button
          onClick={() => openNewModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {/* Date & Type Filters */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedDateFilter('hoje')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedDateFilter === 'hoje'
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            Hoje ({state.agenda.filter(a => a.data === hojeStr).length})
          </button>
          <button
            onClick={() => setSelectedDateFilter('todos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedDateFilter === 'todos'
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            Todos os Agendamentos ({state.agenda.length})
          </button>
          <div className="flex items-center gap-1.5 pl-2 border-l border-stone-200 dark:border-stone-800">
            <span className="text-xs text-stone-500 font-medium">Por data:</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setSelectedDateFilter('custom');
              }}
              className="px-2 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>

        {/* Type selector */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs text-stone-500 font-medium">Tipo:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
          >
            <option value="Todos">Todos os tipos</option>
            <option value="Sessão">Sessão</option>
            <option value="Avaliação">Avaliação</option>
            <option value="Devolutiva">Devolutiva</option>
            <option value="Orientação familiar">Orientação familiar</option>
            <option value="Reunião escolar">Reunião escolar</option>
          </select>
        </div>
      </div>

      {/* Appointment Cards List */}
      {filteredAgenda.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-12 text-center">
          <CalendarIcon className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <h3 className="text-base font-bold text-stone-700 dark:text-stone-200">
            Nenhum agendamento encontrado
          </h3>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            {selectedDateFilter === 'hoje'
              ? 'Não há atendimentos marcados para a data de hoje.'
              : 'Nenhum agendamento corresponde aos filtros selecionados.'}
          </p>
          <button
            onClick={() => openNewModal()}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Agendar Atendimento
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAgenda.map((ag) => {
            const p = getPaciente(ag.pacienteId);
            return (
              <div
                key={ag.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-xs hover:border-emerald-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Time badge & patient data */}
                <div className="flex items-start gap-4">
                  <div className="px-3 py-2 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-center font-bold text-stone-900 dark:text-stone-100 flex-shrink-0 min-w-[70px]">
                    <span className="text-sm block">{ag.hora}</span>
                    <span className="text-[11px] text-stone-500 font-normal">
                      {ag.duracao} min
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-stone-900 dark:text-stone-100">
                        {p?.nome || 'Paciente não encontrado'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          ag.tipo === 'Avaliação'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : ag.tipo === 'Devolutiva'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : ag.tipo === 'Reunião escolar'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {ag.tipo}
                      </span>
                      <span className="text-xs text-stone-400">
                        Data: {formatarData(ag.data)}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 mt-1">
                      Resp: {p?.resp || '—'} {p?.fone ? `• ${p.fone}` : ''} • Profissional: {ag.prof}
                    </p>

                    {ag.notas && (
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-1.5 bg-stone-50 dark:bg-stone-800/60 p-2 rounded-xl border border-stone-200/60 dark:border-stone-800">
                        <strong>Nota:</strong> {ag.notas}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                  {p?.fone && (
                    <button
                      onClick={() => handleSendWhatsApp(p.fone, p.nome, ag.data, ag.hora)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Enviar lembrete via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Lembrar WhatsApp</span>
                    </button>
                  )}

                  {/* Quick Evolution trigger */}
                  <button
                    onClick={() => {
                      if (onOpenNewSessionWithPatient && p) {
                        onOpenNewSessionWithPatient(p.id);
                      } else {
                        setActiveTab('sessoes');
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center gap-1"
                    title="Registrar sessão clínica"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Evolução</span>
                  </button>

                  {/* Status Dropdown */}
                  <select
                    value={ag.status}
                    onChange={(e) =>
                      updateAgendaItem(ag.id, {
                        status: e.target.value as StatusAgendamento
                      })
                    }
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border focus:outline-none transition-colors ${
                      ag.status === 'Concluído'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                        : ag.status === 'Confirmado'
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300'
                        : ag.status === 'Cancelado' || ag.status === 'Faltou'
                        ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300'
                    }`}
                  >
                    <option value="Agendado">Agendado</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Faltou">Faltou</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>

                  <button
                    onClick={() => openEditModal(ag)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                    title="Editar agendamento"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(ag.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600"
                    title="Cancelar agendamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                {editingItem ? 'Editar Agendamento' : 'Novo Agendamento na Clínica'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Paciente *
                </label>
                <select
                  required
                  value={formPacienteId}
                  onChange={(e) => setFormPacienteId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                >
                  <option value="">Selecione um paciente...</option>
                  {state.pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} (Resp: {p.resp})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Data *
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
                    Horário *
                  </label>
                  <input
                    type="time"
                    required
                    value={formHora}
                    onChange={(e) => setFormHora(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Tipo de Atendimento
                  </label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as TipoAgendamento)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value="Sessão">Sessão Regular</option>
                    <option value="Avaliação">Avaliação Diagnóstica</option>
                    <option value="Devolutiva">Devolutiva</option>
                    <option value="Orientação familiar">Orientação familiar</option>
                    <option value="Reunião escolar">Reunião escolar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Duração (minutos)
                  </label>
                  <select
                    value={formDuracao}
                    onChange={(e) => setFormDuracao(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={50}>50 minutos (Padrão)</option>
                    <option value={60}>60 minutos</option>
                    <option value={90}>90 minutos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Profissional
                  </label>
                  <input
                    type="text"
                    value={formProf}
                    onChange={(e) => setFormProf(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as StatusAgendamento)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value="Confirmado">Confirmado</option>
                    <option value="Agendado">Agendado</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Notas / Observações prévias
                </label>
                <textarea
                  rows={2}
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  placeholder="Ex: Trazer jogo de memória fonológica, aplicar prova piagetiana..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs"
                >
                  {editingItem ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
