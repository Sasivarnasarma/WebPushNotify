const API_URL = (import.meta.env.API_URL || "").replace(/\/$/, "");

export const api = {
    get: async (endpoint, secret = null) => {
        const headers = { 'Content-Type': 'application/json' };

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Network error' }));
            throw new Error(error.detail || 'Request failed');
        }

        return response.json();
    },

    post: async (endpoint, data = {}, secret = null) => {
        const headers = { 'Content-Type': 'application/json' };

        const payload = { ...data };
        if (secret) {
            payload.secret = secret;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Network error' }));
            throw new Error(error.detail || 'Request failed');
        }

        return response.json();
    }
};
