const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');

// Get all notes with filters
router.get('/', notesController.getNotes);

// Get single note
router.get('/:id', notesController.getNote);

// Create new note
router.post('/', notesController.createNote);

// Update note
router.put('/:id', notesController.updateNote);

// Move to trash
router.delete('/:id/trash', notesController.deleteNote);

// Delete permanently
router.delete('/:id', notesController.deletePermanently);

// Restore from trash
router.patch('/:id/restore', notesController.restoreNote);

// Toggle important
router.patch('/:id/toggle-important', notesController.toggleImportant);

// Export notes
router.get('/export/all', notesController.exportNotes);

// Import notes
router.post('/import', notesController.importNotes);

// Clear deleted notes
router.delete('/trash/clear', notesController.clearDeleted);

module.exports = router;