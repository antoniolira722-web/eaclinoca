import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

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

app.use(express.json({ limit: '10mb' }));

// In-memory data store with file persistence fallback
const DATA_DIR = path.join(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create data dir', e);
  }
}

interface ClinicData {
  pacientes: any[];
  agenda: any[];
  sessoes: any[];
  planos: any[];
  financeiro: any[];
  lembretes: any[];
  notificacoes: any[];
  configuracoes: any;
  lastUpdated: string;
  version: number;
}

const memoryStore: Record<string, ClinicData> = {};

function getStoreFilePath(syncCode: string): string {
  const safeCode = syncCode.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(DATA_DIR, `clinic_${safeCode}.json`);
}

function loadClinicData(syncCode: string): ClinicData | null {
  if (memoryStore[syncCode]) {
    return memoryStore[syncCode];
  }
  const filePath = getStoreFilePath(syncCode);
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryStore[syncCode] = parsed;
      return parsed;
    } catch (e) {
      console.error(`Error reading ${filePath}`, e);
    }
  }
  return null;
}

function saveClinicData(syncCode: string, data: ClinicData): void {
  memoryStore[syncCode] = data;
  const filePath = getStoreFilePath(syncCode);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error saving ${filePath}`, e);
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

// Seed default code
const DEFAULT_SYNC_CODE = 'ninho-principal';
if (!loadClinicData(DEFAULT_SYNC_CODE)) {
  saveClinicData(DEFAULT_SYNC_CODE, initialData);
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Get clinic data by syncCode (default or custom)
app.get('/api/sync/:syncCode?', (req, res) => {
  const syncCode = req.params.syncCode || DEFAULT_SYNC_CODE;
  let data = loadClinicData(syncCode);
  if (!data) {
    // If not exists, clone initial data with new syncCode
    data = { ...initialData, lastUpdated: new Date().toISOString(), version: 1 };
    saveClinicData(syncCode, data);
  }
  res.json({
    success: true,
    syncCode,
    data,
    serverTime: new Date().toISOString()
  });
});

// Push/sync clinic data
app.post('/api/sync/:syncCode?', (req, res) => {
  const syncCode = req.params.syncCode || DEFAULT_SYNC_CODE;
  const incomingData = req.body;

  if (!incomingData || typeof incomingData !== 'object') {
    return res.status(400).json({ error: 'Payload inválido para sincronização' });
  }

  const existing = loadClinicData(syncCode) || initialData;
  const newVersion = (existing.version || 0) + 1;
  const updatedData: ClinicData = {
    ...existing,
    ...incomingData,
    version: newVersion,
    lastUpdated: new Date().toISOString()
  };

  saveClinicData(syncCode, updatedData);

  res.json({
    success: true,
    syncCode,
    version: newVersion,
    lastUpdated: updatedData.lastUpdated
  });
});

// Reset demo data endpoint
app.post('/api/reset-demo/:syncCode?', (req, res) => {
  const syncCode = req.params.syncCode || DEFAULT_SYNC_CODE;
  const fresh = {
    ...initialData,
    lastUpdated: new Date().toISOString(),
    version: Date.now()
  };
  saveClinicData(syncCode, fresh);
  res.json({ success: true, message: 'Dados restaurados com sucesso', data: fresh });
});

// Start server with Vite or static handler
async function startServer() {
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
