import React, { useState } from 'react';
import { useYouth } from '../context/YouthContext';
import { FinancialRemittance, RemittanceType } from '../types';
import { 
  Receipt, 
  CheckCircle, 
  Clock, 
  Plus, 
  Download, 
  CreditCard, 
  ShieldCheck, 
  Smartphone,
  X
} from 'lucide-react';

interface FinanceViewProps {
  onOpenRemittanceModal: () => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ onOpenRemittanceModal }) => {
  const { remittances, parishes, deaneries, verifyRemittance } = useYouth();

  const [filterDeanery, setFilterDeanery] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredRemittances = remittances.filter((rem) => {
    const matchesDeanery = filterDeanery === 'ALL' || rem.deaneryId === filterDeanery;
    const matchesStatus = filterStatus === 'ALL' || rem.status === filterStatus;
    return matchesDeanery && matchesStatus;
  });

  const totalCollected = remittances.reduce((sum, r) => sum + r.amount, 0);
  const totalTarget = deaneries.reduce((sum, d) => sum + d.annualTarget, 0);
  const verifiedTotal = remittances
    .filter((r) => r.status === 'Verified')
    .reduce((sum, r) => sum + r.amount, 0);
  const pendingTotal = totalCollected - verifiedTotal;

  const handleExportCSV = () => {
    const headers = [
      'Receipt No',
      'Date',
      'Parish',
      'Deanery',
      'Remittance Type',
      'Amount (KES)',
      'M-Pesa Reference',
      'Paid By',
      'Payer Phone',
      'Status',
      'Verified By',
    ];

    const rows = filteredRemittances.map((r) => {
      const p = parishes.find((parish) => parish.id === r.parishId);
      const d = deaneries.find((deanery) => deanery.id === r.deaneryId);
      return [
        r.receiptNo,
        r.date,
        `"${p?.name || ''}"`,
        `"${d?.name || ''}"`,
        `"${r.remittanceType}"`,
        r.amount,
        r.mpesaRef,
        `"${r.paidBy}"`,
        r.paidByPhone,
        r.status,
        `"${r.verifiedBy || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Archdiocese_Nyeri_Youth_Remittances_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Youth Stewardship & Remittance Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Annual Archdiocesan levies, AYD rally registrations, and Deanery fund reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Financial Ledger</span>
          </button>
          <button
            onClick={onOpenRemittanceModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Record Parish Remittance</span>
          </button>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">
            TOTAL REMITTANCES RECORDED
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
            KES {totalCollected.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Target: KES {totalTarget.toLocaleString()} ({Math.round((totalCollected / totalTarget) * 100)}% attained)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">
            VERIFIED M-PESA SETTLEMENTS
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-700">
            KES {verifiedTotal.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-emerald-800 font-medium">
            Reconciled with Archdiocesan Youth Account
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">
            PENDING RECONCILIATION
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-700">
            KES {pendingTotal.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-amber-800 font-medium">
            Awaiting bank/paybill confirmation
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Deanery:</span>
            <select
              value={filterDeanery}
              onChange={(e) => setFilterDeanery(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
            >
              <option value="ALL">All Deaneries</option>
              {deaneries.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Pending Verification">Pending Verification</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500 font-mono tabular-nums">
          Showing {filteredRemittances.length} receipts
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Receipt & Date</th>
                <th className="py-3 px-4">Parish & Deanery</th>
                <th className="py-3 px-4">Remittance Category</th>
                <th className="py-3 px-4">M-Pesa Reference</th>
                <th className="py-3 px-4 text-right">Amount (KES)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRemittances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No remittances match this filter.
                  </td>
                </tr>
              ) : (
                filteredRemittances.map((rem) => {
                  const parish = parishes.find((p) => p.id === rem.parishId);
                  const deanery = deaneries.find((d) => d.id === rem.deaneryId);

                  return (
                    <tr key={rem.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 font-mono">{rem.receiptNo}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{rem.date}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{parish?.name || 'Parish'}</div>
                        <div className="text-[11px] text-slate-400">{deanery?.name || 'Deanery'}</div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700">
                        {rem.remittanceType}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className="text-slate-900 font-semibold">{rem.mpesaRef}</div>
                        <div className="text-[11px] text-slate-400">Paid by: {rem.paidBy}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        KES {rem.amount.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {rem.status === 'Verified' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {rem.status === 'Pending Verification' ? (
                          <button
                            onClick={() =>
                              verifyRemittance(
                                rem.id,
                                'Archdiocesan Youth Chaplaincy (Fr. Anthony Mwangi)'
                              )
                            }
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-xs"
                          >
                            Verify M-Pesa
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Verified by {rem.verifiedBy?.split(' ')[0] || 'Office'}
                          </span>
                        )}
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
  );
};
