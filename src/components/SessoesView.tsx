import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Smile,
  Edit2,
  Trash2,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  X,
  Target,
  Clock,
  Baby,
  Activity,
  Heart,
  Zap
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { Sessao, HumorSessao, TabType, TipoAtendimentoSessao } from '../types';
import { formatarData } from '../utils/dateUtils';

interface SessoesViewProps {
  setActiveTab: (tab: TabType) => void;
  initialPatientId?: string | null;
}

const SUGESTOES_POR_TIPO = {
  consultoria_amamentacao: [
    'Avaliação de Pega e Acoplamento Mamário (LATCH)',
    'Manejo de Fissuras e Laserterapia de Baixa Potência',
    'Posições de Mamada (Invertida, Tradicional, Cavalinho)',
    'Desmame Gradual / Retorno ao Trabalho',
    'Ordenha Manual, Armazenamento e Uso de Copinho',
    'Prevenção e Tratamento de Ingurgitamento Mamário'
  ],
  consultoria_parto: [
    'Construção e Alinhamento do Plano de Parto',
    'Métodos Não Farmacológicos de Alívio da Dor (TENS, respiração)',
    'Fisiologia do Trabalho de Parto e Fases de Dilatação',
    'Posicionamento Pélvico, Bola Suíça e Movimentação Ativa',
    'Orientações e Papel da Rede de Apoio / Acompanhante',
    'Hora de Ouro, Contato Pele a Pele e Pós-Parto Imediato'
  ],
  psicopedagogia: [
    'Consciência Fonológica (rimas e aliterações)',
    'Atenção Sustentada e Funções Executivas',
    'Leitura, Decodificação e Compreensão Textual',
    'Raciocínio Lógico-Matemático e Sistema Decimal',
    'Psicomotricidade Fina e Grafomotricidade',
    'Autorregulação Emocional e Tolerância à Frustração'
  ]
};

export const SessoesView: React.FC<SessoesViewProps> = ({
  setActiveTab,
  initialPatientId
}) => {
  const { state, addSessao, updateSessao, deleteSessao } = useClinic();
  const { currentUser } = useAuth();

  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>(initialPatientId || 'Todos');
  const [tipoFilter, setTipoFilter] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSessao, setEditingSessao] = useState<Sessao | null>(null);

  // Form State
  const [formPacienteId, setFormPacienteId] = useState(initialPatientId || (state.pacientes[0]?.id || ''));
  const [formTipoAtendimento, setFormTipoAtendimento] = useState<TipoAtendimentoSessao>(
    currentUser?.nivelAcesso === 'enfermeira_perinatal' ? 'consultoria_amamentacao' : 'psicopedagogia'
  );
  const [formData, setFormData] = useState(new Date().toISOString().slice(0, 10));
  const [formObjetivos, setFormObjetivos] = useState('');
  const [formAtividades, setFormAtividades] = useState('');
  const [formObs, setFormObs] = useState('');
  const [formTarefa, setFormTarefa] = useState('');
  const [formHumor, setFormHumor] = useState<HumorSessao>('Ótimo');
  const [formTempo, setFormTempo] = useState(60);

  // Perinatal Session Detail
  const [formAvaliacaoPega, setFormAvaliacaoPega] = useState('');
  const [formLaserDose, setFormLaserDose] = useState('');
  const [formPosicoes, setFormPosicoes] = useState('');

  const getPaciente = (id: string) => state.pacientes.find(p => p.id === id);

  const openNewModal = (pacienteId?: string) => {
    const targetPatId = pacienteId || (selectedPatientFilter !== 'Todos' ? selectedPatientFilter : (state.pacientes[0]?.id || ''));
    const targetPat = state.pacientes.find(p => p.id === targetPatId);

    let defaultTipo: TipoAtendimentoSessao = 'psicopedagogia';
    if (targetPat?.categoria === 'Gestante (Parto & Pré-Natal)') {
      defaultTipo = 'consultoria_parto';
    } else if (targetPat?.categoria === 'Puérpera & Bebê (Amamentação)') {
      defaultTipo = 'consultoria_amamentacao';
    } else if (currentUser?.nivelAcesso === 'enfermeira_perinatal') {
      defaultTipo = 'consultoria_amamentacao';
    }

    setEditingSessao(null);
    setFormPacienteId(targetPatId);
    setFormTipoAtendimento(defaultTipo);
    setFormData(new Date().toISOString().slice(0, 10));
    setFormObjetivos('');
    setFormAtividades('');
    setFormObs('');
    setFormTarefa('');
    setFormHumor('Ótimo');
    setFormTempo(60);
    setFormAvaliacaoPega('');
    setFormLaserDose('');
    setFormPosicoes('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Sessao) => {
    setEditingSessao(s);
    setFormPacienteId(s.pacienteId);
    setFormTipoAtendimento(s.tipoAtendimento || 'psicopedagogia');
    setFormData(s.data);
    setFormObjetivos(s.objetivos);
    setFormAtividades(s.atividades);
    setFormObs(s.obs);
    setFormTarefa(s.tarefa || '');
    setFormHumor(s.avaliacaoHumor || 'Ótimo');
    setFormTempo(s.tempoGasto || 60);

    setFormAvaliacaoPega(s.dadosPerinatal?.avaliacaoPega || '');
    setFormLaserDose(s.dadosPerinatal?.laserterapiaDose || '');
    setFormPosicoes(s.dadosPerinatal?.posicoesOrientadas || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPacienteId || !formData || !formObjetivos.trim()) return;

    const payload = {
      pacienteId: formPacienteId,
      tipoAtendimento: formTipoAtendimento,
      data: formData,
      objetivos: formObjetivos.trim(),
      atividades: formAtividades.trim(),
      obs: formObs.trim(),
      tarefa: formTarefa.trim(),
      avaliacaoHumor: formHumor,
      tempoGasto: Number(formTempo) || 60,
      dadosPerinatal: formTipoAtendimento !== 'psicopedagogia' ? {
        avaliacaoPega: formAvaliacaoPega.trim() || undefined,
        laserterapiaDose: formLaserDose.trim() || undefined,
        posicoesOrientadas: formPosicoes.trim() || undefined
      } : undefined
    };

    if (editingSessao) {
      await updateSessao(editingSessao.id, payload);
    } else {
      await addSessao(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro clínico/consultoria?')) {
      await deleteSessao(id);
    }
  };

  const handleCopyNote = (s: Sessao) => {
    const p = getPaciente(s.pacienteId);
    const isPerinatal = s.tipoAtendimento === 'consultoria_amamentacao' || s.tipoAtendimento === 'consultoria_parto';
    const titulo = s.tipoAtendimento === 'consultoria_parto'
      ? 'REGISTRO DE CONSULTORIA DE PARTO & EDUCAÇÃO PERINATAL'
      : s.tipoAtendimento === 'consultoria_amamentacao'
      ? 'REGISTRO DE CONSULTORIA EM AMAMENTAÇÃO & MANEJO MAMÁRIO'
      : 'REGISTRO DE EVOLUÇÃO PSICOPEDAGÓGICA';

    const text = `${titulo}
Paciente/Cliente: ${p?.nome || '—'}
Data: ${formatarData(s.data)} (${s.tempoGasto || 60} min) - Estado: ${s.avaliacaoHumor || '—'}

1. Pauta / Objetivos Trabalhados:
${s.objetivos}

2. Procedimentos, Manejos e Orientações Técnicas:
${s.atividades || '—'}
${s.dadosPerinatal?.avaliacaoPega ? `\nAvaliação de Pega / Mamas: ${s.dadosPerinatal.avaliacaoPega}` : ''}
${s.dadosPerinatal?.laserterapiaDose ? `\nLaserterapia: ${s.dadosPerinatal.laserterapiaDose}` : ''}

3. Observações Clínicas:
${s.obs || '—'}

4. Orientações para Casa & Rede de Apoio:
${s.tarefa || 'Nenhuma'}

Profissional: ${isPerinatal ? 'Enf. Juliana Silveira (Enfermeira Perinatal · COREN-SP 214.890)' : `${state.configuracoes.profissional} (${state.configuracoes.registroProfissional})`}`;

    navigator.clipboard.writeText(text);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSessoes = state.sessoes.filter((s) => {
    if (selectedPatientFilter !== 'Todos' && s.pacienteId !== selectedPatientFilter) return false;
    if (tipoFilter !== 'Todos' && s.tipoAtendimento !== tipoFilter) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const p = getPaciente(s.pacienteId);
      const matchPac = p?.nome.toLowerCase().includes(q);
      const matchObj = s.objetivos.toLowerCase().includes(q);
      const matchAtiv = s.atividades.toLowerCase().includes(q);
      const matchObs = s.obs.toLowerCase().includes(q);
      if (!matchPac && !matchObj && !matchAtiv && !matchObs) return false;
    }

    return true;
  }).sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Evoluções & Consultorias Clínicas
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Registro detalhado de atendimentos psicopedagógicos, consultorias de parto e amamentação
          </p>
        </div>

        <button
          onClick={() => openNewModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Evolução / Atendimento</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1">
              Filtrar por Paciente
            </label>
            <select
              value={selectedPatientFilter}
              onChange={(e) => setSelectedPatientFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            >
              <option value="Todos">Todos os Pacientes ({state.pacientes.length})</option>
              {state.pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.categoria === 'Adulto / Família' ? '🧠 ' : '👶 '}
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1">
              Especialidade / Tipo
            </label>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            >
              <option value="Todos">Todas as Modalidades</option>
              <option value="consultoria_amamentacao">🤱 Consultoria de Amamentação</option>
              <option value="consultoria_parto">🤰 Consultoria de Parto</option>
              <option value="psicopedagogia">👶 Psicopedagogia</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1">
              Buscar no Conteúdo
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Objetivo, conduta, laser, queixa..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Feed */}
      {filteredSessoes.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <h3 className="text-base font-bold text-stone-700 dark:text-stone-200">
            Nenhuma evolução encontrada
          </h3>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            {searchTerm ? 'Nenhum registro corresponde aos filtros.' : 'Cadastre a primeira consultoria ou evolução clínica.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessoes.map((s) => {
            const paciente = getPaciente(s.pacienteId);
            const isAmamentacao = s.tipoAtendimento === 'consultoria_amamentacao';
            const isParto = s.tipoAtendimento === 'consultoria_parto';

            return (
              <div
                key={s.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-xs hover:border-emerald-500/30 transition-all space-y-4"
              >
                {/* Header of session card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                      isAmamentacao
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : isParto
                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {isAmamentacao ? '🤱' : isParto ? '🤰' : '🩺'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                          {paciente?.nome || 'Paciente Desconhecido'}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isAmamentacao
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
                            : isParto
                            ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                        }`}>
                          {isAmamentacao ? 'Consultoria Amamentação' : isParto ? 'Consultoria de Parto' : 'Psicopedagogia'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                        <span>{formatarData(s.data)}</span>
                        <span>•</span>
                        <span>{s.tempoGasto || 60} minutos</span>
                        {s.avaliacaoHumor && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-stone-700 dark:text-stone-300">
                              Estado: {s.avaliacaoHumor}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => handleCopyNote(s)}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-200 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copiar texto formatado para prontuário externo ou WhatsApp"
                    >
                      {copiedId === s.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800 space-y-1">
                    <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <Target className="w-3.5 h-3.5" /> {isAmamentacao || isParto ? 'Pauta & Objetivos da Consultoria' : 'Objetivos Trabalhados'}
                    </h4>
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                      {s.objetivos}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800 space-y-1">
                    <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                      <BookOpen className="w-3.5 h-3.5" /> {isAmamentacao || isParto ? 'Procedimentos, Treinamentos & Técnicas' : 'Atividades & Recursos'}
                    </h4>
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                      {s.atividades || '—'}
                    </p>
                  </div>
                </div>

                {/* Perinatal specific highlight box */}
                {s.dadosPerinatal && (s.dadosPerinatal.avaliacaoPega || s.dadosPerinatal.laserterapiaDose || s.dadosPerinatal.posicoesOrientadas) && (
                  <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 text-xs space-y-1.5 text-teal-950 dark:text-teal-200">
                    <h4 className="font-bold flex items-center gap-1.5 text-teal-800 dark:text-teal-300 uppercase text-[11px] tracking-wider">
                      <Zap className="w-3.5 h-3.5 text-teal-600" /> Manejo Perinatal & Procedimentos Realizados
                    </h4>
                    {s.dadosPerinatal.avaliacaoPega && (
                      <p><strong>Avaliação de Pega / Mamas:</strong> {s.dadosPerinatal.avaliacaoPega}</p>
                    )}
                    {s.dadosPerinatal.laserterapiaDose && (
                      <p className="text-rose-800 dark:text-rose-300 font-semibold">
                        <strong>⚡ Laserterapia Mamária:</strong> {s.dadosPerinatal.laserterapiaDose}
                      </p>
                    )}
                    {s.dadosPerinatal.posicoesOrientadas && (
                      <p><strong>Posições & Posturas Orientadas:</strong> {s.dadosPerinatal.posicoesOrientadas}</p>
                    )}
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800 space-y-1 text-xs sm:text-sm">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider text-stone-400">
                    Observações Clínicas & Parecer
                  </h4>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                    {s.obs || '—'}
                  </p>
                </div>

                {s.tarefa && (
                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200">
                    <strong>{isParto || isAmamentacao ? 'Orientações para a Mãe, Parceiro & Casa:' : 'Orientação / Tarefa para Casa:'}</strong> {s.tarefa}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                {editingSessao ? 'Editar Registro de Atendimento' : 'Registro de Evolução Clínica / Consultoria'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Type Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Modalidade do Atendimento *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'consultoria_amamentacao', label: '🤱 Amamentação', icon: '🤱' },
                    { id: 'consultoria_parto', label: '🤰 Consultoria Parto', icon: '🤰' },
                    { id: 'psicopedagogia', label: '👶 Psicopedagogia', icon: '👶' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormTipoAtendimento(t.id as TipoAtendimentoSessao)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        formTipoAtendimento === t.id
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Paciente *
                  </label>
                  <select
                    required
                    value={formPacienteId}
                    onChange={(e) => setFormPacienteId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value="">Selecione...</option>
                    {state.pacientes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.categoria === 'Adulto / Família' ? '🧠 ' : '👶 '}
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Data do Atendimento *
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
                    Estado / Engajamento
                  </label>
                  <select
                    value={formHumor}
                    onChange={(e) => setFormHumor(e.target.value as HumorSessao)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value="Excelente">Excelente / Aliviada</option>
                    <option value="Ótimo">Ótimo / Tranquila</option>
                    <option value="Bom">Bom / Cooperativa</option>
                    <option value="Cansado">Cansada / Puerpério sensível</option>
                    <option value="Desatento">Ansiosa / Insegura</option>
                    <option value="Resistente">Dor intensa</option>
                  </select>
                </div>
              </div>

              {/* Objetivos com sugestões dinâmicas baseadas no tipo */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Objetivos & Pauta da Sessão *
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Sugestões clínicas rápidas abaixo</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {(SUGESTOES_POR_TIPO[formTipoAtendimento] || SUGESTOES_POR_TIPO.psicopedagogia).map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setFormObjetivos(prev => prev ? `${prev}; ${sug}` : sug);
                      }}
                      className="px-2 py-0.5 rounded-lg text-[10px] bg-stone-100 dark:bg-stone-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                    >
                      + {sug.slice(0, 36)}...
                    </button>
                  ))}
                </div>
                <textarea
                  required
                  rows={2}
                  value={formObjetivos}
                  onChange={(e) => setFormObjetivos(e.target.value)}
                  placeholder={formTipoAtendimento === 'consultoria_amamentacao' ? 'Ex: Ajuste de pega, manejo de fissura mamária em mama direita e alívio de dor...' : formTipoAtendimento === 'consultoria_parto' ? 'Ex: Elaboração do plano de parto, treino de respiração e posições de alívio...' : 'Ex: Estimular consciência fonológica e funções executivas...'}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Procedimentos, Treinamento & Técnicas Praticadas
                </label>
                <textarea
                  rows={2}
                  value={formAtividades}
                  onChange={(e) => setFormAtividades(e.target.value)}
                  placeholder={formTipoAtendimento === 'consultoria_amamentacao' ? 'Ex: Posicionamento em cavalinho, ordenha de alívio da aréola, acoplamento profundo...' : formTipoAtendimento === 'consultoria_parto' ? 'Ex: Exercícios na bola de pilates, massagem sacral com o acompanhante, posições 4 apoios...' : 'Ex: Jogo da memória com rimas, alfabeto móvel...'}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Specialized Perinatal fields in form */}
              {formTipoAtendimento !== 'psicopedagogia' && (
                <div className="p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-3">
                  <h4 className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-teal-600" /> Parâmetros Específicos de Enfermagem Perinatal
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-teal-900 dark:text-teal-300 mb-1">
                        Avaliação da Pega / Escala LATCH / Mamas
                      </label>
                      <input
                        type="text"
                        value={formAvaliacaoPega}
                        onChange={(e) => setFormAvaliacaoPega(e.target.value)}
                        placeholder="Ex: Pega assimétrica alcançada, lábios evertidos"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-900 border border-teal-200 dark:border-teal-800 text-stone-900 dark:text-stone-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-teal-900 dark:text-teal-300 mb-1">
                        Dose de Laserterapia (se realizada)
                      </label>
                      <input
                        type="text"
                        value={formLaserDose}
                        onChange={(e) => setFormLaserDose(e.target.value)}
                        placeholder="Ex: 2J/cm² em ponto de fissura mama E"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-900 border border-teal-200 dark:border-teal-800 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Observações Clínicas & Parecer do Atendimento
                </label>
                <textarea
                  rows={3}
                  value={formObs}
                  onChange={(e) => setFormObs(e.target.value)}
                  placeholder="Ex: A paciente relatou diminuição imediata do desconforto, compreendeu a técnica de posicionamento..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Orientações para Casa & Rede de Apoio
                </label>
                <input
                  type="text"
                  value={formTarefa}
                  onChange={(e) => setFormTarefa(e.target.value)}
                  placeholder={formTipoAtendimento !== 'psicopedagogia' ? 'Ex: Manter aréola flexível antes de oferecer a mama, compressas mornas pré-mamada e acompanhamento via WhatsApp...' : 'Ex: Leitura compartilhada de 10 min antes de dormir...'}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {editingSessao ? 'Salvar Alterações' : 'Salvar Atendimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
