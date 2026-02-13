import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, firestoreDb } from './firebase';
import Login from './components/Login';
import Header from './components/Header';
import HorseList from './components/HorseList';
import Visits from './components/Visits';
import Vaccines from './components/Vaccines';
import Pregnancy from './components/Pregnancy';
import Notifications from './components/Notifications';
import Chatbot from './components/Chatbot';
import * as api from './api';

const TABS = [
    { id: 'horses', label: '🐴 ניהול סוסים', icon: '🐴' },
    { id: 'visits', label: '📋 ביקורי רופאים', icon: '📋' },
    { id: 'vaccines', label: '💉 חיסונים', icon: '💉' },
    { id: 'pregnancy', label: '🤰 מעקב הריון', icon: '🤰' },
];

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('horses');
    const [horses, setHorses] = useState([]);
    const [visits, setVisits] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [pregnancies, setPregnancies] = useState([]);
    const [migrating, setMigrating] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Auth listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Load all data when user changes
    const loadData = useCallback(async () => {
        if (!user) return;
        try {
            const email = user.email;
            const [h, v, vc, p] = await Promise.all([
                api.fetchHorses(user.uid, email),
                api.fetchVisits(user.uid, email),
                api.fetchVaccines(user.uid, email),
                api.fetchPregnancies(user.uid, email),
            ]);
            setHorses(h);
            setVisits(v);
            setVaccines(vc);
            setPregnancies(p);
            return h;
        } catch (err) {
            console.error('Error loading data:', err);
            return [];
        }
    }, [user]);

    // Check admin status
    const checkAdminStatus = useCallback(async () => {
        if (!user) return;
        const admin = await api.checkAdmin(user.uid, user.email);
        setIsAdmin(admin);
    }, [user]);

    // Auto-migrate from Firebase on first login if local DB is empty
    const autoMigrate = useCallback(async () => {
        if (!user || migrating) return;

        try {
            // Check if local database has any data
            const localHorses = await api.fetchHorses(user.uid, user.email);
            if (localHorses.length > 0) return; // Already has data, skip

            // For admin: fetch ALL data from Firebase (no userId filter)
            // For regular users: fetch only their own data
            let horsesQuery, visitsQuery, vaccinesQuery, pregnanciesQuery;

            if (isAdmin) {
                horsesQuery = collection(firestoreDb, 'horses');
                visitsQuery = collection(firestoreDb, 'visits');
                vaccinesQuery = collection(firestoreDb, 'vaccines');
                pregnanciesQuery = collection(firestoreDb, 'pregnancies');
            } else {
                horsesQuery = query(collection(firestoreDb, 'horses'), where('userId', '==', user.uid));
                visitsQuery = query(collection(firestoreDb, 'visits'), where('userId', '==', user.uid));
                vaccinesQuery = query(collection(firestoreDb, 'vaccines'), where('userId', '==', user.uid));
                pregnanciesQuery = query(collection(firestoreDb, 'pregnancies'), where('userId', '==', user.uid));
            }

            const horsesSnap = await getDocs(horsesQuery);
            if (horsesSnap.empty) return; // No Firebase data

            setMigrating(true);
            console.log('🔄 Auto-migrating data from Firebase...');

            const visitsSnap = await getDocs(visitsQuery);
            const vaccinesSnap = await getDocs(vaccinesQuery);
            const pregnanciesSnap = await getDocs(pregnanciesQuery);

            if (isAdmin) {
                // Admin migration: group data by userId and migrate each user's data separately
                const userGroups = {};
                horsesSnap.docs.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() };
                    const uid = data.userId;
                    if (!userGroups[uid]) userGroups[uid] = { horses: [], visits: [], vaccines: [], pregnancies: [] };
                    userGroups[uid].horses.push(data);
                });
                visitsSnap.docs.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() };
                    const uid = data.userId;
                    if (!userGroups[uid]) userGroups[uid] = { horses: [], visits: [], vaccines: [], pregnancies: [] };
                    userGroups[uid].visits.push(data);
                });
                vaccinesSnap.docs.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() };
                    const uid = data.userId;
                    if (!userGroups[uid]) userGroups[uid] = { horses: [], visits: [], vaccines: [], pregnancies: [] };
                    userGroups[uid].vaccines.push(data);
                });
                pregnanciesSnap.docs.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() };
                    const uid = data.userId;
                    if (!userGroups[uid]) userGroups[uid] = { horses: [], visits: [], vaccines: [], pregnancies: [] };
                    userGroups[uid].pregnancies.push(data);
                });

                // Migrate each user's data with their original userId
                for (const [uid, data] of Object.entries(userGroups)) {
                    await api.migrateData(uid, data);
                }
            } else {
                // Regular user migration
                const firebaseData = {
                    horses: horsesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                    visits: visitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                    vaccines: vaccinesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                    pregnancies: pregnanciesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                };
                await api.migrateData(user.uid, firebaseData);
            }

            console.log('✅ Auto-migration complete!');
            await loadData();
        } catch (err) {
            console.error('Auto-migration error:', err);
        } finally {
            setMigrating(false);
        }
    }, [user, migrating, isAdmin, loadData]);

    useEffect(() => {
        if (user) {
            checkAdminStatus();
            loadData().then(() => autoMigrate());
        }
    }, [user]);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p>טוען...</p>
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    if (migrating) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p>📥 מעביר נתונים מ-Firebase...</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>פעולה זו מתבצעת פעם אחת בלבד</p>
            </div>
        );
    }

    return (
        <div className="app">
            <Header user={user} isAdmin={isAdmin} />

            {/* <Notifications vaccines={vaccines} pregnancies={pregnancies} horses={horses} /> */}

            <Chatbot userId={user.uid} userEmail={user.email} />

            <nav className="tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label.split(' ').slice(1).join(' ')}</span>
                    </button>
                ))}
            </nav>

            <main className="main-content">
                {activeTab === 'horses' && (
                    <HorseList
                        horses={horses}
                        userId={user.uid}
                        userEmail={user.email}
                        isAdmin={isAdmin}
                        onRefresh={loadData}
                    />
                )}
                {activeTab === 'visits' && (
                    <Visits
                        visits={visits}
                        horses={horses}
                        userId={user.uid}
                        userEmail={user.email}
                        onRefresh={loadData}
                    />
                )}
                {activeTab === 'vaccines' && (
                    <Vaccines
                        vaccines={vaccines}
                        horses={horses}
                        userId={user.uid}
                        userEmail={user.email}
                        onRefresh={loadData}
                    />
                )}
                {activeTab === 'pregnancy' && (
                    <Pregnancy
                        pregnancies={pregnancies}
                        horses={horses}
                        userId={user.uid}
                        userEmail={user.email}
                        onRefresh={loadData}
                    />
                )}
            </main>
        </div>
    );
}
