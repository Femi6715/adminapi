"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    // Log error in production
    if (process.env.NODE_ENV === 'production') {
        console.error('Error:', {
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        });
    }
    res.status(statusCode).json(Object.assign({ status: 'error', statusCode,
        message }, (process.env.NODE_ENV === 'development' && { stack: err.stack })));
};
exports.errorHandler = errorHandler;
