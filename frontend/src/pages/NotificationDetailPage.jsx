import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../utils/api";
import { toLocalTime, getRelativeTime } from "../utils/date";

export default function NotificationDetailPage() {
    const [notification, setNotification] = useState(null);
    const [error, setError] = useState("");
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get("id");

    useEffect(() => {
        if (!id) {
            setError("No notification ID provided.");
            return;
        }

        api.get(`/notifications/${id}`)
            .then(setNotification)
            .catch((err) => setError(err.message));

        api.post(`/notifications/${id}/view`).catch(() => { });
    }, [id]);

    const sentDate = notification ? (notification.send_date || notification.created_at) : null;

    return (
        <Layout>
            <section className="card">
                <p className="eyebrow">Notification</p>

                {error ? (
                    <div className="status" style={{ borderLeftColor: 'var(--error-color)' }}>{error}</div>
                ) : !notification ? (
                    <p className="muted">Loading...</p>
                ) : (
                    <>
                        {notification.image_url && (
                            <img
                                src={notification.image_url}
                                alt={notification.title}
                                style={{ width: '100%', borderRadius: '12px', marginBottom: '1rem' }}
                            />
                        )}
                        <h1>{notification.title}</h1>
                        <p className="muted" style={{ whiteSpace: 'pre-wrap' }}>{notification.body}</p>
                        <div className="time-badge">
                            <span className="time-icon">🕐 </span>
                            <span className="time-relative">{getRelativeTime(sentDate)}</span>
                            <span className="time-separator"> • </span>
                            <span className="time-absolute">{toLocalTime(sentDate)}</span>
                        </div>
                        <Link to="/" style={{ marginTop: '1rem' }}>← Back</Link>
                    </>
                )}
            </section>
        </Layout>
    );
}
