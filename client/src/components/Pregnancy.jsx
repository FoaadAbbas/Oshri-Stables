import React, { useState } from 'react';
import { doc, deleteDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { firestoreDb } from '../firebase';
import * as api from '../api';

export default function Pregnancy({ pregnancies, horses, userId, userEmail, onRefresh }) {
    const [horseId, setHorseId] = useState('');
    const [matingDate, setMatingDate] = useState('');
    const [stallionName, setStallionName] = useState('');
    const [status, setStatus] = useState('לא מאושר');
    const [loading, setLoading] = useState(false);

    const femaleHorses = horses.filter(h => h.gender === 'נקבה');

    const statusOptions = ['לא מאושר', 'מאושר', 'בהמתנה לאישור', 'הסתיים'];

    const calculateExpectedDate = (mDate) => {
        const d = new Date(mDate);
        d.setDate(d.getDate() + 340);
        return d.toISOString().split('T')[0];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!horseId || !matingDate || !stallionName) {
            alert('אנא מלא את כל השדות החובה');
            return;
        }
        setLoading(true);
        try {
            const expectedDate = calculateExpectedDate(matingDate);
            const created = await api.createPregnancy(userId, {
                horseId: parseInt(horseId), matingDate, stallionName, status, expectedDate
            }, userEmail);

            // Sync to Firebase
            try {
                const docRef = await addDoc(collection(firestoreDb, 'pregnancies'), {
                    userId, horseId, matingDate, stallionName, status, expectedDate,
                });
                await api.setFirebaseId('pregnancies', userId, created.id, docRef.id, userEmail);
            } catch (e) { console.warn('Firebase sync failed:', e); }

            setMatingDate(''); setStallionName('');
            onRefresh();
        } catch (err) {
            alert('שגיאה בשמירת ההריון');
        }
        setLoading(false);
    };

    const handleStatusChange = async (pregnancyId, newStatus, firebaseId) => {
        try {
            await api.updatePregnancyStatus(userId, pregnancyId, newStatus, userEmail);
            // Sync to Firebase
            if (firebaseId) {
                try {
                    await updateDoc(doc(firestoreDb, 'pregnancies', firebaseId), { status: newStatus });
                } catch (e) { console.warn('Firebase sync failed:', e); }
            }
            onRefresh();
        } catch (err) {
            alert('שגיאה בעדכון סטטוס');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('האם למחוק את רישום ההריון?')) return;
        try {
            const result = await api.deletePregnancy(userId, id, userEmail);
            if (result.firebaseId) {
                try { await deleteDoc(doc(firestoreDb, 'pregnancies', result.firebaseId)); } catch (e) { }
            }
            onRefresh();
        } catch (err) {
            alert('שגיאה במחיקה');
        }
    };

    return (
        <div>
            <div className="section">
                <h3 className="section-title">🤰 רישום הריון חדש</h3>
                <p className="section-subtitle">הוסף מעקב הריון לסוסה</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>בחר סוסה</label>
                            <select className="form-select" value={horseId} onChange={e => setHorseId(e.target.value)}>
                                <option value="">-- בחר סוסה --</option>
                                {femaleHorses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>תאריך הזדווגות</label>
                            <input type="date" className="form-input" value={matingDate} onChange={e => setMatingDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>שם הסוס המזווג</label>
                            <input type="text" className="form-input" value={stallionName} onChange={e => setStallionName(e.target.value)} placeholder="שם הסוס" />
                        </div>
                        <div className="form-group">
                            <label>סטטוס</label>
                            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'שומר...' : '💾 שמור הריון'}
                    </button>
                </form>
            </div>

            <div className="section">
                <h3 className="section-title">הריונות פעילים</h3>
                {pregnancies.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🤰</div>
                        <div className="empty-state-text">אין הריונות רשומים</div>
                    </div>
                ) : (
                    pregnancies.map(pregnancy => {
                        const horse = horses.find(h => h.id === pregnancy.horseId);
                        const today = new Date();
                        const mDate = new Date(pregnancy.matingDate);
                        const expDate = new Date(pregnancy.expectedDate);
                        const daysPregnant = Math.max(0, Math.floor((today - mDate) / (1000 * 60 * 60 * 24)));
                        const daysRemaining = Math.max(0, Math.floor((expDate - today) / (1000 * 60 * 60 * 24)));
                        const progress = Math.min(100, (daysPregnant / 340) * 100);

                        return (
                            <div key={pregnancy.id} className="pregnancy-card">
                                <h4>{horse ? horse.name : 'סוסה שנמחקה'}</h4>
                                <div className="pregnancy-info">
                                    <div className="info-item">
                                        <strong>סוס מזווג</strong>
                                        <span>{pregnancy.stallionName}</span>
                                    </div>
                                    <div className="info-item">
                                        <strong>תאריך הזדווגות</strong>
                                        <span>{new Date(pregnancy.matingDate).toLocaleDateString('he-IL')}</span>
                                    </div>
                                    <div className="info-item">
                                        <strong>תאריך לידה צפוי</strong>
                                        <span>{new Date(pregnancy.expectedDate).toLocaleDateString('he-IL')}</span>
                                    </div>
                                    <div className="info-item">
                                        <strong>סטטוס</strong>
                                        <select
                                            className="form-select"
                                            value={pregnancy.status}
                                            onChange={e => handleStatusChange(pregnancy.id, e.target.value, pregnancy.firebaseId)}
                                        >
                                            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="info-item">
                                        <strong>ימים בהריון</strong>
                                        <span>{daysPregnant}</span>
                                    </div>
                                    <div className="info-item">
                                        <strong>ימים עד לידה</strong>
                                        <span>{daysRemaining > 0 ? daysRemaining : '🎉 הגיע הזמן!'}</span>
                                    </div>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                                </div>
                                <div style={{ marginTop: 16 }}>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(pregnancy.id)}>
                                        מחק הריון
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
