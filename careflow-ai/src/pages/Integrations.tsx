
import React, { useState } from 'react';
import { 
  Blocks, CheckCircle2, XCircle, RefreshCw, Key, Copy, 
  Shield, Globe, Server, ExternalLink, Plus, Trash2 
} from 'lucide-react';

const Integrations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'apps' | 'api' | 'webhooks'>('apps');
  const [apiKey, setApiKey] = useState<string | null>('cf_live_8392_xxxx_xxxx_xxxx');
  const [showKey, setShowKey] = useState(false);

  // Mock Integrations Data
  const [apps, setApps] = useState([
    { id: '1', name: 'Xero Accounting', category: 'Finance', status: 'Connected', lastSync: '10 mins ago', icon: 'X' },
    { id: '2', name: 'Sage Payroll', category: 'Finance', status: 'Disconnected', lastSync: '-', icon: 'S' },
    { id: '3', name: 'Slack Notifications', category: 'Communication', status: 'Connected', lastSync: 'Real-time', icon: '#' },
    { id: '4', name: 'NHS GP Connect', category: 'Medical', status: 'Pending', lastSync: '-', icon: '+' },
  ]);

  const [webhooks, setWebhooks] = useState([
    { id: '1', url: 'https://api.agency.com/events/visit-complete', event: 'visit.completed', status: 'Active' },
    { id: '2', url: 'https://hooks.slack.com/services/T000/B000/XXXX', event: 'incident.reported', status: 'Active' },
  ]);

  const toggleApp = (id: string) => {
    setApps(apps.map(app => {
      if (app.id === id) {
        return { ...app, status: app.status === 'Connected' ? 'Disconnected' : 'Connected', lastSync: 'Just now' };
      }
      return app;
    }));
  };

  const generateKey = () => {
    setApiKey(`cf_live_${Math.floor(Math.random() * 10000)}_nk29_vm02`);
    setShowKey(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integrations & API</h1>
        <p className="text-slate-500 text-sm">Manage external connections and developer access.</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200 rounded-xl w-fit">
        {[
          { id: 'apps', label: 'Connected Apps', icon: Blocks },
          { id: 'api', label: 'Developer API', icon: Server },
          { id: 'webhooks', label: 'Webhooks', icon: Globe },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* --- APPS TAB --- */}
      {activeTab === 'apps' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {apps.map((app) => (
             <div key={app.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-48">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-sm
                        ${app.name.includes('Xero') ? 'bg-blue-500' : 
                          app.name.includes('Sage') ? 'bg-green-600' :
                          app.name.includes('Slack') ? 'bg-purple-600' : 'bg-pink-600'
                        }
                      `}>
                         {app.icon}
                      </div>
                      <div>
                         <h3 className="font-bold text-slate-900">{app.name}</h3>
                         <p className="text-xs text-slate-500">{app.category}</p>
                      </div>
                   </div>
                   <div className={`w-3 h-3 rounded-full ${app.status === 'Connected' ? 'bg-green-500' : app.status === 'Pending' ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Status</span>
                      <span className={`font-bold ${app.status === 'Connected' ? 'text-green-700' : 'text-slate-600'}`}>{app.status}</span>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Last Sync</span>
                      <span className="text-slate-700 font-mono text-xs">{app.lastSync}</span>
                   </div>
                </div>

                <button 
                  onClick={() => toggleApp(app.id)}
                  className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${
                     app.status === 'Connected' 
                     ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                     : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                   {app.status === 'Connected' ? 'Disconnect' : 'Connect'}
                </button>
             </div>
           ))}
           
           {/* Add New Placeholder */}
           <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-primary-300 hover:text-primary-600 transition-all cursor-pointer group h-48">
              <div className="p-3 bg-white rounded-full mb-3 group-hover:shadow-md transition-shadow">
                 <Plus size={24} />
              </div>
              <span className="font-bold">Browse App Directory</span>
           </div>
        </div>
      )}

      {/* --- API TAB --- */}
      {activeTab === 'api' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                       <Key className="text-primary-600" size={20} /> API Credentials
                    </h3>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">Active</span>
                 </div>
                 
                 <p className="text-sm text-slate-600 mb-4">
                    Use this key to authenticate requests to the CareFlow API. Treat this key like a password.
                 </p>
                 
                 <div className="bg-slate-900 rounded-lg p-4 flex items-center justify-between group">
                    <code className="text-primary-300 font-mono text-sm">
                       {showKey ? apiKey : 'cf_live_••••••••••••••••••••••••'}
                    </code>
                    <div className="flex gap-2">
                       <button 
                          onClick={() => setShowKey(!showKey)}
                          className="text-slate-400 hover:text-white p-1 rounded"
                       >
                          {showKey ? 'Hide' : 'Show'}
                       </button>
                       <button className="text-slate-400 hover:text-white p-1 rounded">
                          <Copy size={16} />
                       </button>
                    </div>
                 </div>

                 <div className="mt-6 flex gap-3">
                    <button onClick={generateKey} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                       <RefreshCw size={16} /> Roll Key
                    </button>
                    <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                       <XCircle size={16} /> Revoke
                    </button>
                 </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-900 mb-4">Usage Statistics</h3>
                 <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-slate-50 rounded-lg">
                       <div className="text-2xl font-bold text-slate-800">14.2k</div>
                       <div className="text-xs text-slate-500 uppercase font-bold mt-1">Requests (30d)</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                       <div className="text-2xl font-bold text-green-600">99.9%</div>
                       <div className="text-xs text-slate-500 uppercase font-bold mt-1">Uptime</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                       <div className="text-2xl font-bold text-slate-800">42ms</div>
                       <div className="text-xs text-slate-500 uppercase font-bold mt-1">Avg Latency</div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                 <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <Shield size={18} /> Documentation
                 </h3>
                 <p className="text-sm text-blue-800 mb-4">
                    Access our comprehensive API reference to learn about endpoints, authentication, and rate limits.
                 </p>
                 <button className="w-full py-2 bg-white text-blue-700 font-bold rounded-lg text-sm hover:bg-blue-100 flex items-center justify-center gap-2">
                    View Docs <ExternalLink size={14} />
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* --- WEBHOOKS TAB --- */}
      {activeTab === 'webhooks' && (
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-slate-800">Active Webhooks</h3>
               <button className="text-primary-600 text-sm font-bold hover:underline flex items-center gap-1">
                  <Plus size={16} /> Add Endpoint
               </button>
            </div>
            <div className="divide-y divide-slate-100">
               {webhooks.map((hook) => (
                  <div key={hook.id} className="p-6 hover:bg-slate-50 transition-colors">
                     <div className="flex justify-between items-start mb-2">
                        <div>
                           <span className="bg-slate-100 text-slate-600 text-xs font-mono px-2 py-1 rounded border border-slate-200">
                              POST
                           </span>
                           <span className="ml-3 font-mono text-sm text-primary-700 font-medium">
                              {hook.url}
                           </span>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                           <CheckCircle2 size={12} /> {hook.status}
                        </span>
                     </div>
                     <div className="flex justify-between items-center mt-4">
                        <div className="flex gap-4 text-xs text-slate-500">
                           <span>Event: <strong className="text-slate-700">{hook.event}</strong></span>
                           <span>Success Rate: <strong className="text-slate-700">98%</strong></span>
                        </div>
                        <div className="flex gap-2">
                           <button className="p-2 hover:bg-slate-200 rounded text-slate-500">Test</button>
                           <button className="p-2 hover:bg-red-50 rounded text-slate-400 hover:text-red-600">
                              <Trash2 size={16} />
                           </button>
                        </div>
                     </div>
                  </div>
               ))}
               {webhooks.length === 0 && (
                  <div className="p-8 text-center text-slate-400">
                     No webhooks configured.
                  </div>
               )}
            </div>
         </div>
      )}
    </div>
  );
};

export default Integrations;
