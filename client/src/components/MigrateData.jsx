import React, { useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestoreDb } from '../firebase';
import * as api from '../api';

export default function MigrateData({ userId, onRefresh }) {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    const handleMigrate = async () => {
        if (!confirm('האם להעביר את כל הנתונים מ-Firebase? הנתונים יתווספו למסד הנתונים המקומי.')) return;

        setLoading(true);
        setError('');
        setResults(null);

        try {
            // Read data from Firestore
            const horsesSnap = await getDocs(query(collection(firestoreDb, 'horses'), where('userId', '==', userId)));
            const visitsSnap = await getDocs(query(collection(firestoreDb, 'visits'), where('userId', '==', userId)));
            const vaccinesSnap = await getDocs(query(collection(firestoreDb, 'vaccines'), where('userId', '==', userId)));
            const pregnanciesSnap = await getDocs(query(collection(firestoreDb, 'pregnancies'), where('userId', '==', userId)));

            const horses = horsesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const visits = visitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const vaccines = vaccinesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const pregnancies = pregnanciesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Send to backend for import
            const result = await api.migrateData(userId, { horses, visits, vaccines, pregnancies });

            setResults(result.imported);
            onRefresh();
        } catch (err) {
            console.error('Migration error:', err);
            setError('שגיאה בהעברת הנתונים: ' + err.message);
        }

        setLoading(false);
    };

    return (
        <div>
            <div className="section">
                <h3 className="section-title">📥 העברת נתונים מ-Firebase</h3>
                <p className="section-subtitle">העבר את כל הנתונים הקיימים מ-Firebase Firestore למסד הנתונים המקומי</p>

                <div className="migrate-card">
                    <div className="migrate-icon">🔄</div>
                    <h4 className="migrate-title">העברת נתונים</h4>
                    <p className="migrate-description">
                        לחץ על הכפתור כדי לקרוא את כל הנתונים מ-Firebase ולשמור אותם במסד הנתונים המקומי.
                        <br />
                        התמונות שנשמרו כ-Base64 יומרו לקבצים אמיתיים בשרת.
                    </p>

                    <button
                        className="btn btn-primary"
                        onClick={handleMigrate}
                        disabled={loading}
                        style={{ fontSize: '1.1rem', padding: '14px 40px' }}
                    >
                        {loading ? '⏳ מעביר נתונים...' : '🚀 התחל העברה'}
                    </button>

                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 'var(--radius-sm)',
                            padding: 16,
                            marginTop: 20,
                            color: 'var(--danger)'
                        }}>
                            {error}
                        </div>
                    )}

                    {results && (
                        <div className="migrate-results">
                            <strong>✅ ההעברה הושלמה בהצלחה!</strong>
                            <div style={{ marginTop: 8 }}>
                                <div>🐴 סוסים: {results.horses}</div>
                                <div>📋 ביקורים: {results.visits}</div>
                                <div>💉 חיסונים: {results.vaccines}</div>
                                <div>🤰 הריונות: {results.pregnancies}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
