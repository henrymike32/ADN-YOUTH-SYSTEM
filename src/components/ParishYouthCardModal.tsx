import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { YouthMember } from '../types';
import { useYouth } from '../context/YouthContext';
import { downloadParishCardPng } from '../utils/generateParishCardPng';
import { OfficialLogo } from './OfficialLogo';
import { 
  X, 
  Download, 
  Printer, 
  Sparkles,
  QrCode
} from 'lucide-react';

interface ParishYouthCardModalProps {
  member: YouthMember | null;
  onClose: () => void;
}

export const ParishYouthCardModal: React.FC<ParishYouthCardModalProps> = ({ member, onClose }) => {
  const { parishes, deaneries } = useYouth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const parish = parishes.find(p => p.id === member?.parishId);
  const deanery = deaneries.find(d => d.id === member?.deaneryId);

  const deaneryName = deanery?.name || 'Nyeri';
  const parishName = parish?.name || member?.parishId || 'Parish';
  const localChurch = member?.localChurch || member?.subParish || 'Local Church';

  // Exact scanned text requested by user:
  // "when once scanned, will say , name of the youth that its a registered archdiocese of nyeri youth in parishes member"
  const qrScannedMessage = member 
    ? `${member.fullName} is a registered archdiocese of nyeri youth in parishes member. Code: ${member.id}. Parish: ${parishName}, Deanery: ${deaneryName}, Local Church: ${localChurch}. Registration 2027.`
    : '';

  useEffect(() => {
    if (!member) return;
    QRCode.toDataURL(qrScannedMessage, {
      width: 190,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Error generating card QR code:', err));
  }, [member, qrScannedMessage]);

  if (!member) return null;

  const handleDownloadPng = async () => {
    try {
      setIsDownloading(true);
      await downloadParishCardPng({
        id: member.id,
        fullName: member.fullName,
        deaneryName,
        parishName,
        localChurch,
        status: member.approvalStatus || 'Pending',
      });
    } catch (err) {
      console.error('Error generating card PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200 my-6">
        
        {/* Header */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-gradient-to-r from-red-600 to-emerald-600 rounded-lg text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Youth in Parishes Registration 2027 Card
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Container */}
        <div className="p-5 space-y-3">
          
          {/* Exact Card specified by user */}
          <div className="print-card relative rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-xl text-white p-5 sm:p-6 bg-gradient-to-br from-red-700 via-rose-800 to-emerald-800">
            
            {/* Header: Starts with ARCHDIOCESE OF NYERI & Youth in parishes registration 2027 */}
            <div className="flex items-center gap-3 pb-3 border-b border-white/20">
              <div className="bg-white p-1 rounded-lg shadow-sm shrink-0">
                <OfficialLogo className="h-12 w-auto" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black tracking-wide uppercase text-white">
                  ARCHDIOCESE OF NYERI
                </h4>
                <p className="text-xs sm:text-sm text-amber-300 font-semibold tracking-tight">
                  Youth in parishes registration 2027
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="pt-4 grid grid-cols-12 gap-3 items-center">
              
              {/* Left Column: Name, Deanery, Parish, Local Church, Unique Code */}
              <div className="col-span-8 space-y-2.5">
                <div>
                  <span className="text-[9px] uppercase font-mono tracking-widest text-white/70 block">
                    NAME
                  </span>
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug">
                    {member.fullName}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/60 block font-mono">
                      DEANERY
                    </span>
                    <span className="font-bold text-white text-xs truncate block">
                      {deaneryName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/60 block font-mono">
                      PARISH
                    </span>
                    <span className="font-bold text-white text-xs truncate block">
                      {parishName}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[9px] uppercase tracking-wider text-white/60 block font-mono">
                      LOCAL CHURCH
                    </span>
                    <span className="font-bold text-emerald-200 text-sm block truncate">
                      {localChurch}
                    </span>
                  </div>
                </div>

                {/* Unique code (smaller as requested) */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/40 border border-amber-300/40 mt-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                    UNIQUE CODE:
                  </span>
                  <span className="text-[11px] font-mono font-bold text-white tracking-wider">
                    {member.id}
                  </span>
                </div>
              </div>

              {/* Right Column: QR Code in one corner */}
              <div className="col-span-4 flex flex-col items-center justify-center p-2.5 bg-white rounded-xl shadow-lg text-slate-900">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="Verification QR Code" className="w-24 h-24 sm:w-28 sm:h-28" />
                ) : (
                  <div className="w-24 h-24 bg-slate-100 flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-slate-400" />
                  </div>
                )}
                <span className="text-[8px] font-mono font-bold text-slate-700 mt-1 uppercase text-center leading-tight">
                  SCAN TO VERIFY
                </span>
                <span className="text-[7px] font-mono text-slate-400 text-center truncate max-w-full">
                  {member.id}
                </span>
              </div>

            </div>

          </div>

          {/* QR Scanned Output Explanation Note */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
            <span className="font-bold text-slate-800">When scanned, this QR code displays:</span>
            <div className="font-mono text-emerald-800 mt-0.5 bg-white p-1.5 rounded border border-slate-200 text-[10px]">
              "{member.fullName} is a registered archdiocese of nyeri youth in parishes member"
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="no-print px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            Format: High-Res PNG
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPng}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Generating...' : 'Download Card (PNG)'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
