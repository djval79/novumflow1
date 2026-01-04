import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Sliders, CheckSquare, Plus, Edit, Trash2 } from 'lucide-react';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import { useTenant } from '@/contexts/TenantContext';
import FormBuilder, { FormField } from '@/components/FormBuilder/FormBuilder';
import WorkflowEditor from '@/components/WorkflowEditor';

type TabType = 'general' | 'workflows' | 'forms' | 'criteria' | 'checklists';

export default function RecruitSettingsPage() {
  const { currentTenant } = useTenant();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeModal, setActiveModal] = useState<'criterion' | 'checklist' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // DB State
  const [settings, setSettings] = useState<any>(null);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);

  // Form Builder State
  const [formTemplates, setFormTemplates] = useState<any[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const selectedForm = formTemplates.find(f => f.id === selectedFormId);

  // Workflow State
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  const [isEditingWorkflow, setIsEditingWorkflow] = useState(false);

  useEffect(() => {
    if (activeTab === 'general') {
      loadSettings();
    } else if (activeTab === 'forms') {
      loadFormTemplates();
    } else if (activeTab === 'workflows') {
      loadWorkflows();
    } else if (activeTab === 'criteria') {
      loadCriteria();
    } else if (activeTab === 'checklists') {
      loadChecklists();
    }
  }, [activeTab, currentTenant]);

  async function loadSettings() {
    if (!currentTenant) return;
    const { data, error } = await supabase
      .from('recruitment_settings')
      .select('*')
      .eq('organization_id', currentTenant.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading settings:', error);
    } else if (data) {
      setSettings(data);
    } else {
      // Create default settings if not exists
      const { data: newSettings, error: insertError } = await supabase
        .from('recruitment_settings')
        .insert({
          organization_id: currentTenant.id,
          auto_acknowledge_applications: true,
          auto_schedule_reminders: true,
          enable_ai_screening: true
        })
        .select()
        .single();

      if (newSettings) setSettings(newSettings);
    }
  }

  async function loadCriteria() {
    if (!currentTenant) return;
    setLoading(true);
    const { data } = await supabase
      .from('evaluation_criteria_templates')
      .select('*')
      .eq('tenant_id', currentTenant.id)
      .order('weight', { ascending: false });

    if (data) setCriteria(data);
    setLoading(false);
  }

  async function loadChecklists() {
    if (!currentTenant) return;
    setLoading(true);
    const { data } = await supabase
      .from('onboarding_checklist_templates')
      .select('*')
      .eq('tenant_id', currentTenant.id);

    if (data) setChecklists(data);
    setLoading(false);
  }

  async function updateSetting(field: string, value: any) {
    if (!settings || !currentTenant) return;

    const { error } = await supabase
      .from('recruitment_settings')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', settings.id);

    if (error) {
      setToast({ message: 'Failed to update setting', type: 'error' });
    } else {
      setSettings({ ...settings, [field]: value });
      setToast({ message: 'Setting updated', type: 'success' });
    }
  }

  async function toggleSetting(field: string, value: boolean) {
    await updateSetting(field, value);
  }

  async function loadFormTemplates() {
    if (!currentTenant) return;
    setLoading(true);
    const { data } = await supabase
      .from('form_templates')
      .select('*')
      .eq('category', 'recruitment')
      .order('created_at', { ascending: false });

    if (data) {
      setFormTemplates(data);
      if (data.length > 0 && !selectedFormId) {
        setSelectedFormId(data[0].id);
      }
    }
    setLoading(false);
  }

  async function loadWorkflows() {
    if (!currentTenant) return;
    setLoading(true);
    const { data } = await supabase
      .from('recruitment_workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setWorkflows(data);
    }
    setLoading(false);
  }

  async function deleteWorkflow(id: string) {
    if (!window.confirm('Are you sure you want to delete this workflow? This will affect all jobs using it.')) return;

    setLoading(true);
    const { error } = await supabase
      .from('recruitment_workflows')
      .delete()
      .eq('id', id);

    if (error) {
      setToast({ message: 'Failed to delete workflow', type: 'error' });
    } else {
      setToast({ message: 'Workflow deleted successfully', type: 'success' });
      loadWorkflows();
    }
    setLoading(false);
  }

  async function saveFormSchema(schema: FormField[]) {
    if (!selectedFormId) return;

    setLoading(true);
    const { error } = await supabase
      .from('form_templates')
      .update({
        schema,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedFormId);

    if (error) {
      setToast({ message: 'Failed to save form', type: 'error' });
    } else {
      setToast({ message: 'Form saved successfully', type: 'success' });
      loadFormTemplates();
    }
    setLoading(false);
  }

  async function handleSaveCriterion(e: React.FormEvent) {
    e.preventDefault();
    if (!currentTenant) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const criterionData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      weight: parseInt(formData.get('weight') as string),
      max_score: parseInt(formData.get('max_score') as string),
      tenant_id: currentTenant.id,
    };

    let error;
    if (editingItem) {
      const { error: err } = await supabase
        .from('evaluation_criteria_templates')
        .update(criterionData)
        .eq('id', editingItem.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from('evaluation_criteria_templates')
        .insert(criterionData);
      error = err;
    }

    if (error) {
      setToast({ message: 'Failed to save criterion', type: 'error' });
    } else {
      setToast({ message: 'Criterion saved', type: 'success' });
      setActiveModal(null);
      setEditingItem(null);
      loadCriteria();
    }
    setLoading(false);
  }

  async function handleDeleteCriterion(id: string) {
    if (!window.confirm('Are you sure you want to delete this criterion?')) return;

    const { error } = await supabase
      .from('evaluation_criteria_templates')
      .delete()
      .eq('id', id);

    if (error) {
      setToast({ message: 'Failed to delete criterion', type: 'error' });
    } else {
      setToast({ message: 'Criterion deleted', type: 'success' });
      loadCriteria();
    }
  }

  async function handleSaveChecklist(e: React.FormEvent) {
    e.preventDefault();
    if (!currentTenant) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const tasks = (formData.get('tasks') as string).split('\n').filter(t => t.trim());

    const checklistData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      tasks,
      tenant_id: currentTenant.id,
    };

    let error;
    if (editingItem) {
      const { error: err } = await supabase
        .from('onboarding_checklist_templates')
        .update(checklistData)
        .eq('id', editingItem.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from('onboarding_checklist_templates')
        .insert(checklistData);
      error = err;
    }

    if (error) {
      setToast({ message: 'Failed to save checklist', type: 'error' });
    } else {
      setToast({ message: 'Checklist saved', type: 'success' });
      setActiveModal(null);
      setEditingItem(null);
      loadChecklists();
    }
    setLoading(false);
  }

  async function handleDeleteChecklist(id: string) {
    if (!window.confirm('Are you sure you want to delete this checklist?')) return;

    const { error } = await supabase
      .from('onboarding_checklist_templates')
      .delete()
      .eq('id', id);

    if (error) {
      setToast({ message: 'Failed to delete checklist', type: 'error' });
    } else {
      setToast({ message: 'Checklist deleted', type: 'success' });
      loadChecklists();
    }
  }

  const closeModal = () => {
    setActiveModal(null);
    setEditingItem(null);
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'workflows', label: 'Workflows' },
    { id: 'forms', label: 'Application Forms' },
    { id: 'criteria', label: 'Evaluation Criteria' },
    { id: 'checklists', label: 'Onboarding Checklists' }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Recruitment Settings</h1>
        <p className="mt-2 text-lg text-gray-600">Architect your recruitment pipeline and automation workflows</p>
      </div>

      {/* Tabs */}
      <div className="mb-10 border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`whitespace-nowrap py-5 px-1 border-b-2 font-semibold text-base transition-all duration-300 ${activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-white/50 p-12 transition-all duration-500">
        {activeTab === 'general' && (
          <div className="space-y-12">
            <div className="flex items-center space-x-4 mb-2">
              <div className="p-3 bg-indigo-50 rounded-2xl">
                <Settings className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">General Configuration</h2>
            </div>

            <div className="grid gap-8">
              {/* Recruiter Notification Email */}
              <div className="group relative overflow-hidden p-8 bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-100/50 rounded-[2rem] shadow-sm transition-all duration-300 hover:shadow-xl hover:border-indigo-200">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    Recruiter Notification Email
                    <span className="ml-3 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">Per Tenant</span>
                  </h3>
                  <p className="text-base text-gray-600 mt-2 max-w-2xl">Specify the central email for AI candidate alerts and system notifications for your organization.</p>
                  <div className="mt-6 max-w-md">
                    <input
                      type="email"
                      placeholder="e.g. recruitment@yourcompany.com"
                      value={settings?.recruiter_notification_email || ''}
                      onChange={(e) => updateSetting('recruiter_notification_email', e.target.value)}
                      className="w-full px-5 py-3 bg-white border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Interview Reminders</h3>
                      <p className="text-sm text-gray-500 mt-1">Automated 24h candidate reminders.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings?.auto_schedule_reminders ?? false} onChange={(e) => toggleSetting('auto_schedule_reminders', e.target.checked)} />
                      <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Application Receipts</h3>
                      <p className="text-sm text-gray-500 mt-1">Auto-send acknowledgement emails.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings?.auto_acknowledge_applications ?? false} onChange={(e) => toggleSetting('auto_acknowledge_applications', e.target.checked)} />
                      <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* AI Hub */}
              <div className="p-10 bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-[2.5rem] shadow-2xl text-white">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold">AI Screening Intelligence</h3>
                    <p className="text-indigo-100 mt-1">Power your funnel with Gemini-core decision making.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={settings?.enable_ai_screening ?? false} onChange={(e) => toggleSetting('enable_ai_screening', e.target.checked)} />
                    <div className="w-14 h-8 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-white"></div>
                  </label>
                </div>

                {settings?.enable_ai_screening && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 pt-10 border-t border-white/10">
                    <div className="p-6 bg-white/10 rounded-2xl backdrop-blur-md">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold">Auto-Shortlist</h4>
                        <input type="checkbox" checked={settings?.ai_auto_shortlist_enabled ?? false} onChange={(e) => toggleSetting('ai_auto_shortlist_enabled', e.target.checked)} className="rounded" />
                      </div>
                      <input type="range" min="50" max="100" value={settings?.ai_shortlist_threshold || 85} onChange={(e) => updateSetting('ai_shortlist_threshold', parseInt(e.target.value))} className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" />
                      <div className="mt-2 text-right text-sm">Min Match: {settings?.ai_shortlist_threshold || 85}%</div>
                    </div>

                    <div className="p-6 bg-white/10 rounded-2xl backdrop-blur-md">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold">Auto-Reject</h4>
                        <input type="checkbox" checked={settings?.ai_auto_reject_enabled ?? false} onChange={(e) => toggleSetting('ai_auto_reject_enabled', e.target.checked)} className="rounded" />
                      </div>
                      <input type="range" min="0" max="50" value={settings?.ai_reject_threshold || 30} onChange={(e) => updateSetting('ai_reject_threshold', parseInt(e.target.value))} className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" />
                      <div className="mt-2 text-right text-sm">Max Match: {settings?.ai_reject_threshold || 30}%</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="space-y-6">
            {isEditingWorkflow ? (
              <WorkflowEditor
                workflowId={editingWorkflowId || undefined}
                onSave={() => {
                  setIsEditingWorkflow(false);
                  setEditingWorkflowId(null);
                  loadWorkflows();
                  setToast({ message: 'Workflow saved successfully', type: 'success' });
                }}
                onCancel={() => {
                  setIsEditingWorkflow(false);
                  setEditingWorkflowId(null);
                }}
              />
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Recruitment Pipelines</h2>
                  <button onClick={() => { setEditingWorkflowId(null); setIsEditingWorkflow(true); }} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    New Pipeline
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {workflows.map((workflow) => (
                    <div key={workflow.id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg flex items-center">
                          {workflow.name}
                          {workflow.is_default && <span className="ml-3 px-2 py-0.5 text-[10px] bg-green-100 text-green-700 rounded-full uppercase font-black">Active Default</span>}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">{workflow.description}</p>
                      </div>
                      <div className="flex space-x-3">
                        <button onClick={() => { setEditingWorkflowId(workflow.id); setIsEditingWorkflow(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition"><Edit className="w-5 h-5" /></button>
                        <button onClick={() => deleteWorkflow(workflow.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'forms' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Application Interface</h2>
              <select className="bg-white px-4 py-2 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedFormId || ''} onChange={(e) => setSelectedFormId(e.target.value)}>
                {formTemplates.map(form => <option key={form.id} value={form.id}>{form.name}</option>)}
              </select>
            </div>
            {selectedForm ? <FormBuilder key={selectedForm.id} initialSchema={selectedForm.schema} onSave={saveFormSchema} /> : <div className="py-20 text-center text-gray-400">Loading form architect...</div>}
          </div>
        )}

        {activeTab === 'criteria' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Scorecard Templates</h2>
              <button onClick={() => { setActiveModal('criterion'); setEditingItem(null); }} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition flex items-center"><Plus className="w-5 h-5 mr-2" /> Add Criteria</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {criteria.map((criterion) => (
                <div key={criterion.id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-lg">{criterion.name}</h3>
                    <div className="flex space-x-2">
                      <button onClick={() => { setEditingItem(criterion); setActiveModal('criterion'); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteCriterion(criterion.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-indigo-600 h-full" style={{ width: `${criterion.weight}%` }}></div>
                    </div>
                    <span className="font-bold text-gray-600 text-sm whitespace-nowrap">{criterion.weight}% Weight</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'checklists' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Onboarding Archetypes</h2>
              <button onClick={() => { setActiveModal('checklist'); setEditingItem(null); }} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition flex items-center"><Plus className="w-5 h-5 mr-2" /> Add Checklist</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {checklists.map((checklist) => (
                <div key={checklist.id} className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md transition group">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{checklist.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">{checklist.description}</p>
                    </div>
                    <div className="flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(checklist); setActiveModal('checklist'); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDeleteChecklist(checklist.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {checklist.tasks.map((task: string, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <CheckSquare className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals & Toast */}
      {activeModal === 'criterion' && (
        <Modal isOpen={true} onClose={closeModal} title={editingItem ? 'Edit Criterion' : 'Create Criterion'}>
          <form onSubmit={handleSaveCriterion} className="space-y-6">
            <div><label className="block text-sm font-bold text-gray-700 mb-2">Identifier</label><input name="name" defaultValue={editingItem?.name} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Technical Proficiency" /></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-2">Description</label><textarea name="description" defaultValue={editingItem?.description} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div className="grid grid-cols-2 gap-6">
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Weight (%)</label><input name="weight" type="number" defaultValue={editingItem?.weight || 10} required className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Max Raw Score</label><input name="max_score" type="number" defaultValue={editingItem?.max_score || 5} required className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div>
            </div>
            <div className="flex justify-end space-x-4 pt-4"><button type="button" onClick={closeModal} className="px-6 py-3 font-bold text-gray-600">Cancel</button><button type="submit" disabled={loading} className="px-10 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100">Deploy Criterion</button></div>
          </form>
        </Modal>
      )}

      {activeModal === 'checklist' && (
        <Modal isOpen={true} onClose={closeModal} title={editingItem ? 'Refine Checklist' : 'Draft New Checklist'}>
          <form onSubmit={handleSaveChecklist} className="space-y-6">
            <div><label className="block text-sm font-bold text-gray-700 mb-2">Template Name</label><input name="name" defaultValue={editingItem?.name} required className="w-full px-4 py-3 border border-gray-200 rounded-xl" placeholder="e.g. Clinical Specialist Onboarding" /></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-2">Context</label><textarea name="description" defaultValue={editingItem?.description} rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-2">Milestones (One per line)</label><textarea name="tasks" defaultValue={editingItem?.tasks?.join('\n')} required rows={6} className="w-full px-4 py-3 border border-gray-200 rounded-xl" placeholder="Verify HCPC Registration&#10;Complete Safeguarding L3&#10;Shadow Senior Lead" /></div>
            <div className="flex justify-end space-x-4 pt-4"><button type="button" onClick={closeModal} className="px-6 py-3 font-bold text-gray-600">Cancel</button><button type="submit" disabled={loading} className="px-10 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100">Save Checklist</button></div>
          </form>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
