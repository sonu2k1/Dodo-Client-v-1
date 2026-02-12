import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:3001/api';
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DISMISSED_KEY = 'dodo_dismissed_anomalies';

/**
 * useAnomalies — auto-fetches anomaly scan on mount + every 5 min.
 * Exposes flags, riskLevel, flagCount, loading, dismiss, and navBadges.
 */
export default function useAnomalies() {
    const { authFetch, isAuthenticated } = useAuth();
    const [anomalies, setAnomalies] = useState([]);
    const [riskLevel, setRiskLevel] = useState('low');
    const [flagCount, setFlagCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [scannedAt, setScannedAt] = useState(null);

    // Dismissed IDs persisted in localStorage
    const [dismissed, setDismissed] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
        } catch {
            return [];
        }
    });

    const fetchAnomalies = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await authFetch(`${API_BASE}/roi/anomalies`);
            if (res.ok) {
                const data = await res.json();
                setAnomalies(data.flags || []);
                setRiskLevel(data.riskLevel || 'low');
                setFlagCount(data.flagCount || 0);
                setScannedAt(data.scannedAt);
            }
        } catch (err) {
            console.error('Anomaly fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [authFetch, isAuthenticated]);

    // Initial fetch + poll
    useEffect(() => {
        fetchAnomalies();
        const interval = setInterval(fetchAnomalies, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchAnomalies]);

    // Dismiss a flag
    const dismiss = useCallback((flagId) => {
        setDismissed(prev => {
            const next = [...prev, flagId];
            localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    // Filter out dismissed
    const activeAnomalies = anomalies.filter(
        a => !dismissed.includes(a.id)
    );

    // Build navTarget badge map: { 'spend-meter': 2, 'roi-analysis': 1 }
    const navBadges = {};
    activeAnomalies.forEach(a => {
        if (a.navTarget) {
            navBadges[a.navTarget] = (navBadges[a.navTarget] || 0) + 1;
        }
    });

    return {
        anomalies: activeAnomalies,
        allAnomalies: anomalies,
        riskLevel,
        flagCount: activeAnomalies.length,
        totalFlagCount: flagCount,
        loading,
        scannedAt,
        dismiss,
        navBadges,
        refresh: fetchAnomalies
    };
}
