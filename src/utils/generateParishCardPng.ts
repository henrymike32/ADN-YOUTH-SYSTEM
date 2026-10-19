import QRCode from 'qrcode';
import logoSvg from '../assets/images/archdiocese_nyeri_youth_logo.svg';

export interface CardData {
  id: string; // unique code e.g. ADN-PRSH-2026-0042
  fullName: string;
  deaneryName: string;
  parishName: string;
  localChurch: string;
  status?: string;
}

/**
 * Generates an ultra high-quality PNG digital card for a Parish Youth Member
 * adhering strictly to the user's requirements:
 * - Starts with: "ARCHDIOCESE OF NYERI"
 * - Subheader: "Youth in parishes registration 2027"
 * - Fields: Name, Deanery, Parish, Local Church, Unique Code (smaller)
 * - Red and Green gradient background with official logo
 * - One corner has a QR code that when scanned says:
 *   "[Name of the youth] is a registered archdiocese of nyeri youth in parishes member"
 */
export async function generateParishCardCanvas(data: CardData): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  // 1050 x 600 px (3.5 : 2 ratio at 300 DPI)
  const width = 1050;
  const height = 600;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // 1. Rounded rectangle clip
  const radius = 28;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.quadraticCurveTo(width, 0, width, radius);
  ctx.lineTo(width, height - radius);
  ctx.quadraticCurveTo(width, height, width - radius, height);
  ctx.lineTo(radius, height);
  ctx.quadraticCurveTo(0, height, 0, height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.clip();

  // 2. Base Background: Gradient of Red and Green
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#991b1b'); // rich Catholic red
  bgGradient.addColorStop(0.48, '#7f1d1d'); // deep red
  bgGradient.addColorStop(0.52, '#064e3b'); // deep green
  bgGradient.addColorStop(1, '#047857'); // vibrant emerald green
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle dark radial overlay for perfect text contrast
  const vignette = ctx.createRadialGradient(width / 2, height / 2, 120, width / 2, height / 2, width * 0.75);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // Subtle gold border
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Thin inner border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // 3. Official Logo
  try {
    const logoImg = await loadImage(logoSvg);
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 40, 36, 115, 90, 12);
    ctx.fill();
    ctx.drawImage(logoImg, 45, 41, 105, 80);
  } catch (err) {
    console.warn('Could not load logo for canvas:', err);
  }

  // 4. Header: Starts with "ARCHDIOCESE OF NYERI" & "Youth in parishes registration 2027"
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ARCHDIOCESE OF NYERI', 175, 76);

  ctx.fillStyle = '#fde68a'; // gold text
  ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Youth in parishes registration 2027', 175, 110);

  // Header dividing line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 142);
  ctx.lineTo(width - 40, 142);
  ctx.stroke();

  // 5. Body Items (Only what was requested)
  // NAME
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillText('NAME', 45, 182);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
  let displayName = data.fullName;
  if (displayName.length > 27) displayName = displayName.slice(0, 25) + '...';
  ctx.fillText(displayName, 45, 226);

  // DEANERY & PARISH
  const colY = 295;
  // DEANERY
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillText('DEANERY', 45, colY);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(data.deaneryName || 'Nyeri', 45, colY + 30);

  // PARISH
  const parishX = 390;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillText('PARISH', parishX, colY);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(data.parishName || 'Parish', parishX, colY + 30);

  // LOCAL CHURCH
  const churchY = 395;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillText('LOCAL CHURCH', 45, churchY);

  ctx.fillStyle = '#a7f3d0'; // light emerald tint
  ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(data.localChurch || 'Local Church', 45, churchY + 32);

  // UNIQUE CODE (Smaller code as requested)
  const codeY = 500;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  roundRect(ctx, 45, codeY - 20, 290, 44, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.fillText('UNIQUE CODE:', 58, codeY + 8);

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 15px "JetBrains Mono", monospace';
  ctx.fillText(data.id, 168, codeY + 8);

  // 6. QR CODE ON ONE CORNER
  // Prompt instruction: "you can also have on one corner a qr code that when once scanned, will say , name of the youth that its a registered archdiocese of nyeri youth in parishes member"
  const qrCornerSize = 195;
  const qrX = width - qrCornerSize - 45;
  const qrY = 175;

  try {
    const qrScannedText = `${data.fullName} is a registered archdiocese of nyeri youth in parishes member. Code: ${data.id}. Parish: ${data.parishName}, Deanery: ${data.deaneryName}, Local Church: ${data.localChurch}. Registration 2027.`;

    const qrDataUrl = await QRCode.toDataURL(qrScannedText, {
      width: qrCornerSize,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const qrImg = await loadImage(qrDataUrl);
    // Background card for QR
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qrX - 10, qrY - 10, qrCornerSize + 20, qrCornerSize + 48, 14);
    ctx.fill();
    ctx.drawImage(qrImg, qrX, qrY, qrCornerSize, qrCornerSize);

    // Label below QR
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN TO VERIFY MEMBER', qrX + qrCornerSize / 2, qrY + qrCornerSize + 18);
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillText(data.id, qrX + qrCornerSize / 2, qrY + qrCornerSize + 32);
    ctx.textAlign = 'left';
  } catch (err) {
    console.warn('QR code generation error:', err);
  }

  // Footer bar
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillText('Catholic Archdiocese of Nyeri · Registration 2027', 45, height - 25);
  ctx.textAlign = 'right';
  ctx.fillText('powered by quovadis @2024', width - 45, height - 25);
  ctx.textAlign = 'left';

  return canvas;
}

/**
 * Downloads the card in PNG format
 */
export async function downloadParishCardPng(data: CardData) {
  const canvas = await generateParishCardCanvas(data);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  const safeName = data.fullName.replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `ADN_Youth_Card_${data.id}_${safeName}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

function roundRect(
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
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
