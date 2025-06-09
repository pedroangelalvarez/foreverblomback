// Global error handling middleware

function errorHandler(err, req, res, next) {
    console.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Default error response
    let status = 500;
    let response = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while processing your request'
    };

    // Handle specific error types
    if (err.code === 'SQLITE_CONSTRAINT') {
        status = 400;
        response = {
            error: 'Database Constraint Error',
            message: 'The operation violates database constraints'
        };
    } else if (err.code === 'SQLITE_BUSY') {
        status = 503;
        response = {
            error: 'Database Busy',
            message: 'Database is currently busy, please try again later'
        };
    } else if (err.code === 'SQLITE_CORRUPT') {
        status = 500;
        response = {
            error: 'Database Error',
            message: 'Database corruption detected, please contact support'
        };
    } else if (err.name === 'ValidationError') {
        status = 400;
        response = {
            error: 'Validation Error',
            message: err.message
        };
    } else if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
        status = 400;
        response = {
            error: 'Invalid JSON',
            message: 'Request body contains invalid JSON'
        };
    } else if (err.code === 'ENOENT') {
        status = 500;
        response = {
            error: 'File System Error',
            message: 'Required file or directory not found'
        };
    } else if (err.code === 'EACCES') {
        status = 500;
        response = {
            error: 'Permission Error',
            message: 'Insufficient permissions to access required resources'
        };
    }

    // Include error details in development mode
    if (process.env.NODE_ENV === 'development') {
        response.details = {
            message: err.message,
            stack: err.stack,
            code: err.code
        };
    }

    // Add request context for debugging
    response.request = {
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
    };

    res.status(status).json(response);
}

module.exports = errorHandler;
