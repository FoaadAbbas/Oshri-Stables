import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useTheme } from '../ThemeContext';

export default function Header({ user, isAdmin, onRefresh }) {
    const { theme, toggleTheme } = useTheme();

    const handleRefresh = async () => {
        const btn = document.getElementById('refresh-icon');
        if (btn) btn.style.transform = 'rotate(360deg)';
        if (onRefresh) await onRefresh();
        setTimeout(() => {
            if (btn) btn.style.transform = 'none';
        }, 500);
    };

    return (
        <header className="header">
            <div className="header-content-mobile">
                <div className="header-right">
                    <h1 className="header-title">🐴 Oshri Stables</h1>
                    {isAdmin && (
                        <span style={{
                            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            marginRight: '10px',
                            display: 'inline-block',
                            verticalAlign: 'middle'
                        }}>
                            👑 מנהל
                        </span>
                    )}
                </div>
                <div className="header-left">
                    <button className="btn-icon" onClick={handleRefresh} title="רענן נתונים">
                        <span id="refresh-icon" style={{ display: 'inline-block', transition: 'transform 0.5s ease' }}>🔄</span>
                    </button>
                    <button className="btn-icon" onClick={toggleTheme}>
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => signOut(auth)}>
                        התנתק
                    </button>
                </div>
            </div>
        </header>
    );
}
