require('dotenv').config();
const db = require('../src/config/db');

async function hasColumn(table, column) {
  // Whitelist validation for table names (no special chars allowed)
  const tableWhitelist = /^[a-zA-Z0-9_]+$/;
  if (!tableWhitelist.test(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }
  
  // Use prepared statement with INFORMATION_SCHEMA (safer than SHOW COLUMNS)
  const [rows] = await db.execute(
    `SELECT COLUMN_NAME 
     FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = ? 
       AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

(async () => {
  if (!(await hasColumn('rooms', 'current_scenario_id'))) {
    await db.execute('ALTER TABLE rooms ADD COLUMN current_scenario_id INT UNSIGNED DEFAULT NULL AFTER news_id');
  }
  if (!(await hasColumn('rooms', 'game_timer'))) {
    await db.execute('ALTER TABLE rooms ADD COLUMN game_timer INT DEFAULT 60 AFTER current_scenario_id');
  }

  if (!(await hasColumn('votes', 'choice_id'))) {
    await db.execute('ALTER TABLE votes ADD COLUMN choice_id INT UNSIGNED DEFAULT NULL AFTER news_id');
  }

  await db.execute('ALTER TABLE votes MODIFY COLUMN news_id INT UNSIGNED NULL').catch(() => {});
  await db.execute("ALTER TABLE votes MODIFY COLUMN vote ENUM('fact','hoax') NULL").catch(() => {});
  await db.execute('DELETE FROM votes').catch(() => {});

  console.log('Story schema repaired for active database.');
  await db.end();
})().catch(async (err) => {
  console.error(err);
  await db.end().catch(() => {});
  process.exit(1);
});
