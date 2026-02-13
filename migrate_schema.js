const db = require('./server/database');

console.log('Running Schema Migration...');

try {
    db.db.exec("ALTER TABLE horses ADD COLUMN fatherName TEXT");
    console.log('Added fatherName');
} catch (e) {
    if (!e.message.includes('duplicate column name')) console.error(e.message);
}

try {
    db.db.exec("ALTER TABLE horses ADD COLUMN motherName TEXT");
    console.log('Added motherName');
} catch (e) {
    if (!e.message.includes('duplicate column name')) console.error(e.message);
}

try {
    db.db.exec("ALTER TABLE horses ADD COLUMN certImage TEXT");
    console.log('Added certImage');
} catch (e) {
    if (!e.message.includes('duplicate column name')) console.error(e.message);
}

console.log('Schema Migration Complete.');
