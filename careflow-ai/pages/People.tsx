
import React, { useState, useEffect } from 'react';
import {
   Search, Filter, Download, UserPlus, Phone, Mail, MapPin,
   Calendar, ShieldCheck, AlertTriangle, X, CheckCircle2,
   FileText, ChevronRight, ArrowLeft, BadgePoundSterling, Pill
} from 'lucide-react';
import { StaffMember, Client, ComplianceRecord } from '../types';
import { clientService, staffService } from '../services/supabaseService';
import { MOCK_STAFF } from '../services/mockData';
import CarePlanManager from '../components/CarePlanManager';
import MedicationManager from '../components/MedicationManager';

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

   useEffect(() => {
      const fetchData = async () => {
         try {
            const [clientsData, staffData] = await Promise.all([
               clientService.getAll(),
               staffService.getAll()
            ]);
            setClients(clientsData);
            setStaffList(staffData as StaffMember[]);
         } catch (error) {
            console.error('Error fetching data:', error);
            // Fallback to mock data if DB fails (optional, but good for stability)
            setStaffList(MOCK_STAFF);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, []);

   // Filter Logic
   const filteredStaff = staffList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
   const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

   // Derived State
   const selectedStaff = activeTab === 'staff' ? staffList.find(s => s.id === selectedId) : null;
   const selectedClient = activeTab === 'clients' ? clients.find(c => c.id === selectedId) : null;

   // Helper components
   const StatusBadge = ({ status }: { status: string }) => {
      const styles: Record<string, string> = {
         'Active': 'bg-green-100 text-green-800',
         'On Leave': 'bg-amber-100 text-amber-800',
         'Terminated': 'bg-red-100 text-red-800',
         'Valid': 'bg-green-100 text-green-800',
         'Due Soon': 'bg-amber-100 text-amber-800',
         'Expired': 'bg-red-100 text-red-800',
         'Low': 'bg-blue-100 text-blue-800',
         'Medium': 'bg-purple-100 text-purple-800',
         'High': 'bg-red-100 text-red-800'
      };
      const style = styles[status] || 'bg-slate-100 text-slate-800';
      return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${style}`}>{status}</span>;
   };

   // Render functions for Details Panel
   const renderStaffDetails = (staff: StaffMember) => (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
         {/* Header */}
         <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">
                     {staff.avatar}
                  </div>
                  <div>
                     <h2 className="text-2xl font-bold text-slate-900">{staff.name}</h2>
                     <p className="text-slate-500">{staff.role}</p>
                  </div>
               </div>
               <StatusBadge status={staff.status} />
            </div>
            <div className="flex gap-4 text-sm text-slate-600">
               <div className="flex items-center gap-2"><Phone size={14} /> {staff.phone}</div>
               <div className="flex items-center gap-2"><Mail size={14} /> {staff.email}</div>
            </div>
         </div>

         {/* Content */}
         <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Compliance Section */}
            <section>
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck size={16} /> Compliance & Training
               </h3>
               <div className="grid gap-3">
                  {staff.compliance.map(rec => (
                     <div key={rec.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-full ${rec.status === 'Valid' ? 'bg-green-100 text-green-600' : rec.status === 'Expired' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                              <FileText size={16} />
                           </div>
                           <div>
                              <p className="font-bold text-slate-700 text-sm">{rec.name}</p>
                              <p className="text-xs text-slate-400">Expires: {rec.expiryDate}</p>
                           </div>
                        </div>
                        <StatusBadge status={rec.status} />
                     </div>
                  ))}
                  <button className="w-full py-2 border border-dashed border-slate-300 text-slate-500 rounded-lg hover:bg-slate-50 text-sm font-medium">
                     + Add Certificate / Record
                  </button>
               </div>
            </section>

            {/* Skills Section */}
            <section>
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Skills & Qualifications</h3>
               <div className="flex flex-wrap gap-2">
                  {staff.skills.map((skill, i) => (
                     <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                        {skill}
                     </span>
                  ))}
                  <button className="px-3 py-1 bg-white border border-slate-200 text-slate-500 rounded-full text-sm font-medium hover:bg-slate-50">+ Edit</button>
               </div>
            </section>

            {/* Metadata */}
            <section className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
               <div>
                  <p className="text-xs text-slate-400 uppercase">Joined Date</p>
                  <p className="text-sm font-bold text-slate-700">{staff.joinedDate}</p>
               </div>
               <div>
                  <p className="text-xs text-slate-400 uppercase">Availability</p>
                  <p className="text-sm font-bold text-slate-700">{staff.availability}</p>
               </div>
            </section>
         </div>
      </div>
   );

   const renderClientDetails = (client: Client) => (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
         {/* Header */}
         <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-start justify-between mb-4">
               <div>
                  <h2 className="text-2xl font-bold text-slate-900">{client.name}</h2>
                  <div className="flex items-center gap-2 text-slate-500 mt-1 text-sm">
                     <MapPin size={14} /> {client.address}
                  </div>
               </div>
               <StatusBadge status={client.careLevel + ' Risk'} />
            </div>
            <div className="flex items-center gap-4 text-sm">
               <span className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 text-xs font-bold">Age: {client.age}</span>
               <span className="text-slate-500">Next Visit: <span className="font-medium text-slate-800">{client.lastVisit}</span></span>
            </div>
         </div>

         {/* Content */}
         <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Funding */}
            <section>
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BadgePoundSterling size={16} /> Funding & Contract
               </h3>
               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-blue-800 font-medium">Source</span>
                     <span className="text-sm font-bold text-blue-900">{client.fundingDetails.source}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm text-blue-800 font-medium">Contract ID</span>
                     <span className="font-mono text-xs bg-white px-2 py-1 rounded text-slate-600">{client.fundingDetails.contractId}</span>
                  </div>
                  {client.fundingDetails.budgetLimit && (
                     <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                        <span className="text-sm text-blue-800 font-medium">Monthly Budget</span>
                        <span className="text-sm font-bold text-blue-900">£{client.fundingDetails.budgetLimit.toLocaleString()}</span>
                     </div>
                  )}
               </div>
            </section>

            {/* Emergency Contact */}
            <section>
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} /> Emergency Contact
               </h3>
               <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                     <Phone size={20} className="text-slate-500" />
                  </div>
                  <div>
                     <p className="font-bold text-slate-800">{client.emergencyContact.name} <span className="text-xs font-normal text-slate-500">({client.emergencyContact.relation})</span></p>
                     <p className="text-sm text-primary-600 font-medium">{client.emergencyContact.phone}</p>
                  </div>
               </div>
            </section>

            {/* Actions */}
            <section className="grid grid-cols-2 gap-4">
               <button
                  onClick={() => setIsCarePlanOpen(true)}
                  className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center justify-center gap-2"
               >
                  <FileText size={16} /> View Care Plan
               </button>
               <button
                  onClick={() => setIsMedicationOpen(true)}
                  className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center justify-center gap-2"
               >
                  <Pill size={16} /> Medications
               </button>
            </section>
         </div>
      </div>
   );

   return (
      <div className="h-[calc(100vh-6rem)] flex flex-col animate-in fade-in duration-500">
         {/* Top Bar */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-slate-900">People Directory</h1>
            <div className="flex gap-2 w-full md:w-auto">
               <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex-1 md:flex-none bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-primary-700 flex items-center justify-center gap-2"
               >
                  <UserPlus size={18} />
                  Add {activeTab === 'staff' ? 'Staff' : 'Client'}
               </button>
            </div>
         </div>

         {/* Main Interface */}
         <div className="flex flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Left Panel: List View */}
            <div className={`w-full md:w-[400px] flex flex-col border-r border-slate-200 ${selectedId ? 'hidden md:flex' : 'flex'}`}>

               {/* Tabs & Search */}
               <div className="p-4 border-b border-slate-100 space-y-4">
                  <div className="flex p-1 bg-slate-100 rounded-lg">
                     <button
                        onClick={() => { setActiveTab('staff'); setSelectedId(null); }}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'staff' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        Staff
                     </button>
                     <button
                        onClick={() => { setActiveTab('clients'); setSelectedId(null); }}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'clients' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        Clients
                     </button>
                  </div>
                  <div className="relative">
                     <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                     <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
                     />
                  </div>
               </div>

               {/* List Items */}
               <div className="flex-1 overflow-y-auto">
                  {activeTab === 'staff' ? (
                     filteredStaff.map(staff => (
                        <div
                           key={staff.id}
                           onClick={() => setSelectedId(staff.id)}
                           className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between
                     ${selectedId === staff.id ? 'bg-blue-50/50 border-l-4 border-l-primary-500' : 'border-l-4 border-l-transparent'}
                   `}
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-bold">
                                 {staff.avatar}
                              </div>
                              <div>
                                 <h4 className="font-bold text-slate-900 text-sm">{staff.name}</h4>
                                 <p className="text-xs text-slate-500">{staff.role}</p>
                              </div>
                           </div>
                           <ChevronRight size={16} className="text-slate-400" />
                        </div>
                     ))
                  ) : (
                     filteredClients.map(client => (
                        <div
                           key={client.id}
                           onClick={() => setSelectedId(client.id)}
                           className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between
                     ${selectedId === client.id ? 'bg-blue-50/50 border-l-4 border-l-primary-500' : 'border-l-4 border-l-transparent'}
                   `}
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                                 {client.name.charAt(0)}
                              </div>
                              <div>
                                 <h4 className="font-bold text-slate-900 text-sm">{client.name}</h4>
                                 <p className="text-xs text-slate-500 truncate max-w-[150px]">{client.address}</p>
                              </div>
                           </div>
                           <ChevronRight size={16} className="text-slate-400" />
                        </div>
                     ))
                  )}
               </div>
            </div>

            {/* Right Panel: Detail View */}
            <div className={`flex-1 bg-white ${selectedId ? 'flex' : 'hidden md:flex'} flex-col items-center justify-center`}>
               {selectedId ? (
                  <div className="w-full h-full flex flex-col">
                     {/* Mobile Back Button */}
                     <div className="md:hidden p-4 border-b border-slate-100">
                        <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 text-sm font-bold text-slate-600">
                           <ArrowLeft size={16} /> Back to List
                        </button>
                     </div>

                     {activeTab === 'staff' && selectedStaff && renderStaffDetails(selectedStaff)}
                     {activeTab === 'clients' && selectedClient && renderClientDetails(selectedClient)}
                  </div>
               ) : (
                  <div className="text-center text-slate-400 p-8">
                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={32} className="opacity-50" />
                     </div>
                     <h3 className="font-bold text-slate-700">Select a Person</h3>
                     <p className="text-sm">Click on a staff member or client to view full details.</p>
                  </div>
               )}
            </div>
         </div>

         {/* Care Plan Modal */}
         {isCarePlanOpen && selectedClient && (
            <CarePlanManager
               clientId={selectedClient.id}
               clientName={selectedClient.name}
               onClose={() => setIsCarePlanOpen(false)}
            />
         )}

         {/* Medication Modal */}
         {isMedicationOpen && selectedClient && (
            <MedicationManager
               clientId={selectedClient.id}
               clientName={selectedClient.name}
               onClose={() => setIsMedicationOpen(false)}
            />
         )}

         {/* Add Modal (Simulated) */}
         {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
               <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
               <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 animate-in slide-in-from-right duration-300">
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold text-slate-900">Add New {activeTab === 'staff' ? 'Staff' : 'Client'}</h2>
                     <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                  </div>
                  <form className="space-y-4" onSubmit={async (e) => {
                     e.preventDefault();
                     if (activeTab === 'staff') {
                        alert('Staff creation not yet implemented');
                        return;
                     }

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
                              source: formData.get('fundingSource') as string,
                              contractId: formData.get('contractId') as string,
                           },
                           emergencyContact: {
                              name: formData.get('ecName') as string,
                              relation: formData.get('ecRelation') as string,
                              phone: formData.get('ecPhone') as string,
                           }
                        };

                        await clientService.create(newClient);

                        // Refresh list
                        const data = await clientService.getAll();
                        setClients(data);
                        setIsAddModalOpen(false);
                        alert('Client created successfully!');

                     } catch (error) {
                        console.error('Error creating client:', error);
                        alert('Failed to create client. Please try again.');
                     }
                  }}>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                        <input name="name" required type="text" className="w-full p-2 border border-slate-300 rounded-lg" />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                           <input name="email" type="email" className="w-full p-2 border border-slate-300 rounded-lg" />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                           <input name="phone" type="tel" className="w-full p-2 border border-slate-300 rounded-lg" />
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <input name="address" type="text" className="w-full p-2 border border-slate-300 rounded-lg" />
                     </div>

                     {activeTab === 'staff' ? (
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                           <select className="w-full p-2 border border-slate-300 rounded-lg">
                              <option>Carer</option>
                              <option>Senior Carer</option>
                              <option>Nurse</option>
                           </select>
                        </div>
                     ) : (
                        <>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                                 <input name="dob" type="date" className="w-full p-2 border border-slate-300 rounded-lg" />
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Care Level</label>
                                 <select name="careLevel" className="w-full p-2 border border-slate-300 rounded-lg">
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                 </select>
                              </div>
                           </div>

                           <div className="pt-4 border-t border-slate-100">
                              <h3 className="text-sm font-bold text-slate-900 mb-3">Funding</h3>
                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Source</label>
                                    <select name="fundingSource" className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                                       <option value="Private">Private</option>
                                       <option value="Council">Council</option>
                                       <option value="NHS">NHS</option>
                                    </select>
                                 </div>
                                 <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Contract ID</label>
                                    <input name="contractId" type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                                 </div>
                              </div>
                           </div>

                           <div className="pt-4 border-t border-slate-100">
                              <h3 className="text-sm font-bold text-slate-900 mb-3">Emergency Contact</h3>
                              <div className="space-y-3">
                                 <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Contact Name</label>
                                    <input name="ecName" type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div>
                                       <label className="block text-xs font-medium text-slate-500 mb-1">Relation</label>
                                       <input name="ecRelation" type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                                    </div>
                                    <div>
                                       <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                                       <input name="ecPhone" type="tel" className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </>
                     )}
                     <button className="w-full py-3 bg-primary-600 text-white font-bold rounded-lg mt-6 hover:bg-primary-700">
                        {loading ? 'Saving...' : 'Create Profile'}
                     </button>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default People;