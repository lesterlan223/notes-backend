// api.js - Работа с API бэкенда

const API_CONFIG = {
    BASE_URL: 'https://notes-backend-production-1d9a.up.railway.app/api',
    ENDPOINTS: {
        NOTES: '/notes'
    }
};

class NotesAPI {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
    }

    // Получить все заметки с фильтрами
    async getNotes(filter = 'all', search = '', sort = 'newest') {
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') params.append('filter', filter);
            if (search) params.append('search', search);
            if (sort) params.append('sort', sort);

            const url = `${this.baseUrl}/notes?${params.toString()}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('❌ Ошибка загрузки заметок:', error);
            this.showNotification('Ошибка загрузки заметок', 'error');
            return [];
        }
    }

    // Создать заметку
    async createNote(noteData) {
        try {
            const response = await fetch(`${this.baseUrl}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteData)
            });
            
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            
            const result = await response.json();
            this.showNotification('Заметка создана', 'success');
            return result;
            
        } catch (error) {
            console.error('❌ Ошибка создания заметки:', error);
            this.showNotification('Ошибка создания заметки', 'error');
            return { error: error.message };
        }
    }

    // Обновить заметку
    async updateNote(id, noteData) {
        try {
            const response = await fetch(`${this.baseUrl}/notes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteData)
            });
            
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            
            const result = await response.json();
            this.showNotification('Заметка обновлена', 'success');
            return result;
            
        } catch (error) {
            console.error('❌ Ошибка обновления заметки:', error);
            this.showNotification('Ошибка обновления заметки', 'error');
            return { error: error.message };
        }
    }

    // Удалить заметку (в корзину)
    async deleteNote(id) {
        try {
            const response = await fetch(`${this.baseUrl}/notes/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            
            this.showNotification('Заметка удалена', 'info');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Ошибка удаления заметки:', error);
            this.showNotification('Ошибка удаления заметки', 'error');
            return { error: error.message };
        }
    }

    // Восстановить из корзины
    async restoreNote(id) {
        try {
            const response = await fetch(`${this.baseUrl}/notes/${id}/restore`, {
                method: 'PATCH'
            });
            
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            
            this.showNotification('Заметка восстановлена', 'success');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Ошибка восстановления заметки:', error);
            this.showNotification('Ошибка восстановления заметки', 'error');
            return { error: error.message };
        }
    }

    // Переключить важность
    async toggleImportant(id) {
        try {
            const response = await fetch(`${this.baseUrl}/notes/${id}/toggle-important`, {
                method: 'PATCH'
            });
            
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            
            return await response.json();
            
        } catch (error) {
            console.error('❌ Ошибка изменения важности:', error);
            return { error: error.message };
        }
    }

    // Экспорт заметок
    async exportNotes() {
        try {
            const response = await fetch(`${this.baseUrl}/notes/export/all`);
            
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            
            return await response.json();
            
        } catch (error) {
            console.error('❌ Ошибка экспорта:', error);
            this.showNotification('Ошибка экспорта', 'error');
            return { error: error.message };
        }
    }

    // Импорт заметок
    async importNotes(notes) {
        try {
            const response = await fetch(`${this.baseUrl}/notes/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes })
            });
            
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            
            const result = await response.json();
            this.showNotification(`Импортировано ${notes.length} заметок`, 'success');
            return result;
            
        } catch (error) {
            console.error('❌ Ошибка импорта:', error);
            this.showNotification('Ошибка импорта', 'error');
            return { error: error.message };
        }
    }

    // Уведомления
    showNotification(message, type = 'info') {
        // Используем вашу существующую функцию showNotification
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Создаем глобальный экземпляр API
window.notesAPI = new NotesAPI();
