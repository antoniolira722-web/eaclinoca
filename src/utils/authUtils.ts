import { NivelAcesso, PermissoesPerfil, UsuarioSistema, TabType } from '../types';

export const PERMISSOES_POR_NIVEL: Record<NivelAcesso, PermissoesPerfil> = {
  admin: {
    verPainel: true,
    verPacientes: true,
    gerenciarPacientes: true,
    verAnamneseCompleta: true,
    verAgenda: true,
    gerenciarAgenda: true,
    verSessoes: true,
    gerenciarSessoes: true,
    verPlanosPEI: true,
    gerenciarPlanosPEI: true,
    verFinanceiro: true,
    gerenciarFinanceiro: true,
    verRelatoriosLaudos: true,
    gerenciarRelatoriosLaudos: true,
    verLembretes: true,
    gerenciarConfiguracoes: true,
    gerenciarUsuarios: true
  },
  psicopedagogo: {
    verPainel: true,
    verPacientes: true,
    gerenciarPacientes: true,
    verAnamneseCompleta: true,
    verAgenda: true,
    gerenciarAgenda: true,
    verSessoes: true,
    gerenciarSessoes: true,
    verPlanosPEI: true,
    gerenciarPlanosPEI: true,
    verFinanceiro: false,
    gerenciarFinanceiro: false,
    verRelatoriosLaudos: true,
    gerenciarRelatoriosLaudos: true,
    verLembretes: true,
    gerenciarConfiguracoes: false,
    gerenciarUsuarios: false
  },
  enfermeira_perinatal: {
    verPainel: true,
    verPacientes: true,
    gerenciarPacientes: true,
    verAnamneseCompleta: true,
    verAgenda: true,
    gerenciarAgenda: true,
    verSessoes: true,
    gerenciarSessoes: true,
    verPlanosPEI: true,
    gerenciarPlanosPEI: true,
    verFinanceiro: false,
    gerenciarFinanceiro: false,
    verRelatoriosLaudos: true,
    gerenciarRelatoriosLaudos: true,
    verLembretes: true,
    gerenciarConfiguracoes: false,
    gerenciarUsuarios: false
  },
  recepcao: {
    verPainel: true,
    verPacientes: true,
    gerenciarPacientes: false, // apenas contato/cadastros básicos
    verAnamneseCompleta: false, // sigilo clínico
    verAgenda: true,
    gerenciarAgenda: true,
    verSessoes: false,
    gerenciarSessoes: false,
    verPlanosPEI: false,
    gerenciarPlanosPEI: false,
    verFinanceiro: false,
    gerenciarFinanceiro: false,
    verRelatoriosLaudos: false,
    gerenciarRelatoriosLaudos: false,
    verLembretes: true,
    gerenciarConfiguracoes: false,
    gerenciarUsuarios: false
  },
  estagiario: {
    verPainel: true,
    verPacientes: true,
    gerenciarPacientes: false,
    verAnamneseCompleta: true,
    verAgenda: true,
    gerenciarAgenda: false,
    verSessoes: true,
    gerenciarSessoes: true,
    verPlanosPEI: true,
    gerenciarPlanosPEI: false,
    verFinanceiro: false,
    gerenciarFinanceiro: false,
    verRelatoriosLaudos: true,
    gerenciarRelatoriosLaudos: false,
    verLembretes: true,
    gerenciarConfiguracoes: false,
    gerenciarUsuarios: false
  }
};

export const INFO_NIVEIS_ACESSO: Record<
  NivelAcesso,
  {
    nome: string;
    descricao: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    icone: string;
  }
> = {
  admin: {
    nome: 'Administrador(a) / Responsável',
    descricao: 'Acesso total irrestrito: gestão clínica, prontuários, financeiro, relatórios, configurações e gestão de usuários.',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/60',
    badgeText: 'text-rose-800 dark:text-rose-300',
    badgeBorder: 'border-rose-300 dark:border-rose-800',
    icone: '👑'
  },
  psicopedagogo: {
    nome: 'Psicopedagogo(a) Clínico(a)',
    descricao: 'Acesso completo a prontuários, anamneses, sessões, planos PEI, agenda e emissão de relatórios/laudos.',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    badgeBorder: 'border-emerald-300 dark:border-emerald-800',
    icone: '🩺'
  },
  enfermeira_perinatal: {
    nome: 'Enfermeira Educadora Perinatal',
    descricao: 'Acesso completo a gestantes, puérperas, recém-nascidos, consultorias de parto, amamentação, planos e pareceres perinatais.',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/60',
    badgeText: 'text-teal-800 dark:text-teal-300',
    badgeBorder: 'border-teal-300 dark:border-teal-800',
    icone: '🤱'
  },
  recepcao: {
    nome: 'Recepção / Secretaria',
    descricao: 'Acesso à gestão de agendamentos, contatos de responsáveis e lembretes com sigilo total de prontuários clínicos e financeiro.',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
    badgeText: 'text-blue-800 dark:text-blue-300',
    badgeBorder: 'border-blue-300 dark:border-blue-800',
    icone: '📋'
  },
  estagiario: {
    nome: 'Estagiário(a) / Assistente',
    descricao: 'Acesso supervisionado a pacientes, sessões e planos com restrições financeiras e administrativas.',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-300 dark:border-amber-800',
    icone: '🎓'
  }
};

export const DEFAULT_USUARIOS_SISTEMA: UsuarioSistema[] = [
  {
    id: 'user-admin-1',
    nome: 'Ester Lopes (Admin)',
    username: 'admin',
    email: 'admin@eaclinica.com.br',
    senha: 'admin', // Senha padrão de fácil acesso
    cargo: 'Psicopedagoga Responsável & Gestora',
    nivelAcesso: 'admin',
    ativo: true,
    avatarColor: 'bg-rose-600',
    criadoEm: '2025-01-10',
    ultimoAcesso: new Date().toISOString()
  },
  {
    id: 'user-terapeuta-1',
    nome: 'Dra. Carolina Mendes',
    username: 'carolina',
    email: 'carolina@eaclinica.com.br',
    senha: '123',
    cargo: 'Psicopedagoga Clínica & Neuroeducadora',
    nivelAcesso: 'psicopedagogo',
    ativo: true,
    avatarColor: 'bg-emerald-600',
    criadoEm: '2025-02-01',
    ultimoAcesso: '2025-02-26'
  },
  {
    id: 'user-enfermeira-1',
    nome: 'Enf. Juliana Silveira',
    username: 'juliana',
    email: 'juliana.silveira@eaclinica.com.br',
    senha: '123',
    cargo: 'Enfermeira Educadora Perinatal & Consultora em Amamentação (COREN-SP 214.890)',
    nivelAcesso: 'enfermeira_perinatal',
    ativo: true,
    avatarColor: 'bg-teal-600',
    criadoEm: '2025-02-10',
    ultimoAcesso: '2025-02-27'
  },
  {
    id: 'user-recepcao-1',
    nome: 'Mariana Santos',
    username: 'recepcao',
    email: 'recepcao@eaclinica.com.br',
    senha: '123',
    cargo: 'Secretária & Atendimento',
    nivelAcesso: 'recepcao',
    ativo: true,
    avatarColor: 'bg-blue-600',
    criadoEm: '2025-02-15',
    ultimoAcesso: '2025-02-27'
  }
];

export function verificarAcessoAba(tab: TabType, nivel: NivelAcesso): boolean {
  const permissoes = PERMISSOES_POR_NIVEL[nivel] || PERMISSOES_POR_NIVEL.estagiario;

  switch (tab) {
    case 'painel':
      return permissoes.verPainel;
    case 'pacientes':
      return permissoes.verPacientes;
    case 'agenda':
      return permissoes.verAgenda;
    case 'sessoes':
      return permissoes.verSessoes;
    case 'planos':
      return permissoes.verPlanosPEI;
    case 'financeiro':
      return permissoes.verFinanceiro;
    case 'relatorio':
      return permissoes.verRelatoriosLaudos;
    case 'lembretes':
      return permissoes.verLembretes;
    case 'configuracoes':
      return permissoes.gerenciarConfiguracoes;
    default:
      return true;
  }
}

export function obterPrimeiraAbaPermitida(nivel: NivelAcesso): TabType {
  const abasPrioritarias: TabType[] = ['painel', 'agenda', 'pacientes', 'sessoes', 'lembretes'];
  for (const tab of abasPrioritarias) {
    if (verificarAcessoAba(tab, nivel)) {
      return tab;
    }
  }
  return 'agenda';
}
