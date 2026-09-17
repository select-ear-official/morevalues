/**
 * app.js
 * 
 * Main Express application configuration and route definitions.
 * This file handles all REST API endpoints for the MoreValues backend,
 * including user authentication, profile management, and test CRUD operations.
 */
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { dbManager } from './dbManager.js';
import rateLimit from 'express-rate-limit';
import { sendVerificationEmail, sendPasswordResetEmail } from './services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const SECRET_FILE = path.join(DATA_DIR, 'secret.json');

// Ensure storage directories exist only if we have filesystem access (fails silently on Vercel)
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    // Ignore, running in serverless read-only environment
  }
}

// Generate or load JWT Secret
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (fs.existsSync(SECRET_FILE)) {
    const secretData = JSON.parse(fs.readFileSync(SECRET_FILE, 'utf8'));
    JWT_SECRET = secretData.secret;
  } else if (process.env.VERCEL) {
    throw new Error('JWT_SECRET environment variable is required in production.');
  } else {
    // Local dev: generate and persist
    JWT_SECRET = crypto.randomBytes(64).toString('hex');
    try {
      fs.writeFileSync(SECRET_FILE, JSON.stringify({ secret: JWT_SECRET }));
    } catch (e) {
      console.warn("Could not save secret.json locally.");
    }
  }
}

function generateId() {
  return crypto.randomBytes(4).toString('hex');
}

/** Escapes HTML special characters to prevent injection in server-rendered templates. */
function sanitizeForHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function encodeSlug(title) {
  let slug = title.replace(/ /g, '-');
  return encodeURIComponent(slug).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

export const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ---------------- RATE LIMITERS ---------------- //

const isTestEnv = process.env.NODE_ENV === 'test';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  message: { success: false, error: 'Too many attempts. Please try again later.' }
});

const publishLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  message: { success: false, error: 'Publishing rate limit reached. Please try again later.' }
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  message: { success: false, error: 'Too many requests. Please slow down.' }
});

app.use('/api/', generalLimiter);

// ---------------- ENGAGEMENT COOLDOWNS ---------------- //

// In-memory cooldown maps for view/play counters
const viewCooldowns = new Map();
const playCooldowns = new Map();

// Prune expired cooldown entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of viewCooldowns) {
    if (now - ts > 60000) viewCooldowns.delete(key);
  }
  for (const [key, ts] of playCooldowns) {
    if (now - ts > 60000) playCooldowns.delete(key);
  }
}, 5 * 60 * 1000);

// ---------------- MIDDLEWARE ---------------- //

/**
 * authMiddleware
 * Extracts the JWT from the Authorization header and verifies it.
 * If valid, attaches the decoded user payload to req.user.
 * Does not block the request if the token is invalid or missing (use requireAuth for that).
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // invalid token, just clear user
    }
  }
  next();
};

/**
 * requireAuth
 * Middleware to enforce authentication. Must be used AFTER authMiddleware.
 * Blocks the request with a 401 Unauthorized if req.user is not set.
 */
const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
  next();
};

// ---------------- API ENDPOINTS ---------------- //

/**
 * POST /api/register
 * Registers a new user account with a unique username and hashed password.
 * Optionally accepts an email address and sends a verification link.
 */
app.post('/api/register', authLimiter, async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'Username and password required' });
    
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ success: false, error: 'Username must be between 3 and 20 characters' });
    }
    if (password.length < 6 || password.length > 100) {
      return res.status(400).json({ success: false, error: 'Password must be between 6 and 100 characters' });
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({ success: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' });
    }

    if (email) {
      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, error: 'Invalid email address' });
      }
      const existingEmail = await dbManager.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ success: false, error: 'Email address already registered' });
      }
    }
    
    const existing = await dbManager.getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Username already taken' });
    }

    const id = generateId();
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = email ? crypto.randomBytes(32).toString('hex') : null;
    
    await dbManager.createUser(id, username, hashedPassword, email, verificationToken);

    if (email && verificationToken) {
      const origin = req.headers.origin || 'http://localhost:5173';
      sendVerificationEmail(email, username, verificationToken, origin).catch(err => console.error("Email send err:", err));
    }

    const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      success: true, 
      token, 
      user: { 
        id, 
        username, 
        email: email || null, 
        emailVerified: false 
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/login
 * Authenticates a user and returns a signed JWT token valid for 7 days.
 */
app.post('/api/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await dbManager.getUserByUsername(username);
    
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user.id, 
        username: user.username,
        email: user.email || null,
        emailVerified: !!user.emailVerified
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, requireAuth, async (req, res) => {
  try {
    const user = await dbManager.getUserById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username,
        email: user.email || null,
        emailVerified: !!user.emailVerified
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/auth/username
 * Changes the authenticated user's username, cascades author updates, and issues a new JWT.
 */
app.put('/api/auth/username', authMiddleware, requireAuth, authLimiter, async (req, res) => {
  try {
    const { newUsername } = req.body;
    if (!newUsername || typeof newUsername !== 'string') {
      return res.status(400).json({ success: false, error: 'New username required' });
    }

    if (newUsername.length < 3 || newUsername.length > 20) {
      return res.status(400).json({ success: false, error: 'Username must be between 3 and 20 characters' });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
      return res.status(400).json({ success: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' });
    }

    const existing = await dbManager.getUserByUsername(newUsername);
    if (existing && existing.id !== req.user.id) {
      return res.status(400).json({ success: false, error: 'Username is already taken' });
    }

    const oldUsername = req.user.username;
    await dbManager.updateUsername(req.user.id, newUsername, oldUsername);

    const newToken = jwt.sign({ id: req.user.id, username: newUsername }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      success: true, 
      token: newToken, 
      user: { id: req.user.id, username: newUsername },
      message: 'Username updated successfully' 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/auth/password
 * Changes the user's password after verifying the current password.
 */
app.put('/api/auth/password', authMiddleware, requireAuth, authLimiter, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current password and new password required' });
    }

    if (newPassword.length < 6 || newPassword.length > 100) {
      return res.status(400).json({ success: false, error: 'New password must be between 6 and 100 characters' });
    }

    const user = await dbManager.getUserById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ success: false, error: 'Incorrect current password' });
    }

    const newHashed = await bcrypt.hash(newPassword, 10);
    await dbManager.updatePassword(req.user.id, newHashed);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/auth/email
 * Updates user's email address and sends a verification link.
 */
app.put('/api/auth/email', authMiddleware, requireAuth, authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Valid email address required' });
    }

    const existing = await dbManager.getUserByEmail(email);
    if (existing && existing.id !== req.user.id) {
      return res.status(400).json({ success: false, error: 'Email address already in use by another account' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await dbManager.updateEmail(req.user.id, email, verificationToken);

    const origin = req.headers.origin || 'http://localhost:5173';
    sendVerificationEmail(email, req.user.username, verificationToken, origin).catch(err => console.error("Email send err:", err));

    res.json({ success: true, message: 'Email updated. A verification link has been sent to your email.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resends the email verification link to the logged-in user.
 */
app.post('/api/auth/resend-verification', authMiddleware, requireAuth, authLimiter, async (req, res) => {
  try {
    const user = await dbManager.getUserById(req.user.id);
    if (!user || !user.email) {
      return res.status(400).json({ success: false, error: 'No email address associated with this account' });
    }
    if (user.emailVerified) {
      return res.status(400).json({ success: false, error: 'Email is already verified' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await dbManager.updateEmail(user.id, user.email, verificationToken);

    const origin = req.headers.origin || 'http://localhost:5173';
    sendVerificationEmail(user.email, user.username, verificationToken, origin).catch(err => console.error("Email send err:", err));

    res.json({ success: true, message: 'Verification link resent' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/verify-email
 * Verifies an email address using the token sent via email.
 */
app.post('/api/auth/verify-email', authLimiter, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Verification token required' });
    }

    const verifiedUser = await dbManager.verifyEmailByToken(token);
    if (!verifiedUser) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification token' });
    }

    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/forgot-password
 * Initiates a password reset flow. Responds consistently to prevent account enumeration.
 */
app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (email && typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const user = await dbManager.getUserByEmail(email);
      if (user) {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresIso = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 mins

        await dbManager.setResetToken(user.email, hashedToken, expiresIso);

        const origin = req.headers.origin || 'http://localhost:5173';
        sendPasswordResetEmail(user.email, user.username, rawToken, origin).catch(err => console.error("Reset email err:", err));
      }
    }

    // Always return success to protect against account enumeration
    res.json({ 
      success: true, 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/reset-password
 * Resets a user's password using a valid, unexpired reset token.
 */
app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Token and new password required' });
    }

    if (newPassword.length < 6 || newPassword.length > 100) {
      return res.status(400).json({ success: false, error: 'Password must be between 6 and 100 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await dbManager.getUserByResetToken(hashedToken);

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired password reset link. Please request a new one.' });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await dbManager.updatePassword(user.id, newHashedPassword);

    res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/profile/:username
 * Fetches public profile data (bio, social media, avatar) and published tests
 * for a specific user.
 */
app.get('/api/profile/:username', authMiddleware, async (req, res) => {
  try {
    const user = await dbManager.getUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    const isOwner = req.user && req.user.id === user.id;
    const userTests = await dbManager.getTestsByOwner(user.id);
    
    res.json({
      success: true,
      profile: {
        username: user.username,
        bio: user.bio,
        socialMedia: user.socialMedia,
        profilePicture: user.profilePicture,
        ...(isOwner ? { email: user.email || null, emailVerified: !!user.emailVerified } : {})
      },
      tests: userTests.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        author: t.author,
        axisCount: t.axisCount,
        questionCount: t.questionCount,
        publishedAt: t.publishedAt,
        thumbnail: t.thumbnail,
        views: t.views,
        plays: t.plays,
        isDraft: t.isDraft
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/profile/:username/recycle-bin', authMiddleware, requireAuth, async (req, res) => {
  try {
    const user = await dbManager.getUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    
    if (user.id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const allTests = await dbManager.getTestsByOwner(user.id);
    const recycleBinTests = allTests.filter(t => t.deletedAt !== null);
    
    res.json({
      success: true,
      tests: recycleBinTests.map(t => ({
        id: t.id,
        title: t.title,
        deletedAt: t.deletedAt
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/profile
 * Updates the authenticated user's profile details (bio, social media, avatar).
 * Validates payload size and format for images.
 */
app.put('/api/profile', authMiddleware, requireAuth, async (req, res) => {
  try {
    const { bio, socialMedia, profilePicture } = req.body;
    
    if (bio && (typeof bio !== 'string' || bio.length > 500)) {
      return res.status(400).json({ success: false, error: 'Bio must be under 500 characters' });
    }
    
    if (socialMedia && (typeof socialMedia !== 'string' || socialMedia.length > 100)) {
      return res.status(400).json({ success: false, error: 'Social media link must be under 100 characters' });
    }
    
    // Bug Fix 8: Stricter URL validation using URL constructor
    if (socialMedia) {
      try {
        const url = new URL(socialMedia);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch {
        return res.status(400).json({ success: false, error: 'Social media link must be a valid URL starting with http:// or https://' });
      }
    }
    
    if (profilePicture && typeof profilePicture === 'string') {
      if (profilePicture.length > 7 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: 'Profile picture payload is too large' });
      }
      // Bug Fix 6: Reject SVG uploads
      if (profilePicture.startsWith('data:image/svg')) {
        return res.status(400).json({ success: false, error: 'SVG images are not allowed' });
      }
      if (!profilePicture.startsWith('data:image/') && !profilePicture.startsWith('https://api.dicebear.com/')) {
        return res.status(400).json({ success: false, error: 'Invalid profile picture format' });
      }
    }

    await dbManager.updateUserProfile(req.user.id, bio, socialMedia, profilePicture);
    
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/tags
 * Fetches a list of all unique tags used across tests.
 */
app.get('/api/tags', async (req, res) => {
  try {
    const tags = await dbManager.getAllTags();
    res.json({ success: true, tags });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/tests
 * Fetches a paginated list of publicly published tests from all users.
 */
app.get('/api/tests', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const tests = await dbManager.getPublishedTests(limit, offset);
    res.json({ success: true, tests, page, limit, hasMore: tests.length === limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/tests/by-slug/:username/:slug', async (req, res) => {
  try {
    const testData = await dbManager.getTestBySlug(req.params.username, req.params.slug);
    if (!testData) {
      return res.status(404).json({ success: false, error: 'Test not found' });
    }
    res.json({ success: true, test: testData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/tests/:id', async (req, res) => {
  try {
    const testData = await dbManager.getTestById(req.params.id);
    if (!testData) {
      return res.status(404).json({ success: false, error: 'Test not found' });
    }
    res.json({ success: true, test: testData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tests/:id/view
 * Increments the view counter for a specific test.
 * IP-debounced: same IP can only increment once per 60 seconds per test.
 */
app.post('/api/tests/:id/view', async (req, res) => {
  try {
    const key = `${req.ip}:${req.params.id}`;
    const now = Date.now();
    if (viewCooldowns.has(key) && now - viewCooldowns.get(key) < 60000) {
      return res.json({ success: true }); // silently ignore duplicate
    }
    viewCooldowns.set(key, now);
    await dbManager.incrementTestViews(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tests/:id/play
 * Increments the play counter for a specific test.
 * IP-debounced: same IP can only increment once per 60 seconds per test.
 */
app.post('/api/tests/:id/play', async (req, res) => {
  try {
    const key = `${req.ip}:${req.params.id}`;
    const now = Date.now();
    if (playCooldowns.has(key) && now - playCooldowns.get(key) < 60000) {
      return res.json({ success: true }); // silently ignore duplicate
    }
    playCooldowns.set(key, now);
    await dbManager.incrementTestPlays(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/publish
 * Publishes or saves a draft of a test.
 * Returns 403 if the user attempts to overwrite a test they don't own.
 * Validates the complete structure of the test JSON (axes, questions, ideologies).
 */
app.post('/api/publish', authMiddleware, requireAuth, publishLimiter, async (req, res) => {
  try {
    const test = req.body;
    if (!test || !test.title || !Array.isArray(test.axes) || !Array.isArray(test.questions)) {
      return res.status(400).json({ success: false, error: 'Invalid test payload' });
    }

    if (typeof test.title !== 'string' || test.title.length < 1 || test.title.length > 100) {
      return res.status(400).json({ success: false, error: 'Title must be between 1 and 100 characters' });
    }
    if (test.description && (typeof test.description !== 'string' || test.description.length > 2000)) {
      return res.status(400).json({ success: false, error: 'Description must be under 2000 characters' });
    }
    if (test.axes.length < 2 || test.axes.length > 20) {
      return res.status(400).json({ success: false, error: 'Test must have between 2 and 20 axes' });
    }
    if (test.questions.length < 1 || test.questions.length > 250) {
      return res.status(400).json({ success: false, error: 'Test must have between 1 and 250 questions' });
    }
    if (test.ideologies && (!Array.isArray(test.ideologies) || test.ideologies.length > 100)) {
      return res.status(400).json({ success: false, error: 'Test cannot exceed 100 ideologies' });
    }
    if (test.tags) {
      if (!Array.isArray(test.tags) || test.tags.length > 5) {
        return res.status(400).json({ success: false, error: 'Test cannot exceed 5 tags' });
      }
      for (const tag of test.tags) {
        if (typeof tag !== 'string' || tag.length > 30) {
          return res.status(400).json({ success: false, error: 'Tags must be strings under 30 characters' });
        }
      }
    }
    // Bug Fix 6: Reject SVG thumbnails and favicons
    if (test.thumbnail) {
      if (typeof test.thumbnail !== 'string' || test.thumbnail.length > 3 * 1024 * 1024 || !test.thumbnail.startsWith('data:image/')) {
        return res.status(400).json({ success: false, error: 'Invalid thumbnail format or size' });
      }
      if (test.thumbnail.startsWith('data:image/svg')) {
        return res.status(400).json({ success: false, error: 'SVG images are not allowed for thumbnails' });
      }
    }
    if (test.favicon) {
      if (typeof test.favicon !== 'string' || test.favicon.length > 3 * 1024 * 1024 || !test.favicon.startsWith('data:image/')) {
        return res.status(400).json({ success: false, error: 'Invalid favicon format or size' });
      }
      if (test.favicon.startsWith('data:image/svg')) {
        return res.status(400).json({ success: false, error: 'SVG images are not allowed for favicons' });
      }
    }

    let testId = test.id && test.id !== '8values-classic' ? test.id : generateId();
    const isDraft = test.isDraft ? 1 : 0;
    
    // Bug Fix 7: Explicit 403 instead of silent fork
    const existingOwner = await dbManager.getTestOwnerId(testId);
    if (existingOwner && existingOwner !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not own this test. Use the Fork button to create your own copy.' 
      });
    }

    // Check for unique title for this user
    const existingTitleRow = await dbManager.checkTitleExistsForUser(req.user.id, test.title, testId);
    if (existingTitleRow) {
      return res.status(400).json({ success: false, error: `You already have a test named "${test.title}". Please choose a unique name.` });
    }

    const slug = test.slug || encodeSlug(test.title);
    const publishedTest = {
      ...test,
      id: testId,
      ownerId: req.user.id,
      slug,
      publishedAt: test.publishedAt || new Date().toISOString()
    };

    await dbManager.saveTest(testId, req.user.id, publishedTest, isDraft);

    res.json({
      success: true,
      id: testId,
      ownerId: req.user.id,
      message: 'Test published successfully!',
      shareUrl: `/test/${testId}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/tests/:id
 * Soft deletes a test (moves it to the recycle bin by setting deletedAt).
 */
app.delete('/api/tests/:id', authMiddleware, requireAuth, async (req, res) => {
  try {
    const ownerId = await dbManager.getTestOwnerId(req.params.id);
    if (!ownerId) {
      return res.status(404).json({ success: false, error: 'Test not found' });
    }
    if (ownerId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not own this test' });
    }
    
    await dbManager.deleteTestSoft(req.params.id);
    res.json({ success: true, message: 'Test moved to recycle bin' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/tests/:id/permanent
 * Permanently deletes a test from the database. Cannot be undone.
 */
app.delete('/api/tests/:id/permanent', authMiddleware, requireAuth, async (req, res) => {
  try {
    const ownerId = await dbManager.getTestOwnerId(req.params.id);
    if (!ownerId) {
      return res.status(404).json({ success: false, error: 'Test not found' });
    }
    if (ownerId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not own this test' });
    }
    
    await dbManager.deleteTestPermanent(req.params.id);
    res.json({ success: true, message: 'Test permanently deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tests/:id/restore
 * Restores a soft-deleted test from the recycle bin back to the published or drafted state.
 */
app.post('/api/tests/:id/restore', authMiddleware, requireAuth, async (req, res) => {
  try {
    const ownerId = await dbManager.getTestOwnerId(req.params.id);
    if (!ownerId) {
      return res.status(404).json({ success: false, error: 'Test not found' });
    }
    if (ownerId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not own this test' });
    }
    
    await dbManager.restoreTest(req.params.id);
    res.json({ success: true, message: 'Test restored successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /t/:username/:slug
 * Server-Side SEO Meta Tag Injection route.
 * Intercepts requests for individual tests, fetches metadata, injects into index.html,
 * and serves the modified HTML to the client/bot.
 */
app.get('/t/:username/:slug', async (req, res) => {
  const { username, slug } = req.params;
  
  let title = "MoreValues";
  let description = "Create and take custom multi-axis political tests.";
  let thumbnail = "";

  try {
    const row = await dbManager.getTestBySlug(username, slug);
    if (row && row.document) {
      const test = JSON.parse(row.document);
      // Bug Fix 1: Sanitize before injecting into HTML
      title = sanitizeForHtml(test.title) + ' | MoreValues';
      if (test.description) {
        description = sanitizeForHtml(test.description);
      }
      if (test.thumbnail && test.thumbnail.startsWith('http')) {
        thumbnail = sanitizeForHtml(test.thumbnail);
      }
    }
  } catch (err) {
    console.error("SEO route error:", err);
  }

  // Load index.html
  // Attempt to read from 'dist/index.html' first (production build), then 'index.html' (dev fallback)
  let htmlPath = path.join(__dirname, '..', 'dist', 'index.html');
  if (!fs.existsSync(htmlPath)) {
    htmlPath = path.join(__dirname, '..', 'index.html');
  }

  try {
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Inject custom meta tags
    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    html = html.replace(/<meta name="description" content=".*?"\s*\/>/, `<meta name="description" content="${description}" />`);
    html = html.replace(/<meta property="og:title" content=".*?"\s*\/>/, `<meta property="og:title" content="${title}" />`);
    html = html.replace(/<meta property="og:description" content=".*?"\s*\/>/, `<meta property="og:description" content="${description}" />`);
    if (thumbnail) {
        html = html.replace(/<meta property="og:image" content=".*?"\s*\/>/, `<meta property="og:image" content="${thumbnail}" />`);
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error reading index.html");
  }
});
