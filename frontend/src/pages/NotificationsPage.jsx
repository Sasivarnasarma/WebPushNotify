import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { ToastContainer } from "../components/Toast";
import { useToast } from "../hooks/useToast";
import { api } from "../utils/api";
import { toLocalTime } from "../utils/date";

export default function NotificationsPage() {
    const { secret, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [history, setHistory] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [filter, setFilter] = useState("all");
    const [confirmSendId, setConfirmSendId] = useState(null);
    const { toasts, addToast } = useToast();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }
        fetchHistory(0, false, filter);
    }, [isAuthenticated, filter]);

    const fetchHistory = async (offset = 0, append = false, statusFilter = "all") => {
        if (!append) setLoading(true);
        try {
            const data = await api.post("/admin/notifications", { limit: 10, offset, status: statusFilter }, secret);
            const sorted = [...data.notifications].sort((a, b) => b.id - a.id);
            if (append) {
                setHistory(prev => [...prev, ...sorted]);
            } else {
                setHistory(sorted);
            }
            setHasMore(data.has_more);
        } catch { }
        setLoading(false);
    };

    const loadMore = async () => {
        setLoadingMore(true);
        await fetchHistory(history.length, true, filter);
        setLoadingMore(false);
    };

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
    };

    const executeSendNow = async () => {
        if (!confirmSendId) return;
        const id = confirmSendId;
        setConfirmSendId(null);

        try {
            const result = await api.post(`/admin/notifications/${id}/send-now`, {}, secret);
            addToast(`Sent! (${result.successful_count} sent, ${result.failed_count} failed)`, "success");
            fetchHistory(0, false, filter);
        } catch (error) {
            addToast("Error: " + error.message, "error");
        }
    };

    const handleReuse = (item) => {
        navigate("/admin", { state: { reuse: item } });
    };

    return (
        <Layout>
            <section className="card">
                <p className="eyebrow">Admin</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h1>Notifications</h1>
                    <Link to="/admin" style={{ fontSize: '0.9rem' }}>← Dashboard</Link>
                </div>

                <div className="filter-pills">
                    {['all', 'sent', 'pending', 'failed'].map(f => (
                        <button
                            key={f}
                            className={`filter-pill ${filter === f ? 'active' : ''}`}
                            onClick={() => handleFilterChange(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="empty-state">
                        <p className="empty-state-text">Loading...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <p className="empty-state-text">
                            {filter === 'all' ? 'No notifications yet.' : `No ${filter} notifications.`}
                        </p>
                    </div>
                ) : (
                    <div className="history-wrapper-list">
                        {history.map(item => (
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
                        ))}
                    </div>
                )}

                {hasMore && (
                    <button
                        className="load-more"
                        onClick={loadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? "Loading..." : "Load More"}
                    </button>
                )}
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
