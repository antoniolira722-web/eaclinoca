import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import mysql, { RowDataPacket } from 'mysql2/promise';

// Ignore benign WebSocket/HMR port conflicts in dev environment
process.on('uncaughtException', (err: any) => {
  if (err?.message && (err.message.includes('WebSocket') || err.message.includes('24678'))) {
    console.warn('Vite WebSocket warning suppressed:', err.message);
    return;
  }
  console.error('Uncaught server exception:', err);
});

const app = express();
const PORT = Number(process.env.PORT) || (process.env.NODE_ENV === 'production' ? 8080 : 3000);

app.use(express.json({ limit: '25mb' }));

// MariaDB / MySQL Connection Pool (via environment variables only)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

interface ClinicData {
  pacientes: any[];
  agenda: any[];
  sessoes: any[];
  planos: any[];
  financeiro: any[];
  lembretes: any[];
  notificacoes: any[];
  relatorios?: any[];
  usuarios?: any[];
  configuracoes: any;
  lastUpdated: string;
  version: number;
}

const DEFAULT_SYNC_CODE = 'ninho-principal';

const TABLE_DDL_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS clinic_data (
    sync_code VARCHAR(100) NOT NULL PRIMARY KEY,
    data JSON NOT NULL,
    version INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS clientes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_clientes_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS pacientes (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    sync_code VARCHAR(100) NOT NULL DEFAULT 'ninho-principal',
    nome VARCHAR(255) NOT NULL,
    nasc VARCHAR(20) NOT NULL,
    categoria VARCHAR(100) NULL,
    escola VARCHAR(255) NULL,
    serie VARCHAR(100) NULL,
    resp VARCHAR(255) NOT NULL,
    fone VARCHAR(50) NULL,
    email VARCHAR(255) NULL,
    queixa TEXT NOT NULL,
    alergias TEXT NULL,
    medicacao TEXT NULL,
    data_inicio VARCHAR(20) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Ativo',
    tags JSON NULL,
    notas_gerais LONGTEXT NULL,
    dados_perinatais JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_pacientes_sync_code (sync_code),
    KEY idx_pacientes_nome (nome)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS paciente_documentos (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    sync_code VARCHAR(100) NOT NULL DEFAULT 'ninho-principal',
    paciente_id VARCHAR(100) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(150) NULL,
    categoria VARCHAR(150) NULL,
    tamanho BIGINT NULL,
    data_upload VARCHAR(50) NOT NULL,
    url LONGTEXT NULL,
    descricao TEXT NULL,
    enviado_por VARCHAR(150) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_pac_docs_sync_code (sync_code),
    KEY idx_pac_docs_paciente (paciente_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS agenda (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    sync_code VARCHAR(100) NOT NULL DEFAULT 'ninho-principal',
    paciente_id VARCHAR(100) NOT NULL,
    data VARCHAR(20) NOT NULL,
    hora VARCHAR(10) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    prof VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Agendado',
    duracao INT NOT NULL DEFAULT 50,
    notas TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_agenda_sync_code (sync_code),
    KEY idx_agenda_paciente (paciente_id),
    KEY idx_agenda_data (data)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS sessoes (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    sync_code VARCHAR(100) NOT NULL DEFAULT 'ninho-principal',
    paciente_id VARCHAR(100) NOT NULL,
    data VARCHAR(20) NOT NULL,
    tipo_atendimento VARCHAR(80) NULL,
    objetivos TEXT NOT NULL,
    atividades TEXT NOT NULL,
    obs TEXT NOT NULL,
    tarefa TEXT NOT NULL,
    avaliacao_humor VARCHAR(80) NULL,
    tempo_gasto INT NULL,
    dados_perinatal JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_sessoes_sync_code (sync_code),
    KEY idx_sessoes_paciente (paciente_id),
    KEY idx_sessoes_data (data)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS planos_intervencao (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    sync_code VARCHAR(100) NOT NULL DEFAULT 'ninho-principal',
    paciente_id VARCHAR(100) NOT NULL,
    tipo_plano VARCHAR(80) NULL,
    hipotese TEXT NOT NULL,
    objetivos TEXT NOT NULL,
    estrategias TEXT NOT NULL,
    freq VARCHAR(150) NOT NULL,
    reav VARCHAR(20) NOT NULL,
    data_criacao VARCHAR(20) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Em andamento',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_planos_sync_code (sync_code),
    KEY idx_planos_paciente (paciente_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS financeiro (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    sync_code VARCHAR(100) NOT NULL DEFAULT 'ninho-principal',
    paciente_id VARCHAR(100) NOT NULL,
    comp VARCHAR(20) NOT NULL,
    valor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'Pendente',
    data_venc VARCHAR(20) NOT NULL,
    data_pag VARCHAR(20) NULL,
    forma_pag VARCHAR(100) NULL,
    descricao VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_financeiro_sync_code (sync_code),
    KEY idx_financeiro_paciente (paciente_id),
    KEY idx_financeiro_comp (comp)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS lembretes (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    sync_code VARCHAR(100) NOT NULL DEFAULT 'ninho-principal',
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NULL,
    data VARCHAR(20) NOT NULL,
    hora VARCHAR(10) NULL,
    paciente_id VARCHAR(100) NULL,
    prioridade VARCHAR(30) NOT NULL DEFAULT 'Média',
    concluido TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_lembretes_sync_code (sync_code),
    KEY idx_lembretes_data (data)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS notificacoes (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    sync_code VARCHAR(100) NOT NULL DEFAULT 'ninho-principal',
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    lida TINYINT(1) NOT NULL DEFAULT 0,
    timestamp VARCHAR(50) NOT NULL,
    link_tab VARCHAR(50) NULL,
    action_id VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_notificacoes_sync_code (sync_code)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS relatorios (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    sync_code VARCHAR(100) NOT NULL DEFAULT 'ninho-principal',
    paciente_id VARCHAR(100) NOT NULL,
    tipo VARCHAR(80) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    data_emissao VARCHAR(20) NOT NULL,
    solicitante VARCHAR(255) NULL,
    finalidade TEXT NULL,
    queixa_principal TEXT NULL,
    historico_breve TEXT NULL,
    instrumentos_utilizados JSON NULL,
    observacoes_comportamentais TEXT NULL,
    analise_cognitiva TEXT NULL,
    analise_pedagogica TEXT NULL,
    conclusao_hipotese TEXT NULL,
    encaminhamentos TEXT NULL,
    orientacoes_escola TEXT NULL,
    orientacoes_familia TEXT NULL,
    texto_livre LONGTEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Finalizado',
    tags JSON NULL,
    profissional_emissor VARCHAR(255) NULL,
    registro_emissor VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_relatorios_sync_code (sync_code),
    KEY idx_relatorios_paciente (paciente_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS usuarios_sistema (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    sync_code VARCHAR(100) NOT NULL DEFAULT 'ninho-principal',
    nome VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NULL,
    senha VARCHAR(255) NOT NULL,
    cargo VARCHAR(150) NOT NULL,
    nivel_acesso VARCHAR(50) NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    avatar_color VARCHAR(30) NULL,
    criado_em VARCHAR(30) NOT NULL,
    ultimo_acesso VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_usuarios_sync_code (sync_code),
    UNIQUE KEY uq_usuarios_sync_username (sync_code, username)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS configuracoes_clinica (
    sync_code VARCHAR(100) NOT NULL PRIMARY KEY,
    nome_clinica VARCHAR(255) NOT NULL DEFAULT 'Ninho',
    profissional VARCHAR(255) NOT NULL DEFAULT 'Ester Lopes',
    registro_profissional VARCHAR(150) NULL,
    contato VARCHAR(255) NULL,
    endereco VARCHAR(255) NULL,
    telefone_clinica VARCHAR(50) NULL,
    chave_pix VARCHAR(255) NULL,
    valor_padrao DECIMAL(10,2) NULL DEFAULT 180.00,
    tema VARCHAR(20) NOT NULL DEFAULT 'system',
    notificacoes_ativas TINYINT(1) NOT NULL DEFAULT 1,
    notificacoes_navegador TINYINT(1) NOT NULL DEFAULT 0,
    lembretes_sonoros TINYINT(1) NOT NULL DEFAULT 1,
    sync_auto TINYINT(1) NOT NULL DEFAULT 1,
    sync_interval_sec INT NOT NULL DEFAULT 15,
    opcoes_relatorio JSON NULL,
    seguranca JSON NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];

async function ensureDatabaseTables(): Promise<void> {
  for (const ddl of TABLE_DDL_STATEMENTS) {
    await db.query(ddl);
  }
}

async function verificarBanco(): Promise<void> {
  try {
    await db.query('SELECT 1');
    await ensureDatabaseTables();
    console.log('Conexão com o MariaDB estabelecida e tabelas verificadas');
  } catch (erro: any) {
    console.error('Erro ao conectar ao MariaDB:', erro?.code || erro?.message || 'Erro desconhecido');
    throw erro;
  }
}

async function loadClinicData(syncCode: string): Promise<ClinicData | null> {
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT data, version, updated_at FROM clinic_data WHERE sync_code = ? LIMIT 1',
    [syncCode]
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  const parsed: ClinicData =
    typeof row.data === 'string' ? JSON.parse(row.data) : row.data;

  return {
    ...parsed,
    version: row.version ?? parsed?.version ?? 1,
    lastUpdated: parsed?.lastUpdated || (row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString())
  };
}

async function saveClinicData(syncCode: string, data: ClinicData): Promise<void> {
  const version = Number(data.version) || 1;
  const payloadToSave: ClinicData = {
    ...data,
    version,
    lastUpdated: data.lastUpdated || new Date().toISOString()
  };

  await db.execute(
    `INSERT INTO clinic_data (sync_code, data, version)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       data = VALUES(data),
       version = VALUES(version)`,
    [syncCode, JSON.stringify(payloadToSave), version]
  );
}

// Initial default seed data for demonstration if new
const initialData: ClinicData = {
  pacientes: [
    {
      id: 'pac_1',
      nome: 'Lucas Gabriel Silva',
      nasc: '2017-04-12',
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
      tags: ['Dislexia (Hipótese)', 'TDAH', 'Alfabetização']
    },
    {
      id: 'pac_2',
      nome: 'Beatriz Martins de Oliveira',
      nasc: '2016-09-25',
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
      nome: 'Enzo Ramos Costa',
      nasc: '2019-11-03',
      escola: 'Centro de Educação Infantil Girassol',
      serie: 'Pré II',
      resp: 'Fernanda Ramos (Mãe)',
      fone: '(11) 96321-7744',
      email: 'fernanda.ramos@email.com',
      queixa: 'Atraso no desenvolvimento psicomotor fino, dificuldade no controle do lápis e baixa tolerância à frustração.',
      alergias: 'Rinite alérgica',
      medicacao: 'Nenhuma',
      dataInicio: '2026-03-01',
      status: 'Ativo',
      tags: ['Psicomotricidade', 'Grafomotricidade', 'Educação Infantil']
    }
  ],
  agenda: [
    {
      id: 'ag_1',
      pacienteId: 'pac_1',
      data: new Date().toISOString().slice(0, 10),
      hora: '14:00',
      tipo: 'Sessão',
      prof: 'Ester Lopes (Psicopedagoga)',
      status: 'Confirmado',
      duracao: 50,
      notas: 'Trabalhar jogo de consciência fonológica e pareamento grafema-fonema.'
    },
    {
      id: 'ag_2',
      pacienteId: 'pac_2',
      data: new Date().toISOString().slice(0, 10),
      hora: '15:30',
      tipo: 'Sessão',
      prof: 'Ester Lopes (Psicopedagoga)',
      status: 'Confirmado',
      duracao: 50,
      notas: 'Uso do material dourado e resolução de problemas estruturados.'
    },
    {
      id: 'ag_3',
      pacienteId: 'pac_3',
      data: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      hora: '10:00',
      tipo: 'Avaliação',
      prof: 'Ester Lopes (Psicopedagoga)',
      status: 'Agendado',
      duracao: 60,
      notas: 'Aplicação da prova de conservação de Piaget e desenho da figura humana.'
    },
    {
      id: 'ag_4',
      pacienteId: 'pac_1',
      data: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      hora: '16:00',
      tipo: 'Orientação familiar',
      prof: 'Ester Lopes (Psicopedagoga)',
      status: 'Agendado',
      duracao: 45,
      notas: 'Devolutiva parcial sobre avanços de leitura e rotina em casa.'
    }
  ],
  sessoes: [
    {
      id: 'ses_1',
      pacienteId: 'pac_1',
      data: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10),
      objetivos: 'Estimular consciência fonológica (rima e aliteração) e autorregulação da atenção.',
      atividades: 'Jogo de trilha fonológica com cartas ilustradas; formação de palavras com alfabeto móvel magnético; leitura guiada de miniconto ilustrado.',
      obs: 'Lucas demonstrou excelente engajamento durante a dinâmica lúdica. Reconheceu com facilidade rimas em versos e mostrou avanço na correspondência letra-som.',
      tarefa: 'Brincadeira de detetive de rimas com a mãe durante a leitura noturna (10 minutos diários).',
      avaliacaoHumor: 'Ótimo',
      tempoGasto: 50
    },
    {
      id: 'ses_2',
      pacienteId: 'pac_2',
      data: new Date(Date.now() - 86400000 * 4).toISOString().slice(0, 10),
      objetivos: 'Compreensão do sistema de numeração decimal e valor posicional.',
      atividades: 'Trabalho prático com material dourado e ábaco aberto. Construção de estratégias mentais de decomposição numérica.',
      obs: 'Beatriz conseguiu superar a frustração inicial ao manipular o material concreto, compreendendo as trocas de dezena.',
      tarefa: 'Jogo das trocas (de 10 em 10) utilizando moedas de mentira com os pais.',
      avaliacaoHumor: 'Bom',
      tempoGasto: 50
    }
  ],
  planos: [
    {
      id: 'pl_1',
      pacienteId: 'pac_1',
      hipotese: 'Quadro compatível com dificuldades específicas no processamento fonológico e decodificação leitora, associado a déficit atencional leve.',
      objetivos: '1. Desenvolver consciência fonológica em níveis silábico e fonêmico.\n2. Aumentar velocidade e precisão na decodificação de palavras de alta e baixa frequência.\n3. Fortalecer a memória de trabalho verbal através de jogos com regras estruturadas.',
      estrategias: 'Intervenção multissensorial estruturada (visuomotor e auditivo), uso de pistas gestuais para fonemas, jogos de tabuleiro de mediação cognitiva.',
      freq: '2x por semana (50 min cada)',
      reav: new Date(Date.now() + 86400000 * 45).toISOString().slice(0, 10),
      dataCriacao: '2026-02-15',
      status: 'Em andamento'
    },
    {
      id: 'pl_2',
      pacienteId: 'pac_2',
      hipotese: 'Dificuldade na internalização do conceito de número, representação espacial de quantidades e senso numérico.',
      objetivos: '1. Consolidar noções de contagem, seriação, conservação e valor posicional.\n2. Reduzir a ansiedade matemática através de abordagem baseada em jogos.\n3. Desenvolver flexibilidade cognitiva para resolução de problemas cotidianos.',
      estrategias: 'Material dourado, régua numérica tátil, desafios contextualizados com storytelling, reforço positivo contingente.',
      freq: '1x por semana (60 min)',
      reav: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      dataCriacao: '2026-01-20',
      status: 'Em andamento'
    }
  ],
  financeiro: [
    {
      id: 'fin_1',
      pacienteId: 'pac_1',
      comp: '2026-08',
      valor: 720.00,
      status: 'Pago',
      dataVenc: '2026-08-10',
      dataPag: '2026-08-08',
      formaPag: 'PIX',
      descricao: 'Mensalidade de 4 sessões psicopedagógicas'
    },
    {
      id: 'fin_2',
      pacienteId: 'pac_2',
      comp: '2026-08',
      valor: 640.00,
      status: 'Pendente',
      dataVenc: '2026-08-30',
      dataPag: '',
      formaPag: 'Boleto / PIX',
      descricao: 'Mensalidade de 4 sessões psicopedagógicas'
    },
    {
      id: 'fin_3',
      pacienteId: 'pac_3',
      comp: '2026-08',
      valor: 350.00,
      status: 'Atrasado',
      dataVenc: '2026-08-15',
      dataPag: '',
      formaPag: 'PIX',
      descricao: 'Pacote de Avaliação Inicial (1ª parcela)'
    }
  ],
  lembretes: [
    {
      id: 'lem_1',
      titulo: 'Reunião pedagógica com a professora do Lucas',
      descricao: 'Alinhar adaptação curricular para leitura na Escola Monteiro Lobato.',
      data: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      hora: '11:00',
      pacienteId: 'pac_1',
      prioridade: 'Alta',
      concluido: false
    },
    {
      id: 'lem_2',
      titulo: 'Enviar questionário sensorial para a família da Beatriz',
      descricao: 'Coleta de dados complementares para o relatório trimestral.',
      data: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      hora: '09:00',
      pacienteId: 'pac_2',
      prioridade: 'Média',
      concluido: false
    }
  ],
  notificacoes: [
    {
      id: 'notif_1',
      tipo: 'agenda',
      titulo: 'Sessão agendada hoje às 14:00',
      mensagem: 'Paciente: Lucas Gabriel Silva (Sessão de Consciência Fonológica)',
      lida: false,
      timestamp: new Date().toISOString()
    },
    {
      id: 'notif_2',
      tipo: 'financeiro',
      titulo: 'Cobrança em atraso',
      mensagem: 'Enzo Ramos Costa possui fatura de R$ 350,00 vencida desde 15/08.',
      lida: false,
      timestamp: new Date().toISOString()
    },
    {
      id: 'notif_3',
      tipo: 'reavaliacao',
      titulo: 'Reavaliação de Plano próxima',
      mensagem: 'O plano de Beatriz Martins vence em 30 dias. Prepare a bateria de testes.',
      lida: false,
      timestamp: new Date().toISOString()
    }
  ],
  configuracoes: {
    nomeClinica: 'Ninho',
    profissional: 'Ester Lopes',
    registroProfissional: 'ABPp 4821/SP',
    contato: '(11) 98765-0000 · contato@ninho.com.br',
    endereco: 'Av. Paulista, 1000 - Cj 84 - Bela Vista, São Paulo - SP',
    tema: 'system', // 'light' | 'dark' | 'system'
    notificacoesAtivas: true,
    lembretesSonoros: false,
    syncAuto: true,
    syncIntervalSec: 15
  },
  lastUpdated: new Date().toISOString(),
  version: 1
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Database connection test endpoint (never exposes credentials)
app.get('/api/health/db', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({
      ok: true,
      status: 'connected',
      time: new Date().toISOString()
    });
  } catch (erro: any) {
    console.error('Erro no healthcheck do banco:', erro?.code || erro?.message || 'Erro desconhecido');
    res.status(500).json({
      ok: false,
      status: 'error',
      erro: 'Não foi possível conectar ao banco de dados'
    });
  }
});

// Get clinic data by syncCode (default or custom)
app.get('/api/sync/:syncCode?', async (req, res) => {
  try {
    const syncCode = (req.params.syncCode || DEFAULT_SYNC_CODE).trim() || DEFAULT_SYNC_CODE;
    let data = await loadClinicData(syncCode);
    if (!data) {
      data = { ...initialData, lastUpdated: new Date().toISOString(), version: 1 };
      await saveClinicData(syncCode, data);
    }
    res.json({
      success: true,
      syncCode,
      data,
      serverTime: new Date().toISOString()
    });
  } catch (erro: any) {
    console.error('Erro ao carregar dados da clínica (GET /api/sync):', erro?.code || erro?.message);
    res.status(500).json({
      success: false,
      erro: 'Não foi possível carregar os dados no banco de dados'
    });
  }
});

// Push/sync clinic data
app.post('/api/sync/:syncCode?', async (req, res) => {
  try {
    const syncCode = (req.params.syncCode || DEFAULT_SYNC_CODE).trim() || DEFAULT_SYNC_CODE;
    const incomingData = req.body;

    if (!incomingData || typeof incomingData !== 'object') {
      return res.status(400).json({ success: false, error: 'Payload inválido para sincronização' });
    }

    const existing = (await loadClinicData(syncCode)) || initialData;
    const newVersion = (Number(existing.version) || 0) + 1;
    const updatedData: ClinicData = {
      ...existing,
      ...incomingData,
      version: newVersion,
      lastUpdated: new Date().toISOString()
    };

    await saveClinicData(syncCode, updatedData);

    res.json({
      success: true,
      syncCode,
      version: newVersion,
      lastUpdated: updatedData.lastUpdated
    });
  } catch (erro: any) {
    console.error('Erro ao salvar dados da clínica (POST /api/sync):', erro?.code || erro?.message);
    res.status(500).json({
      success: false,
      erro: 'Não foi possível salvar os dados no banco de dados'
    });
  }
});

// Reset demo data endpoint
app.post('/api/reset-demo/:syncCode?', async (req, res) => {
  try {
    const syncCode = (req.params.syncCode || DEFAULT_SYNC_CODE).trim() || DEFAULT_SYNC_CODE;
    const existing = await loadClinicData(syncCode);
    const fresh: ClinicData = {
      ...initialData,
      lastUpdated: new Date().toISOString(),
      version: (Number(existing?.version) || 0) + 1
    };
    await saveClinicData(syncCode, fresh);
    res.json({ success: true, message: 'Dados restaurados com sucesso', data: fresh });
  } catch (erro: any) {
    console.error('Erro ao restaurar dados (POST /api/reset-demo):', erro?.code || erro?.message);
    res.status(500).json({
      success: false,
      erro: 'Não foi possível restaurar os dados no banco de dados'
    });
  }
});

// Rota para salvar clientes no MariaDB (Hostinger)
app.post('/api/clientes', async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;

    if (!nome || !email) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Nome e e-mail são obrigatórios'
      });
    }

    const [resultado] = await db.execute(
      `INSERT INTO clientes (nome, email, telefone)
       VALUES (?, ?, ?)`,
      [nome, email, telefone || null]
    );

    res.status(201).json({
      sucesso: true,
      id: (resultado as any).insertId
    });
  } catch (erro: any) {
    console.error('Erro ao salvar cliente:', {
      code: erro?.code,
      errno: erro?.errno,
      sqlState: erro?.sqlState,
      message: erro?.message
    });

    if (erro?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        sucesso: false,
        erro: 'Este e-mail já está cadastrado'
      });
    }

    res.status(500).json({
      sucesso: false,
      erro: 'Não foi possível salvar o cadastro'
    });
  }
});

// Rota para listar clientes do MariaDB
app.get('/api/clientes', async (req, res) => {
  try {
    const [resultado] = await db.query('SELECT id, nome, email, telefone FROM clientes ORDER BY id DESC');
    res.json({
      sucesso: true,
      clientes: resultado
    });
  } catch (erro: any) {
    console.error('Erro ao listar clientes:', erro?.code || erro?.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Não foi possível buscar clientes'
    });
  }
});

// Start server with Vite or static handler
async function startServer() {
  try {
    await verificarBanco();
    const existingDefault = await loadClinicData(DEFAULT_SYNC_CODE);
    if (!existingDefault) {
      await saveClinicData(DEFAULT_SYNC_CODE, initialData);
    }
  } catch {
    console.error('A aplicação iniciou sem conseguir acessar o banco');
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback to serving transformed index.html for client-side routing
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Clínica Psicopedagógica Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
