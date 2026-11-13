import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  ClinicState,
  Paciente,
  AgendaItem,
  Sessao,
  PlanoIntervencao,
  LancamentoFinanceiro,
  Lembrete,
  Notificacao,
  RelatorioDocumento,
  OpcoesRelatorio,
  ConfiguracaoClinica,
  ConfiguracaoSeguranca,
  UsuarioSistema,
  SyncState,
  TabType,
  DocumentoAnexo
} from '../types';
import { DEFAULT_USUARIOS_SISTEMA } from '../utils/authUtils';

interface ClinicContextType {
  state: ClinicState;
  syncState: SyncState;
  lastSyncTime: Date | null;
  syncCode: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Pacientes & Anexos
  addPaciente: (p: Omit<Paciente, 'id'>) => Promise<string>;
  updatePaciente: (id: string, p: Partial<Paciente>) => Promise<void>;
  deletePaciente: (id: string) => Promise<void>;
  anexarDocumentoPaciente: (pacienteId: string, doc: Omit<DocumentoAnexo, 'id' | 'dataUpload'>) => Promise<DocumentoAnexo>;
  removerDocumentoPaciente: (pacienteId: string, documentoId: string) => Promise<void>;
  
  // Agenda
  addAgendaItem: (item: Omit<AgendaItem, 'id'>) => Promise<string>;
  updateAgendaItem: (id: string, item: Partial<AgendaItem>) => Promise<void>;
  deleteAgendaItem: (id: string) => Promise<void>;
  
  // Sessões
  addSessao: (sessao: Omit<Sessao, 'id'>) => Promise<string>;
  updateSessao: (id: string, sessao: Partial<Sessao>) => Promise<void>;
  deleteSessao: (id: string) => Promise<void>;
  
  // Planos
  addPlano: (plano: Omit<PlanoIntervencao, 'id'>) => Promise<string>;
  updatePlano: (id: string, plano: Partial<PlanoIntervencao>) => Promise<void>;
  deletePlano: (id: string) => Promise<void>;
  
  // Financeiro
  addFinanceiro: (fin: Omit<LancamentoFinanceiro, 'id'>) => Promise<string>;
  updateFinanceiro: (id: string, fin: Partial<LancamentoFinanceiro>) => Promise<void>;
  marcarPago: (id: string) => Promise<void>;
  deleteFinanceiro: (id: string) => Promise<void>;
  
  // Lembretes & Notificações
  addLembrete: (lem: Omit<Lembrete, 'id' | 'concluido'>) => Promise<string>;
  toggleLembrete: (id: string) => Promise<void>;
  deleteLembrete: (id: string) => Promise<void>;
  
  // Relatórios & Laudos
  addRelatorio: (rel: Omit<RelatorioDocumento, 'id'>) => Promise<string>;
  updateRelatorio: (id: string, rel: Partial<RelatorioDocumento>) => Promise<void>;
  deleteRelatorio: (id: string) => Promise<void>;
  duplicarRelatorio: (id: string) => Promise<string>;
  
  // Usuários do Sistema & Níveis de Acesso
  addUsuario: (u: Omit<UsuarioSistema, 'id' | 'criadoEm'>) => Promise<string>;
  updateUsuario: (id: string, u: Partial<UsuarioSistema>) => Promise<void>;
  deleteUsuario: (id: string) => Promise<void>;
  resetSenhaUsuario: (id: string, novaSenha: string) => Promise<void>;
  updateConfigSeguranca: (cfg: Partial<ConfiguracaoSeguranca>) => Promise<void>;

  marcarNotificacaoLida: (id: string) => void;
  marcarTodasNotificacoesLidas: () => void;
  limparNotificacoes: () => void;
  adicionarNotificacao: (notif: Omit<Notificacao, 'id' | 'timestamp' | 'lida'>) => void;
  solicitarPermissaoNavegador: () => Promise<boolean>;
  
  // Configurações & Nuvem
  updateConfiguracoes: (config: Partial<ConfiguracaoClinica>) => Promise<void>;
  alterarSyncCode: (newCode: string) => Promise<void>;
  forcarSincronizacao: () => Promise<void>;
  recarregarDaNuvem: () => Promise<ClinicState | null>;
  restaurarDadosPadrao: () => Promise<void>;
  exportarBackupJSON: () => void;
  importarBackupJSON: (file: File) => Promise<boolean>;
}

const defaultOpcoesRelatorio: OpcoesRelatorio = {
  cabecalhoPersonalizado: true,
  rodapePersonalizado: true,
  textoRodape: 'Documento de caráter confidencial emitido para fins psicopedagógicos e educacionais.',
  cidadePadrao: 'São Paulo - SP',
  incluirAssinaturaLinha: true,
  incluirRegistroProfissional: true,
  incluirCnpjCpf: false,
  documentoCpfCnpj: '',
  tituloPadraoLaudo: 'Laudo de Avaliação Psicopedagógica Clínica',
  exibirLogoCabecalho: true,
  fonteDocumento: 'sans',
  margemImpressao: 'normal',
  modeloPadraoInstrumentos: [
    'EOCA (Entrevista Operativa Centrada na Aprendizagem)',
    'Provas Operatórias de Jean Piaget (Conservação, Classificação e Seriação)',
    'TDE II (Teste de Desempenho Escolar - Leitura, Escrita e Aritmética)',
    'PROLEC (Provas de Avaliação dos Processos de Leitura)',
    'Análise da Produção Gráfica e Psicomotricidade Fina',
    'Escala SNAP-IV de Avaliação Comportamental e Atencional'
  ],
  mostrarIdadeNoCabecalho: true,
  mostrarEscolaNoCabecalho: true
};

const defaultConfig: ConfiguracaoClinica = {
  nomeClinica: 'Ninho',
  profissional: 'Ester Lopes',
  registroProfissional: 'ABPp 4821/SP',
  contato: '(11) 98765-0000 · contato@clinica.com.br',
  endereco: 'Av. Paulista, 1000 - Cj 84 - Bela Vista, São Paulo - SP',
  telefoneClinica: '(11) 98765-0000',
  chavePix: 'contato@clinica.com.br',
  valorPadrao: 180,
  tema: 'system',
  notificacoesAtivas: true,
  notificacoesNavegador: false,
  lembretesSonoros: true,
  syncAuto: true,
  syncIntervalSec: 15,
  syncCode: 'ninho-principal',
  opcoesRelatorio: defaultOpcoesRelatorio,
  seguranca: {
    exigirLogin: true,
    tempoExpiracaoSessaoHoras: 24,
    bloquearAposTentativas: true,
    limiteTentativas: 5
  }
};

const defaultInitialState: ClinicState = {
  pacientes: [
    {
      id: 'pac_1',
      nome: 'Lucas Gabriel Silva',
      nasc: '2017-04-12',
      categoria: 'Infantil / Escolar',
      escola: 'Escola Municipal Monteiro Lobato',
      serie: '3º ano Fundamental',
      resp: 'Mariana Silva (Mãe)',
      fone: '(11) 98765-4321',
      email: 'mariana.silva@email.com',
      queixa: 'Dificuldade acentuada na alfabetização e atenção sustentada. Trocas fonológicas constantes (p/b, f/v) e desmotivação para leitura.',
      alergias: 'Nenhuma',
      medicacao: 'Nenhuma',
      dataInicio: '2026-02-10',
      status: 'Ativo',
      tags: ['Dislexia (Hipótese)', 'TDAH', 'Alfabetização'],
      documentos: [
        {
          id: 'doc_1',
          nome: 'Encaminhamento_Pedagogico_Escola.pdf',
          tipo: 'application/pdf',
          categoria: 'Relatório / Histórico Escolar',
          tamanho: 245000,
          dataUpload: '2026-02-12T14:30:00Z',
          descricao: 'Relatório enviado pela coordenação descrevendo trocas fonológicas e desafios na leitura em sala.',
          enviadoPor: 'Coord. Escolar'
        },
        {
          id: 'doc_2',
          nome: 'Avaliacao_Audiologica_PAC.pdf',
          tipo: 'application/pdf',
          categoria: 'Exame Clínico / Audiometria',
          tamanho: 512000,
          dataUpload: '2026-02-18T10:15:00Z',
          descricao: 'Exame do Processamento Auditivo Central (PAC) com limiares auditivos dentro dos padrões normais.',
          enviadoPor: 'Clínica Otorrino'
        }
      ]
    },
    {
      id: 'pac_2',
      nome: 'Beatriz Martins de Oliveira',
      nasc: '2016-09-25',
      categoria: 'Infantil / Escolar',
      escola: 'Colégio Futuro Brilhante',
      serie: '4º ano Fundamental',
      resp: 'Carlos Oliveira (Pai)',
      fone: '(11) 97123-8899',
      email: 'carlos.oliveira@empresa.com',
      queixa: 'Desafios no raciocínio lógico-matemático (discalculia investigada) e ansiedade de desempenho em avaliações escolares.',
      alergias: 'Intolerância a lactose',
      medicacao: 'Nenhuma',
      dataInicio: '2026-01-15',
      status: 'Ativo',
      tags: ['Discalculia', 'Ansiedade Escolar', 'Funções Executivas']
    },
    {
      id: 'pac_3',
      nome: 'Camila Vasconcelos Ribeiro',
      nasc: '1996-07-14',
      categoria: 'Gestante (Parto & Pré-Natal)',
      resp: 'Rafael Ribeiro (Companheiro / Rede de Apoio)',
      fone: '(11) 98111-2233',
      email: 'camila.ribeiro@email.com',
      queixa: 'Consultoria para elaboração do Plano de Parto, manejo não farmacológico da dor e preparação pré-natal para amamentação.',
      alergias: 'Dipirona',
      medicacao: 'Sulfato Ferroso + Ácido Fólico + Ômega 3',
      dataInicio: '2026-02-01',
      status: 'Ativo',
      tags: ['Gestante 34 semanas', 'Consultoria de Parto', 'Pré-natal Amamentação'],
      dadosPerinatais: {
        semanasGestacao: '34 semanas',
        dpp: '2026-04-10',
        paridade: 'G1P0A0 (Primigesta)',
        tipoPartoDesejado: 'Parto Normal Humanizado / Respeitoso',
        hospitalMaternidade: 'Maternidade Santa Joana',
        obstetraEquipe: 'Dra. Vanessa Martins (Obstetra)',
        acompanhanteParto: 'Rafael Ribeiro (Esposo) e Doula',
        tipoAleitamento: 'Exclusivo (AME)',
        queixaMamaria: 'Mamilos planos; dúvidas sobre pega e descida do leite (apojadura).'
      }
    },
    {
      id: 'pac_4',
      nome: 'Juliana & Bebê Theo Rocha',
      nasc: '1994-03-20',
      categoria: 'Puérpera & Bebê (Amamentação)',
      resp: 'Juliana Rocha (Mãe) / Pedro Rocha (Pai)',
      fone: '(11) 97444-5566',
      email: 'juliana.rocha@email.com',
      queixa: 'Consultoria de amamentação domiciliar e clínica no pós-parto imediato. Dor intensa na mamada, fissuras mamilares e ingurgitamento mamário.',
      alergias: 'Nenhuma',
      medicacao: 'Paracetamol se dor',
      dataInicio: '2026-02-18',
      status: 'Ativo',
      tags: ['Puérpera (14 dias)', 'Fissura Mamilar', 'Pega Incorreta', 'Laserterapia'],
      dadosPerinatais: {
        nomeBebe: 'Theo Rocha',
        nascBebe: '2026-02-14',
        semanasGestacao: 'Parto a termo com 39 semanas e 2 dias',
        paridade: 'G1P1 (Cesárea)',
        tipoAleitamento: 'Exclusivo (AME)',
        queixaMamaria: 'Fissura em raio no mamilo direito; dor grau 8 ao início da sucção; pega rasa.',
        laserterapiaRealizada: true,
        hospitalMaternidade: 'Hospital e Maternidade Pro Matre'
      }
    }
  ],
  agenda: [
    {
      id: 'ag_1',
      pacienteId: 'pac_3',
      data: new Date().toISOString().slice(0, 10),
      hora: '10:00',
      tipo: 'Consultoria de Parto',
      prof: 'Enf. Juliana Silveira (Enfermeira Perinatal)',
      status: 'Confirmado',
      duracao: 60,
      notas: 'Revisão do Plano de Parto, exercícios na bola suíça e técnicas de respiração e massagem lombo-sacra.'
    },
    {
      id: 'ag_2',
      pacienteId: 'pac_4',
      data: new Date().toISOString().slice(0, 10),
      hora: '14:00',
      tipo: 'Consultoria de Amamentação',
      prof: 'Enf. Juliana Silveira (Enfermeira Perinatal)',
      status: 'Confirmado',
      duracao: 60,
      notas: 'Avaliação da dinâmica de mamada do Theo, ajuste de pega assimétrica e 2ª sessão de Laserterapia mamilar.'
    },
    {
      id: 'ag_3',
      pacienteId: 'pac_1',
      data: new Date().toISOString().slice(0, 10),
      hora: '15:30',
      tipo: 'Sessão',
      prof: 'Ester Lopes (Psicopedagoga)',
      status: 'Confirmado',
      duracao: 50,
      notas: 'Trabalhar jogo de consciência fonológica e pareamento grafema-fonema.'
    },
    {
      id: 'ag_4',
      pacienteId: 'pac_2',
      data: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      hora: '10:00',
      tipo: 'Sessão',
      prof: 'Dra. Carolina Mendes (Psicopedagoga)',
      status: 'Agendado',
      duracao: 50,
      notas: 'Uso do material dourado e resolução de problemas estruturados.'
    },
    {
      id: 'ag_5',
      pacienteId: 'pac_3',
      data: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      hora: '16:00',
      tipo: 'Manejo de Pega & Mamas',
      prof: 'Enf. Juliana Silveira (Enfermeira Perinatal)',
      status: 'Agendado',
      duracao: 60,
      notas: 'Oficina prática de posições de amamentação e ordenha de alívio pré-parto.'
    }
  ],
  sessoes: [
    {
      id: 'ses_perinatal_1',
      pacienteId: 'pac_4',
      data: new Date().toISOString().slice(0, 10),
      tipoAtendimento: 'consultoria_amamentacao',
      objetivos: 'Avaliar e corrigir a pega do recém-nascido Theo, aliviar dor e acelerar cicatrização de fissura mamilar.',
      atividades: 'Inspeção clínica das mamas; aplicação de Laserterapia de baixa potência (vermelho 660nm - 2J por ponto); orientação de pega assimétrica profunda (queixo afundado na mama, lábio inferior evertido, abocanhando grande parte da aréola inferior); teste das posições invertida e cavalinho.',
      obs: 'A puérpera referiu redução imediata da dor de 8/10 para 2/10 após o ajuste da pega profunda. O bebê Theo apresentou deglutição ritmada e audível com relaxamento das mãos.',
      tarefa: 'Manter a pega em C antes de ofertar a mama; ordenhar algumas gotas de leite no início para amaciar a aréola; banho de sol nas mamas 10 min/dia se possível; não usar pomadas espessas.',
      avaliacaoHumor: 'Aliviada',
      tempoGasto: 60,
      dadosPerinatal: {
        idadeGestacionalOuBebe: 'Bebê Theo com 14 dias (3.420g)',
        condicaoMamas: 'Mamas túrgidas, aréola direita com fissura linear superficial em cicatrização',
        avaliacaoPega: 'Pega corrigida para assimétrica profunda, boca bem aberta (140°), deglutição coordenada',
        posicoesTrabalhadas: ['Invertida (Futebol Americano)', 'Tradicional com almofada de amamentação', 'Cavalinho (Koala hold)'],
        laserterapiaDose: 'Laser 660nm - 2J/ponto na borda da fissura direita',
        condutaPerinatal: 'Retorno programado para acompanhamento de ganho de peso e revisão mamária em 5 dias.'
      }
    },
    {
      id: 'ses_perinatal_2',
      pacienteId: 'pac_3',
      data: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
      tipoAtendimento: 'consultoria_parto',
      objetivos: 'Elaboração detalhada do Plano de Parto e empoderamento da gestante e acompanhante sobre as fases do trabalho de parto.',
      atividades: 'Revisão das preferências de parto hospitalar humanizado; ensino de técnicas respiratórias (respiração lenta e expiração com sopro); mobilidade pélvica na bola suíça; massagem com pressão sacral para alívio de contrações.',
      obs: 'Camila e o parceiro Rafael mostraram-se muito seguros e participativos. Compreenderam a importância do contato pele a pele ininterrupto na 1ª hora (Golden Hour) e do clampeamento tardio do cordão umbilical.',
      tarefa: 'Imprimir 3 vias do Plano de Parto finalizado para a pasta da maternidade; praticar 15 minutos diários de movimentos circulares na bola suíça.',
      avaliacaoHumor: 'Excelente',
      tempoGasto: 60,
      dadosPerinatal: {
        idadeGestacionalOuBebe: 'Gestante Camila - 34 semanas',
        medidasAlivioDorParto: ['Bola Suíça (Rebolar e balanço pélvico)', 'Chuveiro morno nas costas', 'Massagem sacral contínua', 'Uso do rebozo'],
        condutaPerinatal: 'Próximo encontro com foco em amamentação na primeira hora de vida e cuidados com o recém-nascido.'
      }
    },
    {
      id: 'ses_1',
      pacienteId: 'pac_1',
      data: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10),
      tipoAtendimento: 'psicopedagogia',
      objetivos: 'Estimular consciência fonológica (rima e aliteração) e autorregulação da atenção.',
      atividades: 'Jogo de trilha fonológica com cartas ilustradas; formação de palavras com alfabeto móvel magnético; leitura guiada de miniconto ilustrado.',
      obs: 'Lucas demonstrou excelente engajamento durante a dinâmica lúdica. Reconheceu com facilidade rimas em versos e mostrou avanço na correspondência letra-som.',
      tarefa: 'Brincadeira de detetive de rimas com a mãe durante a leitura noturna (10 minutos diários).',
      avaliacaoHumor: 'Ótimo',
      tempoGasto: 50
    }
  ],
  planos: [
    {
      id: 'pl_parto_1',
      pacienteId: 'pac_3',
      tipoPlano: 'Plano_De_Parto',
      hipotese: 'Gestação tópica e habitual (34 semanas). Desejo de parto normal humanizado e fisiológico, com suporte da equipe obstétrica e enfermeira educadora perinatal.',
      objetivos: '1. Promover trabalho de parto ativo com liberdade de movimento, posições verticalizadas e hidratação oral.\n2. Priorizar métodos não-farmacológicos de alívio da dor (chuveiro, bola suíça, massagem, banqueta de parto).\n3. AssegurarGolden Hour (hora de ouro): contato pele a pele imediato e amamentação na sala de parto.',
      estrategias: '• Presença contínua do acompanhante de livre escolha (Rafael) e da doula/educadora perinatal.\n• Ausência de episiotomia de rotina, manobra de Kristeller ou tricotomia.\n• Clampeamento tardio do cordão umbilical (após cessar pulsação).\n• Exames e procedimentos no recém-nascido realizados no colo da mãe quando clinicamente estável.',
      freq: 'Consultorias quinzenais no 3º trimestre + acompanhamento perinatal',
      reav: '2026-03-25',
      dataCriacao: '2026-02-05',
      status: 'Em andamento'
    },
    {
      id: 'pl_amamenta_1',
      pacienteId: 'pac_4',
      tipoPlano: 'Plano_Amamentacao',
      hipotese: 'Puérpera primigesta com recém-nascido de 14 dias em aleitamento materno exclusivo (AME), apresentando trauma mamilar por pega rasa em fase de resolução.',
      objetivos: '1. Manutenção do aleitamento materno exclusivo sob livre demanda sem necessidade de complementação artificial.\n2. Cicatrização completa do complexo aréolo-mamilar direito e ausência de dor durante a mamada.\n3. Ganho de peso ponderal satisfatório do bebê Theo (25 a 30g/dia).',
      estrategias: '• Posição invertida e cross-cradle com apoio da mama em C.\n• Laserterapia pontual (660nm - 2J/ponto).\n• Massagem e ordenha de alívio antes de cada mamada para facilitar a preensão da aréola.',
      freq: '1x por semana até estabilização completa do peso e cicatrização',
      reav: '2026-03-10',
      dataCriacao: '2026-02-18',
      status: 'Em andamento'
    },
    {
      id: 'pl_1',
      pacienteId: 'pac_1',
      tipoPlano: 'PEI_Psicopedagogico',
      hipotese: 'Quadro compatível com dificuldades específicas no processamento fonológico e decodificação leitora, associado a déficit atencional leve.',
      objetivos: '1. Desenvolver consciência fonológica em níveis silábico e fonêmico.\n2. Aumentar velocidade e precisão na decodificação de palavras de alta e baixa frequência.\n3. Fortalecer a memória de trabalho verbal através de jogos com regras estruturadas.',
      estrategias: 'Intervenção multissensorial estruturada (visuomotor e auditivo), uso de pistas gestuais para fonemas, jogos de tabuleiro de mediação cognitiva.',
      freq: '2x por semana (50 min cada)',
      reav: new Date(Date.now() + 86400000 * 45).toISOString().slice(0, 10),
      dataCriacao: '2026-02-15',
      status: 'Em andamento'
    }
  ],
  financeiro: [
    {
      id: 'fin_1',
      pacienteId: 'pac_3',
      comp: '2026-08',
      valor: 850.00,
      status: 'Pago',
      dataVenc: '2026-08-10',
      dataPag: '2026-08-05',
      formaPag: 'PIX',
      descricao: 'Pacote de Consultoria Perinatal & Plano de Parto Personalizado'
    },
    {
      id: 'fin_2',
      pacienteId: 'pac_4',
      comp: '2026-08',
      valor: 480.00,
      status: 'Pago',
      dataVenc: '2026-08-20',
      dataPag: '2026-08-18',
      formaPag: 'PIX',
      descricao: 'Consultoria de Amamentação Puerperal + Sessão de Laserterapia'
    },
    {
      id: 'fin_3',
      pacienteId: 'pac_1',
      comp: '2026-08',
      valor: 720.00,
      status: 'Pago',
      dataVenc: '2026-08-10',
      dataPag: '2026-08-08',
      formaPag: 'PIX',
      descricao: 'Mensalidade de 4 sessões psicopedagógicas'
    }
  ],
  lembretes: [
    {
      id: 'lem_1',
      titulo: 'Verificar ganho de peso do bebê Theo (Puérpera Juliana)',
      descricao: 'Checar diurese, número de fraldas úmidas e peso em consulta pediátrica.',
      data: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      hora: '09:30',
      pacienteId: 'pac_4',
      prioridade: 'Alta',
      concluido: false
    },
    {
      id: 'lem_2',
      titulo: 'Entregar via final do Plano de Parto para Camila Vasconcelos',
      descricao: 'Revisar itens com obstetra e anexar contatos de emergência.',
      data: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      hora: '14:00',
      pacienteId: 'pac_3',
      prioridade: 'Média',
      concluido: false
    },
    {
      id: 'lem_3',
      titulo: 'Reunião pedagógica com a professora do Lucas',
      descricao: 'Alinhar adaptação curricular para leitura na Escola Monteiro Lobato.',
      data: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      hora: '11:00',
      pacienteId: 'pac_1',
      prioridade: 'Média',
      concluido: false
    }
  ],
  notificacoes: [
    {
      id: 'notif_1',
      tipo: 'agenda',
      titulo: 'Consultoria de Parto hoje às 10:00',
      mensagem: 'Gestante Camila Vasconcelos Ribeiro (Revisão de Plano de Parto & Alívio de Dor)',
      lida: false,
      timestamp: new Date().toISOString(),
      linkTab: 'agenda'
    },
    {
      id: 'notif_2',
      tipo: 'agenda',
      titulo: 'Consultoria de Amamentação hoje às 14:00',
      mensagem: 'Puérpera Juliana & Bebê Theo (Ajuste de Pega e Laserterapia)',
      lida: false,
      timestamp: new Date().toISOString(),
      linkTab: 'sessoes'
    }
  ],
  relatorios: [
    {
      id: 'rel_amamenta_1',
      pacienteId: 'pac_4',
      tipo: 'consultoria_amamentacao',
      titulo: 'Parecer Clínico de Consultoria em Aleitamento Materno & Manejo Puerperal',
      dataEmissao: new Date().toISOString().slice(0, 10),
      solicitante: 'Família / Pediatra Assistente',
      finalidade: 'Avaliação da dinâmica da mamada, manejo de trauma mamilar e adequação de aleitamento exclusivo',
      queixaPrincipal: 'Puérpera primigesta no 14º dia de pós-parto referindo dor excruciante durante a amamentação (grau 8/10), fissura visível na mama direita e episódios de choro do bebê por cansaço ao sugar.',
      historicoBreve: 'Parto cesárea eletiva sem intercorrências com 39s2d. Peso de nascimento de Theo: 3.480g. Apojadura ocorreu no 3º DPO com ingurgitamento fisiológico. Dificuldade de encaixe da boca do bebê nos primeiros dias gerou trauma aréolo-mamilar.',
      instrumentosUtilizados: [
        'Inspeção e Palpação Clínica das Glândulas Mamárias e Mamilos',
        'Avaliação da Dinâmica de Mamada com Escala LATCH',
        'Avaliação Anátomo-Funcional da Língua e Freio Lingual do Lactente (Protocolo de Bristol / Teste da Linguinha)',
        'Fotobiomodulação / Laserterapia de Baixa Potência (Laser vermelho 660nm)'
      ],
      observacoesComportamentais: 'Mãe bastante dedicada, porém demonstrando esgotamento físico e emocional decorrente da dor ao amamentar. Vínculo afetivo mãe-bebê muito preservado.',
      analiseCognitiva: 'Glândulas mamárias simétricas, aréola direita com fissura longitudinal superficial de 4mm em terço superior, sem sinais de infecção local ou mastite. Mamilos protrusos e elásticos.',
      analisePedagogica: 'Na observação da mamada: pega inicial rasa (abocanhando apenas bico), lábio inferior invertido e queixo afastado da mama. Correção postural e manobra de pega assimétrica permitiram abocanhamento de 80% da aréola inferior, eliminando o atrito no mamilo.',
      conclusaoHipotese: 'Trauma mamilar direito decorrente de pega rasa e posicionamento desfavorável, associado a ingurgitamento aréolar transitório. Quadro reversível com manejo postural e fotobiomodulação.',
      encaminhamentos: '1. Manutenção do AME em livre demanda sem uso de bicos artificiais (chupetas ou mamadeiras).\n2. Retorno com a consultora em 5 dias para reavaliação de peso e fechamento tecidual.\n3. Continuidade do seguimento com o pediatra.',
      orientacoesEscola: 'Orientações para o retorno gradual ao trabalho e início de estoque de leite ordenhado a partir do 4º mês.',
      orientacoesFamilia: '• Posicionar o bebê em posição invertida (alivia a pressão sobre a área da fissura).\n• Realizar ordenha de alívio prévia para amaciar a aréola antes de oferecer a mama.\n• Higienizar apenas no banho diário habitual, sem esfregar sabonete nos mamilos.\n• Rede de apoio deve assumir tarefas domésticas e arrotos para garantir o descanso materno.',
      status: 'Finalizado',
      tags: ['Amamentação', 'Consultoria Perinatal', 'Laserterapia', 'Pega Correta'],
      profissionalEmissor: 'Enf. Juliana Silveira',
      registroEmissor: 'COREN-SP 214.890 — Enfermeira Educadora Perinatal'
    },
    {
      id: 'rel_parto_1',
      pacienteId: 'pac_3',
      tipo: 'plano_parto_documento',
      titulo: 'Documento Oficial de Plano de Parto & Diretrizes de Assistência Perinatal',
      dataEmissao: new Date().toISOString().slice(0, 10),
      solicitante: 'Gestante Camila Vasconcelos e Equipe Obstétrica Maternidade Santa Joana',
      finalidade: 'Diretrizes personalizadas de assistência ao trabalho de parto, parto e acolhimento do recém-nascido',
      queixaPrincipal: 'Documentação dos desejos e preferências baseadas em evidências científicas para a equipe da maternidade.',
      historicoBreve: 'Primigesta de 34 semanas, pré-natal de baixo risco com acompanhamento conjunto da enfermeira educadora perinatal.',
      instrumentosUtilizados: [
        'Diretrizes da OMS e Ministério da Saúde para o Parto Humanizado',
        'Protocolo de Assistência Fisiológica e Métodos Não-Farmacológicos de Alívio da Dor',
        'Checklist Perinatal de Segurança e Acolhimento do Recém-Nascido'
      ],
      observacoesComportamentais: 'Gestante consciente, informada e empoderada sobre suas escolhas para o momento do nascimento.',
      analiseCognitiva: 'Desejo expresso por trabalho de parto ativo, com ambiente calmo, penumbra e música suave na suíte de parto.',
      analisePedagogica: 'Medidas de alívio acordadas: liberdade de movimentação, bola suíça, banho morno de chuveiro/banheira, massagem e aromaterapia.',
      conclusaoHipotese: 'Plano de Parto elaborado e aprovado, estabelecendo preferências claras para trabalho de parto, período expulsivo e recepção do bebê.',
      encaminhamentos: 'Anexar cópias assinadas ao cartão da gestante e entregar à equipe de triagem da maternidade.',
      orientacoesEscola: 'Ambiente hospitalar acolhedor.',
      orientacoesFamilia: '• Presença contínua do parceiro Rafael como acompanhante.\n• Contato pele a pele ininterrupto na primeira hora de vida (Golden Hour).\n• Clampeamento oportuno/tardio do cordão umbilical após cessar pulsação.\n• Estímulo ao aleitamento materno na sala de parto.',
      status: 'Finalizado',
      tags: ['Plano de Parto', 'Enfermagem Perinatal', 'Parto Humanizado'],
      profissionalEmissor: 'Enf. Juliana Silveira',
      registroEmissor: 'COREN-SP 214.890 — Enfermeira Educadora Perinatal'
    },
    {
      id: 'rel_1',
      pacienteId: 'pac_1',
      tipo: 'laudo_completo',
      titulo: 'Laudo de Avaliação Psicopedagógica Clínica',
      dataEmissao: '2026-03-10',
      solicitante: 'Família e Equipe Pedagógica Escolar',
      finalidade: 'Investigação de dificuldades no processo de alfabetização e orientação pedagógica',
      queixaPrincipal: 'Dificuldade acentuada no reconhecimento e decodificação leitora, trocas fonológicas na escrita (p/b, f/v) e desatenção durante atividades acadêmicas.',
      historicoBreve: 'Lucas iniciou a investigação aos 8 anos. Gestação e marcos do neurodesenvolvimento típicos. O ingresso no ciclo de alfabetização evidenciou descompasso em relação à turma.',
      instrumentosUtilizados: [
        'EOCA (Entrevista Operativa Centrada na Aprendizagem)',
        'Provas Operatórias de Piaget (Conservação, Classificação e Seriação)',
        'TDE II (Teste de Desempenho Escolar - Subtestes de Leitura e Escrita)',
        'PROLEC (Provas de Avaliação dos Processos de Leitura)',
        'Avaliação da Consciência Fonológica por Produção Oral (PCFO)'
      ],
      observacoesComportamentais: 'Lucas compareceu às sessões pontualmente, mostrou-se afável e colaborativo. Apresentou oscilação no foco atencional em tarefas que exigem esforço cognitivo prolongado sem suporte lúdico.',
      analiseCognitiva: 'Preservação do potencial intelectual geral. Memória de trabalho fonológica e velocidade de processamento rebaixadas. Raciocínio lógico e capacidade de seriação preservados.',
      analisePedagogica: 'Na leitura, observa-se hesitação e dificuldade na rota fonológica, demandando apoio visual. Na escrita, trocas de grafemas por proximidade de ponto de articulação fonêmica.',
      conclusaoHipotese: 'O perfil psicopedagógico apresentado é compatível com Transtorno Específico de Aprendizagem com prejuízo na Leitura e Escrita (Dislexia do Desenvolvimento), associado a oscilações atencionais.',
      encaminhamentos: '1. Avaliação Fonoaudiológica para estimulação do processamento auditivo central.\n2. Consulta com Neuropediatra para avaliação clínica complementar.',
      orientacoesEscola: '• Concessão de tempo adicional (30 a 50%) na realização de avaliações escritas.\n• Leitura das instruções de provas em voz alta pelo mediador/professor.\n• Priorização de enunciados curtos, diretos e com fontes de alta legibilidade (Arial ou Comic Sans, tamanho 14+).\n• Não solicitar leitura oral exposta em sala de aula sem preparo prévio.',
      orientacoesFamilia: '• Estabelecer rotina diária previsível de estudos com pausas programadas de 5 minutos.\n• Realizar leitura compartilhada lúdica de 15 minutos diários, valorizando a compreensão da história.',
      status: 'Finalizado',
      tags: ['Laudo Clínico', 'Dislexia', 'Adaptações Escolares'],
      profissionalEmissor: 'Ester Lopes',
      registroEmissor: 'ABPp 4821/SP — Psicopedagoga Clínica'
    }
  ],
  usuarios: DEFAULT_USUARIOS_SISTEMA,
  configuracoes: defaultConfig
};

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncCode, setSyncCode] = useState<string>(() => {
    return localStorage.getItem('ninho_sync_code') || 'ninho-principal';
  });

  const [state, setState] = useState<ClinicState>(() => {
    const saved = localStorage.getItem(`ninho_clinic_data_${syncCode}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultInitialState,
          ...parsed,
          usuarios: parsed.usuarios && parsed.usuarios.length > 0 ? parsed.usuarios : DEFAULT_USUARIOS_SISTEMA,
          configuracoes: {
            ...defaultConfig,
            ...(parsed.configuracoes || {}),
            nomeClinica: (!parsed.configuracoes?.nomeClinica || parsed.configuracoes.nomeClinica.includes('EA'))
              ? 'Ninho'
              : parsed.configuracoes.nomeClinica,
            seguranca: {
              ...defaultConfig.seguranca,
              ...(parsed.configuracoes?.seguranca || {})
            }
          }
        };
      } catch (e) {
        console.error('Error parsing local storage clinic data', e);
      }
    }
    return defaultInitialState;
  });

  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [searchQuery, setSearchQuery] = useState<string>('');

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestStateRef = useRef<ClinicState>(state);
  const hasPendingLocalChangeRef = useRef(false);
  const lastLocalMutationAtRef = useRef<number>(0);

  // Sound chime for notifications
  const playNotificationSound = useCallback(() => {
    if (!state.configuracoes?.lembretesSonoros) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }, [state.configuracoes?.lembretesSonoros]);

  // Request browser notification permission
  const solicitarPermissaoNavegador = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      if (granted) {
        setState(prev => ({
          ...prev,
          configuracoes: {
            ...prev.configuracoes,
            notificacoesNavegador: true
          }
        }));
      }
      return granted;
    } catch (e) {
      return false;
    }
  };

  // Add in-app and browser notification
  const adicionarNotificacao = useCallback((notif: Omit<Notificacao, 'id' | 'timestamp' | 'lida'>) => {
    const novaNotificacao: Notificacao = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...notif,
      lida: false,
      timestamp: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      notificacoes: [novaNotificacao, ...prev.notificacoes.slice(0, 49)]
    }));

    playNotificationSound();

    if (
      state.configuracoes?.notificacoesNavegador &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(notif.titulo, {
          body: notif.mensagem,
          icon: '/favicon.ico'
        });
      } catch (e) {
        console.warn('Browser notification error', e);
      }
    }
  }, [playNotificationSound, state.configuracoes?.notificacoesNavegador]);

  const activeDataSyncCodeRef = useRef<string>(syncCode);

  // Keep latestStateRef and localStorage in sync for the active syncCode
  useEffect(() => {
    latestStateRef.current = state;
    localStorage.setItem('ninho_sync_code', syncCode);
    if (activeDataSyncCodeRef.current === syncCode) {
      localStorage.setItem(`ninho_clinic_data_${syncCode}`, JSON.stringify(state));
    }
  }, [state, syncCode]);

  // Merge server data safely preserving frontend structure
  const mergeServerData = useCallback((cloudData: Partial<ClinicState>, prev: ClinicState): ClinicState => {
    return {
      pacientes: cloudData.pacientes ?? prev.pacientes ?? [],
      agenda: cloudData.agenda ?? prev.agenda ?? [],
      sessoes: cloudData.sessoes ?? prev.sessoes ?? [],
      planos: cloudData.planos ?? prev.planos ?? [],
      financeiro: cloudData.financeiro ?? prev.financeiro ?? [],
      lembretes: cloudData.lembretes ?? prev.lembretes ?? [],
      notificacoes: cloudData.notificacoes ?? prev.notificacoes ?? [],
      relatorios: cloudData.relatorios ?? prev.relatorios ?? [],
      usuarios: (cloudData.usuarios && cloudData.usuarios.length > 0) ? cloudData.usuarios : prev.usuarios,
      configuracoes: {
        ...defaultConfig,
        ...(cloudData.configuracoes || prev.configuracoes),
        nomeClinica: (!cloudData.configuracoes?.nomeClinica || cloudData.configuracoes.nomeClinica.includes('EA'))
          ? 'Ninho'
          : cloudData.configuracoes.nomeClinica,
        opcoesRelatorio: {
          ...defaultOpcoesRelatorio,
          ...(cloudData.configuracoes?.opcoesRelatorio || prev.configuracoes?.opcoesRelatorio || {})
        },
        seguranca: {
          ...defaultConfig.seguranca,
          ...(cloudData.configuracoes?.seguranca || prev.configuracoes?.seguranca || {})
        }
      }
    };
  }, []);

  // Push updates directly to MySQL/MariaDB via /api/sync
  const pushToCloud = useCallback(async (dataToPush: ClinicState, code: string): Promise<boolean> => {
    setSyncState('syncing');
    try {
      const res = await fetch(`/api/sync/${encodeURIComponent(code)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToPush)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      hasPendingLocalChangeRef.current = false;
      setSyncState('synced');
      setLastSyncTime(new Date());
      return true;
    } catch (backendErr) {
      console.warn('Falha ao salvar no MariaDB via /api/sync:', backendErr);
      hasPendingLocalChangeRef.current = true;
      setSyncState('offline');
      return false;
    }
  }, []);

  // Load clinic data directly from MySQL/MariaDB via /api/sync
  const fetchFromServer = useCallback(async (code: string, isBackgroundPoll = false): Promise<ClinicState | null> => {
    if (isBackgroundPoll && (hasPendingLocalChangeRef.current || Date.now() - lastLocalMutationAtRef.current < 3000)) {
      return null;
    }
    if (!isBackgroundPoll) {
      setSyncState('syncing');
    }
    try {
      const res = await fetch(`/api/sync/${encodeURIComponent(code)}`, {
        method: 'GET',
        cache: 'no-store'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json?.data && typeof json.data === 'object') {
        if (isBackgroundPoll && (hasPendingLocalChangeRef.current || Date.now() - lastLocalMutationAtRef.current < 3000)) {
          return null;
        }
        const merged = mergeServerData(json.data as Partial<ClinicState>, latestStateRef.current);
        activeDataSyncCodeRef.current = code;
        latestStateRef.current = merged;
        localStorage.setItem(`ninho_clinic_data_${code}`, JSON.stringify(merged));
        setState(merged);
        setSyncState('synced');
        setLastSyncTime(new Date());
        return merged;
      }
      return null;
    } catch (err) {
      console.warn('Erro ao carregar dados do MariaDB via /api/sync:', err);
      setSyncState('offline');
      return null;
    }
  }, [mergeServerData]);

  // Persist mutation immediately to MariaDB using await
  const commitMutation = useCallback(async (updater: (prev: ClinicState) => ClinicState): Promise<ClinicState> => {
    const next = updater(latestStateRef.current);
    activeDataSyncCodeRef.current = syncCode;
    latestStateRef.current = next;
    hasPendingLocalChangeRef.current = true;
    lastLocalMutationAtRef.current = Date.now();
    localStorage.setItem(`ninho_clinic_data_${syncCode}`, JSON.stringify(next));
    setState(next);
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    await pushToCloud(next, syncCode);
    return next;
  }, [pushToCloud, syncCode]);

  // Flush pending sync before page unload/visibility change
  useEffect(() => {
    const flushPendingSync = () => {
      if (hasPendingLocalChangeRef.current) {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        const body = JSON.stringify(latestStateRef.current);
        fetch(`/api/sync/${encodeURIComponent(syncCode)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: body.length < 60000
        }).catch(() => {});
      }
    };

    window.addEventListener('pagehide', flushPendingSync);
    window.addEventListener('beforeunload', flushPendingSync);
    return () => {
      window.removeEventListener('pagehide', flushPendingSync);
      window.removeEventListener('beforeunload', flushPendingSync);
    };
  }, [syncCode]);

  // Load initial data from MariaDB and keep synced via periodic polling
  useEffect(() => {
    fetchFromServer(syncCode, false);

    const intervalMs = Math.max(5, Number(state.configuracoes?.syncIntervalSec) || 15) * 1000;
    const pollInterval = setInterval(() => {
      if (state.configuracoes?.syncAuto) {
        fetchFromServer(syncCode, true);
      }
    }, intervalMs);

    return () => {
      clearInterval(pollInterval);
    };
  }, [syncCode, fetchFromServer, state.configuracoes?.syncAuto, state.configuracoes?.syncIntervalSec]);

  // Periodic reminder checking
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.configuracoes?.notificacoesAtivas) return;
      const hojeStr = new Date().toISOString().slice(0, 10);
      const agoraHora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // Check upcoming today's appointments
      state.agenda.forEach(ag => {
        if (ag.data === hojeStr && ag.status === 'Confirmado') {
          const pacNome = state.pacientes.find(p => p.id === ag.pacienteId)?.nome || 'Paciente';
          // Check if already notified
          const key = `notif_ag_${ag.id}_${ag.data}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            adicionarNotificacao({
              tipo: 'agenda',
              titulo: `Sessão hoje às ${ag.hora}`,
              mensagem: `${pacNome} - ${ag.tipo} (${ag.duracao} min)`,
              linkTab: 'agenda',
              actionId: ag.id
            });
          }
        }
      });

      // Check pending reminders
      state.lembretes.forEach(lem => {
        if (!lem.concluido && lem.data === hojeStr) {
          const key = `notif_lem_${lem.id}_${lem.data}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            adicionarNotificacao({
              tipo: 'lembrete',
              titulo: `Lembrete: ${lem.titulo}`,
              mensagem: lem.descricao || 'Lembrete programado para hoje.',
              linkTab: 'lembretes',
              actionId: lem.id
            });
          }
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [state, adicionarNotificacao]);

  // CRUD Implementations
  const addPaciente = async (p: Omit<Paciente, 'id'>): Promise<string> => {
    const id = `pac_${Date.now()}`;
    const novo: Paciente = { id, ...p };

    await commitMutation(prev => ({
      ...prev,
      pacientes: [novo, ...prev.pacientes]
    }));

    adicionarNotificacao({
      tipo: 'sistema',
      titulo: 'Novo Paciente Cadastrado',
      mensagem: `${novo.nome} foi adicionado(a) com sucesso ao prontuário.`,
      linkTab: 'pacientes',
      actionId: id
    });
    return id;
  };

  const updatePaciente = async (id: string, p: Partial<Paciente>): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      pacientes: prev.pacientes.map(item => item.id === id ? { ...item, ...p } : item)
    }));
  };

  const deletePaciente = async (id: string): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      pacientes: prev.pacientes.filter(item => item.id !== id),
      agenda: prev.agenda.filter(item => item.pacienteId !== id),
      sessoes: prev.sessoes.filter(item => item.pacienteId !== id),
      planos: prev.planos.filter(item => item.pacienteId !== id),
      financeiro: prev.financeiro.filter(item => item.pacienteId !== id),
      lembretes: prev.lembretes.filter(item => item.pacienteId !== id)
    }));
  };

  const anexarDocumentoPaciente = async (
    pacienteId: string,
    docData: Omit<DocumentoAnexo, 'id' | 'dataUpload'>
  ): Promise<DocumentoAnexo> => {
    const novoDoc: DocumentoAnexo = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dataUpload: new Date().toISOString(),
      ...docData
    };
    const updated = await commitMutation(prev => ({
      ...prev,
      pacientes: prev.pacientes.map(item => {
        if (item.id === pacienteId) {
          return {
            ...item,
            documentos: [...(item.documentos || []), novoDoc]
          };
        }
        return item;
      })
    }));

    const pac = updated.pacientes.find(p => p.id === pacienteId);
    adicionarNotificacao({
      tipo: 'sistema',
      titulo: 'Documento Anexado',
      mensagem: `Documento "${novoDoc.nome}" foi anexado com sucesso ao prontuário de ${pac?.nome || 'paciente'}.`,
      linkTab: 'pacientes',
      actionId: pacienteId
    });

    return novoDoc;
  };

  const removerDocumentoPaciente = async (
    pacienteId: string,
    documentoId: string
  ): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      pacientes: prev.pacientes.map(item => {
        if (item.id === pacienteId) {
          return {
            ...item,
            documentos: (item.documentos || []).filter(d => d.id !== documentoId)
          };
        }
        return item;
      })
    }));
  };

  // Agenda
  const addAgendaItem = async (item: Omit<AgendaItem, 'id'>): Promise<string> => {
    const id = `ag_${Date.now()}`;
    const novo: AgendaItem = { id, ...item };
    await commitMutation(prev => ({
      ...prev,
      agenda: [...prev.agenda, novo]
    }));
    return id;
  };

  const updateAgendaItem = async (id: string, item: Partial<AgendaItem>): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      agenda: prev.agenda.map(ag => ag.id === id ? { ...ag, ...item } : ag)
    }));
  };

  const deleteAgendaItem = async (id: string): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      agenda: prev.agenda.filter(ag => ag.id !== id)
    }));
  };

  // Sessões
  const addSessao = async (sessao: Omit<Sessao, 'id'>): Promise<string> => {
    const id = `ses_${Date.now()}`;
    const novo: Sessao = { id, ...sessao };
    const updated = await commitMutation(prev => ({
      ...prev,
      sessoes: [novo, ...prev.sessoes]
    }));
    const pacNome = updated.pacientes.find(p => p.id === sessao.pacienteId)?.nome || 'Paciente';
    adicionarNotificacao({
      tipo: 'sistema',
      titulo: 'Evolução Registrada',
      mensagem: `Sessão de ${pacNome} registrada em ${sessao.data}.`,
      linkTab: 'sessoes',
      actionId: id
    });
    return id;
  };

  const updateSessao = async (id: string, sessao: Partial<Sessao>): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      sessoes: prev.sessoes.map(s => s.id === id ? { ...s, ...sessao } : s)
    }));
  };

  const deleteSessao = async (id: string): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      sessoes: prev.sessoes.filter(s => s.id !== id)
    }));
  };

  // Planos
  const addPlano = async (plano: Omit<PlanoIntervencao, 'id'>): Promise<string> => {
    const id = `pl_${Date.now()}`;
    const novo: PlanoIntervencao = {
      id,
      ...plano,
      dataCriacao: plano.dataCriacao || new Date().toISOString().slice(0, 10)
    };
    await commitMutation(prev => ({
      ...prev,
      planos: [novo, ...prev.planos]
    }));
    return id;
  };

  const updatePlano = async (id: string, plano: Partial<PlanoIntervencao>): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      planos: prev.planos.map(pl => pl.id === id ? { ...pl, ...plano } : pl)
    }));
  };

  const deletePlano = async (id: string): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      planos: prev.planos.filter(pl => pl.id !== id)
    }));
  };

  // Financeiro
  const addFinanceiro = async (fin: Omit<LancamentoFinanceiro, 'id'>): Promise<string> => {
    const id = `fin_${Date.now()}`;
    const novo: LancamentoFinanceiro = { id, ...fin };
    await commitMutation(prev => ({
      ...prev,
      financeiro: [novo, ...prev.financeiro]
    }));
    return id;
  };

  const updateFinanceiro = async (id: string, fin: Partial<LancamentoFinanceiro>): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      financeiro: prev.financeiro.map(f => f.id === id ? { ...f, ...fin } : f)
    }));
  };

  const marcarPago = async (id: string): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      financeiro: prev.financeiro.map(f => f.id === id ? {
        ...f,
        status: 'Pago' as const,
        dataPag: new Date().toISOString().slice(0, 10)
      } : f)
    }));
  };

  const deleteFinanceiro = async (id: string): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      financeiro: prev.financeiro.filter(f => f.id !== id)
    }));
  };

  // Lembretes
  const addLembrete = async (lem: Omit<Lembrete, 'id' | 'concluido'>): Promise<string> => {
    const id = `lem_${Date.now()}`;
    const novo: Lembrete = { id, ...lem, concluido: false };
    await commitMutation(prev => ({
      ...prev,
      lembretes: [novo, ...prev.lembretes]
    }));
    adicionarNotificacao({
      tipo: 'lembrete',
      titulo: 'Novo Lembrete Criado',
      mensagem: `${novo.titulo} programado para ${novo.data} ${novo.hora || ''}.`,
      linkTab: 'lembretes',
      actionId: id
    });
    return id;
  };

  const toggleLembrete = async (id: string): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      lembretes: prev.lembretes.map(l => l.id === id ? { ...l, concluido: !l.concluido } : l)
    }));
  };

  const deleteLembrete = async (id: string): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      lembretes: prev.lembretes.filter(l => l.id !== id)
    }));
  };

  // Relatórios & Laudos
  const addRelatorio = async (rel: Omit<RelatorioDocumento, 'id'>): Promise<string> => {
    const id = `rel_${Date.now()}`;
    const novo: RelatorioDocumento = {
      id,
      ...rel,
      dataEmissao: rel.dataEmissao || new Date().toISOString().slice(0, 10),
      status: rel.status || 'Finalizado'
    };
    const updated = await commitMutation(prev => ({
      ...prev,
      relatorios: [novo, ...(prev.relatorios || [])]
    }));
    const pacNome = updated.pacientes.find(p => p.id === rel.pacienteId)?.nome || 'Paciente';
    adicionarNotificacao({
      tipo: 'sistema',
      titulo: 'Documento Clínico Gerado',
      mensagem: `${novo.titulo} de ${pacNome} foi emitido com sucesso.`,
      linkTab: 'relatorio',
      actionId: id
    });
    return id;
  };

  const updateRelatorio = async (id: string, rel: Partial<RelatorioDocumento>): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      relatorios: (prev.relatorios || []).map(r => r.id === id ? { ...r, ...rel } : r)
    }));
  };

  const deleteRelatorio = async (id: string): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      relatorios: (prev.relatorios || []).filter(r => r.id !== id)
    }));
  };

  const duplicarRelatorio = async (id: string): Promise<string> => {
    const original = (latestStateRef.current.relatorios || []).find(r => r.id === id);
    if (!original) throw new Error('Relatório original não encontrado');
    const newId = `rel_${Date.now()}`;
    const duplicado: RelatorioDocumento = {
      ...original,
      id: newId,
      titulo: `${original.titulo} (Cópia)`,
      dataEmissao: new Date().toISOString().slice(0, 10),
      status: 'Rascunho'
    };
    await commitMutation(prev => ({
      ...prev,
      relatorios: [duplicado, ...(prev.relatorios || [])]
    }));
    return newId;
  };

  // Notificações
  const marcarNotificacaoLida = (id: string) => {
    setState(prev => ({
      ...prev,
      notificacoes: prev.notificacoes.map(n => n.id === id ? { ...n, lida: true } : n)
    }));
  };

  const marcarTodasNotificacoesLidas = () => {
    setState(prev => ({
      ...prev,
      notificacoes: prev.notificacoes.map(n => ({ ...n, lida: true }))
    }));
  };

  const limparNotificacoes = () => {
    setState(prev => ({
      ...prev,
      notificacoes: []
    }));
  };

  // Usuários do Sistema & Níveis de Acesso
  const addUsuario = async (u: Omit<UsuarioSistema, 'id' | 'criadoEm'>): Promise<string> => {
    const newId = `user_${Date.now()}`;
    const novoUsuario: UsuarioSistema = {
      ...u,
      id: newId,
      criadoEm: new Date().toISOString().slice(0, 10),
      ativo: u.ativo ?? true
    };
    await commitMutation(prev => ({
      ...prev,
      usuarios: [...(prev.usuarios || DEFAULT_USUARIOS_SISTEMA), novoUsuario]
    }));
    return newId;
  };

  const updateUsuario = async (id: string, u: Partial<UsuarioSistema>): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      usuarios: (prev.usuarios || DEFAULT_USUARIOS_SISTEMA).map(user =>
        user.id === id ? { ...user, ...u } : user
      )
    }));
  };

  const deleteUsuario = async (id: string): Promise<void> => {
    const currentList = latestStateRef.current.usuarios || DEFAULT_USUARIOS_SISTEMA;
    const admins = currentList.filter(user => user.nivelAcesso === 'admin' && user.id !== id);
    if (admins.length === 0) {
      throw new Error('Não é possível remover o único administrador do sistema.');
    }
    await commitMutation(prev => {
      const list = prev.usuarios || DEFAULT_USUARIOS_SISTEMA;
      return {
        ...prev,
        usuarios: list.filter(user => user.id !== id)
      };
    });
  };

  const resetSenhaUsuario = async (id: string, novaSenha: string): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      usuarios: (prev.usuarios || DEFAULT_USUARIOS_SISTEMA).map(user =>
        user.id === id ? { ...user, senha: novaSenha } : user
      )
    }));
  };

  const updateConfigSeguranca = async (cfg: Partial<ConfiguracaoSeguranca>): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      configuracoes: {
        ...prev.configuracoes,
        seguranca: {
          ...defaultConfig.seguranca!,
          ...(prev.configuracoes?.seguranca || {}),
          ...cfg
        }
      }
    }));
  };

  // Configurações & Nuvem
  const updateConfiguracoes = async (config: Partial<ConfiguracaoClinica>): Promise<void> => {
    await commitMutation(prev => ({
      ...prev,
      configuracoes: { ...prev.configuracoes, ...config }
    }));
  };

  const alterarSyncCode = async (newCode: string): Promise<void> => {
    const clean = newCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!clean) return;
    localStorage.setItem('ninho_sync_code', clean);
    setSyncCode(clean);
  };

  const forcarSincronizacao = async (): Promise<void> => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    await pushToCloud(latestStateRef.current, syncCode);
  };

  const recarregarDaNuvem = async (): Promise<ClinicState | null> => {
    return await fetchFromServer(syncCode, false);
  };

  const restaurarDadosPadrao = async (): Promise<void> => {
    activeDataSyncCodeRef.current = syncCode;
    latestStateRef.current = defaultInitialState;
    localStorage.setItem(`ninho_clinic_data_${syncCode}`, JSON.stringify(defaultInitialState));
    setState(defaultInitialState);
    await pushToCloud(defaultInitialState, syncCode);
  };

  const exportarBackupJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ninho_aprendiz_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importarBackupJSON = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.pacientes && Array.isArray(parsed.pacientes)) {
        setState(parsed);
        await pushToCloud(parsed, syncCode);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error importing backup JSON', e);
      return false;
    }
  };

  return (
    <ClinicContext.Provider
      value={{
        state,
        syncState,
        lastSyncTime,
        syncCode,
        searchQuery,
        setSearchQuery,
        addPaciente,
        updatePaciente,
        deletePaciente,
        anexarDocumentoPaciente,
        removerDocumentoPaciente,
        addAgendaItem,
        updateAgendaItem,
        deleteAgendaItem,
        addSessao,
        updateSessao,
        deleteSessao,
        addPlano,
        updatePlano,
        deletePlano,
        addFinanceiro,
        updateFinanceiro,
        marcarPago,
        deleteFinanceiro,
        addLembrete,
        toggleLembrete,
        deleteLembrete,
        addRelatorio,
        updateRelatorio,
        deleteRelatorio,
        duplicarRelatorio,
        addUsuario,
        updateUsuario,
        deleteUsuario,
        resetSenhaUsuario,
        updateConfigSeguranca,
        marcarNotificacaoLida,
        marcarTodasNotificacoesLidas,
        limparNotificacoes,
        adicionarNotificacao,
        solicitarPermissaoNavegador,
        updateConfiguracoes,
        alterarSyncCode,
        forcarSincronizacao,
        recarregarDaNuvem,
        restaurarDadosPadrao,
        exportarBackupJSON,
        importarBackupJSON
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}
