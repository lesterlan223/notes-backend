const db = require('../config/database');

class Note {
    static async getAll(userFilter = 'all', search = '', sort = 'newest') {
        let query = `
            SELECT 
                id, title, content, 
                COALESCE(tags, '[]') as tags,
                important, deleted,
                created_at as createdAt,
                updated_at as updatedAt
            FROM notes 
            WHERE 1=1
        `;

        const params = [];

        // Apply filters
        if (userFilter === 'important') {
            query += ' AND important = TRUE AND deleted = FALSE';
        } else if (userFilter === 'deleted') {
            query += ' AND deleted = TRUE';
        } else {
            query += ' AND deleted = FALSE';
        }

        // Apply search
        if (search) {
            query += ' AND (MATCH(title, content) AGAINST(? IN BOOLEAN MODE) OR JSON_SEARCH(LOWER(tags), "one", LOWER(?)) IS NOT NULL)';
            const searchTerm = `*${search}*`;
            params.push(searchTerm, `%${search}%`);
        }

        // Apply sorting
        switch(sort) {
            case 'newest':
                query += ' ORDER BY updated_at DESC';
                break;
            case 'oldest':
                query += ' ORDER BY updated_at ASC';
                break;
            case 'alpha-asc':
                query += ' ORDER BY title ASC';
                break;
            case 'alpha-desc':
                query += ' ORDER BY title DESC';
                break;
            case 'important':
                query += ' ORDER BY important DESC, updated_at DESC';
                break;
            default:
                query += ' ORDER BY updated_at DESC';
        }

        try {
            return await db.query(query, params);
        } catch (error) {
            throw error;
        }
    }

    static async getById(id) {
        const query = `
            SELECT 
                id, title, content, 
                COALESCE(tags, '[]') as tags,
                important, deleted,
                created_at as createdAt,
                updated_at as updatedAt
            FROM notes 
            WHERE id = ?
        `;
        
        const results = await db.query(query, [id]);
        return results[0];
    }

    static async create(noteData) {
        const { title, content, tags, important = false } = noteData;
        
        const query = `
            INSERT INTO notes (title, content, tags, important)
            VALUES (?, ?, ?, ?)
        `;
        
        const tagsJson = tags && tags.length > 0 ? JSON.stringify(tags) : null;
        
        const result = await db.query(query, [title, content, tagsJson, important]);
        return { id: result.insertId, ...noteData };
    }

    static async update(id, noteData) {
        const { title, content, tags, important } = noteData;
        
        const query = `
            UPDATE notes 
            SET title = ?, content = ?, tags = ?, important = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        const tagsJson = tags && tags.length > 0 ? JSON.stringify(tags) : null;
        
        await db.query(query, [title, content, tagsJson, important, id]);
        return this.getById(id);
    }

    static async delete(id) {
        const query = `
            UPDATE notes 
            SET deleted = TRUE, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        await db.query(query, [id]);
        return true;
    }

    static async deletePermanently(id) {
        const query = 'DELETE FROM notes WHERE id = ?';
        await db.query(query, [id]);
        return true;
    }

    static async restore(id) {
        const query = `
            UPDATE notes 
            SET deleted = FALSE, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        await db.query(query, [id]);
        return true;
    }

    static async toggleImportant(id) {
        const query = `
            UPDATE notes 
            SET important = NOT important, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        await db.query(query, [id]);
        return this.getById(id);
    }

    static async clearAll() {
        const query = 'DELETE FROM notes WHERE deleted = TRUE';
        await db.query(query);
        return true;
    }

    static async exportAll() {
        const query = `
            SELECT 
                id, title, content, 
                COALESCE(tags, '[]') as tags,
                important, deleted,
                created_at as createdAt,
                updated_at as updatedAt
            FROM notes 
            ORDER BY updated_at DESC
        `;
        
        return await db.query(query);
    }

    static async importNotes(notes) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            for (const note of notes) {
                const { title, content, tags, important = false, deleted = false } = note;
                
                const tagsJson = tags && tags.length > 0 ? JSON.stringify(tags) : null;
                
                await connection.execute(
                    `INSERT INTO notes (title, content, tags, important, deleted) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [title, content, tagsJson, important, deleted]
                );
            }
            
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Note;