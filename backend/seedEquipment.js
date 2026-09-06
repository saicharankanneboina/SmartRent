const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');

const User = require('./models/User');
const Equipment = require('./models/Equipment');

dotenv.config();

// Each image URL uses a unique, equipment-specific Unsplash photo with consistent sizing.
const equipmentData = [
  {
    name: 'Mahindra 575 DI Tractor',
    category: 'Agriculture',
    description: '45 HP tractor suitable for ploughing, cultivation and farming work.',
    pricePerDay: 1500,
    location: 'Hyderabad',
    latitude: 17.385,
    longitude: 78.4867,
    images: ['https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&q=80'],
    rating: 4.5,
    availability: true
  },
  {
    name: 'Rotavator',
    category: 'Agriculture',
    description: 'Farm equipment used for soil preparation and seedbed preparation.',
    pricePerDay: 1000,
    location: 'Warangal',
    latitude: 17.9689,
    longitude: 79.5941,
    images: ['https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80'],
    rating: 4.3,
    availability: true
  },
  {
    name: 'JCB Excavator',
    category: 'Construction',
    description: 'Heavy-duty excavator for digging, loading and construction work.',
    pricePerDay: 4500,
    location: 'Hyderabad',
    latitude: 17.4065,
    longitude: 78.4772,
    images: ['https://images.unsplash.com/photo-1580901369227-308f6f40ddeb?w=800&q=80'],
    rating: 4.7,
    availability: true
  },
  {
    name: 'Concrete Mixer',
    category: 'Construction',
    description: 'Portable concrete mixer for construction and building projects.',
    pricePerDay: 1200,
    location: 'Secunderabad',
    latitude: 17.4399,
    longitude: 78.4983,
    images: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80'],
    rating: 4.2,
    availability: true
  },
  {
    name: 'Diesel Generator',
    category: 'Industrial',
    description: 'Reliable generator for industrial and backup power requirements.',
    pricePerDay: 1800,
    location: 'Hyderabad',
    latitude: 17.385,
    longitude: 78.4867,
    images: ['https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80'],
    rating: 4.4,
    availability: true
  },
  {
    name: 'Industrial Welding Machine',
    category: 'Industrial',
    description: 'Heavy-duty welding machine suitable for fabrication and repair work.',
    pricePerDay: 900,
    location: 'Vijayawada',
    latitude: 16.5062,
    longitude: 80.648,
    images: ['https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80'],
    rating: 4.1,
    availability: true
  },
  {
    name: 'Event Sound System',
    category: 'Event',
    description: 'Professional sound system suitable for small events and functions.',
    pricePerDay: 2500,
    location: 'Hyderabad',
    latitude: 17.385,
    longitude: 78.4867,
    images: ['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80'],
    rating: 4.6,
    availability: true
  },
  {
    name: 'Portable Event Lighting',
    category: 'Event',
    description: 'LED lighting equipment for weddings, parties and other events.',
    pricePerDay: 1500,
    location: 'Secunderabad',
    latitude: 17.4399,
    longitude: 78.4983,
    images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80'],
    rating: 4.4,
    availability: true
  },
  {
    name: 'High Pressure Washer',
    category: 'Other',
    description: 'Portable pressure washer for cleaning vehicles, buildings and equipment.',
    pricePerDay: 700,
    location: 'Hyderabad',
    latitude: 17.385,
    longitude: 78.4867,
    images: ['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80'],
    rating: 4.2,
    availability: true
  },
  {
    name: 'Portable Water Pump',
    category: 'Other',
    description: 'Compact water pump suitable for water transfer and drainage work.',
    pricePerDay: 600,
    location: 'Nalgonda',
    latitude: 17.0575,
    longitude: 79.2684,
    images: ['https://images.unsplash.com/photo-1542013936693-884638332954?w=800&q=80'],
    rating: 4.0,
    availability: true
  }
];

const seedEquipment = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected.');

    let owner = await User.findOne({ role: 'Equipment Owner' });

    if (!owner) {
      owner = await User.create({
        name: 'Demo Equipment Owner',
        email: 'equipmentowner@smartrent.com',
        password: 'DemoOwner123',
        role: 'Equipment Owner',
        phone: '9000000000',
        location: 'Hyderabad'
      });

      console.log('Demo equipment owner created.');
    } else {
      console.log('Existing equipment owner found.');
    }

    let added = 0;

    for (const item of equipmentData) {
      const exists = await Equipment.findOne({
        name: item.name,
        ownerId: owner._id
      });

      if (!exists) {
        await Equipment.create({
          ...item,
          ownerId: owner._id
        });

        added++;
      }
    }

    console.log(`${added} equipment items added.`);
    console.log('Equipment seeding completed.');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('Error seeding equipment:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedEquipment();
