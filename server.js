require('dotenv').config();
const express = require('express');

const app = express();

// Простое middleware
app.use(express.json());

// Health check - ПРОСТОЙ и НАДЕЖНЫЙ
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'notes-api'
    });
});

// Главная страница
app.get('/', (req, res) => {
    res.json({ 
        message: '🎉 Notes API is working!',
        endpoints: {
            home: '/',
            health: '/health',
            api: '/api/notes'
        }
    });
});

// Порт из окружения Railway
const PORT = process.env.PORT || 5000;

// Запускаем сервер
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Server started on port ${PORT}`);
    console.log('='.repeat(50));
});
