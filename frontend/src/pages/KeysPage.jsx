import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

function KeysPage() {
    const { refreshKeyStatus } = useAuth();
    const [keys, setKeys] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [generating, setGenerating] = useState(false);
    const [secret, setSecret] = useState(localStorage.getItem("admin_secret") || "");

    const [showWarning, setShowWarning] = useState(false);
    const [pendingUpload, setPendingUpload] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        if (!secret) {
            navigate("/admin");
            return;
        }
        fetchKeys();
    }, [secret]);

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const data = await api.post("/admin/keys", {}, secret);
            setKeys(data);
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

    const confirmGenerate = () => {
        if (!keys?.publicKey) {
            performAction();
        } else {
            setShowWarning(true);
        }
    };


    const handleDownload = () => {
        if (!keys || !keys.publicKey) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(keys, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "vapid_keys.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleUploadClick = () => {
        document.getElementById('file-upload').click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (!json.publicKey || !json.privateKey) {
                    throw new Error("Invalid key file format. Missing publicKey or privateKey.");
                }

                if (!keys?.publicKey) {
                    performAction(json);
                } else {
                    setPendingUpload(json);
                    setShowWarning(true);
                }
            } catch (err) {
                alert("Error reading file: " + err.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const performAction = async (uploadData = null) => {

        setShowWarning(false);
        setGenerating(true);
        setError("");

        const dataToUse = uploadData || pendingUpload;

        try {
            let endpoint = "/admin/keys/generate";
            let body = {};

            if (dataToUse) {
                endpoint = "/admin/keys/upload";
                body = { ...dataToUse };
            }

            const data = await api.post(endpoint, body, secret);

            setKeys(data);
            setSuccessMessage(dataToUse ? "Keys imported successfully." : "Keys generated successfully.");
            setShowSuccess(true);
            await refreshKeyStatus();
        } catch (err) {
            setError(err.message);
        } finally {
            setGenerating(false);
            setPendingUpload(null);
        }
    };

    return (
        <Layout>
            <section className="card">
                <p className="eyebrow">Admin</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h1>VAPID Keys</h1>
                    <Link to="/admin" style={{ fontSize: '0.9rem' }}>← Dashboard</Link>
                </div>

                {error && <div className="status error">{error}</div>}

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }} className="muted">Loading keys...</div>
                ) : (
                    <div className="keys-container">
                        {!keys?.publicKey ? (
                            <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 0' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔑</div>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>No Keys Configured</h3>
                                <p className="muted" style={{ marginBottom: '2rem', maxWidth: '300px', margin: '0 auto 2rem auto' }}>
                                    Notifications cannot be sent without VAPID keys. Generate them to get started or upload existing ones.
                                </p>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    <button className="primary" onClick={confirmGenerate} disabled={generating}>
                                        {generating ? "Generating..." : "Generate New Keys"}
                                    </button>
                                    <button className="secondary" onClick={handleUploadClick} disabled={generating}>
                                        Upload JSON
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="stack">
                                <div>
                                    <label className="label">Public Key</label>
                                    <code className="code-block">{keys.publicKey}</code>
                                </div>

                                <div>
                                    <label className="label">Private Key</label>
                                    <div style={{ position: 'relative' }}>
                                        <code
                                            className="code-block"
                                            style={{ filter: 'blur(5px)', transition: 'filter 0.3s', cursor: 'pointer' }}
                                            onMouseOver={e => e.target.style.filter = 'none'}
                                            onMouseOut={e => e.target.style.filter = 'blur(5px)'}
                                            title="Hover to reveal"
                                        >
                                            {keys.privateKey}
                                        </code>
                                    </div>
                                    <p className="muted" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Hover to reveal sensitive key</p>
                                </div>

                                <div className="keys-actions">
                                    <button className="secondary" onClick={handleDownload}>
                                        Download JSON
                                    </button>
                                    <button className="secondary" onClick={handleUploadClick}>
                                        Upload JSON
                                    </button>
                                    <button className="danger" onClick={confirmGenerate} disabled={generating}>
                                        {generating ? "Generating..." : "Regenerate Keys"}
                                    </button>
                                </div>
                            </div>
                        )}
                        <input
                            type="file"
                            id="file-upload"
                            style={{ display: 'none' }}
                            accept=".json"
                            onChange={handleFileChange}
                        />
                    </div>
                )}
            </section>

            {showWarning && (
                <div className="modal-overlay" onClick={() => { setShowWarning(false); setPendingUpload(null); }}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 style={{ color: 'var(--error-color)' }}>⚠️ Warning</h2>
                        <p>
                            {pendingUpload
                                ? "Are you sure you want to overwrite your keys with this file?"
                                : "Are you sure you want to regenerate your VAPID keys?"}
                        </p>
                        <div style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                            <strong>This is a destructive action:</strong>
                            <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem' }}>
                                <li>All existing keys will be replaced/deleted.</li>
                                <li>All current user subscriptions will be <strong style={{ color: 'var(--error-color)' }}>INVALIDATED</strong>.</li>
                                <li>Users will stop receiving notifications until they visit the site again.</li>
                            </ul>
                        </div>
                        <div className="modal-actions">
                            <button className="secondary" onClick={() => { setShowWarning(false); setPendingUpload(null); }}>Cancel</button>
                            <button className="danger" onClick={() => performAction(null)}>
                                {pendingUpload ? "Yes, Overwrite Keys" : "Yes, Regenerate Everything"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showSuccess && (
                <div className="modal-overlay" onClick={() => setShowSuccess(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                        <h2 style={{ color: '#10b981', marginTop: 0 }}>Success!</h2>
                        <p>{successMessage}</p>
                        <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
                            <button className="primary" onClick={() => setShowSuccess(false)}>Awesome</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

export default KeysPage;
