import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
    const [secret, setSecret] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!secret.trim()) {
            setError("Please enter admin secret.");
            return;
        }

        setBusy(true);
        setError("");

        const success = await login(secret);
        if (success) {
            navigate("/admin");
        } else {
            setError("Invalid secret. Please try again.");
        }
        setBusy(false);
    };

    return (
        <Layout>
            <section className="card">
                <p className="eyebrow">Admin Access</p>
                <h1>Login</h1>
                <p className="muted">
                    Enter your admin secret to access the notification management panel.
                </p>

                <form onSubmit={handleSubmit} className="stack">
                    <div>
                        <label className="label" htmlFor="secret">Admin Secret</label>
                        <input
                            id="secret"
                            type="password"
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            placeholder="Enter your secret"
                            autoFocus
                        />
                    </div>
                    <button className="primary" type="submit" disabled={busy}>
                        {busy ? "Verifying..." : "Login"}
                    </button>
                    {error && <div className="status" style={{ borderLeftColor: 'var(--error-color)' }}>{error}</div>}
                </form>
            </section>
        </Layout>
    );
}
