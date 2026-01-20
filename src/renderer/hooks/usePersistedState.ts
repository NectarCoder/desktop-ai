import { useEffect } from 'react';
import { useDebounce } from './useDebounce';

export function usePersistedState<T>(
    key: string,
    state: T,
    setState: (value: T) => void
) {
    // Debounce saves to avoid excessive IPC calls
    const debouncedState = useDebounce(state, 500);

    // Save on change
    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.saveState({ [key]: debouncedState });
        }
    }, [key, debouncedState]);

    // Load on mount
    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.loadState().then((stored: any) => {
                if (stored && stored[key] !== undefined) {
                    setState(stored[key]);
                }
            });
        }
    }, [key, setState]);
}
