import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from '../../components/mobile/MobileLayout';
import { MobileGlassCard } from '../../components/mobile/MobileGlassCard';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';
import { Camera, X, Loader2 } from 'lucide-react';

export function MobileNoteForm() {
    const { id: chantierId } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const editNoteId = searchParams.get('edit');
    const navigate = useNavigate();
    const { userId } = useUserRole();

    const [contenu, setContenu] = useState('');
    const [photo1, setPhoto1] = useState<string | null>(null);
    const [photo2, setPhoto2] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(!!editNoteId);
    const [error, setError] = useState<string | null>(null);

    const fileInput1Ref = useRef<HTMLInputElement>(null);
    const fileInput2Ref = useRef<HTMLInputElement>(null);

    // Charger la note existante en mode édition
    useEffect(() => {
        if (!editNoteId) return;

        const fetchNote = async () => {
            const { data } = await supabase
                .from('notes_chantiers')
                .select('contenu, photo_1_url, photo_2_url')
                .eq('id', editNoteId)
                .single();

            if (data) {
                setContenu(data.contenu || '');
                setPhoto1(data.photo_1_url);
                setPhoto2(data.photo_2_url);
            }
            setLoading(false);
        };

        fetchNote();
    }, [editNoteId]);

    const compressImage = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height = (height * MAX_SIZE) / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width = (width * MAX_SIZE) / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handlePhotoSelect = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setPhoto: (url: string | null) => void
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressed = await compressImage(file);
            setPhoto(compressed);
        } catch (err) {
            console.error('Erreur compression image:', err);
            setError('Erreur lors du chargement de la photo');
        }
    };

    const handleSubmit = async () => {
        if (!chantierId || !userId) return;
        if (!contenu.trim() && !photo1 && !photo2) {
            setError('Veuillez saisir un texte ou ajouter une photo');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            if (editNoteId) {
                // Mode édition : mise à jour
                const { error: updateError } = await supabase
                    .from('notes_chantiers')
                    .update({
                        contenu: contenu.trim() || null,
                        photo_1_url: photo1,
                        photo_2_url: photo2
                    })
                    .eq('id', editNoteId);

                if (updateError) throw updateError;
            } else {
                // Mode création : insertion
                const { error: insertError } = await supabase
                    .from('notes_chantiers')
                    .insert({
                        chantier_id: chantierId,
                        type: 'note',
                        contenu: contenu.trim() || null,
                        photo_1_url: photo1,
                        photo_2_url: photo2,
                        created_by: userId,
                        deleted_at: null
                    });

                if (insertError) throw insertError;
            }

            navigate(`/m/chantier/${chantierId}`, { replace: true });
        } catch (err) {
            console.error('Erreur note:', err);
            setError(editNoteId ? 'Erreur lors de la modification' : 'Erreur lors de la création');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <MobileLayout title={editNoteId ? 'MODIFIER NOTE' : 'NOUVELLE NOTE'} showBack>
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout title={editNoteId ? 'MODIFIER NOTE' : 'NOUVELLE NOTE'} showBack>
            <div className="p-4 space-y-4">
                <MobileGlassCard className="p-4 space-y-4">
                    {/* Contenu */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                            Information
                        </label>
                        <textarea
                            value={contenu}
                            onChange={(e) => setContenu(e.target.value)}
                            placeholder="Saisissez votre note..."
                            rows={5}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
                        />
                    </div>

                    {/* Photos */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                            Photos (optionnel)
                        </label>
                        <div className="flex gap-3">
                            {/* Photo 1 */}
                            <div className="relative">
                                {photo1 ? (
                                    <div className="relative w-24 h-24">
                                        <img
                                            src={photo1}
                                            alt="Photo 1"
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                        <button
                                            onClick={() => setPhoto1(null)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInput1Ref.current?.click()}
                                        className="w-24 h-24 bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 active:bg-slate-700/50"
                                    >
                                        <Camera size={24} />
                                        <span className="text-[9px] font-bold">Photo 1</span>
                                    </button>
                                )}
                                <input
                                    ref={fileInput1Ref}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => handlePhotoSelect(e, setPhoto1)}
                                    className="hidden"
                                />
                            </div>

                            {/* Photo 2 */}
                            <div className="relative">
                                {photo2 ? (
                                    <div className="relative w-24 h-24">
                                        <img
                                            src={photo2}
                                            alt="Photo 2"
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                        <button
                                            onClick={() => setPhoto2(null)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInput2Ref.current?.click()}
                                        className="w-24 h-24 bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 active:bg-slate-700/50"
                                    >
                                        <Camera size={24} />
                                        <span className="text-[9px] font-bold">Photo 2</span>
                                    </button>
                                )}
                                <input
                                    ref={fileInput2Ref}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => handlePhotoSelect(e, setPhoto2)}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Erreur */}
                    {error && (
                        <div className="bg-rose-500/20 border border-rose-500/50 rounded-xl px-4 py-3 text-rose-400 text-sm">
                            {error}
                        </div>
                    )}
                </MobileGlassCard>

                {/* Boutons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        disabled={saving}
                        className="flex-1 py-4 bg-slate-800/50 text-slate-300 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-50"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 py-4 bg-sky-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Envoi...
                            </>
                        ) : (
                            'Enregistrer'
                        )}
                    </button>
                </div>
            </div>
        </MobileLayout>
    );
}
