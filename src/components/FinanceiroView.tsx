import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageCircle,
  Edit2,
  Trash2,
  ArrowUpRight,
  Receipt,
  X,
  CreditCard
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { LancamentoFinanceiro, StatusFinanceiro, TabType } from '../types';
import { formatarData, formatarMoeda } from '../utils/dateUtils';

interface FinanceiroViewProps {
  setActiveTab: (tab: TabType) => void;
  initialPatientId?: string | null;
}

export const FinanceiroView: React.FC<FinanceiroViewProps> = ({
  setActiveTab,
  initialPatientId
}) => {
  const { state, addFinanceiro, updateFinanceiro, marcarPago, deleteFinanceiro } = useClinic();

  const mesAtual = new Date().toISOString().slice(0, 7);
  const [selectedComp, setSelectedComp] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>(initialPatientId || 'Todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFin, setEditingFin] = useState<LancamentoFinanceiro | null>(null);

  // Form State
  const [formPacienteId, setFormPacienteId] = useState(initialPatientId || (state.pacientes[0]?.id || ''));
  const [formComp, setFormComp] = useState(mesAtual);
  const [formValor, setFormValor] = useState<number | string>(640.00);
  const [formStatus, setFormStatus] = useState<StatusFinanceiro>('Pendente');
  const [formDataVenc, setFormDataVenc] = useState(
    new Date(Date.now() + 86400000 * 10).toISOString().slice(0, 10)
  );
  const [formFormaPag, setFormFormaPag] = useState('PIX');
  const [formDescricao, setFormDescricao] = useState('Mensalidade de 4 sessões psicopedagógicas');

  const getPaciente = (id: string) => state.pacientes.find(p => p.id === id);

  const openNewModal = (pacienteId?: string) => {
    setEditingFin(null);
    setFormPacienteId(pacienteId || (selectedPatientFilter !== 'Todos' ? selectedPatientFilter : (state.pacientes[0]?.id || '')));
    setFormComp(mesAtual);
    setFormValor(640.00);
    setFormStatus('Pendente');
    setFormDataVenc(new Date(Date.now() + 86400000 * 10).toISOString().slice(0, 10));
    setFormFormaPag('PIX');
    setFormDescricao('Mensalidade de 4 sessões psicopedagógicas');
    setIsModalOpen(true);
  };

  const openEditModal = (f: LancamentoFinanceiro) => {
    setEditingFin(f);
    setFormPacienteId(f.pacienteId);
    setFormComp(f.comp);
    setFormValor(f.valor);
    setFormStatus(f.status);
    setFormDataVenc(f.dataVenc);
    setFormFormaPag(f.formaPag || 'PIX');
    setFormDescricao(f.descricao || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPacienteId || !formComp || !formValor) return;

    const payload = {
      pacienteId: formPacienteId,
      comp: formComp,
      valor: Number(formValor),
      status: formStatus,
      dataVenc: formDataVenc,
      formaPag: formFormaPag,
      descricao: formDescricao.trim(),
      dataPag: formStatus === 'Pago' ? (editingFin?.dataPag || new Date().toISOString().slice(0, 10)) : ''
    };

    if (editingFin) {
      await updateFinanceiro(editingFin.id, payload);
    } else {
      await addFinanceiro(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir este lançamento financeiro?')) {
      await deleteFinanceiro(id);
    }
  };

  const handleSendWhatsAppCobrance = (f: LancamentoFinanceiro) => {
    const p = getPaciente(f.pacienteId);
    if (!p?.fone) {
      alert('Paciente não possui telefone cadastrado.');
      return;
    }
    const numeroLimpo = p.fone.replace(/\D/g, '');
    const chavePix = state.configuracoes.chavePix || 'contato@clinica.com.br';
    const msg = encodeURIComponent(
      `Olá, ${p.resp}! Aqui é da clínica ${state.configuracoes.nomeClinica}. Segue o demonstrativo da mensalidade psicopedagógica de ${p.nome} referente à competência ${f.comp} no valor de ${formatarMoeda(f.valor)}, com vencimento em ${formatarData(f.dataVenc)}. Chave PIX: ${chavePix}. Agradecemos a parceria!`
    );
    window.open(`https://wa.me/55${numeroLimpo}?text=${msg}`, '_blank');
  };

  // Filtered List
  const filteredFin = state.financeiro.filter((f) => {
    if (selectedComp !== 'Todos' && f.comp !== selectedComp) return false;
    if (statusFilter !== 'Todos' && f.status !== statusFilter) return false;
    if (selectedPatientFilter !== 'Todos' && f.pacienteId !== selectedPatientFilter) return false;
    return true;
  }).sort((a, b) => b.comp.localeCompare(a.comp));

  // Totals
  const totalGeral = filteredFin.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  const totalPago = filteredFin.filter(f => f.status === 'Pago').reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  const totalPendente = filteredFin.filter(f => f.status === 'Pendente').reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  const totalAtrasado = filteredFin.filter(f => f.status === 'Atrasado').reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

  // Available unique comps
  const availableComps = Array.from(new Set(state.financeiro.map(f => f.comp))).sort().reverse();
  if (!availableComps.includes(mesAtual)) availableComps.unshift(mesAtual);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Controle Financeiro da Clínica
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Mensalidades, pacotes de avaliação, emissão de cobranças e controle de recebimentos
          </p>
        </div>

        <button
          onClick={() => openNewModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Cobrança</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
          <span className="text-xs text-stone-500 font-medium">Total Lançado</span>
          <p className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            {formatarMoeda(totalGeral)}
          </p>
          <span className="text-[11px] text-stone-400">{filteredFin.length} lançamentos</span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20">
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Total Recebido</span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatarMoeda(totalPago)}
          </p>
          <span className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 font-medium">
            {totalGeral > 0 ? `${Math.round((totalPago / totalGeral) * 100)}% quitado` : '0%'}
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/20">
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">A Receber (Pendente)</span>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {formatarMoeda(totalPendente)}
          </p>
          <span className="text-[11px] text-stone-400">no prazo</span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/20">
          <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">Em Atraso</span>
          <p className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {formatarMoeda(totalAtrasado)}
          </p>
          <span className="text-[11px] text-rose-500 font-semibold">
            {filteredFin.filter(f => f.status === 'Atrasado').length} faturas vencidas
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
          <span className="text-xs text-stone-500 font-medium">Status:</span>
          {['Todos', 'Pago', 'Pendente', 'Atrasado'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-500 font-medium">Competência:</span>
            <select
              value={selectedComp}
              onChange={(e) => setSelectedComp(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            >
              <option value="Todos">Todas</option>
              {availableComps.map((c) => (
                <option key={c} value={c}>
                  {c} {c === mesAtual ? '(Mês Atual)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-500 font-medium">Paciente:</span>
            <select
              value={selectedPatientFilter}
              onChange={(e) => setSelectedPatientFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            >
              <option value="Todos">Todos</option>
              {state.pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Financial Table */}
      {filteredFin.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-12 text-center">
          <DollarSign className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <h3 className="text-base font-bold text-stone-700 dark:text-stone-200">
            Nenhum lançamento financeiro
          </h3>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            Lance cobranças de mensalidades e sessões para organizar o faturamento da clínica.
          </p>
          <button
            onClick={() => openNewModal()}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Novo Lançamento
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Competência</th>
                  <th className="py-3.5 px-4">Paciente / Responsável</th>
                  <th className="py-3.5 px-4">Descrição</th>
                  <th className="py-3.5 px-4">Vencimento</th>
                  <th className="py-3.5 px-4">Valor</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredFin.map((f) => {
                  const p = getPaciente(f.pacienteId);
                  return (
                    <tr
                      key={f.id}
                      className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                        {f.comp}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900 dark:text-stone-100">
                          {p?.nome || '—'}
                        </div>
                        <div className="text-[11px] text-stone-400">
                          Resp: {p?.resp} ({p?.fone || 'sem fone'})
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 dark:text-stone-300">
                        {f.descricao || 'Atendimentos Psicopedagógicos'}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 dark:text-stone-400">
                        {formatarData(f.dataVenc)}
                        {f.dataPag && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Pago em {formatarData(f.dataPag)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                        {formatarMoeda(f.valor)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            f.status === 'Pago'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : f.status === 'Atrasado'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {f.status !== 'Pago' && (
                            <button
                              onClick={() => marcarPago(f.id)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
                              title="Marcar como pago"
                            >
                              Receber
                            </button>
                          )}

                          {p?.fone && (
                            <button
                              onClick={() => handleSendWhatsAppCobrance(f)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                              title="Cobrança via WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(f)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(f.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Finance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                {editingFin ? 'Editar Lançamento Financeiro' : 'Lançar Cobrança / Mensalidade'}
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
                  <option value="">Selecione...</option>
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
                    Competência (Mês/Ano) *
                  </label>
                  <input
                    type="month"
                    required
                    value={formComp}
                    onChange={(e) => setFormComp(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formValor}
                    onChange={(e) => setFormValor(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDataVenc}
                    onChange={(e) => setFormDataVenc(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={formFormaPag}
                    onChange={(e) => setFormFormaPag(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Boleto">Boleto Bancário</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Transferência">Transferência Bancária</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Status do Lançamento
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as StatusFinanceiro)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                  <option value="Atrasado">Atrasado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Ex: Mensalidade de 4 sessões de atendimento..."
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
                  {editingFin ? 'Salvar Alterações' : 'Lançar Cobrança'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
