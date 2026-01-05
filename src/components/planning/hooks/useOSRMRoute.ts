import { useState, useCallback } from 'react';

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

export interface OSRMRouteResponse {
    code: string;
    routes: Array<{
        geometry: GeoJSON.LineString;
        legs: Array<{
            distance: number; // metres
            duration: number; // seconds
        }>;
        distance: number; // metres total
        duration: number; // seconds total
    }>;
}

export interface UseOSRMRouteResult {
    route: OSRMRouteResponse | null;
    loading: boolean;
    error: string | null;
    fetchRoute: (coordinates: [number, number][]) => Promise<void>;
}

export function useOSRMRoute(): UseOSRMRouteResult {
    const [route, setRoute] = useState<OSRMRouteResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRoute = useCallback(async (coordinates: [number, number][]) => {
        // Need at least 2 points
        if (coordinates.length < 2) {
            setRoute(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // OSRM format: lon,lat;lon,lat;...
            const coordStr = coordinates
                .map(([lat, lng]) => `${lng},${lat}`)
                .join(';');

            const url = `${OSRM_BASE_URL}/${coordStr}?overview=full&geometries=geojson&steps=false`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`OSRM error: ${response.status}`);
            }

            const data = await response.json();

            if (data.code !== 'Ok') {
                throw new Error(`OSRM: ${data.code}`);
            }

            setRoute(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de routage');
            setRoute(null);
        } finally {
            setLoading(false);
        }
    }, []);

    return { route, loading, error, fetchRoute };
}

export function formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h${remainingMins > 0 ? `${remainingMins}` : ''}`;
}

export function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}
