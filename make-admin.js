const { db } = require('./server/db');
const result = db.prepare('UPDATE users SET is_admin = 1 WHERE LOWER(username) = LOWER(?)').run('admin');
console.log(`Updated ${result.changes} row(s). 'admin' is now an admin.`);
