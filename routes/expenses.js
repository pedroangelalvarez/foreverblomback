const express = require('express');
const Expense = require('../models/expense');
const { validateExpense, validateExpenseUpdate } = require('../middleware/validation');

const router = express.Router();

// GET /expenses - Get all expenses with optional filtering and pagination
router.get('/', async (req, res, next) => {
    try {
        const options = {};
        
        // Extract query parameters
        if (req.query.id_concept) options.id_concept = req.query.id_concept;
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

        const expenses = await Expense.findAll(options);
        const totalCount = await Expense.count({
            id_concept: options.id_concept
        });

        res.json({
            success: true,
            data: expenses,
            meta: {
                total: totalCount,
                count: expenses.length,
                limit: options.limit || null,
                offset: options.offset || 0
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /expenses/:id - Get expense by ID
router.get('/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id) || id < 1) {
            return res.status(400).json({
                error: 'Invalid expense ID',
                message: 'Expense ID must be a positive integer'
            });
        }

        const expense = await Expense.findById(id);
        
        if (!expense) {
            return res.status(404).json({
                error: 'Expense not found',
                message: `No expense found with ID ${id}`
            });
        }

        res.json({
            success: true,
            data: expense
        });
    } catch (error) {
        next(error);
    }
});

// POST /expenses - Create new expense
router.post('/', validateExpense, async (req, res, next) => {
    try {
        const expenseId = await Expense.create(req.body);
        const newExpense = await Expense.findById(expenseId);

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: newExpense
        });
    } catch (error) {
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({
                error: 'Duplicate expense',
                message: 'An expense with similar details already exists'
            });
        }
        next(error);
    }
});

// PUT /expenses/:id - Update expense by ID
router.put('/:id', validateExpenseUpdate, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id) || id < 1) {
            return res.status(400).json({
                error: 'Invalid expense ID',
                message: 'Expense ID must be a positive integer'
            });
        }

        // Check if expense exists
        const existingExpense = await Expense.findById(id);
        if (!existingExpense) {
            return res.status(404).json({
                error: 'Expense not found',
                message: `No expense found with ID ${id}`
            });
        }

        const changesCount = await Expense.update(id, req.body);
        
        if (changesCount === 0) {
            return res.status(400).json({
                error: 'No changes made',
                message: 'No valid fields were updated'
            });
        }

        const updatedExpense = await Expense.findById(id);

        res.json({
            success: true,
            message: 'Expense updated successfully',
            data: updatedExpense
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /expenses/:id - Delete expense by ID
router.delete('/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id) || id < 1) {
            return res.status(400).json({
                error: 'Invalid expense ID',
                message: 'Expense ID must be a positive integer'
            });
        }

        // Check if expense exists
        const existingExpense = await Expense.findById(id);
        if (!existingExpense) {
            return res.status(404).json({
                error: 'Expense not found',
                message: `No expense found with ID ${id}`
            });
        }

        const deletedCount = await Expense.delete(id);
        
        if (deletedCount === 0) {
            return res.status(500).json({
                error: 'Delete failed',
                message: 'Failed to delete expense'
            });
        }

        res.json({
            success: true,
            message: 'Expense deleted successfully',
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