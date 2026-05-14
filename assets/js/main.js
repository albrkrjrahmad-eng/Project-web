// ========================================
// InfoLubuklinggau - Main JavaScript
// ========================================

// ========================================
// LocalStorage Helpers (shared with admin)
// ========================================
function getArticles() {
    const data = localStorage.getItem('ilg_articles');
    return data ? JSON.parse(data) : [];
}

function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
    if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
    if (diff < 604800) return Math.floor(diff / 86400) + ' hari lalu';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateFull(dateStr) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
}

function truncateText(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// ========================================
// Render Homepage Dynamic Content
// ========================================
function renderHomepageArticles() {
    const articles = getArticles().filter(a => a.status === 'published');
    articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (articles.length === 0) return; // Keep static content if no articles

    // Render Hero Main (first article)
    const heroMain = document.getElementById('hero-main');
    if (heroMain && articles[0]) {
        const a = articles[0];
        const excerpt = a.excerpt || stripHtml(a.content).substring(0, 120) + '...';
        heroMain.innerHTML = `
            <a href="article.html?id=${a.id}" class="hero-card">
                <div class="hero-image">
                    <img src="${a.image || 'https://picsum.photos/800/500?random=1'}" alt="${a.title}">
                    <span class="category-badge">${a.category || 'Berita'}</span>
                </div>
                <div class="hero-info">
                    <h1>${a.title}</h1>
                    <p>${excerpt}</p>
                    <div class="meta">
                        <span><i class="far fa-clock"></i> ${timeAgo(a.createdAt)}</span>
                        <span><i class="far fa-eye"></i> ${a.views || 0} views</span>
                    </div>
                </div>
            </a>
        `;
    }

    // Render Hero Sidebar (articles 2-4)
    const heroSidebar = document.getElementById('hero-sidebar');
    if (heroSidebar && articles.length > 1) {
        const sideArticles = articles.slice(1, 4);
        heroSidebar.innerHTML = sideArticles.map(a => `
            <a href="article.html?id=${a.id}" class="hero-side-card">
                <div class="hero-side-image">
                    <img src="${a.image || 'https://picsum.photos/400/250?random=' + Math.floor(Math.random()*100)}" alt="${a.title}">
                </div>
                <div class="hero-side-info">
                    <span class="category-badge small">${a.category || 'Berita'}</span>
                    <h3>${truncateText(a.title, 60)}</h3>
                    <span class="meta"><i class="far fa-clock"></i> ${timeAgo(a.createdAt)}</span>
                </div>
            </a>
        `).join('');
    }

    // Render News Grid (articles 5-10)
    const newsGrid = document.getElementById('news-grid');
    if (newsGrid && articles.length > 4) {
        const gridArticles = articles.slice(4, 10);
        newsGrid.innerHTML = gridArticles.map(a => {
            const excerpt = a.excerpt || stripHtml(a.content).substring(0, 80) + '...';
            return `
                <article class="news-card">
                    <a href="article.html?id=${a.id}">
                        <div class="news-card-image">
                            <img src="${a.image || 'https://picsum.photos/400/250?random=' + Math.floor(Math.random()*100)}" alt="${a.title}">
                            <span class="category-badge small">${a.category || 'Berita'}</span>
                        </div>
                        <div class="news-card-content">
                            <h3>${truncateText(a.title, 65)}</h3>
                            <p>${excerpt}</p>
                            <div class="meta">
                                <span><i class="far fa-clock"></i> ${timeAgo(a.createdAt)}</span>
                                <span><i class="far fa-eye"></i> ${a.views || 0}</span>
                            </div>
                        </div>
                    </a>
                </article>
            `;
        }).join('');
    } else if (newsGrid && articles.length > 1) {
        // If we have between 2-4 articles, use them for grid too
        const gridArticles = articles.slice(1, 7);
        newsGrid.innerHTML = gridArticles.map(a => {
            const excerpt = a.excerpt || stripHtml(a.content).substring(0, 80) + '...';
            return `
                <article class="news-card">
                    <a href="article.html?id=${a.id}">
                        <div class="news-card-image">
                            <img src="${a.image || 'https://picsum.photos/400/250?random=' + Math.floor(Math.random()*100)}" alt="${a.title}">
                            <span class="category-badge small">${a.category || 'Berita'}</span>
                        </div>
                        <div class="news-card-content">
                            <h3>${truncateText(a.title, 65)}</h3>
                            <p>${excerpt}</p>
                            <div class="meta">
                                <span><i class="far fa-clock"></i> ${timeAgo(a.createdAt)}</span>
                                <span><i class="far fa-eye"></i> ${a.views || 0}</span>
                            </div>
                        </div>
                    </a>
                </article>
            `;
        }).join('');
    }

    // Render Popular News (by views)
    const popularList = document.getElementById('popular-news');
    if (popularList && articles.length > 0) {
        const popular = articles.slice().sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
        popularList.innerHTML = popular.map((a, i) => `
            <div class="popular-item">
                <span class="popular-number">${i + 1}</span>
                <div class="popular-content">
                    <a href="article.html?id=${a.id}">
                        <h4>${truncateText(a.title, 70)}</h4>
                        <span class="meta"><i class="far fa-clock"></i> ${timeAgo(a.createdAt)} <i class="far fa-eye"></i> ${a.views || 0}</span>
                    </a>
                </div>
            </div>
        `).join('');
    }

    // Render Recent Posts in Sidebar
    const recentPosts = document.getElementById('recent-posts');
    if (recentPosts && articles.length > 0) {
        const recent = articles.slice(0, 4);
        recentPosts.innerHTML = recent.map(a => `
            <a href="article.html?id=${a.id}" class="recent-post">
                <img src="${a.image || 'https://picsum.photos/100/70?random=' + Math.floor(Math.random()*100)}" alt="${a.title}">
                <div class="recent-post-info">
                    <h4>${truncateText(a.title, 50)}</h4>
                    <span class="meta"><i class="far fa-clock"></i> ${timeAgo(a.createdAt)}</span>
                </div>
            </a>
        `).join('');
    }

    // Update Breaking News Ticker
    const ticker = document.getElementById('news-ticker');
    if (ticker && articles.length > 0) {
        const tickerArticles = articles.slice(0, 5);
        const tickerHtml = tickerArticles.map(a => `<span class="ticker-item">${a.title}</span>`).join('');
        ticker.innerHTML = tickerHtml + tickerHtml; // duplicate for infinite scroll
    }
}

// ========================================
// Render Article Page
// ========================================
function renderArticlePage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    const articles = getArticles();
    const article = articles.find(a => a.id === id);
    if (!article) {
        document.querySelector('.article') && (document.querySelector('.article').innerHTML = `
            <div style="text-align:center; padding:60px 20px;">
                <h2>Artikel Tidak Ditemukan</h2>
                <p style="margin:15px 0;">Artikel yang Anda cari tidak tersedia atau telah dihapus.</p>
                <a href="index.html" style="color:#e63946; font-weight:600;">← Kembali ke Beranda</a>
            </div>
        `);
        return;
    }

    // Increment views
    const idx = articles.findIndex(a => a.id === id);
    if (idx !== -1) {
        articles[idx].views = (articles[idx].views || 0) + 1;
        localStorage.setItem('ilg_articles', JSON.stringify(articles));
    }

    // Update page title
    document.title = article.title + ' - InfoLubuklinggau';

    // Fill article header
    const titleEl = document.querySelector('.article-title');
    if (titleEl) titleEl.textContent = article.title;

    const categoryBadge = document.querySelector('.article-header .category-badge');
    if (categoryBadge) categoryBadge.textContent = article.category || 'Berita';

    // Author info
    const authorName = document.querySelector('.author-name');
    if (authorName) authorName.textContent = article.author || 'Redaksi';

    // Date & meta
    const detailsEl = document.querySelector('.article-details');
    if (detailsEl) {
        detailsEl.innerHTML = `
            <span><i class="far fa-calendar-alt"></i> ${formatDateFull(article.createdAt)}</span>
            <span><i class="far fa-clock"></i> ${new Date(article.createdAt).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})} WIB</span>
            <span><i class="far fa-eye"></i> ${article.views || 0} views</span>
        `;
    }

    // Featured image
    const featuredImg = document.querySelector('.article-featured-image img');
    if (featuredImg && article.image) {
        featuredImg.src = article.image;
        featuredImg.alt = article.title;
    } else if (featuredImg && !article.image) {
        document.querySelector('.article-featured-image').style.display = 'none';
    }

    // Article body
    const bodyEl = document.querySelector('.article-body');
    if (bodyEl) bodyEl.innerHTML = article.content;

    // Tags
    const tagsEl = document.querySelector('.article-tags');
    if (tagsEl && article.tags && article.tags.length > 0) {
        tagsEl.innerHTML = `
            <span class="tags-label"><i class="fas fa-tags"></i> Tags:</span>
            ${article.tags.map(t => `<a href="#" class="tag">${t}</a>`).join('')}
        `;
    }

    // Author box
    const authorBoxName = document.querySelector('.author-box-info h4');
    if (authorBoxName) authorBoxName.textContent = article.author || 'Redaksi';

    // Breadcrumb
    const breadcrumbCurrent = document.querySelector('.breadcrumb .current');
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = truncateText(article.title, 50);

    // Related news (same category)
    const relatedGrid = document.querySelector('.related-grid');
    if (relatedGrid) {
        const related = articles
            .filter(a => a.id !== id && a.status === 'published' && a.category === article.category)
            .slice(0, 3);
        if (related.length > 0) {
            relatedGrid.innerHTML = related.map(a => `
                <a href="article.html?id=${a.id}" class="related-card">
                    <div class="related-image">
                        <img src="${a.image || 'https://picsum.photos/300/200?random=' + Math.floor(Math.random()*100)}" alt="${a.title}">
                    </div>
                    <h4>${truncateText(a.title, 60)}</h4>
                    <span class="meta"><i class="far fa-clock"></i> ${timeAgo(a.createdAt)}</span>
                </a>
            `).join('');
        }
    }
}

// ========================================
// Main App Init
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    
    // Display Current Date (Indonesian format)
    const dateDisplay = document.getElementById('current-date');
    if (dateDisplay) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const today = new Date();
        dateDisplay.textContent = today.toLocaleDateString('id-ID', options);
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            const icon = this.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navMenu.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Search Overlay
    const searchBtn = document.getElementById('search-btn');
    const searchOverlay = document.getElementById('search-overlay');
    const searchClose = document.getElementById('search-close');
    
    if (searchBtn && searchOverlay && searchClose) {
        searchBtn.addEventListener('click', function() {
            searchOverlay.classList.add('active');
            searchOverlay.querySelector('.search-input').focus();
        });

        searchClose.addEventListener('click', function() {
            searchOverlay.classList.remove('active');
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                searchOverlay.classList.remove('active');
            }
        });

        searchOverlay.addEventListener('click', function(e) {
            if (e.target === searchOverlay) {
                searchOverlay.classList.remove('active');
            }
        });
    }

    // Back to Top Button
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Navbar hide on scroll
    const mainNav = document.querySelector('.main-nav');
    if (mainNav) {
        let lastScroll = 0;
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            if (currentScroll > lastScroll && currentScroll > 200) {
                mainNav.style.transform = 'translateY(-100%)';
            } else {
                mainNav.style.transform = 'translateY(0)';
            }
            lastScroll = currentScroll;
        });
    }

    // Reading progress (for article pages)
    const progressBar = document.querySelector('.reading-progress');
    if (progressBar) {
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = progress + '%';
        });
    }

    // ========================================
    // Dynamic Content Rendering
    // ========================================
    
    // Check if we're on the homepage
    const isHomepage = document.getElementById('hero-main');
    if (isHomepage) {
        renderHomepageArticles();
    }

    // Check if we're on article page
    const isArticlePage = document.querySelector('.article-body');
    const hasIdParam = new URLSearchParams(window.location.search).get('id');
    if (isArticlePage && hasIdParam) {
        renderArticlePage();
    }

    console.log('InfoLubuklinggau Portal loaded successfully!');
});
