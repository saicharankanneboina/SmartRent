const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Equipment = require('../models/Equipment');

describe('Equipment Comparison API Tests', () => {
  const mockId1 = new mongoose.Types.ObjectId().toString();
  const mockId2 = new mongoose.Types.ObjectId().toString();
  const mockId3 = new mongoose.Types.ObjectId().toString();
  const mockId4 = new mongoose.Types.ObjectId().toString();

  const mockEquipmentList = [
    {
      _id: mockId1,
      name: 'Standard Excavator 20T',
      category: 'Construction',
      description: 'Heavy duty crawler excavator',
      pricePerDay: 5000,
      rating: 4.8,
      location: 'Bangalore',
      availability: true,
      ownerId: { name: 'Owner Alice', email: 'alice@test.com' }
    },
    {
      _id: mockId2,
      name: 'Compact Mini Excavator 5T',
      category: 'Construction',
      description: 'Tight access mini excavator',
      pricePerDay: 3000,
      rating: 4.2,
      location: 'Bangalore',
      availability: true,
      ownerId: { name: 'Owner Alice', email: 'alice@test.com' }
    },
    {
      _id: mockId3,
      name: 'Agricultural Tractor 50HP',
      category: 'Agriculture',
      description: 'High torque farm tractor',
      pricePerDay: 2500,
      rating: 4.9,
      location: 'Mysore',
      availability: true,
      ownerId: { name: 'Owner Bob', email: 'bob@test.com' }
    },
    {
      _id: mockId4,
      name: 'Diesel Generator 125kVA',
      category: 'Industrial',
      description: 'Silent backup diesel generator',
      pricePerDay: 4000,
      rating: 4.0,
      location: 'Bangalore',
      availability: false,
      ownerId: { name: 'Owner Charlie', email: 'charlie@test.com' }
    }
  ];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/equipment/compare', () => {
    it('should compare two pieces of equipment and compute accurate metrics', async () => {
      const selected = [mockEquipmentList[0], mockEquipmentList[1]];
      jest.spyOn(Equipment, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue(selected)
      });

      const res = await request(app)
        .post('/api/equipment/compare')
        .send({ equipmentIds: [mockId1, mockId2] });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.lowestPrice).toBe(3000);
      expect(res.body.metrics.highestPrice).toBe(5000);
      expect(res.body.metrics.priceDifference).toBe(2000);
      expect(res.body.metrics.highestRating).toBe(4.8);

      const items = res.body.data;
      expect(items[0]._id).toBe(mockId1);
      expect(items[0].isLowestPrice).toBe(false);
      expect(items[0].isHighestRated).toBe(true);
      expect(items[0].securityDeposit).toBe(1000); // 20% of 5000
      expect(items[0].est3DayTotal).toBe((5000 * 3) + 3000); // 18000

      expect(items[1]._id).toBe(mockId2);
      expect(items[1].isLowestPrice).toBe(true);
      expect(items[1].isHighestRated).toBe(false);
      expect(items[1].priceDiffFromLowest).toBe(0);
      expect(items[1].ownerId.name).toBe('Owner Alice');
    });

    it('should support comparing up to 4 items simultaneously', async () => {
      jest.spyOn(Equipment, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockEquipmentList)
      });

      const res = await request(app)
        .post('/api/equipment/compare')
        .send({ equipmentIds: [mockId1, mockId2, mockId3, mockId4] });

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(4);
      expect(res.body.metrics.lowestPrice).toBe(2500);
      expect(res.body.metrics.highestPrice).toBe(5000);
      expect(res.body.metrics.highestRating).toBe(4.9);
    });

    it('should reject request when fewer than 2 items are provided', async () => {
      const res = await request(app)
        .post('/api/equipment/compare')
        .send({ equipmentIds: [mockId1] });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/at least 2/i);
    });

    it('should reject request when more than 4 items are provided', async () => {
      const res = await request(app)
        .post('/api/equipment/compare')
        .send({
          equipmentIds: [mockId1, mockId2, mockId3, mockId4, mockId1]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/maximum of 4/i);
    });

    it('should reject request when equipmentIds is missing or not an array', async () => {
      const res = await request(app)
        .post('/api/equipment/compare')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/provide an array/i);
    });

    it('should reject invalid MongoDB ObjectId strings', async () => {
      const res = await request(app)
        .post('/api/equipment/compare')
        .send({ equipmentIds: ['invalid-id-123', mockId1] });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('should return 404 if one or more equipment items do not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      jest.spyOn(Equipment, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue([mockEquipmentList[0]]) // only returns 1 of the 2
      });

      const res = await request(app)
        .post('/api/equipment/compare')
        .send({ equipmentIds: [mockId1, nonExistentId] });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/could not be found/i);
    });
  });
});
