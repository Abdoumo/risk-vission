const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Replace 'http://localhost:5000/...' with `${import.meta.env.VITE_API_URL}/...`
            if (content.includes("'http://localhost:5000")) {
                content = content.replace(/'http:\/\/localhost:5000([^']*)'/g, '`${import.meta.env.VITE_API_URL}$1`');
                modified = true;
            }
            if (content.includes('"http://localhost:5000')) {
                content = content.replace(/"http:\/\/localhost:5000([^"]*)"/g, '`${import.meta.env.VITE_API_URL}$1`');
                modified = true;
            }
            if (content.includes('`http://localhost:5000')) {
                content = content.replace(/`http:\/\/localhost:5000([^`]*)`/g, '`${import.meta.env.VITE_API_URL}$1`');
                modified = true;
            }

            // Replace 'http://localhost:8000/...' with `${import.meta.env.VITE_AI_API_URL}/...`
            if (content.includes("'http://localhost:8000")) {
                content = content.replace(/'http:\/\/localhost:8000([^']*)'/g, '`${import.meta.env.VITE_AI_API_URL}$1`');
                modified = true;
            }
            if (content.includes('"http://localhost:8000')) {
                content = content.replace(/"http:\/\/localhost:8000([^"]*)"/g, '`${import.meta.env.VITE_AI_API_URL}$1`');
                modified = true;
            }
            if (content.includes('`http://localhost:8000')) {
                content = content.replace(/`http:\/\/localhost:8000([^`]*)`/g, '`${import.meta.env.VITE_AI_API_URL}$1`');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, 'ALGORISKAI', 'src'));
console.log('Frontend updates complete.');
