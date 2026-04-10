import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ account, connectWallet }) => {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ? 'active-link' : 'nav-link';
    };

    return (
        <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 40px',
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: 'var(--shadow-main)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '28px' }}>🌍</span>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    BlockLand
                </h1>
            </div>

            <nav style={{ display: 'flex', gap: '20px' }}>
                <Link to="/" className={isActive('/')}>Home</Link>
                <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
                <Link to="/register" className={isActive('/register')}>Mint Asset</Link>
                <Link to="/transfer" className={isActive('/transfer')}>Transfer</Link>
                <Link to="/view-land" className={isActive('/view-land')}>Explorer</Link>
            </nav>

            <div>
                {account ? (
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid var(--success-color)',
                        color: 'var(--success-color)',
                        padding: '10px 15px',
                        borderRadius: '8px',
                        fontFamily: "'Fira Code', monospace",
                        fontWeight: '600',
                        fontSize: '14px'
                    }}>
                        ✅ {account.slice(0, 6)}...{account.slice(-4)}
                    </div>
                ) : (
                    <button onClick={connectWallet} className="btn-primary">
                        Connect Wallet
                    </button>
                )}
            </div>
        </header>
    );
};

export default Navbar;