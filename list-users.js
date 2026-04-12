const {db} = require('./server/db');
console.log(db.prepare('SELECT id, username, is_admin FROM users').all());
