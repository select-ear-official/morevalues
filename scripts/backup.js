import { dbManager } from '../src/dbManager.js';
import fs from 'fs';
import path from 'path';

async function backup() {
  try {
    await dbManager.init();
    
    // Fetch all records
    const users = await dbManager.all('SELECT * FROM users');
    const tests = await dbManager.all('SELECT * FROM tests');
    
    const backupData = {
      timestamp: new Date().toISOString(),
      users,
      tests
    };
    
    // Write to data/backup.json
    const backupDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupPath = path.join(backupDir, 'backup.json');
    
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup completed successfully! Saved ${users.length} users and ${tests.length} tests to: ${backupPath}`);
  } catch (err) {
    console.error('❌ Backup failed:', err);
  } finally {
    process.exit(0);
  }
}

backup();
