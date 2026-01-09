import { CheckCircle, XCircle } from 'lucide-react';

interface ChantierCompletionStatusProps {
    reservesLevees?: boolean | null;
    doeFourni?: boolean | null;
}

export function ChantierCompletionStatus({ reservesLevees, doeFourni }: ChantierCompletionStatusProps) {
    return (
        <section className="glass-card p-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                État de complétion
            </h3>
            <div className="grid grid-cols-2 gap-3">
                <div
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                        reservesLevees
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-slate-800/50 text-slate-400'
                    }`}
                >
                    {reservesLevees ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <XCircle className="w-5 h-5" />
                    )}
                    <span className="text-sm">Réserves levées</span>
                </div>
                <div
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                        doeFourni
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-slate-800/50 text-slate-400'
                    }`}
                >
                    {doeFourni ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <XCircle className="w-5 h-5" />
                    )}
                    <span className="text-sm">DOE fourni</span>
                </div>
            </div>
        </section>
    );
}
