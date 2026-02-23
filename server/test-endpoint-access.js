/**
 * Test script to verify the analytics endpoint is accessible
 * Run with: node test-endpoint-access.js
 */

require('dotenv').config();
const http = require('http');

// Test configuration
const API_BASE = process.env.API_URL || 'http://localhost:5000';
const TEST_TOKEN = process.env.TEST_PLATFORM_ADMIN_TOKEN || '';

console.log('🧪 Testing Analytics Endpoint Access...\n');
console.log('API Base:', API_BASE);
console.log('Token:', TEST_TOKEN ? TEST_TOKEN.substring(0, 20) + '...' : 'NOT PROVIDED');
console.log('\n');

// Parse URL
const url = new URL('/platform/dashboard/stats', API_BASE);

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    ...(TEST_TOKEN ? { 'Authorization': `Bearer ${TEST_TOKEN}` } : {})
  }
};

console.log('📡 Making request to:', `${url.protocol}//${url.hostname}:${options.port}${url.pathname}`);
console.log('📡 Headers:', JSON.stringify(options.headers, null, 2));
console.log('\n');

const protocol = url.protocol === 'https:' ? require('https') : http;

const req = protocol.request(options, (res) => {
  console.log('📥 Response Status:', res.statusCode);
  console.log('📥 Response Headers:', JSON.stringify(res.headers, null, 2));
  console.log('\n');

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📥 Response Body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (res.statusCode === 200 && parsed.success) {
        console.log('\n✅ Endpoint is accessible and working!');
      } else {
        console.log('\n❌ Endpoint returned an error');
      }
    } catch (error) {
      console.log(data);
      console.log('\n❌ Failed to parse response as JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.end();
