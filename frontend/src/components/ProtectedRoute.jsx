import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./Layout";

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading, hasKeys } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <Layout>
                <section className="card">
                    <p className="muted">Loading...</p>
                </section>
            </Layout>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!hasKeys && location.pathname !== "/admin/keys") {
        return <Navigate to="/admin/keys" replace />;
    }

    return children;
}
