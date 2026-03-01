const fs = require('fs');
const path = require('path');

const clientRoot = 'c:\\Users\\Lenovo\\projectlms\\client';
const searchDirs = ['app', 'components', 'lib', 'hooks', 'types', 'context', 'services'];

function getFiles(dir, files_) {
    files_ = files_ || [];
    if (!fs.existsSync(dir)) return files_;
    const files = fs.readdirSync(dir);
    for (const i in files) {
        const name = path.join(dir, files[i]);
        if (fs.statSync(name).isDirectory()) {
            if (!files[i].startsWith('.') && files[i] !== 'node_modules') {
                getFiles(name, files_);
            }
        } else {
            if (name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.js') || name.endsWith('.jsx')) {
                files_.push(name);
            }
        }
    }
    return files_;
}

let allFiles = [];
searchDirs.forEach(d => {
    allFiles = allFiles.concat(getFiles(path.join(clientRoot, d)));
});

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('@/')) {
        const relativePathToFile = path.relative(clientRoot, file);
        const parts = relativePathToFile.split(path.sep);
        const depth = parts.length - 1;

        // Prefix to get to clientRoot from the file
        let prefix = '../'.repeat(depth);
        if (depth === 0) prefix = './';

        console.log(`Processing ${relativePathToFile} (depth ${depth})...`);

        const newContent = content.replace(/['"]@\/([^'"]+)['"]/g, (match, p1) => {
            // For depth 0 or 1, we might need to adjust prefix if it's already in a subdirectory
            // But path.relative and depth should handle it.
            return `'${prefix}${p1}'`;
        });

        if (newContent !== content) {
            fs.writeFileSync(file, newContent);
            console.log(`  Updated ${relativePathToFile}`);
        }
    }
});

console.log('Global conversion complete!');
