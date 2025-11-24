import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Save, GripVertical, Settings, ChevronRight, Check, X, Mail, Calendar, Bot, FileText } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Stage {
    id: string;
    name: string;
    stage_type: string;
    stage_order: number;
    is_system_stage: boolean;
    automations?: Automation[];
}

interface Automation {
    id: string;
    stage_id?: string;
    name: string;
    trigger_event: 'on_enter' | 'on_exit';
    action_type: 'send_email' | 'schedule_interview' | 'create_task' | 'update_status' | 'ai_interview';
    action_config: any;
    is_active: boolean;
}

interface Workflow {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
    is_default: boolean;
}

interface WorkflowEditorProps {
    workflowId?: string;
    onSave?: () => void;
    onCancel?: () => void;
}

export default function WorkflowEditor({ workflowId, onSave, onCancel }: WorkflowEditorProps) {
    const [workflow, setWorkflow] = useState<Workflow>({
        id: '',
        name: '',
        description: '',
        is_active: true,
        is_default: false
    });
    const [stages, setStages] = useState<Stage[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeStageId, setActiveStageId] = useState<string | null>(null);
    const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);

    useEffect(() => {
        if (workflowId) {
            loadWorkflow(workflowId);
        } else {
            // Initialize with default stages for new workflow
            setStages([
                { id: 'temp-1', name: 'Applied', stage_type: 'applied', stage_order: 1, is_system_stage: true, automations: [] },
                { id: 'temp-2', name: 'Screening', stage_type: 'screening', stage_order: 2, is_system_stage: false, automations: [] },
                { id: 'temp-3', name: 'Interview', stage_type: 'interview', stage_order: 3, is_system_stage: false, automations: [] },
                { id: 'temp-4', name: 'Offer', stage_type: 'offer', stage_order: 4, is_system_stage: false, automations: [] },
                { id: 'temp-5', name: 'Hired', stage_type: 'hired', stage_order: 5, is_system_stage: true, automations: [] },
                { id: 'temp-6', name: 'Rejected', stage_type: 'rejected', stage_order: 6, is_system_stage: true, automations: [] }
            ]);
        }
    }, [workflowId]);

    async function loadWorkflow(id: string) {
        setLoading(true);
        try {
            // Load Workflow Details
            const { data: wfData, error: wfError } = await supabase
                .from('recruitment_workflows')
                .select('*')
                .eq('id', id)
                .single();

            if (wfError) throw wfError;
            setWorkflow(wfData);

            // Load Stages
            const { data: stageData, error: stageError } = await supabase
                .from('workflow_stages')
                .select('*, stage_automations(*)')
                .eq('workflow_id', id)
                .order('stage_order');

            if (stageError) throw stageError;

            // Transform data to include automations in the stage object
            const stagesWithAutomations = stageData.map((stage: any) => ({
                ...stage,
                automations: stage.stage_automations || []
            }));

            setStages(stagesWithAutomations);
        } catch (error) {
            console.error('Error loading workflow:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            let currentWorkflowId = workflowId;

            // 1. Save Workflow
            if (!currentWorkflowId) {
                const { data, error } = await supabase
                    .from('recruitment_workflows')
                    .insert([{
                        name: workflow.name,
                        description: workflow.description,
                        is_active: workflow.is_active,
                        is_default: workflow.is_default
                    }])
                    .select()
                    .single();

                if (error) throw error;
                currentWorkflowId = data.id;
            } else {
                const { error } = await supabase
                    .from('recruitment_workflows')
                    .update({
                        name: workflow.name,
                        description: workflow.description,
                        is_active: workflow.is_active,
                        is_default: workflow.is_default
                    })
                    .eq('id', currentWorkflowId);

                if (error) throw error;
            }

            // 2. Save Stages
            const stagesToUpsert = stages.map((stage, index) => ({
                id: stage.id.startsWith('temp-') ? undefined : stage.id,
                workflow_id: currentWorkflowId,
                name: stage.name,
                stage_type: stage.stage_type,
                stage_order: index + 1,
                is_system_stage: stage.is_system_stage
            }));

            const { data: savedStages, error: stagesError } = await supabase
                .from('workflow_stages')
                .upsert(stagesToUpsert)
                .select();

            if (stagesError) throw stagesError;

            // 3. Save Automations
            // We need to map the saved stages back to our local stages to get the correct stage_ids for automations
            // This is tricky if we have new stages. 
            // Strategy: Delete all automations for these stages and re-insert? No, bad for logs.
            // Better: Match by name/order? 
            // Since we just saved stages, we can try to map them.

            // For simplicity in this iteration: We will loop through the saved stages, find the corresponding local stage (by name/order),
            // and then upsert its automations.

            for (const savedStage of savedStages) {
                const localStage = stages.find(s => s.name === savedStage.name && s.stage_type === savedStage.stage_type);
                if (localStage && localStage.automations && localStage.automations.length > 0) {
                    const automationsToUpsert = localStage.automations.map(auto => ({
                        id: auto.id.startsWith('temp-') ? undefined : auto.id,
                        stage_id: savedStage.id,
                        name: auto.name,
                        trigger_event: auto.trigger_event,
                        action_type: auto.action_type,
                        action_config: auto.action_config,
                        is_active: auto.is_active
                    }));

                    const { error: autoError } = await supabase
                        .from('stage_automations')
                        .upsert(automationsToUpsert);

                    if (autoError) console.error('Error saving automations for stage', savedStage.name, autoError);
                }
            }

            if (onSave) onSave();
        } catch (error) {
            console.error('Error saving workflow:', error);
            alert('Failed to save workflow');
        } finally {
            setSaving(false);
        }
    }

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(stages);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setStages(items);
    };

    const addStage = () => {
        const newStage: Stage = {
            id: `temp-${Date.now()}`,
            name: 'New Stage',
            stage_type: 'custom',
            stage_order: stages.length + 1,
            is_system_stage: false,
            automations: []
        };
        const insertIndex = Math.max(0, stages.length - 2);
        const newStages = [...stages];
        newStages.splice(insertIndex, 0, newStage);
        setStages(newStages);
    };

    const removeStage = (index: number) => {
        const newStages = [...stages];
        newStages.splice(index, 1);
        setStages(newStages);
    };

    const handleAddAutomation = () => {
        setEditingAutomation({
            id: `temp-auto-${Date.now()}`,
            name: 'New Automation',
            trigger_event: 'on_enter',
            action_type: 'send_email',
            action_config: {},
            is_active: true
        });
    };

    const handleSaveAutomation = () => {
        if (!editingAutomation || !activeStageId) return;

        const newStages = stages.map(stage => {
            if (stage.id === activeStageId) {
                const existingAutoIndex = stage.automations?.findIndex(a => a.id === editingAutomation.id);
                let newAutomations = [...(stage.automations || [])];

                if (existingAutoIndex !== undefined && existingAutoIndex >= 0) {
                    newAutomations[existingAutoIndex] = editingAutomation;
                } else {
                    newAutomations.push(editingAutomation);
                }
                return { ...stage, automations: newAutomations };
            }
            return stage;
        });

        setStages(newStages);
        setEditingAutomation(null);
    };

    const handleDeleteAutomation = (automationId: string) => {
        if (!activeStageId) return;

        const newStages = stages.map(stage => {
            if (stage.id === activeStageId) {
                return {
                    ...stage,
                    automations: stage.automations?.filter(a => a.id !== automationId)
                };
            }
            return stage;
        });
        setStages(newStages);
    };

    if (loading) return <div>Loading...</div>;

    const activeStage = stages.find(s => s.id === activeStageId);

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name</label>
                <input
                    type="text"
                    value={workflow.name}
                    onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Technical Hiring Pipeline"
                />
            </div>

            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Pipeline Stages</h3>
                    <button
                        onClick={addStage}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Stage
                    </button>
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="stages">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                {stages.map((stage, index) => (
                                    <Draggable key={stage.id} draggableId={stage.id} index={index} isDragDisabled={stage.is_system_stage}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`flex items-center p-3 bg-gray-50 border rounded-lg ${activeStageId === stage.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'
                                                    }`}
                                            >
                                                <div {...provided.dragHandleProps} className="mr-3 text-gray-400 cursor-move">
                                                    <GripVertical className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={stage.name}
                                                        onChange={(e) => {
                                                            const newStages = [...stages];
                                                            newStages[index].name = e.target.value;
                                                            setStages(newStages);
                                                        }}
                                                        disabled={stage.is_system_stage}
                                                        className="block w-full border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm bg-transparent"
                                                    />
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => setActiveStageId(activeStageId === stage.id ? null : stage.id)}
                                                        className={`p-1 rounded ${activeStageId === stage.id ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'}`}
                                                        title="Configure Automations"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </button>
                                                    {!stage.is_system_stage && (
                                                        <button
                                                            onClick={() => removeStage(index)}
                                                            className="p-1 text-red-400 hover:text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>

            {activeStage && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-medium text-gray-900">
                            Automations for "{activeStage.name}"
                        </h4>
                        {!editingAutomation && (
                            <button
                                onClick={handleAddAutomation}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Automation
                            </button>
                        )}
                    </div>

                    {editingAutomation ? (
                        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                            <div className="grid grid-cols-1 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Automation Name</label>
                                    <input
                                        type="text"
                                        value={editingAutomation.name}
                                        onChange={(e) => setEditingAutomation({ ...editingAutomation, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Trigger</label>
                                        <select
                                            value={editingAutomation.trigger_event}
                                            onChange={(e) => setEditingAutomation({ ...editingAutomation, trigger_event: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="on_enter">When entering stage</option>
                                            <option value="on_exit">When leaving stage</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Action</label>
                                        <select
                                            value={editingAutomation.action_type}
                                            onChange={(e) => setEditingAutomation({ ...editingAutomation, action_type: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="send_email">Send Email</option>
                                            <option value="schedule_interview">Schedule Interview</option>
                                            <option value="ai_interview">Start AI Interview</option>
                                            <option value="create_task">Create Task</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Dynamic Configuration based on Action Type */}
                                {editingAutomation.action_type === 'send_email' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Email Template ID</label>
                                        <input
                                            type="text"
                                            value={editingAutomation.action_config.template_id || ''}
                                            onChange={(e) => setEditingAutomation({
                                                ...editingAutomation,
                                                action_config: { ...editingAutomation.action_config, template_id: e.target.value }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            placeholder="e.g., interview_invite"
                                        />
                                    </div>
                                )}
                                {editingAutomation.action_type === 'ai_interview' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Interview Config</label>
                                        <textarea
                                            value={JSON.stringify(editingAutomation.action_config, null, 2)}
                                            onChange={(e) => {
                                                try {
                                                    const config = JSON.parse(e.target.value);
                                                    setEditingAutomation({ ...editingAutomation, action_config: config });
                                                } catch (err) {
                                                    // Allow typing invalid JSON temporarily
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono h-24"
                                            placeholder="{}"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setEditingAutomation(null)}
                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveAutomation}
                                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700"
                                >
                                    Save Automation
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeStage.automations && activeStage.automations.length > 0 ? (
                                activeStage.automations.map((auto) => (
                                    <div key={auto.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
                                        <div className="flex items-center">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${auto.action_type === 'send_email' ? 'bg-blue-100 text-blue-600' :
                                                    auto.action_type === 'ai_interview' ? 'bg-purple-100 text-purple-600' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {auto.action_type === 'send_email' ? <Mail className="w-4 h-4" /> :
                                                    auto.action_type === 'ai_interview' ? <Bot className="w-4 h-4" /> :
                                                        <Settings className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{auto.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {auto.trigger_event === 'on_enter' ? 'On Enter' : 'On Exit'} • {auto.action_type.replace('_', ' ')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setEditingAutomation(auto)}
                                                className="text-indigo-600 text-xs font-medium hover:text-indigo-800"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAutomation(auto.id)}
                                                className="text-red-600 text-xs font-medium hover:text-red-800"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-gray-500 bg-white rounded-md border border-dashed border-gray-300">
                                    <p className="text-sm">No automations configured for this stage.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Workflow'}
                </button>
            </div>
        </div>
    );
}
