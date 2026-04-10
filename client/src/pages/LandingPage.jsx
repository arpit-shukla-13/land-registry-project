// client/src/pages/LandingPage.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div style={{ animation: 'fadeIn 0.8s ease-in', paddingBottom: '60px' }}>
            
            {/* HERO SECTION */}
            <div style={{
                textAlign: 'center',
                padding: '100px 20px 60px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '25px',
                position: 'relative'
            }}>
                {/* Decorative background glow */}
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(11,15,25,0) 70%)',
                    zIndex: -1,
                    pointerEvents: 'none'
                }}></div>

                <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 20px', 
                    background: 'rgba(59, 130, 246, 0.1)', 
                    color: 'var(--primary-color)', 
                    borderRadius: '30px',
                    fontWeight: '600',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    letterSpacing: '0.5px',
                    fontSize: '0.9em'
                }}>
                    <span style={{ fontSize: '1.2em' }}>⚡</span> Web3 Powered Real Estate
                </div>
                
                <h1 style={{ 
                    fontSize: '5em', 
                    margin: 0, 
                    lineHeight: '1.1',
                    color: 'var(--text-main)',
                    fontWeight: '900',
                    letterSpacing: '-2px'
                }}>
                    Own the Future of <br/>
                    <span style={{ 
                        background: 'var(--primary-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Land Ownership
                    </span>
                </h1>
                
                <p style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '1.3em', 
                    maxWidth: '750px', 
                    lineHeight: '1.6',
                    marginTop: '10px',
                    fontWeight: '400'
                }}>
                    Eliminate fraud, bypass middlemen, and transfer property rights instantly. A transparent, immutable registry built on the Ethereum blockchain.
                </p>
                
                <div style={{ display: 'flex', gap: '20px', marginTop: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Link to="/register" style={{ textDecoration: 'none' }}>
                        <button className="btn-primary" style={{ padding: '18px 40px', fontSize: '1.1em', borderRadius: '12px' }}>
                            Start Minting Assets
                        </button>
                    </Link>
                    <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                        <button style={{
                            padding: '18px 40px', 
                            fontSize: '1.1em', 
                            background: 'rgba(255,255,255,0.03)', 
                            color: 'var(--text-main)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(10px)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.borderColor = 'var(--text-muted)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                        >
                            Explore Dashboard
                        </button>
                    </Link>
                </div>
            </div>

            {/* QUICK STATS SECTION */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '50px',
                padding: '40px 20px',
                borderTop: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'rgba(0,0,0,0.2)',
                flexWrap: 'wrap'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5em', margin: '0 0 5px 0', color: 'var(--text-main)' }}>100%</h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', fontSize: '0.85em', letterSpacing: '1px' }}>Immutable</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5em', margin: '0 0 5px 0', color: 'var(--text-main)' }}>~15s</h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', fontSize: '0.85em', letterSpacing: '1px' }}>Transfer Time</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5em', margin: '0 0 5px 0', color: 'var(--text-main)' }}>0</h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', fontSize: '0.85em', letterSpacing: '1px' }}>Fraud Cases</p>
                </div>
            </div>

            {/* HOW IT WORKS SECTION */}
            <div style={{ maxWidth: '1200px', margin: '80px auto 40px auto', padding: '0 20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '2.5em', margin: '0 0 15px 0' }}>How BlockLand Works</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.2em', maxWidth: '600px', margin: '0 auto' }}>A streamlined process to digitize and manage real-world property assets.</p>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '40px'
                }}>
                    <div style={{ padding: '30px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '-20px', left: '30px', background: 'var(--primary-color)', color: 'white', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold', fontSize: '1.2em' }}>1</div>
                        <h3 style={{ marginTop: '20px', fontSize: '1.5em' }}>Register Asset</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>The Government Authority mints the physical land details into a secure digital token on the blockchain.</p>
                    </div>

                    <div style={{ padding: '30px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '-20px', left: '30px', background: 'var(--primary-color)', color: 'white', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold', fontSize: '1.2em' }}>2</div>
                        <h3 style={{ marginTop: '20px', fontSize: '1.5em' }}>Verify On-Chain</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Buyers can independently verify the property's complete history, map coordinates, and cryptographic proof.</p>
                    </div>

                    <div style={{ padding: '30px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '-20px', left: '30px', background: 'var(--primary-color)', color: 'white', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold', fontSize: '1.2em' }}>3</div>
                        <h3 style={{ marginTop: '20px', fontSize: '1.5em' }}>Instant Transfer</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Once verified, ownership rights are transferred to the new wallet address in seconds, updating the global ledger.</p>
                    </div>
                </div>
            </div>

            {/* KEY FEATURES SECTION */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                gap: '30px', 
                padding: '80px 20px',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <div className="glass-card" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '30px', background: 'rgba(59, 130, 246, 0.1)', padding: '15px', borderRadius: '15px' }}>🔒</div>
                    <div>
                        <h3 style={{ color: 'var(--text-main)', fontSize: '1.4em', margin: '0 0 10px 0' }}>Cryptographic Security</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>Every document and coordinate is hashed. Tampering with the database breaks the on-chain proof instantly.</p>
                    </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '30px', background: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '15px' }}>🗺️</div>
                    <div>
                        <h3 style={{ color: 'var(--text-main)', fontSize: '1.4em', margin: '0 0 10px 0' }}>Geolocation Synced</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>Integrated with Google Maps. View the exact physical location of the digital asset before making a transfer.</p>
                    </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', gridColumn: '1 / -1', background: 'var(--primary-gradient)', border: 'none' }}>
                    <div style={{ flex: 1, padding: '20px' }}>
                        <h2 style={{ color: 'white', fontSize: '2.2em', margin: '0 0 15px 0' }}>Ready to digitize real estate?</h2>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.2em', margin: '0 0 25px 0', maxWidth: '600px' }}>Connect your MetaMask wallet and experience the transparency of blockchain-based land registries today.</p>
                        <Link to="/register">
                            <button style={{ background: 'white', color: 'var(--primary-color)', border: 'none', padding: '15px 30px', borderRadius: '10px', fontSize: '1.1em', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                                Connect & Start Minting
                            </button>
                        </Link>
                    </div>
                    <div style={{ fontSize: '100px', opacity: 0.5, alignSelf: 'center', paddingRight: '40px', display: 'none' }} className="cta-icon">
                        🏢
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;