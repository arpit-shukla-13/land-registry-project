import React from 'react';

const Footer = () => {
    return (
        <footer style={{
            textAlign: 'center',
            padding: '30px 20px',
            backgroundColor: 'var(--bg-card)',
            borderTop: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            marginTop: 'auto'
        }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>BlockLand Registry</h3>
            <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Securing real-world assets on the Ethereum Blockchain.</p>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
                &copy; {new Date().getFullYear()} BlockLand. All rights reserved. | Built with MERN & Ethers.js
            </div>
        </footer>
    );
};

export default Footer;