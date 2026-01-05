import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { IconSelector } from './IconSelector';
import { ColorSelector } from './ColorSelector';

export interface FieldConfig {
    key: string;
    label: string;
    type: 'text' | 'icon' | 'color' | 'number';
    required?: boolean;
    primaryKey?: boolean;
    hidden?: boolean; // Masquer dans l'UI (ex: code auto-généré)
}

interface RefTableEditorProps {
    tableName: string;
    title: string;
    fields: FieldConfig[];
}

type RefItem = Record<string, unknown>;

function generateCode(label: string): string {
    return label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
}

export function RefTableEditor({ tableName, title, fields }: RefTableEditorProps) {
    const [items, setItems] = useState<RefItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<RefItem>({});
    const [saving, setSaving] = useState(false);

    const primaryKeyField = fields.find(f => f.primaryKey)?.key || 'code';
    const labelField = fields.find(f => f.key === 'label' || f.key === 'libelle')?.key || 'label';
    const visibleFields = fields.filter(f => !f.hidden);

    // Fetch items
    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .order(labelField);

            if (error) {
                console.error('Error fetching items:', error);
            } else {
                setItems(data || []);
            }
            setLoading(false);
        };
        fetchItems();
    }, [tableName, labelField]);

    const handleAdd = () => {
        const initialData: RefItem = {};
        fields.forEach(f => {
            if (f.type === 'icon') initialData[f.key] = '👤';
            else if (f.type === 'color') initialData[f.key] = '#3B82F6';
            else if (f.type === 'number') initialData[f.key] = 0;
            else initialData[f.key] = '';
        });
        setFormData(initialData);
        setIsAdding(true);
        setEditingId(null);
    };

    const handleEdit = (item: RefItem) => {
        setFormData({ ...item });
        setEditingId(item[primaryKeyField] as string);
        setIsAdding(false);
    };

    const handleCancel = () => {
        setFormData({});
        setEditingId(null);
        setIsAdding(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Auto-generate code from label if empty
            if (primaryKeyField === 'code' && !formData.code && formData[labelField]) {
                formData.code = generateCode(formData[labelField] as string);
            }
            if (primaryKeyField === 'id' && !formData.id && formData[labelField]) {
                formData.id = generateCode(formData[labelField] as string);
            }

            if (isAdding) {
                const { error } = await supabase
                    .from(tableName)
                    .insert([formData]);

                if (error) {
                    if (error.message.includes('duplicate') || error.message.includes('unique')) {
                        alert('Ce code existe déjà');
                    } else {
                        alert('Erreur: ' + error.message);
                    }
                    setSaving(false);
                    return;
                }
            } else {
                const { error } = await supabase
                    .from(tableName)
                    .update(formData)
                    .eq(primaryKeyField, editingId);

                if (error) {
                    alert('Erreur: ' + error.message);
                    setSaving(false);
                    return;
                }
            }

            // Refresh list
            const { data } = await supabase
                .from(tableName)
                .select('*')
                .order(labelField);
            setItems(data || []);
            handleCancel();
        } catch (err) {
            console.error('Error saving:', err);
            alert('Erreur: ' + (err as Error).message);
        }
        setSaving(false);
    };

    const handleDelete = async (item: RefItem) => {
        const pk = item[primaryKeyField] as string;
        if (!confirm(`Supprimer "${item[labelField]}" ?`)) return;

        try {
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq(primaryKeyField, pk);

            if (error) {
                alert('Erreur: ' + error.message);
                return;
            }

            setItems(items.filter(i => i[primaryKeyField] !== pk));
        } catch (err) {
            console.error('Error deleting:', err);
            alert('Erreur: ' + (err as Error).message);
        }
    };

    const updateField = (key: string, value: unknown) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const renderField = (field: FieldConfig, isForm: boolean = false) => {
        const value = formData[field.key];

        if (!isForm) {
            // Display mode
            if (field.type === 'icon') {
                return <span className="text-xl">{value as string || '—'}</span>;
            }
            if (field.type === 'color') {
                return value ? (
                    <div
                        className="w-6 h-6 rounded-lg border border-slate-600"
                        style={{ backgroundColor: value as string }}
                        title={value as string}
                    />
                ) : <span className="text-slate-500">—</span>;
            }
            return <span className="text-slate-300">{value as string || '—'}</span>;
        }

        // Form mode
        if (field.type === 'icon') {
            return <IconSelector value={value as string || ''} onChange={(v) => updateField(field.key, v)} />;
        }
        if (field.type === 'color') {
            return <ColorSelector value={value as string || ''} onChange={(v) => updateField(field.key, v)} />;
        }
        if (field.type === 'number') {
            return (
                <input
                    type="number"
                    value={value as number || 0}
                    onChange={(e) => updateField(field.key, parseInt(e.target.value) || 0)}
                    className="input-field"
                />
            );
        }
        return (
            <input
                type="text"
                value={value as string || ''}
                onChange={(e) => updateField(field.key, e.target.value)}
                className="input-field"
                placeholder={field.label}
            />
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <button
                    onClick={handleAdd}
                    disabled={isAdding || editingId !== null}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Ajouter
                </button>
            </div>

            {/* Add form */}
            {isAdding && (
                <div className="p-4 bg-slate-800/50 rounded-lg border border-blue-500/50 space-y-4">
                    <p className="text-sm font-medium text-blue-400">Nouvel élément</p>
                    <div className="grid grid-cols-2 gap-4">
                        {visibleFields.map(field => (
                            <div key={field.key} className={field.type === 'icon' ? 'col-span-2' : ''}>
                                <label className="input-label">{field.label}</label>
                                {renderField(field, true)}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleCancel}
                            className="px-3 py-1.5 text-slate-400 hover:text-white text-sm"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Enregistrer
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-slate-800/30 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700">
                            {visibleFields.map(field => (
                                <th key={field.key} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                    {field.label}
                                </th>
                            ))}
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase w-24">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {items.map((item) => {
                            const pk = item[primaryKeyField] as string;
                            const isEditing = editingId === pk;

                            return (
                                <tr key={pk} className={isEditing ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'}>
                                    {visibleFields.map(field => (
                                        <td key={field.key} className="px-4 py-3">
                                            {isEditing ? renderField(field, true) : (
                                                <span className={field.type === 'icon' ? 'text-xl' : 'text-sm text-slate-300'}>
                                                    {field.type === 'color' && item[field.key] ? (
                                                        <div
                                                            className="w-6 h-6 rounded-lg border border-slate-600"
                                                            style={{ backgroundColor: item[field.key] as string }}
                                                        />
                                                    ) : (
                                                        item[field.key] as string || '—'
                                                    )}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        onClick={handleCancel}
                                                        className="p-1.5 text-slate-400 hover:text-white rounded"
                                                        title="Annuler"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleSave}
                                                        disabled={saving}
                                                        className="p-1.5 text-green-400 hover:text-green-300 rounded"
                                                        title="Enregistrer"
                                                    >
                                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        disabled={isAdding || editingId !== null}
                                                        className="p-1.5 text-slate-400 hover:text-blue-400 rounded disabled:opacity-50"
                                                        title="Modifier"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        disabled={isAdding || editingId !== null}
                                                        className="p-1.5 text-slate-400 hover:text-red-400 rounded disabled:opacity-50"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={visibleFields.length + 1} className="px-4 py-8 text-center text-slate-500">
                                    Aucun élément
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
