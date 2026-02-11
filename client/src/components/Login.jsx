import React, { useState } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);

    const showError = (msg) => {
        setError(msg);
        setTimeout(() => setError(''), 4000);
    };

    const getErrorMessage = (code) => {
        const messages = {
            'auth/user-not-found': 'אימייל או סיסמה שגויים.',
            'auth/wrong-password': 'אימייל או סיסמה שגויים.',
            'auth/invalid-email': 'כתובת אימייל לא תקינה.',
            'auth/email-already-in-use': 'האימייל כבר רשום במערכת.',
            'auth/weak-password': 'הסיסמה חלשה מדי (לפחות 6 תווים).',
            'auth/invalid-credential': 'אימייל או סיסמה שגויים.',
        };
        return messages[code] || 'אירעה שגיאה. אנא נסה שנית.';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            showError('אנא מלא את כל השדות');
            return;
        }
        setLoading(true);
        try {
            if (isRegister) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            showError(getErrorMessage(err.code));
        }
        setLoading(false);
    };

    const handleGoogle = async () => {
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            showError(getErrorMessage(err.code));
        }
        setLoading(false);
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h1>🐴 חוות סוסים</h1>
                <p className="subtitle">מערכת מעקב רפואי מתקדמת</p>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>אימייל</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            dir="ltr"
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 20 }}>
                        <label>סיסמה</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="הזן סיסמה"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'טוען...' : (isRegister ? 'הרשמה' : 'כניסה')}
                    </button>
                </form>

                <div className="login-divider">או</div>

                <button
                    className="btn btn-google"
                    style={{ width: '100%' }}
                    onClick={handleGoogle}
                    disabled={loading}
                >
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" />
                    </svg>
                    כניסה עם גוגל
                </button>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {isRegister ? 'כבר יש לך חשבון?' : 'אין לך חשבון?'}{' '}
                    <button
                        onClick={() => setIsRegister(!isRegister)}
                        style={{
                            background: 'none', border: 'none', color: 'var(--primary)',
                            cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font)', fontSize: '0.9rem'
                        }}
                    >
                        {isRegister ? 'התחבר' : 'הירשם'}
                    </button>
                </p>
            </div>
        </div>
    );
}
