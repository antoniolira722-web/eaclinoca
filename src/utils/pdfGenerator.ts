import { jsPDF } from 'jspdf';
import { RelatorioDocumento, Paciente, ConfiguracaoClinica } from '../types';
import { calcularIdade, formatarData } from './dateUtils';

interface GeneratePdfOptions {
  doc: RelatorioDocumento;
  paciente?: Paciente;
  configuracoes: ConfiguracaoClinica;
}

export function gerarRelatorioPDF({ doc: relatorio, paciente, configuracoes }: GeneratePdfOptions): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight; // 170mm
  const marginTop = 20;
  const marginBottom = 22;

  let currentY = marginTop;

  const opcoesRelatorio = configuracoes.opcoesRelatorio;
  const temCabecalho = opcoesRelatorio?.cabecalhoPersonalizado ?? true;
  const temRodape = opcoesRelatorio?.rodapePersonalizado ?? true;
  const temAssinatura = opcoesRelatorio?.incluirAssinaturaLinha ?? true;
  const textoRodape = opcoesRelatorio?.textoRodape || 'Documento de caráter confidencial emitido para fins psicopedagógicos e educacionais.';
  const cidadePadrao = opcoesRelatorio?.cidadePadrao || 'São Paulo - SP';

  // Helper to check page break
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - marginBottom) {
      pdf.addPage();
      currentY = marginTop;
      return true;
    }
    return false;
  };

  // 1. Header (Letterhead)
  if (temCabecalho) {
    // Clinic monogram icon box
    pdf.setFillColor(6, 95, 70); // Emerald 800
    pdf.roundedRect(marginLeft, currentY, 12, 12, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('EA', marginLeft + 6, currentY + 7.5, { align: 'center' });

    // Clinic name & details
    pdf.setTextColor(6, 78, 59); // Emerald 900
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text((configuracoes.nomeClinica || 'EA — Clínica Psicopedagógica').toUpperCase(), marginLeft + 16, currentY + 4.5);

    pdf.setTextColor(55, 65, 81); // Stone 700
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.text(`${configuracoes.profissional || 'Ester Lopes'} — ${configuracoes.registroProfissional || 'ABPp 4821/SP'}`, marginLeft + 16, currentY + 8.5);

    pdf.setTextColor(120, 113, 108); // Stone 500
    pdf.setFontSize(7.5);
    const endereco = configuracoes.endereco || 'Atendimento Psicopedagógico Especializado';
    const contato = configuracoes.contato || '(11) 98765-0000';
    pdf.text(`${endereco} | ${contato}`, marginLeft + 16, currentY + 12);

    currentY += 16;

    // Header divider line
    pdf.setDrawColor(6, 95, 70);
    pdf.setLineWidth(0.8);
    pdf.line(marginLeft, currentY, pageWidth - marginRight, currentY);
    currentY += 6;
  }

  // 2. Document Main Title
  ensureSpace(16);
  pdf.setTextColor(28, 25, 23); // Stone 900
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text((relatorio.titulo || 'Laudo Psicopedagógico').toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  if (relatorio.finalidade) {
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8.5);
    const finalidadeLines = pdf.splitTextToSize(relatorio.finalidade, contentWidth - 20);
    pdf.text(finalidadeLines, pageWidth / 2, currentY, { align: 'center' });
    currentY += (finalidadeLines.length * 4) + 3;
  } else {
    currentY += 2;
  }

  // 3. Patient Identification Box
  ensureSpace(28);
  const infoBoxY = currentY;
  pdf.setFillColor(248, 250, 252); // Slate 50
  pdf.setDrawColor(226, 232, 240); // Slate 200
  pdf.setLineWidth(0.3);
  
  const isPerinatalDoc = [
    'consultoria_amamentacao',
    'consultoria_parto',
    'plano_parto_documento',
    'parecer_enfermagem_perinatal'
  ].includes(relatorio.tipo);

  const boxHeight = isPerinatalDoc ? 28 : 24;
  pdf.roundedRect(marginLeft, infoBoxY, contentWidth, boxHeight, 2, 2, 'FD');

  pdf.setFontSize(8);
  pdf.setTextColor(30, 41, 59);

  const col1X = marginLeft + 4;
  const col2X = marginLeft + (contentWidth / 2) + 2;

  // Row 1
  pdf.setFont('helvetica', 'bold');
  pdf.text(isPerinatalDoc ? 'Gestante/Puérpera:' : 'Paciente:', col1X, infoBoxY + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.text(paciente?.nome || '—', col1X + (isPerinatalDoc ? 28 : 15), infoBoxY + 5);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Data Nasc.:', col2X, infoBoxY + 5);
  pdf.setFont('helvetica', 'normal');
  const nascText = paciente?.nasc ? `${formatarData(paciente.nasc)} (${calcularIdade(paciente.nasc)})` : '—';
  pdf.text(nascText, col2X + 18, infoBoxY + 5);

  // Row 2
  if (isPerinatalDoc && paciente?.dadosPerinatais) {
    const dp = paciente.dadosPerinatais;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Idade Gest./Bebê:', col1X, infoBoxY + 10);
    pdf.setFont('helvetica', 'normal');
    const gestText = dp.semanasGestacao || (dp.nomeBebe ? `${dp.nomeBebe} (${dp.nascBebe ? formatarData(dp.nascBebe) : ''})` : '—');
    pdf.text(gestText.substring(0, 32), col1X + 26, infoBoxY + 10);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Maternidade/Obst.:', col2X, infoBoxY + 10);
    pdf.setFont('helvetica', 'normal');
    const matText = `${dp.hospitalMaternidade || dp.obstetraEquipe || '—'}`;
    pdf.text(matText.substring(0, 32), col2X + 27, infoBoxY + 10);

    // Row 3
    pdf.setFont('helvetica', 'bold');
    pdf.text('Rede de Apoio/Resp:', col1X, infoBoxY + 15);
    pdf.setFont('helvetica', 'normal');
    const respText = `${paciente?.resp || '—'} ${paciente?.fone ? `(${paciente.fone})` : ''}`;
    pdf.text(respText.substring(0, 34), col1X + 31, infoBoxY + 15);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Aleitamento / Parto:', col2X, infoBoxY + 15);
    pdf.setFont('helvetica', 'normal');
    const aleitText = dp.tipoAleitamento || dp.tipoPartoDesejado || 'Aleitamento Materno';
    pdf.text(aleitText.substring(0, 30), col2X + 28, infoBoxY + 15);

    // Row 4
    pdf.setFont('helvetica', 'bold');
    pdf.text('Solicitante:', col1X, infoBoxY + 20);
    pdf.setFont('helvetica', 'normal');
    pdf.text((relatorio.solicitante || 'Família / Equipe Perinatal').substring(0, 38), col1X + 17, infoBoxY + 20);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Data Emissão:', col2X, infoBoxY + 20);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatarData(relatorio.dataEmissao), col2X + 22, infoBoxY + 20);
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Escola/Série:', col1X, infoBoxY + 10);
    pdf.setFont('helvetica', 'normal');
    const escolaText = `${paciente?.escola || '—'} ${paciente?.serie ? `(${paciente.serie})` : ''}`;
    pdf.text(escolaText.substring(0, 38), col1X + 19, infoBoxY + 10);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Responsável:', col2X, infoBoxY + 10);
    pdf.setFont('helvetica', 'normal');
    const respText = `${paciente?.resp || '—'} ${paciente?.fone ? `(${paciente.fone})` : ''}`;
    pdf.text(respText.substring(0, 36), col2X + 21, infoBoxY + 10);

    // Row 3
    pdf.setFont('helvetica', 'bold');
    pdf.text('Solicitante:', col1X, infoBoxY + 15);
    pdf.setFont('helvetica', 'normal');
    pdf.text((relatorio.solicitante || 'Família / Equipe Pedagógica').substring(0, 40), col1X + 17, infoBoxY + 15);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Data Emissão:', col2X, infoBoxY + 15);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatarData(relatorio.dataEmissao), col2X + 22, infoBoxY + 15);
  }

  currentY += boxHeight + 6;

  // Helper to render clinical section
  const renderSection = (num: string, title: string, content?: string, isHighlight = false) => {
    if (!content || !content.trim()) return;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);

    const titleText = `${num}. ${title.toUpperCase()}`;
    const neededForTitle = 10;
    ensureSpace(neededForTitle);

    if (isHighlight) {
      pdf.setTextColor(6, 78, 59); // Emerald 900
    } else {
      pdf.setTextColor(28, 25, 23); // Stone 900
    }

    pdf.text(titleText, marginLeft, currentY);
    currentY += 1.5;

    pdf.setDrawColor(isHighlight ? 167 : 229, isHighlight ? 243 : 231, isHighlight ? 208 : 235);
    pdf.setLineWidth(0.4);
    pdf.line(marginLeft, currentY, pageWidth - marginRight, currentY);
    currentY += 4;

    // Body text
    pdf.setFont('helvetica', isHighlight ? 'bold' : 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(isHighlight ? 6 : 55, isHighlight ? 78 : 65, isHighlight ? 59 : 81);

    const lines = pdf.splitTextToSize(content.trim(), contentWidth);
    
    for (let i = 0; i < lines.length; i++) {
      ensureSpace(5);
      pdf.text(lines[i], marginLeft, currentY);
      currentY += 4.5;
    }

    currentY += 3;
  };

  // Helper for instrument bullets
  const renderInstrumentsList = (instruments?: string[]) => {
    if (!instruments || instruments.length === 0) return;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(28, 25, 23);

    ensureSpace(10);
    const instTitle = isPerinatalDoc
      ? '3. DIRETRIZES, PROTOCOLOS & INSTRUMENTOS AVALIATIVOS'
      : '3. INSTRUMENTOS & PROCEDIMENTOS DE AVALIAÇÃO';
    pdf.text(instTitle, marginLeft, currentY);
    currentY += 1.5;
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.4);
    pdf.line(marginLeft, currentY, pageWidth - marginRight, currentY);
    currentY += 4;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(55, 65, 81);

    instruments.forEach((inst) => {
      ensureSpace(5);
      pdf.text('•', marginLeft + 2, currentY);
      const lines = pdf.splitTextToSize(inst, contentWidth - 8);
      pdf.text(lines, marginLeft + 6, currentY);
      currentY += (lines.length * 4.5);
    });

    currentY += 3;
  };

  // Render all sections in structured clinical order
  if (isPerinatalDoc) {
    renderSection('1', 'Demanda Inicial & Queixa Principal (Parto / Amamentação)', relatorio.queixaPrincipal);
    renderSection('2', 'Histórico Obstétrico & Anamnese Perinatal', relatorio.historicoBreve);
    renderInstrumentsList(relatorio.instrumentosUtilizados);
    renderSection('4', 'Avaliação das Mamas / Vínculo e Preferências de Parto', relatorio.observacoesComportamentais);
    renderSection('5', 'Avaliação da Pega / Métodos Não Farmacológicos de Alívio', relatorio.analiseCognitiva);
    renderSection('6', 'Conduta Perinatal, Técnicas Praticadas & Manejo Clínico', relatorio.analisePedagogica);
    renderSection('7', 'Parecer Conclusivo & Síntese da Consultoria Perinatal', relatorio.conclusaoHipotese, true);
    renderSection('8', 'Encaminhamentos & Interconsultas Multidisciplinares', relatorio.encaminhamentos);
    renderSection('9', 'Orientações Hospitalares / Diretrizes da Maternidade', relatorio.orientacoesEscola);
    renderSection('10', 'Orientações para a Mãe, Parceiro e Rede de Apoio', relatorio.orientacoesFamilia);
  } else {
    renderSection('1', 'Queixa Principal & Demanda Inicial', relatorio.queixaPrincipal);
    renderSection('2', 'Breve Histórico & Anamnese', relatorio.historicoBreve);
    renderInstrumentsList(relatorio.instrumentosUtilizados);
    renderSection('4', 'Observações Comportamentais & Vínculo', relatorio.observacoesComportamentais);
    renderSection('5', 'Análise dos Domínios Cognitivos & Funções Executivas', relatorio.analiseCognitiva);
    renderSection('6', 'Análise Pedagógica (Leitura, Escrita e Cálculo)', relatorio.analisePedagogica);
    renderSection('7', 'Conclusão & Síntese Psicopedagógica', relatorio.conclusaoHipotese, true);
    renderSection('8', 'Encaminhamentos Multidisciplinares', relatorio.encaminhamentos);
    renderSection('9', 'Orientações e Adequações para a Escola', relatorio.orientacoesEscola);
    renderSection('10', 'Orientações para a Família', relatorio.orientacoesFamilia);
  }

  // Signature and Date Section
  ensureSpace(35);
  currentY += 4;

  // City and Extended Date
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(75, 85, 99);
  
  let dataExtenso = 'Data de emissão';
  try {
    const dataObj = new Date(relatorio.dataEmissao + 'T12:00:00');
    dataExtenso = dataObj.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    dataExtenso = formatarData(relatorio.dataEmissao);
  }

  pdf.text(`${cidadePadrao}, ${dataExtenso}.`, pageWidth - marginRight, currentY, { align: 'right' });
  currentY += 12;

  // Professional Signature Block
  if (temAssinatura) {
    const signBoxWidth = 100;
    const signBoxX = (pageWidth - signBoxWidth) / 2;

    pdf.setDrawColor(156, 163, 175); // Stone 400
    pdf.setLineWidth(0.4);
    pdf.line(signBoxX, currentY, signBoxX + signBoxWidth, currentY);
    currentY += 4;

    const profNome = relatorio.profissionalEmissor || (isPerinatalDoc ? 'Enf. Juliana Silveira' : (configuracoes.profissional || 'Ester Lopes'));
    const profCargo = relatorio.registroEmissor || (isPerinatalDoc
      ? 'Enfermeira Educadora Perinatal & Consultora em Amamentação · COREN-SP 214.890'
      : `Psicopedagoga Clínica — ${configuracoes.registroProfissional || 'ABPp 4821/SP'}`);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(28, 25, 23);
    pdf.text(profNome, pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(75, 85, 99);
    pdf.text(profCargo, pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
  }

  // Footer and Page Numbering on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    // Footer divider line
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.3);
    pdf.line(marginLeft, pageHeight - 14, pageWidth - marginRight, pageHeight - 14);

    // Confidentiality Notice
    if (temRodape) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(7);
      pdf.setTextColor(156, 163, 175);
      pdf.text(textoRodape, marginLeft, pageHeight - 9);
    }

    // Page Number
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(120, 113, 108);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth - marginRight, pageHeight - 9, { align: 'right' });
  }

  return pdf;
}

export function downloadRelatorioPDF(options: GeneratePdfOptions): void {
  const pdf = gerarRelatorioPDF(options);
  const pacNome = options.paciente?.nome
    ? options.paciente.nome.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25)
    : 'Paciente';
  const dataStr = options.doc.dataEmissao || new Date().toISOString().slice(0, 10);
  const tipoStr = options.doc.tipo.replace('_', '-');
  
  const filename = `${tipoStr}_${pacNome}_${dataStr}.pdf`;
  pdf.save(filename);
}
