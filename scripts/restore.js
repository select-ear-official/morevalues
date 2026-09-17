import { dbManager } from '../src/dbManager.js';
import fs from 'fs';
import path from 'path';

async function restore() {
  try {
    const backupPath = path.join(process.cwd(), 'data', 'backup.json');
    if (!fs.existsSync(backupPath)) {
      console.error('❌ Restore failed: Backup file not found at', backupPath);
      process.exit(1);
    }
    
    console.log(`Reading backup from ${backupPath}...`);
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    await dbManager.init();
    
    let userCount = 0;
    // Restore users safely using UPSERT strategy (INSERT OR REPLACE)
    if (backupData.users && backupData.users.length > 0) {
      for (const user of backupData.users) {
        await dbManager.run(
          `INSERT OR REPLACE INTO users (
            id, username, password, bio, socialMedia, profilePicture,
            email, emailVerified, verificationToken, resetToken, resetTokenExpires
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id, user.username, user.password, user.bio || null, user.socialMedia || null, user.profilePicture || null,
            user.email || null, user.emailVerified || 0, user.verificationToken || null, user.resetToken || null, user.resetTokenExpires || null
          ]
        );
        userCount++;
      }
    }
    
    let testCount = 0;
    // Restore tests safely using UPSERT strategy (INSERT OR REPLACE)
    if (backupData.tests && backupData.tests.length > 0) {
      for (const test of backupData.tests) {
        await dbManager.run(
          `INSERT OR REPLACE INTO tests (
            id, ownerId, title, description, author, axisCount, questionCount,
            publishedAt, document, draftDocument, isDraft, deletedAt, slug, views, plays, tags
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            test.id, test.ownerId, test.title, test.description || null, test.author || null,
            test.axisCount || 4, test.questionCount || 0, test.publishedAt || new Date().toISOString(),
            test.document || null, test.draftDocument || null, test.isDraft || 0, test.deletedAt || null,
            test.slug || null, test.views || 0, test.plays || 0, test.tags || null
          ]
        );
        testCount++;
      }
    }
    
    console.log(`✅ Restore completed successfully! Upserted ${userCount} users and ${testCount} tests.`);
  } catch (err) {
    console.error('❌ Restore failed:', err);
  } finally {
    process.exit(0);
  }
}

restore();
