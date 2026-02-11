import React from 'react';

export default function Notifications({ vaccines, pregnancies, horses }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alerts = [];

    // Check vaccines with upcoming nextDate (within 7 days or overdue)
    for (const vaccine of vaccines) {
        if (!vaccine.nextDate) continue;
        const nextDate = new Date(vaccine.nextDate);
        nextDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.floor((nextDate - today) / (1000 * 60 * 60 * 24));
        const horse = horses.find(h => h.id === vaccine.horseId);
        const horseName = horse ? horse.name : 'סוס לא ידוע';

        if (daysUntil < 0) {
            alerts.push({
                type: 'overdue',
                icon: '🚨',
                title: `חיסון באיחור!`,
                message: `${horseName} — חיסון "${vaccine.type}" היה צריך להתבצע לפני ${Math.abs(daysUntil)} ימים`,
                date: nextDate,
                priority: 0,
            });
        } else if (daysUntil === 0) {
            alerts.push({
                type: 'today',
                icon: '⚡',
                title: `חיסון היום!`,
                message: `${horseName} — חיסון "${vaccine.type}" מתוכנן להיום`,
                date: nextDate,
                priority: 1,
            });
        } else if (daysUntil <= 7) {
            alerts.push({
                type: 'upcoming',
                icon: '💉',
                title: `חיסון קרוב`,
                message: `${horseName} — חיסון "${vaccine.type}" בעוד ${daysUntil} ימים (${nextDate.toLocaleDateString('he-IL')})`,
                date: nextDate,
                priority: 2,
            });
        }
    }

    // Check pregnancies with upcoming expectedDate (within 30 days)
    for (const pregnancy of pregnancies) {
        if (pregnancy.status === 'הסתיים') continue;
        const expectedDate = new Date(pregnancy.expectedDate);
        expectedDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.floor((expectedDate - today) / (1000 * 60 * 60 * 24));
        const horse = horses.find(h => h.id === pregnancy.horseId);
        const horseName = horse ? horse.name : 'סוסה לא ידועה';

        if (daysUntil < 0) {
            alerts.push({
                type: 'overdue',
                icon: '🚨',
                title: `לידה צפויה עברה!`,
                message: `${horseName} — הלידה הצפויה עברה לפני ${Math.abs(daysUntil)} ימים`,
                date: expectedDate,
                priority: 0,
            });
        } else if (daysUntil <= 7) {
            alerts.push({
                type: 'today',
                icon: '🤰',
                title: `לידה קרובה מאוד!`,
                message: `${horseName} — לידה צפויה בעוד ${daysUntil} ימים (${expectedDate.toLocaleDateString('he-IL')})`,
                date: expectedDate,
                priority: 1,
            });
        } else if (daysUntil <= 30) {
            alerts.push({
                type: 'upcoming',
                icon: '🤰',
                title: `לידה מתקרבת`,
                message: `${horseName} — לידה צפויה בעוד ${daysUntil} ימים (${expectedDate.toLocaleDateString('he-IL')})`,
                date: expectedDate,
                priority: 2,
            });
        }
    }

    // Sort by priority (overdue first, then today, then upcoming)
    alerts.sort((a, b) => a.priority - b.priority || a.date - b.date);

    if (alerts.length === 0) return null;

    return (
        <div className="notifications-panel">
            <div className="notifications-header">
                <span>🔔</span>
                <h3>תזכורות ({alerts.length})</h3>
            </div>
            <div className="notifications-list">
                {alerts.map((alert, i) => (
                    <div key={i} className={`notification-card notification-${alert.type}`}>
                        <div className="notification-icon">{alert.icon}</div>
                        <div className="notification-content">
                            <div className="notification-title">{alert.title}</div>
                            <div className="notification-message">{alert.message}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
