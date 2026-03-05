/**
 * utils/email.js
 *
 * Nodemailer wrapper for transactional emails.
 * Uses SMTP credentials from environment variables.
 * Falls back to Ethereal (auto-catch test account) in development
 * so emails work out-of-the-box without real SMTP credentials.
 */

const nodemailer = require('nodemailer');
const logger     = require('../config/logger');

let _transporter = null;

/**
 * Lazily create (and cache) the nodemailer transporter.
 * In development with no SMTP_HOST set, auto-creates an Ethereal test account.
 */
async function getTransporter() {
  if (_transporter) return _transporter;

  if (process.env.SMTP_HOST) {
    // ── Real SMTP (production / staging) ──────────────────────────────────
    _transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    logger.info('[email] Using real SMTP transport');
  } else {
    // ── Ethereal catch-all for development ────────────────────────────────
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host:   'smtp.ethereal.email',
      port:   587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info(`[email] Using Ethereal test transport — preview at: https://ethereal.email`);
    logger.info(`[email] Ethereal login: ${testAccount.user} / ${testAccount.pass}`);
  }

  return _transporter;
}

const FROM = process.env.FROM_EMAIL || '"CollabNotes" <no-reply@collabnotes.app>';
const APP_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── Email templates ───────────────────────────────────────────────────────────

/**
 * Send a collaboration invitation email.
 *
 * @param {object} opts
 * @param {string} opts.toEmail       — recipient email address
 * @param {string} opts.toName        — recipient display name (or email if unknown)
 * @param {string} opts.inviterName   — person who added them
 * @param {string} opts.noteTitle     — title of the shared note
 * @param {string} opts.noteId        — note MongoDB _id (used to build the URL)
 * @param {string} opts.role          — 'editor' | 'viewer'
 */
async function sendCollabInvite({ toEmail, toName, inviterName, noteTitle, noteId, role }) {
  const noteUrl  = `${APP_URL}/notes/${noteId}`;
  const roleText = role === 'editor' ? 'edit' : 'view';
  const roleBadge = role === 'editor'
    ? 'background:#d97706;color:#000;'
    : 'background:#3f3f46;color:#d4d4d8;';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>You've been invited to collaborate</title>
  <style>
    body { margin:0; padding:0; background:#09090b; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; }
    .wrapper { max-width:560px; margin:40px auto; background:#18181b; border:1px solid #27272a; border-radius:16px; overflow:hidden; }
    .header  { background:#18181b; padding:32px 36px 24px; border-bottom:1px solid #27272a; }
    .logo    { display:inline-flex; align-items:center; gap:10px; text-decoration:none; }
    .logo-icon { width:32px; height:32px; background:#fbbf24; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; transform:rotate(3deg); }
    .logo-text { font-size:17px; font-weight:700; color:#fff; letter-spacing:-0.3px; }
    .body    { padding:32px 36px; }
    h1       { color:#f4f4f5; font-size:22px; font-weight:700; margin:0 0 12px; line-height:1.3; }
    p        { color:#a1a1aa; font-size:15px; line-height:1.7; margin:0 0 16px; }
    .note-card { background:#09090b; border:1px solid #27272a; border-radius:12px; padding:16px 20px; margin:20px 0; }
    .note-title { color:#f4f4f5; font-size:16px; font-weight:600; margin:0 0 6px; }
    .role-badge { display:inline-block; font-size:11px; font-weight:600; padding:2px 8px; border-radius:6px; ${roleBadge} text-transform:capitalize; letter-spacing:0.3px; }
    .cta     { display:inline-block; background:#fbbf24; color:#000; font-weight:700; font-size:15px; text-decoration:none; padding:14px 28px; border-radius:12px; margin:8px 0 24px; }
    .cta:hover { background:#fde68a; }
    .divider { border:none; border-top:1px solid #27272a; margin:24px 0; }
    .footer  { padding:0 36px 28px; }
    .footer p { color:#52525b; font-size:12px; margin:0 0 4px; }
    .footer a { color:#71717a; }
    .url-box { background:#09090b; border:1px solid #27272a; border-radius:8px; padding:10px 14px; font-size:12px; color:#71717a; word-break:break-all; margin-top:8px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span class="logo">
        <span class="logo-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </span>
        <span class="logo-text">CollabNotes</span>
      </span>
    </div>

    <div class="body">
      <h1>You've been invited to collaborate</h1>
      <p>
        <strong style="color:#f4f4f5">${inviterName}</strong> has shared a note with you
        and given you <strong style="color:#f4f4f5">${roleText}</strong> access.
      </p>

      <div class="note-card">
        <div class="note-title">📝 ${noteTitle || 'Untitled Note'}</div>
        <div style="margin-top:6px;">
          <span class="role-badge">${role}</span>
        </div>
      </div>

      <a href="${noteUrl}" class="cta">Open note →</a>

      <p style="font-size:13px;color:#71717a;">
        If you don't have a CollabNotes account yet, 
        <a href="${APP_URL}/register" style="color:#fbbf24;">create one for free</a>
        using this email address, then open the link above.
      </p>
    </div>

    <hr class="divider"/>

    <div class="footer">
      <p>If the button above doesn't work, copy and paste this link into your browser:</p>
      <div class="url-box">${noteUrl}</div>
      <p style="margin-top:16px;">You received this email because ${inviterName} added your email as a collaborator on CollabNotes.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
${inviterName} has shared a note with you on CollabNotes.

Note: "${noteTitle || 'Untitled Note'}"
Your access level: ${role}

Open the note here: ${noteUrl}

If you don't have a CollabNotes account yet, create one for free at ${APP_URL}/register using this email address, then open the link above.
`.trim();

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from:    FROM,
      to:      `"${toName}" <${toEmail}>`,
      subject: `${inviterName} shared "${noteTitle || 'a note'}" with you on CollabNotes`,
      text,
      html,
    });

    logger.info(`[email] Collab invite sent to ${toEmail} — messageId: ${info.messageId}`);

    // Log Ethereal preview URL in development
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`[email] Preview URL: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl: previewUrl || null };
  } catch (err) {
    // Email failures must never break the main request flow
    logger.error(`[email] Failed to send invite to ${toEmail}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Send a role-change notification email.
 */
async function sendRoleChanged({ toEmail, toName, inviterName, noteTitle, noteId, role }) {
  const noteUrl  = `${APP_URL}/notes/${noteId}`;
  const roleText = role === 'editor' ? 'edit' : 'view only';

  const text = `
Hi ${toName},

${inviterName} has updated your access to the note "${noteTitle || 'Untitled Note'}" on CollabNotes.

Your new access level: ${roleText}

Open the note: ${noteUrl}
`.trim();

  const html = `
<!DOCTYPE html><html><body style="background:#09090b;font-family:Helvetica,Arial,sans-serif;">
<div style="max-width:520px;margin:40px auto;background:#18181b;border:1px solid #27272a;border-radius:16px;padding:32px 36px;">
  <p style="color:#fbbf24;font-weight:700;font-size:15px;margin:0 0 16px;">CollabNotes</p>
  <h2 style="color:#f4f4f5;font-size:20px;margin:0 0 12px;">Your access level was updated</h2>
  <p style="color:#a1a1aa;font-size:15px;line-height:1.7;margin:0 0 20px;">
    <strong style="color:#f4f4f5">${inviterName}</strong> changed your role on
    <strong style="color:#f4f4f5">"${noteTitle || 'Untitled Note'}"</strong> to 
    <strong style="color:#f4f4f5">${roleText}</strong>.
  </p>
  <a href="${noteUrl}" style="display:inline-block;background:#fbbf24;color:#000;font-weight:700;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:10px;">Open note</a>
</div>
</body></html>`;

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from:    FROM,
      to:      `"${toName}" <${toEmail}>`,
      subject: `Your access to "${noteTitle || 'a note'}" was updated`,
      text,
      html,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) logger.info(`[email] Role-change preview: ${previewUrl}`);
    return { success: true, previewUrl: previewUrl || null };
  } catch (err) {
    logger.error(`[email] Role-change email failed: ${err.message}`);
    return { success: false };
  }
}

module.exports = { sendCollabInvite, sendRoleChanged };
