import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8000/api/manager';

/**
 * Hook that syncs the manager's profile (especially assignedRegions) with the server
 * on every page mount. If the admin has changed the manager's regions, this hook will:
 *   1. Update localStorage with the fresh data
 *   2. Return the updated manager object for sidebar/region badges
 *   3. Set `regionsChanged` to true so the page can re-fetch its data
 *
 * Usage:
 *   const { manager, token, regionsChanged, isLabManager, isTrainerManager } = useManagerProfile();
 */
export function useManagerProfile() {
    const navigate = useNavigate();
    const token = localStorage.getItem('accessToken');

    const [manager, setManager] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
            return {};
        }
    });

    // regionsChanged flips to true when the server returns different regions than localStorage
    const [regionsChanged, setRegionsChanged] = useState(false);

    // Track whether we've completed the initial sync
    const [synced, setSynced] = useState(false);

    // Use a ref to avoid stale closure in effect
    const managerRef = useRef(manager);
    managerRef.current = manager;

    const syncProfile = useCallback(async () => {
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const res = await fetch(`${API}/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401 || res.status === 403) {
                // Token expired or account deactivated/suspended — force logout
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                navigate('/login');
                return;
            }

            if (!res.ok) return; // Non-critical failure, keep using cached data

            const data = await res.json();
            const fresh = data.data;
            if (!fresh) return;

            const current = managerRef.current;

            // Detect region change
            const oldRegions = (current.assignedRegions || []).slice().sort().join(',');
            const newRegions = (fresh.assignedRegions || []).slice().sort().join(',');

            if (oldRegions !== newRegions) {
                setRegionsChanged(true);
            }

            // Merge fresh server data into the cached manager object
            // (preserves any extra fields like userType that the /me endpoint doesn't return)
            const merged = { ...current, ...fresh };
            localStorage.setItem('user', JSON.stringify(merged));
            setManager(merged);
        } catch {
            // Network error — silently use cached data
        } finally {
            setSynced(true);
        }
    }, [token, navigate]);

    useEffect(() => {
        syncProfile();
    }, [syncProfile]);

    return {
        manager,
        token,
        regionsChanged,
        synced,
        isLabManager: manager.managerType === 'lab_manager',
        isTrainerManager: manager.managerType === 'trainer_manager',
    };
}
