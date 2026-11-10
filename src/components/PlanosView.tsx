import React, { useState } from 'react';
import {
  Target,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  FileSpreadsheet,
  X,
  Sparkles,
  ArrowRight,
  Heart,
  Baby
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { PlanoIntervencao, StatusPlano, TabType } from '../types';
import { diasAteData, formatarData } from '../utils/dateUtils';

interface PlanosViewProps {
  setActiveTab: (tab: TabType) => void;
  initialPatientId?: string | null;
}

export const PlanosView: React.FC<PlanosViewProps> = ({
  setActiveTab,
  initialPatientId
}) => {
  const { state, addPlano, updatePlano, deletePlano } = useClinic();

  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>(initialPatientId || 'Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlano, setEditingPlano] = useState<PlanoIntervencao | null>(null);

  // Form State
  const [formPacienteId, setFormPacienteId] = useState(initialPatientId || (state.pacientes[0]?.id || ''));
  const [formHipotese, setFormHipotese] = useState('');
  const [formObjetivos, setFormObjetivos] = useState('');
  const [formEstrategias, setFormEstrategias] = useState('');
  const [formFreq, setFormFreq] = useState('2x por semana (50 min)');
  const [formReav, setFormReav] = useState(
    new Date(Date.now() + 86400000 * 60).toISOString().slice(0, 10)
  );
  const [formStatus, setFormStatus] = useState<StatusPlano>('Em andamento');

  const getPaciente = (id: string) => state.pacientes.find(p => p.id === id);

  const setTemplatesForPatient = (patientId: string) => {
    const p = state.pacientes.find(item => item.id === patientId);
    if (p?.categoria === 'Gestante (Parto & Pré-Natal)') {
      setFormHipotese('Gestante no 3º trimestre com necessidade de alinhamento de plano de parto humanizado, manejo não farmacológico da dor e preparação para a amamentação na primeira hora de vida.');
      setFormObjetivos('1. Construir plano de parto estruturado para apresentação à equipe hospitalar.\n2. Treinar posições de alívio e respiração com a rede de apoio.\n3. Capacitar quanto à fisiologia da lactogênese e prevenção de traumas mamilares.');
      setFormEstrategias('Sessões práticas de biomecânica pélvica, simulação de posições de parto, uso da bola suíça e manequim mamário.');
      setFormFreq('Semanal / Quinzenal até o parto');
    } else if (p?.categoria === 'Puérpera & Bebê (Amamentação)') {
      setFormHipotese('Puérpera em pós-parto imediato/tardio com queixa de dor na mamada, ganho ponderal limítrofe e insegurança na pega.');
      setFormObjetivos('1. Corrigir pega e acoplamento garantindo sucção indolor e efetiva.\n2. Estabelecer livre demanda e adequação de rotina sem uso precoce de bicos artificiais.\n3. Acompanhar a curva de peso do lactente semanalmente.');
      setFormEstrategias('Avaliação da mamada ao vivo (LATCH), laserterapia pontual para cicatrização, ordenha de alívio e rede de apoio.');
      setFormFreq('Acompanhamento semanal com suporte diário');
    } else {
      setFormHipotese('Dificuldades no processamento fonológico, trocas fonêmicas e baixa velocidade de leitura.');
      setFormObjetivos('1. Desenvolver habilidades de decodificação e fluência.\n2. Fortalecer a memória de trabalho e atenção.\n3. Promover a autonomia na resolução de tarefas escolares.');
      setFormEstrategias('Abordagem multissensorial fônica, jogos cognitivos estruturados, material concreto e mediação pedagógica individualizada.');
      setFormFreq('2x por semana (50 min)');
    }
  };

  const openNewModal = (pacienteId?: string) => {
    const targetId = pacienteId || (selectedPatientFilter !== 'Todos' ? selectedPatientFilter : (state.pacientes[0]?.id || ''));
    setEditingPlano(null);
    setFormPacienteId(targetId);
    setTemplatesForPatient(targetId);
    setFormReav(new Date(Date.now() + 86400000 * 60).toISOString().slice(0, 10));
    setFormStatus('Em andamento');
    setIsModalOpen(true);
  };

  const openEditModal = (pl: PlanoIntervencao) => {
    setEditingPlano(pl);
    setFormPacienteId(pl.pacienteId);
    setFormHipotese(pl.hipotese);
    setFormObjetivos(pl.objetivos);
    setFormEstrategias(pl.estrategias);
    setFormFreq(pl.freq);
    setFormReav(pl.reav);
    setFormStatus(pl.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPacienteId || !formHipotese.trim() || !formObjetivos.trim()) return;

    const payload = {
      pacienteId: formPacienteId,
      hipotese: formHipotese.trim(),
      objetivos: formObjetivos.trim(),
      estrategias: formEstrategias.trim(),
      freq: formFreq.trim(),
      reav: formReav,
      status: formStatus,
      dataCriacao: editingPlano?.dataCriacao || new Date().toISOString().slice(0, 10)
    };

    if (editingPlano) {
      await updatePlano(editingPlano.id, payload);
    } else {
      await addPlano(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este plano terapêutico?')) {
      await deletePlano(id);
    }
  };

  const filteredPlanos = state.planos.filter((pl) => {
    if (selectedPatientFilter !== 'Todos' && pl.pacienteId !== selectedPatientFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const p = getPaciente(pl.pacienteId);
      const matchP = p && p.nome.toLowerCase().includes(q);
      const matchText =
        pl.hipotese.toLowerCase().includes(q) ||
        pl.objetivos.toLowerCase().includes(q) ||
        pl.estrategias.toLowerCase().includes(q);
      if (!matchP && !matchText) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Planos Terapêuticos & Metas Clínicas
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            PEI individualizado, metas de consultoria perinatal, estratégias práticas e prazos de reavaliação
          </p>
        </div>

        <button
          onClick={() => openNewModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Plano</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por hipótese, metas ou paciente..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-stone-500 font-medium whitespace-nowrap">Paciente:</span>
          <select
            value={selectedPatientFilter}
            onChange={(e) => setSelectedPatientFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 w-full md:w-auto"
          >
            <option value="Todos">Todos ({state.planos.length} planos)</option>
            {state.pacientes.map((p) => {
              const count = state.planos.filter(pl => pl.pacienteId === p.id).length;
              return (
                <option key={p.id} value={p.id}>
                  {p.categoria === 'Adulto / Família' ? '🧠 ' : '👶 '}
                  {p.nome} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Plan Cards */}
      {filteredPlanos.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-12 text-center">
          <Target className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <h3 className="text-base font-bold text-stone-700 dark:text-stone-200">
            Nenhum plano cadastrado
          </h3>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            Elabore um plano individualizado com objetivos claros para o paciente ou gestante.
          </p>
          <button
            onClick={() => openNewModal()}
            className="mt-4 px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Criar Plano
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredPlanos.map((pl) => {
            const p = getPaciente(pl.pacienteId);
            const diasReav = diasAteData(pl.reav);
            const isPerinatal = p?.categoria === 'Gestante (Parto & Pré-Natal)' || p?.categoria === 'Puérpera & Bebê (Amamentação)';

            return (
              <div
                key={pl.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xs hover:border-purple-500/40 transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                        {p?.nome || 'Paciente'}
                      </h3>
                      {p && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {p.categoria}
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          pl.status === 'Em andamento'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : pl.status === 'Concluído'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {pl.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Frequência: {pl.freq} • Criado em: {formatarData(pl.dataCriacao)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                        diasReav < 0
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : diasReav <= 15
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {diasReav < 0
                          ? `Reavaliação vencida (${formatarData(pl.reav)})`
                          : `Reavaliar em ${diasReav} dias (${formatarData(pl.reav)})`}
                      </span>
                    </span>

                    <button
                      onClick={() => openEditModal(pl)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pl.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800 space-y-1.5">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-purple-700 dark:text-purple-400">
                      {isPerinatal ? 'Demanda & Diagnóstico Clínico' : 'Hipótese Diagnóstica'}
                    </h4>
                    <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
                      {pl.hipotese}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800 space-y-1.5">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Metas & Objetivos
                    </h4>
                    <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
                      {pl.objetivos}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800 space-y-1.5">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-400">
                      Estratégias & Recursos
                    </h4>
                    <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
                      {pl.estrategias}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                {editingPlano ? 'Editar Plano Terapêutico' : 'Novo Plano de Intervenção / Perinatal'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Paciente *
                  </label>
                  <select
                    required
                    value={formPacienteId}
                    onChange={(e) => {
                      setFormPacienteId(e.target.value);
                      setTemplatesForPatient(e.target.value);
                    }}
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
                    Frequência / Periodicidade
                  </label>
                  <input
                    type="text"
                    value={formFreq}
                    onChange={(e) => setFormFreq(e.target.value)}
                    placeholder="Ex: 2x semana, 50 min"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Data da Reavaliação *
                  </label>
                  <input
                    type="date"
                    required
                    value={formReav}
                    onChange={(e) => setFormReav(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Diagnóstico Clínico / Demanda Principal *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formHipotese}
                  onChange={(e) => setFormHipotese(e.target.value)}
                  placeholder="Ex: Dificuldades no processamento fonológico OU Preparação para o trabalho de parto humanizado e amamentação..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Metas & Objetivos Específicos *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formObjetivos}
                  onChange={(e) => setFormObjetivos(e.target.value)}
                  placeholder="1. Descreva a primeira meta...&#10;2. Descreva a segunda meta..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Estratégias Clínicas & Recursos *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formEstrategias}
                  onChange={(e) => setFormEstrategias(e.target.value)}
                  placeholder="Ex: Recursos lúdicos, simulador de parto, massagem sacral, laserterapia..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Status do Plano
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as StatusPlano)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                >
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Em revisão">Em revisão</option>
                </select>
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
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {editingPlano ? 'Salvar Alterações' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
