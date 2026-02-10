const express = require('express');
const app = express();

// Health check
app.get('/health', (req, res) => {
    console.log('Health check called');
    res.status(200).json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        port: process.env.PORT
    });
});

// Главная
app.get('/', (req, res) => {
    res.json({ 
        message: '✅ Notes API is working!',
        endpoints: {
            home: '/',
            health: '/health'
        }
    });
});

// Railway устанавливает PORT в переменных окружения
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log(`✅ Server running on 0.0.0.0:${PORT}`);
    console.log(`📡 Health: http://0.0.0.0:${PORT}/health`);
    console.log('='.repeat(50));
});
