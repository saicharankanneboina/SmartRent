const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Equipment = require('../models/Equipment');
const Booking = require('../models/Booking');

describe('SmartRent API Tests', () => {
  let renterToken;
  let ownerToken;
  let renterId;
  let ownerId;
  let equipmentId;

  let mongoServer;

  beforeAll(async () => {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const url = mongoServer.getUri();
    await mongoose.connect(url);
    
    // Clear collections
    await User.deleteMany();
    await Equipment.deleteMany();
    await Booking.deleteMany();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('Auth API', () => {
    it('should register a renter', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test Renter',
        email: 'renter@test.com',
        password: 'password123',
        role: 'Renter'
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      renterToken = res.body.token;
      renterId = res.body.user.id;
    });

    it('should register an owner', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test Owner',
        email: 'owner@test.com',
        password: 'password123',
        role: 'Equipment Owner'
      });
      expect(res.statusCode).toBe(201);
      ownerToken = res.body.token;
      ownerId = res.body.user.id;
    });

    it('should login the renter', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'renter@test.com',
        password: 'password123'
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Equipment API', () => {
    it('should not allow renter to create equipment', async () => {
      const res = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          name: 'Excavator',
          category: 'Construction',
          description: 'Big digger',
          pricePerDay: 200,
          location: 'Test City'
        });
      expect(res.statusCode).toBe(403);
    });

    it('should allow owner to create equipment', async () => {
      const res = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Mini Excavator',
          category: 'Construction',
          description: 'Small digger',
          pricePerDay: 150,
          location: 'Test City',
          latitude: 40.7128,
          longitude: -74.0060
        });
      expect(res.statusCode).toBe(201);
      equipmentId = res.body.data._id;
    });

    it('should get all equipment', async () => {
      const res = await request(app).get('/api/equipment');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Booking API', () => {
    it('should create a booking and check availability', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // tomorrow
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 4); // 4 days later
      
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          equipmentId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          paymentMethod: 'Online Payment'
        });
        
      expect(res.statusCode).toBe(201);
      expect(res.body.data.paymentStatus).toBe('Paid');
      
      // Update status to Active to test double booking
      await request(app)
        .put(`/api/bookings/${res.body.data._id}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ bookingStatus: 'Active' });
    });

    it('should prevent double booking', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 2); 
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3); 
      
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${renterToken}`)
        .send({
          equipmentId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          paymentMethod: 'Cash'
        });
        
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/already booked/);
    });
  });

  describe('Recommendation API', () => {
    // Note: This relies on the Gemini API. If the key is not valid, it might fail.
    // To make it robust, we would mock geminiService, but we'll try a real hit or expect 502 if unconfigured.
    it('should handle AI recommendation', async () => {
      const res = await request(app)
        .post('/api/recommendations/analyze')
        .send({
          prompt: 'I need to dig a small hole',
          latitude: 40.7128,
          longitude: -74.0060,
          budget: 200
        });
      
      // We expect either 200 (if Gemini works) or 502 (if API key is invalid/mocked)
      expect([200, 502]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(res.body.recommendations).toBeDefined();
      }
    });
  });
});
