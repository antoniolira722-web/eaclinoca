import React, { useState } from 'react';
import {
  Cloud,
  RefreshCw,
  Copy,
  Check,
  Download,
  Upload,
  Smartphone,
  Laptop,
  Building2,
  Save,
  CheckCircle2,
  Key,
  Shield,
  ArrowRight,
  Database,
  FileBarChart,
  Printer,
  Sparkles,
  Plus,
  Trash2,
  Sliders,
  Settings,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Bell,
  Users
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { TabType, OpcoesRelatorio } from '../types';
import { UsuariosConfigView } from './UsuariosConfigView';

interface NuvemConfigViewProps {
  setActiveTab: (tab: TabType) => void;
}

export const NuvemConfigView: React.FC<NuvemConfigViewProps> = ({ setActiveTab }) => {
  const {
    state,
    syncCode,
    syncState,
    lastSyncTime,
    forcarSincronizacao,
    alterarSyncCode,
    exportarBackupJSON,
    importarBackupJSON,
    updateConfiguracoes,
    solicitarPermissaoNavegador
  } = useClinic();

  const { currentUser, hasPermission } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [activeSubSection, setActiveSubSection] = useState<'geral' | 'relatorios' | 'nuvem' | 'usuarios'>('geral');
  const [copiedCode, setCopiedCode] = useState(false);
  const [targetCodeInput, setTargetCodeInput] = useState('');
  const [savedSettingsMsg, setSavedSettingsMsg] = useState(false);
  const [newInstrumentInput, setNewInstrumentInput] = useState('');

  // General Settings State
  const [formNomeClinica, setFormNomeClinica] = useState(state.configuracoes.nomeClinica || 'Ninho');
  const [formProfissional, setFormProfissional] = useState(state.configuracoes.profissional || 'Ester Lopes');
  const [formRegistro, setFormRegistro] = useState(state.configuracoes.registroProfissional || 'ABPp 4821/SP');
  const [formTelefone, setFormTelefone] = useState(state.configuracoes.telefoneClinica || '(11) 98765-0000');
  const [formContato, setFormContato] = useState(state.configuracoes.contato || '(11) 98765-0000 · contato@ninho.com.br');
  const [formEndereco, setFormEndereco] = useState(state.configuracoes.endereco || 'Av. Paulista, 1000 - Cj 84 - Bela Vista, São Paulo - SP');
  const [formChavePix, setFormChavePix] = useState(state.configuracoes.chavePix || 'contato@ninho.com.br');
  const [formValorSessao, setFormValorSessao] = useState(state.configuracoes.valorPadrao || 180);
  const [formAutoSync, setFormAutoSync] = useState(state.configuracoes.syncAuto ?? true);
  const [formLembretesSonoros, setFormLembretesSonoros] = useState(state.configuracoes.lembretesSonoros ?? true);
  const [formNotificacoesAtivas, setFormNotificacoesAtivas] = useState(state.configuracoes.notificacoesAtivas ?? true);

  // Report & Letterhead Settings State
  const opc = state.configuracoes.opcoesRelatorio || {};
  const [formCabecalho, setFormCabecalho] = useState(opc.cabecalhoPersonalizado ?? true);
  const [formRodape, setFormRodape] = useState(opc.rodapePersonalizado ?? true);
  const [formTextoRodape, setFormTextoRodape] = useState(opc.textoRodape || 'Documento de caráter confidencial emitido para fins psicopedagógicos e educacionais.');
  const [formCidadePadrao, setFormCidadePadrao] = useState(opc.cidadePadrao || 'São Paulo - SP');
  const [formAssinaturaLinha, setFormAssinaturaLinha] = useState(opc.incluirAssinaturaLinha ?? true);
  const [formRegistroNoDoc, setFormRegistroNoDoc] = useState(opc.incluirRegistroProfissional ?? true);
  const [formTituloPadraoLaudo, setFormTituloPadraoLaudo] = useState(opc.tituloPadraoLaudo || 'Laudo de Avaliação Psicopedagógica Clínica');
  const [formIncluirCpfCnpj, setFormIncluirCpfCnpj] = useState(opc.incluirCnpjCpf ?? false);
  const [formDocCpfCnpj, setFormDocCpfCnpj] = useState(opc.documentoCpfCnpj || '');
  const [formMostrarIdade, setFormMostrarIdade] = useState(opc.mostrarIdadeNoCabecalho ?? true);
  const [formMostrarEscola, setFormMostrarEscola] = useState(opc.mostrarEscolaNoCabecalho ?? true);
  const [formInstrumentosPadrao, setFormInstrumentosPadrao] = useState<string[]>(
    opc.modeloPadraoInstrumentos || [
      'EOCA (Entrevista Operativa Centrada na Aprendizagem)',
      'Provas Operatórias de Jean Piaget (Conservação, Classificação e Seriação)',
      'TDE II (Teste de Desempenho Escolar - Leitura, Escrita e Aritmética)',
      'PROLEC (Provas de Avaliação dos Processos de Leitura)',
      'Análise da Produção Gráfica e Psicomotricidade Fina',
      'Escala SNAP-IV de Avaliação Comportamental e Atencional'
    ]
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleConnectOtherCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCodeInput.trim()) return;
    if (window.confirm('Ao conectar a outro código de clínica, os dados deste dispositivo serão atualizados com os dados da nuvem. Deseja continuar?')) {
      await alterarSyncCode(targetCodeInput.trim());
      setTargetCodeInput('');
      alert('Dispositivo conectado com sucesso aos dados da nuvem!');
    }
  };

  const handleAddInstrumentoPadrao = () => {
    if (!newInstrumentInput.trim()) return;
    if (!formInstrumentosPadrao.includes(newInstrumentInput.trim())) {
      setFormInstrumentosPadrao([...formInstrumentosPadrao, newInstrumentInput.trim()]);
    }
    setNewInstrumentInput('');
  };

  const handleRemoveInstrumentoPadrao = (index: number) => {
    setFormInstrumentosPadrao(formInstrumentosPadrao.filter((_, i) => i !== index));
  };

  const handleSaveAllConfiguracoes = (e: React.FormEvent) => {
    e.preventDefault();

    const novasOpcoesRelatorio: OpcoesRelatorio = {
      cabecalhoPersonalizado: formCabecalho,
      rodapePersonalizado: formRodape,
      textoRodape: formTextoRodape,
      cidadePadrao: formCidadePadrao,
      incluirAssinaturaLinha: formAssinaturaLinha,
      incluirRegistroProfissional: formRegistroNoDoc,
      incluirCnpjCpf: formIncluirCpfCnpj,
      documentoCpfCnpj: formDocCpfCnpj,
      tituloPadraoLaudo: formTituloPadraoLaudo,
      exibirLogoCabecalho: true,
      fonteDocumento: 'sans',
      margemImpressao: 'normal',
      modeloPadraoInstrumentos: formInstrumentosPadrao,
      mostrarIdadeNoCabecalho: formMostrarIdade,
      mostrarEscolaNoCabecalho: formMostrarEscola
    };

    updateConfiguracoes({
      nomeClinica: formNomeClinica,
      profissional: formProfissional,
      registroProfissional: formRegistro,
      telefoneClinica: formTelefone,
      contato: formContato,
      endereco: formEndereco,
      chavePix: formChavePix,
      valorPadrao: Number(formValorSessao) || 180,
      syncAuto: formAutoSync,
      lembretesSonoros: formLembretesSonoros,
      notificacoesAtivas: formNotificacoesAtivas,
      opcoesRelatorio: novasOpcoesRelatorio
    });

    setSavedSettingsMsg(true);
    setTimeout(() => setSavedSettingsMsg(false), 2500);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await importarBackupJSON(file);
    if (ok) {
      alert('Backup importado e sincronizado com sucesso!');
    } else {
      alert('Erro ao ler arquivo de backup. Formato inválido.');
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Configurações da Clínica & Relatórios
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Personalize opções de laudos clínicos, dados cadastrais, notificações e sincronização em nuvem
          </p>
        </div>

        {savedSettingsMsg && (
          <div className="px-4 py-2 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-2xl flex items-center gap-1.5 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Configurações salvas e sincronizadas!</span>
          </div>
        )}
      </div>

      {/* Settings Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-1">
        <button
          onClick={() => setActiveSubSection('geral')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubSection === 'geral'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Dados da Clínica & Preferências</span>
        </button>

        <button
          onClick={() => setActiveSubSection('relatorios')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubSection === 'relatorios'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <FileBarChart className="w-4 h-4" />
          <span>Opções de Relatórios & Laudos</span>
        </button>

        <button
          onClick={() => setActiveSubSection('nuvem')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubSection === 'nuvem'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Sincronização & Backup</span>
        </button>

        <button
          onClick={() => setActiveSubSection('usuarios')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubSection === 'usuarios'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários & Acessos</span>
        </button>
      </div>

      {activeSubSection === 'usuarios' ? (
        <UsuariosConfigView />
      ) : (
        <form onSubmit={handleSaveAllConfiguracoes} className="space-y-6">
        {/* ===================================================================== */}
        {/* SUBSECTION 1: DADOS DA CLÍNICA & PREFERÊNCIAS GERAIS                  */}
        {/* ===================================================================== */}
        {activeSubSection === 'geral' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-4 shadow-2xs">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Informações Profissionais & Cadastrais
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Nome da Clínica / Consultório *
                  </label>
                  <input
                    type="text"
                    value={formNomeClinica}
                    onChange={(e) => setFormNomeClinica(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Profissional Responsável *
                  </label>
                  <input
                    type="text"
                    value={formProfissional}
                    onChange={(e) => setFormProfissional(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Registro Profissional (ABPp / CRP / CBO) *
                  </label>
                  <input
                    type="text"
                    value={formRegistro}
                    onChange={(e) => setFormRegistro(e.target.value)}
                    placeholder="Ex: ABPp 4821/SP"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Telefone / WhatsApp Principal
                  </label>
                  <input
                    type="text"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Texto de Contato / E-mail no Cabeçalho
                  </label>
                  <input
                    type="text"
                    value={formContato}
                    onChange={(e) => setFormContato(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Valor Padrão da Sessão (R$)
                  </label>
                  <input
                    type="number"
                    value={formValorSessao}
                    onChange={(e) => setFormValorSessao(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Endereço Completo do Consultório
                  </label>
                  <input
                    type="text"
                    value={formEndereco}
                    onChange={(e) => setFormEndereco(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Chave PIX para Cobranças
                  </label>
                  <input
                    type="text"
                    value={formChavePix}
                    onChange={(e) => setFormChavePix(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>
            </div>

            {/* Notifications & System Preferences */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-4 shadow-2xs">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-2 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                Alertas, Sons & Interface
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60">
                  <input
                    type="checkbox"
                    checked={formLembretesSonoros}
                    onChange={(e) => setFormLembretesSonoros(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 block">
                      Avisos e Lembretes Sonoros
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Tocar um suave sino harmônico quando um lembrete ou notificação importante vencer.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60">
                  <input
                    type="checkbox"
                    checked={formNotificacoesAtivas}
                    onChange={(e) => setFormNotificacoesAtivas(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 block">
                      Notificações Internas Ativas
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Exibir avisos automáticos de sessões do dia, cobranças atrasadas e laudos pendentes.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SUBSECTION 2: OPÇÕES DE RELATÓRIOS & LAUDOS (PAPEL TIMBRADO)          */}
        {/* ===================================================================== */}
        {activeSubSection === 'relatorios' && (
          <div className="space-y-6">
            {/* Header / Layout Options */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-600" />
                  Estrutura do Papel Timbrado Oficial
                </h3>
                <span className="text-[11px] text-stone-400">
                  Aplicado em todos os laudos, pareceres e declarações
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Título Padrão para Laudos de Avaliação
                  </label>
                  <input
                    type="text"
                    value={formTituloPadraoLaudo}
                    onChange={(e) => setFormTituloPadraoLaudo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Cidade Padrão (Local da Emissão)
                  </label>
                  <input
                    type="text"
                    value={formCidadePadrao}
                    onChange={(e) => setFormCidadePadrao(e.target.value)}
                    placeholder="Ex: São Paulo - SP"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60">
                  <input
                    type="checkbox"
                    checked={formCabecalho}
                    onChange={(e) => setFormCabecalho(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 block">
                      Incluir Cabeçalho Timbrado com Logo e Dados da Clínica
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Imprime no topo da página o nome do consultório, profissional, registro e endereço.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60">
                  <input
                    type="checkbox"
                    checked={formAssinaturaLinha}
                    onChange={(e) => setFormAssinaturaLinha(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 block">
                      Incluir Linha de Assinatura e Carimbo Profissional
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Gera o campo de assinatura formal ao final do laudo com nome e número do registro.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60">
                  <input
                    type="checkbox"
                    checked={formRodape}
                    onChange={(e) => setFormRodape(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 block">
                      Incluir Rodapé de Confidencialidade
                    </span>
                    <input
                      type="text"
                      value={formTextoRodape}
                      onChange={(e) => setFormTextoRodape(e.target.value)}
                      disabled={!formRodape}
                      className="mt-1 w-full px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 disabled:opacity-50"
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Standard Assessment Instruments Manager */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Bateria de Instrumentos Padrão da Clínica
                </h3>
                <span className="text-[11px] text-stone-400">
                  {formInstrumentosPadrao.length} instrumento(s) cadastrado(s)
                </span>
              </div>

              <p className="text-xs text-stone-500">
                Estes instrumentos e testes aparecem como atalhos de seleção rápida na criação de novos laudos:
              </p>

              <div className="space-y-2">
                {formInstrumentosPadrao.map((inst, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/70 text-xs"
                  >
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {inst}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInstrumentoPadrao(index)}
                      className="text-stone-400 hover:text-rose-500 p-1 transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Instrument */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newInstrumentInput}
                  onChange={(e) => setNewInstrumentInput(e.target.value)}
                  placeholder="Nome do novo instrumento psicopedagógico (ex: PROLEC-SE, Torre de Hanói)..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
                <button
                  type="button"
                  onClick={handleAddInstrumentoPadrao}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SUBSECTION 3: SINCRONIZAÇÃO EM NUVEM & BACKUP                        */}
        {/* ===================================================================== */}
        {activeSubSection === 'nuvem' && (
          <div className="space-y-6">
            {/* Cloud Status Card */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-2xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        syncState === 'synced'
                          ? 'bg-emerald-500 animate-pulse'
                          : syncState === 'syncing'
                          ? 'bg-amber-500 animate-spin'
                          : syncState === 'offline'
                          ? 'bg-stone-400'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      {syncState === 'synced' && 'Google Cloud Firestore — Tempo Real Ativo'}
                      {syncState === 'syncing' && 'Sincronizando com Google Cloud...'}
                      {syncState === 'offline' && 'Modo Offline (Salvo Localmente)'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                      Multi-Dispositivo
                    </span>
                  </div>

                  <p className="text-xs text-stone-500">
                    Cadastros e alterações feitos no celular ou no computador são refletidos instantaneamente em todos os outros aparelhos conectados via Google Cloud Firestore.
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {lastSyncTime
                      ? `Conexão ativa e sincronizada às ${lastSyncTime.toLocaleTimeString('pt-BR')} (${lastSyncTime.toLocaleDateString('pt-BR')})`
                      : 'Sincronização em tempo real habilitada.'}
                  </p>

                  {/* Sync Code Box */}
                  <div className="pt-2">
                    <span className="text-[11px] text-stone-400 font-semibold block mb-1">
                      SEU CÓDIGO EXCLUSIVO DE SINCRONIZAÇÃO:
                    </span>
                    <div className="inline-flex items-center gap-2 bg-stone-100 dark:bg-stone-800 p-2 rounded-2xl border border-stone-200 dark:border-stone-700">
                      <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400 ml-1" />
                      <code className="text-xs sm:text-sm font-mono font-bold text-stone-900 dark:text-stone-100 select-all">
                        {syncCode}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:bg-stone-200 flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => forcarSincronizacao()}
                    disabled={syncState === 'syncing'}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>Sincronizar Agora</span>
                  </button>

                  <button
                    type="button"
                    onClick={exportarBackupJSON}
                    className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Backup JSON</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Multi-Device Pairing Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: How to connect other devices */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                  <Smartphone className="w-6 h-6" />
                  <Laptop className="w-6 h-6" />
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                    Como sincronizar outro aparelho
                  </h3>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Para acessar a mesma clínica no seu celular ou computador secundário:
                </p>

                <ol className="text-xs text-stone-600 dark:text-stone-400 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Abra o aplicativo no outro dispositivo.</li>
                  <li>Vá na aba <strong>Configurações</strong> → <strong>Sincronização</strong>.</li>
                  <li>No campo abaixo, insira o seu código: <strong className="text-emerald-600">{syncCode}</strong></li>
                  <li>Clique em <strong>Conectar</strong>.</li>
                </ol>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Conectar a outra clínica pelo código:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={targetCodeInput}
                        onChange={(e) => setTargetCodeInput(e.target.value)}
                        placeholder="Ex: ninho-principal..."
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleConnectOtherCode}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs"
                      >
                        Conectar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Manual JSON Restore */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
                  <Database className="w-6 h-6" />
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                    Restauração & Backup Local
                  </h3>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Se você possui um arquivo de backup completo, você pode restaurá-lo a qualquer momento.
                </p>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-3">
                  <Upload className="w-6 h-6 mx-auto text-stone-400" />
                  <div>
                    <label
                      htmlFor="upload-backup-file"
                      className="cursor-pointer px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold inline-block shadow-xs"
                    >
                      Selecionar Arquivo JSON
                    </label>
                    <input
                      id="upload-backup-file"
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Formato compatível: .json de backup gerado pelo sistema
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Save Button Bottom Bar */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <p className="text-xs text-stone-500">
            As alterações são salvas localmente e sincronizadas em segundo plano.
          </p>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Todas as Configurações</span>
          </button>
        </div>
      </form>
      )}
    </div>
  );
};
