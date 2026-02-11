import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useTheme } from '../ThemeContext';

export default function Header({ user, isAdmin }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="header">
            <div className="header-right">
                <h1 className="header-title">🐴 מערכת מעקב רפואי</h1>
                {isAdmin && (
                    <span style={{
                        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        marginRight: '10px',
                    }}>
                        👑 מנהל
                    </span>
                )}
            </div>
            <div className="header-left">
                <span className="user-email">{user.email}</span>
                <button className="btn-icon" onClick={toggleTheme} title="החלף ערכת נושא">
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => signOut(auth)}>
                    התנתק
                </button>
            </div>
        </header>
    );
}
