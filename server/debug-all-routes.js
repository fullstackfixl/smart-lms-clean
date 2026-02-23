const files = [
    './src/routes/auth',
    './src/routes/health',
    './src/routes/public',
    './src/routes/organizations',
    './src/api/routes/index',
    './src/routes/platform'
];

files.forEach(f => {
    try {
        console.log(`Checking ${f}...`);
        const r = require(f);
        console.log(`✅ Loaded ${f}`);
    } catch (e) {
        console.error(`❌ Error in ${f}:`);
        console.error(e.message);
        console.error(e.stack);
    }
});
