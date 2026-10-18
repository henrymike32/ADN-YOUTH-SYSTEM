import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useYouth } from '../context/YouthContext';
import { ArchdiocesanEvent, EventScope, YouthMovement } from '../types';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  QrCode, 
  CheckCircle2, 
  Printer, 
  Clock, 
  Sparkles,
  BookOpen,
  X
} from 'lucide-react';

export const EventsView: React.FC = () => {
  const { events, members, parishes, deaneries, addEvent, markEventAttendance, toggleEventRegistration } = useYouth();

  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  
  // Check-in simulator input
  const [checkInMemberId, setCheckInMemberId] = useState('');
  const [checkInMessage, setCheckInMessage] = useState<{ text: string; success: boolean } | null>(null);

  // New Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventTheme, setEventTheme] = useState('');
  const [eventScripture, setEventScripture] = useState('');
  const [eventScope, setEventScope] = useState<EventScope>('Archdiocesan');
  const [eventVenue, setEventVenue] = useState('Blessed Sister Irene Stefani Mathari Grounds');
  const [eventStartDate, setEventStartDate] = useState('2026-11-21T08:00');
  const [eventEndDate, setEventEndDate] = useState('2026-11-22T17:00');
  const [eventFee, setEventFee] = useState(300);
  const [eventCapacity, setEventCapacity] = useState(1500);
  const [eventCoordinator, setEventCoordinator] = useState('Rev. Fr. Anthony Mwangi');
  const [eventCoordinatorPhone, setEventCoordinatorPhone] = useState('+254 712 001 002');
  const [eventDescription, setEventDescription] = useState('');

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    addEvent({
      title: eventTitle.trim(),
      theme: eventTheme.trim() || 'Christus Vivit: Standing Firm in Faith',
      scriptureReference: eventScripture.trim() || '1 Corinthians 16:13',
      scope: eventScope,
      venue: eventVenue.trim(),
      startDate: eventStartDate,
      endDate: eventEndDate,
      fee: Number(eventFee) || 0,
      capacity: Number(eventCapacity) || 500,
      coordinator: eventCoordinator.trim(),
      coordinatorPhone: eventCoordinatorPhone.trim(),
      targetMovements: ['Junior Youth', 'CYO', 'YCA'],
      status: 'Upcoming',
      bannerDescription: eventDescription.trim() || 'Diocesan youth spiritual and fellowship gathering.',
    });

    setShowNewEventModal(false);
  };

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInMemberId.trim() || !selectedEvent) return;

    // Search member by ID, phone, or name
    const query = checkInMemberId.trim().toLowerCase();
    const foundMember = members.find(
      (m) =>
        m.id.toLowerCase() === query ||
        m.phone.replace(/\s+/g, '').includes(query.replace(/\s+/g, '')) ||
        m.fullName.toLowerCase().includes(query)
    );

    if (!foundMember) {
      setCheckInMessage({
        text: `No registered member found matching "${checkInMemberId}". Please verify the ID or phone number.`,
        success: false,
      });
      return;
    }

    const wasMarked = markEventAttendance(selectedEvent.id, foundMember.id);
    
    // Trigger confetti celebration on check-in
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#D97706', '#0B1B3D', '#10B981'],
      });
    } catch {
      // ignore
    }

    setCheckInMessage({
      text: wasMarked
        ? `Successfully checked in: ${foundMember.fullName} (${foundMember.id}) - Parish: ${
            parishes.find((p) => p.id === foundMember.parishId)?.name || 'Nyeri'
          }`
        : `${foundMember.fullName} was already marked as attended.`,
      success: true,
    });

    setCheckInMemberId('');
  };

  const handlePrintAttendance = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Archdiocesan Events, Rallies & Check-In
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Diocesan youth gatherings, deanery tournaments, spiritual retreats, and QR gate verification
          </p>
        </div>

        <button
          onClick={() => setShowNewEventModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>Publish New Gathering</span>
        </button>
      </div>

      {/* Main Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Events Roster (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Scheduled Gatherings ({events.length})
          </span>

          <div className="space-y-2.5">
            {events.map((event) => {
              const isSelected = event.id === selectedEvent?.id;
              const dateStr = new Date(event.startDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEventId(event.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-amber-300' : 'text-slate-900'
                      }`}
                    >
                      {event.title}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-white/10 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {event.scope}
                    </span>
                  </div>

                  <p
                    className={`text-xs mt-1 italic ${
                      isSelected ? 'text-white/80' : 'text-slate-600'
                    }`}
                  >
                    "{event.theme}"
                  </p>

                  <div
                    className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] ${
                      isSelected ? 'border-white/10 text-white/70' : 'border-slate-100 text-slate-500'
                    }`}
                  >
                    <span className="font-mono tabular-nums">{dateStr}</span>
                    <span className="font-mono tabular-nums">
                      {event.attendedMemberIds.length} / {event.registeredMemberIds.length} attended
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Event Command Center (8 cols) */}
        {selectedEvent && (
          <div className="lg:col-span-8 space-y-6">
            
            {/* Event Detail Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    <span>{selectedEvent.scope} Gathering</span>
                    <span aria-hidden="true">·</span>
                    <span>Status: {selectedEvent.status}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {selectedEvent.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 italic">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Theme: "{selectedEvent.theme}" ({selectedEvent.scriptureReference})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCheckInModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
                  >
                    <QrCode className="w-4 h-4 text-emerald-200" />
                    <span>Scan / Check In</span>
                  </button>
                  <button
                    onClick={handlePrintAttendance}
                    className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                    title="Print Attendance Manifest"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Event Metadata Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    VENUE
                  </span>
                  <span className="font-semibold text-slate-900">{selectedEvent.venue}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    DATES
                  </span>
                  <span className="font-semibold text-slate-900">
                    {new Date(selectedEvent.startDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    REGISTRATION LEVY
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    KES {selectedEvent.fee}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    ATTENDANCE RATE
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {selectedEvent.attendedMemberIds.length} / {selectedEvent.registeredMemberIds.length} Verified
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 pt-3 border-t border-slate-100">
                {selectedEvent.bannerDescription}
              </p>
            </div>

            {/* Attendance Manifest Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Registered & Attending Delegations
                  </h3>
                  <p className="text-xs text-slate-500">
                    Parish delegates registered for {selectedEvent.title}
                  </p>
                </div>

                <span className="text-xs font-mono font-semibold text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200 tabular-nums">
                  {selectedEvent.registeredMemberIds.length} Total Registered
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Delegate Name & ID</th>
                      <th className="py-2.5 px-4">Parish & Deanery</th>
                      <th className="py-2.5 px-4">Movement</th>
                      <th className="py-2.5 px-4 text-center">Gate Attendance</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedEvent.registeredMemberIds.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No registered delegates yet.
                        </td>
                      </tr>
                    ) : (
                      selectedEvent.registeredMemberIds.map((memberId) => {
                        const member = members.find((m) => m.id === memberId);
                        if (!member) return null;
                        const parish = parishes.find((p) => p.id === member.parishId);
                        const deanery = deaneries.find((d) => d.id === member.deaneryId);
                        const isAttended = selectedEvent.attendedMemberIds.includes(memberId);

                        return (
                          <tr key={memberId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{member.fullName}</div>
                              <div className="text-[11px] font-mono text-slate-500">{member.id}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-800">{parish?.name || 'Parish'}</div>
                              <div className="text-[11px] text-slate-400">{deanery?.name || 'Deanery'}</div>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-700">
                              {member.movement}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isAttended ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Verified Present
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">
                                  Awaiting Check-in
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => markEventAttendance(selectedEvent.id, member.id)}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                                  isAttended
                                    ? 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                                    : 'text-white bg-slate-900 hover:bg-slate-800'
                                }`}
                              >
                                {isAttended ? 'Check Out' : 'Check In'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Check-In Gate Scanner Simulator Modal */}
      {showCheckInModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Gate Attendance & Pass Scanner
                </h3>
                <p className="text-xs text-slate-500">{selectedEvent.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowCheckInModal(false);
                  setCheckInMessage(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-900 text-white rounded-xl text-center space-y-2 relative overflow-hidden">
                <QrCode className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
                <h4 className="text-xs font-bold tracking-wider uppercase text-amber-300">
                  Ready to Verify Delegate
                </h4>
                <p className="text-[11px] text-white/70">
                  Scan QR code on physical ID card or type Member ID / Phone number below
                </p>
              </div>

              <form onSubmit={handleManualCheckIn} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Enter Member ID, Phone or Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={checkInMemberId}
                    onChange={(e) => setCheckInMemberId(e.target.value)}
                    placeholder="e.g. ADN-YTH-2026-0001 or +254 711 223 344"
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                >
                  Verify & Admit to Gathering
                </button>
              </form>

              {checkInMessage && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium border ${
                    checkInMessage.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {checkInMessage.text}
                </div>
              )}

              {/* Quick simulation buttons of registered members */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-2">
                  QUICK CLICK TEST SAMPLES:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEvent.registeredMemberIds.slice(0, 4).map((mId) => {
                    const m = members.find((mem) => mem.id === mId);
                    if (!m) return null;
                    return (
                      <button
                        key={mId}
                        type="button"
                        onClick={() => {
                          setCheckInMemberId(m.id);
                        }}
                        className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                      >
                        {m.fullName.split(' ')[0]} ({m.id.slice(-4)})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Event Modal */}
      {showNewEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 my-8">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Publish New Youth Gathering / Rally
                </h3>
                <p className="text-xs text-slate-500">Catholic Archdiocese of Nyeri Youth Ministry</p>
              </div>
              <button
                onClick={() => setShowNewEventModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Archdiocesan Youth Lenten Pilgrimage 2026"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Theme
                  </label>
                  <input
                    type="text"
                    value={eventTheme}
                    onChange={(e) => setEventTheme(e.target.value)}
                    placeholder="e.g. Christus Vivit"
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scripture Reference
                  </label>
                  <input
                    type="text"
                    value={eventScripture}
                    onChange={(e) => setEventScripture(e.target.value)}
                    placeholder="e.g. 1 Corinthians 16:13"
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scope
                  </label>
                  <select
                    value={eventScope}
                    onChange={(e) => setEventScope(e.target.value as EventScope)}
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  >
                    <option value="Archdiocesan">Archdiocesan (All 7 Deaneries)</option>
                    <option value="Deanery">Deanery Level</option>
                    <option value="Parish">Parish Gathering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Fee (KES)
                  </label>
                  <input
                    type="number"
                    value={eventFee}
                    onChange={(e) => setEventFee(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Venue / Location
                </label>
                <input
                  type="text"
                  value={eventVenue}
                  onChange={(e) => setEventVenue(e.target.value)}
                  placeholder="e.g. Mathari Pastoral Centre Grounds, Nyeri"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Coordinator Name
                  </label>
                  <input
                    type="text"
                    value={eventCoordinator}
                    onChange={(e) => setEventCoordinator(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Coordinator Phone
                  </label>
                  <input
                    type="text"
                    value={eventCoordinatorPhone}
                    onChange={(e) => setEventCoordinatorPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description & Logistics
                </label>
                <textarea
                  rows={2}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Program highlights, transport arrangements from Karatina, Othaya, Mukurwe-ini, etc."
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewEventModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Publish Gathering
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
