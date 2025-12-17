
import React, { useState } from 'react';
import { 
  Box, Search, Plus, Wrench, AlertTriangle, CheckCircle2, 
  User, Calendar, Sparkles, Loader2, Tablet, Activity, Lock 
} from 'lucide-react';
import { MOCK_ASSETS } from '../services/mockData';
import { Asset, AssetAnalysis } from '../types';
import { predictAssetMaintenance } from '../services/geminiService';

const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [analysis, setAnalysis] = useState<AssetAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async (asset: Asset) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await predictAssetMaintenance(asset.name, asset.type, asset.purchaseDate);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAssetIcon = (type: string) => {
    switch(type) {
      case 'IT': return <Tablet size={20} className="text-blue-600"/>;
      case 'Mobility': return <Activity size={20} className="text-green-600"/>;
      case 'Safety': return <Lock size={20} className="text-amber-600"/>;
      default: return <Box size={20} className="text-slate-600"/>;
    }
  };

  const calculateTotalValue = () => assets.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-slate-900">Equipment & Assets</h1>
             <p className="text-slate-500 text-sm">Track inventory, assignments, and safety inspections (LOLER).</p>
          </div>
          <div className="flex gap-3">
             <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-sm">
                <span className="text-slate-500 mr-2">Total Asset Value:</span>
                <span className="font-bold text-slate-900">£{calculateTotalValue().toLocaleString()}</span>
             </div>
             <button className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2">
                <Plus size={18} /> Add Asset
             </button>
          </div>
       </div>

       <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left: Asset List */}
          <div className="w-full md:w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
             <div className="p-4 border-b border-slate-100">
                <div className="relative">
                   <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <input 
                      type="text" 
                      placeholder="Search equipment..." 
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                   />
                </div>
             </div>
             <div className="flex-1 overflow-y-auto">
                {assets.map(asset => (
                   <div 
                      key={asset.id}
                      onClick={() => { setSelectedAsset(asset); setAnalysis(null); }}
                      className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors group
                         ${selectedAsset?.id === asset.id ? 'bg-primary-50/50 border-l-4 border-l-primary-500' : 'border-l-4 border-l-transparent'}
                      `}
                   >
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                               {getAssetIcon(asset.type)}
                            </div>
                            <div>
                               <h3 className="font-bold text-slate-900 text-sm">{asset.name}</h3>
                               <p className="text-xs text-slate-500">S/N: {asset.serialNumber}</p>
                            </div>
                         </div>
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase 
                            ${asset.status === 'Active' ? 'bg-green-100 text-green-700' : 
                              asset.status === 'Repair' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}
                         `}>
                            {asset.status}
                         </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                         <span className="flex items-center gap-1"><User size={12}/> {asset.assignedTo}</span>
                         {asset.nextInspectionDate && (
                            <span className="flex items-center gap-1 font-medium text-amber-600"><Calendar size={12}/> Due: {asset.nextInspectionDate}</span>
                         )}
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Right: Detail Panel */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
             {selectedAsset ? (
                <>
                   <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 rounded-t-xl">
                      <div>
                         <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedAsset.name}</h2>
                         <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">{selectedAsset.type}</span>
                            <span>Value: £{selectedAsset.value}</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {/* Assignment Card */}
                      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex justify-between items-center">
                         <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Assigned To</p>
                            <div className="flex items-center gap-2">
                               <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xs">
                                  {selectedAsset.assignedTo.charAt(0)}
                               </div>
                               <div>
                                  <p className="font-bold text-slate-900 text-sm">{selectedAsset.assignedTo}</p>
                                  <p className="text-xs text-slate-500">{selectedAsset.assignedType}</p>
                               </div>
                            </div>
                         </div>
                         <button className="text-primary-600 text-xs font-bold hover:underline">Reassign</button>
                      </div>

                      {/* AI Maintenance Section */}
                      <div className="bg-gradient-to-br from-blue-50 to-white p-6 border border-blue-100 rounded-xl shadow-sm">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-blue-900 flex items-center gap-2"><Sparkles size={18}/> AI Maintenance Predictor</h3>
                            {!analysis && (
                               <button 
                                  onClick={() => handleAnalyze(selectedAsset)}
                                  disabled={isAnalyzing}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                               >
                                  {isAnalyzing ? <Loader2 className="animate-spin" size={14}/> : <Wrench size={14}/>}
                                  Analyze Condition
                               </button>
                            )}
                         </div>

                         {analysis ? (
                            <div className="space-y-4 animate-in fade-in">
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                                     <p className="text-xs text-slate-500 uppercase font-bold">Rec. Interval</p>
                                     <p className="font-bold text-slate-900">{analysis.recommendedMaintenanceInterval}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                                     <p className="text-xs text-slate-500 uppercase font-bold">Predicted EOL</p>
                                     <p className="font-bold text-slate-900">{analysis.predictedEndOfLife}</p>
                                  </div>
                               </div>

                               <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                  <p className="text-xs font-bold text-amber-700 uppercase mb-2 flex items-center gap-1"><AlertTriangle size={12}/> Failure Risks</p>
                                  <ul className="text-sm text-amber-900 list-disc list-inside">
                                     {analysis.riskFactors.map((r, i) => <li key={i}>{r}</li>)}
                                  </ul>
                               </div>

                               <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                  <p className="text-xs font-bold text-green-700 uppercase mb-2 flex items-center gap-1"><CheckCircle2 size={12}/> Maintenance Tips</p>
                                  <ul className="text-sm text-green-900 list-disc list-inside">
                                     {analysis.maintenanceTips.map((t, i) => <li key={i}>{t}</li>)}
                                  </ul>
                               </div>
                            </div>
                         ) : (
                            <div className="text-center py-6 text-blue-300">
                               <p className="text-sm">Run analysis to see maintenance recommendations and failure predictions.</p>
                            </div>
                         )}
                      </div>

                      {/* Technical Details */}
                      <div className="grid grid-cols-2 gap-6">
                         <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Purchased</p>
                            <p className="text-sm font-bold text-slate-700">{selectedAsset.purchaseDate}</p>
                         </div>
                         <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Next Inspection</p>
                            <p className="text-sm font-bold text-slate-700">{selectedAsset.nextInspectionDate || 'N/A'}</p>
                         </div>
                      </div>
                   </div>
                </>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                   <Box size={48} className="mb-4 opacity-20" />
                   <p>Select an asset to manage details</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default Assets;