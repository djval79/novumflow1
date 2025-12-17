
import React, { useState } from 'react';
import { 
  FolderOpen, FileText, Image as ImageIcon, MoreHorizontal, 
  UploadCloud, Search, Filter, Sparkles, Loader2, Calendar, 
  Tag, Download, Eye, Plus, ShieldCheck, Briefcase, User
} from 'lucide-react';
import { MOCK_DOCUMENTS } from '../services/mockData';
import { StoredDocument } from '../types';
import { analyzeDocument } from '../services/geminiService';

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<StoredDocument[]>(MOCK_DOCUMENTS);
  const [selectedDoc, setSelectedDoc] = useState<StoredDocument | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Filter Logic
  const categories = ['All', 'Client Record', 'Staff HR', 'Corporate', 'Compliance'];
  const filteredDocs = documents.filter(d => activeCategory === 'All' || d.category === activeCategory);

  // Handler for Mock Upload + AI Analysis
  const handleMockUpload = async () => {
    setIsUploading(true);
    
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
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'PDF': return <FileText className="text-red-500" size={24} />;
      case 'Image': return <ImageIcon className="text-blue-500" size={24} />;
      case 'Word': return <FileText className="text-blue-700" size={24} />;
      default: return <FileText className="text-slate-400" size={24} />;
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-slate-900">Document Management</h1>
             <p className="text-slate-500 text-sm">Secure storage for contracts, compliance records, and policies.</p>
          </div>
          <button 
            onClick={handleMockUpload}
            disabled={isUploading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2 disabled:opacity-70"
          >
             {isUploading ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
             {isUploading ? 'Analyzing...' : 'Upload Document'}
          </button>
       </div>

       <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left: Folders & List */}
          <div className="w-full md:w-3/4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
             {/* Filter Bar */}
             <div className="p-4 border-b border-slate-100 flex items-center gap-4 overflow-x-auto">
                {categories.map(cat => (
                   <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                         activeCategory === cat 
                         ? 'bg-primary-50 text-primary-700 border border-primary-100' 
                         : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                      }`}
                   >
                      {cat}
                   </button>
                ))}
                <div className="ml-auto relative hidden md:block">
                   <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                   <input 
                      type="text" 
                      placeholder="Search files..." 
                      className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                   />
                </div>
             </div>

             {/* File Grid */}
             <div className="flex-1 overflow-y-auto p-6">
                {documents.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <FolderOpen size={48} className="mb-4 opacity-20"/>
                      <p>No documents found</p>
                   </div>
                ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Smart Upload Dropzone Visual */}
                      <div 
                        onClick={handleMockUpload}
                        className="border-2 border-dashed border-primary-200 bg-primary-50/30 rounded-xl p-6 flex flex-col items-center justify-center text-primary-600 cursor-pointer hover:bg-primary-50 transition-colors min-h-[160px]"
                      >
                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                            <Sparkles size={24} className="text-primary-500" />
                         </div>
                         <span className="font-bold text-sm">AI Smart Scan</span>
                         <span className="text-xs text-center mt-1 opacity-70">Auto-detects expiry dates & categories</span>
                      </div>

                      {filteredDocs.map(doc => (
                         <div 
                           key={doc.id}
                           onClick={() => setSelectedDoc(doc)}
                           className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md group relative
                              ${selectedDoc?.id === doc.id ? 'bg-primary-50 border-primary-300 ring-1 ring-primary-300' : 'bg-white border-slate-200'}
                           `}
                        >
                           <div className="flex items-start justify-between mb-3">
                              <div className="p-2 bg-slate-50 rounded-lg">{getIcon(doc.type)}</div>
                              {doc.expiryDate && (
                                 <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100 flex items-center gap-1">
                                    <Calendar size={10}/> Exp: {doc.expiryDate}
                                 </span>
                              )}
                           </div>
                           <h3 className="font-bold text-slate-900 text-sm mb-1 truncate" title={doc.name}>{doc.name}</h3>
                           <p className="text-xs text-slate-500">{doc.category} • {doc.size}</p>
                           
                           <div className="mt-3 flex gap-1 flex-wrap">
                              {doc.tags.slice(0,2).map(tag => (
                                 <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{tag}</span>
                              ))}
                           </div>
                        </div>
                      ))}
                   </div>
                )}
             </div>
          </div>

          {/* Right: Detail Panel */}
          <div className={`w-full md:w-1/4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col ${selectedDoc ? 'flex' : 'hidden md:flex'}`}>
             {selectedDoc ? (
                <>
                   <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                         {getIcon(selectedDoc.type)}
                      </div>
                      <h3 className="font-bold text-slate-900">{selectedDoc.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{selectedDoc.type} Document</p>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {/* AI Summary */}
                      {selectedDoc.summary && (
                         <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <h4 className="text-xs font-bold text-purple-700 uppercase mb-2 flex items-center gap-1"><Sparkles size={12}/> AI Summary</h4>
                            <p className="text-sm text-purple-900 leading-relaxed">{selectedDoc.summary}</p>
                         </div>
                      )}

                      {/* Metadata */}
                      <div className="space-y-4">
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-xs font-medium text-slate-500">Category</span>
                            <span className="text-sm font-bold text-slate-700">{selectedDoc.category}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-xs font-medium text-slate-500">Uploaded</span>
                            <span className="text-sm font-bold text-slate-700">{selectedDoc.uploadedDate}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                            <span className="text-xs font-medium text-slate-500">Owner</span>
                            <span className="text-sm font-bold text-slate-700">{selectedDoc.ownerName || '-'}</span>
                         </div>
                         {selectedDoc.expiryDate && (
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                               <span className="text-xs font-medium text-slate-500">Expires</span>
                               <span className="text-sm font-bold text-amber-600">{selectedDoc.expiryDate}</span>
                            </div>
                         )}
                      </div>

                      {/* Tags */}
                      <div>
                         <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Tags</h4>
                         <div className="flex flex-wrap gap-2">
                            {selectedDoc.tags.map(tag => (
                               <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full flex items-center gap-1">
                                  <Tag size={10} /> {tag}
                               </span>
                            ))}
                            <button className="px-2 py-1 border border-dashed border-slate-300 text-slate-400 text-xs rounded-full hover:border-primary-300 hover:text-primary-500">
                               + Add
                            </button>
                         </div>
                      </div>
                   </div>

                   <div className="p-4 border-t border-slate-100 flex gap-3">
                      <button className="flex-1 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 text-sm">
                         <Download size={16} /> Download
                      </button>
                      <button className="p-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50">
                         <Eye size={18} />
                      </button>
                   </div>
                </>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                   <FolderOpen size={48} className="mb-4 opacity-20" />
                   <p className="font-medium">Select a document to view details</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default Documents;
