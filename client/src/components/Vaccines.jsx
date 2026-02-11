import React, { useState } from 'react';
import { doc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { firestoreDb } from '../firebase';
import * as api from '../api';

export default function Vaccines({ vaccines, horses, userId, userEmail, onRefresh }) {
    const [horseId, setHorseId] = useState('');
    const [type, setType] = useState('');
    const [date, setDate] = useState('');
    const [nextDate, setNextDate] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!horseId || !type || !date) {
            alert('אנא מלא את כל השדות החובה');
            return;
        }
        setLoading(true);
        try {
            const created = await api.createVaccine(userId, { horseId: parseInt(horseId), type, date, nextDate, notes }, userEmail);

            // Sync to Firebase
            try {
                const docRef = await addDoc(collection(firestoreDb, 'vaccines'), {
                    userId, horseId, type, date, nextDate: nextDate || '', notes: notes || '',
                });
                await api.setFirebaseId('vaccines', userId, created.id, docRef.id, userEmail);
            } catch (e) { console.warn('Firebase sync failed:', e); }

            setType(''); setDate(''); setNextDate(''); setNotes('');
            onRefresh();
        } catch (err) {
            alert('שגיאה בשמירת החיסון');
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('האם למחוק את רישום החיסון?')) return;
        try {
            const result = await api.deleteVaccine(userId, id, userEmail);
            if (result.firebaseId) {
                try { await deleteDoc(doc(firestoreDb, 'vaccines', result.firebaseId)); } catch (e) { }
            }
            onRefresh();
        } catch (err) {
            alert('שגיאה במחיקה');
        }
    };

    return (
        <div>
            <div className="section">
                <h3 className="section-title">💉 רשום חיסון</h3>
                <p className="section-subtitle">הוסף רישום חיסון חדש</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>בחר סוס</label>
                            <select className="form-select" value={horseId} onChange={e => setHorseId(e.target.value)}>
                                <option value="">-- בחר --</option>
                                {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>סוג חיסון</label>
                            <input type="text" className="form-input" value={type} onChange={e => setType(e.target.value)} placeholder="שם החיסון" />
                        </div>
                        <div className="form-group">
                            <label>תאריך חיסון</label>
                            <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>תאריך חיסון הבא</label>
                            <input type="date" className="form-input" value={nextDate} onChange={e => setNextDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 20 }}>
                        <label>הערות</label>
                        <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="הערות נוספות..." />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'שומר...' : '💾 שמור חיסון'}
                    </button>
                </form>
            </div>

            <div className="section">
                <h3 className="section-title">היסטוריית חיסונים</h3>
                {vaccines.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">💉</div>
                        <div className="empty-state-text">אין חיסונים רשומים</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="records-table">
                            <thead>
                                <tr>
                                    <th>סוס</th>
                                    <th>סוג חיסון</th>
                                    <th>תאריך</th>
                                    <th>חיסון הבא</th>
                                    <th>הערות</th>
                                    <th>פעולות</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vaccines.map(vaccine => {
                                    const horse = horses.find(h => h.id === vaccine.horseId);
                                    return (
                                        <tr key={vaccine.id}>
                                            <td style={{ fontWeight: 600 }}>{horse ? horse.name : 'סוס שנמחק'}</td>
                                            <td>{vaccine.type}</td>
                                            <td>{new Date(vaccine.date).toLocaleDateString('he-IL')}</td>
                                            <td>{vaccine.nextDate ? new Date(vaccine.nextDate).toLocaleDateString('he-IL') : '-'}</td>
                                            <td>{vaccine.notes || '-'}</td>
                                            <td>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(vaccine.id)}>
                                                    מחק
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
