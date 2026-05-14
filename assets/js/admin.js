// ========================================
// InfoLubuklinggau - Admin Panel JavaScript
// Backend API Version (Node.js)
// ========================================

const API_BASE = '/api';

// ========================================
// Authentication System (JWT + API)
// ========================================
function getToken() {
    return localStorage.getItem('ilg_token');
}

function setToken(token) {
    localStorage.setItem('ilg_token', token);
}

function removeToken() {
    localStorage.removeItem('ilg_token');
    localStorage.removeItem('ilg_user');
}

function getUser() {
    const user = localStorage.getItem('ilg_user');
    return user ? JSON.parse(user) : null;
}

function setUser(user) {
    localStorage.setItem('ilg_user', JSON.stringify(user));
}

async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    if (response.status === 401) {
        removeToken();
        checkAuth();
        throw new Error('Session expired');
    }

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

async function checkAuth() {
    const loginOverlay = document.getElementById('login-overlay');
    const token = getToken();

    if (!token) {
        loginOverlay.classList.remove('hidden');
        return false;
    }

    try {
        const data = await apiRequest('/auth/verify');
        if (data.valid) {
            loginOverlay.classList.add('hidden');
            document.getElementById('admin-name').textContent = data.user.name || data.user.username;
            return true;
        }
    } catch (e) {
        // Token invalid
    }

    removeToken();
    loginOverlay.classList.remove('hidden');
    return false;
}

function initAuth() {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('btn-logout');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        loginError.textContent = '';

        try {
            const data = await apiRequest('/auth/login', 'POST', { username, password });
            setToken(data.token);
            setUser(data.user);
            document.getElementById('login-overlay').classList.add('hidden');
            document.getElementById('admin-name').textContent = data.user.name;
            refreshDashboard();
            showToast('Login berhasil!', 'success');
        } catch (err) {
            loginError.textContent = err.message || 'Username atau password salah!';
            document.getElementById('login-password').value = '';
            document.getElementById('login-password').focus();
        }
    });

    logoutBtn.addEventListener('click', function() {
        if (confirm('Yakin ingin keluar dari panel admin?')) {
            removeToken();
            window.location.reload();
        }
    });

    checkAuth();
}

// ========================================
// Categories list
// ========================================
const DEFAULT_CATEGORIES = [
    'Pemerintahan', 'Kriminal', 'Pendidikan', 'Kesehatan',
    'Olahraga', 'Ekonomi', 'Teknologi', 'Gaya Hidup', 'Politik', 'Opini'
];

// ========================================
// Helper Functions
// ========================================
function formatDateShort(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
}

// ========================================
// Toast Notifications
// ========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-circle'
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    });

    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ========================================
// Modal
// ========================================
let modalCallback = null;

function showModal(message, callback) {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-message').textContent = message;
    overlay.classList.add('active');
    modalCallback = callback;
}

function hideModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    modalCallback = null;
}

// ========================================
// Navigation
// ========================================
function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeNav) activeNav.classList.add('active');

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) targetPage.classList.add('active');

    if (page === 'dashboard') refreshDashboard();
    if (page === 'articles') refreshArticlesList();
    if (page === 'categories') refreshCategories();
    if (page === 'add-article') resetForm();
}

// ========================================
// Dashboard
// ========================================
async function refreshDashboard() {
    try {
        const stats = await apiRequest('/stats');
        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-published').textContent = stats.published;
        document.getElementById('stat-draft').textContent = stats.draft;
        document.getElementById('stat-categories').textContent = stats.categories;

        // Recent articles
        const articles = await apiRequest('/articles');
        const recent = articles.slice(0, 5);
        const tbody = document.getElementById('recent-articles');

        if (recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Belum ada artikel. <a href="#" data-page="add-article" style="color:#4f46e5;">Buat artikel pertama</a></td></tr>';
        } else {
            tbody.innerHTML = recent.map(article => `
                <tr>
                    <td><strong>${truncate(article.title, 50)}</strong></td>
                    <td>${article.category || '-'}</td>
                    <td>${formatDateShort(article.createdAt)}</td>
                    <td><span class="status-badge ${article.status}">${article.status === 'published' ? 'Dipublikasi' : 'Draft'}</span></td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.error('Dashboard error:', err);
    }
}

// ========================================
// Articles List
// ========================================
let allArticles = [];

async function refreshArticlesList() {
    try {
        allArticles = await apiRequest('/articles');
        renderArticlesList();
    } catch (err) {
        console.error('Articles list error:', err);
    }
}

function renderArticlesList() {
    const filterCategory = document.getElementById('filter-category').value;
    const filterStatus = document.getElementById('filter-status').value;
    const searchTerm = document.getElementById('search-articles').value.toLowerCase();

    let filtered = allArticles;
    if (filterCategory) filtered = filtered.filter(a => a.category === filterCategory);
    if (filterStatus) filtered = filtered.filter(a => a.status === filterStatus);
    if (searchTerm) filtered = filtered.filter(a => a.title.toLowerCase().includes(searchTerm));

    const tbody = document.getElementById('articles-list');
    const countEl = document.getElementById('article-count');
    countEl.textContent = `${filtered.length} artikel`;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Tidak ada artikel ditemukan</td></tr>';
    } else {
        tbody.innerHTML = filtered.map(article => `
            <tr data-id="${article.id}">
                <td><input type="checkbox" class="article-checkbox" value="${article.id}"></td>
                <td><strong>${truncate(article.title, 45)}</strong></td>
                <td>${article.category || '-'}</td>
                <td>${article.author || '-'}</td>
                <td>${formatDateShort(article.createdAt)}</td>
                <td><span class="status-badge ${article.status}">${article.status === 'published' ? 'Dipublikasi' : 'Draft'}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn view" onclick="viewArticle('${article.id}')" title="Lihat"><i class="fas fa-eye"></i></button>
                        <button class="action-btn edit" onclick="editArticle('${article.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" onclick="deleteArticle('${article.id}')" title="Hapus"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    populateCategoryFilter();
}

function populateCategoryFilter() {
    const select = document.getElementById('filter-category');
    const current = select.value;
    const categories = [...new Set(allArticles.map(a => a.category).filter(Boolean))];
    select.innerHTML = '<option value="">Semua Kategori</option>' +
        categories.map(c => `<option value="${c}" ${c === current ? 'selected' : ''}>${c}</option>`).join('');
}

// ========================================
// CRUD Operations
// ========================================
async function saveArticle(status) {
    const id = document.getElementById('article-id').value;
    const title = document.getElementById('article-title').value.trim();
    const excerpt = document.getElementById('article-excerpt').value.trim();
    const content = document.getElementById('article-content').innerHTML.trim();
    const image = document.getElementById('article-image').value.trim();
    const category = document.getElementById('article-category').value;
    const author = document.getElementById('article-author').value.trim();
    const tagsInput = document.getElementById('article-tags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];

    if (!title) {
        showToast('Judul artikel wajib diisi!', 'error');
        document.getElementById('article-title').focus();
        return;
    }
    if (!content || content === '<br>') {
        showToast('Konten artikel wajib diisi!', 'error');
        document.getElementById('article-content').focus();
        return;
    }

    const body = { title, excerpt, content, image, category, author, tags, status };

    try {
        if (id) {
            await apiRequest(`/articles/${id}`, 'PUT', body);
            showToast('Artikel berhasil diperbarui!', 'success');
        } else {
            await apiRequest('/articles', 'POST', body);
            showToast(status === 'published' ? 'Artikel berhasil dipublikasikan!' : 'Draft berhasil disimpan!', 'success');
        }
        navigateTo('articles');
    } catch (err) {
        showToast(err.message || 'Gagal menyimpan artikel', 'error');
    }
}

async function editArticle(id) {
    try {
        const article = await apiRequest(`/articles/${id}`);
        
        document.getElementById('article-id').value = article.id;
        document.getElementById('article-title').value = article.title;
        document.getElementById('article-excerpt').value = article.excerpt || '';
        document.getElementById('article-content').innerHTML = article.content || '';
        document.getElementById('article-image').value = article.image || '';
        document.getElementById('article-category').value = article.category || '';
        document.getElementById('article-author').value = article.author || '';
        document.getElementById('article-tags').value = (article.tags || []).join(', ');
        document.getElementById('form-title').textContent = 'Edit Artikel';

        if (article.image) {
            document.getElementById('image-preview').innerHTML = `<img src="${article.image}" alt="Preview">`;
        }

        // Navigate to form without resetting
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const activeNav = document.querySelector('.nav-item[data-page="add-article"]');
        if (activeNav) activeNav.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('page-add-article').classList.add('active');
    } catch (err) {
        showToast('Gagal memuat artikel', 'error');
    }
}

function deleteArticle(id) {
    showModal('Apakah Anda yakin ingin menghapus artikel ini? Aksi ini tidak dapat dibatalkan.', async () => {
        try {
            await apiRequest(`/articles/${id}`, 'DELETE');
            showToast('Artikel berhasil dihapus!', 'success');
            refreshArticlesList();
            refreshDashboard();
        } catch (err) {
            showToast('Gagal menghapus artikel', 'error');
        }
    });
}

function viewArticle(id) {
    window.open(`article.html?id=${id}`, '_blank');
}

function resetForm() {
    document.getElementById('article-id').value = '';
    document.getElementById('article-title').value = '';
    document.getElementById('article-excerpt').value = '';
    document.getElementById('article-content').innerHTML = '';
    document.getElementById('article-image').value = '';
    document.getElementById('article-category').value = '';
    document.getElementById('article-author').value = '';
    document.getElementById('article-tags').value = '';
    document.getElementById('form-title').textContent = 'Tambah Artikel Baru';
    document.getElementById('image-preview').innerHTML = '<i class="fas fa-cloud-upload-alt"></i><p>Masukkan URL gambar</p>';
}

// ========================================
// Categories
// ========================================
function refreshCategories() {
    const grid = document.getElementById('category-grid');
    const icons = {
        'Pemerintahan': 'fa-landmark',
        'Kriminal': 'fa-shield-alt',
        'Pendidikan': 'fa-graduation-cap',
        'Kesehatan': 'fa-heartbeat',
        'Olahraga': 'fa-futbol',
        'Ekonomi': 'fa-chart-line',
        'Teknologi': 'fa-microchip',
        'Gaya Hidup': 'fa-coffee',
        'Politik': 'fa-balance-scale',
        'Opini': 'fa-comment-dots'
    };

    grid.innerHTML = DEFAULT_CATEGORIES.map(cat => {
        const count = allArticles.filter(a => a.category === cat).length;
        return `
            <div class="category-card">
                <i class="fas ${icons[cat] || 'fa-folder'}"></i>
                <div class="cat-info">
                    <h4>${cat}</h4>
                    <span>${count} artikel</span>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// Settings - Export / Import
// ========================================
async function exportArticles() {
    try {
        const articles = await apiRequest('/articles');
        if (articles.length === 0) {
            showToast('Tidak ada artikel untuk di-export', 'warning');
            return;
        }
        const blob = new Blob([JSON.stringify(articles, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `infolubuklinggau-articles-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`${articles.length} artikel berhasil di-export!`, 'success');
    } catch (err) {
        showToast('Gagal export artikel', 'error');
    }
}

async function importArticles(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) {
                showToast('Format file tidak valid!', 'error');
                return;
            }

            let count = 0;
            for (const article of imported) {
                try {
                    await apiRequest('/articles', 'POST', {
                        title: article.title,
                        excerpt: article.excerpt || '',
                        content: article.content || '',
                        image: article.image || '',
                        category: article.category || '',
                        author: article.author || '',
                        tags: article.tags || [],
                        status: article.status || 'draft'
                    });
                    count++;
                } catch (err) {
                    console.error('Import error for article:', article.title);
                }
            }
            showToast(`${count} artikel berhasil di-import!`, 'success');
            refreshDashboard();
            refreshArticlesList();
        } catch (err) {
            showToast('Gagal membaca file JSON!', 'error');
        }
    };
    reader.readAsText(file);
}

function resetAllData() {
    showModal('PERINGATAN: Semua artikel akan dihapus permanen. Lanjutkan?', async () => {
        try {
            const articles = await apiRequest('/articles');
            const ids = articles.map(a => a.id);
            if (ids.length > 0) {
                await apiRequest('/articles/bulk-delete', 'POST', { ids });
            }
            showToast('Semua data berhasil direset!', 'success');
            refreshDashboard();
            refreshArticlesList();
        } catch (err) {
            showToast('Gagal mereset data', 'error');
        }
    });
}

// ========================================
// Rich Text Editor Commands
// ========================================
function execCommand(command) {
    const editor = document.getElementById('article-content');
    editor.focus();

    switch (command) {
        case 'bold': document.execCommand('bold', false, null); break;
        case 'italic': document.execCommand('italic', false, null); break;
        case 'underline': document.execCommand('underline', false, null); break;
        case 'heading': document.execCommand('formatBlock', false, '<h2>'); break;
        case 'quote': document.execCommand('formatBlock', false, '<blockquote>'); break;
        case 'ul': document.execCommand('insertUnorderedList', false, null); break;
        case 'ol': document.execCommand('insertOrderedList', false, null); break;
        case 'link':
            const url = prompt('Masukkan URL:');
            if (url) document.execCommand('createLink', false, url);
            break;
        case 'image':
            const imgUrl = prompt('Masukkan URL gambar:');
            if (imgUrl) document.execCommand('insertImage', false, imgUrl);
            break;
    }
}

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', function() {

    // Initialize Authentication
    initAuth();

    // Navigation clicks
    document.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page === 'add-article' && !this.classList.contains('action-btn')) {
                resetForm();
            }
            navigateTo(page);
        });
    });

    // Sidebar toggle (mobile)
    document.getElementById('sidebar-toggle').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
    });

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebar-toggle');
        if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Save Draft & Publish
    document.getElementById('btn-save-draft').addEventListener('click', () => saveArticle('draft'));
    document.getElementById('btn-publish').addEventListener('click', () => saveArticle('published'));

    // Image Preview
    document.getElementById('btn-preview-image').addEventListener('click', function() {
        const url = document.getElementById('article-image').value.trim();
        const preview = document.getElementById('image-preview');
        if (url) {
            preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentNode.innerHTML='<i class=\\'fas fa-exclamation-triangle\\'></i><p>Gambar tidak valid</p>'">`;
        } else {
            preview.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><p>Masukkan URL gambar</p>';
        }
    });

    // Editor toolbar
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            execCommand(this.dataset.command);
        });
    });

    // Filter & Search
    document.getElementById('filter-category').addEventListener('change', renderArticlesList);
    document.getElementById('filter-status').addEventListener('change', renderArticlesList);
    document.getElementById('search-articles').addEventListener('input', renderArticlesList);

    // Select All checkbox
    document.getElementById('select-all').addEventListener('change', function() {
        document.querySelectorAll('.article-checkbox').forEach(cb => cb.checked = this.checked);
        toggleDeleteSelected();
    });

    document.getElementById('articles-list').addEventListener('change', function(e) {
        if (e.target.classList.contains('article-checkbox')) toggleDeleteSelected();
    });

    // Delete Selected
    document.getElementById('delete-selected').addEventListener('click', function() {
        const checked = document.querySelectorAll('.article-checkbox:checked');
        if (checked.length === 0) return;
        showModal(`Hapus ${checked.length} artikel yang dipilih?`, async () => {
            try {
                const ids = Array.from(checked).map(cb => cb.value);
                await apiRequest('/articles/bulk-delete', 'POST', { ids });
                showToast(`${ids.length} artikel berhasil dihapus!`, 'success');
                refreshArticlesList();
                refreshDashboard();
            } catch (err) {
                showToast('Gagal menghapus artikel', 'error');
            }
        });
    });

    // Modal events
    document.getElementById('modal-confirm').addEventListener('click', function() {
        if (modalCallback) modalCallback();
        hideModal();
    });
    document.getElementById('modal-cancel').addEventListener('click', hideModal);
    document.getElementById('modal-close').addEventListener('click', hideModal);
    document.getElementById('modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) hideModal();
    });

    // Settings
    document.getElementById('btn-export').addEventListener('click', exportArticles);
    document.getElementById('btn-import').addEventListener('click', () => document.getElementById('import-file').click());
    document.getElementById('import-file').addEventListener('change', function() {
        if (this.files[0]) { importArticles(this.files[0]); this.value = ''; }
    });
    document.getElementById('btn-reset').addEventListener('click', resetAllData);

    // Initialize dashboard
    refreshDashboard();
});

function toggleDeleteSelected() {
    const checked = document.querySelectorAll('.article-checkbox:checked');
    document.getElementById('delete-selected').style.display = checked.length > 0 ? 'inline-flex' : 'none';
}
