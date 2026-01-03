import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Search, Locate, Check, Loader2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-expect-error Leaflet icon fix for bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

interface AddressSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (address: string, coords?: { lat: number; lng: number }) => void;
    initialAddress?: string;
    initialCoords?: { lat: number; lng: number };
}

interface AddressFeature {
    properties: {
        label: string;
        score: number;
        housenumber?: string;
        street?: string;
        postcode?: string;
        city?: string;
        context?: string;
    };
    geometry: {
        coordinates: [number, number]; // [lon, lat]
    };
}

export function AddressSelectorModal({
    isOpen,
    onClose,
    onSelect,
    initialAddress = '',
    initialCoords,
}: AddressSelectorModalProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    const [searchQuery, setSearchQuery] = useState(initialAddress);
    const [searchResults, setSearchResults] = useState<AddressFeature[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(initialAddress);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(
        initialCoords || null
    );
    const [locating, setLocating] = useState(false);

    // Default center: Nantes, France
    const defaultCenter: [number, number] = [47.2184, -1.5536];
    const defaultZoom = 13;

    // Initialize map
    useEffect(() => {
        if (!isOpen || !mapRef.current || mapInstanceRef.current) return;

        const center = selectedCoords
            ? [selectedCoords.lat, selectedCoords.lng]
            : defaultCenter;

        const map = L.map(mapRef.current).setView(center as [number, number], defaultZoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        mapInstanceRef.current = map;

        // Add click handler
        map.on('click', async (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            setSelectedCoords({ lat, lng });
            updateMarker(lat, lng);

            // Reverse geocode
            try {
                const response = await fetch(
                    `https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}`
                );
                const data = await response.json();
                if (data.features && data.features.length > 0) {
                    const label = data.features[0].properties.label;
                    setSelectedAddress(label);
                    setSearchQuery(label);
                }
            } catch (err) {
                console.error('Reverse geocoding failed:', err);
            }
        });

        // Add initial marker if coords exist
        if (selectedCoords) {
            updateMarker(selectedCoords.lat, selectedCoords.lng);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const updateMarker = (lat: number, lng: number) => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        } else {
            markerRef.current = L.marker([lat, lng]).addTo(map);
        }

        map.setView([lat, lng], map.getZoom());
    };

    const handleSearch = async (query?: string) => {
        const q = query || searchQuery;
        if (!q || q.length < 3) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const response = await fetch(
                `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5`
            );
            const data = await response.json();
            if (data.features) {
                setSearchResults(data.features);
            }
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectResult = (feature: AddressFeature) => {
        const [lng, lat] = feature.geometry.coordinates;

        setSelectedAddress(feature.properties.label);
        setSelectedCoords({ lat, lng });
        setSearchQuery(feature.properties.label);
        setSearchResults([]);

        updateMarker(lat, lng);
        mapInstanceRef.current?.setView([lat, lng], 16);
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            alert('La géolocalisation n\'est pas supportée par votre navigateur');
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                setSelectedCoords({ lat, lng });
                updateMarker(lat, lng);
                mapInstanceRef.current?.setView([lat, lng], 16);

                // Reverse geocode
                try {
                    const response = await fetch(
                        `https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}`
                    );
                    const data = await response.json();
                    if (data.features && data.features.length > 0) {
                        const label = data.features[0].properties.label;
                        setSelectedAddress(label);
                        setSearchQuery(label);
                    }
                } catch (err) {
                    console.error('Reverse geocoding failed:', err);
                }

                setLocating(false);
            },
            (error) => {
                setLocating(false);
                alert('Erreur de géolocalisation: ' + error.message);
            }
        );
    };

    const handleConfirm = () => {
        onSelect(selectedAddress, selectedCoords || undefined);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div
                className="glass-card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-green-400" />
                        Sélectionner une adresse
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search bar */}
                <div className="p-4 border-b border-slate-700/50">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    handleSearch(e.target.value);
                                }}
                                placeholder="Rechercher une adresse..."
                                className="input-field py-2"
                                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                            />
                            {searching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                </div>
                            )}
                            {/* Suggestions Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="absolute z-[1000] w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-48 overflow-auto">
                                    {searchResults.map((result, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSelectResult(result)}
                                            className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors text-sm text-slate-200 border-b border-slate-700/50 last:border-0"
                                        >
                                            <p className="font-medium text-white">{result.properties.label}</p>
                                            <p className="text-xs text-slate-400">{result.properties.context}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleLocateMe}
                            disabled={locating}
                            className="btn-secondary px-3"
                            title="Ma position"
                        >
                            <Locate className={`w-4 h-4 ${locating ? 'animate-pulse' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1 min-h-[300px]">
                    <div ref={mapRef} className="w-full h-full" style={{ minHeight: '300px' }} />
                </div>

                {/* Selected address */}
                {selectedAddress && (
                    <div className="p-4 border-t border-slate-700/50 bg-green-500/10">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-slate-400">Adresse sélectionnée :</p>
                                <p className="text-white">{selectedAddress}</p>
                                {selectedCoords && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Coordonnées: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-4 border-t border-slate-700/50 flex justify-end gap-3">
                    <button onClick={onClose} className="btn-secondary">
                        Annuler
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedAddress}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
    );
}
