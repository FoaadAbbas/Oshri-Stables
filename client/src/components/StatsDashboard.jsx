import React from 'react';

export default function StatsDashboard({ horses, visits, vaccines, pregnancies }) {
    // 1. Gender Distribution
    const maleCount = horses.filter(h => h.gender === 'זכר').length;
    const femaleCount = horses.filter(h => h.gender === 'נקבה').length;
    const totalHorses = horses.length;
    const malePercent = totalHorses ? Math.round((maleCount / totalHorses) * 100) : 0;
    const femalePercent = totalHorses ? Math.round((femaleCount / totalHorses) * 100) : 0;

    // 2. Age Groups
    const ageGroups = { '0-3': 0, '4-10': 0, '11+': 0 };
    horses.forEach(h => {
        if (h.age <= 3) ageGroups['0-3']++;
        else if (h.age <= 10) ageGroups['4-10']++;
        else ageGroups['11+']++;
    });

    // 3. Upcoming Events (Next 7 days) - simplified logic
    // In a real app, we'd filter by date. Here we'll just show totals as a placeholder or assume future data.
    // For now, let's show totals of records.

    return (
        <div className="stats-dashboard">
            <h2 className="section-title">📊 סטטיסטיקות החווה</h2>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                {/* Gender Chart (Simple Bar) */}
                <div className="card">
                    <h3 className="card-title">פילוח מגדרי</h3>
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>זכרים ({maleCount})</span>
                            <span>{malePercent}%</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${malePercent}%`, background: '#6366f1' }}></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', marginBottom: '8px' }}>
                            <span>נקבות ({femaleCount})</span>
                            <span>{femalePercent}%</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${femalePercent}%`, background: '#ec4899' }}></div>
                        </div>
                    </div>
                </div>

                {/* Age Groups */}
                <div className="card">
                    <h3 className="card-title">קבוצות גיל</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '20px', padding: '20px 0' }}>
                        {Object.entries(ageGroups).map(([label, count]) => {
                            const height = totalHorses ? (count / totalHorses) * 100 : 0;
                            return (
                                <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{count}</div>
                                    <div style={{
                                        width: '100%',
                                        height: `${Math.max(height, 5)}%`,
                                        background: 'var(--primary-gradient)',
                                        borderRadius: '4px 4px 0 0',
                                        transition: 'height 1s ease'
                                    }}></div>
                                    <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Totals Summary */}
                <div className="card">
                    <h3 className="card-title">סיכום פעילות</h3>
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '16px' }}>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span>🩺 ביקורי רופא</span>
                            <strong>{visits.length}</strong>
                        </li>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span>💉 חיסונים שבוצעו</span>
                            <strong>{vaccines.length}</strong>
                        </li>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span>🤰 הריונות פעילים</span>
                            <strong>{pregnancies.filter(p => !p.actualDate).length}</strong>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Quick Tips or Insights */}
            <div className="section" style={{ marginTop: '20px' }}>
                <h3 className="section-title">💡 תובנות</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {malePercent > femalePercent ? 'יש רוב לסוסים זכרים בחווה.' : 'יש רוב לסוסות נקבות בחווה.'}
                    <br />
                    {ageGroups['0-3'] > 2 ? 'יש כמות יפה של סייחים צעירים!' : ''}
                </p>
            </div>
        </div>
    );
}
