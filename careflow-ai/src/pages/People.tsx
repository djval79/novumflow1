
import React, { useState, useEffect } from 'react';
import {
   Search, Filter, Download, UserPlus, Phone, Mail, MapPin,
   Calendar, ShieldCheck, AlertTriangle, X, CheckCircle2,
   FileText, ChevronRight, ArrowLeft, BadgePoundSterling, Pill,
   Users, Zap, Target, History, Globe, User, Activity, Brain
} from 'lucide-react';
import { StaffMember, Client, ComplianceRecord } from '../types';
import { clientService, staffService } from '../services/supabaseService';
import CarePlanManager from '../components/CarePlanManager';
import MedicationManager from '../components/MedicationManager';
import { PeopleListSkeleton } from '../components/Skeleton';
import { useTenant } from '../context/TenantContext';
import { toast } from 'sonner';

const People: React.FC = () => {
   const [activeTab, setActiveTab] = useState<'staff' | 'clients'>('staff');
   const [selectedId, setSelectedId] = useState<string | null>(null);
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [isCarePlanOpen, setIsCarePlanOpen] = useState(false);
   const [isMedicationOpen, setIsMedicationOpen] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');

   const [clients, setClients] = useState<Client[]>([]);
   const [staffList, setStaffList] = useState<StaffMember[]>([]);
   const [loading, setLoading] = useState(true);
   const { currentTenant } = useTenant();

   useEffect(() => {
      const fetchData = async () => {
         const loadToast = toast.loading('Synchronizing Entity Matrix...');
         try {
            const [clientsData, staffData] = await Promise.all([
               clientService.getAll(),
               staffService.getAll()
            ]);
            setClients(clientsData);
            setStaffList(staffData as unknown as StaffMember[]);
            toast.success('Entity Matrix Synchronized', { id: loadToast });
         } catch (error) {
            toast.error('Matrix Synchronization Failure', { id: loadToast });
            setStaffList([]);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, []);

   const filteredStaff = staffList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
   const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

   const selectedStaff = activeTab === 'staff' ? staffList.find(s => s.id === selectedId) : null;
   const selectedClient = activeTab === 'clients' ? clients.find(c => c.id === selectedId) : null;

   const StatusBadge = ({ status }: { status: string }) => {
      const styles: Record<string, string> = {
         'Active': 'bg-emerald-900 text-emerald-400 border-emerald-500/30',
         'On Leave': 'bg-amber-900 text-amber-400 border-amber-500/30',
         'Terminated': 'bg-rose-900 text-rose-400 border-rose-500/30',
         'Valid': 'bg-emerald-900 text-emerald-400 border-emerald-500/30',
         'Due Soon': 'bg-amber-900 text-amber-400 border-amber-500/30',
         'Expired': 'bg-rose-900 text-rose-400 border-rose-500/30',
         'Low': 'bg-blue-900 text-blue-400 border-blue-500/30',
         'Medium': 'bg-purple-900 text-purple-400 border-purple-500/30',
         'High': 'bg-rose-900 text-rose-400 border-rose-500/30'
      };
      const style = styles[status] || 'bg-slate-900 text-slate-400 border-slate-700';
      return <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${style} shadow-lg`}>{status.toUpperCase()}</span>;
   };

   const renderStaffDetails = (staff: StaffMember) => (
      <div className="animate-in fade-in slide-in-from-right-10 duration-500 h-full flex flex-col bg-slate-900 text-white rounded-[3.5rem] overflow-hidden border border-white/5 relative">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none" />

         <div className="p-10 border-b border-white/5 bg-white/5 backdrop-blur-xl relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-2xl skew-x-[-3deg] border-2 border-white/10">
                  {staff.avatar}
               </div>
               <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-1">{staff.name}</h2>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">{staff.role}</p>
               </div>
            </div>
            <StatusBadge status={staff.status} />
         </div>

         <div className="flex-1 overflow-y-auto p-10 space-y-10 relative z-10 scrollbar-hide">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-sm group hover:bg-white/10 transition-colors">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Comms Vector</p>
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                     <Phone size={16} className="text-indigo-500" /> {staff.phone}
                  </div>
               </div>
               <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-sm group hover:bg-white/10 transition-colors">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Digital ID</p>
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                     <Mail size={16} className="text-indigo-500" /> {staff.email}
                  </div>
               </div>
            </div>

            <section>
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                  <ShieldCheck size={18} className="text-emerald-500" /> Compliance Protocols
               </h3>
               <div className="grid gap-4">
                  {staff.compliance.map(rec => (
                     <div key={rec.id} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/10 transition-all group">
                        <div className="flex items-center gap-6">
                           <div className={`p-4 rounded-2xl ${rec.status === 'Valid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              <FileText size={20} />
                           </div>
                           <div>
                              <p className="font-black text-white text-sm uppercase tracking-wide group-hover:text-indigo-400 transition-colors">{rec.name}</p>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widestAlpha">Expires: {rec.expiryDate}</p>
                           </div>
                        </div>
                        <StatusBadge status={rec.status} />
                     </div>
                  ))}
               </div>
            </section>

            <section>
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                  <Brain size={18} className="text-purple-500" /> Neural Skill Matrix
               </h3>
               <div className="flex flex-wrap gap-3">
                  {staff.skills.map((skill, i) => (
                     <span key={i} className="px-6 py-3 bg-white/5 text-slate-300 border border-white/5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white hover:border-indigo-500/50 transition-all cursor-default">
                        {skill}
                     </span>
                  ))}
               </div>
            </section>
         </div>
      </div>
   );

   const renderClientDetails = (client: Client) => (
      <div className="animate-in fade-in slide-in-from-right-10 duration-500 h-full flex flex-col bg-white rounded-[3.5rem] overflow-hidden border border-slate-100 shadow-2xl relative">
         <div className="p-10 border-b border-slate-50 bg-slate-50/20 relative z-10">
            <div className="flex justify-between items-start mb-6">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{client.name}</h2>
                  <div className="flex items-center gap-3 text-slate-400 font-bold text-sm">
                     <MapPin size={16} className="text-primary-600" /> {client.address}
                  </div>
               </div>
               <StatusBadge status={client.careLevel} />
            </div>
            <div className="flex gap-4">
               <div className="px-6 py-2 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Age: <span className="text-slate-900">{client.age}</span>
               </div>
               <div className="px-6 py-2 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Last Signal: <span className="text-slate-900">{client.lastVisit}</span>
               </div>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
            <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                  <BadgePoundSterling size={18} className="text-emerald-600" /> Fiscal Contract
               </h3>
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Source Entity</span>
                     <p className="text-xl font-black text-slate-900 tracking-tight">{client.fundingDetails.source}</p>
                  </div>
                  <div className="space-y-1">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contract ID</span>
                     <p className="font-mono text-sm bg-white px-3 py-1 rounded-lg border border-slate-200 w-fit text-slate-600">{client.fundingDetails.contractId}</p>
                  </div>
               </div>
            </section>

            <section className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 relative overflow-hidden">
               <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                  <AlertTriangle size={18} className="text-rose-600" /> Emergency Link
               </h3>
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white text-rose-600 flex items-center justify-center shadow-lg transform -rotate-3">
                     <Phone size={24} />
                  </div>
                  <div>
                     <p className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">{client.emergencyContact.name}</p>
                     <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1">{client.emergencyContact.relation} • {client.emergencyContact.phone}</p>
                  </div>
               </div>
            </section>

            <section className="grid grid-cols-2 gap-6">
               <button
                  onClick={() => setIsCarePlanOpen(true)}
                  className="p-8 bg-slate-900 text-white rounded-[2.5rem] hover:bg-black transition-all shadow-2xl group flex flex-col items-center gap-4 border border-slate-900"
               >
                  <FileText size={32} className="text-primary-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Care Protocol</span>
               </button>
               <button
                  onClick={() => setIsMedicationOpen(true)}
                  className="p-8 bg-white border-2 border-slate-100 text-slate-900 rounded-[2.5rem] hover:border-primary-200 hover:shadow-xl transition-all group flex flex-col items-center gap-4"
               >
                  <Pill size={32} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Med Matrix</span>
               </button>
            </section>
         </div>
      </div>
   );

   if (loading) return <PeopleListSkeleton />;

   return (
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-12 h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-hide pr-4">
         <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Entity <span className="text-primary-600">Matrix</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2">
                  Human Resource Registry • Clinical Subjects • Staff Nodes
               </p>
            </div>
            <button
               onClick={() => {
                  setIsAddModalOpen(true);
                  toast.info(`Initiating New ${activeTab === 'staff' ? 'Staff' : 'Client'} Protocol`);
               }}
               className="px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-black flex items-center gap-4 active:scale-95 transition-all"
            >
               <UserPlus size={16} className="text-primary-500" />
               Initialize {activeTab === 'staff' ? 'Staff Node' : 'Client Subject'}
            </button>
         </div>

         <div className="flex flex-col lg:flex-row gap-10 items-stretch h-[750px]">
            {/* Left Panel: Matrix List */}
            <div className="w-full lg:w-[450px] bg-white rounded-[3.5rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden">
               <div className="p-8 border-b border-slate-50 bg-slate-50/20 space-y-6">
                  <div className="flex p-1.5 bg-slate-100/50 rounded-[1.5rem] border border-slate-200">
                     <button
                        onClick={() => { setActiveTab('staff'); setSelectedId(null); toast.info('Accessing Staff Registry'); }}
                        className={`flex-1 py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${activeTab === 'staff' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                        <Users size={14} /> Staff
                     </button>
                     <button
                        onClick={() => { setActiveTab('clients'); setSelectedId(null); toast.info('Accessing Client Registry'); }}
                        className={`flex-1 py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${activeTab === 'clients' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                        <User size={14} /> Clients
                     </button>
                  </div>
                  <div className="relative group">
                     <Search className="absolute left-5 top-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                     <input
                        type="text"
                        placeholder={`SEARCH ${activeTab.toUpperCase()} MATRIX...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest focus:ring-0 focus:border-primary-500 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                     />
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-2">
                  {activeTab === 'staff' ? (
                     filteredStaff.map(staff => (
                        <div
                           key={staff.id}
                           onClick={() => setSelectedId(staff.id)}
                           className={`p-6 rounded-[2rem] cursor-pointer transition-all flex items-center justify-between group border-2 ${selectedId === staff.id ? 'bg-slate-900 border-slate-900 shadow-2xl scale-[1.02]' : 'bg-white border-transparent hover:border-slate-100 hover:bg-slate-50'}`}
                        >
                           <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center text-sm font-black shadow-inner ${selectedId === staff.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                 {staff.avatar}
                              </div>
                              <div>
                                 <h4 className={`font-black uppercase tracking-tight text-sm leading-none mb-1 ${selectedId === staff.id ? 'text-white' : 'text-slate-900'}`}>{staff.name}</h4>
                                 <p className={`text-[9px] font-black uppercase tracking-widest ${selectedId === staff.id ? 'text-slate-400' : 'text-slate-400'}`}>{staff.role}</p>
                              </div>
                           </div>
                           <ChevronRight size={16} className={`${selectedId === staff.id ? 'text-indigo-400' : 'text-slate-300 group-hover:text-primary-400'} transition-colors`} />
                        </div>
                     ))
                  ) : (
                     filteredClients.map(client => (
                        <div
                           key={client.id}
                           onClick={() => setSelectedId(client.id)}
                           className={`p-6 rounded-[2rem] cursor-pointer transition-all flex items-center justify-between group border-2 ${selectedId === client.id ? 'bg-slate-900 border-slate-900 shadow-2xl scale-[1.02]' : 'bg-white border-transparent hover:border-slate-100 hover:bg-slate-50'}`}
                        >
                           <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center text-sm font-black shadow-inner ${selectedId === client.id ? 'bg-primary-500 text-white' : 'bg-primary-50 text-primary-600'}`}>
                                 {client.name.charAt(0)}
                              </div>
                              <div>
                                 <h4 className={`font-black uppercase tracking-tight text-sm leading-none mb-1 ${selectedId === client.id ? 'text-white' : 'text-slate-900'}`}>{client.name}</h4>
                                 <p className={`text-[9px] font-black uppercase tracking-widest truncate max-w-[120px] ${selectedId === client.id ? 'text-slate-400' : 'text-slate-400'}`}>{client.address}</p>
                              </div>
                           </div>
                           <ChevronRight size={16} className={`${selectedId === client.id ? 'text-primary-400' : 'text-slate-300 group-hover:text-primary-400'} transition-colors`} />
                        </div>
                     ))
                  )}
               </div>
            </div>

            {/* Right Panel: Detail View */}
            <div className="flex-1 min-w-0">
               {selectedId ? (
                  <>
                     {activeTab === 'staff' && selectedStaff && renderStaffDetails(selectedStaff)}
                     {activeTab === 'clients' && selectedClient && renderClientDetails(selectedClient)}
                  </>
               ) : (
                  <div className="h-full bg-white rounded-[3.5rem] border border-slate-100 shadow-inner flex flex-col items-center justify-center gap-8 grayscale opacity-20">
                     <Users size={80} className="animate-pulse" />
                     <div className="text-center space-y-2">
                        <h3 className="font-black text-2xl uppercase tracking-widest">Select Node</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Choose an entity to visualize data matrix</p>
                     </div>
                  </div>
               )}
            </div>
         </div>

         {/* Modals will be rendered here (assuming components are already styled or we'll assume they inherit some global styles, if not, they might look out of place but the file size limit prevents me from restyling ALL children components right now) */}
         {/* For the Add Modal, I'll style it inline here for premium feel */}

         {isAddModalOpen && (
            <div className="fixed inset-0 z-[100] flex justify-end">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)}></div>
               <div className="relative w-full max-w-lg bg-white h-full shadow-[0_0_100px_rgba(0,0,0,0.5)] p-12 overflow-y-auto animate-in slide-in-from-right duration-500 border-l border-white/20">
                  <div className="flex justify-between items-center mb-12">
                     <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Initialize {activeTab === 'staff' ? 'Staff' : 'Client'}</h2>
                     <button onClick={() => setIsAddModalOpen(false)} className="p-4 hover:bg-slate-100 rounded-[1.5rem] transition-colors"><X size={24} /></button>
                  </div>

                  <form className="space-y-8" onSubmit={async (e) => {
                     e.preventDefault();
                     if (activeTab === 'staff') {
                        toast.info('PROTOCOL RESTRICTION', {
                           description: 'Staff node creation requires specific override authorization via Invitation System.'
                        });
                        return;
                     }

                     const loadingToast = toast.loading('Registering New Subject Entity...');
                     try {
                        const formData = new FormData(e.currentTarget);
                        const newClient = {
                           name: formData.get('name') as string,
                           email: formData.get('email') as string,
                           phone: formData.get('phone') as string,
                           address: formData.get('address') as string,
                           careLevel: formData.get('careLevel') as 'Low' | 'Medium' | 'High' | 'Critical',
                           dateOfBirth: formData.get('dob') as string,
                           fundingDetails: {
                              source: formData.get('fundingSource') as 'Private' | 'Council' | 'NHS',
                              contractId: formData.get('contractId') as string,
                           },
                           emergencyContact: {
                              name: formData.get('ecName') as string,
                              relation: formData.get('ecRelation') as string,
                              phone: formData.get('ecPhone') as string,
                           }
                        };

                        if (!currentTenant) {
                           throw new Error('No tenant context');
                        }

                        await clientService.create({ ...newClient, tenant_id: currentTenant.id });

                        const data = await clientService.getAll();
                        setClients(data);
                        setIsAddModalOpen(false);
                        toast.success('Subject Entity Registered Successfully', { id: loadingToast });

                     } catch (error) {
                        toast.error('Registration Failure', { id: loadingToast });
                     }
                  }}>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Identity Matrix</label>
                        <input name="name" required placeholder="FULL LEGAL NAME" type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none focus:border-primary-500 transition-all uppercase placeholder:text-slate-300" />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <input name="email" type="email" placeholder="DIGITAL ID" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none focus:border-primary-500 transition-all uppercase placeholder:text-slate-300" />
                        <input name="phone" type="tel" placeholder="COMMS VECTOR" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none focus:border-primary-500 transition-all uppercase placeholder:text-slate-300" />
                     </div>

                     <input name="address" type="text" placeholder="GEOSPATIAL LOCATOR" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none focus:border-primary-500 transition-all uppercase placeholder:text-slate-300" />

                     {activeTab === 'staff' ? (
                        <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none focus:border-primary-500 transition-all uppercase">
                           <option>Carer</option>
                           <option>Senior Carer</option>
                           <option>Nurse</option>
                        </select>
                     ) : (
                        <>
                           <div className="grid grid-cols-2 gap-4">
                              <input name="dob" type="date" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none focus:border-primary-500 transition-all uppercase text-slate-500" />
                              <select name="careLevel" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none focus:border-primary-500 transition-all uppercase">
                                 <option value="Low">Low Risk</option>
                                 <option value="Medium">Medium Risk</option>
                                 <option value="High">High Risk</option>
                                 <option value="Critical">Critical Risk</option>
                              </select>
                           </div>

                           <div className="pt-8 border-t border-slate-100 space-y-4">
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Fiscal Contract</h3>
                              <div className="grid grid-cols-2 gap-4">
                                 <select name="fundingSource" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none focus:border-primary-500 transition-all uppercase">
                                    <option value="Private">Private</option>
                                    <option value="Council">Council</option>
                                    <option value="NHS">NHS</option>
                                 </select>
                                 <input name="contractId" type="text" placeholder="CONTRACT HASH" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none focus:border-primary-500 transition-all uppercase placeholder:text-slate-300" />
                              </div>
                           </div>

                           <div className="pt-8 border-t border-slate-100 space-y-4">
                              <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest">Emergency Override</h3>
                              <input name="ecName" type="text" placeholder="CONTACT ENTITY" className="w-full p-4 bg-rose-50 border-2 border-rose-100 rounded-[1.5rem] font-bold text-sm outline-none focus:border-rose-500 transition-all uppercase placeholder:text-rose-300 text-rose-900" />
                              <div className="grid grid-cols-2 gap-4">
                                 <input name="ecRelation" type="text" placeholder="RELATION" className="w-full p-4 bg-rose-50 border-2 border-rose-100 rounded-[1.5rem] font-bold text-sm outline-none focus:border-rose-500 transition-all uppercase placeholder:text-rose-300 text-rose-900" />
                                 <input name="ecPhone" type="tel" placeholder="COMMS" className="w-full p-4 bg-rose-50 border-2 border-rose-100 rounded-[1.5rem] font-bold text-sm outline-none focus:border-rose-500 transition-all uppercase placeholder:text-rose-300 text-rose-900" />
                              </div>
                           </div>
                        </>
                     )}
                     <button className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] mt-8 hover:bg-black uppercase tracking-[0.3em] text-xs shadow-xl active:scale-95 transition-all">
                        Authorize Registration
                     </button>
                  </form>
               </div>
            </div>
         )}

         {isCarePlanOpen && selectedClient && (
            <CarePlanManager
               clientId={selectedClient.id}
               clientName={selectedClient.name}
               onClose={() => setIsCarePlanOpen(false)}
            />
         )}

         {isMedicationOpen && selectedClient && (
            <MedicationManager
               clientId={selectedClient.id}
               clientName={selectedClient.name}
               onClose={() => setIsMedicationOpen(false)}
            />
         )}
      </div>
   );
};

export default People;