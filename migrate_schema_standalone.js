const Database = require('./server/node_modules/better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'data.db');
console.log('Opening DB at:', dbPath);

const db = new Database(dbPath);

console.log('Running Schema Migration...');

const columnsToAdd = ['fatherName', 'motherName', 'certImage'];

columnsToAdd.forEach(col => {
    try {
        db.exec(`ALTER TABLE horses ADD COLUMN ${col} TEXT`);
        console.log(`Added ${col}`);
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log(`${col} already exists`);
        } else {
            console.error(`Error adding ${col}:`, e.message);
        }
    }
});

console.log('Schema Migration Complete.');
