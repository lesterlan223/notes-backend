const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let statusCode = 500;
    let message = 'Внутренняя ошибка сервера';

    // Database errors
    if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        message = 'Конфликт данных';
    } else if (err.code === 'ER_NO_REFERENCED_ROW') {
        statusCode = 404;
        message = 'Ресурс не найден';
    } else if (err.code === 'ER_DATA_TOO_LONG') {
        statusCode = 400;
        message = 'Данные слишком длинные';
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Ошибка валидации';
    }

    res.status(statusCode).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

module.exports = errorHandler;