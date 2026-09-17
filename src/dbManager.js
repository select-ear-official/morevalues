/**
 * dbManager.js
 * 
 * Provides a Data Access Object (DAO) pattern around the database.
 * Supports both local SQLite and remote Turso via @libsql/client.
 */
import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.sqlite');

class DatabaseManager {
  constructor() {
    this.db = null;
  }

  /**
   * Initializes the database connection and sets up the schema.
   * If TURSO_DATABASE_URL is provided, it connects to Turso.
   * Otherwise, it defaults to a local file database.
   */
  async init(filename = DB_FILE) {
    let url = process.env.TURSO_DATABASE_URL || `file:${filename}`;
    
    // In serverless environments like Vercel, WebSockets (libsql://) cause massive latency 
    // due to connection overhead and timeouts. HTTP (https://) is significantly faster.
    if (url.startsWith('libsql://')) {
      url = url.replace('libsql://', 'https://');
    }

    const authToken = process.env.TURSO_AUTH_TOKEN;

    // Only attempt to create local directories if we're actually using local SQLite
    if (!process.env.TURSO_DATABASE_URL && filename.includes(DATA_DIR) && !fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    this.db = createClient({
      url,
      authToken
    });

    await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        bio TEXT,
        socialMedia TEXT,
        profilePicture TEXT
      );
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS tests (
        id TEXT PRIMARY KEY,
        ownerId TEXT,
        title TEXT,
        description TEXT,
        author TEXT,
        axisCount INTEGER,
        questionCount INTEGER,
        publishedAt TEXT,
        document TEXT,
        draftDocument TEXT DEFAULT NULL,
        isDraft INTEGER DEFAULT 0,
        deletedAt TEXT,
        slug TEXT,
        FOREIGN KEY(ownerId) REFERENCES users(id)
      );
    `);
    
    // Dynamically add columns for users (email, verification, password reset)
    const userColumns = await this.all("PRAGMA table_info(users)");
    const userColNames = userColumns.map(c => c.name);
    
    if (!userColNames.includes('email')) {
      await this.run("ALTER TABLE users ADD COLUMN email TEXT");
    }
    if (!userColNames.includes('emailVerified')) {
      await this.run("ALTER TABLE users ADD COLUMN emailVerified INTEGER DEFAULT 0");
    }
    if (!userColNames.includes('verificationToken')) {
      await this.run("ALTER TABLE users ADD COLUMN verificationToken TEXT");
    }
    if (!userColNames.includes('resetToken')) {
      await this.run("ALTER TABLE users ADD COLUMN resetToken TEXT");
    }
    if (!userColNames.includes('resetTokenExpires')) {
      await this.run("ALTER TABLE users ADD COLUMN resetTokenExpires TEXT");
    }

    // Dynamically add columns for engagement, tags, and drafts if they don't exist
    const columns = await this.all("PRAGMA table_info(tests)");
    const colNames = columns.map(c => c.name);
    
    if (!colNames.includes('views')) {
      await this.run("ALTER TABLE tests ADD COLUMN views INTEGER DEFAULT 0");
    }
    if (!colNames.includes('plays')) {
      await this.run("ALTER TABLE tests ADD COLUMN plays INTEGER DEFAULT 0");
    }
    if (!colNames.includes('tags')) {
      await this.run("ALTER TABLE tests ADD COLUMN tags TEXT");
    }
    if (!colNames.includes('draftDocument')) {
      await this.run("ALTER TABLE tests ADD COLUMN draftDocument TEXT DEFAULT NULL");
    }
    if (!colNames.includes('slug')) {
      await this.run("ALTER TABLE tests ADD COLUMN slug TEXT");
    }

    return this.db;
  }
  
  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // --- Core Query Wrappers ---

  async run(sql, args = []) {
    if (!this.db) throw new Error("Database not initialized.");
    return await this.db.execute({ sql, args });
  }

  async get(sql, args = []) {
    if (!this.db) throw new Error("Database not initialized.");
    const res = await this.db.execute({ sql, args });
    return res.rows.length > 0 ? res.rows[0] : undefined;
  }

  async all(sql, args = []) {
    if (!this.db) throw new Error("Database not initialized.");
    const res = await this.db.execute({ sql, args });
    return res.rows;
  }

  // --- Users ---
  
  async getUserByUsername(username) {
    return await this.get('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username]);
  }

  async getUserByEmail(email) {
    if (!email) return null;
    return await this.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
  }

  async getUserById(id) {
    return await this.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  async createUser(id, username, passwordHash, email = null, verificationToken = null) {
    await this.run(
      'INSERT INTO users (id, username, password, email, verificationToken, emailVerified) VALUES (?, ?, ?, ?, ?, ?)',
      [id, username, passwordHash, email ? email.toLowerCase() : null, verificationToken, 0]
    );
  }

  async updateUsername(userId, newUsername, oldUsername) {
    await this.run('UPDATE users SET username = ? WHERE id = ?', [newUsername, userId]);
    if (oldUsername) {
      await this.run('UPDATE tests SET author = ? WHERE ownerId = ? AND (author = ? OR author IS NULL)', [newUsername, userId, oldUsername]);
    }
  }

  async updatePassword(userId, newPasswordHash) {
    await this.run('UPDATE users SET password = ?, resetToken = NULL, resetTokenExpires = NULL WHERE id = ?', [newPasswordHash, userId]);
  }

  async updateEmail(userId, newEmail, verificationToken) {
    await this.run(
      'UPDATE users SET email = ?, emailVerified = 0, verificationToken = ? WHERE id = ?',
      [newEmail ? newEmail.toLowerCase() : null, verificationToken, userId]
    );
  }

  async setResetToken(email, hashedToken, expiresIso) {
    await this.run(
      'UPDATE users SET resetToken = ?, resetTokenExpires = ? WHERE LOWER(email) = LOWER(?)',
      [hashedToken, expiresIso, email]
    );
  }

  async getUserByResetToken(hashedToken) {
    return await this.get(
      "SELECT * FROM users WHERE resetToken = ? AND datetime(resetTokenExpires) > datetime('now')",
      [hashedToken]
    );
  }

  async verifyEmailByToken(token) {
    const user = await this.get('SELECT * FROM users WHERE verificationToken = ?', [token]);
    if (!user) return null;
    await this.run('UPDATE users SET emailVerified = 1, verificationToken = NULL WHERE id = ?', [user.id]);
    return user;
  }

  async updateUserProfile(id, bio, socialMedia, profilePicture) {
    await this.run(`
      UPDATE users 
      SET bio = ?, socialMedia = ?, profilePicture = ?
      WHERE id = ?
    `, [bio || '', socialMedia || '', profilePicture || '', id]);
  }

  // --- Tests ---

  async getPublishedTests(limit = 50, offset = 0) {
    return await this.all(`
      SELECT q.id, q.title, q.description, q.author, q.axisCount, q.questionCount, q.publishedAt, q.views, q.plays, q.tags, json_extract(q.document, '$.thumbnail') as thumbnail, u.username as ownerUsername
      FROM tests q
      LEFT JOIN users u ON q.ownerId = u.id
      WHERE (q.isDraft = 0 OR q.isDraft IS NULL) AND q.deletedAt IS NULL
      ORDER BY q.publishedAt DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
  }

  async getTestBySlug(username, slug) {
    const row = await this.get(`
      SELECT t.document, t.draftDocument, t.id, u.username as ownerUsername
      FROM tests t
      JOIN users u ON t.ownerId = u.id
      WHERE LOWER(u.username) = LOWER(?)
        AND t.slug = ?
        AND t.deletedAt IS NULL
    `, [username, slug]);
    if (row && !row.document && row.draftDocument) {
        // Fallback for unpublished drafts being accessed via slug in some scenarios
        row.document = row.draftDocument;
    }
    return row;
  }

  async getTestById(id) {
    const row = await this.get(`
      SELECT t.document, t.draftDocument, u.username as ownerUsername 
      FROM tests t 
      LEFT JOIN users u ON t.ownerId = u.id 
      WHERE t.id = ?
    `, [id]);
    return row;
  }

  async getTestOwnerId(id) {
    const row = await this.get('SELECT ownerId FROM tests WHERE id = ?', [id]);
    return row ? row.ownerId : null;
  }

  async checkTitleExistsForUser(ownerId, title, excludeTestId) {
    return await this.get(
      'SELECT id FROM tests WHERE ownerId = ? AND LOWER(title) = LOWER(?) AND id != ? AND deletedAt IS NULL', 
      [ownerId, title, excludeTestId]
    );
  }

  async saveTest(testId, ownerId, test, isDraft) {
    const documentString = JSON.stringify(test);
    const tagsString = JSON.stringify(test.tags || []);
    
    const draftInt = isDraft ? 1 : 0;
    
    // SQLite UPSERT syntax
    await this.run(`
      INSERT INTO tests (
        id, ownerId, title, description, author, axisCount, questionCount, 
        publishedAt, document, draftDocument, isDraft, tags, slug, views, plays
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, 
        CASE WHEN ? = 1 THEN NULL ELSE ? END, 
        CASE WHEN ? = 1 THEN ? ELSE NULL END, 
        ?, ?, ?, 
        COALESCE((SELECT views FROM tests WHERE id = ?), 0),
        COALESCE((SELECT plays FROM tests WHERE id = ?), 0)
      )
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        author = excluded.author,
        axisCount = excluded.axisCount,
        questionCount = excluded.questionCount,
        tags = excluded.tags,
        slug = excluded.slug,
        document = CASE WHEN excluded.isDraft = 0 THEN excluded.document ELSE tests.document END,
        draftDocument = CASE WHEN excluded.isDraft = 1 THEN excluded.draftDocument ELSE NULL END,
        isDraft = CASE WHEN tests.isDraft = 0 THEN 0 ELSE excluded.isDraft END
    `, [
      testId, ownerId, test.title || 'Untitled', test.description || '', test.author || 'Anonymous',
      test.axes?.length || 4, test.questions?.length || 0, new Date().toISOString(),
      draftInt, documentString, // logic for document insert
      draftInt, documentString, // logic for draftDocument insert
      draftInt, tagsString, test.slug || null, testId, testId
    ]);
  }

  async deleteTestSoft(id) {
    const now = new Date().toISOString();
    await this.run('UPDATE tests SET deletedAt = ? WHERE id = ?', [now, id]);
  }

  async deleteTestPermanent(id) {
    await this.run('DELETE FROM tests WHERE id = ?', [id]);
  }

  async restoreTest(id) {
    await this.run('UPDATE tests SET deletedAt = NULL WHERE id = ?', [id]);
  }

  async getTestsByOwner(ownerId) {
    return await this.all(`
      SELECT q.id, q.title, q.description, q.author, q.axisCount, q.questionCount, q.publishedAt, q.isDraft, q.deletedAt, q.views, q.plays, q.tags, json_extract(q.document, '$.thumbnail') as thumbnail,
             (CASE WHEN q.draftDocument IS NOT NULL THEN 1 ELSE 0 END) as hasDraft
      FROM tests q
      WHERE q.ownerId = ?
      ORDER BY q.publishedAt DESC
    `, [ownerId]);
  }

  async cleanupRecycleBin() {
    await this.run(`DELETE FROM tests WHERE deletedAt IS NOT NULL AND deletedAt < datetime('now', '-30 days')`);
  }

  async incrementTestViews(id) {
    await this.run('UPDATE tests SET views = views + 1 WHERE id = ?', [id]);
  }

  async incrementTestPlays(id) {
    await this.run('UPDATE tests SET plays = plays + 1 WHERE id = ?', [id]);
  }

  async getAllTags() {
    const rows = await this.all("SELECT tags FROM tests WHERE tags IS NOT NULL AND tags != '[]'");
    const tagsSet = new Set(['politics', 'leftism', 'rightism']);
    rows.forEach(row => {
      try {
        const parsed = JSON.parse(row.tags);
        if (Array.isArray(parsed)) {
          parsed.forEach(t => {
            if (t && typeof t === 'string') tagsSet.add(t.toLowerCase().trim());
          });
        }
      } catch (e) {}
    });
    return Array.from(tagsSet);
  }
}

export const dbManager = new DatabaseManager();
