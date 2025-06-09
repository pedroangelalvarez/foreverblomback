const http = require('http');
const url = require('url');
const { initializeDatabase } = require('./database/init');
const Guest = require('./models/guest');
const Grupo = require('./models/grupo');
const Concepto = require('./models/concepto');

const PORT = process.env.PORT || 5000;

// Helper function to parse JSON body
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(new Error('Invalid JSON'));
            }
        });
    });
}

// Helper function to send JSON response
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

// Validation function for guest data
function validateGuestData(data, isUpdate = false) {
    const errors = [];
    
    if (!isUpdate || data.first_name !== undefined) {
        if (!data.first_name || typeof data.first_name !== 'string' || data.first_name.trim().length === 0) {
            errors.push('first_name is required and must be a non-empty string');
        }
    }
    
    if (!isUpdate || data.last_name !== undefined) {
        if (!data.last_name || typeof data.last_name !== 'string' || data.last_name.trim().length === 0) {
            errors.push('last_name is required and must be a non-empty string');
        }
    }
    
    if (data.guest_count !== undefined && (!Number.isInteger(data.guest_count) || data.guest_count < 1)) {
        errors.push('guest_count must be a positive integer');
    }
    
    return errors;
}

// Validation function for grupo data
function validateGrupoData(data, isUpdate = false) {
    const errors = [];
    
    if (!isUpdate || data.nombre !== undefined) {
        if (!data.nombre || typeof data.nombre !== 'string' || data.nombre.trim().length === 0) {
            errors.push('nombre is required and must be a non-empty string');
        }
    }
    
    return errors;
}

// Validation function for concepto data
function validateConceptoData(data, isUpdate = false) {
    const errors = [];
    
    if (!isUpdate || data.nombre !== undefined) {
        if (!data.nombre || typeof data.nombre !== 'string' || data.nombre.trim().length === 0) {
            errors.push('nombre is required and must be a non-empty string');
        }
    }
    
    if (!isUpdate || data.costo !== undefined) {
        if (data.costo === undefined || data.costo === null || isNaN(data.costo) || data.costo < 0) {
            errors.push('costo is required and must be a non-negative number');
        }
    }
    
    if (data.grupo_id !== undefined && data.grupo_id !== null && (!Number.isInteger(data.grupo_id) || data.grupo_id < 1)) {
        errors.push('grupo_id must be a positive integer if provided');
    }
    
    return errors;
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;
    
    console.log(`${new Date().toISOString()} - ${method} ${path}`);
    
    try {
        // Handle CORS preflight
        if (method === 'OPTIONS') {
            sendJSON(res, 200, { message: 'OK' });
            return;
        }
        
        // Root endpoint
        if (path === '/' && method === 'GET') {
            sendJSON(res, 200, {
                message: 'Guest Management API',
                version: '1.0.0',
                endpoints: {
                    'GET /guests': 'Get all guests',
                    'GET /guests/:id': 'Get guest by ID',
                    'POST /guests': 'Create new guest',
                    'PUT /guests/:id': 'Update guest by ID',
                    'DELETE /guests/:id': 'Delete guest by ID',
                    'GET /grupos': 'Get all grupos',
                    'GET /grupos/:id': 'Get grupo by ID',
                    'POST /grupos': 'Create new grupo',
                    'PUT /grupos/:id': 'Update grupo by ID',
                    'DELETE /grupos/:id': 'Delete grupo by ID',
                    'GET /conceptos': 'Get all conceptos',
                    'GET /conceptos/:id': 'Get concepto by ID',
                    'POST /conceptos': 'Create new concepto',
                    'PUT /conceptos/:id': 'Update concepto by ID',
                    'DELETE /conceptos/:id': 'Delete concepto by ID'
                }
            });
            return;
        }
        
        // Health check
        if (path === '/health' && method === 'GET') {
            sendJSON(res, 200, {
                status: 'OK',
                timestamp: new Date().toISOString(),
                service: 'Guest Management API'
            });
            return;
        }
        
        // Guest routes
        if (path === '/guests' && method === 'GET') {
            const options = {};
            if (parsedUrl.query.gender) options.gender = parsedUrl.query.gender;
            if (parsedUrl.query.family) options.family = parsedUrl.query.family;
            if (parsedUrl.query.confirmation !== undefined) {
                options.confirmation = parsedUrl.query.confirmation === 'true';
            }
            if (parsedUrl.query.limit) options.limit = parseInt(parsedUrl.query.limit);
            if (parsedUrl.query.offset) options.offset = parseInt(parsedUrl.query.offset);
            
            const guests = await Guest.findAll(options);
            const totalCount = await Guest.count({
                gender: options.gender,
                family: options.family,
                confirmation: options.confirmation
            });
            
            sendJSON(res, 200, {
                success: true,
                data: guests,
                meta: {
                    total: totalCount,
                    count: guests.length,
                    limit: options.limit || null,
                    offset: options.offset || 0
                }
            });
            return;
        }
        
        // Create new guest
        if (path === '/guests' && method === 'POST') {
            const body = await parseBody(req);
            const errors = validateGuestData(body);
            
            if (errors.length > 0) {
                sendJSON(res, 400, {
                    error: 'Validation failed',
                    details: errors
                });
                return;
            }
            
            const guestId = await Guest.create(body);
            const newGuest = await Guest.findById(guestId);
            
            sendJSON(res, 201, {
                success: true,
                message: 'Guest created successfully',
                data: newGuest
            });
            return;
        }
        
        // Get guest by ID
        const guestIdMatch = path.match(/^\/guests\/(\d+)$/);
        if (guestIdMatch && method === 'GET') {
            const id = parseInt(guestIdMatch[1]);
            const guest = await Guest.findById(id);
            
            if (!guest) {
                sendJSON(res, 404, {
                    error: 'Guest not found',
                    message: `No guest found with ID ${id}`
                });
                return;
            }
            
            sendJSON(res, 200, {
                success: true,
                data: guest
            });
            return;
        }
        
        // Update guest by ID
        if (guestIdMatch && method === 'PUT') {
            const id = parseInt(guestIdMatch[1]);
            const body = await parseBody(req);
            const errors = validateGuestData(body, true);
            
            if (errors.length > 0) {
                sendJSON(res, 400, {
                    error: 'Validation failed',
                    details: errors
                });
                return;
            }
            
            const existingGuest = await Guest.findById(id);
            if (!existingGuest) {
                sendJSON(res, 404, {
                    error: 'Guest not found',
                    message: `No guest found with ID ${id}`
                });
                return;
            }
            
            await Guest.update(id, body);
            const updatedGuest = await Guest.findById(id);
            
            sendJSON(res, 200, {
                success: true,
                message: 'Guest updated successfully',
                data: updatedGuest
            });
            return;
        }
        
        // Delete guest by ID
        if (guestIdMatch && method === 'DELETE') {
            const id = parseInt(guestIdMatch[1]);
            
            const existingGuest = await Guest.findById(id);
            if (!existingGuest) {
                sendJSON(res, 404, {
                    error: 'Guest not found',
                    message: `No guest found with ID ${id}`
                });
                return;
            }
            
            await Guest.delete(id);
            
            sendJSON(res, 200, {
                success: true,
                message: 'Guest deleted successfully',
                data: { id: id, deleted: true }
            });
            return;
        }

        // GRUPOS ROUTES
        // Get all grupos
        if (path === '/grupos' && method === 'GET') {
            const grupos = await Grupo.findAll();
            const totalCount = await Grupo.count();
            
            sendJSON(res, 200, {
                success: true,
                data: grupos,
                meta: {
                    total: totalCount,
                    count: grupos.length
                }
            });
            return;
        }
        
        // Create new grupo
        if (path === '/grupos' && method === 'POST') {
            const body = await parseBody(req);
            const errors = validateGrupoData(body);
            
            if (errors.length > 0) {
                sendJSON(res, 400, {
                    error: 'Validation failed',
                    details: errors
                });
                return;
            }
            
            const grupoId = await Grupo.create(body);
            const newGrupo = await Grupo.findById(grupoId);
            
            sendJSON(res, 201, {
                success: true,
                message: 'Grupo created successfully',
                data: newGrupo
            });
            return;
        }
        
        // Get grupo by ID
        const grupoIdMatch = path.match(/^\/grupos\/(\d+)$/);
        if (grupoIdMatch && method === 'GET') {
            const id = parseInt(grupoIdMatch[1]);
            const grupo = await Grupo.findById(id);
            
            if (!grupo) {
                sendJSON(res, 404, {
                    error: 'Grupo not found',
                    message: `No grupo found with ID ${id}`
                });
                return;
            }
            
            sendJSON(res, 200, {
                success: true,
                data: grupo
            });
            return;
        }
        
        // Update grupo by ID
        if (grupoIdMatch && method === 'PUT') {
            const id = parseInt(grupoIdMatch[1]);
            const body = await parseBody(req);
            const errors = validateGrupoData(body, true);
            
            if (errors.length > 0) {
                sendJSON(res, 400, {
                    error: 'Validation failed',
                    details: errors
                });
                return;
            }
            
            const existingGrupo = await Grupo.findById(id);
            if (!existingGrupo) {
                sendJSON(res, 404, {
                    error: 'Grupo not found',
                    message: `No grupo found with ID ${id}`
                });
                return;
            }
            
            await Grupo.update(id, body);
            const updatedGrupo = await Grupo.findById(id);
            
            sendJSON(res, 200, {
                success: true,
                message: 'Grupo updated successfully',
                data: updatedGrupo
            });
            return;
        }
        
        // Delete grupo by ID
        if (grupoIdMatch && method === 'DELETE') {
            const id = parseInt(grupoIdMatch[1]);
            
            const existingGrupo = await Grupo.findById(id);
            if (!existingGrupo) {
                sendJSON(res, 404, {
                    error: 'Grupo not found',
                    message: `No grupo found with ID ${id}`
                });
                return;
            }
            
            await Grupo.delete(id);
            
            sendJSON(res, 200, {
                success: true,
                message: 'Grupo deleted successfully',
                data: { id: id, deleted: true }
            });
            return;
        }

        // CONCEPTOS ROUTES
        // Get all conceptos
        if (path === '/conceptos' && method === 'GET') {
            const options = {};
            if (parsedUrl.query.grupo_id) options.grupo_id = parseInt(parsedUrl.query.grupo_id);
            
            const conceptos = await Concepto.findAll(options);
            const totalCount = await Concepto.count({
                grupo_id: options.grupo_id
            });
            
            sendJSON(res, 200, {
                success: true,
                data: conceptos,
                meta: {
                    total: totalCount,
                    count: conceptos.length,
                    grupo_id: options.grupo_id || null
                }
            });
            return;
        }
        
        // Create new concepto
        if (path === '/conceptos' && method === 'POST') {
            const body = await parseBody(req);
            const errors = validateConceptoData(body);
            
            if (errors.length > 0) {
                sendJSON(res, 400, {
                    error: 'Validation failed',
                    details: errors
                });
                return;
            }
            
            const conceptoId = await Concepto.create(body);
            const newConcepto = await Concepto.findById(conceptoId);
            
            sendJSON(res, 201, {
                success: true,
                message: 'Concepto created successfully',
                data: newConcepto
            });
            return;
        }
        
        // Get concepto by ID
        const conceptoIdMatch = path.match(/^\/conceptos\/(\d+)$/);
        if (conceptoIdMatch && method === 'GET') {
            const id = parseInt(conceptoIdMatch[1]);
            const concepto = await Concepto.findById(id);
            
            if (!concepto) {
                sendJSON(res, 404, {
                    error: 'Concepto not found',
                    message: `No concepto found with ID ${id}`
                });
                return;
            }
            
            sendJSON(res, 200, {
                success: true,
                data: concepto
            });
            return;
        }
        
        // Update concepto by ID
        if (conceptoIdMatch && method === 'PUT') {
            const id = parseInt(conceptoIdMatch[1]);
            const body = await parseBody(req);
            const errors = validateConceptoData(body, true);
            
            if (errors.length > 0) {
                sendJSON(res, 400, {
                    error: 'Validation failed',
                    details: errors
                });
                return;
            }
            
            const existingConcepto = await Concepto.findById(id);
            if (!existingConcepto) {
                sendJSON(res, 404, {
                    error: 'Concepto not found',
                    message: `No concepto found with ID ${id}`
                });
                return;
            }
            
            await Concepto.update(id, body);
            const updatedConcepto = await Concepto.findById(id);
            
            sendJSON(res, 200, {
                success: true,
                message: 'Concepto updated successfully',
                data: updatedConcepto
            });
            return;
        }
        
        // Delete concepto by ID
        if (conceptoIdMatch && method === 'DELETE') {
            const id = parseInt(conceptoIdMatch[1]);
            
            const existingConcepto = await Concepto.findById(id);
            if (!existingConcepto) {
                sendJSON(res, 404, {
                    error: 'Concepto not found',
                    message: `No concepto found with ID ${id}`
                });
                return;
            }
            
            await Concepto.delete(id);
            
            sendJSON(res, 200, {
                success: true,
                message: 'Concepto deleted successfully',
                data: { id: id, deleted: true }
            });
            return;
        }
        
        // 404 for all other routes
        sendJSON(res, 404, {
            error: 'Route not found',
            message: `The requested endpoint ${method} ${path} does not exist`
        });
        
    } catch (error) {
        console.error('Server error:', error);
        sendJSON(res, 500, {
            error: 'Internal Server Error',
            message: 'An unexpected error occurred while processing your request'
        });
    }
});

// Initialize database and start server
async function startServer() {
    try {
        await initializeDatabase();
        console.log('Database initialized successfully');
        
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on http://0.0.0.0:${PORT}`);
            console.log('Available endpoints:');
            console.log('  GET    /health');
            console.log('  GET    /guests');
            console.log('  GET    /guests/:id');
            console.log('  POST   /guests');
            console.log('  PUT    /guests/:id');
            console.log('  DELETE /guests/:id');
            console.log('  GET    /grupos');
            console.log('  GET    /grupos/:id');
            console.log('  POST   /grupos');
            console.log('  PUT    /grupos/:id');
            console.log('  DELETE /grupos/:id');
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
    server.close(() => {
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\nShutting down server...');
    server.close(() => {
        process.exit(0);
    });
});

startServer();