import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import {
    Monitor, Smartphone, Award, Plus, Check, Star,
    TrendingUp, Loader2, Sparkles, BookOpen
} from 'lucide-react';

interface DigitalSkill {
    id: string;
    skill_name: string;
    proficiency_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Digital Champion';
    verified_at: string | null;
}

const LEVEL_COLORS = {
    'Beginner': 'bg-slate-100 text-slate-700 border-slate-200',
    'Intermediate': 'bg-blue-50 text-blue-700 border-blue-200',
    'Advanced': 'bg-purple-50 text-purple-700 border-purple-200',
    'Digital Champion': 'bg-amber-50 text-amber-700 border-amber-200',
};

const SUGGESTED_SKILLS = [
    'CareFlow Usage',
    'Email & Communication',
    'Basic IT Security',
    'Tablet/Mobile Devices',
    'Spreadsheets',
    'Assistive Tech'
];

export default function DigitalSkillsTracker() {
    const { user, profile } = useAuth();
    const { currentTenant } = useTenant();
    const [skills, setSkills] = useState<DigitalSkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillLevel, setNewSkillLevel] = useState<string>('Beginner');

    // Currently logged in employee logic - assuming profile is employee linked
    // In a real app, might pass employeeId as prop, but let's default to "My Skills"

    useEffect(() => {
        if (currentTenant && user) {
            fetchSkills();
        }
    }, [currentTenant, user]);

    const fetchSkills = async () => {
        if (!currentTenant || !profile) return;

        try {
            // Need to find the employee record for this user first
            // For now, let's assume we can query by employee_id if we had it, 
            // or we query where user_id matches if linked.
            // Simplified: querying by tenant_id only for demo/mock or fetch "my" skills if linked.

            // To make this work robustly in this demo environment without complex linking logic:
            // We will fetch skills where `employee_id` matches the current user's Linked Employee ID.
            // If that link doesn't exist, we'll show an empty state or allow creating "Self" record.

            // For the sake of the demo and "Wow" factor, let's fetch by tenant and simulate "My Skills"
            // Or better, let's just use the `auth.uid()` if the table supported it, but it uses `employee_id`.

            // Let's first try to get the employee ID for the current user
            const { data: employee } = await supabase
                .from('employees')
                .select('id')
                .eq('email', user?.email)
                .eq('tenant_id', currentTenant.id)
                .single();

            if (employee) {
                const { data, error } = await supabase
                    .from('employee_digital_skills')
                    .select('*')
                    .eq('employee_id', employee.id)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                setSkills(data || []);
            }
        } catch (error) {
            console.error('Error fetching skills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTenant || !user) return;

        try {
            const { data: employee } = await supabase
                .from('employees')
                .select('id')
                .eq('email', user.email)
                .eq('tenant_id', currentTenant.id)
                .single();

            if (!employee) {
                alert('Employee record not found for your account.');
                return;
            }

            const { data, error } = await supabase
                .from('employee_digital_skills')
                .insert({
                    tenant_id: currentTenant.id,
                    employee_id: employee.id,
                    skill_name: newSkillName,
                    proficiency_level: newSkillLevel
                })
                .select()
                .single();

            if (error) throw error;

            setSkills([...skills, data]);
            setIsAdding(false);
            setNewSkillName('');
            setNewSkillLevel('Beginner');
        } catch (error) {
            console.error('Error adding skill:', error);
        }
    };

    const getIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('mobile') || lower.includes('tablet') || lower.includes('app')) return <Smartphone className="w-5 h-5 text-purple-600" />;
        if (lower.includes('security')) return <Award className="w-5 h-5 text-red-600" />;
        if (lower.includes('careflow')) return <Sparkles className="w-5 h-5 text-cyan-600" />;
        return <Monitor className="w-5 h-5 text-blue-600" />;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-600" />
                        Digital Skills & Maturity
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Track your journey to becoming a Digital Champion</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Skill
                </button>
            </div>

            <div className="p-6">
                {isAdding && (
                    <form onSubmit={handleAddSkill} className="mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-sm font-medium text-slate-900 mb-3">Add New Skill</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Skill Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newSkillName}
                                    onChange={(e) => setNewSkillName(e.target.value)}
                                    placeholder="e.g. CareFlow Advanced"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                    list="suggested-skills"
                                />
                                <datalist id="suggested-skills">
                                    {SUGGESTED_SKILLS.map(s => <option key={s} value={s} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Current Level</label>
                                <select
                                    value={newSkillLevel}
                                    onChange={(e) => setNewSkillLevel(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Digital Champion">Digital Champion</option>
                                </select>
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
                    </div>
                ) : skills.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <div className="bg-white w-12 h-12 rounded-full shadow-sm flex items-center justify-center mx-auto mb-3">
                            <BookOpen className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-slate-900 font-medium">No skills recorded yet</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">Start tracking your digital capabilities to identify training needs and become a Digital Champion.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {skills.map(skill => (
                            <div key={skill.id} className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-cyan-200 hover:shadow-md transition-all duration-200">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-cyan-50 transition-colors">
                                        {getIcon(skill.skill_name)}
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${LEVEL_COLORS[skill.proficiency_level] || LEVEL_COLORS['Beginner']}`}>
                                        {skill.proficiency_level}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-slate-900">{skill.skill_name}</h3>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4].map((star, i) => {
                                            const levels = ['Beginner', 'Intermediate', 'Advanced', 'Digital Champion'];
                                            const currentLevelIdx = levels.indexOf(skill.proficiency_level);
                                            return (
                                                <Star
                                                    key={i}
                                                    className={`w-4 h-4 ${i <= currentLevelIdx ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                                />
                                            );
                                        })}
                                    </div>
                                    {skill.verified_at && (
                                        <div className="flex items-center gap-1 text-xs text-green-600 font-medium" title="Verified by HR">
                                            <Check className="w-3 h-3" />
                                            Verified
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
