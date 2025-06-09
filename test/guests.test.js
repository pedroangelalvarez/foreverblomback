const request = require('supertest');
const app = require('../server');
const Guest = require('../models/guest');

describe('Endpoints de Huéspedes', () => {
  let guestId;

  beforeAll(async () => {
    // Configurar base de datos de prueba
    await Guest.clearTestData();
  });

  test('POST /guests - Crear nuevo huésped', async () => {
    const res = await request(app)
      .post('/guests')
      .send({
        nombre: 'Ana López',
        grupo: 'Vip'
      });
    
    guestId = res.body.data.id;
    
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.nombre).toBe('Ana López');
  });

  test('GET /guests - Obtener todos los huéspedes', async () => {
    const res = await request(app).get('/guests');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nombre: 'Ana López'
        })
      ])
    );
  });

  test('PUT /guests/:id - Actualizar huésped', async () => {
    const res = await request(app)
      .put(`/guests/${guestId}`)
      .send({
        grupo: 'Premium'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.grupo).toBe('Premium');
  });

  test('DELETE /guests/:id - Eliminar huésped', async () => {
    const res = await request(app).delete(`/guests/${guestId}`);
    
    expect(res.statusCode).toBe(200);
    
    const checkRes = await request(app).get(`/guests/${guestId}`);
    expect(checkRes.statusCode).toBe(404);
  });
});