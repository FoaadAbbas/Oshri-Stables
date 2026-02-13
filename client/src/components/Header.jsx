import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useTheme } from '../ThemeContext';

export default function Header({ user, isAdmin }) {
    const { theme, toggleTheme } = useTheme();

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
