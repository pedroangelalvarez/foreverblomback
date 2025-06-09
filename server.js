const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database/init');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const expensesRouter = require('./routes/expenses');
const conceptosRouter = require('./routes/conceptos');
const Guest = require('./models/guest');
const { validateGuest, validateGuestUpdate } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Guest routes defined directly to avoid router dependency issues
// GET /guests - Get all guests with optional filtering and pagination
app.get('/guests', async (req, res, next) => {
    try {
        const options = {};
        
        // Extract query parameters
        if (req.query.gender) options.gender = req.query.gender;
        if (req.query.family) options.family = req.query.family;
        if (req.query.confirmation !== undefined) {
            options.confirmation = req.query.confirmation === 'true';
        }
        if (req.query.limit) options.limit = parseInt(req.query.limit);
        if (req.query.offset) options.offset = parseInt(req.query.offset);

        // Validate pagination parameters
        if (options.limit && (isNaN(options.limit) || options.limit < 1 || options.limit > 100)) {
            return res.status(400).json({
                error: 'Invalid limit parameter',
                message: 'Limit must be a number between 1 and 100'
            });
        }

        if (options.offset && (isNaN(options.offset) || options.offset < 0)) {
            return res.status(400).json({
                error: 'Invalid offset parameter',
                message: 'Offset must be a non-negative number'
            });
        }

        const guests = await Guest.findAll(options);
        const totalCount = await Guest.count({
            gender: options.gender,
            family: options.family,
            confirmation: options.confirmation
        });

        res.json({
            success: true,
            data: guests,
            meta: {
                total: totalCount,
                count: guests.length,
                limit: options.limit || null,
                offset: options.offset || 0
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /guests/:id - Get guest by ID
app.get('/guests/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id) || id < 1) {
            return res.status(400).json({
                error: 'Invalid guest ID',
                message: 'Guest ID must be a positive integer'
            });
        }

        const guest = await Guest.findById(id);
        
        if (!guest) {
            return res.status(404).json({
                error: 'Guest not found',
                message: `No guest found with ID ${id}`
            });
        }

        res.json({
            success: true,
            data: guest
        });
    } catch (error) {
        next(error);
    }
});

// POST /guests - Create new guest
app.post('/guests', validateGuest, async (req, res, next) => {
    try {
        const guestId = await Guest.create(req.body);
        const newGuest = await Guest.findById(guestId);

        res.status(201).json({
            success: true,
            message: 'Guest created successfully',
            data: newGuest
        });
    } catch (error) {
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({
                error: 'Duplicate guest',
                message: 'A guest with similar details already exists'
            });
        }
        next(error);
    }
});

// PUT /guests/:id - Update guest by ID
app.put('/guests/:id', validateGuestUpdate, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id) || id < 1) {
            return res.status(400).json({
                error: 'Invalid guest ID',
                message: 'Guest ID must be a positive integer'
            });
        }

        // Check if guest exists
        const existingGuest = await Guest.findById(id);
        if (!existingGuest) {
            return res.status(404).json({
                error: 'Guest not found',
                message: `No guest found with ID ${id}`
            });
        }

        const changesCount = await Guest.update(id, req.body);
        
        if (changesCount === 0) {
            return res.status(400).json({
                error: 'No changes made',
                message: 'No valid fields were updated'
            });
        }

        const updatedGuest = await Guest.findById(id);

        res.json({
            success: true,
            message: 'Guest updated successfully',
            data: updatedGuest
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /guests/:id - Delete guest by ID
app.delete('/guests/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id) || id < 1) {
            return res.status(400).json({
                error: 'Invalid guest ID',
                message: 'Guest ID must be a positive integer'
            });
        }

        // Check if guest exists
        const existingGuest = await Guest.findById(id);
        if (!existingGuest) {
            return res.status(404).json({
                error: 'Guest not found',
                message: `No guest found with ID ${id}`
            });
        }

        const deletedCount = await Guest.delete(id);
        
        if (deletedCount === 0) {
            return res.status(500).json({
                error: 'Delete failed',
                message: 'Failed to delete guest'
            });
        }

        res.json({
            success: true,
            message: 'Guest deleted successfully',
            data: {
                id: id,
                deleted: true
            }
        });
    } catch (error) {
        next(error);
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Guest Management API'
    });
});

// Default route
app.get('/', (req, res) => {
    res.json({
        message: 'Guest Management API',
        version: '1.0.0',
        endpoints: {
            'GET /guests': 'Get all guests',
            'GET /guests/:id': 'Get guest by ID',
            'POST /guests': 'Create new guest',
            'PUT /guests/:id': 'Update guest by ID',
            'DELETE /guests/:id': 'Delete guest by ID'
        }
    });
});

// Register routes
app.use('/expenses', expensesRouter);
app.use('/conceptos', conceptosRouter);

// Error handler (should be last)
app.use(errorHandler);

// Handle 404 routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`
    });
});

// Initialize database and start server
async function startServer() {
    try {
        await initializeDatabase();
        console.log('Database initialized successfully');
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on http://0.0.0.0:${PORT}`);
            console.log('Available endpoints:');
            console.log('  GET    /health');
            console.log('  GET    /guests');
            console.log('  GET    /guests/:id');
            console.log('  POST   /guests');
            console.log('  PUT    /guests/:id');
            console.log('  DELETE /guests/:id');
            console.log('  GET    /expenses');
            console.log('  GET    /expenses/:id');
            console.log('  POST   /expenses');
            console.log('  PUT    /expenses/:id');
            console.log('  DELETE /expenses/:id');
            console.log('  GET    /conceptos');
            console.log('  GET    /conceptos/:id');
            console.log('  POST   /conceptos');
            console.log('  PUT    /conceptos/:id');
            console.log('  DELETE /conceptos/:id');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down server...');
    process.exit(0);
});

startServer();
