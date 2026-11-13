-- ============================================================================
-- Migration completa do banco de dados MariaDB / MySQL (Ninho / Lira System)
-- Compatível com Hostinger MariaDB / MySQL (utf8mb4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinic_data (
  sync_code VARCHAR(100) NOT NULL PRIMARY KEY,
  data JSON NOT NULL,
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clientes (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_clientes_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pacientes (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS paciente_documentos (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agenda (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessoes (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS planos_intervencao (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS financeiro (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lembretes (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notificacoes (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS relatorios (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios_sistema (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS configuracoes_clinica (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
