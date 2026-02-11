import React, { useState } from 'react';
import { doc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { firestoreDb } from '../firebase';
import * as api from '../api';

export default function Visits({ visits, horses, userId, userEmail, onRefresh }) {
    const [horseId, setHorseId] = useState('');
    const [date, setDate] = useState('');
    const [vetName, setVetName] = useState('');
    const [type, setType] = useState('בדיקה שגרתית');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!horseId || !date || !vetName) {
            alert('אנא מלא את כל השדות החובה');
            return;
        }
        setLoading(true);
        try {
            const created = await api.createVisit(userId, { horseId: parseInt(horseId), date, vetName, type, notes }, userEmail);

            // Sync to Firebase
            try {
                const docRef = await addDoc(collection(firestoreDb, 'visits'), {
                    userId, horseId, date, vetName, type, notes: notes || '',
                });
                await api.setFirebaseId('visits', userId, created.id, docRef.id, userEmail);
            } catch (e) { console.warn('Firebase sync failed:', e); }

            setDate(''); setVetName(''); setNotes('');
            onRefresh();
        } catch (err) {
            alert('שגיאה בשמירת הביקור');
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('האם למחוק את רישום הביקור?')) return;
        try {
            const result = await api.deleteVisit(userId, id, userEmail);
            if (result.firebaseId) {
                try { await deleteDoc(doc(firestoreDb, 'visits', result.firebaseId)); } catch (e) { }
            }
            onRefresh();
        } catch (err) {
            alert('שגיאה במחיקה');
        }
    };

    return (
        <div>
            <div className="section">
                <h3 className="section-title">📋 רשום ביקור רופא</h3>
                <p className="section-subtitle">הוסף רישום ביקור רפואי חדש</p>
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
                            <label>תאריך ביקור</label>
                            <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>שם הרופא</label>
                            <input type="text" className="form-input" value={vetName} onChange={e => setVetName(e.target.value)} placeholder="שם הרופא" />
                        </div>
                        <div className="form-group">
                            <label>סוג הביקור</label>
                            <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                                <option value="בדיקה שגרתית">בדיקה שגרתית</option>
                                <option value="טיפול">טיפול</option>
                                <option value="חירום">חירום</option>
                                <option value="ניתוח">ניתוח</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 20 }}>
                        <label>אבחון וטיפול</label>
                        <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="פרטי הביקור..." />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'שומר...' : '💾 שמור ביקור'}
                    </button>
                </form>
            </div>

            <div className="section">
                <h3 className="section-title">היסטוריית ביקורים</h3>
                {visits.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <div className="empty-state-text">אין ביקורים רשומים</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="records-table">
                            <thead>
                                <tr>
                                    <th>סוס</th>
                                    <th>תאריך</th>
                                    <th>רופא</th>
                                    <th>סוג ביקור</th>
                                    <th>הערות</th>
                                    <th>פעולות</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visits.map(visit => {
                                    const horse = horses.find(h => h.id === visit.horseId);
                                    return (
                                        <tr key={visit.id}>
                                            <td style={{ fontWeight: 600 }}>{horse ? horse.name : 'סוס שנמחק'}</td>
                                            <td>{new Date(visit.date).toLocaleDateString('he-IL')}</td>
                                            <td>{visit.vetName}</td>
                                            <td>{visit.type}</td>
                                            <td>{visit.notes || '-'}</td>
                                            <td>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(visit.id)}>
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
