// DOM Elements
const navbar = document.querySelector('.navbar');
const mobileToggle = document.querySelector('.mobile-toggle');
const navLinks = document.querySelector('.nav-links');
const allSections = document.querySelectorAll('.section');
const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .zoom-in');

// Navbar Scroll Effect
function handleNavbarScroll() {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    mobileToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
    document.body.classList.toggle('menu-open');
}

// Smooth Scroll for Navigation Links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                // Close mobile menu if open
                if (navLinks.classList.contains('active')) {
                    toggleMobileMenu();
                }
                
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Intersection Observer for Animations
function initAnimationObserver() {
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.visibility = 'visible';
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, options);

    // Set initial visibility to hidden
    animatedElements.forEach(element => {
        element.style.visibility = 'hidden';
        observer.observe(element);
    });
}

// Feature Cards Hover Effect
function initFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
            card.style.boxShadow = '0 10px 30px rgba(37, 99, 235, 0.2)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        });
    });
}

// Lazy Loading for Images
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Performance Optimization for Animations
function debounce(func, wait = 10) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize Event Listeners
function initEventListeners() {
    // Scroll events
    window.addEventListener('scroll', debounce(handleNavbarScroll));
    
    // Mobile menu
    mobileToggle?.addEventListener('click', toggleMobileMenu);
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('active') && 
            !navLinks.contains(e.target) && 
            !mobileToggle.contains(e.target)) {
            toggleMobileMenu();
        }
    });

    // Handle escape key for mobile menu
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            toggleMobileMenu();
        }
    });
}

// Initialize all functionality
function init() {
    initEventListeners();
    initSmoothScroll();
    initAnimationObserver();
    initFeatureCards();
    initLazyLoading();
    
    // Initial navbar check
    handleNavbarScroll();
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', init);

// Handle dynamic content loading
document.addEventListener('load', () => {
    initLazyLoading();
});

// Export functions for potential module usage
export {
    handleNavbarScroll,
    toggleMobileMenu,
    initSmoothScroll,
    initAnimationObserver,
    initFeatureCards,
    initLazyLoading
};