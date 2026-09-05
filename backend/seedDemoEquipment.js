const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const Equipment = require('./models/Equipment');
const User = require('./models/User');

const demoEquipment = [
  // =========================
  // EXCAVATORS
  // =========================
  {
    name: 'Tata Hitachi Excavator',
    category: 'Construction',
    description: 'Heavy-duty hydraulic excavator suitable for foundation digging, earthmoving and construction excavation work.',
    pricePerDay: 4000,
    location: 'Gachibowli, Hyderabad',
    latitude: 17.4401,
    longitude: 78.3489,
    rating: 4.5,
    availability: true,
    images: []
  },
  {
    name: 'Komatsu Excavator',
    category: 'Construction',
    description: 'Powerful hydraulic excavator suitable for foundation excavation, trenching and heavy construction work.',
    pricePerDay: 5200,
    location: 'Kukatpally, Hyderabad',
    latitude: 17.4849,
    longitude: 78.4138,
    rating: 4.9,
    availability: true,
    images: []
  },
  {
    name: 'Hyundai Excavator',
    category: 'Construction',
    description: 'Reliable excavator for digging foundations, trenches and general construction excavation.',
    pricePerDay: 3800,
    location: 'Secunderabad, Hyderabad',
    latitude: 17.4399,
    longitude: 78.4983,
    rating: 4.3,
    availability: false,
    images: []
  },

  // =========================
  // CONCRETE MIXERS
  // =========================
  {
    name: 'Ajax Concrete Mixer',
    category: 'Construction',
    description: 'Concrete mixer suitable for construction projects, foundation work and concrete preparation.',
    pricePerDay: 1400,
    location: 'Madhapur, Hyderabad',
    latitude: 17.4483,
    longitude: 78.3915,
    rating: 4.6,
    availability: true,
    images: []
  },
  {
    name: 'Schwing Stetter Concrete Mixer',
    category: 'Construction',
    description: 'Professional concrete mixer for construction sites and large concrete preparation requirements.',
    pricePerDay: 1800,
    location: 'LB Nagar, Hyderabad',
    latitude: 17.3457,
    longitude: 78.5522,
    rating: 4.8,
    availability: true,
    images: []
  },

  // =========================
  // TRACTORS
  // =========================
  {
    name: 'Sonalika DI 750 Tractor',
    category: 'Agriculture',
    description: 'Agricultural tractor suitable for ploughing, farming, tilling and field preparation.',
    pricePerDay: 1700,
    location: 'Shamshabad, Hyderabad',
    latitude: 17.2510,
    longitude: 78.4370,
    rating: 4.6,
    availability: true,
    images: []
  },
  {
    name: 'John Deere 5310 Tractor',
    category: 'Agriculture',
    description: 'High-performance tractor suitable for farm ploughing, field preparation and agricultural work.',
    pricePerDay: 2200,
    location: 'Kompally, Hyderabad',
    latitude: 17.5447,
    longitude: 78.4908,
    rating: 4.9,
    availability: true,
    images: []
  },

  // =========================
  // ROTAVATORS
  // =========================
  {
    name: 'Shaktiman Rotavator',
    category: 'Agriculture',
    description: 'Agricultural rotavator for soil preparation, tilling and seedbed preparation.',
    pricePerDay: 900,
    location: 'Medchal, Hyderabad',
    latitude: 17.6299,
    longitude: 78.4814,
    rating: 4.4,
    availability: true,
    images: []
  },
  {
    name: 'Fieldking Rotavator',
    category: 'Agriculture',
    description: 'Efficient rotary tiller for agricultural soil preparation and field cultivation.',
    pricePerDay: 1100,
    location: 'Uppal, Hyderabad',
    latitude: 17.4058,
    longitude: 78.5591,
    rating: 4.7,
    availability: false,
    images: []
  },

  // =========================
  // GENERATORS
  // =========================
  {
    name: 'Kirloskar Diesel Generator',
    category: 'Industrial',
    description: 'Diesel generator suitable for construction sites, backup power and industrial applications.',
    pricePerDay: 1600,
    location: 'Begumpet, Hyderabad',
    latitude: 17.4448,
    longitude: 78.4660,
    rating: 4.5,
    availability: true,
    images: []
  },
  {
    name: 'Cummins Diesel Generator',
    category: 'Industrial',
    description: 'High-capacity diesel generator for construction projects, events and reliable backup power.',
    pricePerDay: 2100,
    location: 'Banjara Hills, Hyderabad',
    latitude: 17.4156,
    longitude: 78.4347,
    rating: 4.9,
    availability: true,
    images: []
  },

  // =========================
  // SOUND SYSTEMS
  // =========================
  {
    name: 'Premium Wedding Sound System',
    category: 'Event',
    description: 'Professional sound system for weddings, receptions, parties and large events.',
    pricePerDay: 3000,
    location: 'Jubilee Hills, Hyderabad',
    latitude: 17.4325,
    longitude: 78.4071,
    rating: 4.8,
    availability: true,
    images: []
  },
  {
    name: 'Professional DJ Sound System',
    category: 'Event',
    description: 'Powerful event sound system suitable for weddings, DJ events, parties and celebrations.',
    pricePerDay: 2500,
    location: 'Hitech City, Hyderabad',
    latitude: 17.4486,
    longitude: 78.3908,
    rating: 4.6,
    availability: true,
    images: []
  }
];

async function seedDemoEquipment() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected.');

    // Find an existing Equipment Owner.
    const owner = await User.findOne({
      role: 'Equipment Owner'
    });

    if (!owner) {
      console.log('No Equipment Owner found.');
      console.log('Please create an Equipment Owner account first.');
      process.exit(1);
    }

    console.log(`Using existing Equipment Owner: ${owner.name}`);

    let added = 0;
    let skipped = 0;

    for (const equipment of demoEquipment) {
      // Prevent duplicate demo equipment.
      const existing = await Equipment.findOne({
        name: equipment.name
      });

      if (existing) {
        console.log(`SKIPPED: ${equipment.name}`);
        skipped++;
        continue;
      }

      await Equipment.create({
        ...equipment,
        ownerId: owner._id
      });

      console.log(`ADDED: ${equipment.name}`);
      added++;
    }

    console.log('\n================================');
    console.log('Demo equipment seeding completed');
    console.log('================================');
    console.log(`Added: ${added}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total demo records: ${demoEquipment.length}`);
    console.log('\nExisting equipment was NOT modified.');
    console.log('No records were deleted.');
    console.log('No collections were dropped.');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('Error seeding demo equipment:', error);

    await mongoose.connection.close();
    process.exit(1);
  }
}

seedDemoEquipment();

