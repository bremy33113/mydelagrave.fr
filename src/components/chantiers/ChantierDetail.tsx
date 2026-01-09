import { useState } from 'react';
import { ChantierDetailHeader } from './ChantierDetailHeader';
import { ChantierCoordonnees } from './ChantierCoordonnees';
import { ChantierContactsList } from './ChantierContactsList';
import { ChantierNotesSection } from './ChantierNotesSection';
import { ChantierDocumentsSection } from './ChantierDocumentsSection';
import { ChantierReservesSection } from './ChantierReservesSection';
import { ChantierCompletionStatus } from './ChantierCompletionStatus';
import { PhotoModal } from './PhotoModal';
import type { Chantier } from './types';

interface ChantierDetailProps {
    chantier: Chantier;
    onEdit?: () => void;
    onDelete?: () => void;
    onManagePhases?: () => void;
    onManageContacts?: () => void;
    onStatusChange?: () => void;
}

export function ChantierDetail({
    chantier,
    onEdit,
    onDelete,
    onManagePhases,
    onManageContacts,
    onStatusChange,
}: ChantierDetailProps) {
    const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);

    return (
        <div className="h-full flex flex-col animate-fadeIn">
            {/* Header */}
            <ChantierDetailHeader
                chantier={chantier}
                onEdit={onEdit}
                onDelete={onDelete}
                onManagePhases={onManagePhases}
                onManageContacts={onManageContacts}
                onStatusChange={onStatusChange}
            />

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Coordonnées chantier */}
                {(chantier.client || chantier.adresse_livraison) && (
                    <ChantierCoordonnees
                        client={chantier.client}
                        adresseLivraison={chantier.adresse_livraison}
                        latitude={chantier.adresse_livraison_latitude}
                        longitude={chantier.adresse_livraison_longitude}
                    >
                        <ChantierContactsList chantierId={chantier.id} />
                    </ChantierCoordonnees>
                )}

                {/* Notes / Informations */}
                <ChantierNotesSection
                    chantierId={chantier.id}
                    onPhotoClick={setPhotoModalUrl}
                />

                {/* Documents */}
                <ChantierDocumentsSection chantierId={chantier.id} />

                {/* Réserves */}
                <ChantierReservesSection
                    chantierId={chantier.id}
                    onPhotoClick={setPhotoModalUrl}
                />

                {/* État de complétion */}
                <ChantierCompletionStatus
                    reservesLevees={chantier.reserves_levees}
                    doeFourni={chantier.doe_fourni}
                />
            </div>

            {/* Photo Modal */}
            <PhotoModal url={photoModalUrl} onClose={() => setPhotoModalUrl(null)} />
        </div>
    );
}
