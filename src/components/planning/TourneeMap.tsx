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
}

interface TourneeMapProps {
    steps: TourneeStep[];
    routeGeometry: GeoJSON.LineString | null;
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

export function TourneeMap({ steps, routeGeometry, selectedStepId, onStepClick }: TourneeMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const routeLayerRef = useRef<L.GeoJSON | null>(null);

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
            const marker = L.marker([step.latitude, step.longitude], {
                icon: createNumberedIcon(step.order, step.id === selectedStepId),
            });

            marker.bindPopup(`
                <strong>${step.order}. ${step.chantierNom}</strong><br>
                ${step.adresse || 'Adresse non renseignee'}<br>
                <small>${formatDateFr(step.dateDebut)} a ${step.heureDebut}</small>
            `);

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

    // Show route
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Remove old route
        if (routeLayerRef.current) {
            routeLayerRef.current.remove();
            routeLayerRef.current = null;
        }

        // Add new route
        if (routeGeometry) {
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
    }, [routeGeometry]);

    return <div ref={mapRef} className="w-full h-full rounded-lg" />;
}

function formatDateFr(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const day = days[date.getDay()];
    return `${day} ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}
