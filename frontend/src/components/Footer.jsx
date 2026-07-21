// frontend/src/components/Footer.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: 'rgba(2, 6, 23, 0.8)',
      backdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(51, 65, 85, 0.5)',
      padding: '40px 0',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <Link to="/" style={{ color: '#22d3ee', fontWeight: 'bold', textDecoration: 'none', fontSize: '18px' }}>
              SecureVault
            </Link>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
              Video Encryption Platform
            </p>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/about" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>About</Link>
            <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Login</Link>
            <Link to="/register" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Register</Link>
          </div>
        </div>
        <div style={{ 
          borderTop: '1px solid rgba(51, 65, 85, 0.5)', 
          marginTop: '20px', 
          paddingTop: '20px', 
          textAlign: 'center',
          color: '#64748b',
          fontSize: '14px'
        }}>
          &copy; {currentYear} SecureVault. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;