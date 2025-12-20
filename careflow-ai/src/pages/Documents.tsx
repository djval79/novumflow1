
import React, { useState, useEffect } from 'react';
import {
   FolderOpen, FileText, Image as ImageIcon, MoreHorizontal,
   UploadCloud, Search, Filter, Sparkles, Loader2, Calendar,
   Tag, Download, Eye, Plus, ShieldCheck, Briefcase, User, Activity, History, Zap
} from 'lucide-react';
import { documentService } from '../services/supabaseService';
import { StoredDocument } from '../types';
import { analyzeDocument } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Documents: React.FC = () => {
   const { profile } = useAuth();
   const [documents, setDocuments] = useState<StoredDocument[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedDoc, setSelectedDoc] = useState<StoredDocument | null>(null);
   const [activeCategory, setActiveCategory] = useState<string>('All');
   const [isUploading, setIsUploading] = useState(false);
   const [dragActive, setDragActive] = useState(false);

   useEffect(() => {
      async function loadDocuments() {
         setLoading(true);
         try {
            const data = await documentService.getAll(profile?.tenant_id);
            if (data.length > 0) {
               const mapped = data.map((d: any) => ({
                  id: d.id,
                  name: d.title || d.name,
                  type: d.fileType || 'PDF',
                  category: d.category || 'General',
                  uploadedDate: d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : 'Unknown',
                  expiryDate: d.expiryDate || null,
                  size: '1.2 MB',
                  tags: d.tags || [],
                  summary: null,
                  ownerName: null
               }));
               setDocuments(mapped);
            } else {
               // Default demo documents
               setDocuments([
                  { id: '1', name: 'Insurance Policy Schedule', type: 'PDF', category: 'Compliance', uploadedDate: '2024-12-01', expiryDate: '2025-12-31', size: '2.1 MB', tags: ['Insurance', 'Legal'], summary: null, ownerName: 'Admin' },
                  { id: '2', name: 'Staff Handbook', type: 'PDF', category: 'Staff HR', uploadedDate: '2024-11-15', expiryDate: null, size: '5.4 MB', tags: ['HR', 'Policy'], summary: null, ownerName: 'HR' },
                  { id: '3', name: 'CQC Registration', type: 'PDF', category: 'Compliance', uploadedDate: '2024-10-20', expiryDate: '2025-10-20', size: '1.1 MB', tags: ['CQC', 'Compliance'], summary: null, ownerName: 'Manager' }
               ]);
            }
         } catch (error) {
            toast.error('Document cloud sync failure');
            setDocuments([]);
         } finally {
            setLoading(false);
         }
      }
      loadDocuments();
   }, [profile?.tenant_id]);

   // Filter Logic
   const categories = ['All', 'Client Record', 'Staff HR', 'Corporate', 'Compliance'];
   const filteredDocs = documents.filter(d => activeCategory === 'All' || d.category === activeCategory);

   // Handler for Mock Upload + AI Analysis
   const handleMockUpload = async () => {
      setIsUploading(true);
      const uploadToast = toast.loading('Initializing neural document scan...');

      // Simulate a file being uploaded
      const mockFileName = "Policy Schedule - Liability.pdf";
      const mockContent = "INSURANCE POLICY SCHEDULE. Type: Employers Liability. Expiring: 2025-12-31. Limit: £10,000,000. Policy Number: CF/992/22.";

      try {
         const analysis = await analyzeDocument(mockContent, mockFileName);
         const newDoc: StoredDocument = {
            id: `d${Date.now()}`,
            name: mockFileName,
            type: 'PDF',
            category: analysis.suggestedCategory as any,
            uploadedDate: new Date().toISOString().split('T')[0],
            expiryDate: analysis.detectedExpiryDate,
            size: '1.5 MB',
            tags: analysis.suggestedTags,
            summary: analysis.summary
         };

         setDocuments([newDoc, ...documents]);
         setSelectedDoc(newDoc);
         toast.success('Document Indexed & Analyzed', { id: uploadToast });
      } catch (error) {
         toast.error('Neural Analysis Error', { id: uploadToast });
      } finally {
         setIsUploading(false);
      }
   };

   const getIcon = (type: string) => {
      switch (type) {
         case 'PDF': return <FileText className="text-rose-500" size={28} />;
         case 'Image': return <ImageIcon className="text-sky-500" size={28} />;
         default: return <FileText className="text-slate-400" size={28} />;
      }
   };

   return (
      <div className="h-[calc(100vh-6.5rem)] max-w-7xl mx-auto flex flex-col space-y-10 animate-in fade-in duration-700 pb-10">
         <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-3">
               <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Data <span className="text-primary-600">Vault</span></h1>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">Secure Clinical Repository & Automated Compliance Indexing</p>
            </div>
            <button
               onClick={handleMockUpload}
               disabled={isUploading}
               className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-black transition-all flex items-center gap-4 active:scale-95 disabled:opacity-50"
            >
               {isUploading ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
               {isUploading ? 'Computing...' : 'Upload Asset'}
            </button>
         </div>

         <div className="flex-1 flex gap-10 overflow-hidden">
            {/* Left: Interactive File Grid */}
            <div className="w-full md:w-3/4 bg-white rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full blur-3xl -mr-32 -mt-32" />

               {/* Filter Terminal */}
               <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row items-center gap-8 bg-slate-50/20 relative z-10">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 sm:pb-0">
                     {categories.map(cat => (
                        <button
                           key={cat}
                           onClick={() => {
                              setActiveCategory(cat);
                              toast.info(`Filtering document stream: ${cat}`);
                           }}
                           className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                              ${activeCategory === cat
                                 ? 'bg-slate-900 text-white shadow-xl scale-105'
                                 : 'text-slate-400 hover:text-slate-900 hover:bg-white'
                              }`}
                        >
                           {cat}
                        </button>
                     ))}
                  </div>
                  <div className="sm:ml-auto relative w-full sm:w-72">
                     <Search className="absolute left-5 top-4.5 text-slate-300" size={18} />
                     <input
                        type="text"
                        placeholder="Search Registry..."
                        className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-primary-500/10 placeholder:text-slate-200 shadow-sm transition-all"
                     />
                  </div>
               </div>

               {/* Asset Matrix */}
               <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
                  {documents.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full text-center gap-6">
                        <FolderOpen size={64} className="text-slate-100" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Null Document Buffer</p>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* AI Neural Scan Dropzone */}
                        <div
                           onClick={handleMockUpload}
                           className="border-4 border-dashed border-slate-100 bg-slate-50/30 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-primary-600 cursor-pointer hover:border-primary-100 hover:bg-white hover:shadow-2xl transition-all min-h-[220px] group mb-4"
                        >
                           <div className="w-16 h-16 bg-white rounded-[1.75rem] flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform">
                              <Sparkles size={28} className="text-primary-600" />
                           </div>
                           <span className="font-black uppercase tracking-[0.3em] text-[10px]">Neural Smart Scan</span>
                           <span className="text-[8px] font-black text-slate-400 text-center mt-3 uppercase tracking-widest opacity-70">Automated Compliance Vectoring</span>
                        </div>

                        {filteredDocs.map(doc => (
                           <div
                              key={doc.id}
                              onClick={() => {
                                 setSelectedDoc(doc);
                                 toast.info(`Retrieving asset dossier: ${doc.name}`);
                              }}
                              className={`p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all hover:shadow-2xl hover:scale-[1.02] group relative
                              ${selectedDoc?.id === doc.id ? 'bg-primary-50/20 border-primary-500 shadow-xl' : 'bg-white border-slate-50 hover:border-primary-100'}
                           `}
                           >
                              <div className="flex items-start justify-between mb-8">
                                 <div className={`p-4 rounded-2xl transition-all shadow-inner ${selectedDoc?.id === doc.id ? 'bg-primary-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
                                    {getIcon(doc.type)}
                                 </div>
                                 {doc.expiryDate && (
                                    <span className="text-[8px] font-black bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl border border-rose-100 flex items-center gap-2 shadow-sm animate-pulse">
                                       <Calendar size={12} /> Exp: {doc.expiryDate}
                                    </span>
                                 )}
                              </div>
                              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight mb-2 truncate" title={doc.name}>{doc.name}</h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{doc.category} • {doc.size}</p>

                              <div className="mt-6 flex gap-2 flex-wrap">
                                 {doc.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="text-[8px] font-black bg-slate-50 text-slate-500 px-3 py-1.5 rounded-xl border border-slate-100 uppercase tracking-[0.2em]">{tag}</span>
                                 ))}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>

            {/* Right: Asset Intelligence Panel */}
            <div className={`w-full md:w-1/4 bg-slate-900 rounded-[4rem] shadow-2xl flex flex-col relative overflow-hidden ${selectedDoc ? 'flex' : 'hidden md:flex'}`}>
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -mr-32 -mt-32" />

               {selectedDoc ? (
                  <>
                     <div className="p-10 border-b border-white/5 bg-white/5 flex flex-col items-center text-center relative z-10">
                        <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center mb-6 transform group-hover:rotate-6 transition-transform">
                           {getIcon(selectedDoc.type)}
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight mb-2">{selectedDoc.name}</h3>
                        <p className="text-[9px] font-black text-primary-400 uppercase tracking-[0.4em]">{selectedDoc.type} ARCHIVE UNIT</p>
                     </div>

                     <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide relative z-10">
                        {/* AI Summary Module */}
                        {selectedDoc.summary && (
                           <div className="bg-primary-600/20 p-8 rounded-[2.5rem] border border-primary-500/30 shadow-2xl group/summary">
                              <h4 className="text-[10px] font-black text-primary-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
                                 <Zap size={18} className="text-primary-400" />
                                 Neural Synopsis
                              </h4>
                              <p className="text-xs font-bold text-white leading-relaxed opacity-90 italic">"{selectedDoc.summary}"</p>
                           </div>
                        )}

                        {/* Metadata Tier */}
                        <div className="space-y-4">
                           {[
                              { label: 'Logistic Tier', val: selectedDoc.category },
                              { label: 'Register Date', val: selectedDoc.uploadedDate },
                              { label: 'Verified Owner', val: selectedDoc.ownerName || 'PROTOCOL' },
                              { label: 'Expiry Epoch', val: selectedDoc.expiryDate || 'PERMANENT', color: selectedDoc.expiryDate ? 'rose-400' : 'slate-500' }
                           ].map((item, i) => (
                              <div key={i} className="flex justify-between items-center py-4 border-b border-white/5">
                                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                                 <span className={`text-[10px] font-black uppercase tracking-tight ${item.color ? `text-${item.color}` : 'text-white'}`}>{item.val}</span>
                              </div>
                           ))}
                        </div>

                        {/* Tag Matrix */}
                        <div>
                           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Semantic Tags</h4>
                           <div className="flex flex-wrap gap-3">
                              {selectedDoc.tags.map(tag => (
                                 <span key={tag} className="px-5 py-2 bg-white/5 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 border border-white/10 hover:bg-white/10 transition-colors">
                                    <Tag size={12} className="text-primary-500" /> {tag}
                                 </span>
                              ))}
                              <button className="px-5 py-2 border-2 border-dashed border-white/10 text-slate-600 text-[8px] font-black uppercase tracking-widest rounded-xl hover:border-primary-500 hover:text-white transition-all">
                                 + Append Metadata
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="p-10 border-t border-white/5 bg-white/5 flex gap-4">
                        <button
                           onClick={() => toast.success('Initializing local archive download')}
                           className="flex-1 py-5 bg-white text-slate-900 font-black uppercase tracking-widest rounded-2xl hover:bg-primary-600 hover:text-white transition-all flex items-center justify-center gap-3 text-[10px] shadow-2xl active:scale-95"
                        >
                           <Download size={18} /> Fetch Asset
                        </button>
                        <button
                           onClick={() => toast.info('Loading full-resolution preview interface')}
                           className="p-5 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all border border-white/10 active:scale-95 shadow-xl"
                        >
                           <Eye size={22} />
                        </button>
                     </div>
                  </>
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-6 animate-in fade-in duration-1000">
                     <div className="p-8 bg-white/5 rounded-[2rem] shadow-inner mb-4">
                        <Activity size={48} className="text-slate-800" />
                     </div>
                     <h3 className="text-lg font-black text-slate-700 uppercase tracking-tighter">Null Asset Selection</h3>
                     <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] max-w-[180px] leading-relaxed">Select an active repository node to initiate neural auditing and detail verification.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default Documents;
