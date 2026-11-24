import QRCode from 'qrcode';
import logoSvg from '../assets/images/archdiocese_nyeri_youth_logo.svg';

export interface ChallengeCardData {
  memberCode: string;
  memberName: string;
  deaneryName: string;
  parishName: string;
  localChurch: string;
  teamName?: string;
  photoDataUrl?: string;
}

/**
 * Compresses and center-crops an uploaded image file into a lightweight JPEG DataURL
 * suitable for localStorage persistence and crisp 300 DPI card rendering.
 */
export function compressPhotoForCard(file: File, targetWidth = 320, targetHeight = 360): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }

        // Fill white background (handles transparent PNGs cleanly)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Center-crop ("object-cover") math
        const imgAspect = img.width / img.height;
        const targetAspect = targetWidth / targetHeight;
        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;

        if (imgAspect > targetAspect) {
          sw = img.height * targetAspect;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetAspect;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Generates a high-resolution (1050 x 620) Red, White & Green Challenge Week Pass PNG.
 */
export async function generateChallengeCardCanvas(data: ChallengeCardData): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const width = 1050;
  const height = 620;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // 1. Rounded card clip
  const radius = 28;
  ctx.save();
  roundRectPath(ctx, 0, 0, width, height, radius);
  ctx.clip();

  // 2. Crisp WHITE main body background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Subtle decorative tricolour corner accents on white body
  ctx.fillStyle = 'rgba(220, 38, 38, 0.035)';
  ctx.beginPath();
  ctx.arc(width - 80, 260, 210, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(5, 150, 105, 0.04)';
  ctx.beginPath();
  ctx.arc(160, 480, 180, 0, Math.PI * 2);
  ctx.fill();

  // 3. TOP RED HEADER BAND
  const headerH = 128;
  const redGrad = ctx.createLinearGradient(0, 0, width, headerH);
  redGrad.addColorStop(0, '#991b1b');
  redGrad.addColorStop(0.55, '#dc2626');
  redGrad.addColorStop(1, '#b91c1c');
  ctx.fillStyle = redGrad;
  ctx.fillRect(0, 0, width, headerH);

  // Thin white + green tricolour separator strip under header
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, headerH, width, 5);
  ctx.fillStyle = '#059669';
  ctx.fillRect(0, headerH + 5, width, 7);

  // Official Logo inside white rounded badge on top-left
  try {
    const logoImg = await loadImage(logoSvg);
    ctx.fillStyle = '#ffffff';
    roundRectPath(ctx, 36, 20, 110, 88, 12);
    ctx.fill();
    ctx.drawImage(logoImg, 42, 24, 98, 80);
  } catch (err) {
    console.warn('Could not load logo for challenge card:', err);
  }

  // Header Titles
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 30px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ARCHDIOCESE OF NYERI', 168, 56);

  ctx.fillStyle = '#fef2f2';
  ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('QUO VADIS YOUTH HUB · CHALLENGE WEEK 2027', 168, 86);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '600 13px "JetBrains Mono", monospace';
  ctx.fillText('OFFICIAL REGISTERED PARTICIPANT PASS', 168, 110);

  // Top-right badge on red header
  ctx.fillStyle = '#ffffff';
  roundRectPath(ctx, width - 210, 34, 174, 58, 12);
  ctx.fill();
  ctx.fillStyle = '#047857';
  ctx.font = '800 11px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CHALLENGE WEEK', width - 123, 56);
  ctx.fillStyle = '#b91c1c';
  ctx.font = '800 20px "JetBrains Mono", monospace';
  ctx.fillText('2027 PASS', width - 123, 80);
  ctx.textAlign = 'left';

  // 4. LEFT COLUMN: MEMBER PHOTO FRAME
  const photoX = 42;
  const photoY = 172;
  const photoW = 200;
  const photoH = 230;

  // White card shadow border + red/green dual accent frame
  ctx.fillStyle = '#f8fafc';
  roundRectPath(ctx, photoX, photoY, photoW, photoH, 16);
  ctx.fill();

  ctx.save();
  roundRectPath(ctx, photoX, photoY, photoW, photoH, 16);
  ctx.clip();

  if (data.photoDataUrl) {
    try {
      const photoImg = await loadImage(data.photoDataUrl);
      const imgAspect = photoImg.width / photoImg.height;
      const boxAspect = photoW / photoH;
      let sx = 0;
      let sy = 0;
      let sw = photoImg.width;
      let sh = photoImg.height;

      if (imgAspect > boxAspect) {
        sw = photoImg.height * boxAspect;
        sx = (photoImg.width - sw) / 2;
      } else {
        sh = photoImg.width / boxAspect;
        sy = (photoImg.height - sh) / 2;
      }
      ctx.drawImage(photoImg, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
    } catch {
      drawPhotoFallback(ctx, photoX, photoY, photoW, photoH, data.memberName);
    }
  } else {
    drawPhotoFallback(ctx, photoX, photoY, photoW, photoH, data.memberName);
  }
  ctx.restore();

  // Crisp red border around photo
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  roundRectPath(ctx, photoX, photoY, photoW, photoH, 16);
  ctx.stroke();

  // Pass code pill directly aligned under photo
  const codeBoxY = photoY + photoH + 18;
  ctx.fillStyle = '#047857';
  roundRectPath(ctx, photoX, codeBoxY, photoW, 44, 10);
  ctx.fill();
  ctx.fillStyle = '#d1fae5';
  ctx.font = '700 9px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PASS CODE', photoX + photoW / 2, codeBoxY + 16);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 15px "JetBrains Mono", monospace';
  ctx.fillText(data.memberCode, photoX + photoW / 2, codeBoxY + 35);
  ctx.textAlign = 'left';

  // 5. CENTER COLUMN: ALIGNED MEMBER DETAILS (Name, Deanery, Parish, Local Church)
  const infoX = 276;
  const infoMaxW = 475;

  // Name
  ctx.fillStyle = '#dc2626';
  ctx.font = '800 12px "JetBrains Mono", monospace';
  ctx.fillText('PARTICIPANT FULL NAME', infoX, 190);

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 32px "Plus Jakarta Sans", sans-serif';
  const fittedName = fitTextToWidth(ctx, data.memberName.toUpperCase(), infoMaxW);
  ctx.fillText(fittedName, infoX, 228);

  // Subtle divider
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(infoX, 248);
  ctx.lineTo(infoX + infoMaxW, 248);
  ctx.stroke();

  // Deanery & Parish (aligned side-by-side)
  const row2Y = 282;
  ctx.fillStyle = '#047857';
  ctx.font = '800 12px "JetBrains Mono", monospace';
  ctx.fillText('DEANERY', infoX, row2Y);
  ctx.fillText('PARISH', infoX + 245, row2Y);

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(fitTextToWidth(ctx, data.deaneryName || 'Nyeri Central', 225), infoX, row2Y + 32);
  ctx.fillText(fitTextToWidth(ctx, data.parishName || 'Cathedral', 225), infoX + 245, row2Y + 32);

  // Subtle divider
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(infoX, 336);
  ctx.lineTo(infoX + infoMaxW, 336);
  ctx.stroke();

  // Local Church
  const row3Y = 372;
  ctx.fillStyle = '#047857';
  ctx.font = '800 12px "JetBrains Mono", monospace';
  ctx.fillText('LOCAL CHURCH / OUTSTATION', infoX, row3Y);

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 23px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(fitTextToWidth(ctx, data.localChurch || data.parishName || 'Parish Main', infoMaxW), infoX, row3Y + 33);

  // Verified Status Pill
  const badgeY = 434;
  ctx.fillStyle = '#ecfdf5';
  roundRectPath(ctx, infoX, badgeY, infoMaxW, 44, 10);
  ctx.fill();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, infoX, badgeY, infoMaxW, 44, 10);
  ctx.stroke();

  ctx.fillStyle = '#047857';
  ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('✓ PAYMENT VERIFIED · CONFIRMED DELEGATE', infoX + 16, badgeY + 27);

  // 6. RIGHT COLUMN: QR CODE BOX
  const qrSize = 188;
  const qrBoxX = width - qrSize - 56;
  const qrBoxY = 172;

  try {
    const qrPayload = JSON.stringify({
      system: 'Catholic Archdiocese of Nyeri - Challenge Week 2027',
      domain: 'system.quovadisyouthhub.org',
      code: data.memberCode,
      name: data.memberName,
      deanery: data.deaneryName,
      parish: data.parishName,
      localChurch: data.localChurch,
      verified: true,
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: qrSize,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    });

    const qrImg = await loadImage(qrDataUrl);
    ctx.fillStyle = '#ffffff';
    roundRectPath(ctx, qrBoxX - 12, qrBoxY - 12, qrSize + 24, qrSize + 60, 14);
    ctx.fill();
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, qrBoxX - 12, qrBoxY - 12, qrSize + 24, qrSize + 60, 14);
    ctx.stroke();

    ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrSize, qrSize);

    ctx.fillStyle = '#047857';
    ctx.font = '800 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN TO VERIFY', qrBoxX + qrSize / 2, qrBoxY + qrSize + 20);
    ctx.fillStyle = '#dc2626';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillText(data.memberCode, qrBoxX + qrSize / 2, qrBoxY + qrSize + 36);
    ctx.textAlign = 'left';
  } catch (err) {
    console.warn('Challenge card QR generation failed:', err);
  }

  // 7. BOTTOM GREEN FOOTER BAR
  const footerY = height - 66;
  const greenGrad = ctx.createLinearGradient(0, footerY, width, height);
  greenGrad.addColorStop(0, '#065f46');
  greenGrad.addColorStop(0.5, '#059669');
  greenGrad.addColorStop(1, '#047857');
  ctx.fillStyle = greenGrad;
  ctx.fillRect(0, footerY, width, 66);

  // Thin red stripe above green footer for cohesive Red-White-Green theme
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, footerY - 5, width, 5);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Catholic Archdiocese of Nyeri · Challenge Week 2027', 42, footerY + 39);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#d1fae5';
  ctx.font = '700 13px "JetBrains Mono", monospace';
  ctx.fillText('system.quovadisyouthhub.org', width - 42, footerY + 39);
  ctx.textAlign = 'left';

  ctx.restore();

  // Outer crisp border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  roundRectPath(ctx, 1, 1, width - 2, height - 2, radius);
  ctx.stroke();

  return canvas;
}

/**
 * Downloads a single member's Challenge Week card as a PNG file.
 */
export async function downloadChallengeCardPng(data: ChallengeCardData) {
  const canvas = await generateChallengeCardCanvas(data);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  const safeName = data.memberName.replace(/[^a-zA-Z0-9]+/g, '_');
  link.download = `ChallengeWeek2027_${data.memberCode}_${safeName}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates PNG cards for ALL registered members and downloads them together in a single .zip file.
 */
export async function downloadAllChallengeCardsZip(cards: ChallengeCardData[], zipLabel = 'ChallengeWeek2027_Cards') {
  const entries: Array<{ name: string; data: Uint8Array }> = [];

  for (const card of cards) {
    const canvas = await generateChallengeCardCanvas(card);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png');
    });
    const buffer = new Uint8Array(await blob.arrayBuffer());
    const safeName = card.memberName.replace(/[^a-zA-Z0-9]+/g, '_');
    entries.push({
      name: `ChallengeWeek2027_${card.memberCode}_${safeName}.png`,
      data: buffer,
    });
  }

  const zipBlob = buildUncompressedZip(entries);
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  const safeZipName = zipLabel.replace(/[^a-zA-Z0-9]+/g, '_');
  link.download = `${safeZipName}_All_Cards.zip`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function drawPhotoFallback(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string
) {
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(x, y, w, h);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || 'CW';

  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2 - 14, 44, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 32px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(initials, x + w / 2, y + h / 2 - 3);

  ctx.fillStyle = '#64748b';
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.fillText('NO PHOTO UPLOADED', x + w / 2, y + h - 24);
  ctx.textAlign = 'left';
}

function fitTextToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 3 && ctx.measureText(trimmed + '...').width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed + '...';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(0 + x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Pure TypeScript ZIP (STORE method) builder so multiple PNG cards download in one file
 * with zero external dependencies.
 */
function buildUncompressedZip(files: Array<{ name: string; data: Uint8Array }>): Blob {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;

    // Local file header (30 bytes + filename)
    const localHeader = new ArrayBuffer(30);
    const lv = new DataView(localHeader);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8
    lv.setUint16(8, 0, true); // Store (no compression)
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);

    localParts.push(new Uint8Array(localHeader), nameBytes, file.data);

    // Central directory header (46 bytes + filename)
    const centralHeader = new ArrayBuffer(46);
    const cv = new DataView(centralHeader);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);

    centralParts.push(new Uint8Array(centralHeader), nameBytes);
    offset += 30 + nameBytes.length + size;
  }

  const centralSize = centralParts.reduce((acc, part) => acc + part.length, 0);
  const eocd = new ArrayBuffer(22);
  const ev = new DataView(eocd);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const allParts: BlobPart[] = [
    ...localParts.map((u) => new Uint8Array(u)),
    ...centralParts.map((u) => new Uint8Array(u)),
    new Uint8Array(eocd),
  ];

  return new Blob(allParts, { type: 'application/zip' });
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
