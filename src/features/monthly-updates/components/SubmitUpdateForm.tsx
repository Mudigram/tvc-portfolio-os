'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitUpdateAction } from '../actions/submitUpdate.action';
import type { CreateUpdateInput, UpdateStatus } from '../types';

interface SubmitUpdateFormProps {
    companyId: string;
    existingUpdate?: {
        id: string;
        month: number;
        year: number;
        achievements: string;
        challenges: string;
        targets: string;
        status: UpdateStatus;
    } | null;
    onSuccess?: () => void;
}

export function SubmitUpdateForm({ companyId, existingUpdate, onSuccess }: SubmitUpdateFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Get current month/year
    const now = new Date();
    const defaultMonth = existingUpdate?.month || now.getMonth() + 1;
    const defaultYear = existingUpdate?.year || now.getFullYear();
    
    const [formData, setFormData] = useState<CreateUpdateInput>({
        company_id: companyId,
        month: defaultMonth,
        year: defaultYear,
        achievements: existingUpdate?.achievements || '',
        challenges: existingUpdate?.challenges || '',
        targets: existingUpdate?.targets || '',
        status: existingUpdate?.status || 'Draft'
    });
    
    const isEditing = !!existingUpdate;
    const isSubmitted = existingUpdate?.status === 'Submitted';
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        
        try {
            const result = await submitUpdateAction(formData);
            
            if (!result.success) {
                setError(result.error || 'Failed to submit update');
                return;
            }
            
            // Reset form if not editing
            if (!isEditing) {
                setFormData({
                    company_id: companyId,
                    month: defaultMonth,
                    year: defaultYear,
                    achievements: '',
                    challenges: '',
                    targets: '',
                    status: 'Draft'
                });
            }
            
            if (onSuccess) {
                onSuccess();
            }
            
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit update');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleChange = (
        e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const monthOptions = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: new Date(2024, i, 1).toLocaleString('default', { month: 'long' })
    }));
    
    const yearOptions = Array.from({ length: 3 }, (_, i) => {
        const year = new Date().getFullYear() - i;
        return { value: year, label: year.toString() };
    });
    
    if (isSubmitted) {
        return (
            <div className="border border-zinc-200 rounded-lg p-6 bg-zinc-50">
                <p className="text-sm text-zinc-500">
                    ✅ Update for {monthOptions[formData.month - 1].label} {formData.year} has been submitted.
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                    Status: {formData.status}
                </p>
            </div>
        );
    }
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4 border border-zinc-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-zinc-900">
                    {isEditing ? 'Edit Monthly Update' : 'Submit Monthly Update'}
                </h3>
                {isEditing && (
                    <span className="text-xs text-zinc-400">
                        Editing draft...
                    </span>
                )}
            </div>
            
            {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                    {error}
                </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="month" className="block text-sm font-medium text-zinc-700 mb-1">
                        Month <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="month"
                        name="month"
                        value={formData.month}
                        onChange={handleChange}
                        required
                        disabled={isEditing}
                        className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-transparent disabled:bg-zinc-50 disabled:text-zinc-400"
                    >
                        {monthOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label htmlFor="year" className="block text-sm font-medium text-zinc-700 mb-1">
                        Year <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="year"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        required
                        disabled={isEditing}
                        className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-transparent disabled:bg-zinc-50 disabled:text-zinc-400"
                    >
                        {yearOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div>
                <label htmlFor="achievements" className="block text-sm font-medium text-zinc-700 mb-1">
                    Achievements <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="achievements"
                    name="achievements"
                    rows={3}
                    placeholder="What did you achieve this month? Key milestones, progress, wins..."
                    value={formData.achievements}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
                />
            </div>
            
            <div>
                <label htmlFor="challenges" className="block text-sm font-medium text-zinc-700 mb-1">
                    Challenges <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="challenges"
                    name="challenges"
                    rows={3}
                    placeholder="What blockers, risks, or challenges did you face this month?"
                    value={formData.challenges}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
                />
            </div>
            
            <div>
                <label htmlFor="targets" className="block text-sm font-medium text-zinc-700 mb-1">
                    Targets <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="targets"
                    name="targets"
                    rows={3}
                    placeholder="What are your priorities and goals for next month?"
                    value={formData.targets}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
                />
            </div>
            
            <div className="flex justify-end gap-3">
                {isEditing && (
                    <button
                        type="button"
                        onClick={() => {
                            if (confirm('Delete this draft?')) {
                                // TODO: Implement delete draft
                                // This will be in the next iteration
                            }
                        }}
                        className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        Delete Draft
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSubmitting 
                        ? 'Saving...' 
                        : isEditing 
                            ? 'Save Changes' 
                            : 'Save as Draft'
                    }
                </button>
            </div>
        </form>
    );
}