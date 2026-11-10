export type TabType = 
  | 'painel' 
  | 'pacientes' 
  | 'agenda' 
  | 'sessoes' 
  | 'planos' 
  | 'financeiro' 
  | 'lembretes' 
  | 'relatorio' 
  | 'configuracoes';

export type CategoriaPaciente = 
  | 'Infantil / Escolar' 
  | 'Gestante (Parto & Pré-Natal)' 
  | 'Puérpera & Bebê (Amamentação)' 
  | 'Adulto / Família';

export type StatusPaciente = 'Ativo' | 'Em Avaliação' | 'Alta' | 'Pausado';

export interface DadosPerinatais {
  semanasGestacao?: string; // ex: "34 semanas"
  dpp?: string; // Data Provável do Parto (YYYY-MM-DD)
  paridade?: string; // ex: "G1P0A0"
  tipoPartoDesejado?: string; // Normal, Natural, Cesárea, etc.
  hospitalMaternidade?: string;
  obstetraEquipe?: string;
  nomeBebe?: string;
  nascBebe?: string;
  tipoAleitamento?: 'Exclusivo (AME)' | 'Misto / Complementado' | 'Fórmula Infantil' | 'Em transição';
  queixaMamaria?: string; // Fissura, Dor, Ingurgitamento, Pega incorreta, etc.
  laserterapiaRealizada?: boolean;
  acompanhanteParto?: string;
}

export interface Paciente {
  id: string;
  nome: string;
  nasc: string;
  categoria?: CategoriaPaciente;
  escola?: string;
  serie?: string;
  resp: string;
  fone?: string;
  email?: string;
  queixa: string;
  alergias?: string;
  medicacao?: string;
  dataInicio?: string;
  status: StatusPaciente;
  tags?: string[];
  notasGerais?: string;
  dadosPerinatais?: DadosPerinatais;
}

export type TipoAgendamento = 
  | 'Sessão' 
  | 'Avaliação' 
  | 'Devolutiva' 
  | 'Orientação familiar' 
  | 'Reunião escolar'
  | 'Consultoria de Parto'
  | 'Consultoria de Amamentação'
  | 'Manejo de Pega & Mamas'
  | 'Visita Puerperal'
  | 'Laserterapia Mamária';

export type StatusAgendamento = 
  | 'Agendado' 
  | 'Confirmado' 
  | 'Concluído' 
  | 'Cancelado' 
  | 'Faltou';

export interface AgendaItem {
  id: string;
  pacienteId: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:mm
  tipo: TipoAgendamento;
  prof: string;
  status: StatusAgendamento;
  duracao: number; // minutes
  notas?: string;
}

export type HumorSessao = 'Excelente' | 'Ótimo' | 'Bom' | 'Desatento' | 'Resistente' | 'Cansado' | 'Confortável' | 'Ansiosa / Insegura' | 'Aliviada';

export type TipoAtendimentoSessao = 'psicopedagogia' | 'consultoria_parto' | 'consultoria_amamentacao' | 'puerperio_laser';

export interface SessaoPerinatal {
  idadeGestacionalOuBebe?: string;
  condicaoMamas?: string; // ex: Macias, Ingurgitadas, Fissuras bilaterais, etc.
  avaliacaoPega?: string; // ex: Pega profunda com boca ampla, lábios evertidos, deglutição audível
  posicoesTrabalhadas?: string[]; // Tradicional, Invertida, Cavaleiro, Deitada
  medidasAlivioDorParto?: string[]; // Bola suíça, banho morno, massagem sacral, respiração
  laserterapiaDose?: string; // ex: 2J/ponto para cicatrização mamilar
  condutaPerinatal?: string;
}

export interface Sessao {
  id: string;
  pacienteId: string;
  data: string;
  tipoAtendimento?: TipoAtendimentoSessao;
  objetivos: string;
  atividades: string;
  obs: string;
  tarefa: string;
  avaliacaoHumor?: HumorSessao;
  tempoGasto?: number;
  dadosPerinatal?: SessaoPerinatal;
}

export type StatusPlano = 'Em andamento' | 'Concluído' | 'Em revisão';
export type TipoPlano = 'PEI_Psicopedagogico' | 'Plano_De_Parto' | 'Plano_Amamentacao' | 'Plano_Puerperio';

export interface PlanoIntervencao {
  id: string;
  pacienteId: string;
  tipoPlano?: TipoPlano;
  hipotese: string;
  objetivos: string;
  estrategias: string;
  freq: string;
  reav: string; // YYYY-MM-DD
  dataCriacao?: string;
  status: StatusPlano;
}

export type StatusFinanceiro = 'Pago' | 'Pendente' | 'Atrasado';

export interface LancamentoFinanceiro {
  id: string;
  pacienteId: string;
  comp: string; // YYYY-MM
  valor: number;
  status: StatusFinanceiro;
  dataVenc: string;
  dataPag?: string;
  formaPag?: string;
  descricao?: string;
}

export type PrioridadeLembrete = 'Alta' | 'Média' | 'Baixa';

export interface Lembrete {
  id: string;
  titulo: string;
  descricao?: string;
  data: string; // YYYY-MM-DD
  hora?: string; // HH:mm
  pacienteId?: string;
  prioridade: PrioridadeLembrete;
  concluido: boolean;
}

export type TipoNotificacao = 'agenda' | 'financeiro' | 'reavaliacao' | 'lembrete' | 'sistema';

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  lida: boolean;
  timestamp: string;
  linkTab?: TabType;
  actionId?: string;
}

export type TipoDocumentoClinico =
  | 'laudo_completo'
  | 'parecer_psicopedagogico'
  | 'relatorio_evolucao'
  | 'relatorio_escolar'
  | 'declaracao_comparecimento'
  | 'consultoria_amamentacao'
  | 'consultoria_parto'
  | 'plano_parto_documento'
  | 'parecer_enfermagem_perinatal';

export type StatusDocumentoClinico = 'Rascunho' | 'Finalizado' | 'Entregue';

export interface RelatorioDocumento {
  id: string;
  pacienteId: string;
  tipo: TipoDocumentoClinico;
  titulo: string;
  dataEmissao: string; // YYYY-MM-DD
  solicitante?: string;
  finalidade?: string;
  queixaPrincipal?: string;
  historicoBreve?: string;
  instrumentosUtilizados?: string[];
  observacoesComportamentais?: string;
  analiseCognitiva?: string;
  analisePedagogica?: string;
  conclusaoHipotese?: string;
  encaminhamentos?: string;
  orientacoesEscola?: string;
  orientacoesFamilia?: string;
  textoLivre?: string;
  status: StatusDocumentoClinico;
  tags?: string[];
  profissionalEmissor?: string;
  registroEmissor?: string;
}

export interface OpcoesRelatorio {
  cabecalhoPersonalizado: boolean;
  rodapePersonalizado: boolean;
  textoRodape: string;
  cidadePadrao: string;
  incluirAssinaturaLinha: boolean;
  incluirRegistroProfissional: boolean;
  incluirCnpjCpf: boolean;
  documentoCpfCnpj: string;
  tituloPadraoLaudo: string;
  exibirLogoCabecalho: boolean;
  fonteDocumento: 'sans' | 'serif' | 'mono';
  margemImpressao: 'normal' | 'compacta';
  modeloPadraoInstrumentos: string[];
  mostrarIdadeNoCabecalho: boolean;
  mostrarEscolaNoCabecalho: boolean;
}

export type NivelAcesso = 'admin' | 'psicopedagogo' | 'enfermeira_perinatal' | 'recepcao' | 'estagiario';

export interface PermissoesPerfil {
  verPainel: boolean;
  verPacientes: boolean;
  gerenciarPacientes: boolean; // criar, editar, excluir
  verAnamneseCompleta: boolean; // dados sigilosos e queixas
  verAgenda: boolean;
  gerenciarAgenda: boolean;
  verSessoes: boolean;
  gerenciarSessoes: boolean;
  verPlanosPEI: boolean;
  gerenciarPlanosPEI: boolean;
  verFinanceiro: boolean;
  gerenciarFinanceiro: boolean;
  verRelatoriosLaudos: boolean;
  gerenciarRelatoriosLaudos: boolean;
  verLembretes: boolean;
  gerenciarConfiguracoes: boolean;
  gerenciarUsuarios: boolean;
}

export interface UsuarioSistema {
  id: string;
  nome: string;
  username: string;
  email?: string;
  senha: string; // hash ou string protegida
  cargo: string;
  nivelAcesso: NivelAcesso;
  ativo: boolean;
  avatarColor?: string;
  criadoEm: string;
  ultimoAcesso?: string;
}

export interface ConfiguracaoSeguranca {
  exigirLogin: boolean;
  tempoExpiracaoSessaoHoras: number;
  bloquearAposTentativas: boolean;
  limiteTentativas: number;
}

export interface ConfiguracaoClinica {
  nomeClinica: string;
  profissional: string;
  registroProfissional: string;
  contato: string;
  endereco: string;
  telefoneClinica?: string;
  chavePix?: string;
  valorPadrao?: number;
  tema: 'light' | 'dark' | 'system';
  notificacoesAtivas: boolean;
  notificacoesNavegador: boolean;
  lembretesSonoros: boolean;
  syncAuto: boolean;
  syncIntervalSec: number;
  syncCode: string;
  opcoesRelatorio: OpcoesRelatorio;
  seguranca?: ConfiguracaoSeguranca;
}

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error' | 'pending';

export interface ClinicState {
  pacientes: Paciente[];
  agenda: AgendaItem[];
  sessoes: Sessao[];
  planos: PlanoIntervencao[];
  financeiro: LancamentoFinanceiro[];
  lembretes: Lembrete[];
  notificacoes: Notificacao[];
  relatorios: RelatorioDocumento[];
  usuarios?: UsuarioSistema[];
  configuracoes: ConfiguracaoClinica;
}
