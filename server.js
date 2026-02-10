// Railway автоматически загружает переменные окружения
// НЕ нужно использовать dotenv

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Проверяем переменные
console.log('=== SERVER STARTING ===');
console.log('PORT:', process.env.PORT || 8080);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');

// Корневой путь
app.get('/', (req, res) => {
    res.json({
        message: '✅ Notes API is working!',
        endpoints: {
            home: '/',
            health: '/health',
            get_notes: 'GET /api/notes',
            create_note: 'POST /api/notes'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Получить все заметки
app.get('/api/notes', async (req, res) => {
    try {
        if (!process.env.DATABASE_URL) {
            return res.json({ error: 'Database not configured' });
        }
        
        const connection = await mysql.createConnection({
            uri: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        
        const [notes] = await connection.execute(
            'SELECT * FROM notes WHERE deleted = FALSE'
        );
        
        await connection.end();
        res.json(notes);
        
    } catch (error) {
        res.json({ error: error.message });
    }
});

// Создать заметку
app.post('/api/notes', async (req, res) => {
    try {
        const { title, content } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content required' });
        }
        
        const connection = await mysql.createConnection({
            uri: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        
        const [result] = await connection.execute(
            'INSERT INTO notes (title, content) VALUES (?, ?)',
            [title, content]
        );
        
        await connection.end();
        
        res.json({
            id: result.insertId,
            title,
            content,
            success: true
        });
        
    } catch (error) {
        res.json({ error: error.message });
    }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});
