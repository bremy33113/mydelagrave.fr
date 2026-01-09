import { Car, Calendar, Clock, MapPinOff, Home } from 'lucide-react';
import { TourneeStep } from './TourneeMap';
import { formatDuration } from './hooks/useOSRMRoute';

function isHomeRoute(steps: TourneeStep[], index: number): boolean {
    if (index === 0) return false;
    const prevStep = steps[index - 1];
    const currentStep = steps[index];
    return !!(prevStep.isHomeStep || currentStep.isHomeStep);
}

interface TourneeStepsListProps {
    steps: TourneeStep[];
    legDurations: number[]; // Travel time between each step (seconds)
    selectedStepId?: string;
    onStepClick: (stepId: string) => void;
}

export function TourneeStepsList({
    steps,
    legDurations,
    selectedStepId,
    onStepClick,
}: TourneeStepsListProps) {
    return (
        <div className="flex flex-col gap-2 overflow-y-auto">
            {steps.map((step, index) => (
                <div key={step.id}>
                    {/* Travel time from previous step */}
                    {index > 0 && legDurations[index - 1] !== undefined && (
                        <div className={`flex items-center gap-2 py-1.5 px-3 text-xs ${
                            isHomeRoute(steps, index) ? 'text-orange-400' : 'text-slate-500'
                        }`}>
                            <Car className="w-3 h-3" />
                            <span>{formatDuration(legDurations[index - 1])}</span>
                            <div className={`flex-1 border-t border-dashed ${
                                isHomeRoute(steps, index) ? 'border-orange-500' : 'border-slate-600'
                            }`} />
                        </div>
                    )}

                    {/* Step card */}
                    <button
                        onClick={() => onStepClick(step.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedStepId === step.id
                                ? step.isHomeStep
                                    ? 'bg-orange-500/20 border-orange-500'
                                    : 'bg-blue-500/20 border-blue-500'
                                : step.isHomeStep
                                    ? 'bg-orange-900/20 border-orange-700/50 hover:bg-orange-800/30'
                                    : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            {/* Number badge or Home icon */}
                            {step.isHomeStep ? (
                                <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        selectedStepId === step.id
                                            ? 'bg-orange-500 ring-2 ring-white'
                                            : 'bg-orange-500'
                                    }`}
                                >
                                    <Home className="w-4 h-4 text-white" />
                                </div>
                            ) : (
                                <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                        selectedStepId === step.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-700 text-white'
                                    }`}
                                >
                                    {step.order}
                                </div>
                            )}

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${step.isHomeStep ? 'text-orange-400' : 'text-white'}`}>
                                    {step.isHomeStep
                                        ? (step.type === 'home_departure' ? 'Depart domicile' : 'Retour domicile')
                                        : (step.chantierReference || step.chantierNom)
                                    }
                                </p>
                                <p className="text-xs text-slate-400 truncate mt-0.5">
                                    {step.adresse || 'Adresse non renseignee'}
                                </p>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDateFr(step.dateDebut)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {step.heureCalculee || step.heureDebut}
                                    </span>
                                    {!step.isHomeStep && <span>{step.durationHours}h</span>}
                                </div>
                            </div>

                            {/* GPS warning */}
                            {!step.latitude && (
                                <span title="Coordonnees GPS manquantes">
                                    <MapPinOff className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                </span>
                            )}
                        </div>
                    </button>
                </div>
            ))}
        </div>
    );
}

function formatDateFr(dateStr: string): string {
    // Parse as local date (not UTC) to avoid timezone shift
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const dayName = days[date.getDay()];
    return `${dayName} ${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
}
