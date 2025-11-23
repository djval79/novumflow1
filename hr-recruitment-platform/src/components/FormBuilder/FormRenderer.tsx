import React, { useState } from 'react';
import { FormField } from './FormBuilder';
import SignaturePad from './SignaturePad';

interface FormRendererProps {
    schema: FormField[];
    onSubmit: (data: Record<string, any>) => void;
    initialData?: Record<string, any>;
    submitLabel?: string;
    loading?: boolean;
}

export default function FormRenderer({
    schema,
    onSubmit,
    initialData = {},
    submitLabel = 'Submit',
    loading = false
}: FormRendererProps) {
    const [formData, setFormData] = useState<Record<string, any>>(initialData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (id: string, value: any) => {
        setFormData(prev => ({ ...prev, [id]: value }));
        if (errors[id]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[id];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        schema.forEach(field => {
            if (field.required && !formData[field.id]) {
                newErrors[field.id] = 'This field is required';
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {schema.map(field => (
                <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {field.type === 'text' && (
                        <input
                            type="text"
                            value={formData[field.id] || ''}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${errors[field.id] ? 'border-red-300' : 'border-gray-300'
                                }`}
                        />
                    )}

                    {field.type === 'textarea' && (
                        <textarea
                            value={formData[field.id] || ''}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            rows={4}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${errors[field.id] ? 'border-red-300' : 'border-gray-300'
                                }`}
                        />
                    )}

                    {field.type === 'select' && (
                        <select
                            value={formData[field.id] || ''}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${errors[field.id] ? 'border-red-300' : 'border-gray-300'
                                }`}
                        >
                            <option value="">Select an option</option>
                            {field.options?.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    )}

                    {field.type === 'checkbox' && (
                        <div className="flex items-center mt-2">
                            <input
                                type="checkbox"
                                id={field.id}
                                checked={!!formData[field.id]}
                                onChange={(e) => handleChange(field.id, e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor={field.id} className="ml-2 block text-sm text-gray-900">
                                {field.placeholder || 'Yes'}
                            </label>
                        </div>
                    )}

                    {field.type === 'date' && (
                        <input
                            type="date"
                            value={formData[field.id] || ''}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${errors[field.id] ? 'border-red-300' : 'border-gray-300'
                                }`}
                        />
                    )}

                    {field.type === 'file' && (
                        <input
                            type="file"
                            accept={field.accept}
                            multiple={field.allowMultiple}
                            onChange={(e) => {
                                if (field.allowMultiple) {
                                    // Handle multiple files
                                    const files = e.target.files ? Array.from(e.target.files) : [];
                                    handleChange(field.id, files);
                                } else {
                                    // Handle single file
                                    const file = e.target.files?.[0];
                                    handleChange(field.id, file || null);
                                }
                            }}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${errors[field.id] ? 'border-red-300' : 'border-gray-300'
                                }`}
                        />
                    )}

                    {field.type === 'number' && (
                        <input
                            type="number"
                            value={formData[field.id] || ''}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${errors[field.id] ? 'border-red-300' : 'border-gray-300'
                                }`}
                        />
                    )}

                    {field.type === 'signature' && (
                        <SignaturePad
                            value={formData[field.id]}
                            onChange={(value) => handleChange(field.id, value)}
                        />
                    )}
                    {errors[field.id] && (
                        <p className="mt-1 text-sm text-red-600">{errors[field.id]}</p>
                    )}
                </div>
            ))}

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {loading ? 'Submitting...' : submitLabel}
                </button>
            </div>
        </form>
    );
}
