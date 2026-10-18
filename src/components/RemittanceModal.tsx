import React, { useState } from 'react';
import { useYouth } from '../context/YouthContext';
import { RemittanceType } from '../types';
import { X, Smartphone, Save } from 'lucide-react';

interface RemittanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RemittanceModal: React.FC<RemittanceModalProps> = ({ isOpen, onClose }) => {
  const { parishes, deaneries, addRemittance } = useYouth();

  const [parishId, setParishId] = useState(parishes[0]?.id || '');
  const [remittanceType, setRemittanceType] = useState<RemittanceType>(
    'Annual Archdiocesan Youth Levy'
  );
  const [amount, setAmount] = useState(35000);
  const [mpesaRef, setMpesaRef] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [paidByPhone, setPaidByPhone] = useState('+254 7');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const selectedParish = parishes.find((p) => p.id === parishId) || parishes[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parishId || !amount || !mpesaRef.trim() || !paidBy.trim()) {
      alert('Please fill in Parish, Amount, M-Pesa Code, and Payer Name.');
      return;
    }

    addRemittance({
      parishId,
      deaneryId: selectedParish.deaneryId,
      remittanceType,
      amount: Number(amount),
      mpesaRef: mpesaRef.trim().toUpperCase(),
      paidBy: paidBy.trim(),
      paidByPhone: paidByPhone.trim(),
      date: new Date().toISOString().split('T')[0],
      status: 'Verified',
      verifiedBy: 'Archdiocesan Finance Office',
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Record Youth Remittance</h3>
            <p className="text-xs text-slate-500">M-Pesa Paybill / Archdiocesan Bank Receipt</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remitting Parish *
            </label>
            <select
              value={parishId}
              onChange={(e) => setParishId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
            >
              {parishes.map((p) => {
                const d = deaneries.find((dean) => dean.id === p.deaneryId);
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({d?.name.replace(' Deanery', '')})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remittance Category *
            </label>
            <select
              value={remittanceType}
              onChange={(e) => setRemittanceType(e.target.value as RemittanceType)}
              className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
            >
              <option value="Annual Archdiocesan Youth Levy">
                Annual Archdiocesan Youth Levy
              </option>
              <option value="Archdiocesan Youth Day (AYD) Rally">
                Archdiocesan Youth Day (AYD) Rally Passes
              </option>
              <option value="Deanery Sports & Talents Tournament">
                Deanery Sports & Talents Tournament
              </option>
              <option value="Lenten Youth Charity Kitty">
                Lenten Youth Charity Kitty
              </option>
              <option value="Vocations Drive Offering">
                Vocations Drive Offering
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (KES) *
              </label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                M-Pesa Ref Code *
              </label>
              <input
                type="text"
                required
                value={mpesaRef}
                onChange={(e) => setMpesaRef(e.target.value)}
                placeholder="e.g. SH91KL42M9"
                className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payer / Treasurer Name *
              </label>
              <input
                type="text"
                required
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                placeholder="e.g. Dennis Kamau"
                className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payer Phone *
              </label>
              <input
                type="text"
                required
                value={paidByPhone}
                onChange={(e) => setPaidByPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes / Settlement Remarks
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 2nd quarter levy payment approved by parish priest"
              className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Record Remittance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
