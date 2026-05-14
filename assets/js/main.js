// ========================================
// InfoLubuklinggau - Main JavaScript
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
            // Toggle icon
            const icon = this.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu on click outside
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

        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                searchOverlay.classList.remove('active');
            }
        });

        // Close on overlay click (outside form)
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
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // News Ticker - Clone for infinite loop
    const ticker = document.getElementById('news-ticker');
    if (ticker) {
        const tickerContent = ticker.innerHTML;
        ticker.innerHTML = tickerContent + tickerContent;
    }

    // Lazy Load Images (Intersection Observer)
    const lazyImages = document.querySelectorAll('img[data-src]');
    if (lazyImages.length > 0) {
        const imageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        lazyImages.forEach(function(img) {
            imageObserver.observe(img);
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Navbar shrink on scroll
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

    console.log('InfoLubuklinggau Portal loaded successfully!');
});
