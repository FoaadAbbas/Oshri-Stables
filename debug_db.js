const db = require('./server/database');

console.log('--- USERS ---');
// There is no users table, users are just IDs in other tables.
// Let's find distinct userIds
const horses = db.getAllHorses();
const userIds = [...new Set(horses.map(h => h.userId))];
console.log('User IDs found in horses:', userIds);

console.log('\n--- VISITS ---');
const visits = db.stmts.getVisits.all(userIds[0] || 'no-user'); // Try to fetch for the first user found
console.log(`Found ${visits.length} visits for user ${userIds[0]}`);
// Check all visits globally to see if they exist at all
const allVisits = db.db.prepare('SELECT * FROM visits').all();
console.log(`Total visits in DB: ${allVisits.length}`);
if (allVisits.length > 0) {
    console.log('Sample visit:', allVisits[0]);
}

console.log('\n--- PREGNANCIES ---');
const pregnancies = db.stmts.getPregnancies.all(userIds[0] || 'no-user');
console.log(`Found ${pregnancies.length} pregnancies for user ${userIds[0]}`);
const allPregnancies = db.db.prepare('SELECT * FROM pregnancies').all();
console.log(`Total pregnancies in DB: ${allPregnancies.length}`);
if (allPregnancies.length > 0) {
    console.log('Sample pregnancy:', allPregnancies[0]);
}
