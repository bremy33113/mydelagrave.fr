import { useState, useEffect, useCallback } from 'react';
import { isUsingMock } from '../lib/supabase';

const MOBILE_BREAKPOINT = 768;
const FORCE_MOBILE_KEY = 'force_mobile_mode';

export function useMobileMode() {
    const [isMobileViewport, setIsMobileViewport] = useState(
        typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
    );
    const [forceMobile, setForceMobile] = useState(
        typeof window !== 'undefined' ? localStorage.getItem(FORCE_MOBILE_KEY) === 'true' : false
    );

    useEffect(() => {
        const handleResize = () => {
            setIsMobileViewport(window.innerWidth < MOBILE_BREAKPOINT);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleForceMobile = useCallback(() => {
        const newValue = !forceMobile;
        setForceMobile(newValue);
        localStorage.setItem(FORCE_MOBILE_KEY, String(newValue));
        // Recharger la page pour appliquer le changement de layout
        window.location.reload();
    }, [forceMobile]);

    return {
        // True si viewport mobile OU si forcé en mode dev
        isMobile: isMobileViewport || forceMobile,
        // True uniquement si viewport est mobile
        isMobileViewport,
        // True si forcé via toggle dev
        forceMobile,
        // Fonction pour basculer le mode mobile forcé
        toggleForceMobile,
        // Afficher toggle uniquement en mode dev
        showDevToggle: isUsingMock,
    };
}
