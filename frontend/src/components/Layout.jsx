import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ParticleBackground from "./ParticleBackground";
import ScrollToTop from "./ScrollToTop";

function Layout({ children }) {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'light';
        }
        return 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [menuOpen]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const handleLogout = () => {
        logout();
        navigate('/');
        setMenuOpen(false);
    };

    const handleLinkClick = () => {
        setMenuOpen(false);
    };

    return (
        <div className="page">
            <header className="nav">
                <div className="brand">Web Push Notify</div>

                <nav className="desktop-nav">
                    {isAuthenticated ? (
                        <>
                            <Link to="/">Home</Link>
                            <Link to="/admin">Dashboard</Link>
                            <Link to="/admin/notifications">Notifications</Link>
                            <Link to="/admin/subscribers">Users</Link>
                            <Link to="/admin/keys">Keys</Link>
                            <button onClick={handleLogout} className="nav-logout">Logout</button>
                        </>
                    ) : (
                        <Link to="/login">Admin</Link>
                    )}
                    <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                </nav>

                <button
                    className={`menu-toggle ${menuOpen ? 'open' : ''}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </header>

            <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
                <nav onClick={(e) => e.stopPropagation()}>
                    {isAuthenticated ? (
                        <>
                            <Link to="/" onClick={handleLinkClick}>Home</Link>
                            <Link to="/admin" onClick={handleLinkClick}>Dashboard</Link>
                            <Link to="/admin/notifications" onClick={handleLinkClick}>Notifications</Link>
                            <Link to="/admin/subscribers" onClick={handleLinkClick}>Users</Link>
                            <Link to="/admin/keys" onClick={handleLinkClick}>Keys</Link>
                            <button onClick={handleLogout} className="nav-logout">Logout</button>
                        </>
                    ) : (
                        <Link to="/login" onClick={handleLinkClick}>Admin</Link>
                    )}
                    <button onClick={() => { toggleTheme(); setMenuOpen(false); }} className="theme-toggle" aria-label="Toggle theme">
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                </nav>
            </div>

            <ParticleBackground />

            <main className="main">{children}</main>

            <footer className="footer">
                <span>Made with ❤️ by <a href="https://github.com/Sasivarnasarma" target="_blank" rel="noopener noreferrer" className="footer-link">Sasivarnasarma</a></span>
            </footer>

            <a
                href="https://github.com/Sasivarnasarma/WebPushNotify"
                target="_blank"
                rel="noopener noreferrer"
                className="github-link"
                aria-label="View on GitHub"
            >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
            </a>

            <ScrollToTop />
        </div>
    );
}

export default Layout;
