const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// КОРНЕВОЙ ПУТЬ - обязательно!
app.get('/', (req, res) => {
    res.json({
        message: '✅ Notes API is working!',
        endpoints: {
            home: '/',
            health: '/health',
            get_notes: 'GET /api/notes',
            create_note: 'POST /api/notes',
            api_docs: 'See code for full API'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'notes-api'
    });
});

// Получить все заметки
app.get('/api/notes', async (req, res) => {
    try {
        if (!process.env.DATABASE_URL) {
            return res.status(500).json({ error: 'Database not configured' });
        }
        
        const connection = await mysql.createConnection({
            uri: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        
        const [notes] = await connection.execute(
            'SELECT * FROM notes WHERE deleted = FALSE ORDER BY updated_at DESC'
        );
        
        await connection.end();
        res.json(notes);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Создать заметку
app.post('/api/notes', async (req, res) => {
    try {
        const { title, content, tags = [], important = false } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }
        
        const connection = await mysql.createConnection({
            uri: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        
        const [result] = await connection.execute(
            'INSERT INTO notes (title, content, tags, important) VALUES (?, ?, ?, ?)',
            [title, content, JSON.stringify(tags), important]
        );
        
        await connection.end();
        
        res.status(201).json({
            id: result.insertId,
            title,
            content,
            tags,
            important,
            success: true
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});
