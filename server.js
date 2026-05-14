// ========================================
// InfoLubuklinggau CMS - Node.js Server
// Tanpa dependency external (built-in modules only)
// ========================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

// ========================================
// Configuration
// ========================================
const CONFIG = loadConfig();

function loadConfig() {
    const envPath = path.join(__dirname, '.env');
    const config = {
        PORT: 3000,
        JWT_SECRET: 'default_secret_key_ganti_ini_segera_2026',
        JWT_EXPIRES_IN: '24h',
        ADMIN_USERNAME: 'admin',
        ADMIN_PASSWORD: 'Admin@2026!'
    };

    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=').trim();
                if (key && value) {
                    config[key.trim()] = value;
                }
            }
        });
    }
    return config;
}

// ========================================
// Data Directory Setup
// ========================================
const DATA_DIR = path.join(__dirname, 'data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ========================================
// Password Hashing (using Node.js crypto)
// ========================================
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === testHash;
}

// ========================================
// JWT Implementation (built-in crypto)
// ========================================
function base64UrlEncode(data) {
    return Buffer.from(JSON.stringify(data))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = 4 - (str.length % 4);
    if (padding !== 4) str += '='.repeat(padding);
    return JSON.parse(Buffer.from(str, 'base64').toString());
}

function createToken(payload) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = parseInt(CONFIG.JWT_EXPIRES_IN) * 3600 || 86400; // default 24h
    
    payload.iat = now;
    payload.exp = now + expiresIn;

    const headerEncoded = base64UrlEncode(header);
    const payloadEncoded = base64UrlEncode(payload);
    const signature = crypto
        .createHmac('sha256', CONFIG.JWT_SECRET)
        .update(`${headerEncoded}.${payloadEncoded}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

function verifyToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [headerEncoded, payloadEncoded, signature] = parts;
        
        // Verify signature
        const expectedSig = crypto
            .createHmac('sha256', CONFIG.JWT_SECRET)
            .update(`${headerEncoded}.${payloadEncoded}`)
            .digest('base64')
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');

        if (signature !== expectedSig) return null;

        // Decode payload
        const payload = base64UrlDecode(payloadEncoded);
        
        // Check expiration
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return payload;
    } catch (e) {
        return null;
    }
}

// ========================================
// Users Management
// ========================================
function initUsers() {
    if (!fs.existsSync(USERS_FILE)) {
        const defaultUsers = [
            {
                id: '1',
                username: CONFIG.ADMIN_USERNAME,
                password: hashPassword(CONFIG.ADMIN_PASSWORD),
                name: 'Administrator',
                role: 'admin',
                createdAt: new Date().toISOString()
            }
        ];
        fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
        console.log(`[USERS] Default admin created: ${CONFIG.ADMIN_USERNAME}`);
    }
}

function getUsers() {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ========================================
// Articles Management
// ========================================
function getArticles() {
    if (!fs.existsSync(ARTICLES_FILE)) {
        fs.writeFileSync(ARTICLES_FILE, '[]');
        return [];
    }
    return JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf-8'));
}

function saveArticles(articles) {
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2));
}

// ========================================
// HTTP Helper Functions
// ========================================
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

function getTokenFromRequest(req) {
    const auth = req.headers['authorization'];
    if (auth && auth.startsWith('Bearer ')) {
        return auth.slice(7);
    }
    return null;
}

function requireAuth(req) {
    const token = getTokenFromRequest(req);
    if (!token) return null;
    return verifyToken(token);
}

// ========================================
// Static File Server
// ========================================
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

function serveStatic(req, res) {
    let filePath = path.join(__dirname, req.url === '/' ? '/index.html' : req.url.split('?')[0]);
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
        sendJSON(res, 403, { error: 'Forbidden' });
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Halaman Tidak Ditemukan</h1>');
            } else {
                res.writeHead(500);
                res.end('Internal Server Error');
            }
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// ========================================
// API Routes
// ========================================
async function handleAPI(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end();
        return;
    }

    try {
        // ====== AUTH ROUTES ======
        if (pathname === '/api/auth/login' && method === 'POST') {
            const { username, password } = await parseBody(req);
            
            if (!username || !password) {
                return sendJSON(res, 400, { error: 'Username dan password wajib diisi' });
            }

            const users = getUsers();
            const user = users.find(u => u.username === username);

            if (!user || !verifyPassword(password, user.password)) {
                return sendJSON(res, 401, { error: 'Username atau password salah' });
            }

            const token = createToken({
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            });

            return sendJSON(res, 200, {
                message: 'Login berhasil',
                token,
                user: { id: user.id, username: user.username, name: user.name, role: user.role }
            });
        }

        if (pathname === '/api/auth/verify' && method === 'GET') {
            const payload = requireAuth(req);
            if (!payload) {
                return sendJSON(res, 401, { error: 'Token tidak valid atau expired' });
            }
            return sendJSON(res, 200, { valid: true, user: payload });
        }

        if (pathname === '/api/auth/change-password' && method === 'POST') {
            const payload = requireAuth(req);
            if (!payload) return sendJSON(res, 401, { error: 'Unauthorized' });

            const { currentPassword, newPassword } = await parseBody(req);
            if (!currentPassword || !newPassword) {
                return sendJSON(res, 400, { error: 'Password lama dan baru wajib diisi' });
            }
            if (newPassword.length < 6) {
                return sendJSON(res, 400, { error: 'Password baru minimal 6 karakter' });
            }

            const users = getUsers();
            const userIdx = users.findIndex(u => u.id === payload.id);
            if (userIdx === -1) return sendJSON(res, 404, { error: 'User tidak ditemukan' });

            if (!verifyPassword(currentPassword, users[userIdx].password)) {
                return sendJSON(res, 401, { error: 'Password lama salah' });
            }

            users[userIdx].password = hashPassword(newPassword);
            saveUsers(users);
            return sendJSON(res, 200, { message: 'Password berhasil diubah' });
        }

        // ====== ARTICLES ROUTES ======
        // GET /api/articles - Public (untuk frontend)
        if (pathname === '/api/articles' && method === 'GET') {
            const articles = getArticles();
            const status = parsedUrl.query.status;
            const category = parsedUrl.query.category;
            
            let filtered = articles;
            if (status) filtered = filtered.filter(a => a.status === status);
            if (category) filtered = filtered.filter(a => a.category === category);
            
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return sendJSON(res, 200, filtered);
        }

        // GET /api/articles/:id - Public
        if (pathname.match(/^\/api\/articles\/[\w-]+$/) && method === 'GET') {
            const id = pathname.split('/').pop();
            const articles = getArticles();
            const article = articles.find(a => a.id === id);
            
            if (!article) return sendJSON(res, 404, { error: 'Artikel tidak ditemukan' });
            
            // Increment views
            article.views = (article.views || 0) + 1;
            saveArticles(articles);
            
            return sendJSON(res, 200, article);
        }

        // POST /api/articles - Protected
        if (pathname === '/api/articles' && method === 'POST') {
            const payload = requireAuth(req);
            if (!payload) return sendJSON(res, 401, { error: 'Unauthorized' });

            const body = await parseBody(req);
            if (!body.title) return sendJSON(res, 400, { error: 'Judul wajib diisi' });

            const articles = getArticles();
            const article = {
                id: crypto.randomBytes(8).toString('hex'),
                title: body.title,
                excerpt: body.excerpt || '',
                content: body.content || '',
                image: body.image || '',
                category: body.category || '',
                author: body.author || payload.name,
                tags: body.tags || [],
                status: body.status || 'draft',
                slug: body.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
                views: 0,
                createdBy: payload.username,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            articles.push(article);
            saveArticles(articles);
            return sendJSON(res, 201, { message: 'Artikel berhasil dibuat', article });
        }

        // PUT /api/articles/:id - Protected
        if (pathname.match(/^\/api\/articles\/[\w-]+$/) && method === 'PUT') {
            const payload = requireAuth(req);
            if (!payload) return sendJSON(res, 401, { error: 'Unauthorized' });

            const id = pathname.split('/').pop();
            const body = await parseBody(req);
            const articles = getArticles();
            const idx = articles.findIndex(a => a.id === id);

            if (idx === -1) return sendJSON(res, 404, { error: 'Artikel tidak ditemukan' });

            articles[idx] = {
                ...articles[idx],
                title: body.title || articles[idx].title,
                excerpt: body.excerpt !== undefined ? body.excerpt : articles[idx].excerpt,
                content: body.content !== undefined ? body.content : articles[idx].content,
                image: body.image !== undefined ? body.image : articles[idx].image,
                category: body.category !== undefined ? body.category : articles[idx].category,
                author: body.author !== undefined ? body.author : articles[idx].author,
                tags: body.tags !== undefined ? body.tags : articles[idx].tags,
                status: body.status || articles[idx].status,
                slug: (body.title || articles[idx].title).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
                updatedAt: new Date().toISOString()
            };

            saveArticles(articles);
            return sendJSON(res, 200, { message: 'Artikel berhasil diperbarui', article: articles[idx] });
        }

        // DELETE /api/articles/:id - Protected
        if (pathname.match(/^\/api\/articles\/[\w-]+$/) && method === 'DELETE') {
            const payload = requireAuth(req);
            if (!payload) return sendJSON(res, 401, { error: 'Unauthorized' });

            const id = pathname.split('/').pop();
            let articles = getArticles();
            const idx = articles.findIndex(a => a.id === id);

            if (idx === -1) return sendJSON(res, 404, { error: 'Artikel tidak ditemukan' });

            articles.splice(idx, 1);
            saveArticles(articles);
            return sendJSON(res, 200, { message: 'Artikel berhasil dihapus' });
        }

        // DELETE /api/articles (bulk) - Protected
        if (pathname === '/api/articles/bulk-delete' && method === 'POST') {
            const payload = requireAuth(req);
            if (!payload) return sendJSON(res, 401, { error: 'Unauthorized' });

            const { ids } = await parseBody(req);
            if (!ids || !Array.isArray(ids)) {
                return sendJSON(res, 400, { error: 'IDs wajib berupa array' });
            }

            let articles = getArticles();
            articles = articles.filter(a => !ids.includes(a.id));
            saveArticles(articles);
            return sendJSON(res, 200, { message: `${ids.length} artikel berhasil dihapus` });
        }

        // ====== STATS ROUTE ======
        if (pathname === '/api/stats' && method === 'GET') {
            const payload = requireAuth(req);
            if (!payload) return sendJSON(res, 401, { error: 'Unauthorized' });

            const articles = getArticles();
            return sendJSON(res, 200, {
                total: articles.length,
                published: articles.filter(a => a.status === 'published').length,
                draft: articles.filter(a => a.status === 'draft').length,
                categories: [...new Set(articles.map(a => a.category).filter(Boolean))].length
            });
        }

        // Route not found
        sendJSON(res, 404, { error: 'API endpoint tidak ditemukan' });

    } catch (err) {
        console.error('[ERROR]', err.message);
        sendJSON(res, 500, { error: 'Internal server error' });
    }
}

// ========================================
// Main Server
// ========================================
const server = http.createServer(async (req, res) => {
    // API routes
    if (req.url.startsWith('/api/')) {
        return handleAPI(req, res);
    }
    // Static files
    serveStatic(req, res);
});

// Initialize
initUsers();

server.listen(CONFIG.PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════╗');
    console.log('  ║   InfoLubuklinggau CMS Server        ║');
    console.log('  ╠══════════════════════════════════════╣');
    console.log(`  ║   URL: http://localhost:${CONFIG.PORT}         ║`);
    console.log(`  ║   Admin: http://localhost:${CONFIG.PORT}/admin.html ║`);
    console.log('  ║   Status: Running                    ║');
    console.log('  ╚══════════════════════════════════════╝');
    console.log('');
    console.log(`  [INFO] Default login: ${CONFIG.ADMIN_USERNAME} / (lihat .env)`);
    console.log('');
});
