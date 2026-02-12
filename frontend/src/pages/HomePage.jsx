import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import packageJson from "../../package.json";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i += 1) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function AboutPage() {
    const [status, setStatus] = useState("");
    const [busy, setBusy] = useState(false);

    const supportMessage = useMemo(() => {
        if (!("serviceWorker" in navigator)) {
            return "Your browser does not support service workers.";
        }
        if (!("PushManager" in window)) {
            return "Push notifications are not supported in this browser.";
        }
        return "";
    }, []);

    const handleEnable = async () => {
        setStatus("");
        setBusy(true);
        try {
            if (supportMessage) {
                setStatus(supportMessage);
                return;
            }

            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setStatus("Permission not granted. You can allow notifications in your browser settings.");
                return;
            }

            const registration = await navigator.serviceWorker.register("/sw.js");
            const response = await fetch(`${API_URL}/vapid-public-key`);
            const data = await response.json();

            let existingSubscription = await registration.pushManager.getSubscription();

            if (existingSubscription) {
                const currentKey = urlBase64ToUint8Array(data.publicKey);
                const existingKey = existingSubscription.options.applicationServerKey;

                if (existingKey) {
                    const currentKeyStr = new Uint8Array(currentKey).toString();
                    const existingKeyStr = new Uint8Array(existingKey).toString();

                    if (currentKeyStr !== existingKeyStr) {
                        console.log("VAPID key changed, refreshing subscription...");
                        await existingSubscription.unsubscribe();
                        existingSubscription = null;
                    }
                }
            }

            const subscription =
                existingSubscription ||
                (await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(data.publicKey)
                }));

            const subscribeResponse = await fetch(`${API_URL}/subscribe`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(subscription)
            });

            if (!subscribeResponse.ok) {
                throw new Error("Failed to save subscription.");
            }

            setStatus("Done! You'll receive notifications from this app.");
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Something went wrong.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Layout>
            <section className="card">
                <p className="eyebrow">Welcome</p>
                <h1>Web Push Notify</h1>

                <p className="muted">
                    A simple, self-hosted push notification service that lets you send real-time
                    notifications to web browsers without complex infrastructure.
                </p>

                <button className="primary" onClick={handleEnable} disabled={busy}>
                    {busy ? "Working..." : "Enable Notifications"}
                </button>
                {status && <div className="status">{status}</div>}

                <div className="feature-list">
                    <div className="feature-item">
                        <span className="feature-icon">🔔</span>
                        <div>
                            <strong>Push Notifications</strong>
                            <p className="muted">Send instant notifications to subscribed browsers</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">⏰</span>
                        <div>
                            <strong>Schedule Messages</strong>
                            <p className="muted">Plan notifications for future delivery</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">📊</span>
                        <div>
                            <strong>Track Engagement</strong>
                            <p className="muted">Monitor views and delivery stats</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">🔐</span>
                        <div>
                            <strong>Secure & Private</strong>
                            <p className="muted">Self-hosted with VAPID key encryption</p>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Version {packageJson.version}
                </div>
            </section>
        </Layout>
    );
}
