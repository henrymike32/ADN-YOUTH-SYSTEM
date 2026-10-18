import React, { useState } from 'react';
import { useYouth } from '../context/YouthContext';
import { X, Download, Upload, RotateCcw, Database, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({ isOpen, onClose }) => {
  const { 
    members, 
    parishes, 
    deaneries, 
    events, 
    remittances, 
    vocations, 
    welfare, 
    exportDataJson, 
    importDataJson, 
    resetToSeedData 
  } = useYouth();

  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const jsonString = exportDataJson();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Archdiocese_Nyeri_Youth_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJson(content);
        if (success) {
          setImportStatus('Database successfully restored from JSON file.');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Error: Invalid database JSON structure.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Reset database to default Archdiocese of Nyeri seed records? Any custom additions will be restored.')) {
      resetToSeedData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">System Data & Backups</h3>
              <p className="text-xs text-slate-500">Archdiocese of Nyeri Youth Management Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Database Summary */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              LOCAL PERSISTENCE STATS
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-700 font-mono">
              <div>Enrolled Youth: <span className="font-bold text-slate-900">{members.length}</span></div>
              <div>Parishes: <span className="font-bold text-slate-900">{parishes.length}</span></div>
              <div>Deaneries: <span className="font-bold text-slate-900">{deaneries.length}</span></div>
              <div>Events: <span className="font-bold text-slate-900">{events.length}</span></div>
              <div>Remittances: <span className="font-bold text-slate-900">{remittances.length}</span></div>
              <div>Vocations: <span className="font-bold text-slate-900">{vocations.length}</span></div>
            </div>
          </div>

          {/* Export */}
          <div className="space-y-1.5">
            <h4 className="font-semibold text-slate-900">1. Backup Database</h4>
            <p className="text-slate-500">
              Download the complete Diocesan youth registry, events, and financial ledger to your local device.
            </p>
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download JSON Database Backup</span>
            </button>
          </div>

          {/* Import */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            <h4 className="font-semibold text-slate-900">2. Restore Database from JSON</h4>
            <p className="text-slate-500">
              Import a previously exported JSON backup file.
            </p>
            <label className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-lg transition-colors border border-slate-300 shadow-xs cursor-pointer">
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Select Backup File to Restore</span>
              <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            </label>
            {importStatus && (
              <p className="text-center font-medium text-emerald-700 mt-1">{importStatus}</p>
            )}
          </div>

          {/* Reset */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            <h4 className="font-semibold text-slate-900">3. Restore Archdiocesan Seed Data</h4>
            <p className="text-slate-500">
              Re-populate with all official parishes, deaneries, and initial youth rosters.
            </p>
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg transition-colors border border-red-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Default Nyeri Archdiocesan Data</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
