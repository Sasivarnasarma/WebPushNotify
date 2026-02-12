import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [secret, setSecret] = useState(() => localStorage.getItem("admin_secret") || "");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasKeys, setHasKeys] = useState(true);

    useEffect(() => {
        if (secret) {
            validateSecret(secret).finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const checkKeys = async (secretValue) => {
        try {
            const data = await api.post("/admin/keys", {}, secretValue);
            const hasKey = !!(data.public_key || data.publicKey);
            setHasKeys(hasKey);
            return hasKey;
        } catch (e) {
            console.error("Keys check failed:", e);
        }
        setHasKeys(true);
        return true;
    };

    const validateSecret = async (secretToValidate) => {
        try {
            await api.post("/admin/login", {}, secretToValidate);
            setIsAuthenticated(true);
            setSecret(secretToValidate);
            localStorage.setItem("admin_secret", secretToValidate);
            await checkKeys(secretToValidate);
            return true;
        } catch (e) {
            console.error("Auth validation failed:", e);
        }
        setIsAuthenticated(false);
        return false;
    };

    const login = async (secretValue) => {
        setIsLoading(true);
        const success = await validateSecret(secretValue);
        setIsLoading(false);
        return success;
    };

    const logout = () => {
        setSecret("");
        setIsAuthenticated(false);
        setHasKeys(true);
        localStorage.removeItem("admin_secret");
    };

    const refreshKeyStatus = async () => {
        if (secret) {
            await checkKeys(secret);
        }
    };

    return (
        <AuthContext.Provider value={{
            secret,
            isAuthenticated,
            isLoading,
            hasKeys,
            login,
            logout,
            refreshKeyStatus
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
