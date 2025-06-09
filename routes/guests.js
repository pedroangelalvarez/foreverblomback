const express = require('express');
const Guest = require('../models/guest');
const { validateGuest, validateGuestUpdate } = require('../middleware/validation');

const router = express.Router();

// GET /guests - Get all guests with optional filtering and pagination
router.get('/', async (req, res, next) => {
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
router.get('/:id', async (req, res, next) => {
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
router.post('/', validateGuest, async (req, res, next) => {
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
router.put('/:id', validateGuestUpdate, async (req, res, next) => {
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
router.delete('/:id', async (req, res, next) => {
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

module.exports = router;
