require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const notesRoutes = require('./src/routes/notes');
const errorHandler = require('./src/middleware/errorHandler');
const db = require('./src/config/database');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: function(origin, callback) {
        // Разрешаем все origins в разработке
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        // В продакшене разрешаем только указанные домены
        const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
            process.env.ALLOWED_ORIGINS.split(',') : [];
        
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Логирование запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/notes', notesRoutes);

// Health check с детальной информацией
app.get('/health', async (req, res) => {
    try {
        const connection = await db.getConnection();
        await connection.ping();
        connection.release();
        
        res.status(200).json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            service: 'notes-api',
            database: 'connected',
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR', 
            timestamp: new Date().toISOString(),
            service: 'notes-api',
            database: 'disconnected',
            error: error.message
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Notes API',
        version: '1.0.0',
        endpoints: {
            notes: '/api/notes',
            health: '/health'
        },
        documentation: 'Документация API доступна по эндпоинтам'
    });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Запуск сервера
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Notes API Server Started`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/health`);
    console.log(`💾 Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
    console.log('='.repeat(50));
});

// Обработка ошибок при запуске
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});