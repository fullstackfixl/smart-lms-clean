const app = require('./src/app');
const listEndpoints = (router, path = '') => {
    const endpoints = [];
    router.stack.forEach((layer) => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
            endpoints.push(`${methods.join(',')} ${path}${layer.route.path}`);
        } else if (layer.name === 'router' && layer.handle.stack) {
            let nextPath = path;
            if (layer.regexp) {
                // This is a simplification
                const match = layer.regexp.toString().match(/^\/\^\\\/(.*?)\\\//);
                if (match) nextPath += '/' + match[1];
            }
            endpoints.push(...listEndpoints(layer.handle, nextPath));
        }
    });
    return endpoints;
};

console.log('--- REGISTERED ENDPOINTS ---');
const endpoints = listEndpoints(app._router);
endpoints.filter(e => e.includes('admin') || e.includes('org')).forEach(e => console.log(e));
