/**
 * models/Note.js
 *
 * Core document for the note-taking app.
 *
 * Collaborators are stored as an embedded array so we can do a single DB read
 * to decide whether a user has access.  The `role` field supports two levels:
 *   - viewer  → read-only
 *   - editor  → full read/write
 */

const mongoose = require('mongoose');

const CollaboratorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'editor',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      default: 'Untitled Note',
    },
    // Raw HTML produced by the rich-text editor (Quill delta serialised as HTML)
    content: {
      type: String,
      default: '',
    },
    // Plain-text derivative used for full-text search indexing
    contentText: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    collaborators: {
      type: [CollaboratorSchema],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: '#ffffff',
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// ─── Full-text search index ───────────────────────────────────────────────────
NoteSchema.index(
  { title: 'text', contentText: 'text', tags: 'text' },
  { weights: { title: 10, tags: 5, contentText: 1 }, name: 'NoteTextIndex' }
);

// ─── Compound index: list notes for a user quickly ───────────────────────────
NoteSchema.index({ owner: 1, updatedAt: -1 });

// ─── Virtual: collaborator user IDs (handy for access checks) ────────────────
NoteSchema.virtual('collaboratorIds').get(function () {
  return this.collaborators.map((c) => c.user.toString());
});

NoteSchema.set('toJSON', { virtuals: true, versionKey: false });

module.exports = mongoose.model('Note', NoteSchema);
