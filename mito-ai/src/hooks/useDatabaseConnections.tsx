/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useState, useEffect } from 'react';
import { getDatabaseConnections } from '../restAPI/RestAPI';

export const useDatabaseConnections = () => {
    const [connections, setConnections] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                setLoading(true);
                const data = await getDatabaseConnections();
                setConnections(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch connections');
                setConnections({});
            } finally {
                setLoading(false);
            }
        };

        fetchConnections();
    }, []);

    return { connections, loading, error };
};
