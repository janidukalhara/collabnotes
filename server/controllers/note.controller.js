/**
 * controllers/note.controller.js
 */
const Note  = require('../models/Note');
const User  = require('../models/User');
const { sendCollabInvite, sendRoleChanged } = require('../utils/email');

const stripHtml = (html = '') =>
  html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Resolve an owner/collaborator field to a plain string ID whether it is:
 *   - a raw ObjectId   (before populate)
 *   - a populated User object { _id, name, … }  (after populate)
 *   - already a string
 */
const toId = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val._id) return val._id.toString();
  return val.toString();
};

const canRead = (note, userId) => {
  const uid = userId.toString();
  return (
    toId(note.owner) === uid ||
    note.collaborators.some((c) => toId(c.user) === uid)
  );
};

const canWrite = (note, userId) => {
  const uid = userId.toString();
  if (toId(note.owner) === uid) return true;
  const collab = note.collaborators.find((c) => toId(c.user) === uid);
  return collab?.role === 'editor';
};

// ─── Create note ──────────────────────────────────────────────────────────────
const createNote = async (req, res, next) => {
  try {
    const { title, content, tags, color } = req.body;
    const note = await Note.create({
      title:        title || 'Untitled Note',
      content:      content || '',
      contentText:  stripHtml(content || ''),
      owner:        req.user._id,
      lastEditedBy: req.user._id,
      tags:         tags  || [],
      color:        color || '#18181b',
    });
    await note.populate('owner', 'name email avatar');
    await note.populate('lastEditedBy', 'name email avatar');
    res.status(201).json({ note });
  } catch (err) { next(err); }
};

// ─── List notes ───────────────────────────────────────────────────────────────
const getNotes = async (req, res, next) => {
  try {
    const userId   = req.user._id;
    const archived = req.query.archived === 'true';
    const notes = await Note.find({
      $or: [{ owner: userId }, { 'collaborators.user': userId }],
      isArchived: archived,
    })
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .sort({ isPinned: -1, updatedAt: -1 });
    res.json({ notes });
  } catch (err) { next(err); }
};

// ─── Get single note ──────────────────────────────────────────────────────────
const getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar');

    if (!note)
      return res.status(404).json({ message: 'Note not found.' });
    if (!canRead(note, req.user._id))
      return res.status(403).json({ message: 'Access denied.' });

    res.json({ note });
  } catch (err) { next(err); }
};

// ─── Update note ──────────────────────────────────────────────────────────────
const updateNote = async (req, res, next) => {
  try {
    // Fetch raw (unpopulated) for access check — toId handles raw ObjectId
    const note = await Note.findById(req.params.id);
    if (!note)
      return res.status(404).json({ message: 'Note not found.' });
    if (!canWrite(note, req.user._id))
      return res.status(403).json({ message: 'Access denied — editor role required.' });

    const { title, content, tags, color, isPinned, isArchived } = req.body;

    if (title     !== undefined) note.title     = title;
    if (content   !== undefined) {
      note.content     = content;
      note.contentText = stripHtml(content);
    }
    if (tags      !== undefined) note.tags      = tags;
    if (color     !== undefined) note.color     = color;
    if (isPinned  !== undefined) note.isPinned  = isPinned;
    if (isArchived !== undefined) note.isArchived = isArchived;
    note.lastEditedBy = req.user._id;

    await note.save();
    await note.populate('owner', 'name email avatar');
    await note.populate('collaborators.user', 'name email avatar');
    await note.populate('lastEditedBy', 'name email avatar');

    res.json({ note });
  } catch (err) { next(err); }
};

// ─── Delete note ──────────────────────────────────────────────────────────────
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note)
      return res.status(404).json({ message: 'Note not found.' });
    if (toId(note.owner) !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the owner can delete a note.' });
    await note.deleteOne();
    res.json({ message: 'Note deleted.' });
  } catch (err) { next(err); }
};

// ─── Full-text search ─────────────────────────────────────────────────────────
const searchNotes = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim())
      return res.status(400).json({ message: 'Search query required.' });

    const userId = req.user._id;
    const notes  = await Note.find({
      $text: { $search: q },
      $or:   [{ owner: userId }, { 'collaborators.user': userId }],
      isArchived: false,
    })
      .select({ score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .limit(30);

    res.json({ notes, query: q, total: notes.length });
  } catch (err) { next(err); }
};

// ─── Add collaborator + send invite email ─────────────────────────────────────
const addCollaborator = async (req, res, next) => {
  try {
    const { email, role = 'editor' } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note)
      return res.status(404).json({ message: 'Note not found.' });
    if (toId(note.owner) !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the owner can manage collaborators.' });

    const collaboratorUser = await User.findOne({ email });
    if (!collaboratorUser)
      return res.status(404).json({ message: `No CollabNotes account found for ${email}. They need to register first.` });
    if (collaboratorUser._id.toString() === req.user._id.toString())
      return res.status(400).json({ message: 'You cannot add yourself as a collaborator.' });

    const alreadyAdded = note.collaborators.some(
      (c) => toId(c.user) === collaboratorUser._id.toString()
    );
    if (alreadyAdded)
      return res.status(409).json({ message: 'This user is already a collaborator.' });

    note.collaborators.push({ user: collaboratorUser._id, role });
    await note.save();
    await note.populate('owner', 'name email avatar');
    await note.populate('collaborators.user', 'name email avatar');

    // ── Send invitation email (non-blocking — never fails the request) ──────
    sendCollabInvite({
      toEmail:     collaboratorUser.email,
      toName:      collaboratorUser.name,
      inviterName: req.user.name,
      noteTitle:   note.title,
      noteId:      note._id.toString(),
      role,
    }).catch(() => {}); // fire-and-forget

    res.json({ note, emailSent: true });
  } catch (err) { next(err); }
};

// ─── Update collaborator role + send notification email ───────────────────────
const updateCollaborator = async (req, res, next) => {
  try {
    const { collaboratorId } = req.params;
    const { role } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note)
      return res.status(404).json({ message: 'Note not found.' });
    if (toId(note.owner) !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the owner can manage collaborators.' });

    const collab = note.collaborators.find(
      (c) => toId(c.user) === collaboratorId
    );
    if (!collab)
      return res.status(404).json({ message: 'Collaborator not found on this note.' });

    const prevRole = collab.role;
    collab.role = role;
    await note.save();
    await note.populate('owner', 'name email avatar');
    await note.populate('collaborators.user', 'name email avatar');

    // Send role-change email if role actually changed
    if (role !== prevRole) {
      const collabUser = await User.findById(collaboratorId);
      if (collabUser) {
        sendRoleChanged({
          toEmail:     collabUser.email,
          toName:      collabUser.name,
          inviterName: req.user.name,
          noteTitle:   note.title,
          noteId:      note._id.toString(),
          role,
        }).catch(() => {});
      }
    }

    res.json({ note });
  } catch (err) { next(err); }
};

// ─── Remove collaborator ──────────────────────────────────────────────────────
const removeCollaborator = async (req, res, next) => {
  try {
    const { collaboratorId } = req.params;
    const note = await Note.findById(req.params.id);

    if (!note)
      return res.status(404).json({ message: 'Note not found.' });
    if (toId(note.owner) !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the owner can manage collaborators.' });

    note.collaborators = note.collaborators.filter(
      (c) => toId(c.user) !== collaboratorId
    );
    await note.save();
    await note.populate('owner', 'name email avatar');
    await note.populate('collaborators.user', 'name email avatar');

    res.json({ message: 'Collaborator removed.', note });
  } catch (err) { next(err); }
};

module.exports = {
  createNote, getNotes, getNoteById, updateNote, deleteNote,
  searchNotes, addCollaborator, updateCollaborator, removeCollaborator,
};
