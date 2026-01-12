import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/mobile/MobileLayout';
import { MobileGlassCard } from '../../components/mobile/MobileGlassCard';
import { supabase } from '../../lib/supabase';
import {
    Navigation,
    FileText,
    MapPin,
    Truck,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    Camera,
    Clock,
    User,
    Phone,
    FileImage,
    Eye,
    Pencil,
    Trash2,
    Car,
    Wrench,
    X,
    Check
} from 'lucide-react';
import { useUserRole } from '../../hooks/useUserRole';
import { formatLocalDate } from '../../lib/dateUtils';

interface Chantier {
    id: string;
    nom: string;
    reference: string | null;
    adresse_livraison: string | null;
    adresse_livraison_latitude: number | null;
    adresse_livraison_longitude: number | null;
    statut: string;
    categorie: string | null;
    client: {
        nom: string;
        telephone: string | null;
        adresse: string | null;
    } | null;
}

interface Note {
    id: string;
    type: string;
    contenu: string | null;
    photo_1_url: string | null;
    photo_2_url: string | null;
    created_at: string;
    created_by: string | null;
    creator?: { first_name: string; last_name: string } | null;
}

interface Reserve {
    id: string;
    localisation: string | null;
    contenu: string | null;
    statut_reserve: 'ouverte' | 'en_cours' | 'levee' | 'rejetee';
    photo_1_url: string | null;
    photo_2_url: string | null;
    created_at: string;
    created_by: string | null;
    creator?: { first_name: string; last_name: string } | null;
}

interface Phase {
    id: string;
    groupe_phase: number;
    numero_phase: number;
    libelle: string | null;
    date_debut: string;
    heure_debut: string;
    heure_fin: string;
}

interface Document {
    id: string;
    nom: string;
    storage_path: string;
    mime_type: string;
    created_at: string;
    uploader?: { first_name: string; last_name: string } | null;
}

interface Contact {
    id: string;
    role: string | null;
    client: {
        nom: string;
        telephone: string | null;
        email: string | null;
        entreprise: string | null;
    } | null;
}

const RESERVE_STATUS_LABELS: Record<string, string> = {
    ouverte: 'Ouverte',
    en_cours: 'En cours',
    levee: 'Levée',
    rejetee: 'Rejetée'
};

const RESERVE_STATUS_COLORS: Record<string, string> = {
    ouverte: 'bg-rose-500',
    en_cours: 'bg-amber-500',
    levee: 'bg-emerald-500',
    rejetee: 'bg-slate-500'
};

export function MobileChantierDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [chantier, setChantier] = useState<Chantier | null>(null);
    const [reserves, setReserves] = useState<Reserve[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [phases, setPhases] = useState<Phase[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedReserve, setExpandedReserve] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<{ url: string; type: 'image' | 'pdf'; name?: string } | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    // Sections expandables (fermées par défaut sauf réserves)
    const [localisationExpanded, setLocalisationExpanded] = useState(false);
    const [documentsExpanded, setDocumentsExpanded] = useState(false);
    const [informationsExpanded, setInformationsExpanded] = useState(false);
    const [reservesExpanded, setReservesExpanded] = useState(true);

    // Modal Pointage
    const [pointageModalOpen, setPointageModalOpen] = useState(false);
    const [pointageType, setPointageType] = useState<'travail' | 'trajet'>('travail');
    const [pointageDuree, setPointageDuree] = useState('04:00');
    const [pointagePeriode, setPointagePeriode] = useState<'matin' | 'apres_midi'>('matin');
    const [pointageSaving, setPointageSaving] = useState(false);
    const [pointageSuccess, setPointageSuccess] = useState(false);
    const { userId } = useUserRole();

    // Récupérer l'utilisateur connecté
    useEffect(() => {
        supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
            setCurrentUserId(data.user?.id || null);
        });
    }, []);

    const fetchChantier = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        try {
            // Charger le chantier
            const { data: chantierData, error: chantierError } = await supabase
                .from('chantiers')
                .select(`
                    id,
                    nom,
                    reference,
                    adresse_livraison,
                    adresse_livraison_latitude,
                    adresse_livraison_longitude,
                    statut,
                    categorie,
                    client:client_id(nom, telephone, adresse)
                `)
                .eq('id', id)
                .single();

            if (chantierError) throw chantierError;
            setChantier(chantierData as Chantier);

            // Charger les réserves
            const { data: reservesData } = await supabase
                .from('notes_chantiers')
                .select(`
                    id,
                    localisation,
                    contenu,
                    statut_reserve,
                    photo_1_url,
                    photo_2_url,
                    created_at,
                    created_by,
                    creator:created_by(first_name, last_name)
                `)
                .eq('chantier_id', id)
                .eq('type', 'reserve')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            setReserves((reservesData as Reserve[]) || []);

            // Charger les notes (informations - hors réserves)
            const { data: notesData } = await supabase
                .from('notes_chantiers')
                .select(`
                    id,
                    type,
                    contenu,
                    photo_1_url,
                    photo_2_url,
                    created_at,
                    created_by,
                    creator:created_by(first_name, last_name)
                `)
                .eq('chantier_id', id)
                .neq('type', 'reserve')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            setNotes((notesData as Note[]) || []);

            // Charger les phases du jour
            const today = new Date().toISOString().split('T')[0];
            const { data: phasesData } = await supabase
                .from('phases_chantiers')
                .select('id, groupe_phase, numero_phase, libelle, date_debut, heure_debut, heure_fin')
                .eq('chantier_id', id)
                .gte('date_debut', today)
                .order('date_debut', { ascending: true })
                .limit(3);

            setPhases((phasesData as Phase[]) || []);

            // Charger les documents de type "plan"
            const { data: docsData } = await supabase
                .from('documents_chantiers')
                .select(`
                    id,
                    nom,
                    storage_path,
                    mime_type,
                    created_at,
                    uploader:users!uploaded_by(first_name, last_name)
                `)
                .eq('chantier_id', id)
                .eq('type', 'plan')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            setDocuments((docsData as Document[]) || []);

            // Charger les contacts du chantier
            const { data: contactsData } = await supabase
                .from('chantiers_contacts')
                .select(`
                    id,
                    role,
                    client:clients!client_id(nom, telephone, email, entreprise)
                `)
                .eq('chantier_id', id);

            setContacts((contactsData as Contact[]) || []);

        } catch (err) {
            console.error('Erreur chargement chantier:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchChantier();
    }, [fetchChantier]);

    const openGPS = () => {
        if (!chantier) return;
        if (chantier.adresse_livraison_latitude && chantier.adresse_livraison_longitude) {
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${chantier.adresse_livraison_latitude},${chantier.adresse_livraison_longitude}`,
                '_blank'
            );
        } else if (chantier.adresse_livraison) {
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(chantier.adresse_livraison)}`,
                '_blank'
            );
        }
    };

    const callClient = () => {
        if (chantier?.client?.telephone) {
            window.location.href = `tel:${chantier.client.telephone}`;
        }
    };

    const openRapportForm = () => {
        navigate(`/m/chantier/${id}/rapport`);
    };

    const openReserveForm = () => {
        navigate(`/m/chantier/${id}/reserve`);
    };

    const openNoteForm = () => {
        navigate(`/m/chantier/${id}/note`);
    };

    // Convertir durée hh:mm en minutes
    const parseDuration = (duree: string): number => {
        const [h, m] = duree.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
    };

    // Sauvegarder le pointage
    const savePointage = async () => {
        if (!userId || !id) return;

        const duration = parseDuration(pointageDuree);
        if (duration <= 0) {
            alert('La durée doit être supérieure à 0');
            return;
        }

        setPointageSaving(true);
        try {
            const today = formatLocalDate(new Date());
            // Calculer heure_debut et heure_fin à partir de la période
            const heureDebut = pointagePeriode === 'matin' ? '08:00' : '13:00';
            const totalMinutes = (pointagePeriode === 'matin' ? 8 * 60 : 13 * 60) + duration;
            const heureFin = `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;

            const { error } = await supabase.from('pointages').insert({
                poseur_id: userId,
                chantier_id: id,
                date: today,
                periode: pointagePeriode,
                type: pointageType,
                heure_debut: heureDebut,
                heure_fin: heureFin,
                duree_minutes: duration,
                mode_saisie: 'manuel',
                type_trajet: null
            });

            if (error) throw error;

            setPointageSuccess(true);
            setTimeout(() => {
                setPointageModalOpen(false);
                setPointageSuccess(false);
            }, 1500);
        } catch (err) {
            console.error('Erreur pointage:', err);
            alert('Erreur lors de l\'enregistrement du pointage');
        } finally {
            setPointageSaving(false);
        }
    };

    const toggleReserve = (reserveId: string) => {
        setExpandedReserve(expandedReserve === reserveId ? null : reserveId);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm('Supprimer cette note ?')) return;
        await supabase
            .from('notes_chantiers')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', noteId);
        // Rafraîchir les notes
        fetchChantier();
    };

    const handleViewDocument = async (doc: Document) => {
        try {
            const { data, error } = await supabase.storage
                .from('documents')
                .createSignedUrl(doc.storage_path, 3600);

            if (error || !data?.signedUrl) {
                // En mode mock, les fichiers n'existent pas réellement
                alert(`Document : ${doc.nom}\n\nFichier non disponible en mode démonstration.`);
                return;
            }

            // Déterminer le type de preview
            const type = doc.mime_type === 'application/pdf' ? 'pdf' : 'image';
            setPreviewData({ url: data.signedUrl, type, name: doc.nom });
        } catch (err) {
            console.error('Erreur ouverture document:', err);
            alert('Erreur lors de l\'ouverture du document');
        }
    };

    const reservesOuvertes = reserves.filter(r => r.statut_reserve === 'ouverte');

    if (loading) {
        return (
            <MobileLayout title="CHANTIER" showBack>
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </MobileLayout>
        );
    }

    if (!chantier) {
        return (
            <MobileLayout title="CHANTIER" showBack>
                <div className="p-4">
                    <MobileGlassCard className="p-8 text-center">
                        <p className="text-slate-400">Chantier introuvable</p>
                    </MobileGlassCard>
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout
            title={chantier.reference ? `${chantier.reference} - ${chantier.nom}` : chantier.nom}
            showBack
            showBottomNav
        >
            <div className="p-4 space-y-4">
                {/* Boutons Actions */}
                <div data-testid="action-buttons" className="grid grid-cols-3 gap-2">
                    <button
                        data-testid="btn-gps"
                        onClick={openGPS}
                        className="flex items-center justify-center gap-1.5 py-3 px-2 bg-sky-500/20 text-sky-400 rounded-2xl font-black text-[10px] uppercase tracking-wider active:scale-95 transition-transform"
                    >
                        <Navigation size={16} />
                        GPS
                    </button>
                    <button
                        data-testid="btn-rapport"
                        onClick={openRapportForm}
                        className="flex items-center justify-center gap-1.5 py-3 px-2 bg-emerald-500/20 text-emerald-400 rounded-2xl font-black text-[10px] uppercase tracking-wider active:scale-95 transition-transform"
                    >
                        <FileText size={16} />
                        Rapport
                    </button>
                    <button
                        data-testid="btn-pointage"
                        onClick={() => setPointageModalOpen(true)}
                        className="flex items-center justify-center gap-1.5 py-3 px-2 bg-amber-500/20 text-amber-400 rounded-2xl font-black text-[10px] uppercase tracking-wider active:scale-95 transition-transform"
                    >
                        <Clock size={16} />
                        Pointage
                    </button>
                </div>

                {/* Section Localisation & Contacts - Expandable */}
                <MobileGlassCard data-testid="section-localisation" className="p-4">
                    <button
                        data-testid="btn-expand-localisation"
                        onClick={() => setLocalisationExpanded(!localisationExpanded)}
                        className="w-full flex items-center gap-2"
                    >
                        <ChevronDown
                            size={16}
                            className={`text-slate-500 transition-transform ${localisationExpanded ? '' : '-rotate-90'}`}
                        />
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Localisation & Contacts ({contacts.length})
                        </h2>
                    </button>

                    {localisationExpanded && (
                        <div className="mt-3 space-y-3">
                            {/* Adresse chantier */}
                            {chantier.adresse_livraison && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                                        <MapPin size={16} className="text-sky-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">Chantier</p>
                                        <p className="text-sm text-white">{chantier.adresse_livraison}</p>
                                    </div>
                                </div>
                            )}

                            {/* Adresse client (si différente) */}
                            {chantier.client?.adresse && chantier.client.adresse !== chantier.adresse_livraison && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                        <Truck size={16} className="text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">Client</p>
                                        <p className="text-sm text-white">{chantier.client.adresse}</p>
                                    </div>
                                </div>
                            )}

                            {/* Contacts du chantier */}
                            {contacts.length > 0 && (
                                <div className="pt-2 border-t border-slate-700/50">
                                    <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Contacts</p>
                                    <div className="space-y-2">
                                        {contacts.map(c => (
                                            <div key={c.id} className="flex gap-3 py-2 bg-slate-800/30 rounded-lg px-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                                    <User size={16} className="text-indigo-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white">
                                                        {c.client?.nom}
                                                    </p>
                                                    {c.role && (
                                                        <p className="text-[10px] text-indigo-400 uppercase font-bold">
                                                            {c.role}
                                                        </p>
                                                    )}
                                                    {c.client?.entreprise && (
                                                        <p className="text-[10px] text-slate-500">
                                                            {c.client.entreprise}
                                                        </p>
                                                    )}
                                                </div>
                                                {c.client?.telephone && (
                                                    <a
                                                        href={`tel:${c.client.telephone}`}
                                                        className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Phone size={14} className="text-emerald-400" />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Téléphone client (si pas de contacts) */}
                            {contacts.length === 0 && chantier.client?.telephone && (
                                <button
                                    onClick={callClient}
                                    className="flex gap-3 w-full text-left"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <Phone size={16} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">Contact Client</p>
                                        <p className="text-sm text-emerald-400">{chantier.client.telephone}</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    )}
                </MobileGlassCard>

                {/* Phases à venir */}
                {phases.length > 0 && (
                    <MobileGlassCard className="p-4">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                            Prochaines interventions
                        </h2>
                        <div className="space-y-2">
                            {phases.map(phase => (
                                <div key={phase.id} className="flex items-center gap-3 py-2 border-b border-slate-700/30 last:border-0">
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                        <Clock size={14} className="text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-white">
                                            {phase.libelle || `Phase ${phase.groupe_phase}.${phase.numero_phase}`}
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                            {new Date(phase.date_debut).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            {' • '}
                                            {phase.heure_debut.substring(0, 5)}-{phase.heure_fin.substring(0, 5)}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                                        {phase.groupe_phase}.{phase.numero_phase}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </MobileGlassCard>
                )}

                {/* Section Documents (Plans) - Expandable */}
                <MobileGlassCard className="p-4">
                    <button
                        onClick={() => setDocumentsExpanded(!documentsExpanded)}
                        className="w-full flex items-center gap-2"
                    >
                        <ChevronDown
                            size={16}
                            className={`text-slate-500 transition-transform ${documentsExpanded ? '' : '-rotate-90'}`}
                        />
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Documents ({documents.length})
                        </h2>
                    </button>
                    {documentsExpanded && (
                        <div className="mt-3">
                            {documents.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">Aucun document disponible</p>
                            ) : (
                                <div className="space-y-2">
                                    {documents.map(doc => (
                                        <button
                                            key={doc.id}
                                            onClick={() => handleViewDocument(doc)}
                                            className="w-full flex items-center gap-3 py-2 px-3 bg-slate-800/50 rounded-xl active:scale-98 transition-transform text-left"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                                <FileImage size={18} className="text-indigo-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-white truncate">
                                                    {doc.nom}
                                                </p>
                                                <p className="text-[10px] text-slate-500">
                                                    {formatDate(doc.created_at)}
                                                    {doc.uploader && (
                                                        <span className="text-sky-400 ml-1">
                                                            • {doc.uploader.first_name} {doc.uploader.last_name?.charAt(0)}.
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <Eye size={16} className="text-sky-400 flex-shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </MobileGlassCard>

                {/* Section Informations - Expandable */}
                <MobileGlassCard className="p-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setInformationsExpanded(!informationsExpanded)}
                            className="flex items-center gap-2"
                        >
                            <ChevronDown
                                size={16}
                                className={`text-slate-500 transition-transform ${informationsExpanded ? '' : '-rotate-90'}`}
                            />
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Informations ({notes.length})
                            </h2>
                        </button>
                        <button
                            onClick={openNoteForm}
                            className="text-[10px] font-black uppercase tracking-widest text-sky-400"
                        >
                            + Ajouter
                        </button>
                    </div>
                    {informationsExpanded && (
                        <div className="mt-3">
                            {notes.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">Aucune information</p>
                            ) : (
                                <div className="space-y-3">
                                    {notes.map(note => (
                                        <div key={note.id} className="flex gap-3 border-b border-slate-700/30 pb-3 last:border-0 last:pb-0">
                                            {/* Contenu à gauche */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
                                                    <span>{formatDate(note.created_at)}</span>
                                                    {note.creator && (
                                                        <span className="text-sky-400">
                                                            • {note.creator.first_name} {note.creator.last_name?.charAt(0)}.
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-300">
                                                    {note.contenu || <span className="italic text-slate-500">Pas de texte</span>}
                                                </p>
                                            </div>
                                            {/* Vignettes (réduites 50%) */}
                                            {(note.photo_1_url || note.photo_2_url) && (
                                                <div className="flex gap-1 flex-shrink-0">
                                                    {note.photo_1_url && (
                                                        <img
                                                            src={note.photo_1_url}
                                                            alt="Photo 1"
                                                            className="w-8 h-8 object-cover rounded cursor-pointer"
                                                            onClick={() => setPreviewData({ url: note.photo_1_url!, type: 'image', name: 'Photo' })}
                                                        />
                                                    )}
                                                    {note.photo_2_url && (
                                                        <img
                                                            src={note.photo_2_url}
                                                            alt="Photo 2"
                                                            className="w-8 h-8 object-cover rounded cursor-pointer"
                                                            onClick={() => setPreviewData({ url: note.photo_2_url!, type: 'image', name: 'Photo' })}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                            {/* Actions (seulement pour ses propres notes) */}
                                            {note.created_by === currentUserId && (
                                                <div className="flex flex-col gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={() => navigate(`/m/chantier/${id}/note?edit=${note.id}`)}
                                                        className="p-1.5 bg-slate-800/50 rounded text-slate-400 hover:text-sky-400"
                                                        title="Modifier"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteNote(note.id)}
                                                        className="p-1.5 bg-slate-800/50 rounded text-slate-400 hover:text-red-400"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </MobileGlassCard>

                {/* Section Réserves - Expandable */}
                <MobileGlassCard className="p-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setReservesExpanded(!reservesExpanded)}
                            className="flex items-center gap-2"
                        >
                            <ChevronDown
                                size={16}
                                className={`text-slate-500 transition-transform ${reservesExpanded ? '' : '-rotate-90'}`}
                            />
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Réserves
                            </h2>
                            {reservesOuvertes.length > 0 && (
                                <span className="flex items-center gap-1 text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full">
                                    <AlertTriangle size={10} />
                                    <span className="text-[10px] font-bold">{reservesOuvertes.length}</span>
                                </span>
                            )}
                        </button>
                        <button
                            onClick={openReserveForm}
                            className="text-[10px] font-black uppercase tracking-widest text-sky-400"
                        >
                            + Ajouter
                        </button>
                    </div>

                    {reservesExpanded && (
                        <div className="mt-3">
                            {reserves.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">
                                    Aucune réserve signalée
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {reserves.map(reserve => (
                                        <div
                                            key={reserve.id}
                                            className="bg-slate-800/50 rounded-xl overflow-hidden"
                                        >
                                            {/* Header réserve (cliquable) */}
                                            <button
                                                onClick={() => toggleReserve(reserve.id)}
                                                className="w-full flex items-center gap-3 p-3"
                                            >
                                                <span className={`w-2 h-2 rounded-full ${RESERVE_STATUS_COLORS[reserve.statut_reserve]}`} />
                                                <div className="flex-1 text-left">
                                                    <p className="text-xs font-bold text-white uppercase">
                                                        {reserve.localisation || 'Non localisée'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500">
                                                        {RESERVE_STATUS_LABELS[reserve.statut_reserve]} • {formatDate(reserve.created_at)}
                                                    </p>
                                                </div>
                                                {(reserve.photo_1_url || reserve.photo_2_url) && (
                                                    <Camera size={14} className="text-slate-500" />
                                                )}
                                                {expandedReserve === reserve.id ? (
                                                    <ChevronUp size={16} className="text-slate-500" />
                                                ) : (
                                                    <ChevronDown size={16} className="text-slate-500" />
                                                )}
                                            </button>

                                            {/* Contenu expandé */}
                                            {expandedReserve === reserve.id && (
                                                <div className="px-3 pb-3 pt-0 border-t border-slate-700/50">
                                                    {/* Description */}
                                                    {reserve.contenu && (
                                                        <p className="text-sm text-slate-300 mt-3 mb-3">
                                                            {reserve.contenu}
                                                        </p>
                                                    )}

                                                    {/* Photos */}
                                                    {(reserve.photo_1_url || reserve.photo_2_url) && (
                                                        <div className="flex gap-2 mb-3">
                                                            {reserve.photo_1_url && (
                                                                <img
                                                                    src={reserve.photo_1_url}
                                                                    alt="Photo 1"
                                                                    className="w-20 h-20 object-cover rounded-lg"
                                                                />
                                                            )}
                                                            {reserve.photo_2_url && (
                                                                <img
                                                                    src={reserve.photo_2_url}
                                                                    alt="Photo 2"
                                                                    className="w-20 h-20 object-cover rounded-lg"
                                                                />
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Créateur */}
                                                    {reserve.creator && (
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                            <User size={10} />
                                                            <span>
                                                                Signalée par {reserve.creator.first_name} {reserve.creator.last_name}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </MobileGlassCard>
            </div>

            {/* Modal Preview Plein Écran (Image ou PDF) */}
            {previewData && (
                <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 safe-area-top">
                        <p className="text-white font-medium truncate flex-1 mr-4">
                            {previewData.name || 'Aperçu'}
                        </p>
                        <button
                            onClick={() => setPreviewData(null)}
                            className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors flex-shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {/* Content */}
                    <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                        {previewData.type === 'image' ? (
                            <img
                                src={previewData.url}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain"
                            />
                        ) : (
                            <iframe
                                src={previewData.url}
                                title="PDF Preview"
                                className="w-full h-full bg-white rounded-lg"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Modal Pointage */}
            {pointageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPointageModalOpen(false)}>
                    <div
                        className="w-full max-w-sm bg-slate-900 rounded-3xl p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-black text-white">Pointage</h2>
                            <button
                                onClick={() => setPointageModalOpen(false)}
                                className="p-2 rounded-full bg-slate-800 text-slate-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {pointageSuccess ? (
                            <div className="flex flex-col items-center justify-center py-6">
                                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                                    <Check size={28} className="text-emerald-400" />
                                </div>
                                <p className="text-emerald-400 font-bold">Pointage enregistré !</p>
                            </div>
                        ) : (
                            <>
                                {/* Type de pointage */}
                                <div className="mb-4">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                                        Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setPointageType('travail')}
                                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                                pointageType === 'travail'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-slate-800 text-slate-400'
                                            }`}
                                        >
                                            <Wrench size={16} />
                                            Travail
                                        </button>
                                        <button
                                            onClick={() => setPointageType('trajet')}
                                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                                pointageType === 'trajet'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-slate-800 text-slate-400'
                                            }`}
                                        >
                                            <Car size={16} />
                                            Trajet
                                        </button>
                                    </div>
                                </div>

                                {/* Période */}
                                <div className="mb-4">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                                        Période
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setPointagePeriode('matin')}
                                            className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
                                                pointagePeriode === 'matin'
                                                    ? 'bg-sky-500 text-white'
                                                    : 'bg-slate-800 text-slate-400'
                                            }`}
                                        >
                                            Matin
                                        </button>
                                        <button
                                            onClick={() => setPointagePeriode('apres_midi')}
                                            className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
                                                pointagePeriode === 'apres_midi'
                                                    ? 'bg-sky-500 text-white'
                                                    : 'bg-slate-800 text-slate-400'
                                            }`}
                                        >
                                            Après-midi
                                        </button>
                                    </div>
                                </div>

                                {/* Durée */}
                                <div className="mb-5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                                        Durée (hh:mm)
                                    </label>
                                    <input
                                        type="time"
                                        value={pointageDuree}
                                        onChange={(e) => setPointageDuree(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-center font-bold text-lg"
                                    />
                                </div>

                                {/* Bouton Enregistrer */}
                                <button
                                    onClick={savePointage}
                                    disabled={pointageSaving}
                                    className="w-full py-3.5 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-wider active:scale-95 transition-transform disabled:opacity-50"
                                >
                                    {pointageSaving ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </MobileLayout>
    );
}
