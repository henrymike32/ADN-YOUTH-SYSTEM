import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useYouth } from '../context/YouthContext';
import logoSvg from '../assets/images/archdiocese_nyeri_youth_logo.svg';
import { 
  CreditCard, 
  CheckCircle2, 
  Calendar, 
  Printer, 
  BookOpen, 
  MapPin, 
  UserCheck, 
  Sparkles,
  Phone
} from 'lucide-react';

interface MemberPortalViewProps {
  onOpenCardModal: (member: any) => void;
}

export const MemberPortalView: React.FC<MemberPortalViewProps> = ({ onOpenCardModal }) => {
  const { 
    members, 
    parishes, 
    deaneries, 
    events, 
    currentMemberId, 
    setCurrentMemberId, 
    toggleEventRegistration 
  } = useYouth();

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const activeMember = members.find((m) => m.id === currentMemberId) || members[0];
  const memberParish = parishes.find((p) => p.id === activeMember?.parishId);
  const memberDeanery = deaneries.find((d) => d.id === activeMember?.deaneryId);

  useEffect(() => {
    if (!activeMember) return;
    const payload = JSON.stringify({
      system: 'Archdiocese of Nyeri Youth Portal',
      id: activeMember.id,
      name: activeMember.fullName,
      parish: memberParish?.name,
      deanery: memberDeanery?.name,
      movement: activeMember.movement,
      validUntil: '2026-12-31',
    });

    QRCode.toDataURL(payload, {
      width: 130,
      margin: 1,
      color: {
        dark: '#0B1B3D',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error(err));
  }, [activeMember, memberParish, memberDeanery]);

  if (!activeMember) return null;

  return (
    <div className="space-y-6">
      {/* Title & Member Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            My Digital Youth Pass & Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Personal Archdiocesan membership credential, sacramental status & event registrations
          </p>
        </div>

        {/* Member Selector to switch whose card we are viewing */}
        <div className="flex items-center gap-2 bg-white p-2 border border-slate-200 rounded-lg shadow-xs text-xs">
          <span className="text-slate-500 font-medium">Viewing Delegate:</span>
          <select
            value={currentMemberId}
            onChange={(e) => setCurrentMemberId(e.target.value)}
            className="font-semibold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} ({m.movement} - {m.id.slice(-4)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Card on Left (5 cols) + Event Bookings & Sacraments on Right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Official Digital Archdiocesan Pass */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border-2 border-amber-600/30 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white p-5 shadow-lg relative overflow-hidden">
            
            {/* Header */}
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
                    Diocesan Youth Ministry Pass
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] uppercase font-mono tracking-widest text-white/50 block">VALID THRU</span>
                <span className="text-xs font-bold font-mono text-amber-300">DEC 2026</span>
              </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-8 space-y-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-white/50 block">MEMBER ID</span>
                  <span className="text-sm font-bold font-mono text-amber-200">
                    {activeMember.id}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-white/50 block">FULL NAME</span>
                  <span className="text-base font-bold text-white block">
                    {activeMember.fullName}
                  </span>
                  <span className="text-xs text-white/80 font-medium">
                    {activeMember.movement} · {activeMember.leadershipRole}
                  </span>
                </div>

                <div className="pt-1 text-xs text-white/90">
                  <span className="text-[9px] uppercase tracking-wider text-white/50 block">PARISH & DEANERY</span>
                  <span className="font-medium text-[11px] block">{memberParish?.name}</span>
                  <span className="text-[10px] text-white/60">{memberDeanery?.name}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="col-span-4 flex flex-col items-center justify-center p-2 bg-white rounded-lg shadow-inner">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code Pass" className="w-24 h-24" />
                ) : (
                  <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                    Loading...
                  </div>
                )}
                <span className="text-[8px] font-mono text-slate-700 mt-1 uppercase font-semibold text-center tracking-tighter">
                  OFFICIAL PASS
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-white/60">
              <span>Motto: Stand Firm in Faith (1 Cor 16:13)</span>
              <span>Quo Vadis Youth Hub</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenCardModal(activeMember)}
              className="flex-1 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs text-center"
            >
              Expand Full ID Card
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Pass</span>
            </button>
          </div>
        </div>

        {/* Right Column: Sacramental Credentials & Event Registrations */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Sacramental Credentials Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Sacramental Status & Spiritual Profile
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">BAPTISM</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {activeMember.sacraments.baptism ? 'Received' : 'Pending'}
                </span>
                {activeMember.sacraments.baptismCertNo && (
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">
                    {activeMember.sacraments.baptismCertNo}
                  </span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">CONFIRMATION</span>
                <span className={`font-semibold flex items-center gap-1 mt-0.5 ${
                  activeMember.sacraments.confirmation ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {activeMember.sacraments.confirmation ? 'Confirmed' : 'Pending'}
                </span>
                {activeMember.sacraments.confirmationCardNo && (
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">
                    {activeMember.sacraments.confirmationCardNo}
                  </span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">HOLY COMMUNION</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {activeMember.sacraments.firstCommunion ? 'Full Member' : 'Pending'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">HOLY MATRIMONY</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                  {activeMember.sacraments.matrimony ? 'Church Married' : 'Single'}
                </span>
              </div>
            </div>

            {/* Ministry & Talents */}
            <div className="pt-2 text-xs flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-medium">Guild / Ministry:</span>
              <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {activeMember.ministryGuild}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-medium">Talents:</span>
              {activeMember.skills.map((s, i) => (
                <span key={i} className="text-slate-700 bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded text-[11px] font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Event Bookings & Registrations */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Gatherings & Rallies Enrollment
            </h3>
            <p className="text-xs text-slate-500">
              One-click registration for upcoming Archdiocesan and Deanery gatherings
            </p>

            <div className="space-y-2.5">
              {events.map((event) => {
                const isRegistered = event.registeredMemberIds.includes(activeMember.id);
                const isAttended = event.attendedMemberIds.includes(activeMember.id);
                const dateStr = new Date(event.startDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={event.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{event.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200/70 rounded text-slate-700">
                          {event.scope}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {dateStr} · {event.venue} · Fee: KES {event.fee}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isAttended && (
                        <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                        </span>
                      )}
                      <button
                        onClick={() => toggleEventRegistration(event.id, activeMember.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          isRegistered
                            ? 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-100'
                            : 'text-white bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        {isRegistered ? 'Registered (Cancel)' : 'Register for Event'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
