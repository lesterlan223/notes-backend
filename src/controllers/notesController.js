const Note = require('../models/note');

const notesController = {
    // Get all notes with filters
    async getNotes(req, res, next) {
        try {
            const { filter = 'all', search = '', sort = 'newest' } = req.query;
            
            const notes = await Note.getAll(filter, search, sort);
            
            res.json({
                success: true,
                data: notes,
                count: notes.length
            });
        } catch (error) {
            next(error);
        }
    },

    // Get single note
    async getNote(req, res, next) {
        try {
            const note = await Note.getById(req.params.id);
            
            if (!note) {
                return res.status(404).json({
                    success: false,
                    message: 'Заметка не найдена'
                });
            }
            
            res.json({
                success: true,
                data: note
            });
        } catch (error) {
            next(error);
        }
    },

    // Create new note
    async createNote(req, res, next) {
        try {
            const { title, content, tags, important } = req.body;
            
            if (!title || !content) {
                return res.status(400).json({
                    success: false,
                    message: 'Заголовок и текст заметки обязательны'
                });
            }
            
            const note = await Note.create({
                title,
                content,
                tags: tags || [],
                important: important || false
            });
            
            res.status(201).json({
                success: true,
                message: 'Заметка создана',
                data: note
            });
        } catch (error) {
            next(error);
        }
    },

    // Update note
    async updateNote(req, res, next) {
        try {
            const { id } = req.params;
            const { title, content, tags, important } = req.body;
            
            if (!title || !content) {
                return res.status(400).json({
                    success: false,
                    message: 'Заголовок и текст заметки обязательны'
                });
            }
            
            const existingNote = await Note.getById(id);
            if (!existingNote) {
                return res.status(404).json({
                    success: false,
                    message: 'Заметка не найдена'
                });
            }
            
            const updatedNote = await Note.update(id, {
                title,
                content,
                tags: tags || [],
                important: important || false
            });
            
            res.json({
                success: true,
                message: 'Заметка обновлена',
                data: updatedNote
            });
        } catch (error) {
            next(error);
        }
    },

    // Move to trash
    async deleteNote(req, res, next) {
        try {
            const { id } = req.params;
            
            const existingNote = await Note.getById(id);
            if (!existingNote) {
                return res.status(404).json({
                    success: false,
                    message: 'Заметка не найдена'
                });
            }
            
            await Note.delete(id);
            
            res.json({
                success: true,
                message: 'Заметка перемещена в корзину'
            });
        } catch (error) {
            next(error);
        }
    },

    // Delete permanently
    async deletePermanently(req, res, next) {
        try {
            const { id } = req.params;
            
            const existingNote = await Note.getById(id);
            if (!existingNote) {
                return res.status(404).json({
                    success: false,
                    message: 'Заметка не найдена'
                });
            }
            
            await Note.deletePermanently(id);
            
            res.json({
                success: true,
                message: 'Заметка удалена навсегда'
            });
        } catch (error) {
            next(error);
        }
    },

    // Restore from trash
    async restoreNote(req, res, next) {
        try {
            const { id } = req.params;
            
            const existingNote = await Note.getById(id);
            if (!existingNote) {
                return res.status(404).json({
                    success: false,
                    message: 'Заметка не найдена'
                });
            }
            
            await Note.restore(id);
            
            res.json({
                success: true,
                message: 'Заметка восстановлена'
            });
        } catch (error) {
            next(error);
        }
    },

    // Toggle important status
    async toggleImportant(req, res, next) {
        try {
            const { id } = req.params;
            
            const existingNote = await Note.getById(id);
            if (!existingNote) {
                return res.status(404).json({
                    success: false,
                    message: 'Заметка не найдена'
                });
            }
            
            const updatedNote = await Note.toggleImportant(id);
            
            res.json({
                success: true,
                message: updatedNote.important ? 'Заметка помечена как важная' : 'Снята отметка важности',
                data: updatedNote
            });
        } catch (error) {
            next(error);
        }
    },

    // Export all notes
    async exportNotes(req, res, next) {
        try {
            const notes = await Note.exportAll();
            
            res.json({
                success: true,
                data: notes,
                count: notes.length
            });
        } catch (error) {
            next(error);
        }
    },

    // Import notes
    async importNotes(req, res, next) {
        try {
            const { notes } = req.body;
            
            if (!Array.isArray(notes)) {
                return res.status(400).json({
                    success: false,
                    message: 'Неверный формат данных'
                });
            }
            
            await Note.importNotes(notes);
            
            res.json({
                success: true,
                message: `Успешно импортировано ${notes.length} заметок`
            });
        } catch (error) {
            next(error);
        }
    },

    // Clear all deleted notes
    async clearDeleted(req, res, next) {
        try {
            await Note.clearAll();
            
            res.json({
                success: true,
                message: 'Корзина очищена'
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = notesController;