import { useState, useMemo } from "react";
import Layout from "../components/Layout";
import packageJson from "../../package.json";
import { api } from "../utils/api";

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

export default function HomePage() {
    const [status, setStatus] = useState("");
    const [isError, setIsError] = useState(false);
    const [busy, setBusy] = useState(false);

    const [showDemo, setShowDemo] = useState(() => {
        return !sessionStorage.getItem("demo_popup_seen");
    });

    const dismissDemo = () => {
        sessionStorage.setItem("demo_popup_seen", "1");
        setShowDemo(false);
    };

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
        setIsError(false);
        setBusy(true);
        try {
            if (supportMessage) {
                setStatus(supportMessage);
                setIsError(true);
                return;
            }

            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setStatus("Permission not granted. You can allow notifications in your browser settings.");
                setIsError(true);
                return;
            }

            const registration = await navigator.serviceWorker.register("/sw.js");
            const data = await api.get("/vapid-public-key");

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

            await api.post("/subscribe", subscription.toJSON());

            setStatus("Done! You'll receive notifications from this app.");
            setIsError(false);
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Something went wrong.");
            setIsError(true);
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
                {status && (
                    <div
                        className="status"
                        style={isError ? { borderLeftColor: 'var(--error-color)' } : {}}
                    >
                        {status}
                    </div>
                )}

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

            {showDemo && (
                <div className="modal-overlay" onClick={dismissDemo}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>👋 Welcome to the Demo</h2>
                        <p>
                            This is a <strong>live demo</strong> of Web Push Notify. The admin secret is
                            pre-filled for you, just head to the <strong>Admin</strong> page and hit login.
                        </p>
                        <p>
                            In demo mode, notifications are only sent to <strong>your own browser</strong>,
                            so feel free to explore, send test notifications, and see how everything works!
                        </p>
                        <div className="modal-actions">
                            <button className="primary" onClick={dismissDemo}>Got it!</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
