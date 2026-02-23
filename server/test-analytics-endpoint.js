/**
 * Test script for analytics endpoint
 * Run with: node test-analytics-endpoint.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Organization = require('./src/models/Organization');
const User = require('./src/models/User');
const Course = require('./src/models/Course');
const Enrollment = require('./src/models/Enrollment');

// Import service
const AnalyticsService = require('./src/services/analyticsService');

async function testAnalyticsEndpoint() {
  try {
    console.log('🧪 Testing Analytics Endpoint...\n');
    
    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Test the analytics service
    console.log('📊 Calling AnalyticsService.getOverviewStats()...\n');
    const stats = await AnalyticsService.getOverviewStats();
    
    console.log('\n✅ Analytics Stats Retrieved Successfully:');
    console.log(JSON.stringify(stats, null, 2));
    
    // Verify structure
    console.log('\n🔍 Verifying response structure...');
    const requiredFields = [
      'organizations',
      'users',
      'courses',
      'enrollments'
    ];
    
    let structureValid = true;
    for (const field of requiredFields) {
      if (!stats[field]) {
        console.error(`❌ Missing field: ${field}`);
        structureValid = false;
      } else {
        console.log(`✅ Field present: ${field}`);
      }
    }
    
    if (structureValid) {
      console.log('\n✅ Response structure is valid!');
    } else {
      console.log('\n❌ Response structure is invalid!');
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testAnalyticsEndpoint();
