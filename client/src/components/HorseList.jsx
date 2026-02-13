import React, { useState } from 'react';
import { doc, deleteDoc, addDoc, updateDoc, collection } from 'firebase/firestore';
import { firestoreDb } from '../firebase';
import HorseForm from './HorseForm';
import HorseTimeline from './HorseTimeline';
import * as api from '../api';
import { getImageUrl } from '../api';

export default function HorseList({ horses, visits, vaccines, pregnancies, userId, userEmail, isAdmin, onRefresh }) {
    const [showForm, setShowForm] = useState(false);
    const [editHorse, setEditHorse] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGender, setFilterGender] = useState('all');

    // Timeline state
    const [showTimeline, setShowTimeline] = useState(false);
    const [timelineHorse, setTimelineHorse] = useState(null);

    // Filter Logic
    const filteredHorses = horses.filter(horse => {
        const matchesSearch = horse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            horse.breed.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGender = filterGender === 'all' || horse.gender === filterGender;
        return matchesSearch && matchesGender;
    });

    const handleDelete = async (id) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק את הסוס? פעולה זו תמחק גם את כל הנתונים המשויכים אליו.')) return;
        try {
            const result = await api.deleteHorse(userId, id, userEmail);

            if (result.firebaseId) {
                try {
                    await deleteDoc(doc(firestoreDb, 'horses', result.firebaseId));
                } catch (e) { console.warn('Firebase horse delete failed:', e); }
            }
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

    const handleTimeline = (horse) => {
        setTimelineHorse(horse);
        setShowTimeline(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditHorse(null);
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (editHorse) {
                const updated = await api.updateHorse(userId, editHorse.id, formData, userEmail);
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
                const created = await api.createHorse(userId, formData, userEmail);
                try {
                    const docRef = await addDoc(collection(firestoreDb, 'horses'), {
                        userId,
                        name: created.name,
                        age: created.age,
                        breed: created.breed,
                        gender: created.gender,
                    });
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

            {/* Controls: Search, Filter, Add */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="🔍 חיפוש סוס..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                    style={{ flex: 1, minWidth: '200px' }}
                />
                <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="form-select"
                    style={{ width: 'auto' }}
                >
                    <option value="all">הכל</option>
                    <option value="זכר">זכרים</option>
                    <option value="נקבה">נקבות</option>
                </select>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    ✚ הוסף סוס חדש
                </button>
            </div>

            {/* Horse cards grid */}
            <div className="horses-grid">
                {filteredHorses.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🐴</div>
                        <div className="empty-state-text">
                            {horses.length === 0 ? 'אין סוסים במערכת. הוסף סוס ראשון!' : 'לא נמצאו סוסים שתואמים לחיפוש.'}
                        </div>
                    </div>
                ) : (
                    filteredHorses.map(horse => (
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
                                        ✎
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => handleTimeline(horse)} title="ציר זמן">
                                        ⏳
                                    </button>
                                    {horse.certImage && (
                                        <a href={getImageUrl(horse.certImage)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }} title="תעודה">
                                            📜
                                        </a>
                                    )}
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(horse.id)}>
                                        ✕
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

            {/* Timeline Modal */}
            {showTimeline && timelineHorse && (
                <HorseTimeline
                    horse={timelineHorse}
                    visits={visits}
                    vaccines={vaccines}
                    pregnancies={pregnancies}
                    onClose={() => setShowTimeline(false)}
                />
            )}
        </div>
    );
}
