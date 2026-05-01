const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Event = require('../models/Event');
const bcrypt = require('bcrypt');
const { connectDB } = require('../config/database');
require('dotenv').config();  // Load environment variables from .env

const seedDatabase = async () => {
  try {
    console.log('🌱 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');
    console.log('📊 Connected to database:', mongoose.connection.db?.name || 'unknown');

    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Event.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create admin user (password will be hashed by pre-save hook)
    const admin = await User.create({
      email: 'admin@eventify.com',
      password: 'Admin@123',
      role: 'admin',
      profile: {
        firstName: 'Super',
        lastName: 'Admin',
        phone: '9876543210',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male'
      },
      address: {
        street: '123 Admin Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: '400001'
      },
      emailVerified: true,
      isActive: true
    });
    console.log('✅ Admin user created:', admin.email);

    // Verify admin was actually saved
    const adminCheck = await User.findById(admin._id);
    if (!adminCheck) {
      console.error('❌ Admin user NOT found after creation!');
    } else {
      console.log('✅ Admin verified in database');
    }

    // Create sample employee data (but not Employee model yet since that depends on User)
    // We'll create employee records first
    console.log('\n📋 Creating sample employees...');

    const employeesData = [
      {
        email: 'rajesh.kumar@eventify.com',
        profile: { firstName: 'Rajesh', lastName: 'Kumar', phone: '9876543211' },
        department: 'Event Management',
        designation: 'Senior Event Manager',
        specializations: ['wedding', 'corporate'],
        skills: ['event-planning', 'vendor-management', 'budgeting'],
        experience: 10,
        salary: 80000
      },
      {
        email: 'priya.sharma@eventify.com',
        profile: { firstName: 'Priya', lastName: 'Sharma', phone: '9876543212' },
        department: 'Operations',
        designation: 'Operations Coordinator',
        specializations: ['wedding', 'birthday', 'party'],
        skills: ['coordination', 'logistics', 'communication'],
        experience: 5,
        salary: 50000
      },
      {
        email: 'vijay.patel@eventify.com',
        profile: { firstName: 'Vijay', lastName: 'Patel', phone: '9876543213' },
        department: 'Finance',
        designation: 'Finance Executive',
        specializations: ['corporate'],
        skills: ['accounting', 'budgeting', 'invoicing'],
        experience: 7,
        salary: 60000
      },
      {
        email: 'sunita.gupta@eventify.com',
        profile: { firstName: 'Sunita', lastName: 'Gupta', phone: '9876543214' },
        department: 'Marketing',
        designation: 'Marketing Manager',
        specializations: ['corporate', 'product-launch'],
        skills: ['marketing', 'social-media', 'branding'],
        experience: 8,
        salary: 70000
      },
      {
        email: 'amit.singh@eventify.com',
        profile: { firstName: 'Amit', lastName: 'Singh', phone: '9876543215' },
        department: 'Event Management',
        designation: 'Event Coordinator',
        specializations: ['birthday', 'party', 'college-fest'],
        skills: ['event-coordination', 'decor', 'music'],
        experience: 4,
        salary: 45000
      }
    ];

    for (const empData of employeesData) {
      // Create user account (password will be hashed by pre-save hook)
      const empUser = await User.create({
        email: empData.email,
        password: 'Employee@123',
        role: 'employee',
        profile: empData.profile,
        address: {
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India'
        },
        emailVerified: true,
        isActive: true
      });

      // Create employee record
      await Employee.create({
        user: empUser._id,
        department: empData.department,
        designation: empData.designation,
        specializations: empData.specializations,
        skills: empData.skills,
        experience: empData.experience,
        salary: empData.salary,
        joiningDate: new Date(2022, 0, 15),
        status: 'active',
        availability: {
          isAvailable: true,
          unavailabilityDates: []
        }
      });
    }

    console.log('✅ Created 5 employee accounts');

    // Verify users were created
    const userCount = await User.countDocuments();
    console.log(`📊 Total users in DB now: ${userCount}`);

    // Create sample events
    console.log('\n🎉 Creating sample events...');

    const eventsData = [
      {
        name: 'Royal Palace Wedding',
        type: 'wedding',
        subType: 'marriage',
        description: 'An extravagant wedding experience in a palace setting with traditional Indian decor, live band, and gourmet cuisine. Perfect for grand celebrations with 500+ guests.',
        shortDescription: 'Grand palace wedding with traditional Indian ceremonies and modern amenities.',
        tags: ['wedding', 'palace', 'traditional', 'luxury'],
        packages: [
          {
            name: 'premium',
            displayName: 'Premium Package',
            description: 'Complete wedding package with all essential services',
            price: 1500000,
            discountedPrice: 1350000,
            maxGuests: 300,
            duration: '8 hours',
            isActive: true,
            includedServices: [
              { name: 'Venue Rental', description: 'Palace venue for all ceremonies', icon: '🏰' },
              { name: 'Catering', description: 'Full meal service for all guests', icon: '🍽️' },
              { name: 'Decoration', description: 'Floral and thematic decor', icon: '🌸' },
              { name: 'Photography', description: '2 photographers for 10 hours', icon: '📸' },
              { name: 'Video Coverage', description: 'Cinematic wedding video', icon: '🎥' },
              { name: 'DJ & Sound', description: 'Professional DJ and sound system', icon: '🎵' },
              { name: 'Live Band', description: 'Traditional and modern band', icon: '🎸' },
              { name: 'Security', description: 'Professional security staff', icon: '🛡️' },
              { name: 'Parking', description: 'Dedicated parking area', icon: '🚗' },
              { name: 'Makeup Artists', description: 'Bridal party makeup', icon: '💄' }
            ]
          },
          {
            name: 'luxury',
            displayName: 'Luxury Package',
            description: 'Ultimate wedding experience with premium services and exclusivity',
            price: 3000000,
            discountedPrice: 2800000,
            maxGuests: 500,
            duration: '12 hours',
            isActive: true,
            packageOrder: 2,
            includedServices: [
              { name: 'Exclusive Palace Booking', description: 'Complete palace for exclusive use', icon: '👑' },
              { name: 'Gourmet Catering', description: 'Multiple cuisine live counters', icon: '🍴' },
              { name: 'Premium Decoration', description: 'Gold & floral themes with LED', icon: '✨' },
              { name: 'Wedding Videography', description: 'Drone shots + cinematic film', icon: '🎬' },
              { name: 'Photo Booth', description: 'Interactive photo booth with props', icon: '📷' },
              { name: 'Celebrity DJ', description: 'Famous DJ for night party', icon: '🎧' },
              { name: 'Live Music', description: 'Sufi + Bollywood live singers', icon: '🎤' },
              { name: 'Fireworks', description: 'Grand fireworks display', icon: '🎆' },
              { name: 'Groom\'s Package', description: 'Complete grooming & styling', icon: '💈' },
              { name: 'Wedding Planner', description: 'Dedicated event manager', icon: '📋' }
            ]
          }
        ],
        venues: [
          {
            name: 'Royal Palace Convention',
            address: 'Near City Center, Marine Drive',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            pincode: '400001',
            capacity: { min: 100, max: 600 },
            price: 500000,
            amenities: ['AC', 'Parking', 'Stage', 'Sound System', 'Lighting', 'Restrooms', 'Kitchen'],
            images: ['https://picsum.photos/seed/palace1/800/600.jpg'],
            mapUrl: 'https://maps.google.com/place/Royal+Palace+Mumbai',
            parking: true,
            isActive: true
          }
        ],
        servicesIncluded: [
          { name: 'Venue', category: 'venue' },
          { name: 'Catering', category: 'catering' },
          { name: 'Decoration', category: 'decoration' },
          { name: 'Photography', category: 'photography' },
          { name: 'DJ & Music', category: 'music' },
          { name: 'Makeup', category: 'other' }
        ],
        highlights: [
          'Heritage palace venue',
          'Traditional Hindu ceremonies',
          'Live band and DJ',
          'Fireworks display',
          'Valet parking'
        ],
        customizationsAvailable: true,
        availableCustomizations: [
          { name: 'Additional Photographer', price: 50000, category: 'photography' },
          { name: 'Extra Lighting Setup', price: 25000, category: 'lighting' },
          { name: 'Additional Dessert Station', price: 30000, category: 'catering' },
          { name: 'Live Painting Artist', price: 40000, category: 'entertainment' }
        ],
        cancellationPolicy: 'Free cancellation up to 30 days before event. 50% refund within 15-30 days. No refund within 15 days.',
        isFeatured: true,
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'Corporate Annual Day',
        type: 'corporate',
        subType: 'annual-day',
        description: 'Professional corporate event with stage, awards ceremony, dinner, and entertainment. Perfect for companies to celebrate achievements and motivate employees.',
        shortDescription: 'Elegant corporate annual celebration with fine dining and entertainment.',
        tags: ['corporate', 'formal', 'annual-day', 'team-building'],
        packages: [
          {
            name: 'basic',
            displayName: 'Basic Package',
            description: 'Essential corporate package for up to 200 guests',
            price: 800000,
            discountedPrice: 750000,
            maxGuests: 200,
            duration: '6 hours',
            isActive: true,
            includedServices: [
              { name: 'Banquet Hall', description: 'AC banquet hall rental', icon: '🏢' },
              { name: 'Stage & Backdrop', description: 'Custom branded stage setup', icon: '🎭' },
              { name: 'Sound System', description: 'Professional PA system', icon: '🔊' },
              { name: 'Projector', description: 'LED/LCD projector for presentations', icon: '📽️' },
              { name: 'Buffet Dinner', description: 'Vegetarian multi-cuisine dinner', icon: '🍛' },
              { name: 'MC Services', description: 'Professional emcee', icon: '🎤' }
            ]
          },
          {
            name: 'premium',
            displayName: 'Premium Package',
            description: 'Enhanced corporate package with better facilities and entertainment',
            price: 1500000,
            discountedPrice: 1400000,
            maxGuests: 400,
            duration: '8 hours',
            isActive: true,
            packageOrder: 2,
            includedServices: [
              { name: 'Premium Banquet', description: 'Luxury hotel ballroom', icon: '🏨' },
              { name: 'Custom Stage Design', description: 'Custom LED backdrop and stage', icon: '💡' },
              { name: 'Live Band', description: 'Solo artist or small band', icon: '🎸' },
              { name: 'Photo Booth', description: 'Branded photo booth for memories', icon: '📸' },
              { name: 'Gourmet Buffet', description: 'Multi-cuisine international buffet', icon: '🍽️' },
              { name: 'Awards Setup', description: 'Trophy podium and ceremony', icon: '🏆' },
              { name: 'Strict Security', description: 'Corporate security personnel', icon: '🔒' }
            ]
          }
        ],
        venues: [
          {
            name: 'Grand Hotel Convention Center',
            address: 'Bandra West, Near Bandstand',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            pincode: '400050',
            capacity: { min: 50, max: 500 },
            price: 300000,
            amenities: ['AC', 'Valet Parking', 'WiFi', 'Stage', 'Sound System', 'LED Screens', 'Restrooms', 'Business Lounge'],
            images: ['https://picsum.photos/seed/hotel1/800/600.jpg'],
            mapUrl: 'https://maps.google.com/place/Grand+Hotel+Mumbai',
            parking: true,
            isActive: true
          }
        ],
        servicesIncluded: [
          { name: 'Venue', category: 'venue' },
          { name: 'Audio-Visual', category: 'other' },
          { name: 'Catering', category: 'catering' },
          { name: 'Decoration', category: 'decoration' },
          { name: 'Entertainment', category: 'entertainment' }
        ],
        highlights: [
          'Professional venue',
          'Corporate branding allowed',
          'High-speed WiFi',
          'Valet parking',
          'Business lounge'
        ],
        cancellationPolicy: '90% refund up to 30 days before event. 50% refund 15-30 days. No refund within 15 days.',
        isFeatured: true,
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'Kids Birthday Wonderland',
        type: 'birthday',
        subType: 'kids',
        description: 'Magical birthday experience for kids with character mascots, magic shows, bounce house, face painting, and fun activities. Parents can relax while kids enjoy their special day.',
        shortDescription: 'Fun-filled kids birthday party with entertainment and activities.',
        tags: ['birthday', 'kids', 'fun', 'family'],
        packages: [
          {
            name: 'basic',
            displayName: 'Fun Package',
            description: 'Basic kids party with decorations and snacks',
            price: 50000,
            discountedPrice: 45000,
            maxGuests: 30,
            duration: '4 hours',
            isActive: true,
            includedServices: [
              { name: 'Hall Decoration', description: 'Theme-based balloon decoration', icon: '🎈' },
              { name: 'Snacks & Cake', description: 'Veg snacks + cake cutting', icon: '🍰' },
              { name: 'Animator', description: '1 interactive animator for 2 hours', icon: '🤡' },
              { name: 'Bounce House', description: 'Inflatable bouncy castle', icon: '🎪' },
              { name: 'Face Painting', description: 'Artist for 2 hours', icon: '🎨' },
              { name: 'Music System', description: 'Kids songs and music', icon: '🔊' }
            ]
          },
          {
            name: 'premium',
            displayName: 'Premium Package',
            description: 'Enhanced package with more activities and character appearances',
            price: 100000,
            discountedPrice: 90000,
            maxGuests: 50,
            duration: '5 hours',
            isActive: true,
            packageOrder: 2,
            includedServices: [
              { name: 'Full Theme Decoration', description: 'Complete themed setup with props', icon: '🎪' },
              { name: 'Magic Show', description: '30-minute magic performance', icon: '🎩' },
              { name: 'Character Mascots', description: '2 popular characters (Spider-Man, Elsa, etc.)', icon: '🦸' },
              { name: 'Multi-cuisine Snacks', description: 'Snacks + ice cream + drinks', icon: '🍿' },
              { name: 'Custom Cake', description: 'Themed birthday cake', icon: '🍰' },
              { name: 'Photo Booth', description: 'Props and instant prints', icon: '📷' },
              { name: 'Bubble Show', description: 'Interactive bubble performance', icon: '🫧' },
              { name: 'Party Bags', description: 'Return gifts for all kids', icon: '🎁' },
              { name: 'Certificates', description: 'Participation certificates', icon: '🏅' }
            ]
          },
          {
            name: 'luxury',
            displayName: 'Deluxe Package',
            description: 'Ultimate kids party experience with everything included',
            price: 200000,
            discountedPrice: 180000,
            maxGuests: 100,
            duration: '6 hours',
            isActive: true,
            packageOrder: 3,
            includedServices: [
              { name: 'Complete Theme Setup', description: 'Elaborate themed environment', icon: '🏰' },
              { name: 'Multiple Characters', description: '4 different characters/performers', icon: '🎭' },
              { name: 'Magic + Puppet Show', description: 'Both shows combined', icon: '🎩' },
              { name: 'Pony Ride', description: 'Pony for kids to ride', icon: '🐴' },
              { name: 'Catered Lunch', description: 'Kids-friendly lunch menu', icon: '🍱' },
              { name: '2 Animators', description: 'Professional activity coordinators', icon: '👨‍👩‍👧' },
              { name: 'Superior Cake', description: '3-tier fancy cake', icon: '🎂' },
              { name: 'Video Coverage', description: 'Professional videography', icon: '🎥' },
              { name: 'Photo Album', description: 'Professionally edited photo album', icon: '📖' },
              { name: 'All Activities', description: 'All activities in premium plus more', icon: '🎪' }
            ]
          }
        ],
        venues: [
          {
            name: 'Kids Fun Zone',
            address: 'Fun Land, Andheri West',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            pincode: '400053',
            capacity: { min: 20, max: 100 },
            price: 30000,
            amenities: ['AC', 'Separate Kids Area', 'Safe Play Equipment', 'First Aid', 'Parking'],
            images: ['https://picsum.photos/seed/kids1/800/600.jpg'],
            mapUrl: 'https://maps.google.com/place/Kids+Fun+Zone+Mumbai',
            parking: true,
            isActive: true
          }
        ],
        servicesIncluded: [
          { name: 'Venue', category: 'venue' },
          { name: 'Decor', category: 'decoration' },
          { name: 'Catering', category: 'catering' },
          { name: 'Photography', category: 'photography' },
          { name: 'Entertainment', category: 'entertainment' }
        ],
        highlights: [
          'Safe child-friendly environment',
          'Professional animators',
          'All inclusive package',
          'No stress for parents',
          'Memorable experience for kids'
        ],
        cancellationPolicy: '80% refund up to 7 days before event. 50% refund 3-7 days. No refund within 3 days.',
        isFeatured: true,
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'Gala Annual Corporate Event',
        type: 'corporate',
        subType: 'annual-day',
        description: 'High-profile corporate gala dinner with luxury venue, star performance, fine dining, and networking opportunities. Includes red carpet, media coverage, and award ceremony.',
        shortDescription: 'Luxurious corporate gala dinner with entertainment and networking.',
        tags: ['corporate', 'luxury', 'gala', 'networking', 'annual-day'],
        packages: [
          {
            name: 'luxury',
            displayName: 'Gala Package',
            description: 'Ultimate corporate gala experience',
            price: 5000000,
            discountedPrice: 4800000,
            maxGuests: 800,
            duration: '8 hours',
            isActive: true,
            packageOrder: 1,
            includedServices: [
              { name: '5-Star Ballroom', description: 'Premium hotel ballroom', icon: '🏨' },
              { name: 'Red Carpet', description: 'Red carpet with photographers', icon: '📸' },
              { name: 'Live Band', description: 'Popular live band for 4 hours', icon: '🎸' },
              { name: 'DJ After-party', description: 'DJ for post-dinner networking', icon: '🎧' },
              { name: 'Gourmet Dinner', description: '7-course sit-down dinner', icon: '🍽️' },
              { name: 'Open Bar', description: 'Premium drinks unlimited', icon: '🍸' },
              { name: 'Stage & Lighting', description: 'Professional stage with LEDs', icon: '💡' },
              { name: 'Award Ceremony', description: 'Trophies and stage setup', icon: '🏆' },
              { name: 'Video Production', description: 'Professional event videography', icon: '🎬' },
              { name: 'Security Team', description: 'High-profile security', icon: '🛡️' }
            ]
          }
        ],
        venues: [
          {
            name: 'Taj Lands End',
            address: 'Babulnath Road, Byculla',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            pincode: '400027',
            capacity: { min: 200, max: 1000 },
            price: 1500000,
            amenities: ['AC', 'Valet', 'WiFi', 'Stage', 'LED Screens', 'Bar', 'Restrooms', 'Business Lounge', 'Parking'],
            images: ['https://picsum.photos/seed/taj1/800/600.jpg'],
            mapUrl: 'https://maps.google.com/place/Taj+Mumbai',
            parking: true,
            isActive: true
          }
        ],
        servicesIncluded: [
          { name: 'Premium Venue', category: 'venue' },
          { name: 'Fine Dining', category: 'catering' },
          { name: 'Entertainment', category: 'entertainment' },
          { name: 'Audio-Visual', category: 'other' }
        ],
        highlights: [
          '5-star luxury venue',
          'Red carpet treatment',
          'Celebrity performances',
          'Premium bar service',
          'Networking lounge'
        ],
        cancellationPolicy: '95% refund up to 45 days before event. 70% refund 15-45 days. No refund within 15 days.',
        isFeatured: true,
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'Traditional South Indian Wedding',
        type: 'wedding',
        subType: 'marriage',
        description: 'Authentic South Indian Hindu wedding ceremony with traditional rituals, silk decor, Carnatic music, and delicious South Indian cuisine. Complete packages for all ceremonies.',
        shortDescription: 'Traditional Tamil/Kerala style wedding with authentic rituals.',
        tags: ['wedding', 'traditional', 'south-indian', 'hindu', 'ritual'],
        packages: [
          {
            name: 'premium',
            displayName: 'Traditional Wedding Package',
            description: 'Complete traditional South Indian wedding with all ceremonies',
            price: 1200000,
            discountedPrice: 1100000,
            maxGuests: 300,
            duration: '3 days',
            isActive: true,
            includedServices: [
              { name: 'Traditional Venue', description: 'Traditional temple-style venue', icon: '🏛️' },
              { name: 'All Ceremonies', description: 'Nalangu, Sangeet, Reception, Marriage', icon: '🙏' },
              { name: 'Traditional Decor', description: 'Kolams, banana trees, mango arches', icon: '🌿' },
              { name: 'Carnatic Music', description: 'Traditional musicians and singers', icon: '🎶' },
              { name: 'Silk Costumes', description: 'Traditional silk attire for couple', icon: '👘' },
              { name: 'Photography', description: 'Documentary style wedding album', icon: '📸' },
              { name: 'South Indian Catering', description: 'Sattvic veg meals on banana leaf', icon: '🍛' },
              { name: 'Priests & Rituals', description: 'Qualified priests for all rituals', icon: '🕉️' },
              { name: 'Pandal Setup', description: 'Traditional wedding mandap/pandal', icon: '🏮' }
            ]
          }
        ],
        venues: [
          {
            name: 'Sri Venkateswara Temple Auditorium',
            address: 'Temple Road, GSB Colony',
            city: 'Chennai',
            state: 'Tamil Nadu',
            country: 'India',
            pincode: '600013',
            capacity: { min: 100, max: 500 },
            price: 400000,
            amenities: ['AC', 'Pooja Room', 'Kitchen', 'Parking', 'Traditional Stage', 'Restrooms'],
            images: ['https://picsum.photos/seed/temple1/800/600.jpg'],
            mapUrl: 'https://maps.google.com/place/Sri+Venkateswara+Temple+Chennai',
            parking: true,
            isActive: true
          }
        ],
        servicesIncluded: [
          { name: 'Venue', category: 'venue' },
          { name: 'Catering', category: 'catering' },
          { name: 'Decoration', category: 'decoration' },
          { name: 'Photography', category: 'photography' },
          { name: 'Music', category: 'music' }
        ],
        highlights: [
          'Authentic traditional ceremony',
          'Experienced priests',
          'Traditional silk decor',
          'Pure vegetarian feast',
          'Cultural programs'
        ],
        cancellationPolicy: '85% refund up to 30 days before event. 50% refund 15-30 days. No refund within 15 days.',
        isFeatured: false,
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'Tech Conference 2024',
        type: 'corporate',
        subType: 'conference',
        description: 'Full-service conference package with venue setup, AV equipment, registration desk, catering, and organizing support for 500+ attendees. Perfect for tech meets and business conferences.',
        shortDescription: 'Professional conference setup with all amenities for 500+ attendees.',
        tags: ['corporate', 'conference', 'tech', 'seminar', 'business'],
        packages: [
          {
            name: 'basic',
            displayName: 'Conference Package',
            description: 'Basic conference setup for 200 attendees',
            price: 600000,
            discountedPrice: 550000,
            maxGuests: 200,
            duration: '2 days',
            isActive: true,
            includedServices: [
              { name: 'Conference Hall', description: 'AC hall for 200 pax', icon: '🏢' },
              { name: 'Stage & Podium', description: 'Theater-style stage setup', icon: '🎭' },
              { name: 'Projector & Screen', description: 'High-lumens projector', icon: '📽️' },
              { name: 'Sound System', description: 'Microphones + speakers', icon: '🔊' },
              { name: 'Registration Desk', description: 'Staffed registration counter', icon: '🖥️' },
              { name: 'Lunch & Snacks', description: 'Buffet lunch + coffee breaks', icon: '🍽️' },
              { name: 'Name Tags', description: 'Printed badges for attendees', icon: '🏷️' },
              { name: 'WiFi', description: 'High-speed internet', icon: '📡' }
            ]
          },
          {
            name: 'premium',
            displayName: 'Premium Conference Package',
            description: 'Premium conference with better facilities and networking events',
            price: 1500000,
            discountedPrice: 1400000,
            maxGuests: 500,
            duration: '3 days',
            isActive: true,
            packageOrder: 2,
            includedServices: [
              { name: 'Premium Convention Center', description: 'Large convention hall', icon: '🏛️' },
              { name: 'Multiple Session Rooms', description: '2-3 parallel tracks', icon: '🎪' },
              { name: 'Large LED Walls', description: 'Multiple LED screens', icon: '📺' },
              { name: 'Recording Studio', description: 'Professional recording setup', icon: '🎙️' },
              { name: 'Simultaneous Translation', description: 'Translation booths', icon: '🌐' },
              { name: 'Networking Dinner', description: 'Gala dinner for 500 guests', icon: '🍷' },
              { name: 'Exhibition Area', description: 'Dedicated exhibition zone', icon: '🏪' },
              { name: 'Charging Stations', description: 'Multiple charging points', icon: '🔋' },
              { name: 'Event App', description: 'Custom event app', icon: '📱' }
            ]
          }
        ],
        venues: [
          {
            name: 'International Convention Centre',
            address: 'Cuffe Parade, South Mumbai',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            pincode: '400005',
            capacity: { min: 100, max: 2000 },
            price: 800000,
            amenities: ['AC', 'Parking', 'WiFi', 'Stage', 'LED Walls', 'Simul Translation', 'Exhibition Area', 'Restaurants'],
            images: ['https://picsum.photos/seed/conf1/800/600.jpg'],
            mapUrl: 'https://maps.google.com/place/ICC+Mumbai',
            parking: true,
            isActive: true
          }
        ],
        servicesIncluded: [
          { name: 'Venue', category: 'venue' },
          { name: 'Audio-Visual', category: 'other' },
          { name: 'Catering', category: 'catering' },
          { name: 'Technology', category: 'other' }
        ],
        highlights: [
          'International standard venue',
          'Multi-track sessions possible',
          'Exhibition space',
          'Networking zones',
          'Professional event support'
        ],
        cancellationPolicy: '80% refund up to 45 days before event. 50% refund 15-45 days. No refund within 15 days.',
        isFeatured: true,
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'Anniversary Dinner overlooking the sea',
        type: 'party',
        subType: 'anniversary',
        description: 'Romantic anniversary dinner at a sea-facing rooftop restaurant with candlelight, live music, gourmet food, and stunning sunset views. Perfect for couples to celebrate their special day.',
        shortDescription: 'Romantic candlelight dinner with sea view and live music.',
        tags: ['anniversary', 'romantic', 'dinner', 'rooftop', 'couple'],
        packages: [
          {
            name: 'luxury',
            displayName: 'Golden Anniversary Package',
            description: 'Premium private dining experience with complete privacy',
            price: 120000,
            discountedPrice: 108000,
            maxGuests: 2,
            duration: '4 hours',
            isActive: true,
            includedServices: [
              { name: 'Private Rooftop', description: 'Exclusive private rooftop setup', icon: '🌅' },
              { name: 'Candlelight Dinner', description: 'Romantic candlelit table', icon: '🕯️' },
              { name: 'Gourmet Menu', description: '5-course gourmet meal', icon: '🍽️' },
              { name: 'Wine Pairing', description: 'Selected wine with each course', icon: '🍷' },
              { name: 'Live Music', description: 'Solo guitarist/singer', icon: '🎸' },
              { name: 'Flowers & Decor', description: 'Rose petals, centerpieces', icon: '🌹' },
              { name: 'Photographer', description: 'Couple photoshoot (30 mins)', icon: '📸' },
              { name: 'Memory Box', description: 'Printed photos in keepsake box', icon: '🎁' }
            ]
          }
        ],
        venues: [
          {
            name: 'Bay View Rooftop Restaurant',
            address: 'Marine Drive, Nariman Point',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            pincode: '400021',
            capacity: { min: 2, max: 50 },
            price: 50000,
            amenities: ['Rooftop', 'Sea View', 'Bar', 'AC Indoor', 'Music'],
            images: ['https://picsum.photos/seed/rooftop1/800/600.jpg'],
            mapUrl: 'https://maps.google.com/place/Bay+View+Rooftop+Mumbai',
            parking: false,
            isActive: true
          }
        ],
        servicesIncluded: [
          { name: 'Venue', category: 'venue' },
          { name: 'Catering', category: 'catering' },
          { name: 'Music', category: 'music' },
          { name: 'Decoration', category: 'decoration' },
          { name: 'Photography', category: 'photography' }
        ],
        highlights: [
          'Private and romantic',
          'Spectacular sunset views',
          'Professional photography',
          'Exclusive dining experience',
          'Memorable keepsake'
        ],
        cancellationPolicy: '80% refund up to 7 days before event. No refund within 7 days.',
        isFeatured: false,
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'Birthday Bash at Pubs',
        type: 'birthday',
        subType: 'adult',
        description: 'Exciting pub party for adults with reserved area, DJ, drinks package, and VIP treatment. Perfect for celebrating adult birthdays with friends in a lively atmosphere.',
        shortDescription: 'High-energy pub party with DJ and drinks package.',
        tags: ['birthday', 'pub', 'party', 'adult', 'DJ'],
        packages: [
          {
            name: 'basic',
            displayName: 'Pub Party Package',
            description: 'Basic pub area booking with bar service',
            price: 80000,
            discountedPrice: 70000,
            maxGuests: 30,
            duration: '5 hours',
            isActive: true,
            includedServices: [
              { name: 'Reserved Section', description: 'Private area for group', icon: '🎯' },
              { name: 'Bar Coupons', description: 'Drink coupons for all guests', icon: '🍹' },
              { name: 'DJ Service', description: 'DJ for 3 hours', icon: '🎧' },
              { name: 'Cake', description: 'Birthday cake', icon: '🎂' },
              { name: 'Snacks', description: 'Bar snacks platter', icon: '🥘' },
              { name: 'Decor', description: 'Balloon decoration', icon: '🎈' }
            ]
          },
          {
            name: 'premium',
            displayName: 'VIP Pub Party Package',
            description: 'VIP booth with premium drinks and bottle service',
            price: 200000,
            discountedPrice: 180000,
            maxGuests: 50,
            duration: '6 hours',
            isActive: true,
            packageOrder: 2,
            includedServices: [
              { name: 'VIP Private Booth', description: 'Exclusive VIP area', icon: '💎' },
              { name: 'Premium Bar', description: 'Unlimited premium drinks', icon: '🥃' },
              { name: 'Bottle Service', description: 'Premium liquor bottles', icon: '🍾' },
              { name: 'Celebrity DJ', description: 'Popular local DJ', icon: '🎵' },
              { name: 'Catered Food', description: 'Food from partner restaurant', icon: '🍕' },
              { name: 'Custom Cake', description: 'Designer birthday cake', icon: '🎂' },
              { name: 'Photo Booth', description: 'Instant photo prints', icon: '📷' },
              { name: 'Host/Entertainer', description: 'Professional host/entertainer', icon: '🎭' }
            ]
          }
        ],
        venues: [
          {
            name: 'Hype Nightclub',
            address: 'JW Marriott, Juhu',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            pincode: '400049',
            capacity: { min: 20, max: 100 },
            price: 100000,
            amenities: ['VIP Booths', 'Bar', 'Dance Floor', 'Premium Sound', 'Smoking Area', 'Valet'],
            images: ['https://picsum.photos/seed/pub1/800/600.jpg'],
            mapUrl: 'https://maps.google.com/place/Hype+Nightclub+Mumbai',
            parking: true,
            isActive: true
          }
        ],
        servicesIncluded: [
          { name: 'Venue', category: 'venue' },
          { name: 'Bar', category: 'other' },
          { name: 'Music', category: 'music' },
          { name: 'Decoration', category: 'decoration' }
        ],
        highlights: [
          'VIP treatment',
          'Unlimited drinks',
          'Professional DJ',
          'Energetic atmosphere',
          'Safe and secure'
        ],
        cancellationPolicy: '70% refund up to 3 days before event. No refund within 3 days.',
        isFeatured: false,
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'Ganesh Chaturthi Community Celebration',
        type: 'religious',
        subType: 'ganesh-chaturthi',
        description: 'Traditional Ganesh festival celebration with idol installation, aarti, modak distribution, cultural programs, and community feast. Suitable for residential societies and community halls.',
        shortDescription: 'Traditional Ganesh Chaturthi celebration with all rituals.',
        tags: ['religious', 'ganesh-chaturthi', 'festival', 'community', 'traditional'],
        packages: [
          {
            name: 'basic',
            displayName: 'Community Celebration Package',
            description: 'Basic celebration for community gathering',
            price: 50000,
            discountedPrice: 45000,
            maxGuests: 100,
            duration: '3 hours',
            isActive: true,
            includedServices: [
              { name: 'Community Hall', description: 'Hall for puja and gathering', icon: '🏛️' },
              { name: 'Ganesh Idol', description: 'Eco-friendly idol (2-3 ft)', icon: '🙏' },
              { name: 'Basic Puja Samagri', description: 'All puja items', icon: '🪔' },
              { name: 'Pandit Ji', description: 'Priest for puja', icon: '👨‍🦳' },
              { name: 'Aarti & Bhajans', description: 'Devotional singing', icon: '🎶' },
              { name: 'Modak & Prasad', description: 'Traditional sweets', icon: '🍬' }
            ]
          },
          {
            name: 'premium',
            displayName: 'Grand Celebration Package',
            description: 'Grand celebration with larger idol and cultural programs',
            price: 150000,
            discountedPrice: 135000,
            maxGuests: 300,
            duration: '6 hours',
            isActive: true,
            packageOrder: 2,
            includedServices: [
              { name: 'Big Community Hall', description: 'Large venue for 300+ people', icon: '🏢' },
              { name: 'Large Ganesh Idol', description: 'Premium 5-ft idol (clay)', icon: '🙏' },
              { name: 'Complete Puja Kit', description: 'All religious items included', icon: '🪔' },
              { name: 'Senior Priest', description: 'Experienced priest with helpers', icon: '👨‍🦳' },
              { name: 'Cultural Program', description: 'Traditional dance/music show', icon: '🎭' },
              { name: 'Live Dholak', description: 'Traditional drummers', icon: '🪘' },
              { name: 'Community Feast', description: 'Maharashtrian thali for all', icon: '🍽️' },
              { name: 'Sound System', description: 'PA system for aarti', icon: '🔊' },
              { name: 'Lighting', description: 'Traditional lighting design', icon: '💡' },
              { name: 'Eco-friendly materials', description: 'Biodegradable decorations', icon: '🌱' }
            ]
          }
        ],
        venues: [
          {
            name: 'Community Hall - Shivaji Park',
            address: 'Shivaji Park, Dadar West',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            pincode: '400028',
            capacity: { min: 50, max: 500 },
            price: 25000,
            amenities: ['Hall', 'Puja Room', 'Kitchen', 'Water', 'Parking', 'Stage'],
            images: ['https://picsum.photos/seed/ganesh1/800/600.jpg'],
            mapUrl: 'https://maps.google.com/place/Shivaji+Park+Mumbai',
            parking: true,
            isActive: true
          }
        ],
        servicesIncluded: [
          { name: 'Venue', category: 'venue' },
          { name: 'Religious Services', category: 'other' },
          { name: 'Catering', category: 'catering' },
          { name: 'Decoration', category: 'decoration' },
          { name: 'Entertainment', category: 'entertainment' }
        ],
        highlights: [
          'Traditional and authentic',
          'Eco-friendly celebration',
          'Community gathering',
          'Cultural programs',
          'Delicious prasad'
        ],
        cancellationPolicy: '90% refund up to 15 days before event. No refund within 15 days.',
        isFeatured: false,
        isActive: true,
        createdBy: admin._id
      },
      {
        name: 'New Year Eve Bash',
        type: 'party',
        subType: 'anniversary',
        description: 'Epic New Year\'s Eve celebration with live DJ, fireworks, gourmet food, unlimited drinks, and midnight countdown. Perfect way to ring in the new year with friends and family.',
        shortDescription: 'Grand NYE celebration with DJ, fireworks, and fine dining.',
        tags: ['new-year', 'party', 'eve', 'countdown', 'fireworks'],
        packages: [
          {
            name: 'premium',
            displayName: 'NYE Premium Package',
            description: 'Premium New Year Eve celebration with all amenities',
            price: 150000,
            discountedPrice: 135000,
            maxGuests: 4,
            duration: '8 hours',
            isActive: true,
            includedServices: [
              { name: 'Luxury Venue', description: 'Premium hotel venue', icon: '🏨' },
              { name: 'Live DJ', description: 'Famous DJ for 6 hours', icon: '🎧' },
              { name: 'Gourmet Buffet', description: 'Multi-cuisine dinner with bar', icon: '🍽️' },
              { name: 'Unlimited Drinks', description: 'Premium drinks package', icon: '🍸' },
              { name: 'Midnight Countdown', description: 'Champagne toast at midnight', icon: '🥂' },
              { name: 'Fireworks Display', description: 'Professional fireworks', icon: '🎆' },
              { name: 'Photo Booth', description: 'NYE themed photo booth', icon: '📷' },
              { name: 'Live Band', description: 'Popular local band', icon: '🎸' }
            ]
          }
        ],
        venues: [
          {
            name: 'Taj Lands End Ballroom',
            address: 'Babulnath Road, Byculla',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            pincode: '400027',
            capacity: { min: 100, max: 1000 },
            price: 2000000,
            amenities: ['AC', 'Ballroom', 'Bar', 'Stage', 'LED Walls', 'Parking', 'Restrooms'],
            images: ['https://picsum.photos/seed/nye1/800/600.jpg'],
            mapUrl: 'https://maps.google.com/place/Taj+Mumbai',
            parking: true,
            isActive: true
          }
        ],
        servicesIncluded: [
          { name: 'Venue', category: 'venue' },
          { name: 'Entertainment', category: 'entertainment' },
          { name: 'Catering', category: 'catering' },
          { name: 'Bar', category: 'other' }
        ],
        highlights: [
          'Epic NYE celebration',
          'Fireworks at midnight',
          'Professional DJ',
          'Gourmet dining',
          'Unforgettable experience'
        ],
        cancellationPolicy: 'Non-refundable due to high demand.',
        isFeatured: true,
        isActive: true,
        createdBy: admin._id
      }
    ];

    for (const eventData of eventsData) {
      await Event.create(eventData);
    }

    console.log(`✅ Created ${eventsData.length} sample events`);

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   👤 Admin Email: admin@eventify.com');
    console.log('   🔐 Admin Password: Admin@123');
    console.log('   👥 Employees: 5 accounts (password: Employee@123)');
    console.log('   🎉 Events: ', eventsData.length, 'different packages');
    console.log('\n🌐 Features to test:');
    console.log('   - Admin dashboard with stats');
    console.log('   - Employee task management');
    console.log('   - Customer event browsing');
    console.log('   - Payment integration (sandbox)');
    console.log('   - Real-time notifications (Socket.IO)');
    console.log('   - File uploads (Cloudinary)');
    console.log('   - Email notifications');
    console.log('   - Advanced filtering & search');
    console.log('\n🚀 Application ready to run!');
    console.log('   Backend: npm run dev');
    console.log('   Frontend: npm run dev\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();

module.exports = { seedDatabase };
