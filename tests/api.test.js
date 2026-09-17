import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { dbManager } from '../src/dbManager.js';

let authToken = '';

beforeAll(async () => {
  // Use in-memory SQLite database for testing
  await dbManager.init(':memory:');
});

afterAll(async () => {
  await dbManager.close();
});

describe('Authentication API', () => {
  it('should reject registration with a short username', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'ab', password: 'password123' });
      
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('between 3 and 20 characters');
  });

  it('should reject registration with invalid characters', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'hello world!', password: 'password123' });
      
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('only contain letters, numbers');
  });

  it('should successfully register a valid user', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'testuser', password: 'password123' });
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    
    // Save token for future authenticated requests
    authToken = res.body.token;
  });
});

describe('Profile API', () => {
  it('should reject updating profile with invalid social media url', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ socialMedia: 'invalid-url' });
      
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('valid URL');
  });
  
  it('should allow updating profile with valid data', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ bio: 'Hello World', socialMedia: 'https://twitter.com/test' });
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Publish API', () => {
  it('should reject publishing a test without axes or questions', async () => {
    const res = await request(app)
      .post('/api/publish')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'My Test' });
      
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid test payload');
  });

  it('should reject publishing a test with too few axes', async () => {
    const res = await request(app)
      .post('/api/publish')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'My Test', axes: [{}], questions: [{}] });
      
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('between 2 and 20 axes');
  });

  it('should successfully publish a valid test', async () => {
    const res = await request(app)
      .post('/api/publish')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'My Valid Test',
        axes: [
          { id: '1', left: { name: 'A' }, right: { name: 'B' } },
          { id: '2', left: { name: 'C' }, right: { name: 'D' } }
        ],
        questions: [
          { text: 'Question 1', effect: {} }
        ]
      });
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBeDefined();
  });
  
  it('should reject publishing another test with the exact same title', async () => {
    const res = await request(app)
      .post('/api/publish')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'My Valid Test', // Duplicate
        axes: [
          { id: '1', left: { name: 'A' }, right: { name: 'B' } },
          { id: '2', left: { name: 'C' }, right: { name: 'D' } }
        ],
        questions: [
          { text: 'Question 2', effect: {} }
        ]
      });
      
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('already have a test named');
  });
});


describe('Fixes / Regressions', () => {
  it('should reject invalid or expired JWT token with 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token-123');
      
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('should return thumbnail and engagement stats in published tests feed', async () => {
    // 1. Publish a test with a thumbnail
    const publishRes = await request(app)
      .post('/api/publish')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Thumbnail Test',
        thumbnail: 'data:image/png;base64,123',
        axes: [
          { id: '1', left: { name: 'A' }, right: { name: 'B' } },
          { id: '2', left: { name: 'C' }, right: { name: 'D' } }
        ],
        questions: [
          { text: 'Question 1', effect: {} }
        ]
      });
      
    expect(publishRes.status).toBe(200);
    
    // 2. Fetch all published tests
    const testsRes = await request(app).get('/api/tests');
    expect(testsRes.status).toBe(200);
    
    // 3. Verify the thumbnail is extracted correctly
    const myTest = testsRes.body.tests.find(t => t.id === publishRes.body.id);
    expect(myTest).toBeDefined();
    expect(myTest.thumbnail).toBe('data:image/png;base64,123');
    expect(myTest.views).toBeDefined();
    expect(myTest.plays).toBeDefined();
  });

  it('should return thumbnail and engagement stats in user profile feed', async () => {
    const profileRes = await request(app).get('/api/profile/testuser');
    expect(profileRes.status).toBe(200);
    
    const myTest = profileRes.body.tests.find(t => t.title === 'Thumbnail Test');
    expect(myTest).toBeDefined();
    expect(myTest.thumbnail).toBe('data:image/png;base64,123');
    expect(myTest.views).toBeDefined();
    expect(myTest.plays).toBeDefined();
  });

  it('should support pagination on GET /api/tests', async () => {
    const res = await request(app).get('/api/tests?limit=1&page=1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tests.length).toBeLessThanOrEqual(1);
    expect(res.body.limit).toBe(1);
    expect(res.body.page).toBe(1);
  });

  it('should debounce rapid view count increments from the same IP', async () => {
    const testsRes = await request(app).get('/api/tests');
    const testId = testsRes.body.tests[0]?.id;
    if (testId) {
      const firstCall = await request(app).post(`/api/tests/${testId}/view`);
      expect(firstCall.status).toBe(200);

      const secondCall = await request(app).post(`/api/tests/${testId}/view`);
      expect(secondCall.status).toBe(200);
    }
  });

  it('should return 403 Forbidden when trying to overwrite a test owned by another user', async () => {
    // 1. Get an existing test created by 'testuser'
    const testsRes = await request(app).get('/api/tests');
    const existingTest = testsRes.body.tests[0];
    expect(existingTest).toBeDefined();

    // 2. Register a second user
    const user2Res = await request(app)
      .post('/api/register')
      .send({ username: 'seconduser', password: 'password123' });
    const user2Token = user2Res.body.token;

    // 3. Attempt to overwrite the first user's test ID with second user's credentials
    const overwriteRes = await request(app)
      .post('/api/publish')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        id: existingTest.id,
        title: 'Hijacked Test',
        axes: [
          { id: '1', left: { name: 'A' }, right: { name: 'B' } },
          { id: '2', left: { name: 'C' }, right: { name: 'D' } }
        ],
        questions: [{ text: 'Q1', effect: {} }]
      });

    expect(overwriteRes.status).toBe(403);
    expect(overwriteRes.body.success).toBe(false);
    expect(overwriteRes.body.error).toContain('You do not own this test');
  });

  it('should escape HTML special characters in SEO route metadata to prevent XSS', async () => {
    // 1. Publish a test with XSS title & description
    const xssTitle = '<script>alert("xss")</script>';
    const publishRes = await request(app)
      .post('/api/publish')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: xssTitle,
        description: '<img src=x onerror=alert(1)>',
        slug: 'xss-test',
        axes: [
          { id: '1', left: { name: 'A' }, right: { name: 'B' } },
          { id: '2', left: { name: 'C' }, right: { name: 'D' } }
        ],
        questions: [{ text: 'Q', effect: {} }]
      });

    expect(publishRes.status).toBe(200);

    // 2. Check the SEO route response
    const seoRes = await request(app).get('/t/testuser/xss-test');
    expect(seoRes.status).toBe(200);
    expect(seoRes.text).not.toContain('<script>alert("xss")</script>');
    expect(seoRes.text).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(seoRes.text).not.toContain('<img src=x onerror=alert(1)>');
    expect(seoRes.text).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('should reject SVG image uploads for thumbnails and favicons', async () => {
    const svgRes = await request(app)
      .post('/api/publish')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'SVG Thumbnail Test',
        thumbnail: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
        axes: [
          { id: '1', left: { name: 'A' }, right: { name: 'B' } },
          { id: '2', left: { name: 'C' }, right: { name: 'D' } }
        ],
        questions: [{ text: 'Q', effect: {} }]
      });

    expect(svgRes.status).toBe(400);
    expect(svgRes.body.success).toBe(false);
    expect(svgRes.body.error).toContain('SVG images are not allowed');
  });
});

describe('Account Management & Email Verification', () => {
  let userToken = '';

  it('should register a new user with email and send verification link', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'accountuser', password: 'password123', email: 'user@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('user@example.com');
    expect(res.body.user.emailVerified).toBe(false);
    userToken = res.body.token;
  });

  it('should allow changing username and return new JWT', async () => {
    const res = await request(app)
      .put('/api/auth/username')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ newUsername: 'updateduser' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('updateduser');
    expect(res.body.token).toBeDefined();
    userToken = res.body.token; // Update token with new username
  });

  it('should reject changing username to an invalid or taken handle', async () => {
    const res = await request(app)
      .put('/api/auth/username')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ newUsername: 'invalid handle!' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject changing password with incorrect current password', async () => {
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Incorrect current password');
  });

  it('should change password with correct current password and allow login with new password', async () => {
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ currentPassword: 'password123', newPassword: 'newpassword123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify login with new password
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'updateduser', password: 'newpassword123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
  });

  it('should handle forgot password and reset password with token', async () => {
    // 1. Request forgot password
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'user@example.com' });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.success).toBe(true);

    // 2. Fetch reset token from database for test verification
    const dbUser = await dbManager.getUserByEmail('user@example.com');
    expect(dbUser.resetToken).toBeDefined();

    // 3. Reset password directly using token in test
    // To simulate user submitting token, we can set a known token
    const crypto = await import('crypto');
    const rawTestToken = 'test-reset-token-12345';
    const hashed = crypto.createHash('sha256').update(rawTestToken).digest('hex');
    await dbManager.setResetToken('user@example.com', hashed, new Date(Date.now() + 600000).toISOString());

    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawTestToken, newPassword: 'resetpassword456' });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // 4. Test login with reset password
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'updateduser', password: 'resetpassword456' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
  });

  it('should verify email with valid verification token', async () => {
    // 1. Get the user's verification token from DB
    const dbUser = await dbManager.getUserByEmail('user@example.com');
    expect(dbUser.verificationToken).toBeDefined();

    // 2. Call verification endpoint
    const verifyRes = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: dbUser.verificationToken });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.message).toContain('verified successfully');

    // 3. Verify in DB
    const verifiedUser = await dbManager.getUserByEmail('user@example.com');
    expect(verifiedUser.emailVerified).toBe(1);
  });

  it('should allow updating email and require new verification', async () => {
    const res = await request(app)
      .put('/api/auth/email')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: 'newemail@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await dbManager.getUserByEmail('newemail@example.com');
    expect(updatedUser.emailVerified).toBe(0);
    expect(updatedUser.verificationToken).toBeDefined();
  });

  it('should reject registering with an existing email address', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'duplicateuser', password: 'password123', email: 'newemail@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('already registered');
  });
});

