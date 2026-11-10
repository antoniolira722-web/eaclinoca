import React, { useState, useMemo, useRef } from 'react';
import {
  FileBarChart,
  FileText,
  Plus,
  Search,
  Printer,
  Copy,
  Check,
  Edit2,
  Trash2,
  CopyPlus,
  Eye,
  Building2,
  Calendar,
  User,
  GraduationCap,
  Sparkles,
  Award,
  BookOpen,
  HelpCircle,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  X,
  Settings,
  Mail,
  FileDown,
  Send,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import {
  RelatorioDocumento,
  TipoDocumentoClinico,
  StatusDocumentoClinico,
  Paciente,
  TabType
} from '../types';
import { calcularIdade, formatarData } from '../utils/dateUtils';
import { downloadRelatorioPDF } from '../utils/pdfGenerator';

interface RelatoriosViewProps {
  setActiveTab: (tab: TabType) => void;
  initialPatientId?: string | null;
}

const TIPOS_DOCUMENTO_INFO: Record<TipoDocumentoClinico, { label: string; desc: string; badgeColor: string }> = {
  laudo_completo: {
    label: 'Laudo Psicopedagógico Completo',
    desc: 'Avaliação diagnóstica completa com queixa, testes aplicados, síntese cognitiva e encaminhamentos.',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
  },
  parecer_psicopedagogico: {
    label: 'Parecer Técnico Psicopedagógico',
    desc: 'Documento sucinto e conclusivo sobre uma área específica ou devolutiva inicial.',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  },
  relatorio_evolucao: {
    label: 'Relatório de Evolução Clínica',
    desc: 'Acompanhamento periódico de sessões, objetivos atingidos e metas do plano de intervenção.',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  },
  relatorio_escolar: {
    label: 'Devolutiva & Orientações Escolares',
    desc: 'Diretrizes práticas para coordenadores e professores: adaptação curricular e de provas.',
    badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800'
  },
  declaracao_comparecimento: {
    label: 'Declaração de Comparecimento',
    desc: 'Comprovante oficial de presença em atendimento psicopedagógico para justificativas.',
    badgeColor: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300 border-stone-300 dark:border-stone-700'
  },
  consultoria_amamentacao: {
    label: 'Consultoria de Amamentação',
    desc: 'Manejo clínico da lactação, avaliação de pega, ordenha, ingurgitamento e laserterapia.',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
  },
  consultoria_parto: {
    label: 'Consultoria de Parto & Fisiologia',
    desc: 'Educação perinatal, fases do trabalho de parto, mobilidade pélvica e alívio da dor.',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800'
  },
  plano_parto_documento: {
    label: 'Plano de Parto Humanizado',
    desc: 'Diretrizes e preferências da gestante para a equipe obstétrica e maternidade.',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800'
  },
  parecer_enfermagem_perinatal: {
    label: 'Parecer de Enfermagem Perinatal',
    desc: 'Parecer técnico conclusivo de enfermagem obstétrica/perinatal para pediatra ou obstetra.',
    badgeColor: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800'
  }
};

const INSTRUMENTOS_SUGESTOES = [
  'EOCA (Entrevista Operativa Centrada na Aprendizagem)',
  'Provas Operatórias de Jean Piaget (Conservação, Classificação e Seriação)',
  'TDE II (Teste de Desempenho Escolar - Leitura, Escrita e Aritmética)',
  'PROLEC (Provas de Avaliação dos Processos de Leitura)',
  'Avaliação da Consciência Fonológica por Produção Oral (PCFO)',
  'Teste das Matrizes Progressivas Coloridas de Raven',
  'Escala SNAP-IV de Avaliação de Comportamento e Atenção',
  'Análise Grafomotora e Desenho da Figura Humana (DFH)',
  'Torre de Londres (Funções Executivas e Planejamento)',
  'Anamnese Psicopedagógica Familiar Estruturada',
  'Visita e Entrevista com a Equipe Pedagógica Escolar',
  // Perinatal instruments & protocols
  'Protocolo LATCH de Avaliação de Pega e Sucção Neonatal',
  'Exame Clínico das Mamas (Palpação e Conformação Papilar)',
  'Avaliação do Frênulo Lingual Neonatal (Teste da Linguinha)',
  'Laserterapia Mamária de Baixa Intensidade (Prevenção e Reparação)',
  'Treinamento de Posições para Amamentação (Tradicional, Invertida, Cavalinho)',
  'Técnicas de Alívio Não Farmacológico da Dor (Massagem, Bola Suíça e Rebozo)',
  'Diretrizes de Extração Manual e Armazenamento de Leite Materno (LMO)',
  'Elaboração de Plano de Parto Humanizado Baseado em Evidências'
];

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({
  setActiveTab,
  initialPatientId
}) => {
  const {
    state,
    addRelatorio,
    updateRelatorio,
    deleteRelatorio,
    duplicarRelatorio
  } = useClinic();

  const [activeSubTab, setActiveSubTab] = useState<'lista' | 'editor' | 'preview'>('lista');
  const [selectedTipoFilter, setSelectedTipoFilter] = useState<string>('todos');
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>(initialPatientId || 'todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  // Active document in Editor or Preview
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<RelatorioDocumento | null>(null);

  // PDF Export & Email Modal State
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfFeedback, setPdfFeedback] = useState<string | null>(null);
  const [emailModalDoc, setEmailModalDoc] = useState<RelatorioDocumento | null>(null);
  const [emailRecipientType, setEmailRecipientType] = useState<'pais' | 'escola' | 'medico' | 'personalizado'>('pais');
  const [emailCustomRecipient, setEmailCustomRecipient] = useState('');
  const [emailCustomEmail, setEmailCustomEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);

  // Form State
  const [formPacienteId, setFormPacienteId] = useState<string>(initialPatientId || (state.pacientes[0]?.id || ''));
  const [formTipo, setFormTipo] = useState<TipoDocumentoClinico>('laudo_completo');
  const [formTitulo, setFormTitulo] = useState('Laudo de Avaliação Psicopedagógica Clínica');
  const [formDataEmissao, setFormDataEmissao] = useState(new Date().toISOString().slice(0, 10));
  const [formSolicitante, setFormSolicitante] = useState('Família e Equipe Pedagógica');
  const [formFinalidade, setFormFinalidade] = useState('Investigação psicopedagógica e orientações educacionais');
  const [formQueixa, setFormQueixa] = useState('');
  const [formHistorico, setFormHistorico] = useState('');
  const [formInstrumentos, setFormInstrumentos] = useState<string[]>([
    'EOCA (Entrevista Operativa Centrada na Aprendizagem)',
    'Provas Operatórias de Jean Piaget (Conservação, Classificação e Seriação)',
    'TDE II (Teste de Desempenho Escolar - Leitura, Escrita e Aritmética)'
  ]);
  const [customInstrumentoInput, setCustomInstrumentoInput] = useState('');
  const [formComportamento, setFormComportamento] = useState('');
  const [formAnaliseCognitiva, setFormAnaliseCognitiva] = useState('');
  const [formAnalisePedagogica, setFormAnalisePedagogica] = useState('');
  const [formConclusao, setFormConclusao] = useState('');
  const [formEncaminhamentos, setFormEncaminhamentos] = useState('');
  const [formOrientacoesEscola, setFormOrientacoesEscola] = useState('');
  const [formOrientacoesFamilia, setFormOrientacoesFamilia] = useState('');
  const [formStatus, setFormStatus] = useState<StatusDocumentoClinico>('Finalizado');
  const [formTags, setFormTags] = useState<string>('Laudo, Avaliação');

  // Selected Patient Details for quick auto-fill
  const selectedPaciente = useMemo(() => {
    return state.pacientes.find(p => p.id === formPacienteId);
  }, [state.pacientes, formPacienteId]);

  // When selecting another patient in the form, automatically adapt queixa if empty
  const handlePacienteChange = (pacId: string) => {
    setFormPacienteId(pacId);
    const pac = state.pacientes.find(p => p.id === pacId);
    if (pac && !formQueixa) {
      setFormQueixa(pac.queixa || '');
    }
  };

  // Helper to pre-populate with Clinical Suggestions depending on Document Type
  const handleApplyTemplate = (tipo: TipoDocumentoClinico) => {
    setFormTipo(tipo);
    const pac = state.pacientes.find(p => p.id === formPacienteId) || state.pacientes[0];
    const pacNome = pac ? pac.nome : 'o(a) paciente';

    if (tipo === 'laudo_completo') {
      setFormTitulo(state.configuracoes?.opcoesRelatorio?.tituloPadraoLaudo || 'Laudo de Avaliação Psicopedagógica Clínica');
      setFormSolicitante('Família e Coordenação Pedagógica Escolar');
      setFormFinalidade('Investigação diagnóstica do processo de aprendizagem, funções executivas e orientações');
      if (pac) setFormQueixa(pac.queixa || '');
      setFormHistorico(`${pacNome} foi encaminhado(a) para avaliação clínica psicopedagógica com o objetivo de investigar os fatores intervenientes em seu desempenho acadêmico e desenvolvimento cognitivo.`);
      setFormInstrumentos([
        'EOCA (Entrevista Operativa Centrada na Aprendizagem)',
        'Provas Operatórias de Jean Piaget (Conservação, Classificação e Seriação)',
        'TDE II (Teste de Desempenho Escolar - Leitura, Escrita e Aritmética)',
        'PROLEC (Provas de Avaliação dos Processos de Leitura)',
        'Análise da Produção Gráfica e Psicomotricidade Fina'
      ]);
      setFormComportamento(`${pacNome} demonstrou boa receptividade ao enquadre clínico, colaborativo(a) e responsivo(a) ao reforço positivo durante as atividades propostas.`);
      setFormAnaliseCognitiva('Preservação do raciocínio lógico geral. Observa-se necessidade de mediação para tarefas que demandam atenção sustentada e memória de trabalho verbal.');
      setFormAnalisePedagogica('Desafios pontuais no processo de decodificação/fluência leitora e organização sequencial da escrita. Boa compreensão contextual quando auxiliado(a) por recursos visuais.');
      setFormConclusao(`Os dados obtidos configuram um quadro com indicativos de dificuldades específicas no processamento pedagógico, recomendando-se suporte estruturado.`);
      setFormEncaminhamentos('1. Continuidade do acompanhamento psicopedagógico clínico semanal.\n2. Avaliação fonoaudiológica / neuropsicológica complementar se indicada.');
      setFormOrientacoesEscola('• Disponibilizar tempo adicional para realização de avaliações escritas.\n• Fragmentar instruções longas em etapas curtas e diretas.\n• Permitir o uso de apoios concretos e tabelas de apoio visual.');
      setFormOrientacoesFamilia('• Estabelecer rotina diária de estudos com intervalos breves.\n• Estimular a leitura compartilhada de forma prazerosa.');
    } else if (tipo === 'parecer_psicopedagogico') {
      setFormTitulo('Parecer Técnico Psicopedagógico');
      setFormSolicitante('Equipe Multidisciplinar / Família');
      setFormFinalidade('Parecer conclusivo sobre o acompanhamento psicopedagógico e estratégias cognitivas');
      if (pac) setFormQueixa(pac.queixa || '');
      setFormInstrumentos(['EOCA', 'Análise de Produções Escolares', 'Observação Clínica Estruturada']);
      setFormAnaliseCognitiva('Observa-se boa evolução na flexibilidade cognitiva e autorregulação durante as atividades.');
      setFormConclusao(`O(A) paciente ${pacNome} apresenta condições favoráveis de aprendizagem com a manutenção das adaptações recomendadas.`);
      setFormOrientacoesEscola('• Manter a parceria família-escola-clínica para alinhamento contínuo das metas pedagógicas.');
    } else if (tipo === 'relatorio_evolucao') {
      setFormTitulo('Relatório de Evolução Psicopedagógica');
      setFormSolicitante('Família e Médicos Assistentes');
      setFormFinalidade('Registro da evolução e das intervenções clínicas realizadas');
      // Look for sessions of this patient
      const patientSessions = state.sessoes.filter(s => s.pacienteId === pac?.id);
      const patientPlans = state.planos.filter(p => p.pacienteId === pac?.id);
      const sesCount = patientSessions.length;
      
      setFormHistorico(`Até o presente momento foram realizadas ${sesCount} sessões psicopedagógicas presenciais focadas nos objetivos do plano de intervenção.`);
      setFormAnalisePedagogica(
        patientPlans.length > 0
          ? `Metas trabalhadas: ${patientPlans[0].objetivos}\nEstratégias: ${patientPlans[0].estrategias}`
          : 'Trabalho contínuo de estimulação da consciência fonológica e raciocínio lógico.'
      );
      setFormConclusao(`${pacNome} tem respondido positivamente às estratégias de mediação, alcançando avanços substanciais na autoconfiança e no engajamento acadêmico.`);
    } else if (tipo === 'relatorio_escolar') {
      setFormTitulo('Relatório de Devolutiva e Orientações Escolares');
      setFormSolicitante(`Coordenação e Professores — ${pac?.escola || 'Escola'}`);
      setFormFinalidade('Orientações psicopedagógicas para adequações metodológicas em sala de aula');
      setFormOrientacoesEscola('• Posicionar o(a) aluno(a) nas primeiras carteiras, próximo ao professor e longe de janelas/portas para minimizar distrações.\n• Provas e atividades impressas com fonte limpa e espaçamento ampliado.\n• Valorizar o raciocínio construído, permitindo explicações orais quando a escrita estiver limitada.\n• Propor pausas ativas de 1 a 2 minutos para retomada de foco.');
      setFormOrientacoesFamilia('• Manter canal de comunicação aberto com a coordenação pedagógica para acompanhamento das rotinas escolares.');
      setFormConclusao('As recomendações acima visam garantir a acessibilidade curricular e o pleno desenvolvimento das potencialidades do educando.');
    } else if (tipo === 'declaracao_comparecimento') {
      setFormTitulo('Declaração de Comparecimento Clínico');
      setFormSolicitante('Para fins de comprovação e justificativa');
      setFormFinalidade('Declaração de atendimento clínico');
      setFormConclusao(`Declaramos para os devidos fins que o(a) paciente ${pacNome}, nascido(a) em ${formatarData(pac?.nasc)}, esteve presente em atendimento clínico nesta data, no horário das 14:00 às 15:00.`);
    } else if (tipo === 'consultoria_amamentacao') {
      const dp = pac?.dadosPerinatais;
      const bebeInfo = dp?.nomeBebe ? `do bebê ${dp.nomeBebe}` : 'do recém-nascido';
      setFormTitulo('Relatório de Consultoria em Amamentação & Manejo Clínico');
      setFormSolicitante('Família e Pediatra Assistente');
      setFormFinalidade('Avaliação clínica da mamada, manejo da lactação e orientações para o aleitamento materno exclusivo');
      setFormQueixa(pac?.queixa || 'Dificuldades no estabelecimento da amamentação, dor mamária e dúvidas sobre ingurgitamento e pega.');
      setFormHistorico(`Puérpera compareceu à consultoria com queixa no processo de amamentação ${bebeInfo}. Histórico obstétrico revisado sem intercorrências graves no pós-parto imediato.`);
      setFormInstrumentos([
        'Protocolo LATCH de Avaliação de Pega e Sucção Neonatal',
        'Exame Clínico das Mamas (Palpação e Conformação Papilar)',
        'Avaliação do Frênulo Lingual Neonatal (Teste da Linguinha)',
        'Treinamento de Posições para Amamentação (Tradicional, Invertida, Cavalinho)'
      ]);
      setFormComportamento('Mãe receptiva às orientações práticas. Bebê demonstrou reflexos de busca e sucção preservados, colaborativo nas mudanças de posicionamento.');
      setFormAnaliseCognitiva('Avaliação de Pega e Sucção: Abocanhamento corrigido para assimetria favorável, lábios evertidos ("boca de peixinho"), bochechas arredondadas sem ruídos de estalo. Deglutição com pausas ritmadas audíveis.');
      setFormAnalisePedagogica('Exame das Mamas e Conduta: Mamas túrgidas sem sinais flogísticos de mastite. Papilas íntegras após correção de pega. Realizada massagem preventiva e técnica de alívio por pressão areolar de Cotterman.');
      setFormConclusao(`Quadro de adaptação favorável à lactação com prognóstico positivo para consolidação do Aleitamento Materno Exclusivo (AME). A mãe demonstra segurança técnica após o treino prático.`);
      setFormEncaminhamentos('1. Continuidade do acompanhamento de rotina com o(a) pediatra assistente.\n2. Retorno para reavaliação de ganho de peso e mamada em 7 a 10 dias se necessário.');
      setFormOrientacoesEscola('• Orientações para a maternidade/berçário: priorizar aleitamento em livre demanda e evitar bicos artificiais (chupetas/mamadeiras).');
      setFormOrientacoesFamilia('• Amamentar em livre demanda respeitando os sinais precoces de fome (levar mão à boca, movimentos de busca).\n• Realizar massagens circulares suaves antes das mamadas caso a mama esteja excessivamente tensa.\n• Apoio ativo do(a) parceiro(a) no descanso materno e na hidratação contínua.');
    } else if (tipo === 'consultoria_parto') {
      const dp = pac?.dadosPerinatais;
      const semGest = dp?.semanasGestacao || 'em idade gestacional avançada';
      setFormTitulo('Relatório de Consultoria de Parto & Educação Perinatal');
      setFormSolicitante('Gestante e Rede de Apoio Familiar');
      setFormFinalidade('Educação perinatal, biomecânica da pelve, fisiologia do trabalho de parto e plano de alívio da dor');
      setFormQueixa(pac?.queixa || 'Busca por preparação física e emocional para o parto vaginal humanizado e esclarecimento de dúvidas sobre intervenções.');
      setFormHistorico(`Gestante ${semGest} em acompanhamento pré-natal, desejando assistência informada e baseada em evidências científicas para o nascimento.`);
      setFormInstrumentos([
        'Técnicas de Alívio Não Farmacológico da Dor (Massagem, Bola Suíça e Rebozo)',
        'Exercícios de Mobilidade Pélvica e Posicionamento Fetal',
        'Treinamento de Respiração Fisiológica para o Período Expulsivo',
        'Elaboração de Plano de Parto Humanizado Baseado em Evidências'
      ]);
      setFormComportamento('Gestante e acompanhante participativos, demonstrando excelente assimilação das posturas e dos papéis durante cada estágio do parto.');
      setFormAnaliseCognitiva('Biomecânica e Movimentação: Excelente compreensão da mobilidade sacral e posições verticais (quatro apoios, cócoras assistidas, semi-sentada) para facilitar a descida fetal.');
      setFormAnalisePedagogica('Manejo da Dor e Relaxamento: Orientadas técnicas de hidroterapia morna, massagem sacral com pressão contínua e respiração diafragmática para preservação da energia.');
      setFormConclusao('Gestante plenamente orientada e empoderada sobre a fisiologia do trabalho de parto, critérios para admissão hospitalar na fase ativa e prevenção de intervenções desnecessárias.');
      setFormEncaminhamentos('1. Manutenção do pré-natal com a equipe obstétrica assistente.\n2. Integração do plano de parto na pasta da maternidade.');
      setFormOrientacoesEscola('• Diretrizes para equipe hospitalar/maternidade: ambiente calmo, penumbra, liberdade de movimento e clampeamento tardio do cordão.');
      setFormOrientacoesFamilia('• Praticar os exercícios com a bola suíça diariamente (15 a 20 minutos).\n• Manter o plano de parto impresso em 3 vias na mala da maternidade.\n• Reconhecer os sinais de fase ativa (contrações regulares a cada 3 a 4 minutos durando 60 segundos).');
    } else if (tipo === 'plano_parto_documento') {
      const dp = pac?.dadosPerinatais;
      const hosp = dp?.hospitalMaternidade || 'Maternidade de Escolha';
      setFormTitulo('Plano de Parto Humanizado & Diretrizes Assistenciais');
      setFormSolicitante(`Equipe Obstétrica e de Enfermagem — ${hosp}`);
      setFormFinalidade('Registro formal dos desejos, preferências e escolhas baseadas em evidências para o trabalho de parto, parto e pós-parto');
      setFormQueixa('Documento de planejamento perinatal elaborado pela gestante com suporte da Enfermeira Educadora Perinatal.');
      setFormHistorico(`Gestante com pré-natal de risco habitual, plenamente informada sobre seus direitos assegurados pelas diretrizes da OMS e do Ministério da Saúde.`);
      setFormInstrumentos([
        'Elaboração de Plano de Parto Humanizado Baseado em Evidências',
        'Diretrizes de Boas Práticas de Atenção ao Parto e Nascimento (MS/OMS)'
      ]);
      setFormComportamento('Acompanhante de livre escolha presente em todos os momentos (Lei Federal nº 11.108/2005).');
      setFormAnaliseCognitiva('Trabalho de Parto: Liberdade de movimento e posições verticais; oferta de líquidos e alimentos leves; métodos não farmacológicos de alívio da dor (chuveiro morno, massagens, bola); evitar amniotomia e ocitocina de rotina.');
      setFormAnalisePedagogica('Parto & Período Expulsivo: Escolha da posição para parir (semi-sentada, lateralizada ou 4 apoios); puxos espontâneos; NÃO realizar episiotomia de rotina ou manobra de Kristeller.');
      setFormConclusao('Cuidados com o Recém-Nascido: Contato pele a pele imediato e ininterrupto na primeira hora de vida ("Golden Hour"); clampeamento oportuno/tardio do cordão umbilical após cessar os batimentos; amamentação na primeira hora; procedimentos de rotina (vitamina K, nitrato de prata, medidas) realizados no colo da mãe ou após o vínculo inicial.');
      setFormEncaminhamentos('Em caso de necessidade de cesariana indicada por critérios médicos: presença do acompanhante, rebaixamento do campo cirúrgico no nascimento, amamentação na sala de recuperação.');
      setFormOrientacoesEscola(`• Documento a ser anexado ao prontuário médico na admissão na maternidade ${hosp}.`);
      setFormOrientacoesFamilia('• Levar 3 cópias impressas e assinadas na bolsa da maternidade.');
    } else if (tipo === 'parecer_enfermagem_perinatal') {
      const dp = pac?.dadosPerinatais;
      setFormTitulo('Parecer Técnico de Enfermagem Perinatal & Obstétrica');
      setFormSolicitante('Obstetra Assistente / Pediatra / Família');
      setFormFinalidade('Parecer conclusivo sobre avaliação clínica puerperal, involução uterina, mamas e amamentação');
      setFormQueixa(pac?.queixa || 'Avaliação pós-parto e consultoria especializada de enfermagem perinatal.');
      setFormHistorico(`Avaliação clínica domiciliar/ambulatorial de enfermagem realizada em puérpera e recém-nascido.`);
      setFormInstrumentos([
        'Exame Físico Obstétrico & Puerperal de Enfermagem',
        'Protocolo LATCH de Avaliação de Pega e Sucção Neonatal',
        'Avaliação de Ferida Operatória / Períneo'
      ]);
      setFormComportamento('Puérpera orientada, hemodinamicamente estável, boa interação com o recém-nascido e rede de apoio presente.');
      setFormAnaliseCognitiva('Avaliação de Enfermagem: Sinais vitais estáveis, involução uterina fisiológica (globo de segurança palpável abaixo da cicatriz umbilical), lóquios fisiológicos rubros/serosos sem odor fétido.');
      setFormAnalisePedagogica('Mamas e Lactação: Mamas simétricas, flexíveis, sem fissuras sangrantes. Pega adequada com sucção efetiva e deglutição coordenada. Diurese e eliminações do recém-nascido presentes e adequadas.');
      setFormConclusao('Evolução puerperal fisiológica e amamentação em livre demanda estabelecida com sucesso. Ausência de sinais de alerta infeccioso ou hemorrágico.');
      setFormEncaminhamentos('1. Manutenção das consultas de revisão puerperal e puericultura.\n2. Manutenção do aleitamento materno exclusivo.');
      setFormOrientacoesEscola('• Disponibilizar suporte contínuo via canal da clínica para dúvidas de amamentação.');
      setFormOrientacoesFamilia('• Observar sinais de alerta (febre > 37.8°C, sangramento excessivo com coágulos grandes, dor intensa em mamas).\n• Manter repouso relativo e boa ingesta hídrica.');
    }
  };

  // Open Editor to create new
  const handleOpenNewDocument = (pacienteId?: string, tipoDoc?: TipoDocumentoClinico) => {
    const targetPacId = pacienteId || formPacienteId || (state.pacientes[0]?.id || '');
    setFormPacienteId(targetPacId);
    setCurrentDocId(null);
    const chosenTipo = tipoDoc || 'laudo_completo';
    handleApplyTemplate(chosenTipo);
    setFormStatus('Finalizado');
    setActiveSubTab('editor');
  };

  // Open Editor to edit existing
  const handleEditDocument = (doc: RelatorioDocumento) => {
    setCurrentDocId(doc.id);
    setFormPacienteId(doc.pacienteId);
    setFormTipo(doc.tipo);
    setFormTitulo(doc.titulo);
    setFormDataEmissao(doc.dataEmissao);
    setFormSolicitante(doc.solicitante || '');
    setFormFinalidade(doc.finalidade || '');
    setFormQueixa(doc.queixaPrincipal || '');
    setFormHistorico(doc.historicoBreve || '');
    setFormInstrumentos(doc.instrumentosUtilizados || []);
    setFormComportamento(doc.observacoesComportamentais || '');
    setFormAnaliseCognitiva(doc.analiseCognitiva || '');
    setFormAnalisePedagogica(doc.analisePedagogica || '');
    setFormConclusao(doc.conclusaoHipotese || '');
    setFormEncaminhamentos(doc.encaminhamentos || '');
    setFormOrientacoesEscola(doc.orientacoesEscola || '');
    setFormOrientacoesFamilia(doc.orientacoesFamilia || '');
    setFormStatus(doc.status);
    setFormTags((doc.tags || []).join(', '));
    setActiveSubTab('editor');
  };

  // Open Preview Modal / Full View
  const handlePreviewDocument = (doc: RelatorioDocumento) => {
    setPreviewDoc(doc);
    setActiveSubTab('preview');
  };

  // Toggle instrument badge
  const handleToggleInstrument = (inst: string) => {
    if (formInstrumentos.includes(inst)) {
      setFormInstrumentos(formInstrumentos.filter(i => i !== inst));
    } else {
      setFormInstrumentos([...formInstrumentos, inst]);
    }
  };

  // Add custom instrument
  const handleAddCustomInstrument = () => {
    if (!customInstrumentoInput.trim()) return;
    if (!formInstrumentos.includes(customInstrumentoInput.trim())) {
      setFormInstrumentos([...formInstrumentos, customInstrumentoInput.trim()]);
    }
    setCustomInstrumentoInput('');
  };

  // Save Document
  const handleSaveDocument = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formPacienteId) {
      alert('Selecione um paciente para o documento.');
      return;
    }
    if (!formTitulo.trim()) {
      alert('Informe o título do documento.');
      return;
    }

    const tagsArray = formTags.split(',').map(t => t.trim()).filter(Boolean);

    const docData: Omit<RelatorioDocumento, 'id'> = {
      pacienteId: formPacienteId,
      tipo: formTipo,
      titulo: formTitulo.trim(),
      dataEmissao: formDataEmissao,
      solicitante: formSolicitante.trim(),
      finalidade: formFinalidade.trim(),
      queixaPrincipal: formQueixa.trim(),
      historicoBreve: formHistorico.trim(),
      instrumentosUtilizados: formInstrumentos,
      observacoesComportamentais: formComportamento.trim(),
      analiseCognitiva: formAnaliseCognitiva.trim(),
      analisePedagogica: formAnalisePedagogica.trim(),
      conclusaoHipotese: formConclusao.trim(),
      encaminhamentos: formEncaminhamentos.trim(),
      orientacoesEscola: formOrientacoesEscola.trim(),
      orientacoesFamilia: formOrientacoesFamilia.trim(),
      status: formStatus,
      tags: tagsArray
    };

    if (currentDocId) {
      await updateRelatorio(currentDocId, docData);
      const updatedDoc: RelatorioDocumento = { id: currentDocId, ...docData };
      setPreviewDoc(updatedDoc);
    } else {
      const newId = await addRelatorio(docData);
      const newDoc: RelatorioDocumento = { id: newId, ...docData };
      setPreviewDoc(newDoc);
    }

    setActiveSubTab('preview');
  };

  // Duplicate
  const handleDuplicate = async (id: string) => {
    const newId = await duplicarRelatorio(id);
    const duplicated = (state.relatorios || []).find(r => r.id === newId);
    if (duplicated) {
      handleEditDocument(duplicated);
    }
  };

  // Delete
  const handleDelete = async (id: string, titulo: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o documento "${titulo}"?`)) {
      await deleteRelatorio(id);
      if (previewDoc?.id === id) {
        setPreviewDoc(null);
        setActiveSubTab('lista');
      }
    }
  };

  // Download formatted PDF
  const handleDownloadPDF = (doc: RelatorioDocumento) => {
    setIsExportingPdf(true);
    try {
      const pac = state.pacientes.find(p => p.id === doc.pacienteId);
      downloadRelatorioPDF({
        doc,
        paciente: pac,
        configuracoes: state.configuracoes
      });
      setPdfFeedback(`PDF "${doc.titulo}" gerado e baixado com sucesso!`);
      setTimeout(() => setPdfFeedback(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Não foi possível gerar o arquivo PDF. Verifique os dados e tente novamente.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Prepare and open Email Modal
  const handleOpenEmailModal = (doc: RelatorioDocumento) => {
    const pac = state.pacientes.find(p => p.id === doc.pacienteId);
    const cfg = state.configuracoes;
    setEmailModalDoc(doc);
    setEmailRecipientType('pais');
    setEmailCustomRecipient(pac?.resp || '');
    setEmailCustomEmail('');
    setEmailSubject(`[Documento Psicopedagógico] ${doc.titulo} — ${pac?.nome || 'Paciente'}`);

    const draft = generateEmailDraft('pais', doc, pac, cfg);
    setEmailBody(draft);
  };

  // Helper to generate formal email text
  const generateEmailDraft = (
    type: 'pais' | 'escola' | 'medico' | 'personalizado',
    doc: RelatorioDocumento,
    pac?: Paciente,
    cfg?: any
  ) => {
    const pacNome = pac?.nome || 'o(a) paciente';
    const profNome = cfg?.profissional || 'Ester Lopes';
    const regProf = cfg?.registroProfissional || 'ABPp 4821/SP';
    const clinicaNome = cfg?.nomeClinica || 'EA — Clínica Psicopedagógica';
    const contato = cfg?.contato || '';

    let saudacao = 'Prezados pais e responsáveis,';
    if (type === 'escola') saudacao = `Prezada Coordenação Pedagógica e Corpo Docente (${pac?.escola || 'Escola'}),`;
    if (type === 'medico') saudacao = 'Prezada Equipe Médica / Multidisciplinar assistente,';
    if (type === 'personalizado') saudacao = 'Prezados,';

    let corpo = `${saudacao}\n\n`;
    corpo += `Espero que este e-mail os encontre bem.\n\n`;
    corpo += `Encaminho em anexo o documento clínico oficial em formato PDF referente ao acompanhamento psicopedagógico de ${pacNome}:\n\n`;
    corpo += `• Documento: ${doc.titulo}\n`;
    corpo += `• Tipo: ${TIPOS_DOCUMENTO_INFO[doc.tipo]?.label || doc.tipo}\n`;
    corpo += `• Data de Emissão: ${formatarData(doc.dataEmissao)}\n`;
    if (doc.finalidade) corpo += `• Finalidade: ${doc.finalidade}\n`;
    corpo += `• Profissional Responsável: ${profNome} (${regProf})\n\n`;

    if (doc.conclusaoHipotese) {
      corpo += `Síntese / Conclusão Clínica:\n"${doc.conclusaoHipotese}"\n\n`;
    }

    if (type === 'escola' && doc.orientacoesEscola) {
      corpo += `Orientações e Adequações Práticas para o Ambiente Escolar:\n${doc.orientacoesEscola}\n\n`;
    }

    corpo += `O documento completo em anexo contém a bateria de instrumentos aplicados, a análise dos processos de aprendizagem e as orientações detalhadas.\n\n`;
    corpo += `Permanecemos à inteira disposição para reuniões de alinhamento, esclarecimento de dúvidas e continuidade da parceria terapêutica.\n\n`;
    corpo += `Atenciosamente,\n\n`;
    corpo += `${profNome}\n`;
    corpo += `Psicopedagoga Clínica — ${regProf}\n`;
    corpo += `${clinicaNome}\n`;
    if (contato) corpo += `Contato: ${contato}\n`;

    return corpo;
  };

  // Change recipient in email modal
  const handleRecipientTypeChange = (type: 'pais' | 'escola' | 'medico' | 'personalizado') => {
    setEmailRecipientType(type);
    if (!emailModalDoc) return;
    const pac = state.pacientes.find(p => p.id === emailModalDoc.pacienteId);
    const cfg = state.configuracoes;

    if (type === 'pais') setEmailCustomRecipient(pac?.resp || '');
    else if (type === 'escola') setEmailCustomRecipient(pac?.escola || 'Coordenação Escolar');
    else if (type === 'medico') setEmailCustomRecipient('Dr(a). Médico(a) Assistente');
    else setEmailCustomRecipient('');

    setEmailBody(generateEmailDraft(type, emailModalDoc, pac, cfg));
  };

  // Copy Email Text
  const handleCopyEmailText = () => {
    navigator.clipboard.writeText(emailBody);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2500);
  };

  // Open default mail client (mailto) and trigger PDF download simultaneously
  const handleOpenMailClient = () => {
    if (!emailModalDoc) return;
    // 1. Download the PDF so user can attach it
    handleDownloadPDF(emailModalDoc);

    // 2. Open mailto
    const subjectEncoded = encodeURIComponent(emailSubject);
    const bodyEncoded = encodeURIComponent(emailBody);
    const recipientEncoded = encodeURIComponent(emailCustomEmail.trim());

    const mailtoUrl = `mailto:${recipientEncoded}?subject=${subjectEncoded}&body=${bodyEncoded}`;
    window.location.href = mailtoUrl;
  };

  // Trigger Print
  const handlePrint = () => {
    window.print();
  };

  // Copy plain formatted text of report
  const handleCopyReportText = (doc: RelatorioDocumento) => {
    const pac = state.pacientes.find(p => p.id === doc.pacienteId);
    const cfg = state.configuracoes;

    let text = `${cfg.nomeClinica.toUpperCase()}\n`;
    text += `${cfg.profissional} — ${cfg.registroProfissional}\n`;
    text += `${cfg.contato} | ${cfg.endereco}\n\n`;
    text += `==========================================================\n`;
    text += `${doc.titulo.toUpperCase()}\n`;
    text += `==========================================================\n\n`;
    text += `DADOS DE IDENTIFICAÇÃO:\n`;
    text += `• Paciente: ${pac?.nome || '—'}\n`;
    text += `• Data de Nascimento: ${formatarData(pac?.nasc)} (${calcularIdade(pac?.nasc)})\n`;
    if (pac?.escola) text += `• Escola: ${pac.escola} (${pac.serie || '—'})\n`;
    text += `• Responsável: ${pac?.resp || '—'} (${pac?.fone || '—'})\n`;
    if (doc.solicitante) text += `• Solicitante: ${doc.solicitante}\n`;
    if (doc.finalidade) text += `• Finalidade: ${doc.finalidade}\n`;
    text += `• Data de Emissão: ${formatarData(doc.dataEmissao)}\n\n`;

    if (doc.queixaPrincipal) {
      text += `1. QUEIXA PRINCIPAL & DEMANDA INICIAL:\n${doc.queixaPrincipal}\n\n`;
    }
    if (doc.historicoBreve) {
      text += `2. BREVE HISTÓRICO & ANAMNESE:\n${doc.historicoBreve}\n\n`;
    }
    if (doc.instrumentosUtilizados && doc.instrumentosUtilizados.length > 0) {
      text += `3. INSTRUMENTOS E PROCEDIMENTOS DE AVALIAÇÃO:\n`;
      doc.instrumentosUtilizados.forEach(inst => {
        text += `• ${inst}\n`;
      });
      text += `\n`;
    }
    if (doc.observacoesComportamentais) {
      text += `4. OBSERVAÇÕES COMPORTAMENTAIS & VÍNCULO:\n${doc.observacoesComportamentais}\n\n`;
    }
    if (doc.analiseCognitiva) {
      text += `5. ANÁLISE DOS DOMÍNIOS COGNITIVOS & FUNÇÕES EXECUTIVAS:\n${doc.analiseCognitiva}\n\n`;
    }
    if (doc.analisePedagogica) {
      text += `6. ANÁLISE PEDAGÓGICA (LEITURA, ESCRITA E CÁLCULO):\n${doc.analisePedagogica}\n\n`;
    }
    if (doc.conclusaoHipotese) {
      text += `7. CONCLUSÃO & SÍNTESE PSICOPEDAGÓGICA:\n${doc.conclusaoHipotese}\n\n`;
    }
    if (doc.encaminhamentos) {
      text += `8. ENCAMINHAMENTOS MULTIDISCIPLINARES:\n${doc.encaminhamentos}\n\n`;
    }
    if (doc.orientacoesEscola) {
      text += `9. ORIENTAÇÕES E ADAPTAÇÕES PARA A ESCOLA:\n${doc.orientacoesEscola}\n\n`;
    }
    if (doc.orientacoesFamilia) {
      text += `10. ORIENTAÇÕES PARA A FAMÍLIA:\n${doc.orientacoesFamilia}\n\n`;
    }

    const cidade = cfg.opcoesRelatorio?.cidadePadrao || 'São Paulo - SP';
    const dataExtenso = new Date(doc.dataEmissao + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    text += `${cidade}, ${dataExtenso}.\n\n`;
    text += `_____________________________________________\n`;
    text += `${cfg.profissional}\n`;
    text += `${cfg.registroProfissional}\n`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Filtered List of Documents
  const filteredRelatorios = useMemo(() => {
    const list = state.relatorios || [];
    return list.filter(rel => {
      // Patient filter
      if (selectedPatientFilter !== 'todos' && rel.pacienteId !== selectedPatientFilter) {
        return false;
      }
      // Type filter
      if (selectedTipoFilter !== 'todos' && rel.tipo !== selectedTipoFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'todos' && rel.status !== statusFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const pac = state.pacientes.find(p => p.id === rel.pacienteId);
        const pacName = pac?.nome.toLowerCase() || '';
        const tit = rel.titulo.toLowerCase();
        const queixa = (rel.queixaPrincipal || '').toLowerCase();
        const conclusao = (rel.conclusaoHipotese || '').toLowerCase();
        return pacName.includes(term) || tit.includes(term) || queixa.includes(term) || conclusao.includes(term);
      }
      return true;
    });
  }, [state.relatorios, state.pacientes, selectedPatientFilter, selectedTipoFilter, statusFilter, searchTerm]);

  // Statistics
  const totalDocs = (state.relatorios || []).length;
  const laudosCount = (state.relatorios || []).filter(r => r.tipo === 'laudo_completo').length;
  const escolarCount = (state.relatorios || []).filter(r => r.tipo === 'relatorio_escolar').length;
  const evolucaoCount = (state.relatorios || []).filter(r => r.tipo === 'relatorio_evolucao').length;

  return (
    <div className="space-y-6">
      {/* Toast / Notification feedback */}
      {pdfFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-emerald-50 px-4 py-3 rounded-2xl shadow-xl border border-emerald-700 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-bold">{pdfFeedback}</span>
        </div>
      )}
      {/* View Header with Print Rules */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <FileBarChart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Relatórios, Laudos & Pareceres
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Emissão de laudos psicopedagógicos, pareceres técnicos, relatórios de evolução e orientações escolares
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeSubTab !== 'lista' && (
            <button
              onClick={() => setActiveSubTab('lista')}
              className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Ver Histórico</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('configuracoes')}
            className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Configurar opções de cabeçalho, rodapé e instrumentos padrão"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Opções de Laudos</span>
          </button>

          <button
            onClick={() => handleOpenNewDocument()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Laudo / Relatório</span>
          </button>
        </div>
      </div>

      {/* Top Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-1 print:hidden">
        <button
          onClick={() => setActiveSubTab('lista')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'lista'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documentos Emitidos ({totalDocs})</span>
        </button>

        <button
          onClick={() => {
            if (!currentDocId) handleOpenNewDocument();
            else setActiveSubTab('editor');
          }}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'editor'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Edit2 className="w-4 h-4" />
          <span>{currentDocId ? 'Editando Documento' : 'Gerador / Criar Novo'}</span>
        </button>

        {previewDoc && (
          <button
            onClick={() => setActiveSubTab('preview')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'preview'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Papel Timbrado & Impressão</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LISTA / HISTÓRICO DE DOCUMENTOS                                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'lista' && (
        <div className="space-y-5">
          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
              <span className="text-[11px] font-semibold text-stone-400 block">TOTAL EMITIDOS</span>
              <p className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">{totalDocs}</p>
            </div>
            <div className="p-3.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
              <span className="text-[11px] font-semibold text-indigo-500 block">LAUDOS CLÍNICOS</span>
              <p className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-0.5">{laudosCount}</p>
            </div>
            <div className="p-3.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
              <span className="text-[11px] font-semibold text-sky-500 block">DEVOLUTIVAS ESCOLARES</span>
              <p className="text-xl font-bold text-sky-700 dark:text-sky-400 mt-0.5">{escolarCount}</p>
            </div>
            <div className="p-3.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
              <span className="text-[11px] font-semibold text-amber-500 block">RELATÓRIOS DE EVOLUÇÃO</span>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-0.5">{evolucaoCount}</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar por paciente, hipótese, conteúdo ou escola..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              />
            </div>

            {/* Selects */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedPatientFilter}
                onChange={(e) => setSelectedPatientFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              >
                <option value="todos">Todos os Pacientes</option>
                {state.pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>

              <select
                value={selectedTipoFilter}
                onChange={(e) => setSelectedTipoFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="laudo_completo">Laudo Completo</option>
                <option value="parecer_psicopedagogico">Parecer Técnico</option>
                <option value="relatorio_evolucao">Relatório de Evolução</option>
                <option value="relatorio_escolar">Devolutiva Escolar</option>
                <option value="declaracao_comparecimento">Declaração</option>
                <option value="consultoria_amamentacao">Consultoria de Amamentação</option>
                <option value="consultoria_parto">Consultoria de Parto</option>
                <option value="plano_parto_documento">Plano de Parto</option>
                <option value="parecer_enfermagem_perinatal">Parecer Enfermagem</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              >
                <option value="todos">Todos os Status</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Rascunho">Rascunho</option>
                <option value="Entregue">Entregue</option>
              </select>
            </div>
          </div>

          {/* List Cards */}
          {filteredRelatorios.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-800 rounded-3xl space-y-4">
              <FileBarChart className="w-12 h-12 text-stone-400 mx-auto opacity-50" />
              <div>
                <h3 className="font-bold text-stone-700 dark:text-stone-200 text-base">
                  Nenhum documento encontrado
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  {searchTerm || selectedPatientFilter !== 'todos' || selectedTipoFilter !== 'todos'
                    ? 'Nenhum laudo corresponde aos filtros aplicados. Tente limpar os filtros.'
                    : 'Gere laudos psicopedagógicos e pareceres clínicos estruturados com facilidade.'}
                </p>
              </div>
              <button
                onClick={() => handleOpenNewDocument()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Primeiro Laudo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRelatorios.map((doc) => {
                const pac = state.pacientes.find(p => p.id === doc.pacienteId);
                const infoTipo = TIPOS_DOCUMENTO_INFO[doc.tipo];

                return (
                  <div
                    key={doc.id}
                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 shadow-2xs group"
                  >
                    <div className="space-y-2.5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${infoTipo.badgeColor}`}>
                          {infoTipo.label}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          doc.status === 'Finalizado'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : doc.status === 'Entregue'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                        }`}>
                          {doc.status}
                        </span>
                      </div>

                      {/* Title & Patient */}
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {doc.titulo}
                        </h3>
                        <p className="text-xs text-stone-600 dark:text-stone-300 font-semibold mt-0.5 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-stone-400" />
                          <span>{pac?.nome || 'Paciente não identificado'}</span>
                          {pac?.nasc && (
                            <span className="text-stone-400 font-normal">
                              ({calcularIdade(pac.nasc)})
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Brief preview text */}
                      {(doc.conclusaoHipotese || doc.queixaPrincipal) && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed bg-stone-50 dark:bg-stone-800/40 p-2 rounded-xl">
                          {doc.conclusaoHipotese || doc.queixaPrincipal}
                        </p>
                      )}

                      {/* Instruments tags */}
                      {doc.instrumentosUtilizados && doc.instrumentosUtilizados.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {doc.instrumentosUtilizados.slice(0, 3).map((inst, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2 py-0.5 rounded-lg"
                            >
                              {inst.split('(')[0].trim()}
                            </span>
                          ))}
                          {doc.instrumentosUtilizados.length > 3 && (
                            <span className="text-[10px] text-stone-400 font-medium px-1">
                              +{doc.instrumentosUtilizados.length - 3} mais
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer / Actions */}
                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-stone-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Emissão: {formatarData(doc.dataEmissao)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDownloadPDF(doc)}
                          disabled={isExportingPdf}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          title="Baixar Laudo em formato PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Baixar PDF</span>
                          <span className="sm:hidden">PDF</span>
                        </button>

                        <button
                          onClick={() => handleOpenEmailModal(doc)}
                          className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Preparar envio por e-mail com modelo e anexo"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">E-mail</span>
                        </button>

                        <button
                          onClick={() => handlePreviewDocument(doc)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Visualizar Papel Timbrado e Imprimir"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Visualizar</span>
                        </button>

                        <button
                          onClick={() => handleEditDocument(doc)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDuplicate(doc.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title="Duplicar como novo"
                        >
                          <CopyPlus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(doc.id, doc.titulo)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EDITOR / GERADOR CLÍNICO                                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'editor' && (
        <form onSubmit={handleSaveDocument} className="space-y-6">
          {/* Top Quick Actions / Templates */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                SELECIONE O TIPO DE DOCUMENTO / MODELO RÁPIDO:
              </span>

              <span className="text-[11px] text-stone-400">
                Altera automaticamente os campos com sugestões psicopedagógicas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {(Object.keys(TIPOS_DOCUMENTO_INFO) as TipoDocumentoClinico[]).map((t) => {
                const isSelected = formTipo === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleApplyTemplate(t)}
                    className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold shadow-2xs'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <p className="text-xs leading-tight">{TIPOS_DOCUMENTO_INFO[t].label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Document Main Information */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              1. Identificação do Paciente & Documento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Paciente *
                </label>
                <select
                  value={formPacienteId}
                  onChange={(e) => handlePacienteChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold"
                  required
                >
                  {state.pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} ({calcularIdade(p.nasc)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Título do Documento *
                </label>
                <input
                  type="text"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Data de Emissão *
                </label>
                <input
                  type="date"
                  value={formDataEmissao}
                  onChange={(e) => setFormDataEmissao(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                  required
                />
              </div>
            </div>

            {selectedPaciente && (
              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60">
                <div>
                  <span className="text-stone-400 block text-[10px]">Nascimento / Idade:</span>
                  <strong>{formatarData(selectedPaciente.nasc)} ({calcularIdade(selectedPaciente.nasc)})</strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Escola / Série:</span>
                  <strong>{selectedPaciente.escola || '—'} {selectedPaciente.serie ? `(${selectedPaciente.serie})` : ''}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Responsável:</span>
                  <strong>{selectedPaciente.resp}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Telefone de Contato:</span>
                  <strong>{selectedPaciente.fone || '—'}</strong>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Solicitante
                </label>
                <input
                  type="text"
                  value={formSolicitante}
                  onChange={(e) => setFormSolicitante(e.target.value)}
                  placeholder="Ex: Família, Neuropediatra, Escola Monteiro Lobato"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Finalidade do Documento
                </label>
                <input
                  type="text"
                  value={formFinalidade}
                  onChange={(e) => setFormFinalidade(e.target.value)}
                  placeholder="Ex: Avaliação Psicopedagógica e Orientações Escolares"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
          </div>

          {/* Assessment Instruments Selector */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                2. Instrumentos & Bateria de Testes Utilizados
              </h3>
              <span className="text-[11px] text-stone-400">
                {formInstrumentos.length} selecionado(s)
              </span>
            </div>

            <p className="text-xs text-stone-500">
              Clique nos testes aplicados para adicionar ou remover do laudo:
            </p>

            <div className="flex flex-wrap gap-1.5">
              {INSTRUMENTOS_SUGESTOES.map((inst) => {
                const isSelected = formInstrumentos.includes(inst);
                return (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => handleToggleInstrument(inst)}
                    className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{inst}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Instrument Adder */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={customInstrumentoInput}
                onChange={(e) => setCustomInstrumentoInput(e.target.value)}
                placeholder="Adicionar outro instrumento ou teste específico..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              />
              <button
                type="button"
                onClick={handleAddCustomInstrument}
                className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
              >
                Adicionar Teste
              </button>
            </div>
          </div>

          {/* Structured Clinical Sections */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 space-y-5">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              3. Conteúdo Clínico & Análise Psicopedagógica
            </h3>

            {/* Queixa */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Queixa Principal & Motivo do Encaminhamento
                </label>
                {selectedPaciente?.queixa && (
                  <button
                    type="button"
                    onClick={() => setFormQueixa(selectedPaciente.queixa)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                  >
                    Usar queixa do cadastro do paciente
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                value={formQueixa}
                onChange={(e) => setFormQueixa(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 leading-relaxed"
                placeholder="Descreva a queixa trazida pelos pais, escola ou paciente..."
              />
            </div>

            {/* Histórico Breve */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Breve Histórico & Anamnese
              </label>
              <textarea
                rows={3}
                value={formHistorico}
                onChange={(e) => setFormHistorico(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 leading-relaxed"
                placeholder="Histórico do desenvolvimento, marcos da linguagem, início da vida escolar..."
              />
            </div>

            {/* Comportamento e Vínculo */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Observações Comportamentais & Vínculo com a Aprendizagem
              </label>
              <textarea
                rows={3}
                value={formComportamento}
                onChange={(e) => setFormComportamento(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 leading-relaxed"
                placeholder="Postura diante do enquadre clínico, tolerância à frustração, engajamento e motivação..."
              />
            </div>

            {/* Análise Cognitiva */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Análise Cognitiva & Funções Executivas (Atenção, Memória, Flexibilidade, Planejamento)
              </label>
              <textarea
                rows={4}
                value={formAnaliseCognitiva}
                onChange={(e) => setFormAnaliseCognitiva(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 leading-relaxed"
                placeholder="Desempenho nas provas piagetianas, memória operacional, velocidade de processamento..."
              />
            </div>

            {/* Análise Pedagógica */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Análise Pedagógica (Leitura, Escrita, Raciocínio Matemático, Psicomotricidade)
              </label>
              <textarea
                rows={4}
                value={formAnalisePedagogica}
                onChange={(e) => setFormAnalisePedagogica(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 leading-relaxed"
                placeholder="Nível de escrita, rotas de leitura (fonológica/lexical), compreensão textual, cálculo e psicomotricidade fina..."
              />
            </div>

            {/* Conclusão / Hipótese */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Conclusão & Síntese Psicopedagógica (Hipótese Diagnóstica)
              </label>
              <textarea
                rows={4}
                value={formConclusao}
                onChange={(e) => setFormConclusao(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 text-stone-900 dark:text-stone-100 font-medium leading-relaxed"
                placeholder="Síntese dos resultados, perfil psicopedagógico, hipótese diagnóstica de aprendizagem..."
              />
            </div>

            {/* Encaminhamentos */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Encaminhamentos Multidisciplinares
              </label>
              <textarea
                rows={3}
                value={formEncaminhamentos}
                onChange={(e) => setFormEncaminhamentos(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 leading-relaxed"
                placeholder="Neuropediatra, Fonoaudiologia, Terapia Ocupacional, Psicoterapia..."
              />
            </div>

            {/* Orientações Escola */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Orientações e Adequações Metodológicas para a Escola
              </label>
              <textarea
                rows={4}
                value={formOrientacoesEscola}
                onChange={(e) => setFormOrientacoesEscola(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 leading-relaxed"
                placeholder="Tempo adicional, leitura mediada de provas, apoios visuais, redução de distratores..."
              />
            </div>

            {/* Orientações Família */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Orientações para a Família e Rotina Domiciliar
              </label>
              <textarea
                rows={3}
                value={formOrientacoesFamilia}
                onChange={(e) => setFormOrientacoesFamilia(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 leading-relaxed"
                placeholder="Organização do ambiente de estudo, reforço positivo, jogos de tabuleiro estruturados..."
              />
            </div>
          </div>

          {/* Status & Save Bar */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 mb-0.5">Status:</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as StatusDocumentoClinico)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold"
                >
                  <option value="Finalizado">Finalizado</option>
                  <option value="Rascunho">Rascunho</option>
                  <option value="Entregue">Entregue</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-400 mb-0.5">Tags (separadas por vírgula):</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 w-48 sm:w-64"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('lista')}
                className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Salvar e Visualizar Impressão</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAPEL TIMBRADO OFICIAL & VISUALIZAÇÃO DE IMPRESSÃO                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'preview' && previewDoc && (
        <div className="space-y-6">
          {/* Top Control Bar for Print */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs print:hidden">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('lista')}
                className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-200 flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Histórico</span>
              </button>
              <button
                onClick={() => handleEditDocument(previewDoc)}
                className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-200 flex items-center gap-1.5"
              >
                <Edit2 className="w-4 h-4" />
                <span>Editar Documento</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleCopyReportText(previewDoc)}
                className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copiar texto formatado para a área de transferência"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-stone-500" />}
                <span>{copiedText ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                onClick={() => handleOpenEmailModal(previewDoc)}
                className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Preparar e-mail formal com anexo em PDF"
              >
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Enviar por E-mail</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Imprimir direto na impressora ou salvar pelo navegador"
              >
                <Printer className="w-4 h-4 text-stone-500" />
                <span>Imprimir</span>
              </button>

              <button
                onClick={() => handleDownloadPDF(previewDoc)}
                disabled={isExportingPdf}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                title="Baixar arquivo PDF diagramado"
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gerando PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Baixar PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Letterhead Paper Container (Styled for Screen and Optimized for Print) */}
          <div className="letterhead-document max-w-4xl mx-auto bg-white text-stone-900 p-8 sm:p-12 rounded-3xl border border-stone-200 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full">
            {/* Header / Timbrado da Clínica */}
            {state.configuracoes?.opcoesRelatorio?.cabecalhoPersonalizado && (
              <div className="border-b-2 border-emerald-800 pb-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black text-xl flex-shrink-0">
                    EA
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-emerald-900 tracking-tight leading-tight uppercase">
                      {state.configuracoes.nomeClinica}
                    </h2>
                    <p className="text-xs font-bold text-stone-700">
                      {state.configuracoes.profissional} — {state.configuracoes.registroProfissional}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {state.configuracoes.endereco}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px] text-stone-500 space-y-0.5 sm:block hidden">
                  <p className="font-semibold text-stone-700">{state.configuracoes.contato}</p>
                  <p>Atendimento Psicopedagógico Especializado</p>
                </div>
              </div>
            )}

            {/* Document Title */}
            <div className="text-center my-6 space-y-1">
              <h1 className="text-lg sm:text-xl font-black text-stone-900 uppercase tracking-wide">
                {previewDoc.titulo}
              </h1>
              {previewDoc.finalidade && (
                <p className="text-xs text-stone-600 italic">
                  {previewDoc.finalidade}
                </p>
              )}
            </div>

            {/* Patient Identification Card */}
            {(() => {
              const pac = state.pacientes.find(p => p.id === previewDoc.pacienteId);
              return (
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 mb-6 text-xs text-stone-800 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <p><strong>Paciente:</strong> {pac?.nome || '—'}</p>
                    <p><strong>Data de Nascimento:</strong> {formatarData(pac?.nasc)} ({calcularIdade(pac?.nasc)})</p>
                    <p><strong>Escola / Série:</strong> {pac?.escola || '—'} {pac?.serie ? `(${pac.serie})` : ''}</p>
                    <p><strong>Responsável:</strong> {pac?.resp || '—'} {pac?.fone ? `— ${pac.fone}` : ''}</p>
                    {previewDoc.solicitante && (
                      <p><strong>Solicitante:</strong> {previewDoc.solicitante}</p>
                    )}
                    <p><strong>Data de Emissão:</strong> {formatarData(previewDoc.dataEmissao)}</p>
                  </div>
                </div>
              );
            })()}

            {/* Document Sections */}
            <div className="space-y-6 text-xs sm:text-sm text-stone-800 leading-relaxed">
              {/* 1. Queixa */}
              {previewDoc.queixaPrincipal && (
                <div>
                  <h3 className="font-bold text-stone-900 text-xs sm:text-sm uppercase tracking-wider mb-1.5 border-b border-stone-200 pb-1">
                    1. Queixa Principal & Demanda Inicial
                  </h3>
                  <p className="whitespace-pre-line text-stone-700 text-justify">
                    {previewDoc.queixaPrincipal}
                  </p>
                </div>
              )}

              {/* 2. Histórico */}
              {previewDoc.historicoBreve && (
                <div>
                  <h3 className="font-bold text-stone-900 text-xs sm:text-sm uppercase tracking-wider mb-1.5 border-b border-stone-200 pb-1">
                    2. Breve Histórico & Anamnese
                  </h3>
                  <p className="whitespace-pre-line text-stone-700 text-justify">
                    {previewDoc.historicoBreve}
                  </p>
                </div>
              )}

              {/* 3. Instrumentos */}
              {previewDoc.instrumentosUtilizados && previewDoc.instrumentosUtilizados.length > 0 && (
                <div>
                  <h3 className="font-bold text-stone-900 text-xs sm:text-sm uppercase tracking-wider mb-1.5 border-b border-stone-200 pb-1">
                    3. Instrumentos & Procedimentos de Avaliação
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-stone-700">
                    {previewDoc.instrumentosUtilizados.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 4. Comportamento */}
              {previewDoc.observacoesComportamentais && (
                <div>
                  <h3 className="font-bold text-stone-900 text-xs sm:text-sm uppercase tracking-wider mb-1.5 border-b border-stone-200 pb-1">
                    4. Observações Comportamentais & Vínculo
                  </h3>
                  <p className="whitespace-pre-line text-stone-700 text-justify">
                    {previewDoc.observacoesComportamentais}
                  </p>
                </div>
              )}

              {/* 5. Análise Cognitiva */}
              {previewDoc.analiseCognitiva && (
                <div>
                  <h3 className="font-bold text-stone-900 text-xs sm:text-sm uppercase tracking-wider mb-1.5 border-b border-stone-200 pb-1">
                    5. Análise dos Domínios Cognitivos & Funções Executivas
                  </h3>
                  <p className="whitespace-pre-line text-stone-700 text-justify">
                    {previewDoc.analiseCognitiva}
                  </p>
                </div>
              )}

              {/* 6. Análise Pedagógica */}
              {previewDoc.analisePedagogica && (
                <div>
                  <h3 className="font-bold text-stone-900 text-xs sm:text-sm uppercase tracking-wider mb-1.5 border-b border-stone-200 pb-1">
                    6. Análise Pedagógica (Leitura, Escrita e Cálculo)
                  </h3>
                  <p className="whitespace-pre-line text-stone-700 text-justify">
                    {previewDoc.analisePedagogica}
                  </p>
                </div>
              )}

              {/* 7. Conclusão */}
              {previewDoc.conclusaoHipotese && (
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
                  <h3 className="font-bold text-emerald-950 text-xs sm:text-sm uppercase tracking-wider mb-1.5 border-b border-emerald-300 pb-1">
                    7. Conclusão & Síntese Psicopedagógica
                  </h3>
                  <p className="whitespace-pre-line text-emerald-950 font-medium text-justify">
                    {previewDoc.conclusaoHipotese}
                  </p>
                </div>
              )}

              {/* 8. Encaminhamentos */}
              {previewDoc.encaminhamentos && (
                <div>
                  <h3 className="font-bold text-stone-900 text-xs sm:text-sm uppercase tracking-wider mb-1.5 border-b border-stone-200 pb-1">
                    8. Encaminhamentos Multidisciplinares
                  </h3>
                  <p className="whitespace-pre-line text-stone-700 text-justify">
                    {previewDoc.encaminhamentos}
                  </p>
                </div>
              )}

              {/* 9. Orientações Escola */}
              {previewDoc.orientacoesEscola && (
                <div>
                  <h3 className="font-bold text-stone-900 text-xs sm:text-sm uppercase tracking-wider mb-1.5 border-b border-stone-200 pb-1">
                    9. Orientações e Adequações para a Escola
                  </h3>
                  <p className="whitespace-pre-line text-stone-700 text-justify">
                    {previewDoc.orientacoesEscola}
                  </p>
                </div>
              )}

              {/* 10. Orientações Família */}
              {previewDoc.orientacoesFamilia && (
                <div>
                  <h3 className="font-bold text-stone-900 text-xs sm:text-sm uppercase tracking-wider mb-1.5 border-b border-stone-200 pb-1">
                    10. Orientações para a Família
                  </h3>
                  <p className="whitespace-pre-line text-stone-700 text-justify">
                    {previewDoc.orientacoesFamilia}
                  </p>
                </div>
              )}
            </div>

            {/* City, Date and Professional Signature Stamp */}
            <div className="mt-12 pt-6 border-t border-stone-200 space-y-8 break-inside-avoid">
              <p className="text-right text-xs text-stone-600">
                {state.configuracoes?.opcoesRelatorio?.cidadePadrao || 'São Paulo - SP'},{' '}
                {new Date(previewDoc.dataEmissao + 'T12:00:00').toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>

              {state.configuracoes?.opcoesRelatorio?.incluirAssinaturaLinha && (
                <div className="text-center pt-6 max-w-sm mx-auto space-y-1">
                  <div className="w-full border-t border-stone-400 mb-2"></div>
                  <p className="font-bold text-xs sm:text-sm text-stone-900">
                    {[
                      'consultoria_amamentacao',
                      'consultoria_parto',
                      'plano_parto_documento',
                      'parecer_enfermagem_perinatal'
                    ].includes(previewDoc.tipo)
                      ? (previewDoc.profissionalEmissor || 'Enf. Juliana Silveira')
                      : (previewDoc.profissionalEmissor || state.configuracoes.profissional)}
                  </p>
                  <p className="text-xs text-stone-600">
                    {[
                      'consultoria_amamentacao',
                      'consultoria_parto',
                      'plano_parto_documento',
                      'parecer_enfermagem_perinatal'
                    ].includes(previewDoc.tipo)
                      ? (previewDoc.registroEmissor || 'Enfermeira Educadora Perinatal · COREN-SP 214.890')
                      : `Psicopedagoga Clínica — ${previewDoc.registroEmissor || state.configuracoes.registroProfissional}`}
                  </p>
                </div>
              )}

              {state.configuracoes?.opcoesRelatorio?.rodapePersonalizado && (
                <p className="text-[10px] text-stone-400 text-center italic pt-4">
                  {state.configuracoes.opcoesRelatorio.textoRodape || 'Documento de caráter confidencial emitido para fins psicopedagógicos e educacionais.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ENCAMINHAMENTO POR E-MAIL COM ANEXO EM PDF                         */}
      {/* ========================================================================= */}
      {emailModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                    Enviar Laudo / Relatório por E-mail
                  </h3>
                  <p className="text-xs text-stone-500">
                    O documento oficial em PDF é gerado e baixado para ser anexado à mensagem
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEmailModalDoc(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Document Summary Pill */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    DOCUMENTO SELECIONADO:
                  </span>
                  <p className="font-bold text-stone-900 dark:text-stone-100 text-sm mt-0.5">
                    {emailModalDoc.titulo}
                  </p>
                  <p className="text-stone-600 dark:text-stone-300 text-[11px]">
                    Paciente: <strong>{state.pacientes.find(p => p.id === emailModalDoc.pacienteId)?.nome || '—'}</strong> • Emissão: {formatarData(emailModalDoc.dataEmissao)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadPDF(emailModalDoc)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-2xs cursor-pointer flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar PDF</span>
                </button>
              </div>

              {/* Recipient Category Selector */}
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Destinatário do E-mail:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRecipientTypeChange('pais')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      emailRecipientType === 'pais'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Pais / Família
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRecipientTypeChange('escola')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      emailRecipientType === 'escola'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Escola / Coordenação
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRecipientTypeChange('medico')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      emailRecipientType === 'medico'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Médico / Terapeuta
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRecipientTypeChange('personalizado')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      emailRecipientType === 'personalizado'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Personalizado
                  </button>
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  E-mail do Destinatário (opcional):
                </label>
                <input
                  type="email"
                  placeholder="ex: contato@escola.com.br ou email@pais.com"
                  value={emailCustomEmail}
                  onChange={(e) => setEmailCustomEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Assunto do E-mail:
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-medium"
                />
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-stone-700 dark:text-stone-300">
                    Mensagem Formal Pré-escrita:
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyEmailText}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    {emailCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{emailCopied ? 'Texto Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 leading-relaxed font-sans"
                />
              </div>

              <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl text-[11px] text-stone-500 flex items-start gap-2">
                <FileDown className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Como funciona:</strong> Ao clicar em <em>"Baixar PDF e Abrir no E-mail"</em>, o arquivo PDF oficial será baixado instantaneamente em seu computador e seu aplicativo de e-mail padrão será aberto com o assunto e o corpo pré-preenchidos, bastando anexar o arquivo baixado.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800/80 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleCopyEmailText}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {emailCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{emailCopied ? 'Texto Copiado!' : 'Copiar Mensagem'}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setEmailModalDoc(null)}
                  className="px-4 py-2 rounded-xl text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-semibold"
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={handleOpenMailClient}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Baixar PDF & Abrir no E-mail</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
