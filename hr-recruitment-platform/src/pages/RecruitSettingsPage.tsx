import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Sliders, CheckSquare, FileText, Users, Plus, Edit, Trash2, Save } from 'lucide-react';
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
  }, [activeTab]);

  async function loadSettings() {
    const { data, error } = await supabase
      .from('recruitment_settings')
      .select('*')
      .single();

    if (data) {
      setSettings(data);
    }
  }

  async function loadCriteria() {
    if (!currentTenant) return;
    setLoading(true);
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('onboarding_checklist_templates')
      .select('*')
      .eq('tenant_id', currentTenant.id);

    if (data) setChecklists(data);
    setLoading(false);
  }

  async function toggleSetting(field: string, value: boolean) {
    if (!settings) return;

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

  async function loadFormTemplates() {
    setLoading(true);
    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .eq('category', 'recruitment')  // Only show recruitment forms
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
    setLoading(true);
    const { data, error } = await supabase
      .from('recruitment_workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setWorkflows(data);
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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Recruitment Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Configure your recruitment process and templates</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Automated Interview Reminders</h3>
                  <p className="text-xs text-gray-500 mt-1">Send automated reminders before scheduled interviews</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings?.auto_schedule_reminders ?? false}
                    onChange={(e) => toggleSetting('auto_schedule_reminders', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Application Acknowledgement</h3>
                  <p className="text-xs text-gray-500 mt-1">Auto-send acknowledgement emails to applicants</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings?.auto_acknowledge_applications ?? false}
                    onChange={(e) => toggleSetting('auto_acknowledge_applications', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">AI Screening & Parsing</h3>
                  <p className="text-xs text-gray-500 mt-1">Enable AI-powered CV parsing and candidate scoring</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings?.enable_ai_screening ?? false}
                    onChange={(e) => toggleSetting('enable_ai_screening', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="space-y-4">
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
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Recruitment Workflows</h2>
                  <button
                    onClick={() => {
                      setEditingWorkflowId(null);
                      setIsEditingWorkflow(true);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Workflow
                  </button>
                </div>
                {workflows.length === 0 && !loading && (
                  <div className="text-center py-12 text-gray-500">
                    No workflows found. Create one to get started.
                  </div>
                )}
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center">
                          {workflow.name}
                          {workflow.is_default && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">Default</span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">{workflow.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingWorkflowId(workflow.id);
                            setIsEditingWorkflow(true);
                          }}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteWorkflow(workflow.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'forms' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Application Forms</h2>
              <div className="flex space-x-2">
                <select
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={selectedFormId || ''}
                  onChange={(e) => setSelectedFormId(e.target.value)}
                >
                  {formTemplates.map(form => (
                    <option key={form.id} value={form.id}>{form.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedForm ? (
              <FormBuilder
                key={selectedForm.id}
                initialSchema={selectedForm.schema}
                onSave={saveFormSchema}
              />
            ) : (
              <div className="text-center py-12">
                {loading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                ) : (
                  <p className="text-gray-500">No form templates found.</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'criteria' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Evaluation Criteria</h2>
              <button
                onClick={() => { setActiveModal('criterion'); setEditingItem(null); }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Criterion
              </button>
            </div>
            {criteria.map((criterion) => (
              <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{criterion.name}</h3>
                    <p className="text-sm text-gray-500">Weight: {criterion.weight}% | Max Score: {criterion.max_score}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => { setEditingItem(criterion); setActiveModal('criterion'); }}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCriterion(criterion.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${criterion.weight}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'checklists' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Onboarding Checklists</h2>
              <button
                onClick={() => { setActiveModal('checklist'); setEditingItem(null); }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Checklist
              </button>
            </div>
            {checklists.map((checklist) => (
              <div key={checklist.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{checklist.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => { setEditingItem(checklist); setActiveModal('checklist'); }}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteChecklist(checklist.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {checklist.tasks.map((task, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckSquare className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Modals */}
        {activeModal === 'criterion' && (
          <Modal
            isOpen={true}
            onClose={closeModal}
            title={editingItem ? 'Edit Criterion' : 'Add Evaluation Criterion'}
          >
            <form onSubmit={handleSaveCriterion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  name="name"
                  defaultValue={editingItem?.name}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingItem?.description}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight (%)</label>
                  <input
                    name="weight"
                    type="number"
                    defaultValue={editingItem?.weight || 10}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Score</label>
                  <input
                    name="max_score"
                    type="number"
                    defaultValue={editingItem?.max_score || 5}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Criterion'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {activeModal === 'checklist' && (
          <Modal
            isOpen={true}
            onClose={closeModal}
            title={editingItem ? 'Edit Checklist' : 'Add Onboarding Checklist'}
          >
            <form onSubmit={handleSaveChecklist} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  name="name"
                  defaultValue={editingItem?.name}
                  required
                  placeholder="e.g. Clinical Nursing Onboarding"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingItem?.description}
                  rows={2}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tasks (one per line)</label>
                <textarea
                  name="tasks"
                  defaultValue={editingItem?.tasks?.join('\n')}
                  required
                  rows={6}
                  placeholder="Submit ID documents&#10;Complete orientation&#10;Shadow senior nurse"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Checklist'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}
