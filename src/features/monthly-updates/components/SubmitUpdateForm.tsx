'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitUpdateAction } from '../actions/submitUpdate.action';
import type { CreateUpdateInput, UpdateStatus } from '../types';
import { FormSelect } from '@/components/ui/form-select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

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
                    <FormSelect
                        id="month"
                        name="month"
                        value={formData.month}
                        onChange={handleChange}
                        required
                        disabled={isEditing}
                    >
                        {monthOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </FormSelect>
                </div>
                
                <div>
                    <label htmlFor="year" className="block text-sm font-medium text-zinc-700 mb-1">
                        Year <span className="text-red-500">*</span>
                    </label>
                    <FormSelect
                        id="year"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        required
                        disabled={isEditing}
                    >
                        {yearOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </FormSelect>
                </div>
            </div>
            
            <div>
                <label htmlFor="achievements" className="block text-sm font-medium text-zinc-700 mb-1">
                    Achievements <span className="text-red-500">*</span>
                </label>
                <Textarea
                    id="achievements"
                    name="achievements"
                    rows={3}
                    placeholder="What did you achieve this month? Key milestones, progress, wins..."
                    value={formData.achievements}
                    onChange={handleChange}
                    required
                />
            </div>
            
            <div>
                <label htmlFor="challenges" className="block text-sm font-medium text-zinc-700 mb-1">
                    Challenges <span className="text-red-500">*</span>
                </label>
                <Textarea
                    id="challenges"
                    name="challenges"
                    rows={3}
                    placeholder="What blockers, risks, or challenges did you face this month?"
                    value={formData.challenges}
                    onChange={handleChange}
                    required
                />
            </div>
            
            <div>
                <label htmlFor="targets" className="block text-sm font-medium text-zinc-700 mb-1">
                    Targets <span className="text-red-500">*</span>
                </label>
                <Textarea
                    id="targets"
                    name="targets"
                    rows={3}
                    placeholder="What are your priorities and goals for next month?"
                    value={formData.targets}
                    onChange={handleChange}
                    required
                />
            </div>
            
            <div className="flex justify-end gap-3">
                {isEditing && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (confirm('Delete this draft?')) {
                                // TODO: Implement delete draft
                            }
                        }}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                        Delete Draft
                    </Button>
                )}
                <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                >
                    {isSubmitting 
                        ? 'Saving...' 
                        : isEditing 
                            ? 'Save Changes' 
                            : 'Save as Draft'
                    }
                </Button>
            </div>
        </form>
    );
}