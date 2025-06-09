const express = require('express');
const router = express.Router();
const Concepto = require('../models/concepto');

// Get all conceptos
router.get('/', async (req, res, next) => {
    try {
        const conceptos = await Concepto.findAll();
        res.json({
            success: true,
            data: conceptos,
            meta: {
                total: conceptos.length,
                count: conceptos.length,
                limit: null,
                offset: 0
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get concepto by ID
router.get('/:id', async (req, res, next) => {
    try {
        const concepto = await Concepto.findById(req.params.id);
        if (!concepto) {
            return res.status(404).json({ error: 'Concepto not found' });
        }
        res.json(concepto);
    } catch (error) {
        next(error);
    }
});

// Create new concepto
router.post('/', async (req, res, next) => {
    try {
        const { nombre, subtotal } = req.body;
        if (!nombre || !subtotal) {
            return res.status(400).json({ error: 'nombre and subtotal are required' });
        }
        const id = await Concepto.create({ nombre, subtotal });
        const newConcepto = await Concepto.findById(id);
        res.status(201).json(newConcepto);
    } catch (error) {
        next(error);
    }
});

// Update concepto
router.put('/:id', async (req, res, next) => {
    try {
        const { nombre, subtotal } = req.body;
        await Concepto.update(req.params.id, { nombre, subtotal });
        const updatedConcepto = await Concepto.findById(req.params.id);
        if (!updatedConcepto) {
            return res.status(404).json({ error: 'Concepto not found' });
        }
        res.json(updatedConcepto);
    } catch (error) {
        next(error);
    }
});

module.exports = router;