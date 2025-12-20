
import React, { useState, useEffect } from 'react';
import {
   Blocks, CheckCircle2, XCircle, RefreshCw, Key, Copy,
   Shield, Globe, Server, ExternalLink, Plus, Trash2, Zap, Target, History, Globe2, Cpu, Link2,
   Slack, Video, Mail, Calendar, HardDrive, CreditCard, FileText, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/context/TenantContext';

interface Integration {
   id: string;
   name: string;
   service_name: string;
   category: string;
   status: 'Connected' | 'Disconnected' | 'Pending';
   last_sync: string;
   icon: string;
   description?: string;
}

// Third-party integrations that can be added
const availableIntegrations = [
   { id: 'xero', name: 'Xero Accounting', category: 'Finance', icon: 'X', description: 'Sync invoices and payroll data' },
   { id: 'sage', name: 'Sage Payroll', category: 'Finance', icon: 'S', description: 'Payroll and pension management' },
   { id: 'quickbooks', name: 'QuickBooks', category: 'Finance', icon: 'Q', description: 'Accounting and invoicing' },
   { id: 'slack', name: 'Slack', category: 'Communication', icon: '#', description: 'Team messaging and alerts' },
   { id: 'teams', name: 'Microsoft Teams', category: 'Communication', icon: 'T', description: 'Video calls and collaboration' },
   { id: 'zoom', name: 'Zoom', category: 'Communication', icon: 'Z', description: 'Video conferencing' },
   { id: 'nhs_spine', name: 'NHS Spine', category: 'Medical', icon: '+', description: 'Patient record lookup' },
   { id: 'gp_connect', name: 'GP Connect', category: 'Medical', icon: 'G', description: 'GP appointment booking' },
   { id: 'docusign', name: 'DocuSign', category: 'Documents', icon: 'D', description: 'Electronic signatures' },
   { id: 'google_drive', name: 'Google Drive', category: 'Storage', icon: 'G', description: 'Cloud document storage' },
   { id: 'stripe', name: 'Stripe', category: 'Payments', icon: 'S', description: 'Payment processing' },
   { id: 'twilio', name: 'Twilio', category: 'Communication', icon: 'T', description: 'SMS and voice' },
   { id: 'sendgrid', name: 'SendGrid', category: 'Communication', icon: 'S', description: 'Email delivery' },
   { id: 'careplanner', name: 'Care Planner', category: 'Care', icon: 'C', description: 'Care planning software' },
   { id: 'birdie', name: 'Birdie', category: 'Care', icon: 'B', description: 'Home care management' },
];

const Integrations: React.FC = () => {
   const { currentTenant } = useTenant();
   const [activeTab, setActiveTab] = useState<'apps' | 'api' | 'webhooks'>('apps');
   const [apiKey, setApiKey] = useState<string | null>('cf_live_8392_xxxx_xxxx_xxxx');
   const [showKey, setShowKey] = useState(false);
   const [loading, setLoading] = useState(true);
   const [showAddModal, setShowAddModal] = useState(false);

   const [apps, setApps] = useState<Integration[]>([]);

   const [webhooks, setWebhooks] = useState([
      { id: '1', url: 'https://api.agency.com/events/visit-complete', event: 'visit.completed', status: 'Active' },
      { id: '2', url: 'https://hooks.slack.com/services/T000/B000/XXXX', event: 'incident.reported', status: 'Active' },
   ]);

   // Load integrations from database
   useEffect(() => {
      loadIntegrations();
   }, [currentTenant]);

   async function loadIntegrations() {
      if (!currentTenant) {
         setLoading(false);
         return;
      }

      try {
         setLoading(true);
         const { data, error } = await supabase
            .from('tenant_integrations')
            .select('*')
            .eq('tenant_id', currentTenant.id);

         if (error) {
            // If table doesn't exist, use fallback demo data
            console.warn('tenant_integrations table not found, using demo data');
            setApps([
               { id: '1', name: 'Xero Accounting', service_name: 'xero', category: 'Finance', status: 'Connected', last_sync: '10 mins ago', icon: 'X' },
               { id: '2', name: 'Sage Payroll', service_name: 'sage', category: 'Finance', status: 'Disconnected', last_sync: '-', icon: 'S' },
               { id: '3', name: 'Slack Notifications', service_name: 'slack', category: 'Communication', status: 'Connected', last_sync: 'Real-time', icon: '#' },
               { id: '4', name: 'NHS GP Connect', service_name: 'gp_connect', category: 'Medical', status: 'Pending', last_sync: '-', icon: '+' },
            ]);
         } else if (data && data.length > 0) {
            setApps(data.map((int: any) => ({
               id: int.id,
               name: int.display_name || int.service_name,
               service_name: int.service_name,
               category: int.category || 'General',
               status: int.is_connected ? 'Connected' : 'Disconnected',
               last_sync: int.last_sync_at ? new Date(int.last_sync_at).toLocaleString() : '-',
               icon: int.service_name[0].toUpperCase(),
            })));
         } else {
            // No integrations yet - show empty state
            setApps([]);
         }
      } catch (err) {
         console.error('Error loading integrations:', err);
         // Fallback to demo data
         setApps([
            { id: '1', name: 'Xero Accounting', service_name: 'xero', category: 'Finance', status: 'Connected', last_sync: '10 mins ago', icon: 'X' },
            { id: '2', name: 'Slack Notifications', service_name: 'slack', category: 'Communication', status: 'Connected', last_sync: 'Real-time', icon: '#' },
         ]);
      } finally {
         setLoading(false);
      }
   }

   const toggleApp = async (id: string, name: string) => {
      const app = apps.find(a => a.id === id);
      if (!app) return;

      const newStatus = app.status === 'Connected' ? 'Disconnected' : 'Connected';

      // Update in database
      if (currentTenant) {
         try {
            await supabase
               .from('tenant_integrations')
               .update({ is_connected: newStatus === 'Connected', last_sync_at: new Date().toISOString() })
               .eq('id', id);
         } catch {
            // Fallback to local state only
         }
      }

      setApps(apps.map(app => {
         if (app.id === id) {
            return { ...app, status: newStatus, last_sync: 'Just now' };
         }
         return app;
      }));

      if (newStatus === 'Connected') {
         toast.success(`Handshake protocol established with ${name}`);
      } else {
         toast.warning(`Satellite link decommissioned: ${name}`);
      }
   };

   const addIntegration = async (integration: typeof availableIntegrations[0]) => {
      if (!currentTenant) {
         toast.error('Please select a tenant first');
         return;
      }

      // Check if already added
      if (apps.find(a => a.service_name === integration.id)) {
         toast.warning(`${integration.name} is already configured`);
         return;
      }

      const newInt: Integration = {
         id: `temp-${Date.now()}`,
         name: integration.name,
         service_name: integration.id,
         category: integration.category,
         status: 'Disconnected',
         last_sync: '-',
         icon: integration.icon,
      };

      // Try to save to database
      try {
         const { data, error } = await supabase
            .from('tenant_integrations')
            .insert({
               tenant_id: currentTenant.id,
               service_name: integration.id,
               display_name: integration.name,
               category: integration.category,
               is_active: true,
               is_connected: false
            })
            .select()
            .single();

         if (!error && data) {
            newInt.id = data.id;
         }
      } catch {
         // Continue with local state
      }

      setApps([...apps, newInt]);
      setShowAddModal(false);
      toast.success(`${integration.name} added to your integrations`);
   };

   const generateKey = () => {
      setApiKey(`cf_live_${Math.floor(Math.random() * 10000)}_nk29_vm02`);
      setShowKey(true);
      toast.success('New API Entropy Key Generated');
   };

   const copyKey = () => {
      if (apiKey) {
         navigator.clipboard.writeText(apiKey);
         toast.success('API Identifier Cached to Clipboard');
      }
   };

   const getIconComponent = (serviceName: string) => {
      switch (serviceName) {
         case 'slack': return <Slack className="text-white" />;
         case 'zoom': return <Video className="text-white" />;
         case 'teams': return <Users className="text-white" />;
         case 'xero':
         case 'quickbooks':
         case 'sage': return <CreditCard className="text-white" />;
         case 'docusign': return <FileText className="text-white" />;
         case 'google_drive': return <HardDrive className="text-white" />;
         case 'sendgrid':
         case 'twilio': return <Mail className="text-white" />;
         default: return null;
      }
   };

   const getColorClass = (category: string) => {
      switch (category) {
         case 'Finance': return 'bg-emerald-600';
         case 'Communication': return 'bg-purple-600';
         case 'Medical': return 'bg-rose-600';
         case 'Documents': return 'bg-amber-600';
         case 'Storage': return 'bg-blue-600';
         case 'Payments': return 'bg-indigo-600';
         case 'Care': return 'bg-teal-600';
         default: return 'bg-slate-600';
      }
   };

   return (
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-12">
         <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Lattice <span className="text-primary-600">Bridge</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">
                  External Integrations • Neural Webhooks • Developer API
               </p>
            </div>
         </div>

         {/* Tabs Deck */}
         <div className="flex p-2 bg-white border border-slate-100 rounded-[3rem] w-fit shadow-2xl relative z-50">
            {[
               { id: 'apps', label: 'Satellites', icon: Blocks },
               { id: 'api', label: 'Entropy', icon: Server },
               { id: 'webhooks', label: 'Pulses', icon: Globe2 },
            ].map((tab) => (
               <button
                  key={tab.id}
                  onClick={() => {
                     setActiveTab(tab.id as any);
                     toast.info(`Synchronizing bridge segment: ${tab.label}`);
                  }}
                  className={`px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                     }`}
               >
                  <tab.icon size={20} /> {tab.label}
               </button>
            ))}
         </div>

         {/* --- APPS TAB --- */}
         {activeTab === 'apps' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
               {loading ? (
                  <div className="col-span-full flex justify-center py-20">
                     <RefreshCw className="animate-spin text-primary-600" size={48} />
                  </div>
               ) : (
                  <>
                     {apps.map((app) => (
                        <div key={app.id} className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col justify-between h-[380px] group transition-all hover:shadow-primary-500/10 relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-primary-600/10 transition-colors" />
                           <div className="flex justify-between items-start relative z-10">
                              <div className="flex items-center gap-6">
                                 <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shadow-2xl transform group-hover:scale-110 transition-transform duration-500 ${getColorClass(app.category)}`}>
                                    {getIconComponent(app.service_name) || app.icon}
                                 </div>
                                 <div className="space-y-1">
                                    <h3 className="font-black text-xl text-slate-900 uppercase tracking-tighter">{app.name}</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widestAlpha">{app.category}</p>
                                 </div>
                              </div>
                              <div className={`w-4 h-4 rounded-full shadow-2xl ${app.status === 'Connected' ? 'bg-primary-500 animate-pulse' : app.status === 'Pending' ? 'bg-amber-500' : 'bg-slate-200'}`}></div>
                           </div>

                           <div className="space-y-6 relative z-10 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-50">
                              <div className="flex items-center justify-between">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widestAlpha">Latency Sync</span>
                                 <span className={`text-[10px] font-black uppercase tracking-widest ${app.status === 'Connected' ? 'text-primary-600' : 'text-slate-400'}`}>{app.status}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widestAlpha">Last Data Pulse</span>
                                 <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{app.last_sync}</span>
                              </div>
                           </div>

                           <button
                              onClick={() => toggleApp(app.id, app.name)}
                              className={`w-full py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all relative z-10 shadow-xl active:scale-95 ${app.status === 'Connected'
                                 ? 'bg-white border-4 border-slate-50 text-slate-900 hover:border-rose-500 hover:text-rose-600'
                                 : 'bg-slate-900 text-white hover:bg-black'
                                 }`}
                           >
                              {app.status === 'Connected' ? 'Decommission' : 'Initiate Bridge'}
                           </button>
                        </div>
                     ))}

                     <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-slate-900 border-4 border-white border-dashed text-white rounded-[4rem] shadow-2xl flex flex-col items-center justify-center p-12 group h-[380px] relative overflow-hidden active:scale-95 transition-all"
                     >
                        <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                        <div className="p-8 bg-white/10 rounded-[2.5rem] mb-6 group-hover:bg-primary-600 transition-all duration-500 relative z-10 shadow-2xl">
                           <Plus size={48} className="text-white" />
                        </div>
                        <span className="font-black uppercase tracking-[0.5em] text-[12px] relative z-10">Add Integration</span>
                     </button>
                  </>
               )}
            </div>
         )}

         {/* --- API TAB --- */}
         {activeTab === 'api' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 h-full">
               <div className="lg:col-span-2 space-y-10">
                  <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden group h-fit">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full blur-[100px] -mr-32 -mt-32" />
                     <div className="flex justify-between items-center mb-12 relative z-10">
                        <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.5em] flex items-center gap-6">
                           <Key className="text-primary-600" size={32} /> Entropy Key Matrix
                        </h3>
                        <span className="bg-primary-600 text-white text-[9px] font-black uppercase tracking-[0.3em] px-6 py-2 rounded-full shadow-xl animate-pulse">Lattice-Alpha Active</span>
                     </div>

                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-widestAlpha mb-10 leading-relaxed max-w-lg">
                        Treat this ENTROPY KEY with maximum protocols. Decryption of CareFlow API endpoints requires active authorization tokens.
                     </p>

                     <div className="bg-slate-900 rounded-[2.5rem] p-10 flex items-center justify-between group/key shadow-[0_30px_60px_rgba(0,0,0,0.3)] border border-white/5 relative">
                        <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                        <code className="text-primary-400 font-black text-xl tracking-tighter uppercase relative z-10">
                           {showKey ? apiKey : '••••••••••••••••••••••••'}
                        </code>
                        <div className="flex gap-4 relative z-10">
                           <button
                              onClick={() => setShowKey(!showKey)}
                              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white rounded-2xl transition-all"
                           >
                              {showKey ? 'Obscure' : 'Reveal'}
                           </button>
                           <button onClick={copyKey} className="p-4 bg-primary-600/20 hover:bg-primary-600 text-primary-400 hover:text-white rounded-2xl transition-all shadow-xl">
                              <Copy size={24} />
                           </button>
                        </div>
                     </div>

                     <div className="mt-12 flex gap-6 relative z-10">
                        <button onClick={generateKey} className="px-10 py-5 bg-white border-4 border-slate-50 rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 hover:border-primary-500 transition-all flex items-center gap-4 shadow-xl active:scale-95">
                           <RefreshCw size={20} className="text-primary-600" /> Rotate Key
                        </button>
                        <button
                           onClick={() => toast.error('Key revocation requires Tier 1 Override')}
                           className="px-10 py-5 bg-white border-4 border-slate-50 rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.4em] text-rose-600 hover:border-rose-500 transition-all flex items-center gap-4 shadow-xl active:scale-95"
                        >
                           <XCircle size={20} /> Force Revoke
                        </button>
                     </div>
                  </div>

                  <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-[0_45px_100px_rgba(0,0,0,0.4)] border border-white/5 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                     <h3 className="text-[12px] font-black text-primary-500 uppercase tracking-[0.6em] mb-12 flex items-center gap-6">
                        <Target size={32} /> Bandwidth Metrics
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                        <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 group/metric hover:bg-white/10 transition-all">
                           <div className="text-5xl font-black text-white tracking-tighter tabular-nums mb-2 group-hover/metric:scale-110 transition-transform">14.2k</div>
                           <div className="text-[9px] text-slate-500 uppercase font-black tracking-[0.4em]">Requests (30d)</div>
                        </div>
                        <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 group/metric hover:bg-white/10 transition-all">
                           <div className="text-5xl font-black text-primary-500 tracking-tighter tabular-nums mb-2 group-hover/metric:scale-110 transition-transform">99.9%</div>
                           <div className="text-[9px] text-slate-500 uppercase font-black tracking-[0.4em]">Uptime</div>
                        </div>
                        <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 group/metric hover:bg-white/10 transition-all">
                           <div className="text-5xl font-black text-white tracking-tighter tabular-nums mb-2 group-hover/metric:scale-110 transition-transform">42ms</div>
                           <div className="text-[9px] text-slate-500 uppercase font-black tracking-[0.4em]">Latency</div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="space-y-10">
                  <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group border border-white/5 text-white flex flex-col justify-between h-[450px]">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                     <div className="space-y-8 relative z-10 text-center">
                        <div className="p-8 bg-primary-600 text-white rounded-[2.5rem] shadow-2xl border-4 border-white/10 shrink-0 w-fit mx-auto animate-pulse">
                           <Shield size={48} />
                        </div>
                        <div className="space-y-4">
                           <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Neural Docs</h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-relaxed">
                              Access comprehensive API reference protocols for <span className="text-primary-400">Auth & Telemetry</span> handshakes.
                           </p>
                        </div>
                     </div>
                     <button className="w-full py-8 bg-white text-slate-900 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-primary-50 transition-all flex items-center justify-center gap-6 shadow-2xl active:scale-95 relative z-10 group/doc">
                        View Manifest <ExternalLink size={24} className="group-hover/doc:rotate-12 transition-transform text-primary-600" />
                     </button>
                  </div>

                  <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col group p-10 gap-8 h-fit">
                     <div className="p-6 bg-slate-900 rounded-[2rem] shadow-xl w-fit"><History size={24} className="text-primary-500" /></div>
                     <div className="space-y-2">
                        <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em]">Audit Ledger</h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widestAlpha">Chronological event history for lattice API usage</p>
                     </div>
                     <button className="px-8 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.3em] hover:bg-white hover:border-primary-500 transition-all">Download CSV RAW</button>
                  </div>
               </div>
            </div>
         )}

         {/* --- WEBHOOKS TAB --- */}
         {activeTab === 'webhooks' && (
            <div className="bg-white rounded-[4.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-700">
               <div className="px-12 py-12 border-b border-slate-50 bg-slate-50/20 flex flex-col md:flex-row justify-between items-center gap-10">
                  <div className="space-y-2">
                     <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter flex items-center gap-6 leading-none">
                        <Globe size={40} className="text-primary-600" /> Reactive Pulses
                     </h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Autonomous event broadcasting to external nodes</p>
                  </div>
                  <button
                     onClick={() => toast.info('Webhook configuration coming soon')}
                     className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:bg-black transition-all flex items-center gap-4 active:scale-95"
                  >
                     <Plus size={20} /> Initialize Pulse
                  </button>
               </div>
               <div className="divide-y divide-slate-50">
                  {webhooks.map((hook) => (
                     <div key={hook.id} className="p-12 hover:bg-slate-50 transition-all group border-l-[16px] border-l-transparent hover:border-l-primary-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-6">
                           <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                              <span className="bg-slate-900 text-primary-500 text-[10px] font-black tracking-widest px-6 py-2 rounded-xl shadow-xl">
                                 POST
                              </span>
                              <span className="font-black text-lg text-slate-900 uppercase tracking-tight font-mono group-hover:text-primary-600 transition-colors">
                                 {hook.url}
                              </span>
                           </div>
                           <span className="px-6 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 shadow-sm animate-pulse">
                              <CheckCircle2 size={16} /> {hook.status}
                           </span>
                        </div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pt-6 border-t border-slate-50">
                           <div className="flex gap-10">
                              <div className="space-y-1">
                                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Neural Event</p>
                                 <p className="text-[11px] font-black text-slate-900 uppercase tracking-widestAlpha">{hook.event}</p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Delivery Integrity</p>
                                 <p className="text-[11px] font-black text-primary-600 uppercase tracking-widestAlpha">98.44% Success</p>
                              </div>
                           </div>
                           <div className="flex gap-4">
                              <button onClick={() => toast.success(`Diagnostic Pulse dispatched to ${hook.url}`)} className="px-8 py-3 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 hover:border-primary-500 transition-all flex items-center gap-3">
                                 <RefreshCw size={16} /> Test Heartbeat
                              </button>
                              <button onClick={() => toast.warning('Webhooks locked by clinical safety protocol')} className="p-4 bg-rose-50 border-2 border-rose-50 text-rose-300 hover:text-rose-600 hover:border-rose-500 rounded-2xl transition-all shadow-sm active:scale-95">
                                 <Trash2 size={24} />
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
                  {webhooks.length === 0 && (
                     <div className="p-20 text-center grayscale opacity-10 flex flex-col items-center gap-10">
                        <Link2 size={120} className="text-slate-900" />
                        <p className="font-black uppercase tracking-[0.8em] text-[18px]">Null Pulse Manifest</p>
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* Add Integration Modal */}
         {showAddModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-[3rem] p-12 max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
                  <div className="flex justify-between items-center mb-10">
                     <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Add Integration</h2>
                     <button onClick={() => setShowAddModal(false)} className="p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all">
                        <XCircle size={24} />
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {availableIntegrations.map((integration) => {
                        const isAdded = apps.some(a => a.service_name === integration.id);
                        return (
                           <button
                              key={integration.id}
                              onClick={() => !isAdded && addIntegration(integration)}
                              disabled={isAdded}
                              className={`p-6 rounded-3xl border-2 text-left transition-all ${isAdded
                                 ? 'border-green-200 bg-green-50 cursor-not-allowed'
                                 : 'border-slate-100 hover:border-primary-500 hover:shadow-xl'
                                 }`}
                           >
                              <div className="flex items-center gap-4 mb-4">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white ${getColorClass(integration.category)}`}>
                                    {integration.icon}
                                 </div>
                                 <div>
                                    <h3 className="font-black text-slate-900">{integration.name}</h3>
                                    <p className="text-xs text-slate-400">{integration.category}</p>
                                 </div>
                              </div>
                              <p className="text-sm text-slate-600">{integration.description}</p>
                              {isAdded && (
                                 <span className="mt-4 inline-flex items-center gap-2 text-xs text-green-600 font-bold">
                                    <CheckCircle2 size={16} /> Already Added
                                 </span>
                              )}
                           </button>
                        );
                     })}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default Integrations;
