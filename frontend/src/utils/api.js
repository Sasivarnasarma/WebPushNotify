const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const api = {
    get: async (endpoint, secret = null) => {
        const headers = { 'Content-Type': 'application/json' };

        let url = `${API_URL}${endpoint}`;
        const ownerId = localStorage.getItem("owner_id");
        if (ownerId) {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}owner_id=${ownerId}`;
        }

        const response = await fetch(url, {
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

        const ownerId = localStorage.getItem("owner_id");
        if (ownerId) {
            payload.owner_id = ownerId;
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
