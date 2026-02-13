import React, { useState } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, googleProvider, firestoreDb } from '../firebase';

export default function Login() {
    // Mode: 'login', 'register', 'forgot'
    const [mode, setMode] = useState('login');

    // Auth Fields
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(''); // For register only

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const showError = (msg) => {
        setError(msg);
        setTimeout(() => setError(''), 4000);
    };

    const showSuccess = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 4000);
    };

    const getErrorMessage = (code) => {
        const messages = {
            'auth/user-not-found': 'משתמש לא נמצא.',
            'auth/wrong-password': 'סיסמה שגויה.',
            'auth/invalid-email': 'כתובת אימייל לא תקינה.',
            'auth/email-already-in-use': 'האימייל או שם המשתמש כבר תפוסים.',
            'auth/weak-password': 'הסיסמה חלשה מדי (לפחות 6 תווים).',
            'auth/invalid-credential': 'פרטי התחברות שגויים.',
            'auth/too-many-requests': 'יותר מדי ניסיונות. אנא נסה שוב מאוחר יותר.'
        };
        return messages[code] || 'אירעה שגיאה. אנא נסה שנית.';
    };

    // --- Actions ---

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!emailOrUsername || !password) return showError('אנא מלא את כל השדות');

        setLoading(true);
        try {
            let loginEmail = emailOrUsername;

            // Check if input is username (no @)
            if (!emailOrUsername.includes('@')) {
                const usersRef = collection(firestoreDb, "users");
                const q = query(usersRef, where("username", "==", emailOrUsername));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    throw { code: 'auth/user-not-found' };
                }
                loginEmail = querySnapshot.docs[0].data().email;
            }

            await signInWithEmailAndPassword(auth, loginEmail, password);
        } catch (err) {
            console.error(err);
            showError(getErrorMessage(err.code));
        }
        setLoading(false);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!email || !password || !name || !username) return showError('אנא מלא את כל השדות');
        if (password.length < 6) return showError('הסיסמה חייבת להכיל לפחות 6 תווים');

        setLoading(true);
        try {
            // Check if username is taken
            const usersRef = collection(firestoreDb, "users");
            const q = query(usersRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                showError('שם המשתמש כבר תפוס.');
                setLoading(false);
                return;
            }

            // Create User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update Profile
            await updateProfile(user, { displayName: name });

            // Save to Firestore
            await setDoc(doc(firestoreDb, "users", user.uid), {
                username,
                email,
                name,
                createdAt: new Date()
            });

        } catch (err) {
            console.error(err);
            showError(getErrorMessage(err.code));
        }
        setLoading(false);
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        if (!email) return showError('אנא הזן אימייל לשחזור');

        setLoading(true);
        try {
            // Check if user exists in our DB first (to give better feedback)
            const usersRef = collection(firestoreDb, "users");
            const q = query(usersRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                showError('האימייל הזה לא רשום במערכת.');
                setLoading(false);
                return;
            }

            const userData = querySnapshot.docs[0].data();
            if (userData.googleUser) {
                showError('נראה שנרשמת דרך גוגל. נסה להתחבר עם גוגל.');
                // We still try to send email just in case they have a password too, 
                // but usually Google users don't have a password.
            }

            await sendPasswordResetEmail(auth, email);
            showSuccess('מייל לשחזור סיסמה נשלח בהצלחה!');
            setTimeout(() => setMode('login'), 3500);
        } catch (err) {
            console.error(err);
            showError(getErrorMessage(err.code));
        }
        setLoading(false);
    };

    const handleGoogle = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Ensure user entry exists in Firestore (optional but nice)
            // Can't assume username for Google users easily without prompt, skipping username enforcement for Google login.
            // But we can save their email/name if needed.
            await setDoc(doc(firestoreDb, "users", user.uid), {
                email: user.email,
                name: user.displayName,
                googleUser: true
            }, { merge: true });

        } catch (err) {
            showError(getErrorMessage(err.code));
        }
        setLoading(false);
    };

    // --- Render ---

    return (
        <div className="login-page">
            <div className="login-card">
                <h1>🐴 חוות סוסים</h1>
                <p className="subtitle">
                    {mode === 'login' && 'התחברות למערכת'}
                    {mode === 'register' && 'הרשמה למערכת'}
                    {mode === 'forgot' && 'שחזור סיסמה'}
                </p>

                {error && <div className="login-error">{error}</div>}
                {success && <div className="login-error" style={{ background: '#dcfce7', color: '#166534' }}>{success}</div>}

                {mode === 'login' && (
                    <form onSubmit={handleLogin}>
                        <div className="form-group" style={{ marginBottom: 16 }}>
                            <label>אימייל או שם משתמש</label>
                            <input
                                type="text"
                                className="form-input"
                                value={emailOrUsername}
                                onChange={e => setEmailOrUsername(e.target.value)}
                                placeholder="שם משתמש / אימייל"
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
                            <div style={{ textAlign: 'left', marginTop: 5 }}>
                                <button type="button" onClick={() => setMode('forgot')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    שכחתי סיסמה?
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'טוען...' : 'כניסה'}
                        </button>
                    </form>
                )}

                {mode === 'register' && (
                    <form onSubmit={handleRegister}>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                            <label>שם מלא (יוצג במערכת)</label>
                            <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="ישראל ישראלי" required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                            <label>שם משתמש (באנגלית)</label>
                            <input type="text" className="form-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="username" dir="ltr" required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                            <label>אימייל</label>
                            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" dir="ltr" required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <label>סיסמה</label>
                            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="לפחות 6 תווים" required />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'נרשם...' : 'הרשמה'}
                        </button>
                    </form>
                )}

                {mode === 'forgot' && (
                    <form onSubmit={handleForgot}>
                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <label>הכנס אימייל לשחזור</label>
                            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" dir="ltr" required />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'שולח...' : 'אפס סיסמה'}
                        </button>
                        <button type="button" onClick={() => setMode('login')} className="btn btn-secondary" style={{ width: '100%', marginTop: 10 }}>
                            חזרה לכניסה
                        </button>
                    </form>
                )}

                {mode !== 'forgot' && (
                    <>
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
                            {mode === 'register' ? 'כבר יש לך חשבון?' : 'אין לך חשבון?'}{' '}
                            <button
                                onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                                style={{
                                    background: 'none', border: 'none', color: 'var(--primary)',
                                    cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font)', fontSize: '0.9rem'
                                }}
                            >
                                {mode === 'register' ? 'התחבר' : 'הירשם'}
                            </button>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

