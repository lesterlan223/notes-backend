const express = require('express');
const app = express();

// Health check - ДОЛЖЕН БЫТЬ ПЕРВЫМ
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Главная
app.get('/', (req, res) => {
    res.json({ 
        message: 'Notes API',
        health: '/health'
    });
});

// КРИТИЧЕСКИ ВАЖНО для Railway:
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`✅ Server running on ${HOST}:${PORT}`);
});
