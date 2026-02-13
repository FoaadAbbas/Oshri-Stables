import React from 'react';

export default function HorseTimeline({ horse, visits, vaccines, pregnancies, onClose }) {
    // 1. Filter data for this horse
    const horseVisits = (visits || []).filter(v => v.horseId === horse.id || v.horseId === String(horse.id));
    const horseVaccines = (vaccines || []).filter(v => v.horseId === horse.id || v.horseId === String(horse.id));
    const horsePregnancies = (pregnancies || []).filter(p => p.horseId === horse.id || p.horseId === String(horse.id));

    // 2. Combine and normalize events
    const events = [
        ...horseVisits.map(v => ({ type: 'visit', date: v.date, data: v, label: 'ביקור רופא', icon: '🩺' })),
        ...horseVaccines.map(v => ({ type: 'vaccine', date: v.date, data: v, label: 'חיסון', icon: '💉' })),
        ...horsePregnancies.map(p => ({ type: 'pregnancy_start', date: p.matingDate, data: p, label: 'תחילת הריון', icon: '🤰' })),
        ...horsePregnancies.map(p => ({ type: 'pregnancy_end', date: p.expectedDate, data: p, label: 'צפי המלטה', icon: '👶' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort descending

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <h2 className="modal-title">⏳ ציר זמן - {horse.name}</h2>

                <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 10px' }}>
                    {events.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                            אין אירועים רשומים לסוס זה.
                        </div>
                    ) : (
                        <div className="timeline">
                            {events.map((evt, idx) => (
                                <div key={idx} className="timeline-item" style={{
                                    display: 'flex',
                                    gap: '15px',
                                    marginBottom: '20px',
                                    position: 'relative'
                                }}>
                                    <div className="timeline-icon" style={{
                                        fontSize: '1.5rem',
                                        background: 'var(--bg)',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid var(--border)',
                                        zIndex: 1
                                    }}>
                                        {evt.icon}
                                    </div>
                                    {/* Line connector */}
                                    {idx !== events.length - 1 && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '40px',
                                            right: '19px',
                                            bottom: '-25px',
                                            width: '2px',
                                            background: 'var(--border)'
                                        }} />
                                    )}

                                    <div className="timeline-content" style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                                            {new Date(evt.date).toLocaleDateString('he-IL')}
                                        </div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{evt.label}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            {evt.type === 'visit' && `${evt.data.type} - ד"ר ${evt.data.vetName}`}
                                            {evt.type === 'vaccine' && `${evt.data.type}`}
                                            {evt.type === 'pregnancy_start' && `הרבעה: ${evt.data.stallionName}`}
                                            {evt.type === 'pregnancy_end' && `סטטוס: ${evt.data.status}`}
                                        </div>
                                        {evt.data.notes && (
                                            <div style={{ fontSize: '0.85rem', background: 'var(--bg)', padding: '8px', borderRadius: '8px', marginTop: '6px' }}>
                                                📝 {evt.data.notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                    <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%' }}>
                        סגור
                    </button>
                </div>
            </div>
        </div>
    );
}
