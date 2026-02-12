import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../utils/api";
import { toLocalTime } from "../utils/date";

function SubscribersPage() {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusModal, setStatusModal] = useState({ open: false, type: 'success', message: '' });
    const [secret, setSecret] = useState(localStorage.getItem("admin_secret") || "");
    const navigate = useNavigate();

    useEffect(() => {
        if (!secret) {
            navigate("/admin");
            return;
        }
        fetchSubscribers();
    }, [secret]);

    const fetchSubscribers = async () => {
        setLoading(true);
        try {
            const data = await api.post("/admin/subscribers", {}, secret);
            setSubscribers(data);
        } catch (err) {
            if (err.message.includes("401") || err.message.toLowerCase().includes("unauthorized")) {
                setError("Unauthorized. Please login again.");
                localStorage.removeItem("admin_secret");
                setTimeout(() => navigate("/admin"), 2000);
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const showModal = (type, message) => {
        setStatusModal({ open: true, type, message });
    };

    const handleDownload = async () => {
        try {
            const pkData = await api.get("/vapid-public-key");

            const exportData = {
                serverPublicKey: pkData.publicKey,
                subscribers: subscribers
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "subscribers.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } catch (err) {
            showModal('error', "Failed to prepare download: " + err.message);
        }
    };

    const handleUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target.result);

                const pkData = await api.get("/vapid-public-key");
                const currentPublicKey = pkData.publicKey;

                if (json.serverPublicKey !== currentPublicKey) {
                    showModal('error', "The subscribers file was exported from a different VAPID key pair (or the keys have changed). Importing these subscribers will not work because the server cannot authenticate messages to them.");
                    return;
                }

                if (!json.subscribers || !json.subscribers.length) {
                    showModal('error', "No subscribers found in file.");
                    return;
                }

                setLoading(true);
                const result = await api.post("/admin/subscribers/import", { subscribers: json.subscribers }, secret);

                showModal('success', result.message);
                fetchSubscribers();

            } catch (err) {
                showModal('error', "Upload failed: " + err.message);
            } finally {
                setLoading(false);
                event.target.value = null;
            }
        };
        reader.readAsText(file);
    };

    return (
        <Layout>
            <section className="card" style={{ maxWidth: '800px' }}>
                <p className="eyebrow">Admin</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h1>Subscribers</h1>
                    <Link to="/admin" style={{ fontSize: '0.9rem' }}>← Dashboard</Link>
                </div>


                <div className="manage-data-toolbar">
                    <div className="manage-data-info">
                        <h4 style={{ margin: 0 }}>Manage Data</h4>
                        <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>Import or export subscriber lists</p>
                    </div>
                    <div className="manage-data-actions">
                        <button className="secondary" onClick={handleDownload} disabled={loading || subscribers.length === 0}>
                            Download JSON
                        </button>
                        <label className="secondary upload-label">
                            Upload JSON
                            <input type="file" accept=".json" onChange={handleUpload} style={{ display: 'none' }} />
                        </label>
                    </div>
                </div>

                {error && <div className="status error">{error}</div>}

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }} className="muted">Loading users...</div>
                ) : subscribers.length === 0 ? (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>No Subscribers Yet</h3>
                        <p className="muted">
                            When users enable notifications, they will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="table-container" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>ID</th>
                                    <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Endpoint</th>
                                    <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Date Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscribers.map(sub => (
                                    <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px' }}>{sub.id}</td>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{
                                                maxWidth: '400px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                fontFamily: 'monospace',
                                                background: 'var(--surface-color)',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }} title={sub.endpoint}>
                                                {sub.endpoint}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                                            {toLocalTime(sub.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ marginTop: '1rem', textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
                            Total: {subscribers.length} users
                        </div>
                    </div>
                )}
            </section>

            {statusModal.open && (
                <div className="modal-overlay" onClick={() => setStatusModal({ ...statusModal, open: false })}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: '400px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                            {statusModal.type === 'success' ? '🎉' : '⚠️'}
                        </div>
                        <h2 style={{ color: statusModal.type === 'success' ? '#10b981' : 'var(--error-color)', marginTop: 0 }}>
                            {statusModal.type === 'success' ? 'Success!' : 'Error'}
                        </h2>
                        <p style={{ lineHeight: '1.5' }}>{statusModal.message}</p>
                        <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
                            <button className="primary" onClick={() => setStatusModal({ ...statusModal, open: false })}>
                                {statusModal.type === 'success' ? 'Awesome' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

export default SubscribersPage;
