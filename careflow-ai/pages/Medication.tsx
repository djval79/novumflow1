
import React, { useState, useEffect } from 'react';
import { Pill, Plus, AlertTriangle, CheckCircle2, XCircle, Sparkles, Loader2, AlertOctagon, History, User as UserIcon } from 'lucide-react';
import { medicationService, clientService } from '../services/supabaseService';
import { analyzeMedicationSafety } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { Medication, MarRecord, Client } from '../types';
import { format } from 'date-fns';

// Helper icon for empty state
const ShieldCheckIcon = ({ size, className }: { size: number, className?: string }) => (
   <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
   >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
   </svg>
);

const MedicationPage: React.FC = () => {
   const { user } = useAuth();
   const { currentTenant } = useTenant(); // Get current tenant
   const [activeTab, setActiveTab] = useState<'emar' | 'stock' | 'safety'>('emar');

   // Data State
   const [clients, setClients] = useState<Client[]>([]);
   const [selectedClientId, setSelectedClientId] = useState<string>('');
   const [medications, setMedications] = useState<Medication[]>([]);
   const [marRecords, setMarRecords] = useState<MarRecord[]>([]);

   // UI State
   const [loading, setLoading] = useState(true);
   const [safetyReport, setSafetyReport] = useState<string | null>(null);
   const [isChecking, setIsChecking] = useState(false);
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);

   // Load Clients on Mount
   useEffect(() => {
      if (currentTenant) {
         loadClients();
      }
   }, [currentTenant]);

   // Load Meds when Client Selected
   useEffect(() => {
      if (selectedClientId) {
         loadMedicationData();
      }
   }, [selectedClientId]);

   const loadClients = async () => {
      if (!currentTenant) return;

      try {
         // Create a timeout promise
         const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Client load timed out')), 5000)
         );

         // Use getByTenant (RPC) instead of getAll
         const data = await Promise.race([
            clientService.getByTenant(currentTenant.id),
            timeoutPromise
         ]) as Client[];

         setClients(data);
         if (data.length > 0) setSelectedClientId(data[0].id);
      } catch (error) {
         console.error('Error loading clients:', error);
      } finally {
         setLoading(false);
      }
   };

   const loadMedicationData = async () => {
      setLoading(true);
      try {
         // Create a timeout promise
         const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), 5000)
         );

         const [medsData, marData] = await Promise.race([
            Promise.all([
               medicationService.getByClient(selectedClientId),
               medicationService.getMar(selectedClientId, format(new Date(), 'yyyy-MM-dd'))
            ]),
            timeoutPromise
         ]) as [Medication[], MarRecord[]];

         setMedications(medsData);
         setMarRecords(marData);
      } catch (error) {
         console.error('Error loading meds:', error);
         // Optional: Show error toast here
      } finally {
         setLoading(false);
      }
   };

   const handleSignMar = async (medId: string, timeSlot: string, status: 'Taken' | 'Refused' | 'Missed') => {
      if (!user) return;
      try {
         await medicationService.signMar({
            clientId: selectedClientId,
            medicationId: medId,
            date: format(new Date(), 'yyyy-MM-dd'),
            timeSlot,
            status,
            staffId: user.id, // Assuming user.id maps to staff table for now
            note: status === 'Refused' ? 'Refused by client' : ''
         });
         loadMedicationData(); // Refresh
      } catch (error) {
         console.error('Error signing MAR:', error);
         alert('Failed to sign record');
      }
   };

   const handleAddMedication = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      try {
         await medicationService.create({
            clientId: selectedClientId,
            name: formData.get('name'),
            dosage: formData.get('dosage'),
            frequency: formData.get('frequency'),
            route: formData.get('route'),
            startDate: formData.get('startDate'),
            instructions: formData.get('instructions'),
            stockLevel: parseInt(formData.get('stockLevel') as string) || 0
         });
         setIsAddModalOpen(false);
         loadMedicationData();
      } catch (error) {
         console.error('Error creating med:', error);
         alert('Failed to add medication');
      }
   };

   // Helper for client context
   const selectedClient = clients.find(c => c.id === selectedClientId);
   const clientCondition = "Type 2 Diabetes, High Blood Pressure, Early Dementia"; // Placeholder until we have conditions in DB

   // Handlers
   const handleSafetyCheck = async () => {
      setIsChecking(true);
      try {
         const report = await analyzeMedicationSafety(medications, clientCondition);
         setSafetyReport(report);
      } catch (error) {
         console.error(error);
      } finally {
         setIsChecking(false);
      }
   };

   const getMarStatusColor = (status: string) => {
      switch (status) {
         case 'Taken': return 'bg-green-100 text-green-700 border-green-200';
         case 'Refused': return 'bg-red-100 text-red-700 border-red-200';
         case 'Missed': return 'bg-amber-100 text-amber-700 border-amber-200';
         default: return 'bg-slate-100 text-slate-400';
      }
   };

   const renderEMAR = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Pill size={18} className="text-primary-600" /> Administration Record (Today)
               </h3>
               <div className="flex items-center gap-2">
                  <UserIcon size={16} className="text-slate-400" />
                  <select
                     value={selectedClientId}
                     onChange={(e) => setSelectedClientId(e.target.value)}
                     className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2"
                  >
                     {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                     ))}
                  </select>
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                     <tr>
                        <th className="px-6 py-3 font-medium">Medication</th>
                        <th className="px-6 py-3 font-medium text-center">Morning</th>
                        <th className="px-6 py-3 font-medium text-center">Lunch</th>
                        <th className="px-6 py-3 font-medium text-center">Tea</th>
                        <th className="px-6 py-3 font-medium text-center">Bed</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {medications.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-slate-400">No medications found for this client.</td></tr>
                     ) : medications.map(med => {
                        const morningRec = marRecords.find(r => r.medicationId === med.id && r.timeSlot === 'Morning');
                        const lunchRec = marRecords.find(r => r.medicationId === med.id && r.timeSlot === 'Lunch');
                        const teaRec = marRecords.find(r => r.medicationId === med.id && r.timeSlot === 'Tea');
                        const bedRec = marRecords.find(r => r.medicationId === med.id && r.timeSlot === 'Bed');

                        const renderSlot = (slotName: string, record?: MarRecord) => {
                           if (!med.frequency.toLowerCase().includes(slotName.toLowerCase()) && med.frequency !== 'OD') {
                              return <span className="text-slate-300">-</span>;
                           }

                           if (record) {
                              return (
                                 <div className={`inline-flex flex-col items-center px-3 py-1 rounded-lg border ${getMarStatusColor(record.status)}`}>
                                    <span className="font-bold text-xs uppercase">{record.status}</span>
                                    <span className="text-[10px] opacity-80">{record.administeredBy?.split(' ')[0]}</span>
                                 </div>
                              );
                           }

                           return (
                              <button
                                 onClick={() => handleSignMar(med.id, slotName, 'Taken')}
                                 className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-500 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors text-xs font-bold"
                              >
                                 Sign
                              </button>
                           );
                        };

                        return (
                           <tr key={med.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4">
                                 <div className="font-bold text-slate-900">{med.name}</div>
                                 <div className="text-xs text-slate-500">{med.dosage} • {med.route}</div>
                                 <div className="text-xs text-primary-600 mt-1">{med.instructions}</div>
                              </td>
                              <td className="px-6 py-4 text-center">{renderSlot('Morning', morningRec)}</td>
                              <td className="px-6 py-4 text-center">{renderSlot('Lunch', lunchRec)}</td>
                              <td className="px-6 py-4 text-center">{renderSlot('Tea', teaRec)}</td>
                              <td className="px-6 py-4 text-center">{renderSlot('Bed', bedRec)}</td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>

         <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
               <h4 className="font-bold text-amber-900 text-sm">Important Note</h4>
               <p className="text-sm text-amber-800">
                  Refusal of medication must be documented with a reason code. 3 consecutive refusals trigger an automatic alert to the GP.
               </p>
            </div>
         </div>
      </div>
   );

   const renderStock = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
         {medications.map(med => {
            const percentage = (med.stockLevel / med.totalStock) * 100;
            const isLow = percentage < 25;

            return (
               <div key={med.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isLow ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                           <Pill size={24} />
                        </div>
                        <div>
                           <h3 className="font-bold text-slate-900">{med.name}</h3>
                           <p className="text-xs text-slate-500">{med.dosage}</p>
                        </div>
                     </div>
                     {isLow && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded border border-red-200">Low Stock</span>
                     )}
                  </div>

                  <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Remaining</span>
                        <span className="font-bold text-slate-800">{med.stockLevel} / {med.totalStock}</span>
                     </div>
                     <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                           className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-red-500' : 'bg-primary-500'}`}
                           style={{ width: `${percentage}%` }}
                        />
                     </div>
                  </div>

                  <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
                     <button className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold">Audit Count</button>
                     <button className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold">Request Refill</button>
                  </div>
               </div>
            );
         })}
         <div
            onClick={() => setIsAddModalOpen(true)}
            className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-primary-300 hover:text-primary-600 transition-all cursor-pointer min-h-[200px]"
         >
            <Plus size={32} className="mb-2" />
            <span className="font-bold">Add New Medication</span>
         </div>
      </div>
   );

   const renderSafety = () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
         <div className="lg:col-span-1 space-y-6">
            <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
               <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2"><Sparkles size={18} /> AI Pharmacist</h3>
               <p className="text-sm text-purple-800 mb-4">
                  Check current medication list against patient conditions (Diabetes, High BP) for potential interactions.
               </p>
               <button
                  onClick={handleSafetyCheck}
                  disabled={isChecking}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold shadow-md hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
               >
                  {isChecking ? <Loader2 className="animate-spin" size={18} /> : <AlertOctagon size={18} />}
                  {isChecking ? 'Analyzing...' : 'Run Safety Check'}
               </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <h4 className="font-bold text-slate-800 mb-3">Active Allergies</h4>
               <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-sm font-bold">Penicillin</span>
                  <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-sm font-bold">Latex</span>
               </div>
            </div>
         </div>

         <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[400px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
               <h3 className="font-bold text-slate-800">Interaction Report</h3>
            </div>
            <div className="p-8 flex-1 bg-slate-50/30">
               {safetyReport ? (
                  <div className="prose prose-slate max-w-none">
                     <div className="flex items-center gap-2 mb-4 text-green-700 font-bold">
                        <CheckCircle2 size={20} /> Analysis Complete
                     </div>
                     <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        {safetyReport}
                     </pre>
                  </div>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                     <ShieldCheckIcon size={48} className="mb-4 opacity-20" />
                     <p>No safety report generated yet.</p>
                     <p className="text-xs mt-2">Click 'Run Safety Check' to analyze.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Medication & eMAR</h1>
            <p className="text-slate-500 text-sm">Manage prescriptions, track administration, and ensure safety.</p>
         </div>

         <div className="flex p-1 bg-slate-200 rounded-xl w-fit overflow-x-auto">
            {[
               { id: 'emar', label: 'eMAR Chart', icon: History },
               { id: 'stock', label: 'Stock & Inventory', icon: Pill },
               { id: 'safety', label: 'Safety Check', icon: AlertOctagon },
            ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                     }`}
               >
                  <tab.icon size={16} /> {tab.label}
               </button>
            ))}
         </div>

         {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600" /></div>
         ) : (
            <>
               {activeTab === 'emar' && renderEMAR()}
               {activeTab === 'stock' && renderStock()}
               {activeTab === 'safety' && renderSafety()}
            </>
         )}

         {/* Add Medication Modal */}
         {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                     <h3 className="font-bold text-lg text-slate-800">Add New Medication</h3>
                     <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
                        <XCircle size={20} />
                     </button>
                  </div>
                  <form onSubmit={handleAddMedication} className="p-6 space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Medication Name</label>
                        <input name="name" required type="text" className="w-full p-2 border border-slate-300 rounded-lg" placeholder="e.g. Metformin" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Dosage</label>
                           <input name="dosage" required type="text" className="w-full p-2 border border-slate-300 rounded-lg" placeholder="500mg" />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Route</label>
                           <select name="route" className="w-full p-2 border border-slate-300 rounded-lg">
                              <option>Oral</option>
                              <option>Topical</option>
                              <option>Injection</option>
                              <option>Inhaler</option>
                           </select>
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                        <input name="frequency" required type="text" className="w-full p-2 border border-slate-300 rounded-lg" placeholder="e.g. Morning, Evening" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Instructions</label>
                        <textarea name="instructions" className="w-full p-2 border border-slate-300 rounded-lg" placeholder="Take with food..." />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                           <input name="startDate" type="date" required className="w-full p-2 border border-slate-300 rounded-lg" />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
                           <input name="stockLevel" type="number" className="w-full p-2 border border-slate-300 rounded-lg" defaultValue="28" />
                        </div>
                     </div>
                     <button className="w-full py-3 bg-primary-600 text-white font-bold rounded-lg mt-2 hover:bg-primary-700">
                        Add Medication
                     </button>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default MedicationPage;
