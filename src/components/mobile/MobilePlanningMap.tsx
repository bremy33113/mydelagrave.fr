import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Clock, ArrowRight } from 'lucide-react';

// Fix for default marker icons in Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface PhaseWithChantier {
    id: string;
    groupe_phase: number;
    numero_phase: number;
    libelle: string | null;
    heure_debut: string;
    heure_fin: string;
    chantier: {
        id: string;
        nom: string;
        adresse_livraison: string | null;
        adresse_livraison_latitude: number | null;
        adresse_livraison_longitude: number | null;
        categorie: string | null;
        client: { nom: string } | null;
    } | null;
}

interface MobilePlanningMapProps {
    phases: PhaseWithChantier[];
    onChantierClick: (chantierId: string) => void;
}

interface RouteSegment {
    fromIndex: number;
    toIndex: number;
    distance: number; // km
    duration: number; // minutes
}

interface RouteData {
    segments: RouteSegment[];
    geometry: [number, number][]; // [lat, lon][]
}

interface ChantierWithCoords {
    id: string;
    nom: string;
    adresse_livraison: string | null;
    adresse_livraison_latitude: number;
    adresse_livraison_longitude: number;
    categorie: string | null;
    client: { nom: string } | null;
}

interface TourStop {
    index: number;
    phase: Omit<PhaseWithChantier, 'chantier'> & { chantier: ChantierWithCoords };
    lat: number;
    lon: number;
}

// Couleurs par catégorie
const CATEGORY_COLORS: Record<string, string> = {
    'Laboratoire': '#8b5cf6',
    'Bureau': '#3b82f6',
    'Salle de classe': '#10b981',
    'Cuisine': '#f59e0b',
    'Sanitaire': '#06b6d4',
    'default': '#6366f1',
};

function getCategoryColor(categorie: string | null): string {
    return CATEGORY_COLORS[categorie || 'default'] || CATEGORY_COLORS['default'];
}

function createNumberedIcon(num: number, categorie: string | null): L.DivIcon {
    const color = getCategoryColor(categorie);
    return L.divIcon({
        className: 'custom-numbered-marker',
        html: `
            <div style="
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: ${color};
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 800;
                font-size: 14px;
                font-family: system-ui, sans-serif;
            ">
                ${num}
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
    });
}

// Calcul de distance et temps via OSRM
async function fetchRouteData(stops: TourStop[]): Promise<RouteData | null> {
    if (stops.length < 2) return null;

    try {
        // Construire les coordonnées pour OSRM (lon,lat)
        const coords = stops.map(s => `${s.lon},${s.lat}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('OSRM request failed');

        const data = await response.json();
        if (data.code !== 'Ok' || !data.routes?.[0]?.legs) {
            throw new Error('Invalid OSRM response');
        }

        // Extraire les segments
        const segments = data.routes[0].legs.map((leg: { distance: number; duration: number }, i: number) => ({
            fromIndex: i,
            toIndex: i + 1,
            distance: Math.round(leg.distance / 100) / 10, // km avec 1 décimale
            duration: Math.round(leg.duration / 60), // minutes
        }));

        // Extraire la géométrie du trajet (GeoJSON coordinates sont [lon, lat], on convertit en [lat, lon])
        const geometry: [number, number][] = data.routes[0].geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        );

        return { segments, geometry };
    } catch (error) {
        console.error('Route calculation error:', error);
        return null;
    }
}

export function MobilePlanningMap({ phases, onChantierClick }: MobilePlanningMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const routeLayerRef = useRef<L.Polyline | null>(null);

    const [routeData, setRouteData] = useState<RouteData | null>(null);
    const [loadingRoute, setLoadingRoute] = useState(false);

    // Trier les phases par heure de début et dédupliquer par chantier
    const tourStops = useMemo<TourStop[]>(() => {
        // Filtrer les phases avec coordonnées valides
        const validPhases = phases.filter(
            (p): p is typeof p & {
                chantier: NonNullable<typeof p.chantier> & {
                    adresse_livraison_latitude: number;
                    adresse_livraison_longitude: number
                }
            } =>
                p.chantier !== null &&
                p.chantier.adresse_livraison_latitude !== null &&
                p.chantier.adresse_livraison_longitude !== null
        );

        // Dédupliquer par chantier (garder le premier par heure)
        const chantierMap = new Map<string, typeof validPhases[0]>();
        validPhases
            .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut))
            .forEach((phase) => {
                if (!chantierMap.has(phase.chantier.id)) {
                    chantierMap.set(phase.chantier.id, phase);
                }
            });

        // Convertir en TourStop avec index
        return Array.from(chantierMap.values()).map((phase, index) => ({
            index: index + 1,
            phase: phase as TourStop['phase'],
            lat: phase.chantier.adresse_livraison_latitude,
            lon: phase.chantier.adresse_livraison_longitude,
        }));
    }, [phases]);

    // Calculer le trajet total
    const totalRoute = useMemo(() => {
        if (!routeData || routeData.segments.length === 0) return { distance: 0, duration: 0 };
        return routeData.segments.reduce(
            (acc, seg) => ({
                distance: acc.distance + seg.distance,
                duration: acc.duration + seg.duration,
            }),
            { distance: 0, duration: 0 }
        );
    }, [routeData]);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const map = L.map(mapRef.current, {
            zoomControl: false,
        }).setView([46.5, 2.5], 6); // Centre France

        // Zoom control en bas à droite
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Carte routière ESRI World Street Map
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri',
            maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // Update markers and route
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Remove old markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        // Remove old route
        if (routeLayerRef.current) {
            routeLayerRef.current.remove();
            routeLayerRef.current = null;
        }

        // Create numbered markers
        tourStops.forEach((stop) => {
            const { phase, lat, lon, index } = stop;
            const { chantier } = phase;

            const marker = L.marker([lat, lon], {
                icon: createNumberedIcon(index, chantier.categorie),
            });

            const popupContent = `
                <div style="min-width: 180px; font-family: system-ui, sans-serif;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span style="
                            width: 24px; height: 24px; border-radius: 50%;
                            background: ${getCategoryColor(chantier.categorie)};
                            color: white; font-weight: 800; font-size: 12px;
                            display: flex; align-items: center; justify-content: center;
                        ">${index}</span>
                        <span style="font-weight: 700; font-size: 14px; color: #1e293b;">
                            ${chantier.nom}
                        </span>
                    </div>
                    ${chantier.client?.nom ? `<div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${chantier.client.nom}</div>` : ''}
                    <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
                        ${phase.heure_debut.substring(0, 5)} - ${phase.heure_fin.substring(0, 5)}
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}', '_blank')"
                            style="flex: 1; padding: 8px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
                            GPS
                        </button>
                        <button onclick="window.dispatchEvent(new CustomEvent('openChantier', {detail: '${chantier.id}'}))"
                            style="flex: 1; padding: 8px; background: #0ea5e9; color: white; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
                            Détails
                        </button>
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent, {
                closeButton: false,
                className: 'mobile-planning-popup',
            });

            marker.addTo(map);
            markersRef.current.push(marker);
        });

        // Fit bounds
        if (tourStops.length > 0) {
            const bounds = L.latLngBounds(
                tourStops.map((s) => [s.lat, s.lon] as [number, number])
            );
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
    }, [tourStops]);

    // Fetch route data and draw route
    useEffect(() => {
        const map = mapInstanceRef.current;

        if (tourStops.length < 2) {
            setRouteData(null);
            if (routeLayerRef.current && map) {
                routeLayerRef.current.remove();
                routeLayerRef.current = null;
            }
            return;
        }

        setLoadingRoute(true);
        fetchRouteData(tourStops)
            .then((data) => {
                setRouteData(data);

                // Draw route on map
                if (map && data?.geometry) {
                    // Remove old route
                    if (routeLayerRef.current) {
                        routeLayerRef.current.remove();
                    }

                    // Draw new route with real road geometry
                    routeLayerRef.current = L.polyline(data.geometry, {
                        color: '#3b82f6',
                        weight: 5,
                        opacity: 0.8,
                    }).addTo(map);
                }
            })
            .finally(() => setLoadingRoute(false));
    }, [tourStops]);

    // Listen for chantier click event
    useEffect(() => {
        const handler = (e: CustomEvent<string>) => {
            onChantierClick(e.detail);
        };
        window.addEventListener('openChantier', handler as EventListener);
        return () => window.removeEventListener('openChantier', handler as EventListener);
    }, [onChantierClick]);

    // Formatter durée
    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
    };

    return (
        <div className="space-y-3">
            {/* Carte */}
            <div className="relative rounded-xl overflow-hidden border border-slate-700/50">
                <div ref={mapRef} className="w-full h-[280px]" />
                {tourStops.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                        <p className="text-slate-400 text-sm">Aucune intervention à afficher</p>
                    </div>
                )}
            </div>

            {/* Résumé trajet */}
            {tourStops.length >= 2 && (
                <div className="flex items-center justify-center gap-4 py-2 px-4 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-300">
                        <Navigation size={16} className="text-sky-400" />
                        <span className="text-sm font-semibold">
                            {loadingRoute ? '...' : `${totalRoute.distance.toFixed(1)} km`}
                        </span>
                    </div>
                    <div className="w-px h-4 bg-slate-600" />
                    <div className="flex items-center gap-2 text-slate-300">
                        <Clock size={16} className="text-amber-400" />
                        <span className="text-sm font-semibold">
                            {loadingRoute ? '...' : formatDuration(totalRoute.duration)}
                        </span>
                    </div>
                </div>
            )}

            {/* Liste de la tournée */}
            {tourStops.length > 0 && (
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
                    <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Tournée ({tourStops.length} étape{tourStops.length > 1 ? 's' : ''})
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-700/30">
                        {tourStops.map((stop, idx) => {
                            const { phase, index } = stop;
                            const { chantier } = phase;
                            const segment = routeData?.segments.find(s => s.fromIndex === idx);

                            return (
                                <div key={chantier.id}>
                                    {/* Étape */}
                                    <button
                                        onClick={() => onChantierClick(chantier.id)}
                                        className="w-full flex items-center gap-3 p-3 active:bg-slate-700/30 transition-colors text-left"
                                    >
                                        <span
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                                            style={{ backgroundColor: getCategoryColor(chantier.categorie) }}
                                        >
                                            {index}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">
                                                {chantier.nom}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {phase.heure_debut.substring(0, 5)} - {phase.heure_fin.substring(0, 5)}
                                                {chantier.client?.nom && ` • ${chantier.client.nom}`}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(
                                                    `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lon}`,
                                                    '_blank'
                                                );
                                            }}
                                            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 active:scale-95"
                                        >
                                            <Navigation size={16} />
                                        </button>
                                    </button>

                                    {/* Trajet vers l'étape suivante */}
                                    {segment && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/30">
                                            <ArrowRight size={14} className="text-slate-500" />
                                            <span className="text-xs text-slate-500">
                                                {segment.distance} km • {formatDuration(segment.duration)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
