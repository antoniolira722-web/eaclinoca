import React from 'react';
import {
  Users,
  Calendar,
  FileText,
  Target,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  MessageCircle,
  Sparkles,
  HeartHandshake,
  TrendingUp,
  AlertTriangle,
  FileBarChart
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { formatarMoeda, diasAteData, formatarData } from '../utils/dateUtils';
import { TabType, StatusAgendamento } from '../types';

interface DashboardViewProps {
  setActiveTab: (tab: TabType) => void;
  onOpenNewPatient?: () => void;
  onOpenNewAppointment?: () => void;
  onOpenNewSession?: (pacienteId?: string) => void;
  onOpenNewReminder?: () => void;
  onOpenNewFinance?: (pacienteId?: string) => void;
  onSelectPatient?: (pacienteId: string) => void;
  onOpenRelatorio?: (pacienteId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onOpenNewPatient = () => setActiveTab('pacientes'),
  onOpenNewAppointment = () => setActiveTab('agenda'),
  onOpenNewSession = () => setActiveTab('sessoes'),
  onOpenNewReminder = () => setActiveTab('lembretes'),
  onOpenNewFinance = () => setActiveTab('financeiro'),
  onSelectPatient = (_pacienteId?: string) => setActiveTab('pacientes'),
  onOpenRelatorio = () => setActiveTab('relatorio')
}) => {
  const { state, updateAgendaItem, marcarPago, toggleLembrete } = useClinic();

  const hojeStr = new Date().toISOString().slice(0, 10);
  const dataHojeFormatada = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Calculations
  const pacientesAtivos = state.pacientes.filter(p => p.status === 'Ativo').length;
  const atendimentosHoje = state.agenda.filter(a => a.data === hojeStr);
  const atendimentosHojeConcluidos = atendimentosHoje.filter(a => a.status === 'Concluído').length;

  const compAtual = hojeStr.slice(0, 7);
  const finMes = state.financeiro.filter(f => f.comp === compAtual);
  const totalMes = finMes.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  const recebidoMes = finMes.filter(f => f.status === 'Pago').reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  const atrasados = state.financeiro.filter(f => f.status === 'Atrasado');

  const planosAVencer = state.planos.filter(pl => {
    if (!pl.reav || pl.status === 'Concluído') return false;
    const dias = diasAteData(pl.reav);
    return dias >= 0 && dias <= 30;
  });

  const lembretesPendentes = state.lembretes.filter(l => !l.concluido);

  const getPaciente = (id: string) => state.pacientes.find(p => p.id === id);

  const handleSendWhatsApp = (telefone?: string, pacienteNome?: string, hora?: string) => {
    if (!telefone) return;
    const numeroLimpo = telefone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá! Aqui é da clínica ${state.configuracoes.nomeClinica}. Confirmamos a sessão psicopedagógica de ${pacienteNome || 'seu filho(a)'} hoje às ${hora}. Qualquer dúvida estamos à disposição!`
    );
    window.open(`https://wa.me/55${numeroLimpo}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-stone-900 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden border border-emerald-950">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-sm border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Painel Clínico Inteligente</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Olá, {state.configuracoes.profissional.split(' ')[0]} 👋
            </h1>
            <p className="text-stone-300 text-sm capitalize">
              {dataHojeFormatada}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              id="btn-quick-new-patient"
              onClick={onOpenNewPatient}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm shadow-emerald-950/50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Paciente</span>
            </button>
            <button
              id="btn-quick-new-appointment"
              onClick={onOpenNewAppointment}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/15 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar</span>
            </button>
            <button
              id="btn-quick-new-session"
              onClick={() => onOpenNewSession()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/15 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Evolução</span>
            </button>
            <button
              id="btn-quick-new-report"
              onClick={() => onOpenRelatorio()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/15 transition-all cursor-pointer"
            >
              <FileBarChart className="w-4 h-4" />
              <span>Laudo / Relatório</span>
            </button>
            <button
              id="btn-quick-new-reminder"
              onClick={onOpenNewReminder}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/15 transition-all cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Lembrete</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Pacientes */}
        <div
          onClick={() => setActiveTab('pacientes')}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Pacientes Ativos
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {pacientesAtivos}
            </span>
            <span className="text-xs text-stone-400">
              de {state.pacientes.length} total
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium group-hover:underline">
            Ver prontuários <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 2: Atendimentos Hoje */}
        <div
          onClick={() => setActiveTab('agenda')}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Agenda Hoje
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {atendimentosHoje.length}
            </span>
            <span className="text-xs text-stone-400">
              ({atendimentosHojeConcluidos} concluído{atendimentosHojeConcluidos !== 1 ? 's' : ''})
            </span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium group-hover:underline">
            Abrir agenda <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 3: Reavaliações & Planos */}
        <div
          onClick={() => setActiveTab('planos')}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Planos & Reavaliações
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {state.planos.length}
            </span>
            {planosAVencer.length > 0 ? (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {planosAVencer.length} a vencer
              </span>
            ) : (
              <span className="text-xs text-stone-400">em dia</span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-purple-600 dark:text-purple-400 flex items-center gap-1 font-medium group-hover:underline">
            Gerenciar PEI <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 4: Financeiro do Mês */}
        <div
          onClick={() => setActiveTab('financeiro')}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Financeiro ({compAtual})
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              {formatarMoeda(recebidoMes)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-stone-400">
            <span>Total: {formatarMoeda(totalMes)}</span>
            {atrasados.length > 0 && (
              <span className="text-rose-500 font-semibold">{atrasados.length} em atraso</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Atendimentos de Hoje + Alertas & Lembretes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Atendimentos de Hoje (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Atendimentos de Hoje
                </h2>
                <p className="text-xs text-stone-500">
                  {atendimentosHoje.length} agendamento{atendimentosHoje.length !== 1 ? 's' : ''} programado{atendimentosHoje.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('agenda')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Ver agenda completa <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {atendimentosHoje.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 p-6">
              <Calendar className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
              <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                Nenhum atendimento agendado para hoje.
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Aproveite para registrar evoluções pendentes ou planejar materiais.
              </p>
              <button
                onClick={onOpenNewAppointment}
                className="mt-4 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agendar Atendimento</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {atendimentosHoje
                .sort((a, b) => a.hora.localeCompare(b.hora))
                .map((ag) => {
                  const p = getPaciente(ag.pacienteId);
                  return (
                    <div
                      key={ag.id}
                      className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-center font-bold text-xs text-stone-900 dark:text-stone-100 flex-shrink-0">
                          {ag.hora}
                          <span className="block text-[10px] text-stone-400 font-normal">
                            {ag.duracao}m
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => p && onSelectPatient(p.id)}
                              className="font-bold text-sm text-stone-900 dark:text-stone-100 hover:text-emerald-600 dark:hover:text-emerald-400 text-left"
                            >
                              {p?.nome || 'Paciente não localizado'}
                            </button>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                              {ag.tipo}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Resp: {p?.resp || '—'} {p?.fone ? `· ${p.fone}` : ''}
                          </p>
                          {ag.notas && (
                            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 italic line-clamp-1">
                              "{ag.notas}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {p?.fone && (
                          <button
                            onClick={() => handleSendWhatsApp(p.fone, p.nome, ag.hora)}
                            className="p-2 rounded-xl text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors"
                            title="Confirmar via WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
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
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Right Column: Lembretes & Alertas Críticos (1 col) */}
        <div className="space-y-6">
          {/* Lembretes do Dia */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Lembretes Ativos
                </h3>
              </div>
              <button
                onClick={onOpenNewReminder}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            {lembretesPendentes.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">
                Sem lembretes pendentes.
              </p>
            ) : (
              <div className="space-y-2">
                {lembretesPendentes.slice(0, 4).map((lem) => (
                  <div
                    key={lem.id}
                    className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 flex items-start gap-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={lem.concluido}
                      onChange={() => toggleLembrete(lem.id)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {lem.titulo}
                      </p>
                      {lem.descricao && (
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                          {lem.descricao}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-400">
                        <span>{formatarData(lem.data)} {lem.hora || ''}</span>
                        <span
                          className={`px-1 rounded text-[9px] font-bold ${
                            lem.prioridade === 'Alta'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {lem.prioridade}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alertas Clínicos & Reavaliações */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                Alertas Clínicos
              </h3>
            </div>

            <div className="space-y-2.5">
              {planosAVencer.map((pl) => {
                const p = getPaciente(pl.pacienteId);
                const dias = diasAteData(pl.reav);
                return (
                  <div
                    key={pl.id}
                    className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-300">
                      <span>{p?.nome || 'Paciente'}</span>
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                        {dias <= 0 ? 'Venceu hoje' : `Reavaliação em ${dias}d`}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 line-clamp-2">
                      {pl.hipotese}
                    </p>
                  </div>
                );
              })}

              {atrasados.map((f) => {
                const p = getPaciente(f.pacienteId);
                return (
                  <div
                    key={f.id}
                    className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-semibold text-rose-900 dark:text-rose-300">
                        Fatura em atraso: {p?.nome}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {formatarMoeda(f.valor)} · Venceu em {formatarData(f.dataVenc)}
                      </p>
                    </div>
                    <button
                      onClick={() => marcarPago(f.id)}
                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold whitespace-nowrap"
                    >
                      Receber
                    </button>
                  </div>
                );
              })}

              {planosAVencer.length === 0 && atrasados.length === 0 && (
                <div className="py-4 text-center text-xs text-stone-400">
                  ✨ Tudo em dia na clínica! Sem pendências urgentes.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
