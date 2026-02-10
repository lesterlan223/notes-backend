const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Функция создания таблицы
async function createNotesTable() {
    console.log('🔍 Checking DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
    
    if (!process.env.DATABASE_URL) {
        console.log('⚠️  Please add DATABASE_URL in Railway Variables');
        console.log('Railway should add it automatically when you created the database');
        return false;
    }
    
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection({
            uri: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        
        console.log('✅ Connected to MySQL');
        
        // Создаем таблицу
        const sql = `
            CREATE TABLE IF NOT EXISTS notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                tags JSON,
                important BOOLEAN DEFAULT FALSE,
                deleted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;
        
        await connection.execute(sql);
        console.log('✅ Notes table created successfully!');
        
        // Проверяем
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`📊 Tables in database: ${tables.length}`);
        
        await connection.end();
        return true;
        
    } catch (error) {
        console.error('❌ Database error:', error.message);
        console.error('Full error:', error);
        return false;
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Notes API'
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

// Запуск сервера
app.listen(PORT, '0.0.0.0', async () => {
    console.log('='.repeat(50));
    console.log(`🚀 Server started on port ${PORT}`);
    console.log('='.repeat(50));
    
    // Создаем таблицу при запуске
    await createNotesTable();
});
