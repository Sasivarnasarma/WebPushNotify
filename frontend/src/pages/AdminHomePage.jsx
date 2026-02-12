import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { ToastContainer } from "../components/Toast";
import { useToast } from "../hooks/useToast";
import packageJson from "../../package.json";
import { api } from "../utils/api";
import { toLocalTime } from "../utils/date";

export default function AdminHomePage() {
    const { secret, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [deviceCount, setDeviceCount] = useState(null);
    const [serverVersion, setServerVersion] = useState("");

    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [image, setImage] = useState("");
    const [sendDate, setSendDate] = useState("");
    const [status, setStatus] = useState("");
    const [busy, setBusy] = useState(false);

    const [recentNotifications, setRecentNotifications] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(true);

    const [confirmSendId, setConfirmSendId] = useState(null);

    const { toasts, addToast } = useToast();

    const reuseHandledRef = React.useRef(false);
    useEffect(() => {
        if (location.state?.reuse && !reuseHandledRef.current) {
            reuseHandledRef.current = true;
            const item = location.state.reuse;
            setTitle(item.title);
            setMessage(item.body);
            setImage(item.image_url || "");
            addToast("Loaded for editing", "info");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        fetchStats();
        fetchRecentNotifications();

        api.get("/version")
            .then(data => setServerVersion(data.version))
            .catch(() => { });
    }, [isAuthenticated]);

    const fetchStats = async () => {
        try {
            const data = await api.post("/admin/stats", {}, secret);
            setDeviceCount(data.devices);
        } catch { }
    };

    const fetchRecentNotifications = async () => {
        setLoadingRecent(true);
        try {
            const data = await api.post("/admin/notifications", { limit: 5, offset: 0, status: "all" }, secret);
            const sorted = [...data.notifications].sort((a, b) => b.id - a.id);
            setRecentNotifications(sorted);
        } catch { }
        setLoadingRecent(false);
    };

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            setStatus("Please provide both title and message.");
            return;
        }

        const currentTitle = title;
        const payload = {
            secret,
            title,
            message,
            image: image || null,
            send_date: sendDate ? new Date(sendDate).toISOString() : null
        };

        setTitle("");
        setMessage("");
        setImage("");
        setSendDate("");
        setStatus("");
        setBusy(true);

        addToast(payload.send_date ? `Scheduling "${currentTitle}"...` : `Sending "${currentTitle}"...`, "info");

        try {
            const data = await api.post("/admin/send", payload);

            if (payload.send_date) {
                addToast(`Scheduled: "${currentTitle}"`, "success");
            } else {
                const msg = `Sent: "${currentTitle}" (${data.sent} sent, ${data.failed} failed)`;
                addToast(msg, data.failed === 0 ? "success" : "error");
            }

            fetchStats();
            fetchRecentNotifications();
        } catch (error) {
            addToast(`Failed: ${error.message}`, "error");
        }
        setBusy(false);
    };

    const handleReuse = (item) => {
        setTitle(item.title);
        setMessage(item.body);
        setImage(item.image_url || "");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        addToast("Loaded for editing", "info");
    };

    const executeSendNow = async () => {
        if (!confirmSendId) return;
        const id = confirmSendId;
        setConfirmSendId(null);

        try {
            const result = await api.post(`/admin/notifications/${id}/send-now`, {}, secret);
            addToast(`Sent! (${result.successful_count} sent, ${result.failed_count} failed)`, "success");
            fetchRecentNotifications();
        } catch (error) {
            addToast("Error: " + error.message, "error");
        }
    };

    return (
        <Layout>
            <section className="card">
                <p className="eyebrow">Admin Dashboard</p>


                <div className="stats-bar">
                    <div className="stat">
                        <span className="stat-value">{deviceCount ?? "—"}</span>
                        <span className="stat-label">Subscribed devices</span>
                    </div>
                </div>


                <div className="stack">
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Send Notification</h2>
                    <div>
                        <label className="label" htmlFor="title">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Notification Title"
                        />
                    </div>
                    <div>
                        <label className="label" htmlFor="message">Message</label>
                        <textarea
                            id="message"
                            rows={3}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="What do you want to share?"
                        />
                    </div>
                    <div>
                        <label className="label" htmlFor="image">Image URL (optional)</label>
                        <input
                            id="image"
                            type="url"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            placeholder="https://example.com/image.png"
                        />
                    </div>
                    <div>
                        <label className="label" htmlFor="sendDate">Schedule (optional)</label>
                        <input
                            id="sendDate"
                            type="datetime-local"
                            value={sendDate}
                            onChange={(e) => setSendDate(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                        />
                    </div>
                    <button className="primary" onClick={handleSend} disabled={busy}>
                        {sendDate ? "Schedule Notification" : "Send Notification"}
                    </button>
                    {status && <div className="status">{status}</div>}
                </div>


                <div className="history-list">
                    <div className="history-title-row">
                        <h3>Recent Notifications</h3>
                        <Link to="/admin/notifications" className="view-all-link">View All →</Link>
                    </div>

                    {loadingRecent ? (
                        <div className="empty-state">
                            <p className="empty-state-text">Loading...</p>
                        </div>
                    ) : recentNotifications.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <p className="empty-state-text">No notifications yet.</p>
                        </div>
                    ) : (
                        recentNotifications.map(item => (
                            <div key={item.id} className="history-wrapper">
                                <Link to={`/notification?id=${item.id}`} className="history-item">
                                    <div className="history-header">
                                        <span className={`status-badge ${item.status}`}>{item.status}</span>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            {item.status === 'sent' && (
                                                <span className="delivery-stats">
                                                    <span className="stat-success">✓ {item.successful_count || 0}</span>
                                                    <span className="stat-failed">✗ {item.failed_count || 0}</span>
                                                </span>
                                            )}
                                            <span className="view-count">{item.views}</span>
                                            <span>{toLocalTime(item.send_date)}</span>
                                        </div>
                                    </div>
                                    <div className="history-title">{item.title}</div>
                                    <div className="history-body">{item.body}</div>
                                    <div className="history-actions">
                                        {item.status === 'pending' && (
                                            <button
                                                className="send-now"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setConfirmSendId(item.id);
                                                }}
                                            >
                                                ▶ Send Now
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleReuse(item);
                                            }}
                                        >
                                            ↻ Reuse
                                        </button>
                                    </div>
                                </Link>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                    App v{packageJson.version} • Server v{serverVersion || "..."}
                </div>
            </section>

            <ToastContainer toasts={toasts} />


            {confirmSendId && (
                <div className="modal-overlay" onClick={() => setConfirmSendId(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Send Immediately?</h2>
                        <p>Are you sure you want to send this scheduled notification right now?</p>
                        <div className="modal-actions">
                            <button className="secondary" onClick={() => setConfirmSendId(null)}>Cancel</button>
                            <button className="primary" onClick={executeSendNow}>Yes, Send Now</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
