const { db } = require('./server/db');
const result = db.prepare('DELETE FROM users').run();
console.log(`Removed ${result.changes} user(s).`);
