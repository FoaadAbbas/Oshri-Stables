import React, { useState } from 'react';
import { doc, deleteDoc, addDoc, updateDoc, collection } from 'firebase/firestore';
import { firestoreDb } from '../firebase';
import HorseForm from './HorseForm';
import * as api from '../api';
import { getImageUrl } from '../api';

export default function HorseList({ horses, userId, userEmail, isAdmin, onRefresh }) {
    const [showForm, setShowForm] = useState(false);
    const [editHorse, setEditHorse] = useState(null);

    const handleDelete = async (id) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק את הסוס? פעולה זו תמחק גם את כל הנתונים המשויכים אליו.')) return;
        try {
            const result = await api.deleteHorse(userId, id, userEmail);

            // Also delete from Firebase if it was migrated
            if (result.firebaseId) {
                try {
                    await deleteDoc(doc(firestoreDb, 'horses', result.firebaseId));
                } catch (e) { console.warn('Firebase horse delete failed:', e); }
            }
            // Delete related Firebase records
            if (result.relatedFirebaseIds) {
                const { visits, vaccines, pregnancies } = result.relatedFirebaseIds;
                for (const fid of (visits || [])) {
                    try { await deleteDoc(doc(firestoreDb, 'visits', fid)); } catch (e) { }
                }
                for (const fid of (vaccines || [])) {
                    try { await deleteDoc(doc(firestoreDb, 'vaccines', fid)); } catch (e) { }
                }
                for (const fid of (pregnancies || [])) {
                    try { await deleteDoc(doc(firestoreDb, 'pregnancies', fid)); } catch (e) { }
                }
            }

            onRefresh();
        } catch (err) {
            alert('שגיאה במחיקת הסוס');
        }
    };

    const handleEdit = (horse) => {
        setEditHorse(horse);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditHorse(null);
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (editHorse) {
                // Update locally
                const updated = await api.updateHorse(userId, editHorse.id, formData, userEmail);

                // Sync edit to Firebase
                if (editHorse.firebaseId) {
                    try {
                        await updateDoc(doc(firestoreDb, 'horses', editHorse.firebaseId), {
                            name: updated.name,
                            age: updated.age,
                            breed: updated.breed,
                            gender: updated.gender,
                        });
                    } catch (e) { console.warn('Firebase update failed:', e); }
                }
            } else {
                // Create locally
                const created = await api.createHorse(userId, formData, userEmail);

                // Sync create to Firebase
                try {
                    const docRef = await addDoc(collection(firestoreDb, 'horses'), {
                        userId,
                        name: created.name,
                        age: created.age,
                        breed: created.breed,
                        gender: created.gender,
                    });
                    // Link the Firebase doc ID back to local record
                    await api.setFirebaseId('horses', userId, created.id, docRef.id, userEmail);
                } catch (e) { console.warn('Firebase create failed:', e); }
            }
            onRefresh();
            handleFormClose();
        } catch (err) {
            alert('שגיאה בשמירת הנתונים');
        }
    };

    return (
        <div>
            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{horses.length}</div>
                    <div className="stat-label">סה"כ סוסים</div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                    <div className="stat-value">{horses.filter(h => h.gender === 'זכר').length}</div>
                    <div className="stat-label">זכרים</div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                    <div className="stat-value">{horses.filter(h => h.gender === 'נקבה').length}</div>
                    <div className="stat-label">נקבות</div>
                </div>
            </div>

            {/* Add button */}
            <div style={{ marginBottom: 24 }}>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    ✚ הוסף סוס חדש
                </button>
            </div>

            {/* Horse cards grid */}
            <div className="horses-grid">
                {horses.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🐴</div>
                        <div className="empty-state-text">אין סוסים במערכת. הוסף סוס ראשון!</div>
                    </div>
                ) : (
                    horses.map(horse => (
                        <div key={horse.id} className="horse-card">
                            {horse.image ? (
                                <img
                                    src={getImageUrl(horse.image)}
                                    alt={horse.name}
                                    className="horse-card-image"
                                />
                            ) : (
                                <div className="horse-card-placeholder">🐴</div>
                            )}
                            <div className="horse-card-body">
                                <div className="horse-card-name" style={{ marginBottom: 4 }}>{horse.name}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 12 }}>
                                    {horse.fatherName && <span>אב: {horse.fatherName} </span>}
                                    {horse.fatherName && horse.motherName && <span> | </span>}
                                    {horse.motherName && <span>אם: {horse.motherName}</span>}
                                </div>

                                <div className="horse-card-info">
                                    <div className="horse-card-info-item">
                                        <span>גיל</span>
                                        <strong>{horse.age} שנים</strong>
                                    </div>
                                    <div className="horse-card-info-item">
                                        <span>גזע</span>
                                        <strong>{horse.breed}</strong>
                                    </div>
                                    <div className="horse-card-info-item">
                                        <span>מין</span>
                                        <strong>{horse.gender}</strong>
                                    </div>
                                </div>
                                <div className="horse-card-actions">
                                    <button className="btn btn-edit btn-sm" onClick={() => handleEdit(horse)}>
                                        ✎ ערוך
                                    </button>
                                    {horse.certImage && (
                                        <a href={getImageUrl(horse.certImage)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                                            📜 תעודה
                                        </a>
                                    )}
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(horse.id)}>
                                        ✕ מחק
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Form */}
            {showForm && (
                <HorseForm
                    horse={editHorse}
                    onSubmit={handleFormSubmit}
                    onClose={handleFormClose}
                />
            )}
        </div>
    );
}
