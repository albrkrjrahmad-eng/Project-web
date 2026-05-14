// ========================================
// InfoLubuklinggau - Admin Panel JavaScript
// ========================================

// ========================================
// Authentication System
// ========================================
// Default credentials - UBAH INI untuk keamanan Anda!
const ADMIN_ACCOUNTS = [
    { username: 'admin', password: 'admin123', name: 'Administrator' },
    { username: 'redaksi', password: 'redaksi123', name: 'Redaksi' }
];

function isLoggedIn() {
    const session = sessionStorage.getItem('ilg_admin_session');
    return session ? JSON.parse(session) : null;
}

function login(username, password) {
    const account = ADMIN_ACCOUNTS.find(
        a => a.username === username && a.password === password
    );
    if (account) {
        sessionStorage.setItem('ilg_admin_session', JSON.stringify({
            username: account.username,
            name: account.name,
            loginTime: new Date().toISOString()
        }));
        return true;
    }
    return false;
}

function logout() {
    sessionStorage.removeItem('ilg_admin_session');
    window.location.reload();
}

function checkAuth() {
    const session = isLoggedIn();
    const loginOverlay = document.getElementById('login-overlay');
    
    if (session) {
        // User is logged in - hide login, show admin
        loginOverlay.classList.add('hidden');
        document.getElementById('admin-name').textContent = session.name;
    } else {
        // Not logged in - show login screen
        loginOverlay.classList.remove('hidden');
    }
}

function initAuth() {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('btn-logout');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (login(username, password)) {
            loginError.textContent = '';
            checkAuth();
            refreshDashboard();
        } else {
            loginError.textContent = 'Username atau password salah!';
            document.getElementById('login-password').value = '';
            document.getElementById('login-password').focus();
        }
    });

    logoutBtn.addEventListener('click', function() {
        if (confirm('Yakin ingin keluar dari panel admin?')) {
            logout();
        }
    });

    checkAuth();
}

// Categories list
const DEFAULT_CATEGORIES = [
    'Pemerintahan', 'Kriminal', 'Pendidikan', 'Kesehatan',
    'Olahraga', 'Ekonomi', 'Teknologi', 'Gaya Hidup', 'Politik', 'Opini'
];

// ========================================
// LocalStorage Helpers
// ========================================
function getArticles() {
    const data = localStorage.getItem('ilg_articles');
    return data ? JSON.parse(data) : [];
}

function saveArticles(articles) {
    localStorage.setItem('ilg_articles', JSON.stringify(articles));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function generateSlug(title) {
    return title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
}

function formatDateShort(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
    if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
    if (diff < 604800) return Math.floor(diff / 86400) + ' hari lalu';
    return formatDateShort(dateStr);
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
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Show page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) targetPage.classList.add('active');

    // Refresh page content
    if (page === 'dashboard') refreshDashboard();
    if (page === 'articles') refreshArticlesList();
    if (page === 'categories') refreshCategories();
    if (page === 'add-article') resetForm();
}

// ========================================
// Dashboard
// ========================================
function refreshDashboard() {
    const articles = getArticles();
    const published = articles.filter(a => a.status === 'published');
    const drafts = articles.filter(a => a.status === 'draft');
    const categories = [...new Set(articles.map(a => a.category).filter(Boolean))];

    document.getElementById('stat-total').textContent = articles.length;
    document.getElementById('stat-published').textContent = published.length;
    document.getElementById('stat-draft').textContent = drafts.length;
    document.getElementById('stat-categories').textContent = categories.length;

    // Recent articles (last 5)
    const recent = articles.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
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
}

function truncate(str, len) {
    return str.length > len ? str.substring(0, len) + '...' : str;
}

// ========================================
// Articles List
// ========================================
function refreshArticlesList() {
    const articles = getArticles();
    const filterCategory = document.getElementById('filter-category').value;
    const filterStatus = document.getElementById('filter-status').value;
    const searchTerm = document.getElementById('search-articles').value.toLowerCase();

    let filtered = articles;
    if (filterCategory) filtered = filtered.filter(a => a.category === filterCategory);
    if (filterStatus) filtered = filtered.filter(a => a.status === filterStatus);
    if (searchTerm) filtered = filtered.filter(a => a.title.toLowerCase().includes(searchTerm));

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

    // Update category filter options
    populateCategoryFilter();
}

function populateCategoryFilter() {
    const select = document.getElementById('filter-category');
    const current = select.value;
    const articles = getArticles();
    const categories = [...new Set(articles.map(a => a.category).filter(Boolean))];

    select.innerHTML = '<option value="">Semua Kategori</option>' +
        categories.map(c => `<option value="${c}" ${c === current ? 'selected' : ''}>${c}</option>`).join('');
}

// ========================================
// CRUD Operations
// ========================================
function saveArticle(status) {
    const id = document.getElementById('article-id').value;
    const title = document.getElementById('article-title').value.trim();
    const excerpt = document.getElementById('article-excerpt').value.trim();
    const content = document.getElementById('article-content').innerHTML.trim();
    const image = document.getElementById('article-image').value.trim();
    const category = document.getElementById('article-category').value;
    const author = document.getElementById('article-author').value.trim();
    const tagsInput = document.getElementById('article-tags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];

    // Validation
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

    const articles = getArticles();
    const now = new Date().toISOString();

    if (id) {
        // Edit existing
        const index = articles.findIndex(a => a.id === id);
        if (index !== -1) {
            articles[index] = {
                ...articles[index],
                title, excerpt, content, image, category, author, tags, status,
                slug: generateSlug(title),
                updatedAt: now
            };
            saveArticles(articles);
            showToast('Artikel berhasil diperbarui!', 'success');
        }
    } else {
        // Create new
        const article = {
            id: generateId(),
            title, excerpt, content, image, category, author, tags, status,
            slug: generateSlug(title),
            views: 0,
            createdAt: now,
            updatedAt: now
        };
        articles.push(article);
        saveArticles(articles);
        showToast(status === 'published' ? 'Artikel berhasil dipublikasikan!' : 'Draft berhasil disimpan!', 'success');
    }

    navigateTo('articles');
}

function editArticle(id) {
    const articles = getArticles();
    const article = articles.find(a => a.id === id);
    if (!article) return;

    document.getElementById('article-id').value = article.id;
    document.getElementById('article-title').value = article.title;
    document.getElementById('article-excerpt').value = article.excerpt || '';
    document.getElementById('article-content').innerHTML = article.content || '';
    document.getElementById('article-image').value = article.image || '';
    document.getElementById('article-category').value = article.category || '';
    document.getElementById('article-author').value = article.author || '';
    document.getElementById('article-tags').value = (article.tags || []).join(', ');
    document.getElementById('form-title').textContent = 'Edit Artikel';

    // Show image preview
    if (article.image) {
        document.getElementById('image-preview').innerHTML = `<img src="${article.image}" alt="Preview">`;
    }

    navigateTo('add-article');
    // Keep form data (don't reset)
    document.getElementById('article-id').value = article.id;
    document.getElementById('form-title').textContent = 'Edit Artikel';
}

function deleteArticle(id) {
    showModal('Apakah Anda yakin ingin menghapus artikel ini? Aksi ini tidak dapat dibatalkan.', () => {
        const articles = getArticles().filter(a => a.id !== id);
        saveArticles(articles);
        showToast('Artikel berhasil dihapus!', 'success');
        refreshArticlesList();
        refreshDashboard();
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
    const articles = getArticles();
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
        const count = articles.filter(a => a.category === cat).length;
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
// Settings - Export / Import / Reset
// ========================================
function exportArticles() {
    const articles = getArticles();
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
}

function importArticles(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) {
                showToast('Format file tidak valid!', 'error');
                return;
            }
            const existing = getArticles();
            const merged = [...existing, ...imported.map(a => ({ ...a, id: generateId() }))];
            saveArticles(merged);
            showToast(`${imported.length} artikel berhasil di-import!`, 'success');
            refreshDashboard();
            refreshArticlesList();
        } catch (err) {
            showToast('Gagal membaca file JSON!', 'error');
        }
    };
    reader.readAsText(file);
}

function resetAllData() {
    showModal('PERINGATAN: Semua artikel akan dihapus permanen. Lanjutkan?', () => {
        localStorage.removeItem('ilg_articles');
        showToast('Semua data berhasil direset!', 'success');
        refreshDashboard();
        refreshArticlesList();
    });
}

// ========================================
// Rich Text Editor Commands
// ========================================
function execCommand(command) {
    const editor = document.getElementById('article-content');
    editor.focus();

    switch (command) {
        case 'bold':
            document.execCommand('bold', false, null);
            break;
        case 'italic':
            document.execCommand('italic', false, null);
            break;
        case 'underline':
            document.execCommand('underline', false, null);
            break;
        case 'heading':
            document.execCommand('formatBlock', false, '<h2>');
            break;
        case 'quote':
            document.execCommand('formatBlock', false, '<blockquote>');
            break;
        case 'ul':
            document.execCommand('insertUnorderedList', false, null);
            break;
        case 'ol':
            document.execCommand('insertOrderedList', false, null);
            break;
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

    // Save Draft
    document.getElementById('btn-save-draft').addEventListener('click', () => saveArticle('draft'));

    // Publish
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
    document.getElementById('filter-category').addEventListener('change', refreshArticlesList);
    document.getElementById('filter-status').addEventListener('change', refreshArticlesList);
    document.getElementById('search-articles').addEventListener('input', refreshArticlesList);

    // Select All checkbox
    document.getElementById('select-all').addEventListener('change', function() {
        document.querySelectorAll('.article-checkbox').forEach(cb => {
            cb.checked = this.checked;
        });
        toggleDeleteSelected();
    });

    // Watch for individual checkboxes
    document.getElementById('articles-list').addEventListener('change', function(e) {
        if (e.target.classList.contains('article-checkbox')) {
            toggleDeleteSelected();
        }
    });

    // Delete Selected
    document.getElementById('delete-selected').addEventListener('click', function() {
        const checked = document.querySelectorAll('.article-checkbox:checked');
        if (checked.length === 0) return;
        showModal(`Hapus ${checked.length} artikel yang dipilih?`, () => {
            const ids = Array.from(checked).map(cb => cb.value);
            const articles = getArticles().filter(a => !ids.includes(a.id));
            saveArticles(articles);
            showToast(`${ids.length} artikel berhasil dihapus!`, 'success');
            refreshArticlesList();
            refreshDashboard();
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
    document.getElementById('btn-import').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', function() {
        if (this.files[0]) {
            importArticles(this.files[0]);
            this.value = '';
        }
    });
    document.getElementById('btn-reset').addEventListener('click', resetAllData);

    // Initialize dashboard
    refreshDashboard();
});

function toggleDeleteSelected() {
    const checked = document.querySelectorAll('.article-checkbox:checked');
    const deleteBtn = document.getElementById('delete-selected');
    deleteBtn.style.display = checked.length > 0 ? 'inline-flex' : 'none';
}
