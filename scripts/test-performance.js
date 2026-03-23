const axios = require('axios');

async function testPerformance() {
  const token = process.env.TOKEN;
  if (!token) {
    console.error('Please set TOKEN env var');
    process.exit(1);
  }

  const API_BASE = 'http://localhost:5000/api/college/admin';
  
  console.log('🚀 Testing /students performance...');
  const start = Date.now();
  try {
    const res = await axios.get(`${API_BASE}/students?limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const end = Date.now();
    console.log(`✅ /students took ${end - start}ms`);
    console.log(`📊 Students returned: ${res.data.data.students.length}`);
    console.log(`📄 Pagination:`, res.data.data.pagination);
  } catch (err) {
    console.error('❌ Error testing /students:', err.response?.data || err.message);
  }

  console.log('\n🚀 Testing /batches performance...');
  const startBatches = Date.now();
  try {
    const res = await axios.get(`${API_BASE}/batches`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const endBatches = Date.now();
    console.log(`✅ /batches took ${endBatches - startBatches}ms`);
    console.log(`📊 Batches returned: ${res.data.data.batches.length}`);
  } catch (err) {
    console.error('❌ Error testing /batches:', err.response?.data || err.message);
  }
}

testPerformance();
