import React, { useState } from 'react';
import { Plus, Trash2, MoveUp, MoveDown, Save } from 'lucide-react';

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'file' | 'signature';

export interface FormField {
    id: string;
    type: FieldType;
    label: string;
    required: boolean;
    placeholder?: string;
    options?: string[]; // For select inputs
    accept?: string; // For file inputs
    allowMultiple?: boolean; // For file inputs - allow multiple files
    documentCategory?: 'cv_resume' | 'cover_letter' | 'identity' | 'right_to_work' | 'qualification' | 'reference' | 'dbs_certificate' | 'proof_of_address' | 'training_certificate' | 'professional_license' | 'medical_certificate' | 'ni_document' | 'other';
    complianceType?: 'home_office' | 'recruitment' | 'both' | 'none';
}

interface FormBuilderProps {
    initialSchema?: FormField[];
    onSave: (schema: FormField[]) => void;
}

export default function FormBuilder({ initialSchema = [], onSave }: FormBuilderProps) {
    const [fields, setFields] = useState<FormField[]>(initialSchema);

    const addField = () => {
        const newField: FormField = {
            id: `field_${Date.now()}`,
            type: 'text',
            label: 'New Question',
            required: false
        };
        setFields([...fields, newField]);
    };

    const removeField = (index: number) => {
        const newFields = [...fields];
        newFields.splice(index, 1);
        setFields(newFields);
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === fields.length - 1)
        ) {
            return;
        }

        const newFields = [...fields];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
        setFields(newFields);
    };

    const updateField = (index: number, updates: Partial<FormField>) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...updates };
        setFields(newFields);
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Form Fields</h3>
                {fields.map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Label</label>
                                    <input
                                        type="text"
                                        value={field.label}
                                        onChange={(e) => updateField(index, { label: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={field.type}
                                        onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="text">Short Text</option>
                                        <option value="textarea">Long Text</option>
                                        <option value="number">Number</option>
                                        <option value="select">Dropdown</option>
                                        <option value="checkbox">Checkbox</option>
                                        <option value="date">Date</option>
                                        <option value="file">File Upload</option>
                                        <option value="signature">Signature</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center ml-4 space-x-2">
                                <button
                                    onClick={() => moveField(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                    <MoveUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => moveField(index, 'down')}
                                    disabled={index === fields.length - 1}
                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                    <MoveDown className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => removeField(index)}
                                    className="p-1 text-red-400 hover:text-red-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`required_${field.id}`}
                                    checked={field.required}
                                    onChange={(e) => updateField(index, { required: e.target.checked })}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`required_${field.id}`} className="ml-2 block text-sm text-gray-900">
                                    Required
                                </label>
                            </div>

                            {field.type === 'select' && (
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Options (comma separated)</label>
                                    <input
                                        type="text"
                                        value={field.options?.join(', ') || ''}
                                        onChange={(e) => updateField(index, { options: e.target.value.split(',').map(s => s.trim()) })}
                                        placeholder="Option 1, Option 2, Option 3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            )}

                            {field.type === 'file' && (
                                <div className="col-span-2 grid grid-cols-2 gap-4 mt-2 p-3 bg-white rounded border border-gray-200">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Document Category</label>
                                        <select
                                            value={field.documentCategory || 'other'}
                                            onChange={(e) => updateField(index, { documentCategory: e.target.value as any })}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                        >
                                            <option value="other">Other</option>
                                            <option value="cv_resume">CV/Resume</option>
                                            <option value="cover_letter">Cover Letter</option>
                                            <option value="identity">Identity (Passport, ID)</option>
                                            <option value="right_to_work">Right to Work</option>
                                            <option value="qualification">Qualification/Degree</option>
                                            <option value="reference">Reference Letter</option>
                                            <option value="dbs_certificate">DBS Certificate</option>
                                            <option value="proof_of_address">Proof of Address</option>
                                            <option value="training_certificate">Training Certificate</option>
                                            <option value="professional_license">Professional License</option>
                                            <option value="medical_certificate">Medical Certificate</option>
                                            <option value="ni_document">NI Number Document</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Compliance Type</label>
                                        <select
                                            value={field.complianceType || 'none'}
                                            onChange={(e) => updateField(index, { complianceType: e.target.value as any })}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                        >
                                            <option value="none">None</option>
                                            <option value="home_office">Home Office</option>
                                            <option value="recruitment">Recruitment</option>
                                            <option value="both">Both</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`allowMultiple_${field.id}`}
                                                checked={field.allowMultiple || false}
                                                onChange={(e) => updateField(index, { allowMultiple: e.target.checked })}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor={`allowMultiple_${field.id}`} className="ml-2 block text-sm text-gray-900">
                                                Allow multiple files (e.g., multiple certificates)
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {fields.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500">No questions yet. Click "Add Question" to start.</p>
                    </div>
                )}

                <div className="flex justify-between pt-4">
                    <button
                        onClick={addField}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                    </button>

                    <button
                        onClick={() => onSave(fields)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Form
                    </button>
                </div>
            </div>
        </div>
    );
}
