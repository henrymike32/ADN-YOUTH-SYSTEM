export interface ChallengeExportRow {
  code: string;
  fullName: string;
  teamName: string;
  registrationType: string;
  deaneryName: string;
  parishName: string;
  localChurch: string;
  phone: string;
  fee: number;
  mpesaCode: string;
  status: string;
  registrationDate: string;
}

export interface ChallengeExportSummary {
  totalRegistered: number;
  totalAccepted: number;
  totalPending: number;
  totalRejected: number;
  amountCollected: number;
  totalExpectedAmount: number;
}

/**
 * Downloads all registered Challenge Week participants as an Excel-compatible UTF-8 BOM CSV file.
 */
export function downloadChallengeExcelCsv(rows: ChallengeExportRow[], summary: ChallengeExportSummary) {
  const headers = [
    '#',
    'Pass Code',
    'Participant Name',
    'Team / Group',
    'Type',
    'Deanery',
    'Parish',
    'Local Church',
    'Phone Number',
    'Fee (KES)',
    'M-Pesa Code',
    'Status',
    'Registration Date',
  ];

  const csvRows = rows.map((r, idx) => [
    String(idx + 1),
    csvEscape(r.code),
    csvEscape(r.fullName),
    csvEscape(r.teamName),
    csvEscape(r.registrationType),
    csvEscape(r.deaneryName),
    csvEscape(r.parishName),
    csvEscape(r.localChurch),
    csvEscape(r.phone),
    String(r.fee),
    csvEscape(r.mpesaCode),
    csvEscape(r.status),
    csvEscape(r.registrationDate),
  ]);

  const summaryRows = [
    [],
    ['SUMMARY REPORT', 'Challenge Week 2027 - Archdiocese of Nyeri'],
    ['Total Registered Youths', String(summary.totalRegistered)],
    ['Total Accepted', String(summary.totalAccepted)],
    ['Total Pending', String(summary.totalPending)],
    ['Total Rejected', String(summary.totalRejected)],
    ['Amount Collected (KES)', String(summary.amountCollected)],
    ['Total Expected Amount Based on Registered (KES)', String(summary.totalExpectedAmount)],
  ];

  const content =
    '\uFEFF' +
    [headers.join(','), ...csvRows.map((r) => r.join(',')), ...summaryRows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Challenge_Week_2027_Registered_List_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function csvEscape(val: string): string {
  const str = String(val ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Generates and downloads a real multi-page A4 Landscape PDF report
 * of all registered Challenge Week members using pure PDF 1.4 operators.
 */
export function downloadChallengePdfReport(rows: ChallengeExportRow[], summary: ChallengeExportSummary) {
  const pageWidth = 842; // A4 landscape
  const pageHeight = 595;
  const rowsPerPage = 22;

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const pageStreams: string[] = [];

  for (let p = 0; p < totalPages; p++) {
    const start = p * rowsPerPage;
    const slice = rows.slice(start, start + rowsPerPage);
    const cmds: string[] = [];

    // Header banner (Red & Green theme)
    cmds.push('0.73 0.11 0.11 rg'); // deep red
    cmds.push(`28 ${pageHeight - 66} ${pageWidth - 56} 44 re f`);
    cmds.push('0.02 0.59 0.41 rg'); // emerald green bar
    cmds.push(`28 ${pageHeight - 71} ${pageWidth - 56} 5 re f`);

    // Header text
    cmds.push('BT /F2 14 Tf 1 1 1 rg 40 ' + (pageHeight - 41) + ' Td (ARCHDIOCESE OF NYERI - CHALLENGE WEEK 2027 REGISTERED LIST) Tj ET');
    cmds.push('BT /F1 8.5 Tf 0.96 0.96 0.96 rg 40 ' + (pageHeight - 56) + ' Td (Quo Vadis Youth Hub | system.quovadisyouthhub.org | Generated: ' + pdfSafe(new Date().toISOString().split('T')[0]) + ') Tj ET');

    // Summary line box
    cmds.push('0.96 0.97 0.98 rg');
    cmds.push(`28 ${pageHeight - 98} ${pageWidth - 56} 22 re f`);
    const summaryText = `Registered: ${summary.totalRegistered}   |   Accepted: ${summary.totalAccepted}   |   Pending: ${summary.totalPending}   |   Rejected: ${summary.totalRejected}   |   Collected: KSh ${summary.amountCollected.toLocaleString()}   |   Total Expected: KSh ${summary.totalExpectedAmount.toLocaleString()}`;
    cmds.push(`BT /F2 8.5 Tf 0.08 0.12 0.20 rg 38 ${pageHeight - 90} Td (${pdfSafe(summaryText)}) Tj ET`);

    // Table Header
    const tableTop = pageHeight - 122;
    cmds.push('0.06 0.09 0.16 rg');
    cmds.push(`28 ${tableTop} ${pageWidth - 56} 18 re f`);

    const cols = [
      { label: '#', x: 34, max: 4 },
      { label: 'Pass Code', x: 58, max: 16 },
      { label: 'Participant Name', x: 148, max: 25 },
      { label: 'Deanery', x: 298, max: 15 },
      { label: 'Parish', x: 386, max: 16 },
      { label: 'Local Church', x: 478, max: 18 },
      { label: 'Phone', x: 584, max: 15 },
      { label: 'Fee', x: 668, max: 9 },
      { label: 'M-Pesa', x: 716, max: 12 },
      { label: 'Status', x: 778, max: 10 },
    ];

    cols.forEach((col) => {
      cmds.push(`BT /F2 8 Tf 1 1 1 rg ${col.x} ${tableTop + 5} Td (${pdfSafe(col.label)}) Tj ET`);
    });

    // Table Rows
    const rowHeight = 18;
    slice.forEach((row, idx) => {
      const y = tableTop - (idx + 1) * rowHeight;
      if (idx % 2 === 1) {
        cmds.push('0.97 0.98 0.99 rg');
        cmds.push(`28 ${y} ${pageWidth - 56} ${rowHeight} re f`);
      }

      const values = [
        String(start + idx + 1),
        row.code,
        row.fullName,
        row.deaneryName,
        row.parishName,
        row.localChurch,
        row.phone,
        `KSh ${row.fee}`,
        row.mpesaCode,
        row.status === 'Pending Verification' ? 'Pending' : row.status,
      ];

      values.forEach((val, cIdx) => {
        const col = cols[cIdx];
        const truncated = truncateStr(val, col.max);
        cmds.push(`BT /F1 7.5 Tf 0.12 0.16 0.23 rg ${col.x} ${y + 5} Td (${pdfSafe(truncated)}) Tj ET`);
      });

      // Row bottom line
      cmds.push('0.88 0.91 0.94 RG 0.4 w');
      cmds.push(`28 ${y} m ${pageWidth - 28} ${y} l S`);
    });

    // Footer
    cmds.push(`BT /F1 8 Tf 0.45 0.50 0.58 rg 28 22 Td (Catholic Archdiocese of Nyeri - Challenge Week 2027) Tj ET`);
    cmds.push(`BT /F1 8 Tf 0.45 0.50 0.58 rg ${pageWidth - 95} 22 Td (Page ${p + 1} of ${totalPages}) Tj ET`);

    pageStreams.push(cmds.join('\n'));
  }

  const pdfBytes = assemblePdfDocument(pageStreams, pageWidth, pageHeight);
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Challenge_Week_2027_Registered_List_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function truncateStr(s: string, max: number): string {
  const clean = String(s || '');
  return clean.length > max ? clean.slice(0, Math.max(1, max - 2)) + '..' : clean;
}

function pdfSafe(s: string): string {
  return String(s || '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function assemblePdfDocument(pageStreams: string[], width: number, height: number): Uint8Array {
  const encoder = new TextEncoder();
  const objects: string[] = [];

  // 1: Catalog, 2: Pages, 3: Helvetica, 4: Helvetica-Bold
  const pageObjIds: number[] = [];
  let nextObjId = 5;

  for (let i = 0; i < pageStreams.length; i++) {
    const contentId = nextObjId++;
    const pageId = nextObjId++;
    pageObjIds.push(pageId);
    objects[contentId] = `<< /Length ${encoder.encode(pageStreams[i]).length} >>\nstream\n${pageStreams[i]}\nendstream`;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
  }

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjIds.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  const parts: string[] = ['%PDF-1.4\n'];
  const offsets: number[] = [0];
  let byteOffset = encoder.encode(parts[0]).length;

  for (let id = 1; id < nextObjId; id++) {
    offsets[id] = byteOffset;
    const objStr = `${id} 0 obj\n${objects[id]}\nendobj\n`;
    parts.push(objStr);
    byteOffset += encoder.encode(objStr).length;
  }

  const xrefStart = byteOffset;
  let xref = `xref\n0 ${nextObjId}\n0000000000 65535 f \n`;
  for (let id = 1; id < nextObjId; id++) {
    xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${nextObjId} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  parts.push(xref, trailer);
  return encoder.encode(parts.join(''));
}
