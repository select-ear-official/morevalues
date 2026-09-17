/**
 * emailService.js
 * 
 * Handles sending transactional emails (email verification, password resets).
 * Uses Resend API if RESEND_API_KEY is configured in environment,
 * otherwise safely logs the action and magic links in development mode.
 */

export async function sendVerificationEmail(toEmail, username, token, appOrigin = 'http://localhost:5173') {
  const verifyUrl = `${appOrigin}/?verify-token=${token}`;
  
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'MoreValues <noreply@morevalues.org>',
          to: [toEmail],
          subject: 'Verify your email address - MoreValues',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Welcome to MoreValues, ${username}!</h2>
              <p>Please verify your email address by clicking the button below:</p>
              <p style="margin: 25px 0;">
                <a href="${verifyUrl}" style="background-color: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Verify Email Address
                </a>
              </p>
              <p style="color: #666; font-size: 0.9em;">Or copy and paste this link into your browser:<br/><a href="${verifyUrl}">${verifyUrl}</a></p>
            </div>
          `
        })
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to send verification email via Resend:', err);
    }
  } else {
    console.log('\n--- [DEV EMAIL SIMULATOR] ---');
    console.log(`To: ${toEmail} (${username})`);
    console.log(`Subject: Verify your email address - MoreValues`);
    console.log(`Verification URL: ${verifyUrl}`);
    console.log('-----------------------------\n');
  }
}

export async function sendPasswordResetEmail(toEmail, username, token, appOrigin = 'http://localhost:5173') {
  const resetUrl = `${appOrigin}/?reset-token=${token}`;
  
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'MoreValues <noreply@morevalues.org>',
          to: [toEmail],
          subject: 'Reset your password - MoreValues',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Password Reset Request</h2>
              <p>Hello ${username},</p>
              <p>We received a request to reset your password. Click the button below to choose a new password (valid for 30 minutes):</p>
              <p style="margin: 25px 0;">
                <a href="${resetUrl}" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Reset Password
                </a>
              </p>
              <p style="color: #666; font-size: 0.9em;">If you did not request this, you can safely ignore this email.</p>
              <p style="color: #666; font-size: 0.9em;">Link: <a href="${resetUrl}">${resetUrl}</a></p>
            </div>
          `
        })
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to send password reset email via Resend:', err);
    }
  } else {
    console.log('\n--- [DEV EMAIL SIMULATOR] ---');
    console.log(`To: ${toEmail} (${username})`);
    console.log(`Subject: Reset your password - MoreValues`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('-----------------------------\n');
  }
}
