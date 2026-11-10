import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  School,
  Calendar,
  FileText,
  Target,
  Edit2,
  Trash2,
  ExternalLink,
  Tag,
  HeartPulse,
  AlertTriangle,
  FileSpreadsheet,
  X,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Download,
  FileBarChart,
  Baby,
  Heart,
  Stethoscope,
  Activity
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { Paciente, StatusPaciente, TabType, CategoriaPaciente, DadosPerinatais } from '../types';
import { calcularIdade, formatarData, formatarMoeda } from '../utils/dateUtils';
import { downloadRelatorioPDF } from '../utils/pdfGenerator';
import { Lock, Shield } from 'lucide-react';

interface PacientesViewProps {
  setActiveTab: (tab: TabType) => void;
  onOpenNewSession?: (pacienteId?: string) => void;
  onOpenNewAgenda?: (pacienteId?: string) => void;
  onOpenFinanceiro?: (pacienteId?: string) => void;
  onOpenRelatorio?: (pacienteId?: string) => void;
  onOpenNewAppointmentWithPatient?: (pacienteId: string) => void;
  onOpenNewSessionWithPatient?: (pacienteId: string) => void;
  onOpenNewPlanWithPatient?: (pacienteId: string) => void;
  selectedPatientId?: string | null;
  setSelectedPatientId?: (id: string | null) => void;
}

export const PacientesView: React.FC<PacientesViewProps> = ({
  setActiveTab,
  onOpenNewSession,
  onOpenNewAgenda,
  onOpenFinanceiro,
  onOpenRelatorio,
  onOpenNewAppointmentWithPatient,
  onOpenNewSessionWithPatient,
  onOpenNewPlanWithPatient,
  selectedPatientId,
  setSelectedPatientId
}) => {
  const { state, addPaciente, updatePaciente, deletePaciente } = useClinic();
  const { hasPermission, currentUser } = useAuth();

  const podeGerenciarPacientes = hasPermission('gerenciarPacientes');
  const podeVerAnamneseCompleta = hasPermission('verAnamneseCompleta');

  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Paciente | null>(null);

  // Prontuário / Detailed Patient Modal
  const [activeDetailPatient, setActiveDetailPatient] = useState<Paciente | null>(() => {
    if (selectedPatientId) {
      return state.pacientes.find(p => p.id === selectedPatientId) || null;
    }
    return null;
  });

  const [detailTab, setDetailTab] = useState<'anamnese' | 'perinatal' | 'sessoes' | 'planos' | 'relatorios' | 'financeiro'>('anamnese');

  // Form State
  const [formNome, setFormNome] = useState('');
  const [formNasc, setFormNasc] = useState('');
  const [formCategoria, setFormCategoria] = useState<CategoriaPaciente>('Infantil / Escolar');
  const [formEscola, setFormEscola] = useState('');
  const [formSerie, setFormSerie] = useState('');
  const [formResp, setFormResp] = useState('');
  const [formFone, setFormFone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formQueixa, setFormQueixa] = useState('');
  const [formAlergias, setFormAlergias] = useState('');
  const [formMedicacao, setFormMedicacao] = useState('');
  const [formStatus, setFormStatus] = useState<StatusPaciente>('Ativo');
  const [formTagsStr, setFormTagsStr] = useState('');
  const [formNotasGerais, setFormNotasGerais] = useState('');

  // Perinatal Form Fields
  const [formSemanasGestacao, setFormSemanasGestacao] = useState('');
  const [formDpp, setFormDpp] = useState('');
  const [formParidade, setFormParidade] = useState('');
  const [formTipoPartoDesejado, setFormTipoPartoDesejado] = useState('');
  const [formHospitalMaternidade, setFormHospitalMaternidade] = useState('');
  const [formObstetraEquipe, setFormObstetraEquipe] = useState('');
  const [formAcompanhanteParto, setFormAcompanhanteParto] = useState('');
  const [formNomeBebe, setFormNomeBebe] = useState('');
  const [formNascBebe, setFormNascBebe] = useState('');
  const [formTipoAleitamento, setFormTipoAleitamento] = useState<'Exclusivo (AME)' | 'Misto / Complementado' | 'Fórmula Infantil' | 'Em transição'>('Exclusivo (AME)');
  const [formQueixaMamaria, setFormQueixaMamaria] = useState('');
  const [formLaserterapiaRealizada, setFormLaserterapiaRealizada] = useState(false);

  const openNewModal = () => {
    setEditingPatient(null);
    setFormNome('');
    setFormNasc('');
    setFormCategoria(currentUser?.nivelAcesso === 'enfermeira_perinatal' ? 'Gestante (Parto & Pré-Natal)' : 'Infantil / Escolar');
    setFormEscola('');
    setFormSerie('');
    setFormResp('');
    setFormFone('');
    setFormEmail('');
    setFormQueixa('');
    setFormAlergias('');
    setFormMedicacao('');
    setFormStatus('Ativo');
    setFormTagsStr('');
    setFormNotasGerais('');

    // Perinatal
    setFormSemanasGestacao('');
    setFormDpp('');
    setFormParidade('');
    setFormTipoPartoDesejado('');
    setFormHospitalMaternidade('');
    setFormObstetraEquipe('');
    setFormAcompanhanteParto('');
    setFormNomeBebe('');
    setFormNascBebe('');
    setFormTipoAleitamento('Exclusivo (AME)');
    setFormQueixaMamaria('');
    setFormLaserterapiaRealizada(false);

    setIsModalOpen(true);
  };

  const openEditModal = (p: Paciente) => {
    setEditingPatient(p);
    setFormNome(p.nome);
    setFormNasc(p.nasc);
    setFormCategoria(p.categoria || 'Infantil / Escolar');
    setFormEscola(p.escola || '');
    setFormSerie(p.serie || '');
    setFormResp(p.resp || '');
    setFormFone(p.fone || '');
    setFormEmail(p.email || '');
    setFormQueixa(p.queixa || '');
    setFormAlergias(p.alergias || '');
    setFormMedicacao(p.medicacao || '');
    setFormStatus(p.status || 'Ativo');
    setFormTagsStr((p.tags || []).join(', '));
    setFormNotasGerais(p.notasGerais || '');

    // Perinatal
    const dp = p.dadosPerinatais;
    setFormSemanasGestacao(dp?.semanasGestacao || '');
    setFormDpp(dp?.dpp || '');
    setFormParidade(dp?.paridade || '');
    setFormTipoPartoDesejado(dp?.tipoPartoDesejado || '');
    setFormHospitalMaternidade(dp?.hospitalMaternidade || '');
    setFormObstetraEquipe(dp?.obstetraEquipe || '');
    setFormAcompanhanteParto(dp?.acompanhanteParto || '');
    setFormNomeBebe(dp?.nomeBebe || '');
    setFormNascBebe(dp?.nascBebe || '');
    setFormTipoAleitamento(dp?.tipoAleitamento || 'Exclusivo (AME)');
    setFormQueixaMamaria(dp?.queixaMamaria || '');
    setFormLaserterapiaRealizada(dp?.laserterapiaRealizada || false);

    setIsModalOpen(true);
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formNasc) return;

    const tagsArray = formTagsStr
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const dadosPerinatais: DadosPerinatais = {
      semanasGestacao: formSemanasGestacao.trim() || undefined,
      dpp: formDpp || undefined,
      paridade: formParidade.trim() || undefined,
      tipoPartoDesejado: formTipoPartoDesejado.trim() || undefined,
      hospitalMaternidade: formHospitalMaternidade.trim() || undefined,
      obstetraEquipe: formObstetraEquipe.trim() || undefined,
      acompanhanteParto: formAcompanhanteParto.trim() || undefined,
      nomeBebe: formNomeBebe.trim() || undefined,
      nascBebe: formNascBebe || undefined,
      tipoAleitamento: formTipoAleitamento,
      queixaMamaria: formQueixaMamaria.trim() || undefined,
      laserterapiaRealizada: formLaserterapiaRealizada
    };

    const payload = {
      nome: formNome.trim(),
      nasc: formNasc,
      categoria: formCategoria,
      escola: formEscola.trim(),
      serie: formSerie.trim(),
      resp: formResp.trim(),
      fone: formFone.trim(),
      email: formEmail.trim(),
      queixa: formQueixa.trim(),
      alergias: formAlergias.trim(),
      medicacao: formMedicacao.trim(),
      status: formStatus,
      tags: tagsArray,
      notasGerais: formNotasGerais.trim(),
      dadosPerinatais: (formCategoria.includes('Gestante') || formCategoria.includes('Puérpera') || formSemanasGestacao || formNomeBebe) ? dadosPerinatais : undefined,
      dataInicio: editingPatient?.dataInicio || new Date().toISOString().slice(0, 10)
    };

    if (editingPatient) {
      await updatePaciente(editingPatient.id, payload);
      if (activeDetailPatient?.id === editingPatient.id) {
        setActiveDetailPatient({ ...editingPatient, ...payload });
      }
    } else {
      await addPaciente(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o paciente "${nome}" e todos os seus registros associados?`)) {
      await deletePaciente(id);
      if (activeDetailPatient?.id === id) {
        setActiveDetailPatient(null);
      }
    }
  };

  const filteredPacientes = state.pacientes.filter(p => {
    const q = localSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.nome.toLowerCase().includes(q) ||
      p.resp.toLowerCase().includes(q) ||
      (p.escola && p.escola.toLowerCase().includes(q)) ||
      (p.queixa && p.queixa.toLowerCase().includes(q)) ||
      (p.dadosPerinatais?.nomeBebe && p.dadosPerinatais.nomeBebe.toLowerCase().includes(q)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)));

    const matchStatus = statusFilter === 'Todos' || p.status === statusFilter;
    const matchCategoria = 
      categoriaFilter === 'Todas' ||
      (categoriaFilter === 'Infantil' && (p.categoria === 'Infantil / Escolar' || !p.categoria)) ||
      (categoriaFilter === 'Adulto' && p.categoria === 'Adulto / Família');

    return matchSearch && matchStatus && matchCategoria;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Prontuário de Pacientes & Clientes
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            {state.pacientes.length} cadastros na clínica · Psicopedagogia Infantil & Adulto
          </p>
        </div>

        {podeGerenciarPacientes && (
          <button
            id="btn-add-patient"
            onClick={openNewModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Paciente</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Pesquisar por nome, queixa ou tag..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {[
            { id: 'Todas', label: 'Todas as Áreas' },
            { id: 'Infantil', label: '👶 Psicopedagogia Infantil' },
            { id: 'Adulto', label: '🧠 Psicopedagogia Adulto' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                categoriaFilter === cat.id
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {['Todos', 'Ativo', 'Em Avaliação', 'Alta'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Patients Grid */}
      {filteredPacientes.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <h3 className="text-base font-bold text-stone-700 dark:text-stone-200">
            Nenhum registro encontrado
          </h3>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            {localSearch ? 'Nenhum resultado corresponde à sua pesquisa.' : 'Comece cadastrando uma nova gestante, puérpera ou paciente da clínica.'}
          </p>
          {!localSearch && (
            <button
              onClick={openNewModal}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Cadastrar Novo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPacientes.map((p) => {
            const isAdulto = p.categoria === 'Adulto / Família';
            const isGestante = p.categoria === 'Gestante (Parto & Pré-Natal)';
            const isPuerpera = p.categoria === 'Puérpera & Bebê (Amamentação)';
            const sessoesCount = state.sessoes.filter(s => s.pacienteId === p.id).length;
            const dp = p.dadosPerinatais;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
              >
                <div>
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base" role="img" aria-label="ícone">
                          {isAdulto ? '🧠' : isGestante ? '🤰' : isPuerpera ? '🤱' : '👶'}
                        </span>
                        <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {p.nome}
                        </h3>
                      </div>
                      <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                        <span>{calcularIdade(p.nasc)}</span>
                        <span>•</span>
                        <span>Nasc: {formatarData(p.nasc)}</span>
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'Ativo'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : p.status === 'Em Avaliação'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                          : p.status === 'Alta'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  {/* Specialty specific badge */}
                  {(isGestante || isPuerpera) && (
                    <div className="mt-2.5 p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 text-xs text-teal-900 dark:text-teal-200 space-y-1">
                      {isGestante && dp?.semanasGestacao && (
                        <div className="flex items-center justify-between">
                          <span className="font-bold">Idade Gestacional:</span>
                          <span className="bg-teal-200/60 dark:bg-teal-900 px-1.5 py-0.5 rounded-md font-bold">{dp.semanasGestacao}</span>
                        </div>
                      )}
                      {isGestante && dp?.dpp && (
                        <p className="text-[11px] text-teal-700 dark:text-teal-300">DPP: {formatarData(dp.dpp)} {dp.tipoPartoDesejado ? `• ${dp.tipoPartoDesejado}` : ''}</p>
                      )}
                      {isPuerpera && (
                        <div className="text-[11px]">
                          <span className="font-bold">Bebê:</span> {dp?.nomeBebe || 'Lactente'} {dp?.tipoAleitamento ? `(${dp.tipoAleitamento})` : ''}
                        </div>
                      )}
                      {dp?.queixaMamaria && (
                        <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium truncate">
                          ⚠️ {dp.queixaMamaria}
                        </p>
                      )}
                    </div>
                  )}

                  {/* School & Resp */}
                  <div className="mt-3 space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
                    {(p.escola || p.serie) && (
                      <div className="flex items-center gap-2">
                        <School className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                        <span className="truncate">{p.escola} {p.serie ? `(${p.serie})` : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <span className="truncate">{isGestante ? 'Acompanhante / Rede:' : 'Resp:'} {p.resp}</span>
                    </div>
                    {p.fone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                        <span>{p.fone}</span>
                      </div>
                    )}
                  </div>

                  {/* Queixa snippet */}
                  {p.queixa && (
                    <div className="mt-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 line-clamp-2">
                      <strong className="text-stone-900 dark:text-stone-100">Demanda/Queixa:</strong> {p.queixa}
                    </div>
                  )}

                  {/* Tags */}
                  {p.tags && p.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {p.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveDetailPatient(p)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Prontuário Completo</span>
                  </button>

                  {podeGerenciarPacientes && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                        title="Editar dados"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.nome)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                        title="Excluir paciente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Patient Prontuário Modal (Full Detailed View) */}
      {activeDetailPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">
                    {activeDetailPatient.categoria === 'Adulto / Família'
                      ? '🧠'
                      : activeDetailPatient.categoria === 'Gestante (Parto & Pré-Natal)'
                      ? '🤰'
                      : activeDetailPatient.categoria === 'Puérpera & Bebê (Amamentação)'
                      ? '🤱'
                      : '👶'}
                  </span>
                  <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                    {activeDetailPatient.nome}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {activeDetailPatient.status}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  {calcularIdade(activeDetailPatient.nasc)} • Nasc: {formatarData(activeDetailPatient.nasc)} • Contato: {activeDetailPatient.resp} ({activeDetailPatient.fone || 'Sem fone'})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(activeDetailPatient)}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium hover:bg-stone-200 cursor-pointer"
                >
                  Editar
                </button>
                <button
                  onClick={() => setActiveDetailPatient(null)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Prontuário Tab Selector */}
            <div className="px-6 py-2.5 bg-stone-100/60 dark:bg-stone-800/40 border-b border-stone-200 dark:border-stone-800 flex gap-2 overflow-x-auto">
              {[
                { id: 'anamnese', label: 'Anamnese & Contato' },
                ...(activeDetailPatient.dadosPerinatais ? [{ id: 'perinatal', label: '🤰 Dados Perinatais & Mamas' }] : []),
                { id: 'sessoes', label: `Consultas / Sessões (${state.sessoes.filter(s => s.pacienteId === activeDetailPatient.id).length})` },
                { id: 'planos', label: `Planos de Cuidado / PEI (${state.planos.filter(p => p.pacienteId === activeDetailPatient.id).length})` },
                { id: 'relatorios', label: `Laudos & Pareceres (${(state.relatorios || []).filter(r => r.pacienteId === activeDetailPatient.id).length})` },
                { id: 'financeiro', label: 'Financeiro' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDetailTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    detailTab === t.id
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {detailTab === 'anamnese' && (
                <div className="space-y-5 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-2">
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider text-stone-400">
                        Identificação & Contato
                      </h4>
                      <p><strong>Categoria:</strong> {activeDetailPatient.categoria || 'Infantil / Escolar'}</p>
                      {activeDetailPatient.escola && <p><strong>Escola:</strong> {activeDetailPatient.escola}</p>}
                      {activeDetailPatient.serie && <p><strong>Série:</strong> {activeDetailPatient.serie}</p>}
                      <p><strong>Acompanhante / Resp.:</strong> {activeDetailPatient.resp}</p>
                      <p><strong>Telefone / WhatsApp:</strong> {activeDetailPatient.fone || '—'}</p>
                      <p><strong>E-mail:</strong> {activeDetailPatient.email || '—'}</p>
                      <p><strong>Início dos Atendimentos:</strong> {formatarData(activeDetailPatient.dataInicio)}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-2">
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider text-stone-400">
                        Saúde & Particularidades
                      </h4>
                      <p><strong>Alergias / Restrições:</strong> {activeDetailPatient.alergias || 'Nenhuma registrada'}</p>
                      <p><strong>Medicações / Suplementos:</strong> {activeDetailPatient.medicacao || 'Nenhuma'}</p>
                      <div>
                        <strong>Tags clínicas / Perinatais:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {activeDetailPatient.tags?.map((tg, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                              {tg}
                            </span>
                          )) || '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {podeVerAnamneseCompleta ? (
                    <>
                      <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
                        <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider text-stone-400 mb-2">
                          Demanda Inicial & Queixa Principal
                        </h4>
                        <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
                          {activeDetailPatient.queixa || 'Não registrada.'}
                        </p>
                      </div>

                      {activeDetailPatient.notasGerais && (
                        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
                          <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider text-stone-400 mb-2">
                            Observações Gerais da Clínica
                          </h4>
                          <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
                            {activeDetailPatient.notasGerais}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
                      <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                      <div>
                        <p className="font-bold">Acesso Clínico Restrito por Sigilo Ético</p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                          O histórico aprofundado de queixas, anamnese e observações diagnósticas é reservado para profissionais com perfil clínico e Administrador.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'perinatal' && activeDetailPatient.dadosPerinatais && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-2">
                      <h4 className="font-bold text-teal-900 dark:text-teal-200 text-xs uppercase tracking-wider">
                        🤰 Gestação & Parto
                      </h4>
                      {activeDetailPatient.dadosPerinatais.semanasGestacao && (
                        <p><strong>Idade Gestacional:</strong> {activeDetailPatient.dadosPerinatais.semanasGestacao}</p>
                      )}
                      {activeDetailPatient.dadosPerinatais.dpp && (
                        <p><strong>Data Provável do Parto (DPP):</strong> {formatarData(activeDetailPatient.dadosPerinatais.dpp)}</p>
                      )}
                      {activeDetailPatient.dadosPerinatais.paridade && (
                        <p><strong>Paridade:</strong> {activeDetailPatient.dadosPerinatais.paridade}</p>
                      )}
                      {activeDetailPatient.dadosPerinatais.tipoPartoDesejado && (
                        <p><strong>Tipo de Parto Desejado:</strong> {activeDetailPatient.dadosPerinatais.tipoPartoDesejado}</p>
                      )}
                      {activeDetailPatient.dadosPerinatais.hospitalMaternidade && (
                        <p><strong>Maternidade / Hospital:</strong> {activeDetailPatient.dadosPerinatais.hospitalMaternidade}</p>
                      )}
                      {activeDetailPatient.dadosPerinatais.obstetraEquipe && (
                        <p><strong>Obstetra / Equipe:</strong> {activeDetailPatient.dadosPerinatais.obstetraEquipe}</p>
                      )}
                      {activeDetailPatient.dadosPerinatais.acompanhanteParto && (
                        <p><strong>Acompanhante:</strong> {activeDetailPatient.dadosPerinatais.acompanhanteParto}</p>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-2">
                      <h4 className="font-bold text-teal-900 dark:text-teal-200 text-xs uppercase tracking-wider">
                        🤱 Pós-Parto, Bebê & Amamentação
                      </h4>
                      {activeDetailPatient.dadosPerinatais.nomeBebe && (
                        <p><strong>Nome do Bebê:</strong> {activeDetailPatient.dadosPerinatais.nomeBebe}</p>
                      )}
                      {activeDetailPatient.dadosPerinatais.nascBebe && (
                        <p><strong>Nascimento do Bebê:</strong> {formatarData(activeDetailPatient.dadosPerinatais.nascBebe)}</p>
                      )}
                      {activeDetailPatient.dadosPerinatais.tipoAleitamento && (
                        <p><strong>Tipo de Aleitamento:</strong> {activeDetailPatient.dadosPerinatais.tipoAleitamento}</p>
                      )}
                      {activeDetailPatient.dadosPerinatais.queixaMamaria && (
                        <p className="text-rose-700 dark:text-rose-300 font-semibold">
                          <strong>Avaliação de Mamas / Dor:</strong> {activeDetailPatient.dadosPerinatais.queixaMamaria}
                        </p>
                      )}
                      <p>
                        <strong>Laserterapia Mamária:</strong>{' '}
                        {activeDetailPatient.dadosPerinatais.laserterapiaRealizada ? '⚡ Realizada com protocolo de cicatrização' : 'Não realizada'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'sessoes' && (
                <div className="space-y-4">
                  {state.sessoes.filter(s => s.pacienteId === activeDetailPatient.id).length === 0 ? (
                    <p className="text-center text-xs text-stone-400 py-8">
                      Nenhum atendimento ou consultoria registrado para este paciente ainda.
                    </p>
                  ) : (
                    state.sessoes
                      .filter(s => s.pacienteId === activeDetailPatient.id)
                      .sort((a, b) => b.data.localeCompare(a.data))
                      .map((s) => (
                        <div
                          key={s.id}
                          className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                            <span className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                              {s.tipoAtendimento === 'consultoria_parto' ? '🤰 Consultoria de Parto' : s.tipoAtendimento === 'consultoria_amamentacao' ? '🤱 Consultoria de Amamentação' : '🩺 Atendimento Clínico'}
                              <span className="text-stone-400 font-normal">({formatarData(s.data)})</span>
                            </span>
                            {s.avaliacaoHumor && (
                              <span className="px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium">
                                Estado: {s.avaliacaoHumor}
                              </span>
                            )}
                          </div>
                          <p><strong>Objetivos / Pauta:</strong> {s.objetivos}</p>
                          <p><strong>Procedimentos & Manejo:</strong> {s.atividades}</p>
                          {s.dadosPerinatal?.avaliacaoPega && (
                            <p className="text-teal-800 dark:text-teal-300"><strong>Pega & Mamas:</strong> {s.dadosPerinatal.avaliacaoPega}</p>
                          )}
                          {s.dadosPerinatal?.laserterapiaDose && (
                            <p className="text-rose-700 dark:text-rose-300"><strong>⚡ Laserterapia:</strong> {s.dadosPerinatal.laserterapiaDose}</p>
                          )}
                          <p><strong>Observações:</strong> {s.obs}</p>
                          <p><strong>Orientações / Tarefa em casa:</strong> {s.tarefa || '—'}</p>
                        </div>
                      ))
                  )}
                </div>
              )}

              {detailTab === 'planos' && (
                <div className="space-y-4">
                  {state.planos.filter(pl => pl.pacienteId === activeDetailPatient.id).length === 0 ? (
                    <p className="text-center text-xs text-stone-400 py-8">
                      Nenhum plano de parto, cuidado ou intervenção cadastrado para este paciente.
                    </p>
                  ) : (
                    state.planos
                      .filter(pl => pl.pacienteId === activeDetailPatient.id)
                      .map((pl) => (
                        <div
                          key={pl.id}
                          className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                              {pl.tipoPlano === 'Plano_De_Parto' ? '🤰 Plano de Parto Personalizado' : pl.tipoPlano === 'Plano_Amamentacao' ? '🤱 Plano de Amamentação & Cuidado' : '🎯 Plano de Intervenção PEI'}
                              <span className="text-xs font-normal text-emerald-600">({pl.status})</span>
                            </span>
                            <span className="text-stone-400">
                              Reavaliação: {formatarData(pl.reav)} • Freq: {pl.freq}
                            </span>
                          </div>
                          <p><strong>Síntese / Hipótese:</strong> {pl.hipotese}</p>
                          <p><strong>Objetivos:</strong> {pl.objetivos}</p>
                          <p><strong>Diretrizes & Estratégias:</strong> {pl.estrategias}</p>
                        </div>
                      ))
                  )}
                </div>
              )}

              {detailTab === 'relatorios' && (
                <div className="space-y-4">
                  {(state.relatorios || []).filter(r => r.pacienteId === activeDetailPatient.id).length === 0 ? (
                    <div className="text-center py-8 space-y-3">
                      <p className="text-xs text-stone-400">
                        Nenhum laudo, parecer ou documento emitido para este paciente ainda.
                      </p>
                      <button
                        onClick={() => {
                          setActiveDetailPatient(null);
                          if (onOpenRelatorio) {
                            onOpenRelatorio(activeDetailPatient.id);
                          } else {
                            setActiveTab('relatorio');
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Gerar Parecer / Relatório</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(state.relatorios || [])
                        .filter(r => r.pacienteId === activeDetailPatient.id)
                        .sort((a, b) => b.dataEmissao.localeCompare(a.dataEmissao))
                        .map((rel) => (
                          <div
                            key={rel.id}
                            className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                                  {rel.titulo}
                                </h5>
                                <p className="text-stone-500 text-[11px]">
                                  Emissão: {formatarData(rel.dataEmissao)} • Solicitante: {rel.solicitante || 'Família'}
                                </p>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                {rel.status}
                              </span>
                            </div>

                            {rel.conclusaoHipotese && (
                              <p className="text-stone-700 dark:text-stone-300 line-clamp-2 italic bg-white/60 dark:bg-stone-900/60 p-2.5 rounded-xl border border-stone-200/60 dark:border-stone-800/60">
                                "{rel.conclusaoHipotese}"
                              </p>
                            )}

                            <div className="pt-2 border-t border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between">
                              <button
                                onClick={() => {
                                  setActiveDetailPatient(null);
                                  if (onOpenRelatorio) {
                                    onOpenRelatorio(activeDetailPatient.id);
                                  } else {
                                    setActiveTab('relatorio');
                                  }
                                }}
                                className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <span>Abrir no Editor Clínico →</span>
                              </button>

                              <button
                                onClick={() =>
                                  downloadRelatorioPDF({
                                    doc: rel,
                                    paciente: activeDetailPatient,
                                    configuracoes: state.configuracoes
                                  })
                                }
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Baixar PDF</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'financeiro' && (
                <div className="space-y-3">
                  {state.financeiro.filter(f => f.pacienteId === activeDetailPatient.id).length === 0 ? (
                    <p className="text-center text-xs text-stone-400 py-8">
                      Nenhum lançamento financeiro para este paciente.
                    </p>
                  ) : (
                    state.financeiro
                      .filter(f => f.pacienteId === activeDetailPatient.id)
                      .map((f) => (
                        <div
                          key={f.id}
                          className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-stone-900 dark:text-stone-100">
                              Competência: {f.comp} • {formatarMoeda(f.valor)}
                            </p>
                            <p className="text-stone-500">
                              Vencimento: {formatarData(f.dataVenc)} {f.formaPag ? `• ${f.formaPag}` : ''}
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              f.status === 'Pago'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : f.status === 'Atrasado'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {f.status}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800/80 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setActiveDetailPatient(null);
                  setActiveTab('relatorio');
                }}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Gerar Relatório / Parecer deste Paciente →
              </button>
              <button
                onClick={() => setActiveDetailPatient(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Patient Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                {editingPatient ? 'Editar Cadastro' : 'Novo Cadastro Clínico / Perinatal'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Área / Categoria de Atendimento *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'Infantil / Escolar', label: '👶 Psicopedagogia Infantil', icon: '👶' },
                    { id: 'Adulto / Família', label: '🧠 Psicopedagogia Adulto', icon: '🧠' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormCategoria(cat.id as CategoriaPaciente)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        formCategoria === cat.id
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20'
                          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder={formCategoria === 'Adulto / Família' ? 'Ex: Carlos Alberto Souza' : 'Ex: Lucas Gabriel Silva'}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formNasc}
                    onChange={(e) => setFormNasc(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                {/* Perinatal Specific Fields */}
                {formCategoria === 'Gestante (Parto & Pré-Natal)' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-teal-800 dark:text-teal-300 mb-1">
                        Idade Gestacional Atual
                      </label>
                      <input
                        type="text"
                        value={formSemanasGestacao}
                        onChange={(e) => setFormSemanasGestacao(e.target.value)}
                        placeholder="Ex: 34 semanas e 2 dias"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-teal-50/40 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-stone-900 dark:text-stone-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-teal-800 dark:text-teal-300 mb-1">
                        DPP (Data Provável do Parto)
                      </label>
                      <input
                        type="date"
                        value={formDpp}
                        onChange={(e) => setFormDpp(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-teal-50/40 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-stone-900 dark:text-stone-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Paridade (Gesta/Para/Aborto)
                      </label>
                      <input
                        type="text"
                        value={formParidade}
                        onChange={(e) => setFormParidade(e.target.value)}
                        placeholder="Ex: G1P0A0 (Primigesta)"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Tipo de Parto Desejado
                      </label>
                      <input
                        type="text"
                        value={formTipoPartoDesejado}
                        onChange={(e) => setFormTipoPartoDesejado(e.target.value)}
                        placeholder="Ex: Normal Humanizado, Cesárea indicada"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Maternidade / Hospital
                      </label>
                      <input
                        type="text"
                        value={formHospitalMaternidade}
                        onChange={(e) => setFormHospitalMaternidade(e.target.value)}
                        placeholder="Ex: Santa Joana, Pro Matre, Einstein"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Obstetra / Equipe
                      </label>
                      <input
                        type="text"
                        value={formObstetraEquipe}
                        onChange={(e) => setFormObstetraEquipe(e.target.value)}
                        placeholder="Ex: Dra. Vanessa Martins"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </>
                )}

                {/* Puérpera Specific Fields */}
                {formCategoria === 'Puérpera & Bebê (Amamentação)' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-teal-800 dark:text-teal-300 mb-1">
                        Nome do Bebê
                      </label>
                      <input
                        type="text"
                        value={formNomeBebe}
                        onChange={(e) => setFormNomeBebe(e.target.value)}
                        placeholder="Ex: Theo Rocha"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-teal-50/40 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-stone-900 dark:text-stone-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-teal-800 dark:text-teal-300 mb-1">
                        Data de Nascimento do Bebê
                      </label>
                      <input
                        type="date"
                        value={formNascBebe}
                        onChange={(e) => setFormNascBebe(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-teal-50/40 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-stone-900 dark:text-stone-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Padrão de Aleitamento
                      </label>
                      <select
                        value={formTipoAleitamento}
                        onChange={(e) => setFormTipoAleitamento(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                      >
                        <option value="Exclusivo (AME)">Exclusivo (AME)</option>
                        <option value="Misto / Complementado">Misto / Complementado</option>
                        <option value="Fórmula Infantil">Fórmula Infantil</option>
                        <option value="Em transição">Em transição</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Queixa Mamária / Dor
                      </label>
                      <input
                        type="text"
                        value={formQueixaMamaria}
                        onChange={(e) => setFormQueixaMamaria(e.target.value)}
                        placeholder="Ex: Fissura mama direita, dor à pega"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </>
                )}

                {/* School fields for Infantil */}
                {formCategoria === 'Infantil / Escolar' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Escola
                      </label>
                      <input
                        type="text"
                        value={formEscola}
                        onChange={(e) => setFormEscola(e.target.value)}
                        placeholder="Ex: EMEF Monteiro Lobato"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Série / Ano Escolar
                      </label>
                      <input
                        type="text"
                        value={formSerie}
                        onChange={(e) => setFormSerie(e.target.value)}
                        placeholder="Ex: 3º ano Fundamental I"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    {formCategoria === 'Adulto / Família' ? 'Contato de Emergência / Familiar' : 'Responsável Legal *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formResp}
                    onChange={(e) => setFormResp(e.target.value)}
                    placeholder={formCategoria === 'Adulto / Família' ? 'Ex: Próprio paciente ou cônjuge' : 'Ex: Mariana Silva (Mãe)'}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formFone}
                    onChange={(e) => setFormFone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as StatusPaciente)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Em Avaliação">Em Avaliação / Consultoria</option>
                    <option value="Alta">Alta</option>
                    <option value="Pausado">Pausado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Tags Clínicas (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={formTagsStr}
                    onChange={(e) => setFormTagsStr(e.target.value)}
                    placeholder="Ex: Consultoria Parto, Amamentação, Laserterapia, Pega Correta"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Demanda Inicial / Queixa Principal *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formQueixa}
                  onChange={(e) => setFormQueixa(e.target.value)}
                  placeholder={formCategoria === 'Adulto / Família' ? 'Ex: Dificuldades de atenção, funções executivas, desorganização no trabalho/estudos, memória...' : 'Ex: Dificuldades no aprendizado, alfabetização, raciocínio lógico...'}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Alergias / Restrições
                  </label>
                  <input
                    type="text"
                    value={formAlergias}
                    onChange={(e) => setFormAlergias(e.target.value)}
                    placeholder="Ex: Dipirona, Látex"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Medicações / Suplementação em uso
                  </label>
                  <input
                    type="text"
                    value={formMedicacao}
                    onChange={(e) => setFormMedicacao(e.target.value)}
                    placeholder="Ex: Ácido fólico, Sulfato ferroso, Ômega 3"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
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
                  {editingPatient ? 'Salvar Alterações' : 'Concluir Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
