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

let schemaVerified = false;
let schemaEnsurePromise: Promise<void> | null = null;

async function ensureMissingColumns(): Promise<void> {
  const requiredColumns: Array<{ table: string; column: string; definition: string }> = [
    { table: 'clinic_data', column: 'version', definition: 'INT NOT NULL DEFAULT 1' },
    { table: 'pacientes', column: 'sync_code', definition: "VARCHAR(100) NOT NULL DEFAULT 'ninho-principal'" },
    { table: 'pacientes', column: 'categoria', definition: 'VARCHAR(100) NULL' },
    { table: 'pacientes', column: 'escola', definition: 'VARCHAR(255) NULL' },
    { table: 'pacientes', column: 'serie', definition: 'VARCHAR(100) NULL' },
    { table: 'pacientes', column: 'fone', definition: 'VARCHAR(50) NULL' },
    { table: 'pacientes', column: 'email', definition: 'VARCHAR(255) NULL' },
    { table: 'pacientes', column: 'alergias', definition: 'TEXT NULL' },
    { table: 'pacientes', column: 'medicacao', definition: 'TEXT NULL' },
    { table: 'pacientes', column: 'data_inicio', definition: 'VARCHAR(20) NULL' },
    { table: 'pacientes', column: 'status', definition: "VARCHAR(50) NOT NULL DEFAULT 'Ativo'" },
    { table: 'pacientes', column: 'tags', definition: 'JSON NULL' },
    { table: 'pacientes', column: 'notas_gerais', definition: 'LONGTEXT NULL' },
    { table: 'pacientes', column: 'dados_perinatais', definition: 'JSON NULL' },
    { table: 'paciente_documentos', column: 'sync_code', definition: "VARCHAR(100) NOT NULL DEFAULT 'ninho-principal'" },
    { table: 'paciente_documentos', column: 'tipo', definition: 'VARCHAR(150) NULL' },
    { table: 'paciente_documentos', column: 'categoria', definition: 'VARCHAR(150) NULL' },
    { table: 'paciente_documentos', column: 'tamanho', definition: 'BIGINT NULL' },
    { table: 'paciente_documentos', column: 'data_upload', definition: "VARCHAR(50) NOT NULL DEFAULT ''" },
    { table: 'paciente_documentos', column: 'url', definition: 'LONGTEXT NULL' },
    { table: 'paciente_documentos', column: 'descricao', definition: 'TEXT NULL' },
    { table: 'paciente_documentos', column: 'enviado_por', definition: 'VARCHAR(150) NULL' }
  ];

  const [cols] = await db.query<RowDataPacket[]>(
    `SELECT TABLE_NAME, COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME IN ('clinic_data', 'pacientes', 'paciente_documentos')`
  );

  const existingSet = new Set(
    (cols || []).map(r => `${String(r.TABLE_NAME).toLowerCase()}.${String(r.COLUMN_NAME).toLowerCase()}`)
  );

  for (const col of requiredColumns) {
    const key = `${col.table}.${col.column}`.toLowerCase();
    if (!existingSet.has(key)) {
      await db.query(`ALTER TABLE ${col.table} ADD COLUMN ${col.column} ${col.definition}`);
      existingSet.add(key);
    }
  }
}

async function ensureDatabaseTables(): Promise<void> {
  try {
    for (const ddl of TABLE_DDL_STATEMENTS) {
      await db.query(ddl);
    }
    await ensureMissingColumns();
    schemaVerified = true;
  } catch (erro: any) {
    schemaVerified = false;
    console.error('Erro ao verificar/criar tabelas no MariaDB:', erro?.code || erro?.message || 'Erro desconhecido');
    throw erro;
  }
}

async function ensureSchemaOnce(): Promise<void> {
  if (schemaVerified) return;
  if (!schemaEnsurePromise) {
    schemaEnsurePromise = ensureDatabaseTables().finally(() => {
      schemaEnsurePromise = null;
    });
  }
  await schemaEnsurePromise;
}

async function verificarBanco(): Promise<void> {
  try {
    await db.query('SELECT 1');
    await ensureSchemaOnce();
    console.log('Conexão com o MariaDB estabelecida e tabelas verificadas');
  } catch (erro: any) {
    console.error('Erro ao conectar ao MariaDB:', erro?.code || erro?.message || 'Erro desconhecido');
    throw erro;
  }
}

function safeParseJson<T>(value: any, fallback: T): T {
  if (value === null || value === undefined || value === '') return fallback;
  if (Buffer.isBuffer(value)) {
    try {
      return JSON.parse(value.toString('utf8')) as T;
    } catch {
      return fallback;
    }
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function mapRowToDocumento(row: RowDataPacket): any {
  return {
    id: row.id,
    nome: row.nome,
    tipo: row.tipo || undefined,
    categoria: row.categoria || undefined,
    tamanho: row.tamanho !== null && row.tamanho !== undefined ? Number(row.tamanho) : undefined,
    dataUpload: row.data_upload,
    url: row.url || undefined,
    descricao: row.descricao || undefined,
    enviadoPor: row.enviado_por || undefined
  };
}

function mapRowsToPacientes(pacienteRows: RowDataPacket[], docRows: RowDataPacket[]): any[] {
  const docsByPaciente = new Map<string, any[]>();
  for (const d of docRows) {
    const list = docsByPaciente.get(d.paciente_id) || [];
    list.push(mapRowToDocumento(d));
    docsByPaciente.set(d.paciente_id, list);
  }

  return pacienteRows.map(row => ({
    id: row.id,
    nome: row.nome,
    nasc: row.nasc,
    categoria: row.categoria || undefined,
    escola: row.escola || '',
    serie: row.serie || '',
    resp: row.resp,
    fone: row.fone || '',
    email: row.email || '',
    queixa: row.queixa,
    alergias: row.alergias || '',
    medicacao: row.medicacao || '',
    dataInicio: row.data_inicio || undefined,
    status: row.status || 'Ativo',
    tags: safeParseJson<string[]>(row.tags, []),
    notasGerais: row.notas_gerais || '',
    dadosPerinatais: safeParseJson<any>(row.dados_perinatais, undefined),
    documentos: docsByPaciente.get(row.id) || []
  }));
}

async function upsertPacienteInConn(conn: any, syncCode: string, p: any): Promise<void> {
  await conn.execute(
    `INSERT INTO pacientes (
      id, sync_code, nome, nasc, categoria, escola, serie, resp, fone, email,
      queixa, alergias, medicacao, data_inicio, status, tags, notas_gerais, dados_perinatais
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      sync_code = VALUES(sync_code),
      nome = VALUES(nome),
      nasc = VALUES(nasc),
      categoria = VALUES(categoria),
      escola = VALUES(escola),
      serie = VALUES(serie),
      resp = VALUES(resp),
      fone = VALUES(fone),
      email = VALUES(email),
      queixa = VALUES(queixa),
      alergias = VALUES(alergias),
      medicacao = VALUES(medicacao),
      data_inicio = VALUES(data_inicio),
      status = VALUES(status),
      tags = VALUES(tags),
      notas_gerais = VALUES(notas_gerais),
      dados_perinatais = VALUES(dados_perinatais)`,
    [
      String(p.id),
      syncCode,
      String(p.nome || ''),
      String(p.nasc || ''),
      p.categoria || null,
      p.escola || null,
      p.serie || null,
      String(p.resp || ''),
      p.fone || null,
      p.email || null,
      String(p.queixa || ''),
      p.alergias || null,
      p.medicacao || null,
      p.dataInicio || null,
      String(p.status || 'Ativo'),
      p.tags ? JSON.stringify(p.tags) : JSON.stringify([]),
      p.notasGerais || null,
      p.dadosPerinatais ? JSON.stringify(p.dadosPerinatais) : null
    ]
  );
}

async function upsertDocumentoInConn(conn: any, syncCode: string, pacienteId: string, doc: any): Promise<void> {
  await conn.execute(
    `INSERT INTO paciente_documentos (
      id, sync_code, paciente_id, nome, tipo, categoria, tamanho, data_upload, url, descricao, enviado_por
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      sync_code = VALUES(sync_code),
      paciente_id = VALUES(paciente_id),
      nome = VALUES(nome),
      tipo = VALUES(tipo),
      categoria = VALUES(categoria),
      tamanho = VALUES(tamanho),
      data_upload = VALUES(data_upload),
      url = VALUES(url),
      descricao = VALUES(descricao),
      enviado_por = VALUES(enviado_por)`,
    [
      String(doc.id),
      syncCode,
      String(pacienteId),
      String(doc.nome || 'documento'),
      doc.tipo || null,
      doc.categoria || null,
      doc.tamanho !== undefined && doc.tamanho !== null ? Number(doc.tamanho) : null,
      String(doc.dataUpload || new Date().toISOString()),
      doc.url || null,
      doc.descricao || null,
      doc.enviadoPor || null
    ]
  );
}

async function syncPacientesAndDocumentos(syncCode: string, pacientes: any[]): Promise<void> {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const listaPacientes = Array.isArray(pacientes) ? pacientes : [];
    const pacienteIds: string[] = [];
    const docIds: string[] = [];

    for (const p of listaPacientes) {
      if (!p || !p.id) continue;
      pacienteIds.push(String(p.id));
      await upsertPacienteInConn(conn, syncCode, p);

      const docs = Array.isArray(p.documentos) ? p.documentos : [];
      for (const doc of docs) {
        if (!doc || !doc.id) continue;
        docIds.push(String(doc.id));
        await upsertDocumentoInConn(conn, syncCode, String(p.id), doc);
      }
    }

    if (docIds.length > 0) {
      const placeholders = docIds.map(() => '?').join(',');
      await conn.execute(
        `DELETE FROM paciente_documentos WHERE sync_code = ? AND id NOT IN (${placeholders})`,
        [syncCode, ...docIds]
      );
    } else {
      await conn.execute('DELETE FROM paciente_documentos WHERE sync_code = ?', [syncCode]);
    }

    if (pacienteIds.length > 0) {
      const placeholders = pacienteIds.map(() => '?').join(',');
      await conn.execute(
        `DELETE FROM pacientes WHERE sync_code = ? AND id NOT IN (${placeholders})`,
        [syncCode, ...pacienteIds]
      );
    } else {
      await conn.execute('DELETE FROM pacientes WHERE sync_code = ?', [syncCode]);
    }

    await conn.commit();
  } catch (erro: any) {
    await conn.rollback().catch(() => {});
    console.error('Erro ao sincronizar pacientes/documentos no MariaDB:', erro?.code || erro?.message);
    throw erro;
  } finally {
    conn.release();
  }
}

function createEmptyClinicData(): ClinicData {
  return {
    pacientes: [],
    agenda: [],
    sessoes: [],
    planos: [],
    financeiro: [],
    lembretes: [],
    notificacoes: [],
    relatorios: [],
    configuracoes: {
      nomeClinica: 'Ninho',
      profissional: 'Ester Lopes',
      registroProfissional: 'ABPp 4821/SP',
      contato: '(11) 98765-0000 · contato@ninho.com.br',
      endereco: 'Av. Paulista, 1000 - Cj 84 - Bela Vista, São Paulo - SP',
      tema: 'system',
      notificacoesAtivas: true,
      lembretesSonoros: false,
      syncAuto: true,
      syncIntervalSec: 15
    },
    lastUpdated: new Date().toISOString(),
    version: 1
  };
}

async function databaseHasAnyRecords(): Promise<boolean> {
  try {
    const [clinicRows] = await db.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM clinic_data');
    const [pacRows] = await db.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM pacientes');
    const [cliRows] = await db.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM clientes');
    const total =
      Number(clinicRows?.[0]?.total || 0) +
      Number(pacRows?.[0]?.total || 0) +
      Number(cliRows?.[0]?.total || 0);
    return total > 0;
  } catch (erro: any) {
    console.error('Erro ao verificar registros existentes no banco:', erro?.code || erro?.message);
    return true;
  }
}

async function loadClinicData(syncCode: string): Promise<ClinicData | null> {
  try {
    await ensureSchemaOnce();

    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT data, version, updated_at FROM clinic_data WHERE sync_code = ? LIMIT 1',
      [syncCode]
    );

    const [pacienteRows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM pacientes WHERE sync_code = ? ORDER BY created_at DESC',
      [syncCode]
    );

    const [docRows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM paciente_documentos WHERE sync_code = ? ORDER BY created_at ASC',
      [syncCode]
    );

    if (!rows || rows.length === 0) {
      if (pacienteRows && pacienteRows.length > 0) {
        const pacientesHidratados = mapRowsToPacientes(pacienteRows, docRows || []);
        const result: ClinicData = {
          ...createEmptyClinicData(),
          pacientes: pacientesHidratados,
          lastUpdated: new Date().toISOString(),
          version: 1
        };
        console.log('[TEMP-LOG][DB_LOAD]', {
          syncCode,
          clinica: result.configuracoes?.nomeClinica || 'Ninho',
          registrosCarregados: {
            pacientes: pacientesHidratados.length,
            documentos: docRows?.length || 0
          }
        });
        return result;
      }
      console.log('[TEMP-LOG][DB_LOAD]', {
        syncCode,
        clinica: 'Ninho',
        registrosCarregados: { pacientes: 0, documentos: 0 }
      });
      return null;
    }

    const row = rows[0];
    const parsed: ClinicData = safeParseJson<ClinicData>(row.data, createEmptyClinicData());

    let pacientesFinais = Array.isArray(parsed?.pacientes) ? parsed.pacientes : [];
    if (pacienteRows && pacienteRows.length > 0) {
      pacientesFinais = mapRowsToPacientes(pacienteRows, docRows || []);
    } else if (Array.isArray(parsed?.pacientes) && parsed.pacientes.length > 0) {
      // Caso clinic_data tenha sido importado antes das tabelas relacionais, popula pacientes/documentos
      await syncPacientesAndDocumentos(syncCode, parsed.pacientes);
    }

    const loaded: ClinicData = {
      ...parsed,
      pacientes: pacientesFinais,
      version: row.version ?? parsed?.version ?? 1,
      lastUpdated: parsed?.lastUpdated || (row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString())
    };

    console.log('[TEMP-LOG][DB_LOAD]', {
      syncCode,
      clinica: loaded.configuracoes?.nomeClinica || 'Ninho',
      registrosCarregados: {
        pacientes: loaded.pacientes?.length || 0,
        documentos: docRows?.length || 0,
        agenda: loaded.agenda?.length || 0,
        sessoes: loaded.sessoes?.length || 0,
        planos: loaded.planos?.length || 0,
        financeiro: loaded.financeiro?.length || 0,
        lembretes: loaded.lembretes?.length || 0,
        relatorios: loaded.relatorios?.length || 0,
        usuarios: loaded.usuarios?.length || 0
      }
    });

    return loaded;
  } catch (erro: any) {
    console.error('Erro em loadClinicData:', erro?.code || erro?.message || 'Erro desconhecido');
    throw erro;
  }
}

async function syncClinicDataJsonPatientsFromDb(syncCode: string): Promise<void> {
  try {
    const [pacienteRows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM pacientes WHERE sync_code = ? ORDER BY created_at DESC',
      [syncCode]
    );
    const [docRows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM paciente_documentos WHERE sync_code = ? ORDER BY created_at ASC',
      [syncCode]
    );
    const pacientesAtualizados = mapRowsToPacientes(pacienteRows || [], docRows || []);

    const [clinicRows] = await db.query<RowDataPacket[]>(
      'SELECT data, version FROM clinic_data WHERE sync_code = ? LIMIT 1',
      [syncCode]
    );

    const existing =
      clinicRows && clinicRows.length > 0
        ? safeParseJson<ClinicData>(clinicRows[0].data, createEmptyClinicData())
        : createEmptyClinicData();

    const newVersion = (Number(clinicRows?.[0]?.version ?? existing.version) || 0) + 1;
    const updated: ClinicData = {
      ...existing,
      pacientes: pacientesAtualizados,
      version: newVersion,
      lastUpdated: new Date().toISOString()
    };

    await db.execute(
      `INSERT INTO clinic_data (sync_code, data, version)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         data = VALUES(data),
         version = VALUES(version)`,
      [syncCode, JSON.stringify(updated), newVersion]
    );
  } catch (erro: any) {
    console.error('Erro ao atualizar clinic_data a partir de pacientes:', erro?.code || erro?.message);
    throw erro;
  }
}

async function saveClinicData(syncCode: string, data: ClinicData): Promise<void> {
  try {
    await ensureSchemaOnce();

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

    await syncPacientesAndDocumentos(syncCode, payloadToSave.pacientes || []);

    // Consulta de confirmação no banco após salvar
    const [confirmRows] = await db.query<RowDataPacket[]>(
      'SELECT sync_code, version FROM clinic_data WHERE sync_code = ? LIMIT 1',
      [syncCode]
    );
    if (!confirmRows || confirmRows.length === 0) {
      throw new Error('Falha ao confirmar gravação na tabela clinic_data');
    }

    const totalDocsSalvos = (payloadToSave.pacientes || []).reduce(
      (acc: number, p: any) => acc + (Array.isArray(p?.documentos) ? p.documentos.length : 0),
      0
    );

    console.log('[TEMP-LOG][DB_SAVE]', {
      syncCode,
      clinica: payloadToSave.configuracoes?.nomeClinica || 'Ninho',
      registrosSalvos: {
        pacientes: payloadToSave.pacientes?.length || 0,
        documentos: totalDocsSalvos,
        agenda: payloadToSave.agenda?.length || 0,
        sessoes: payloadToSave.sessoes?.length || 0,
        planos: payloadToSave.planos?.length || 0,
        financeiro: payloadToSave.financeiro?.length || 0,
        lembretes: payloadToSave.lembretes?.length || 0,
        relatorios: payloadToSave.relatorios?.length || 0,
        usuarios: payloadToSave.usuarios?.length || 0
      }
    });
  } catch (erro: any) {
    console.error('Erro em saveClinicData:', erro?.code || erro?.message || 'Erro desconhecido');
    throw erro;
  }
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
  const envConfigured = Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
  try {
    await db.query('SELECT 1');
    await ensureSchemaOnce();
    res.status(200).json({
      ok: true,
      status: 'connected',
      envConfigured,
      time: new Date().toISOString()
    });
  } catch (erro: any) {
    console.error('Erro no healthcheck do banco:', erro?.code || erro?.message || 'Erro desconhecido');
    res.status(500).json({
      ok: false,
      status: 'error',
      envConfigured,
      code: erro?.code || 'DB_ERROR',
      erro: envConfigured
        ? 'Não foi possível conectar ao banco de dados MariaDB'
        : 'Variáveis de ambiente do banco (DB_HOST, DB_USER, DB_NAME) não configuradas no servidor'
    });
  }
});

// Get clinic data by syncCode (default or custom)
app.get('/api/sync/:syncCode?', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    await ensureSchemaOnce();
    const syncCode = (req.params.syncCode || DEFAULT_SYNC_CODE).trim() || DEFAULT_SYNC_CODE;
    let data = await loadClinicData(syncCode);
    if (!data) {
      const jaTemRegistros = await databaseHasAnyRecords();
      data = jaTemRegistros
        ? createEmptyClinicData()
        : { ...initialData, lastUpdated: new Date().toISOString(), version: 1 };
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
      code: erro?.code || 'DB_ERROR',
      erro: 'Não foi possível carregar os dados no banco de dados'
    });
  }
});

// Push/sync clinic data
app.post('/api/sync/:syncCode?', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    await ensureSchemaOnce();
    const syncCode = (req.params.syncCode || DEFAULT_SYNC_CODE).trim() || DEFAULT_SYNC_CODE;
    const incomingData = req.body;

    if (!incomingData || typeof incomingData !== 'object') {
      return res.status(400).json({ success: false, erro: 'Payload inválido para sincronização' });
    }

    const existing = await loadClinicData(syncCode);
    const clientInitialized = req.headers['x-sync-initialized'] !== 'false';
    const incomingPatientsCount = Array.isArray(incomingData.pacientes) ? incomingData.pacientes.length : 0;
    const existingPatientsCount = Array.isArray(existing?.pacientes) ? existing.pacientes.length : 0;

    if (!clientInitialized && existing && existingPatientsCount > 0 && incomingPatientsCount === 0) {
      return res.status(409).json({
        success: false,
        erro: 'Sincronização bloqueada para proteger dados existentes: cliente ainda não carregou os dados do banco.'
      });
    }

    const baseExisting = existing || createEmptyClinicData();
    const newVersion = (Number(baseExisting.version) || 0) + 1;
    const updatedData: ClinicData = {
      ...baseExisting,
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
      code: erro?.code || 'DB_ERROR',
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

// Rotas relacionais dedicadas para pacientes e paciente_documentos (com confirmação por SELECT)
app.get('/api/pacientes', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    await ensureSchemaOnce();
    const syncCode = (String(req.query.syncCode || DEFAULT_SYNC_CODE)).trim() || DEFAULT_SYNC_CODE;
    const [pacienteRows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM pacientes WHERE sync_code = ? ORDER BY created_at DESC',
      [syncCode]
    );
    const [docRows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM paciente_documentos WHERE sync_code = ? ORDER BY created_at ASC',
      [syncCode]
    );
    const pacientes = mapRowsToPacientes(pacienteRows || [], docRows || []);
    console.log('[TEMP-LOG][PACIENTES_LOAD]', {
      syncCode,
      clinica: syncCode,
      registrosCarregados: pacientes.length
    });
    res.json({
      sucesso: true,
      syncCode,
      total: pacientes.length,
      pacientes
    });
  } catch (erro: any) {
    console.error('Erro ao listar pacientes no MariaDB:', erro?.code || erro?.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Não foi possível buscar pacientes no banco de dados'
    });
  }
});

app.post('/api/pacientes', async (req, res) => {
  let conn: any = null;
  try {
    await ensureSchemaOnce();
    conn = await db.getConnection();
    const body = req.body || {};
    const syncCode = (String(body.syncCode || req.query.syncCode || DEFAULT_SYNC_CODE)).trim() || DEFAULT_SYNC_CODE;
    const pacienteId = String(body.id || `pac_${Date.now()}`);

    if (!body.nome || !body.nasc || !body.resp) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Nome, data de nascimento e responsável são obrigatórios'
      });
    }

    const pacientePayload = { ...body, id: pacienteId };
    await conn.beginTransaction();
    await upsertPacienteInConn(conn, syncCode, pacientePayload);

    const docs = Array.isArray(body.documentos) ? body.documentos : [];
    for (const doc of docs) {
      if (!doc) continue;
      const docWithId = {
        ...doc,
        id: doc.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      };
      await upsertDocumentoInConn(conn, syncCode, pacienteId, docWithId);
    }
    await conn.commit();

    // Consulta de confirmação no banco após gravar o paciente e anexos
    const [confirmPacienteRows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM pacientes WHERE id = ? AND sync_code = ? LIMIT 1',
      [pacienteId, syncCode]
    );
    if (!confirmPacienteRows || confirmPacienteRows.length === 0) {
      return res.status(500).json({
        sucesso: false,
        erro: 'Cadastro não confirmado na tabela pacientes após gravação'
      });
    }

    const [confirmDocRows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM paciente_documentos WHERE paciente_id = ? AND sync_code = ? ORDER BY created_at ASC',
      [pacienteId, syncCode]
    );

    await syncClinicDataJsonPatientsFromDb(syncCode);

    const [pacienteConfirmado] = mapRowsToPacientes(confirmPacienteRows, confirmDocRows || []);

    console.log('[TEMP-LOG][PACIENTE_SAVE]', {
      syncCode,
      clinica: body.categoria || 'Ninho',
      registrosSalvos: 1 + (confirmDocRows?.length || 0)
    });

    res.status(201).json({
      sucesso: true,
      confirmadoNoBanco: true,
      syncCode,
      id: pacienteId,
      paciente: pacienteConfirmado
    });
  } catch (erro: any) {
    if (conn) await conn.rollback().catch(() => {});
    console.error('Erro ao salvar paciente no MariaDB:', erro?.code || erro?.message);
    res.status(500).json({
      sucesso: false,
      code: erro?.code || 'DB_ERROR',
      erro: 'Não foi possível salvar o paciente no banco de dados'
    });
  } finally {
    if (conn) conn.release();
  }
});

app.put('/api/pacientes/:id', async (req, res) => {
  let conn: any = null;
  try {
    await ensureSchemaOnce();
    conn = await db.getConnection();
    const pacienteId = String(req.params.id);
    const body = req.body || {};
    const syncCode = (String(body.syncCode || req.query.syncCode || DEFAULT_SYNC_CODE)).trim() || DEFAULT_SYNC_CODE;

    const [existingRows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM pacientes WHERE id = ? AND sync_code = ? LIMIT 1',
      [pacienteId, syncCode]
    );
    const existingMapped = existingRows && existingRows.length > 0
      ? mapRowsToPacientes(existingRows, [])[0]
      : {};

    const merged = { ...existingMapped, ...body, id: pacienteId };
    await conn.beginTransaction();
    await upsertPacienteInConn(conn, syncCode, merged);

    if (Array.isArray(body.documentos)) {
      const docIds: string[] = [];
      for (const doc of body.documentos) {
        if (!doc || !doc.id) continue;
        docIds.push(String(doc.id));
        await upsertDocumentoInConn(conn, syncCode, pacienteId, doc);
      }
      if (docIds.length > 0) {
        const placeholders = docIds.map(() => '?').join(',');
        await conn.execute(
          `DELETE FROM paciente_documentos WHERE sync_code = ? AND paciente_id = ? AND id NOT IN (${placeholders})`,
          [syncCode, pacienteId, ...docIds]
        );
      } else {
        await conn.execute(
          'DELETE FROM paciente_documentos WHERE sync_code = ? AND paciente_id = ?',
          [syncCode, pacienteId]
        );
      }
    }

    await conn.commit();

    const [confirmRows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM pacientes WHERE id = ? AND sync_code = ? LIMIT 1',
      [pacienteId, syncCode]
    );
    if (!confirmRows || confirmRows.length === 0) {
      return res.status(500).json({
        sucesso: false,
        erro: 'Atualização não confirmada na tabela pacientes'
      });
    }

    await syncClinicDataJsonPatientsFromDb(syncCode);

    res.json({
      sucesso: true,
      confirmadoNoBanco: true,
      id: pacienteId
    });
  } catch (erro: any) {
    if (conn) await conn.rollback().catch(() => {});
    console.error('Erro ao atualizar paciente no MariaDB:', erro?.code || erro?.message);
    res.status(500).json({
      sucesso: false,
      code: erro?.code || 'DB_ERROR',
      erro: 'Não foi possível atualizar o paciente no banco de dados'
    });
  } finally {
    if (conn) conn.release();
  }
});

app.delete('/api/pacientes/:id', async (req, res) => {
  try {
    await ensureSchemaOnce();
    const pacienteId = String(req.params.id);
    const syncCode = (String(req.query.syncCode || DEFAULT_SYNC_CODE)).trim() || DEFAULT_SYNC_CODE;

    await db.execute(
      'DELETE FROM paciente_documentos WHERE paciente_id = ? AND sync_code = ?',
      [pacienteId, syncCode]
    );
    await db.execute(
      'DELETE FROM pacientes WHERE id = ? AND sync_code = ?',
      [pacienteId, syncCode]
    );

    await syncClinicDataJsonPatientsFromDb(syncCode);

    res.json({ sucesso: true, id: pacienteId });
  } catch (erro: any) {
    console.error('Erro ao excluir paciente no MariaDB:', erro?.code || erro?.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Não foi possível excluir o paciente no banco de dados'
    });
  }
});

app.post('/api/pacientes/:pacienteId/documentos', async (req, res) => {
  try {
    await ensureSchemaOnce();
    const pacienteId = String(req.params.pacienteId);
    const body = req.body || {};
    const syncCode = (String(body.syncCode || req.query.syncCode || DEFAULT_SYNC_CODE)).trim() || DEFAULT_SYNC_CODE;
    const docId = String(body.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);

    if (!body.nome) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Nome do documento é obrigatório'
      });
    }

    const docPayload = {
      ...body,
      id: docId,
      dataUpload: body.dataUpload || new Date().toISOString()
    };

    await db.execute(
      `INSERT INTO paciente_documentos (
        id, sync_code, paciente_id, nome, tipo, categoria, tamanho, data_upload, url, descricao, enviado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        sync_code = VALUES(sync_code),
        paciente_id = VALUES(paciente_id),
        nome = VALUES(nome),
        tipo = VALUES(tipo),
        categoria = VALUES(categoria),
        tamanho = VALUES(tamanho),
        data_upload = VALUES(data_upload),
        url = VALUES(url),
        descricao = VALUES(descricao),
        enviado_por = VALUES(enviado_por)`,
      [
        docId,
        syncCode,
        pacienteId,
        String(docPayload.nome),
        docPayload.tipo || null,
        docPayload.categoria || null,
        docPayload.tamanho !== undefined && docPayload.tamanho !== null ? Number(docPayload.tamanho) : null,
        String(docPayload.dataUpload),
        docPayload.url || null,
        docPayload.descricao || null,
        docPayload.enviadoPor || null
      ]
    );

    // Consulta de confirmação na tabela paciente_documentos após gravar o anexo
    const [confirmDocRows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM paciente_documentos WHERE id = ? AND sync_code = ? LIMIT 1',
      [docId, syncCode]
    );

    if (!confirmDocRows || confirmDocRows.length === 0) {
      return res.status(500).json({
        sucesso: false,
        erro: 'Anexo não confirmado na tabela paciente_documentos após gravação'
      });
    }

    await syncClinicDataJsonPatientsFromDb(syncCode);

    res.status(201).json({
      sucesso: true,
      confirmadoNoBanco: true,
      syncCode,
      documento: mapRowToDocumento(confirmDocRows[0])
    });
  } catch (erro: any) {
    console.error('Erro ao salvar anexo em paciente_documentos:', erro?.code || erro?.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Não foi possível salvar o anexo no banco de dados'
    });
  }
});

app.delete('/api/pacientes/:pacienteId/documentos/:docId', async (req, res) => {
  try {
    await ensureSchemaOnce();
    const pacienteId = String(req.params.pacienteId);
    const docId = String(req.params.docId);
    const syncCode = (String(req.query.syncCode || DEFAULT_SYNC_CODE)).trim() || DEFAULT_SYNC_CODE;

    await db.execute(
      'DELETE FROM paciente_documentos WHERE id = ? AND paciente_id = ? AND sync_code = ?',
      [docId, pacienteId, syncCode]
    );

    await syncClinicDataJsonPatientsFromDb(syncCode);

    res.json({ sucesso: true, id: docId });
  } catch (erro: any) {
    console.error('Erro ao remover anexo em paciente_documentos:', erro?.code || erro?.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Não foi possível remover o anexo no banco de dados'
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

    const insertedId = (resultado as any).insertId;
    const [confirmRows] = await db.query<RowDataPacket[]>(
      'SELECT id, nome, email, telefone FROM clientes WHERE id = ? LIMIT 1',
      [insertedId]
    );

    res.status(201).json({
      sucesso: true,
      confirmadoNoBanco: Boolean(confirmRows && confirmRows.length > 0),
      id: insertedId
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

// Qualquer rota /api desconhecida deve retornar JSON (nunca index.html)
app.use('/api', (_req, res) => {
  res.status(404).json({
    sucesso: false,
    erro: 'Rota da API não encontrada'
  });
});

// Start server with Vite or static handler
async function startServer() {
  try {
    await verificarBanco();
    const existingDefault = await loadClinicData(DEFAULT_SYNC_CODE);
    if (!existingDefault && !(await databaseHasAnyRecords())) {
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
