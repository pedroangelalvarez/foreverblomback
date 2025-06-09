// Validation middleware for guest data

function validateGuest(req, res, next) {
    const {
        first_name,
        last_name,
        gender,
        family,
        guest_count,
        expiration_date,
        confirmation
    } = req.body;

    const errors = [];

    // Required field validation
    if (!first_name || typeof first_name !== 'string' || first_name.trim().length === 0) {
        errors.push('first_name is required and must be a non-empty string');
    } else if (first_name.trim().length > 100) {
        errors.push('first_name must not exceed 100 characters');
    }

    if (!last_name || typeof last_name !== 'string' || last_name.trim().length === 0) {
        errors.push('last_name is required and must be a non-empty string');
    } else if (last_name.trim().length > 100) {
        errors.push('last_name must not exceed 100 characters');
    }

    // Optional field validation
    if (gender !== undefined && gender !== null) {
        if (typeof gender !== 'string' || gender.trim().length === 0) {
            errors.push('gender must be a non-empty string if provided');
        } else if (!['male', 'female', 'other', 'prefer not to say'].includes(gender.toLowerCase())) {
            errors.push('gender must be one of: male, female, other, prefer not to say');
        }
    }

    if (family !== undefined && family !== null) {
        if (typeof family !== 'string') {
            errors.push('family must be a string if provided');
        } else if (family.length > 100) {
            errors.push('family must not exceed 100 characters');
        }
    }

    if (guest_count !== undefined && guest_count !== null) {
        if (!Number.isInteger(guest_count) || guest_count < 1 || guest_count > 50) {
            errors.push('guest_count must be an integer between 1 and 50');
        }
    }

    if (expiration_date !== undefined && expiration_date !== null) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(expiration_date)) {
            errors.push('expiration_date must be in YYYY-MM-DD format');
        } else {
            const date = new Date(expiration_date);
            if (isNaN(date.getTime())) {
                errors.push('expiration_date must be a valid date');
            }
        }
    }

    if (confirmation !== undefined && confirmation !== null) {
        if (typeof confirmation !== 'boolean') {
            errors.push('confirmation must be a boolean value');
        }
    }

    // Sanitize string fields
    if (first_name) req.body.first_name = first_name.trim();
    if (last_name) req.body.last_name = last_name.trim();
    if (gender) req.body.gender = gender.trim().toLowerCase();
    if (family) req.body.family = family.trim();

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            message: 'The provided data contains validation errors',
            details: errors
        });
    }

    next();
}

function validateGuestUpdate(req, res, next) {
    const {
        first_name,
        last_name,
        gender,
        family,
        guest_count,
        expiration_date,
        confirmation
    } = req.body;

    const errors = [];

    // Check if at least one field is provided for update
    const hasValidField = [
        first_name, last_name, gender, family, 
        guest_count, expiration_date, confirmation
    ].some(field => field !== undefined);

    if (!hasValidField) {
        return res.status(400).json({
            error: 'No valid fields provided',
            message: 'At least one valid field must be provided for update'
        });
    }

    // Validate provided fields (similar to create but all optional)
    if (first_name !== undefined) {
        if (!first_name || typeof first_name !== 'string' || first_name.trim().length === 0) {
            errors.push('first_name must be a non-empty string if provided');
        } else if (first_name.trim().length > 100) {
            errors.push('first_name must not exceed 100 characters');
        } else {
            req.body.first_name = first_name.trim();
        }
    }

    if (last_name !== undefined) {
        if (!last_name || typeof last_name !== 'string' || last_name.trim().length === 0) {
            errors.push('last_name must be a non-empty string if provided');
        } else if (last_name.trim().length > 100) {
            errors.push('last_name must not exceed 100 characters');
        } else {
            req.body.last_name = last_name.trim();
        }
    }

    if (gender !== undefined && gender !== null) {
        if (typeof gender !== 'string' || gender.trim().length === 0) {
            errors.push('gender must be a non-empty string if provided');
        } else if (!['male', 'female', 'other', 'prefer not to say'].includes(gender.toLowerCase())) {
            errors.push('gender must be one of: male, female, other, prefer not to say');
        } else {
            req.body.gender = gender.trim().toLowerCase();
        }
    }

    if (family !== undefined && family !== null) {
        if (typeof family !== 'string') {
            errors.push('family must be a string if provided');
        } else if (family.length > 100) {
            errors.push('family must not exceed 100 characters');
        } else {
            req.body.family = family.trim();
        }
    }

    if (guest_count !== undefined && guest_count !== null) {
        if (!Number.isInteger(guest_count) || guest_count < 1 || guest_count > 50) {
            errors.push('guest_count must be an integer between 1 and 50');
        }
    }

    if (expiration_date !== undefined && expiration_date !== null) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(expiration_date)) {
            errors.push('expiration_date must be in YYYY-MM-DD format');
        } else {
            const date = new Date(expiration_date);
            if (isNaN(date.getTime())) {
                errors.push('expiration_date must be a valid date');
            }
        }
    }

    if (confirmation !== undefined && confirmation !== null) {
        if (typeof confirmation !== 'boolean') {
            errors.push('confirmation must be a boolean value');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            message: 'The provided data contains validation errors',
            details: errors
        });
    }

    next();
}

// Validation function for expense data
function validateExpense(req, res, next) {
    const {
        descripcion,
        detalle,
        responsable,
        monto,
        id_concept
    } = req.body;

    const errors = [];

    // Required field validation
    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0) {
        errors.push('descripcion is required and must be a non-empty string');
    } else if (descripcion.trim().length > 100) {
        errors.push('descripcion must not exceed 100 characters');
    }

    if (monto === undefined || monto === null || isNaN(monto) || monto <= 0) {
        errors.push('monto is required and must be a positive number');
    }

    // Optional field validation
    if (detalle !== undefined && detalle !== null) {
        if (typeof detalle !== 'string') {
            errors.push('detalle must be a string if provided');
        } else if (detalle.length > 500) {
            errors.push('detalle must not exceed 500 characters');
        }
    }

    if (responsable !== undefined && responsable !== null) {
        if (typeof responsable !== 'string') {
            errors.push('responsable must be a string if provided');
        } else if (responsable.length > 100) {
            errors.push('responsable must not exceed 100 characters');
        }
    }

    if (id_concept !== undefined && id_concept !== null) {
        if (!Number.isInteger(id_concept) || id_concept < 1) {
            errors.push('id_concept must be a positive integer if provided');
        }
    }

    // Sanitize string fields
    if (descripcion) req.body.descripcion = descripcion.trim();
    if (detalle) req.body.detalle = detalle.trim();
    if (responsable) req.body.responsable = responsable.trim();

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            message: 'The provided data contains validation errors',
            details: errors
        });
    }

    next();
}

// Validation function for expense update data
function validateExpenseUpdate(req, res, next) {
    const {
        descripcion,
        detalle,
        responsable,
        monto,
        id_concept
    } = req.body;

    const errors = [];

    // Check if at least one field is provided for update
    const hasValidField = [
        descripcion, detalle, responsable, monto, id_concept
    ].some(field => field !== undefined);

    if (!hasValidField) {
        return res.status(400).json({
            error: 'No valid fields provided',
            message: 'At least one valid field must be provided for update'
        });
    }

    // Validate provided fields (similar to create but all optional)
    if (descripcion !== undefined) {
        if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0) {
            errors.push('descripcion must be a non-empty string if provided');
        } else if (descripcion.trim().length > 100) {
            errors.push('descripcion must not exceed 100 characters');
        } else {
            req.body.descripcion = descripcion.trim();
        }
    }

    if (detalle !== undefined && detalle !== null) {
        if (typeof detalle !== 'string') {
            errors.push('detalle must be a string if provided');
        } else if (detalle.length > 500) {
            errors.push('detalle must not exceed 500 characters');
        } else {
            req.body.detalle = detalle.trim();
        }
    }

    if (responsable !== undefined && responsable !== null) {
        if (typeof responsable !== 'string') {
            errors.push('responsable must be a string if provided');
        } else if (responsable.length > 100) {
            errors.push('responsable must not exceed 100 characters');
        } else {
            req.body.responsable = responsable.trim();
        }
    }

    if (monto !== undefined && monto !== null) {
        if (isNaN(monto) || monto <= 0) {
            errors.push('monto must be a positive number if provided');
        }
    }

    if (id_concept !== undefined && id_concept !== null) {
        if (!Number.isInteger(id_concept) || id_concept < 1) {
            errors.push('id_concept must be a positive integer if provided');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            message: 'The provided data contains validation errors',
            details: errors
        });
    }

    next();
}

// Add to exports
module.exports = {
    validateGuest,
    validateGuestUpdate,
    validateExpense,
    validateExpenseUpdate
};
