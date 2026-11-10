export function calcularIdade(nasc?: string): string {
  if (!nasc) return '—';
  const d = new Date(nasc);
  if (isNaN(d.getTime())) return '—';
  const hoje = new Date();
  let anos = hoje.getFullYear() - d.getFullYear();
  const m = hoje.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) {
    anos--;
  }
  if (anos < 1) {
    const meses = (hoje.getFullYear() - d.getFullYear()) * 12 + (hoje.getMonth() - d.getMonth());
    return `${meses} meses`;
  }
  return `${anos} anos`;
}

export function formatarData(dataStr?: string): string {
  if (!dataStr) return '—';
  try {
    const [ano, mes, dia] = dataStr.split('-');
    if (ano && mes && dia) {
      return `${dia}/${mes}/${ano}`;
    }
    const d = new Date(dataStr);
    return isNaN(d.getTime()) ? dataStr : d.toLocaleDateString('pt-BR');
  } catch {
    return dataStr;
  }
}

export function formatarMoeda(valor?: number): string {
  if (typeof valor !== 'number' || isNaN(valor)) return 'R$ 0,00';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function diasAteData(dataAlvoStr: string): number {
  if (!dataAlvoStr) return 999;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(dataAlvoStr);
  alvo.setHours(0, 0, 0, 0);
  const diffTime = alvo.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function horaAgoraFormatada(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
