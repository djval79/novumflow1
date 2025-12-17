
import React, { useState } from 'react';
import { 
  PhoneIncoming, User, Calendar, Clock, PoundSterling, 
  ArrowRight, Sparkles, Loader2, CheckCircle2, X, 
  MoreHorizontal, Phone, Mail, AlertCircle 
} from 'lucide-react';
import { MOCK_ENQUIRIES } from '../services/mockData';
import { Enquiry, EnquiryStatus, EnquiryAnalysis } from '../types';
import { analyzeEnquiry } from '../services/geminiService';

const CRM: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>(MOCK_ENQUIRIES);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [analysis, setAnalysis] = useState<EnquiryAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handlers
  const updateStatus = (id: string, status: EnquiryStatus) => {
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  const handleAnalyze = async (enquiry: Enquiry) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await analyzeEnquiry(enquiry.initialNotes);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status: EnquiryStatus) => {
    switch(status) {
      case 'New': return 'bg-blue-100 text-blue-700';
      case 'Contacted': return 'bg-purple-100 text-purple-700';
      case 'Assessment': return 'bg-amber-100 text-amber-700';
      case 'Quote': return 'bg-cyan-100 text-cyan-700';
      case 'Won': return 'bg-green-100 text-green-700';
      case 'Lost': return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const renderPipelineList = () => (
    <div className="flex-1 overflow-y-auto">
       {enquiries.map(enq => (
         <div 
           key={enq.id}
           onClick={() => { setSelectedEnquiry(enq); setAnalysis(null); }}
           className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors group
             ${selectedEnquiry?.id === enq.id ? 'bg-primary-50/50 border-l-4 border-l-primary-500' : 'border-l-4 border-l-transparent'}
           `}
         >
            <div className="flex justify-between items-start mb-2">
               <div>
                  <h3 className="font-bold text-slate-900 text-sm">{enq.prospectName}</h3>
                  <p className="text-xs text-slate-500">via {enq.contactName}</p>
               </div>
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getStatusColor(enq.status)}`}>
                  {enq.status}
               </span>
            </div>
            <p className="text-xs text-slate-500 mb-2 line-clamp-2 group-hover:text-slate-700">{enq.initialNotes}</p>
            <div className="flex items-center gap-4 text-xs text-slate-400">
               <span className="flex items-center gap-1"><Calendar size={12}/> {enq.receivedDate}</span>
               {enq.estimatedValue && (
                  <span className="flex items-center gap-1 font-medium text-green-600"><PoundSterling size={12}/> £{enq.estimatedValue}/wk</span>
               )}
            </div>
         </div>
       ))}
    </div>
  );

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-slate-900">Client Intake & CRM</h1>
             <p className="text-slate-500 text-sm">Manage new care enquiries and convert leads.</p>
          </div>
          <div className="flex gap-3">
             <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-sm">
                <span className="text-slate-500 mr-2">Pipeline Value:</span>
                <span className="font-bold text-green-600">£1,650/wk</span>
             </div>
             <button className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2">
                <PhoneIncoming size={18} /> New Enquiry
             </button>
          </div>
       </div>

       <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left: List */}
          <div className="w-full md:w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
             <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Active Enquiries ({enquiries.length})</h3>
             </div>
             {renderPipelineList()}
          </div>

          {/* Right: Detail */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
             {selectedEnquiry ? (
                <>
                   <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 rounded-t-xl">
                      <div>
                         <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedEnquiry.prospectName}</h2>
                         <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1"><User size={14}/> Contact: {selectedEnquiry.contactName}</span>
                            <span className="flex items-center gap-1"><Phone size={14}/> {selectedEnquiry.contactPhone}</span>
                         </div>
                      </div>
                      <button onClick={() => setSelectedEnquiry(null)} className="md:hidden p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                   </div>

                   <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {/* Notes Box */}
                      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                         <h3 className="text-sm font-bold text-slate-700 mb-2">Enquiry Notes</h3>
                         <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedEnquiry.initialNotes}</p>
                      </div>

                      {/* AI Analysis Section */}
                      <div className="bg-gradient-to-br from-purple-50 to-white p-6 border border-purple-100 rounded-xl shadow-sm">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-purple-900 flex items-center gap-2"><Sparkles size={18}/> AI Intake Assistant</h3>
                            {!analysis && (
                               <button 
                                  onClick={() => handleAnalyze(selectedEnquiry)}
                                  disabled={isAnalyzing}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
                               >
                                  {isAnalyzing ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>}
                                  Analyze Lead
                               </button>
                            )}
                         </div>

                         {analysis ? (
                            <div className="space-y-4 animate-in fade-in">
                               <p className="text-sm text-purple-900 font-medium italic">"{analysis.summary}"</p>
                               
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-white p-3 rounded-lg border border-purple-100">
                                     <p className="text-xs text-slate-500 uppercase font-bold">Suggested Care Level</p>
                                     <p className="font-bold text-slate-900">{analysis.careLevel}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg border border-purple-100">
                                     <p className="text-xs text-slate-500 uppercase font-bold">Estimated Hours</p>
                                     <p className="font-bold text-slate-900">{analysis.estimatedHours} hrs/wk</p>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg border border-purple-100">
                                     <p className="text-xs text-slate-500 uppercase font-bold">Urgency</p>
                                     <p className={`font-bold ${analysis.urgency === 'High' ? 'text-red-600' : 'text-slate-900'}`}>{analysis.urgency}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg border border-purple-100">
                                     <p className="text-xs text-slate-500 uppercase font-bold">Funding</p>
                                     <p className="font-bold text-slate-900">{analysis.fundingSource}</p>
                                  </div>
                               </div>

                               <div className="flex items-start gap-2 bg-white p-3 rounded-lg border border-purple-100 text-sm text-purple-800">
                                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-purple-600" />
                                  <span><strong>Recommendation:</strong> {analysis.suggestedAction}</span>
                               </div>
                            </div>
                         ) : (
                            <div className="text-center py-8 text-purple-300">
                               <p className="text-sm">Click analyze to estimate hours, funding source, and urgency automatically.</p>
                            </div>
                         )}
                      </div>

                      {/* Pipeline Actions */}
                      <div>
                         <h3 className="text-sm font-bold text-slate-700 mb-3">Pipeline Stage</h3>
                         <div className="flex bg-slate-100 rounded-lg p-1">
                            {['New', 'Contacted', 'Assessment', 'Quote', 'Won', 'Lost'].map((stage) => (
                               <button
                                  key={stage}
                                  onClick={() => updateStatus(selectedEnquiry.id, stage as EnquiryStatus)}
                                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                                     selectedEnquiry.status === stage 
                                     ? 'bg-white text-primary-700 shadow-sm' 
                                     : 'text-slate-500 hover:text-slate-700'
                                  }`}
                               >
                                  {stage}
                               </button>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
                      <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-sm">
                         Send Email
                      </button>
                      <button className="px-4 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 text-sm flex items-center gap-2">
                         <Calendar size={16} /> Book Assessment
                      </button>
                   </div>
                </>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                   <PhoneIncoming size={48} className="mb-4 opacity-20" />
                   <p>Select an enquiry to view details and analyze needs.</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default CRM;
