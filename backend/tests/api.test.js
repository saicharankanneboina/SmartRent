const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Equipment = require('../models/Equipment');
const Booking = require('../models/Booking');

// ─────────────────────────────────────────────────────────────
//  SmartRent — Core Feature Tests
//  Covers: Registration, Login, Equipment, Booking, Double Booking
// ─────────────────────────────────────────────────────────────

// MongoDB Memory Server can take 20-40s to download/start — extend globally
jest.setTimeout(60000);

describe('SmartRent Core API Tests', () => {

  // Shared state across tests (populated as tests run in order)
  let renterToken;
  let ownerToken;
  let equipmentId;
  let bookingId;
  let mongoServer;

  // ── Setup: spin up in-memory MongoDB before all tests ──────
  // Explicit 60s timeout on beforeAll to handle slow MMS startup
  beforeAll(async () => {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Start clean
    await User.deleteMany();
    await Equipment.deleteMany();
    await Booking.deleteMany();
  }, 60000);

  // ── Teardown: drop DB and close connection after all tests ──
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  }, 30000);

  // ═══════════════════════════════════════════════════════════
  //  TEST 1 — Registration
  //  POST /api/auth/register
  // ═══════════════════════════════════════════════════════════
  describe('Test 1 — Registration', () => {

    it('Valid registration returns 201 and a JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sai Renter',
          email: 'renter@smartrent.com',
          password: 'Test@1234',
          role: 'Renter'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();        // JWT must be returned
      expect(res.body.user.role).toBe('Renter');

      renterToken = res.body.token;                // save for later tests
    });

    it('Also registers an Equipment Owner (needed for booking tests)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Charan Owner',
          email: 'owner@smartrent.com',
          password: 'Test@1234',
          role: 'Equipment Owner'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);

      ownerToken = res.body.token;
    });

    it('Missing email → returns 400 or 500 (validation error)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'No Email User',
          // email intentionally omitted
          password: 'Test@1234',
          role: 'Renter'
        });

      // Mongoose throws a validation error (500) or controller catches it (400)
      expect([400, 500]).toContain(res.statusCode);
      expect(res.body.success).toBe(false);
    });

    it('Duplicate email → returns 400 with "already exists" error', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Renter',
          email: 'renter@smartrent.com',  // already registered above
          password: 'Test@1234',
          role: 'Renter'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already exists/i);
    });

  });

  // ═══════════════════════════════════════════════════════════
  //  TEST 2 — Login
  //  POST /api/auth/login
  // ═══════════════════════════════════════════════════════════
  describe('Test 2 — Login', () => {

    it('Correct credentials → success + JWT token returned', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'renter@smartrent.com',
          password: 'Test@1234'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();        // JWT must be present
      expect(res.body.user.email).toBe('renter@smartrent.com');
    });

    it('Wrong password → 401 Unauthorized, no token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'renter@smartrent.com',
          password: 'WrongPassword!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.token).toBeUndefined();      // no token on failed login
    });

    it('Non-existent email → 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ghost@smartrent.com',
          password: 'Test@1234'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

  });

  // ═══════════════════════════════════════════════════════════
  //  TEST 3 — Equipment
  //  GET /api/equipment
  // ═══════════════════════════════════════════════════════════
  describe('Test 3 — Equipment', () => {

    // Create one equipment item as owner so the list is never empty
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'JCB Excavator',
          category: 'Construction',
          description: 'Heavy-duty excavator for digging and construction work.',
          pricePerDay: 4500,
          location: 'Hyderabad',
          latitude: 17.4065,
          longitude: 78.4772
        });

      expect(res.statusCode).toBe(201);
      equipmentId = res.body.data._id;            // save for booking tests
    }, 15000);

    it('GET /api/equipment returns a list with at least 1 item', async () => {
      const res = await request(app).get('/api/equipment');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/equipment returns correct fields on each item', async () => {
      const res = await request(app).get('/api/equipment');
      const item = res.body.data[0];

      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('pricePerDay');
      expect(item).toHaveProperty('availability');
    });

    it('GET /api/equipment?search=Excavator filters by name/description', async () => {
      const res = await request(app).get('/api/equipment?search=Excavator');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      // Every result must relate to Excavator in name or description
      res.body.data.forEach(item => {
        const combined = (item.name + ' ' + item.description).toLowerCase();
        expect(combined).toMatch(/excavator/i);
      });
    });

  });

  // ═══════════════════════════════════════════════════════════
  //  TEST 4 — Booking
  //  POST /api/bookings
  // ═══════════════════════════════════════════════════════════
  describe('Test 4 — Booking', () => {

    // Helper: date N days from today as ISO string
    const futureDate = (days) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString();
    };

    it('Valid booking → 201 Created with correct price calculation', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          equipmentId,
          startDate: futureDate(10),  // 10 days from now
          endDate:   futureDate(13),  // 13 days from now → 3 rental days
          paymentMethod: 'Online Payment'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.equipmentId).toBe(equipmentId);
      expect(res.body.data.paymentStatus).toBe('Paid');       // Online Payment = auto Paid
      expect(res.body.data.totalRentalPrice).toBe(4500 * 3);  // 3 days × ₹4500
      expect(res.body.data.bookingStatus).toBe('Pending');    // awaiting owner approval

      bookingId = res.body.data._id;                          // save for Test 5
    });

    it('Booking without auth token → 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          equipmentId,
          startDate: futureDate(20),
          endDate:   futureDate(22),
          paymentMethod: 'Cash'
        });

      expect(res.statusCode).toBe(401);
    });

    it('Cash payment method → paymentStatus is Pending', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          equipmentId,
          startDate: futureDate(20),
          endDate:   futureDate(22),
          paymentMethod: 'Cash'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.paymentStatus).toBe('Pending');    // Cash → stays Pending
    });

  });

  // ═══════════════════════════════════════════════════════════
  //  TEST 5 — Double Booking Prevention ⭐
  //  Business-critical: same equipment cannot be booked twice
  //  for overlapping dates once a booking is Accepted.
  // ═══════════════════════════════════════════════════════════
  describe('Test 5 — Double Booking Prevention', () => {

    const futureDate = (days) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString();
    };

    // Escalate the Test 4 booking to 'Accepted' so the overlap guard triggers
    beforeAll(async () => {
      if (bookingId) {
        await request(app)
          .put(`/api/bookings/${bookingId}/status`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({ bookingStatus: 'Accepted' });
      }
    }, 15000);

    it('Exact same dates as an accepted booking → 400 "already booked"', async () => {
      // Original booking: days 10–13
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          equipmentId,
          startDate: futureDate(10),
          endDate:   futureDate(13),
          paymentMethod: 'Cash'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already booked/i);
    });

    it('Partially overlapping dates → 400 "already booked"', async () => {
      // Original booking: 10–13. Attempt 12–15 (overlaps at 12–13)
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          equipmentId,
          startDate: futureDate(12),
          endDate:   futureDate(15),
          paymentMethod: 'Online Payment'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already booked/i);
    });

    it('Non-overlapping dates → 201 booking succeeds', async () => {
      // Original booking: 10–13. Attempt 15–18 (completely clear window)
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          equipmentId,
          startDate: futureDate(15),
          endDate:   futureDate(18),
          paymentMethod: 'Online Payment'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

  });

});
