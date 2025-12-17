
import React, { useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, Search, Plus, 
  FileText, Microscope, Sparkles, Loader2, ChevronRight, X 
} from 'lucide-react';
import { MOCK_INCIDENTS } from '../services/mockData';
import { Incident } from '../types';
import { generateIncidentInvestigation } from '../services/geminiService';

const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handler for AI Investigation
  const handleInvestigate = async () => {
    if (!selectedIncident) return;
    setIsAnalyzing(true);
    try {
      const analysis = await generateIncidentInvestigation(
        selectedIncident.description,
        selectedIncident.type
      );
      
      const updatedIncident = {
        ...selectedIncident,
        rootCause: analysis.rootCause,
        actionsTaken: analysis.recommendedActions.join('. '),
        investigationNotes: `Risk Score: ${analysis.riskScore}/10. Prevention: ${analysis.preventionStrategy}`,
        status: 'Resolved' as const
      };

      setIncidents(prev => prev.map(inc => inc.id === updatedIncident.id ? updatedIncident : inc));
      setSelectedIncident(updatedIncident);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Incidents & Risk Management</h1>
           <p className="text-slate-500 text-sm">Track accidents, safeguarding concerns, and regulatory notifications.</p>
        </div>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold shadow-sm hover:bg-red-700 flex items-center gap-2">
           <Plus size={18} /> Report Incident
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
         {/* Left: Incident List */}
         <div className={`w-full md:w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col ${selectedIncident ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-slate-100">
               <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input 
                     type="text" 
                     placeholder="Search incidents..." 
                     className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto">
               {incidents.map(inc => (
                  <div 
                     key={inc.id}
                     onClick={() => setSelectedIncident(inc)}
                     className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors
                        ${selectedIncident?.id === inc.id ? 'bg-red-50/50 border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'}
                     `}
                  >
                     <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getSeverityColor(inc.severity)}`}>
                           {inc.severity}
                        </span>
                        <span className="text-xs text-slate-400">{inc.date}</span>
                     </div>
                     <h3 className="font-bold text-slate-900 text-sm mb-1">{inc.type}</h3>
                     <p className="text-xs text-slate-500 mb-2 truncate">{inc.description}</p>
                     <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-medium text-slate-600">{inc.clientName}</span>
                        <span>•</span>
                        <span>{inc.status}</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Right: Detail View */}
         <div className={`flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col ${selectedIncident ? 'flex' : 'hidden md:flex'}`}>
            {selectedIncident ? (
               <>
                  {/* Header */}
                  <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                     <div>
                        <div className="flex items-center gap-3 mb-2">
                           <h2 className="text-xl font-bold text-slate-900">{selectedIncident.type} Incident</h2>
                           <span className={`text-xs font-bold px-2 py-1 rounded uppercase border ${getSeverityColor(selectedIncident.severity)}`}>
                              {selectedIncident.severity} Priority
                           </span>
                        </div>
                        <div className="flex gap-4 text-sm text-slate-500">
                           <span>Client: <strong className="text-slate-800">{selectedIncident.clientName}</strong></span>
                           <span>Staff: <strong className="text-slate-800">{selectedIncident.staffName}</strong></span>
                           <span>Date: <strong className="text-slate-800">{selectedIncident.date}</strong></span>
                        </div>
                     </div>
                     <button onClick={() => setSelectedIncident(null)} className="md:hidden p-2 hover:bg-slate-100 rounded-full">
                        <X size={20} />
                     </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                     <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Incident Description</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">{selectedIncident.description}</p>
                     </div>

                     {/* Investigation Section */}
                     <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                           <Microscope className="text-primary-600" size={20} /> Investigation Findings
                        </h3>
                        
                        {selectedIncident.rootCause ? (
                           <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                 <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded mb-2 inline-block">ROOT CAUSE</span>
                                 <p className="text-slate-800 text-sm font-medium">{selectedIncident.rootCause}</p>
                              </div>
                              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                 <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded mb-2 inline-block">ACTIONS TAKEN</span>
                                 <p className="text-slate-800 text-sm">{selectedIncident.actionsTaken}</p>
                              </div>
                              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                 <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded mb-2 inline-block">NOTES & STRATEGY</span>
                                 <p className="text-slate-600 text-sm">{selectedIncident.investigationNotes}</p>
                              </div>
                              
                              {selectedIncident.reportedToCQC && (
                                 <div className="flex items-center gap-2 text-red-600 text-sm font-bold bg-red-50 p-3 rounded-lg border border-red-100">
                                    <AlertTriangle size={16} />
                                    Reported to CQC/Regulator
                                 </div>
                              )}
                           </div>
                        ) : (
                           <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                              <ShieldAlert className="mx-auto text-slate-300 mb-4" size={48} />
                              <p className="text-slate-500 mb-6">Investigation pending. No root cause analysis recorded yet.</p>
                              <button 
                                 onClick={handleInvestigate}
                                 disabled={isAnalyzing}
                                 className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-lg shadow-purple-900/20 flex items-center gap-2 mx-auto disabled:opacity-70"
                              >
                                 {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                 {isAnalyzing ? 'Analyzing Evidence...' : 'AI Investigator: Analyze Root Cause'}
                              </button>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
                     <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-sm">
                        Export PDF
                     </button>
                     <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-sm">
                        Contact Family
                     </button>
                     {selectedIncident.status !== 'Closed' && (
                        <button className="px-4 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 text-sm flex items-center gap-2">
                           <CheckCircle2 size={16} /> Close Case
                        </button>
                     )}
                  </div>
               </>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <ShieldAlert size={48} className="mb-4 opacity-20" />
                  <p className="font-medium">Select an incident to view details</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default IncidentsPage;
