import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { YouthMember } from '../types';
import { useYouth } from '../context/YouthContext';
import logoSvg from '../assets/images/archdiocese_nyeri_youth_logo.svg';
import { X, Printer, CheckCircle, Shield, Award, User, Phone } from 'lucide-react';

interface MemberCardModalProps {
  member: YouthMember | null;
  onClose: () => void;
}

export const MemberCardModal: React.FC<MemberCardModalProps> = ({ member, onClose }) => {
  const { deaneries, parishes } = useYouth();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!member) return;
    const verificationPayload = JSON.stringify({
      system: 'Archdiocese of Nyeri Youth Management Portal',
      id: member.id,
      name: member.fullName,
      parishId: member.parishId,
      deaneryId: member.deaneryId,
      movement: member.movement,
      verified: true,
      validUntil: '2026-12-31',
    });

    QRCode.toDataURL(verificationPayload, {
      width: 140,
      margin: 1,
      color: {
        dark: '#0B1B3D',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR', err));
  }, [member]);

  if (!member) return null;

  const parish = parishes.find((p) => p.id === member.parishId);
  const deanery = deaneries.find((d) => d.id === member.deaneryId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Official Youth Membership Pass</h3>
            <p className="text-xs text-slate-500">Catholic Archdiocese of Nyeri · Quo Vadis Youth Hub</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Container */}
        <div className="p-6">
          <div className="print-card rounded-xl border-2 border-amber-600/30 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white p-5 shadow-lg relative overflow-hidden">
            
            {/* Background Archdiocesan Watermark Graphic */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 opacity-10 pointer-events-none rounded-full bg-amber-400 blur-2xl" />

            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={logoSvg}
                  alt="Archdiocese of Nyeri Youth Logo"
                  className="w-14 h-12 bg-white rounded-md p-0.5 object-contain"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-xs font-bold tracking-wider uppercase text-amber-300">
                    Catholic Archdiocese of Nyeri
                  </h4>
                  <p className="text-[11px] text-white/80 font-medium">
                    Diocesan Youth Ministry Membership Card
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-mono tracking-widest text-white/50 block">VALID THRU</span>
                <span className="text-xs font-bold font-mono text-amber-300">DEC 2026</span>
              </div>
            </div>

            {/* Card Body */}
            <div className="grid grid-cols-12 gap-4 items-center">
              
              {/* Photo & Identity Left Column */}
              <div className="col-span-8 space-y-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-white/50 block">MEMBER ID</span>
                  <span className="text-sm font-bold font-mono tracking-wider text-amber-200">
                    {member.id}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-white/50 block">FULL NAME</span>
                  <span className="text-base font-bold text-white block">
                    {member.fullName}
                  </span>
                  <span className="text-xs text-white/80 font-medium">
                    {member.movement} · {member.leadershipRole}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-white/90">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/50 block">PARISH</span>
                    <span className="font-medium text-[11px] truncate block">{parish?.name || 'Parish'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/50 block">DEANERY</span>
                    <span className="font-medium text-[11px] truncate block">{deanery?.name || 'Deanery'}</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-3 text-[10px] text-white/80">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    Baptism {member.sacraments.baptism ? '✓' : '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    Confirmation {member.sacraments.confirmation ? '✓' : 'Pending'}
                  </span>
                </div>
              </div>

              {/* QR Code Verification Right Column */}
              <div className="col-span-4 flex flex-col items-center justify-center p-2 bg-white rounded-lg shadow-inner">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Verification QR Code" className="w-24 h-24" />
                ) : (
                  <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                    Generating...
                  </div>
                )}
                <span className="text-[8px] font-mono text-slate-600 mt-1 uppercase font-semibold text-center tracking-tighter">
                  SCAN TO VERIFY
                </span>
              </div>
            </div>

            {/* Card Footer Bar */}
            <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-white/60">
              <span>Motto: Stand Firm in the Faith (1 Cor 16:13)</span>
              <span>Archdiocese of Nyeri Youth Directorate</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="no-print px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Emergency: <span className="font-medium text-slate-700">{member.emergencyContact.name} ({member.emergencyContact.phone})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Pass</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
