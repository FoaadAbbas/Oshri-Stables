const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.db'));
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS horses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    firebaseId TEXT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    breed TEXT NOT NULL,
    gender TEXT NOT NULL,
    image TEXT,
    fatherName TEXT,
    motherName TEXT,
    certImage TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    firebaseId TEXT,
    horseId INTEGER NOT NULL,
    date TEXT NOT NULL,
    vetName TEXT NOT NULL,
    type TEXT NOT NULL,
    notes TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vaccines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    firebaseId TEXT,
    horseId INTEGER NOT NULL,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    nextDate TEXT,
    notes TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pregnancies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    firebaseId TEXT,
    horseId INTEGER NOT NULL,
    matingDate TEXT NOT NULL,
    stallionName TEXT NOT NULL,
    status TEXT NOT NULL,
    expectedDate TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  );
`);

// Prepared statements
const stmts = {
  getHorses: db.prepare('SELECT * FROM horses WHERE userId = ? ORDER BY createdAt DESC'),
  getAllHorses: db.prepare('SELECT * FROM horses ORDER BY createdAt DESC'),
  getHorse: db.prepare('SELECT * FROM horses WHERE id = ? AND userId = ?'),
  getHorseAny: db.prepare('SELECT * FROM horses WHERE id = ?'),
  addHorse: db.prepare('INSERT INTO horses (userId, firebaseId, name, age, breed, gender, image, fatherName, motherName, certImage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  updateHorse: db.prepare('UPDATE horses SET name = ?, age = ?, breed = ?, gender = ?, image = ?, fatherName = ?, motherName = ?, certImage = ? WHERE id = ? AND userId = ?'),
  deleteHorse: db.prepare('DELETE FROM horses WHERE id = ? AND userId = ?'),
  deleteHorseAdmin: db.prepare('DELETE FROM horses WHERE id = ?'),

  getVisits: db.prepare('SELECT * FROM visits WHERE userId = ? ORDER BY date DESC'),
  getVisit: db.prepare('SELECT * FROM visits WHERE id = ? AND userId = ?'),
  addVisit: db.prepare('INSERT INTO visits (userId, firebaseId, horseId, date, vetName, type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  deleteVisit: db.prepare('DELETE FROM visits WHERE id = ? AND userId = ?'),
  deleteVisitsByHorse: db.prepare('DELETE FROM visits WHERE horseId = ? AND userId = ?'),

  getVaccines: db.prepare('SELECT * FROM vaccines WHERE userId = ? ORDER BY date DESC'),
  getVaccine: db.prepare('SELECT * FROM vaccines WHERE id = ? AND userId = ?'),
  addVaccine: db.prepare('INSERT INTO vaccines (userId, firebaseId, horseId, type, date, nextDate, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  deleteVaccine: db.prepare('DELETE FROM vaccines WHERE id = ? AND userId = ?'),
  deleteVaccinesByHorse: db.prepare('DELETE FROM vaccines WHERE horseId = ? AND userId = ?'),

  getPregnancies: db.prepare('SELECT * FROM pregnancies WHERE userId = ? ORDER BY createdAt DESC'),
  getPregnancy: db.prepare('SELECT * FROM pregnancies WHERE id = ? AND userId = ?'),
  addPregnancy: db.prepare('INSERT INTO pregnancies (userId, firebaseId, horseId, matingDate, stallionName, status, expectedDate) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  deletePregnancy: db.prepare('DELETE FROM pregnancies WHERE id = ? AND userId = ?'),
  deletePregnanciesByHorse: db.prepare('DELETE FROM pregnancies WHERE horseId = ? AND userId = ?'),

  getVisitsByHorse: db.prepare('SELECT * FROM visits WHERE horseId = ?'),
  getVaccinesByHorse: db.prepare('SELECT * FROM vaccines WHERE horseId = ?'),
  getPregnanciesByHorse: db.prepare('SELECT * FROM pregnancies WHERE horseId = ?'),

  setHorseFirebaseId: db.prepare('UPDATE horses SET firebaseId = ? WHERE id = ?'),
  setVisitFirebaseId: db.prepare('UPDATE visits SET firebaseId = ? WHERE id = ?'),
  setVaccineFirebaseId: db.prepare('UPDATE vaccines SET firebaseId = ? WHERE id = ?'),
  setPregnancyFirebaseId: db.prepare('UPDATE pregnancies SET firebaseId = ? WHERE id = ?'),

  updateHorseFirebaseId: db.prepare('UPDATE horses SET firebaseId = ? WHERE id = ?'),
};

module.exports = {
  // Horses
  getHorses(userId) {
    return stmts.getHorses.all(userId);
  },
  getAllHorses() {
    return stmts.getAllHorses.all();
  },
  getHorse(id, userId) {
    return stmts.getHorse.get(id, userId);
  },
  getHorseAny(id) {
    return stmts.getHorseAny.get(id);
  },
  addHorse(userId, { name, age, breed, gender, image, fatherName, motherName, certImage, firebaseId }) {
    const info = stmts.addHorse.run(userId, firebaseId || null, name, age, breed, gender, image || null, fatherName || null, motherName || null, certImage || null);
    return { id: info.lastInsertRowid, userId, firebaseId, name, age, breed, gender, image, fatherName, motherName, certImage };
  },
  updateHorse(id, userId, { name, age, breed, gender, image, fatherName, motherName, certImage }) {
    stmts.updateHorse.run(name, age, breed, gender, image || null, fatherName || null, motherName || null, certImage || null, id, userId);
    return { id: parseInt(id), userId, name, age, breed, gender, image, fatherName, motherName, certImage };
  },
  deleteHorse(id, userId) {
    const horse = stmts.getHorse.get(id, userId);
    stmts.deleteVisitsByHorse.run(id, userId);
    stmts.deleteVaccinesByHorse.run(id, userId);
    stmts.deletePregnanciesByHorse.run(id, userId);
    stmts.deleteHorse.run(id, userId);
    return horse; // return for firebaseId
  },
  deleteHorseAdmin(id) {
    const horse = stmts.getHorseAny.get(id);
    if (horse) {
      // Get related records before deleting
      const relatedVisits = stmts.getVisitsByHorse.all(id);
      const relatedVaccines = stmts.getVaccinesByHorse.all(id);
      const relatedPregnancies = stmts.getPregnanciesByHorse.all(id);
      db.prepare('DELETE FROM visits WHERE horseId = ?').run(id);
      db.prepare('DELETE FROM vaccines WHERE horseId = ?').run(id);
      db.prepare('DELETE FROM pregnancies WHERE horseId = ?').run(id);
      stmts.deleteHorseAdmin.run(id);
      return { horse, relatedVisits, relatedVaccines, relatedPregnancies };
    }
    return null;
  },

  // Visits
  getVisits(userId) { return stmts.getVisits.all(userId); },
  addVisit(userId, { horseId, date, vetName, type, notes, firebaseId }) {
    const info = stmts.addVisit.run(userId, firebaseId || null, horseId, date, vetName, type, notes || null);
    return { id: info.lastInsertRowid, userId, firebaseId, horseId: parseInt(horseId), date, vetName, type, notes };
  },
  deleteVisit(id, userId) {
    const visit = stmts.getVisit.get(id, userId);
    stmts.deleteVisit.run(id, userId);
    return visit;
  },

  // Vaccines
  getVaccines(userId) { return stmts.getVaccines.all(userId); },
  addVaccine(userId, { horseId, type, date, nextDate, notes, firebaseId }) {
    const info = stmts.addVaccine.run(userId, firebaseId || null, horseId, type, date, nextDate || null, notes || null);
    return { id: info.lastInsertRowid, userId, firebaseId, horseId: parseInt(horseId), type, date, nextDate, notes };
  },
  deleteVaccine(id, userId) {
    const vaccine = stmts.getVaccine.get(id, userId);
    stmts.deleteVaccine.run(id, userId);
    return vaccine;
  },

  // Pregnancies
  getPregnancies(userId) { return stmts.getPregnancies.all(userId); },
  addPregnancy(userId, { horseId, matingDate, stallionName, status, expectedDate, firebaseId }) {
    const info = stmts.addPregnancy.run(userId, firebaseId || null, horseId, matingDate, stallionName, status, expectedDate);
    return { id: info.lastInsertRowid, userId, firebaseId, horseId: parseInt(horseId), matingDate, stallionName, status, expectedDate };
  },
  deletePregnancy(id, userId) {
    const pregnancy = stmts.getPregnancy.get(id, userId);
    stmts.deletePregnancy.run(id, userId);
    return pregnancy;
  },

  // FirebaseId updates
  setHorseFirebaseId(id, firebaseId) { stmts.setHorseFirebaseId.run(firebaseId, id); },
  setVisitFirebaseId(id, firebaseId) { stmts.setVisitFirebaseId.run(firebaseId, id); },
  setVaccineFirebaseId(id, firebaseId) { stmts.setVaccineFirebaseId.run(firebaseId, id); },
  setPregnancyFirebaseId(id, firebaseId) { stmts.setPregnancyFirebaseId.run(firebaseId, id); },
};
