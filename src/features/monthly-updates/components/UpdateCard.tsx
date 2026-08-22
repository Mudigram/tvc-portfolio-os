import { formatDate } from '@/lib/utils';
import type { MonthlyUpdate } from '../types';

interface UpdateCardProps {
    update: MonthlyUpdate;
    isLatest?: boolean;
}

export function UpdateCard({ update, isLatest = false }: UpdateCardProps) {
    const statusColors: Record<string, string> = {
        Draft: 'bg-gray-100 text-gray-700 border-gray-200',
        Submitted: 'bg-blue-100 text-blue-700 border-blue-200',
        Reviewed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        Verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Needs Correction': 'bg-amber-100 text-amber-700 border-amber-200',
    };
    
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return (
        <div className={`border rounded-lg p-6 transition-all ${
            isLatest ? 'border-blue-200 bg-blue-50/30' : 'border-zinc-200'
        }`}>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium text-zinc-900">
                            {monthNames[update.month - 1]} {update.year}
                        </h4>
                        {isLatest && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                Latest
                            </span>
                        )}
                    </div>
                    {update.submitted_at && (
                        <time className="text-sm text-zinc-500" dateTime={update.submitted_at}>
                            Submitted: {formatDate(new Date(update.submitted_at))}
                        </time>
                    )}
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusColors[update.status]}`}>
                    {update.status}
                </span>
            </div>
            
            <div className="space-y-4">
                <div>
                    <h5 className="text-sm font-medium text-zinc-700 mb-1">Achievements</h5>
                    <p className="text-sm text-zinc-600 whitespace-pre-wrap">
                        {update.achievements}
                    </p>
                </div>
                
                <div>
                    <h5 className="text-sm font-medium text-zinc-700 mb-1">Challenges</h5>
                    <p className="text-sm text-zinc-600 whitespace-pre-wrap">
                        {update.challenges}
                    </p>
                </div>
                
                <div>
                    <h5 className="text-sm font-medium text-zinc-700 mb-1">Targets</h5>
                    <p className="text-sm text-zinc-600 whitespace-pre-wrap">
                        {update.targets}
                    </p>
                </div>
                
                <div className="text-xs text-zinc-400">
                    Submitted by: {update.submitted_by}
                </div>
            </div>
        </div>
    );
}