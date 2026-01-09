import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

export type StepType = 'home_departure' | 'worksite' | 'home_return';

export interface TourneeStep {
    id: string;
    order: number;
    chantierNom: string;
    chantierReference: string | null;
    adresse: string | null;
    latitude: number | null;
    longitude: number | null;
    dateDebut: string;
    heureDebut: string;
    durationHours: number;
    type: StepType;
    isHomeStep?: boolean;
    // Pour les étapes domicile, l'heure calculée (départ ou arrivée)
    heureCalculee?: string;
}

export interface RouteSegment {
    geometry: GeoJSON.LineString;
    isHomeRoute: boolean; // true = orange, false = blue
}

interface TourneeMapProps {
    steps: TourneeStep[];
    routeGeometry: GeoJSON.LineString | null;
    routeSegments?: RouteSegment[]; // Pour routes multi-couleurs
    selectedStepId?: string;
    onStepClick?: (stepId: string) => void;
}

function createNumberedIcon(number: number, isSelected: boolean): L.DivIcon {
    const bgColor = isSelected ? '#3b82f6' : '#475569';
    const ring = isSelected ? 'box-shadow: 0 0 0 3px white;' : '';

    return L.divIcon({
        className: 'custom-numbered-marker',
        html: `
            <div style="
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: ${bgColor};
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 14px;
                ${ring}
            ">
                ${number}
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
}

function createHomeIcon(isSelected: boolean): L.DivIcon {
    const bgColor = '#f97316'; // orange-500
    const ring = isSelected ? 'box-shadow: 0 0 0 3px white;' : '';

    return L.divIcon({
        className: 'home-marker',
        html: `
            <div style="
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: ${bgColor};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                ${ring}
            ">
                🏠
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    });
}

export function TourneeMap({ steps, routeGeometry, routeSegments, selectedStepId, onStepClick }: TourneeMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const routeLayerRef = useRef<L.GeoJSON | null>(null);
    const segmentLayersRef = useRef<L.GeoJSON[]>([]);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const map = L.map(mapRef.current).setView([47.2184, -1.5536], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // Update numbered markers
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Remove old markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        // Create new markers
        const validSteps = steps.filter(
            (s): s is typeof s & { latitude: number; longitude: number } =>
                s.latitude !== null && s.longitude !== null
        );

        validSteps.forEach((step) => {
            // Use home icon for home steps, numbered icon for worksites
            const icon = step.isHomeStep
                ? createHomeIcon(step.id === selectedStepId)
                : createNumberedIcon(step.order, step.id === selectedStepId);

            const marker = L.marker([step.latitude, step.longitude], { icon });

            // Popup content based on step type
            const popupContent = step.isHomeStep
                ? `<strong>🏠 ${step.chantierNom}</strong><br>
                   ${step.adresse || 'Adresse non renseignee'}<br>
                   <small>${step.type === 'home_departure' ? 'Départ' : 'Retour'} ${step.heureCalculee || step.heureDebut}</small>`
                : `<strong>${step.order}. ${step.chantierNom}</strong><br>
                   ${step.adresse || 'Adresse non renseignee'}<br>
                   <small>${formatDateFr(step.dateDebut)} à ${step.heureDebut}</small>`;

            marker.bindPopup(popupContent);

            if (onStepClick) {
                marker.on('click', () => onStepClick(step.id));
            }

            marker.addTo(map);
            markersRef.current.push(marker);
        });

        // Fit bounds
        if (validSteps.length > 0) {
            const bounds = L.latLngBounds(
                validSteps.map((s) => [s.latitude, s.longitude] as [number, number])
            );
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [steps, selectedStepId, onStepClick]);

    // Show route (supports segmented routes with different colors)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Remove old routes
        if (routeLayerRef.current) {
            routeLayerRef.current.remove();
            routeLayerRef.current = null;
        }
        segmentLayersRef.current.forEach((layer) => layer.remove());
        segmentLayersRef.current = [];

        // If we have segmented routes, use those (with colors)
        if (routeSegments && routeSegments.length > 0) {
            routeSegments.forEach((segment) => {
                const color = segment.isHomeRoute ? '#f97316' : '#3b82f6'; // orange for home, blue for inter-site
                const layer = L.geoJSON(
                    { type: 'Feature', geometry: segment.geometry, properties: {} } as GeoJSON.Feature,
                    {
                        style: {
                            color,
                            weight: 4,
                            opacity: 0.8,
                        },
                    }
                );
                layer.addTo(map);
                segmentLayersRef.current.push(layer);
            });
        } else if (routeGeometry) {
            // Fallback to single route (blue)
            const layer = L.geoJSON(
                { type: 'Feature', geometry: routeGeometry, properties: {} } as GeoJSON.Feature,
                {
                    style: {
                        color: '#3b82f6',
                        weight: 4,
                        opacity: 0.8,
                    },
                }
            );
            layer.addTo(map);
            routeLayerRef.current = layer;
        }
    }, [routeGeometry, routeSegments]);

    return <div ref={mapRef} className="w-full h-full rounded-lg" />;
}

function formatDateFr(dateStr: string): string {
    // Parse as local date (not UTC) to avoid timezone shift
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const dayName = days[date.getDay()];
    return `${dayName} ${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
}
