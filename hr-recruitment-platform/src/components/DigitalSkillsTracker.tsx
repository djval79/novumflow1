import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
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
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (currentTenant && user) {
            fetchSkills();
        }
    }, [currentTenant, user]);

    const fetchSkills = async () => {
        if (!currentTenant || !profile) return;

        try {
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
            log.error('Error fetching skills', error, { component: 'DigitalSkillsTracker', action: 'fetchSkills' });
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
            log.error('Error adding skill', error, { component: 'DigitalSkillsTracker', action: 'handleAddSkill' });
        }
    };

    const handleUpdateLevel = async (skillId: string, newLevel: DigitalSkill['proficiency_level']) => {
        setActionLoading(skillId);
        try {
            const { error } = await supabase
                .from('employee_digital_skills')
                .update({ proficiency_level: newLevel })
                .eq('id', skillId);

            if (error) throw error;

            setSkills(prev => prev.map(s => s.id === skillId ? { ...s, proficiency_level: newLevel } : s));
        } catch (error) {
            log.error('Error updating skill level', error, { component: 'DigitalSkillsTracker', action: 'handleUpdateLevel' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteSkill = async (skillId: string) => {
        if (!confirm('Are you sure you want to remove this skill from your profile?')) return;

        setActionLoading(skillId);
        try {
            const { error } = await supabase
                .from('employee_digital_skills')
                .delete()
                .eq('id', skillId);

            if (error) throw error;

            setSkills(prev => prev.filter(s => s.id !== skillId));
        } catch (error) {
            log.error('Error deleting skill', error, { component: 'DigitalSkillsTracker', action: 'handleDeleteSkill' });
        } finally {
            setActionLoading(null);
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
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-600" />
                        Digital Skills & Maturity
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Track your journey to becoming a Digital Champion</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={isAdding}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium shadow-sm disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    Add Skill
                </button>
            </div>

            <div className="p-6">
                {isAdding && (
                    <form onSubmit={handleAddSkill} className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-4 shadow-inner">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Add New Skill</h3>
                            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <Plus className="w-4 h-4 transform rotate-45" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-tight">Skill Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newSkillName}
                                    onChange={(e) => setNewSkillName(e.target.value)}
                                    placeholder="e.g. CareFlow Advanced"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    list="suggested-skills"
                                />
                                <datalist id="suggested-skills">
                                    {SUGGESTED_SKILLS.map(s => <option key={s} value={s} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-tight">Current Level</label>
                                <select
                                    value={newSkillLevel}
                                    onChange={(e) => setNewSkillLevel(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white"
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
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    Save Skill
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
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    </div>
                ) : skills.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <div className="bg-white w-14 h-14 rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-7 h-7 text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-semibold text-lg">No skills recorded yet</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">Start tracking your digital capabilities to identify training needs and become a Digital Champion.</p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="mt-6 px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors font-medium text-sm"
                        >
                            Get Started
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {skills.map(skill => (
                            <div key={skill.id} className="group relative bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                {actionLoading === skill.id && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                                        {getIcon(skill.skill_name)}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <select
                                            value={skill.proficiency_level}
                                            onChange={(e) => handleUpdateLevel(skill.id, e.target.value as any)}
                                            className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 border cursor-pointer outline-none transition ${LEVEL_COLORS[skill.proficiency_level] || LEVEL_COLORS['Beginner']}`}
                                        >
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                            <option value="Digital Champion">Digital Champion</option>
                                        </select>
                                        <button
                                            onClick={() => handleDeleteSkill(skill.id)}
                                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                            title="Remove Skill"
                                        >
                                            <Plus className="w-4 h-4 transform rotate-45" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-slate-900 text-lg mb-1">{skill.skill_name}</h3>

                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        {[0, 1, 2, 3].map((idx) => {
                                            const levels = ['Beginner', 'Intermediate', 'Advanced', 'Digital Champion'];
                                            const currentLevelIdx = levels.indexOf(skill.proficiency_level);
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`w-3 h-3 rounded-full transition-colors ${idx <= currentLevelIdx ? 'bg-amber-400' : 'bg-slate-200'}`}
                                                />
                                            );
                                        })}
                                        <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            {skill.proficiency_level}
                                        </span>
                                    </div>

                                    {skill.verified_at ? (
                                        <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase" title="Verified by HR">
                                            <Check className="w-3 h-3" />
                                            Verified
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-slate-400 font-bold uppercase italic">
                                            Self-Assessed
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
