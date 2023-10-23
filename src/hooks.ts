import { useCallback, useEffect, useMemo, useState } from "react";

import { safeParse } from "./utils";

/**
 * Provides read/write access to local storage with JSON transformation and error handling
 */
export function usePersistence <T> (key: string) {
    const read = useCallback(() => safeParse<T>(localStorage.getItem(key)!), [key]);
    const write = useCallback((data: T) => localStorage.setItem(key, JSON.stringify(data)), [key]);
    const remove = useCallback(() => localStorage.removeItem(key), [key]);

    return useMemo(() => ({ read, write, remove }), [read, write, remove]);
}

/**
 * Wraps the useState hook with the local storage for retrieving and saving state
 */
export function usePersistentState <T> (key: string, initialState: T) {
    const { read, write, remove } = usePersistence<T>(key);
    const [state, setState] = useState(() => read() ?? initialState);

    useEffect(() => {
        if (state !== undefined) {
            write(state);
        } else {
            remove();
        }
    }, [state, write, remove]);

    return [state, setState] as const;
}
