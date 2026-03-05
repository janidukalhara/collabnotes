/**
 * routes/note.routes.js
 */

const { Router } = require('express');
const { body } = require('express-validator');
const {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  searchNotes,
  addCollaborator,
  updateCollaborator,
  removeCollaborator,
} = require('../controllers/note.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

// All note routes are protected
router.use(protect);

router.get('/search', searchNotes);

router.route('/').get(getNotes).post(createNote);

router.route('/:id').get(getNoteById).put(updateNote).delete(deleteNote);

router.post(
  '/:id/collaborators',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('role').optional().isIn(['viewer', 'editor']).withMessage('Role must be viewer or editor'),
  ],
  validate,
  addCollaborator
);

router.put(
  '/:id/collaborators/:collaboratorId',
  [body('role').isIn(['viewer', 'editor']).withMessage('Role must be viewer or editor')],
  validate,
  updateCollaborator
);

router.delete('/:id/collaborators/:collaboratorId', removeCollaborator);

module.exports = router;
