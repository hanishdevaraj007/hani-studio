/* =====================================
   HANI LADIES DESIGNER - PARALLAX ENGINE
   Lightweight | Mobile-First | Pure Vanilla JS
   ===================================== */

(function() {
    'use strict';

    // ===== CONFIGURATION =====
    const CONFIG = {
        // Desktop: Enable scroll-based parallax
        // Mobile: Use CSS animations instead (better performance)
        enableDesktopParallax: true,
        mobileBreakpoint: 768,
        
        // Throttle scroll events for better performance (milliseconds)
        scrollThrottle: 10,
        
        // Enable smooth scrolling for navigation links
        enableSmoothScroll: true
    };

    // ===== DEVICE DETECTION =====
    let isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
    
    // Update on resize
    window.addEventListener('resize', () => {
        isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
    });

    // ===== PARALLAX SCROLL HANDLER (Desktop Only) =====
    /**
     * This function moves parallax layers at different speeds based on scroll position.
     * Works with both global .parallax-layer and hero-specific .hero-parallax-layer
     * 
     * data-speed attribute controls movement speed:
     * - 0.2 = slowest (deep background)
     * - 0.4 = medium speed
     * - 0.8 = fastest (foreground)
     * 
     * HERO PARALLAX: Creates floating elements in background that move as you scroll,
     * giving the illusion of depth and making the landing page feel premium and alive.
     * 
     * HOW TO CUSTOMIZE:
     * 1. In HTML, adjust data-speed on .parallax-layer or .hero-parallax-layer elements
     * 2. Higher values = faster movement, lower = slower
     * 3. Negative values will move in opposite direction
     */
    function handleParallaxScroll() {
        // Only run on desktop devices
        if (isMobile || !CONFIG.enableDesktopParallax) return;
        
        // Get current scroll position
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Select all parallax layers (both global and hero-specific)
        const layers = document.querySelectorAll('.parallax-layer, .hero-parallax-layer');
        
        layers.forEach(layer => {
            // Get speed multiplier from data attribute
            const speed = parseFloat(layer.getAttribute('data-speed')) || 0.5;
            
            // Calculate new Y position based on scroll
            // Formula: scroll position * speed = parallax offset
            const yPos = -(scrollTop * speed);
            
            // Apply transform using GPU-accelerated translate3d
            // translate3d triggers GPU acceleration (better performance than translateY)
            layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
    }

    // ===== THROTTLE FUNCTION =====
    /**
     * Limits how often a function can run.
     * Prevents performance issues from rapid scroll events.
     * 
     * @param {Function} func - The function to throttle
     * @param {Number} limit - Minimum time between calls (ms)
     */
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ===== INITIALIZE PARALLAX =====
    /**
     * Set up scroll listener for desktop parallax.
     * On mobile, CSS animations handle the floating effect instead.
     */
    function initParallax() {
        if (!isMobile && CONFIG.enableDesktopParallax) {
            // Throttle scroll events for better performance
            const throttledScroll = throttle(handleParallaxScroll, CONFIG.scrollThrottle);
            
            window.addEventListener('scroll', throttledScroll, { passive: true });
            
            // Run once on load to set initial positions
            handleParallaxScroll();
        }
    }

    // ===== MOBILE MENU TOGGLE =====
    /**
     * Handles hamburger menu on mobile devices.
     * Toggles .active class to show/hide navigation.
     */
    function initMobileMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (!menuToggle || !navLinks) return;
        
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        
        // Close menu when clicking a link
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
    /**
     * Smooth scrolling when clicking navigation links.
     * Modern browsers support this natively with CSS scroll-behavior,
     * but this provides better control and fallback.
     */
    function initSmoothScroll() {
        if (!CONFIG.enableSmoothScroll) return;
        
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                // Skip if href is just "#" or empty
                if (href === '#' || href === '') return;
                
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    e.preventDefault();
                    
                    // Get navbar height for offset
                    const nav = document.querySelector('.glass-nav');
                    const navHeight = nav ? nav.offsetHeight : 0;
                    
                    // Calculate scroll position (subtract nav height)
                    const targetPosition = targetSection.offsetTop - navHeight;
                    
                    // Smooth scroll to target
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ===== INTERSECTION OBSERVER FOR FADE-IN ANIMATIONS =====
    /**
     * Detects when elements enter viewport and triggers animations.
     * More performant than scroll event listeners.
     * 
     * HOW TO USE:
     * Add class "fade-in-on-scroll" to any element you want to animate.
     */
    function initScrollAnimations() {
        // Check if IntersectionObserver is supported
        if (!('IntersectionObserver' in window)) return;
        
        const observerOptions = {
            root: null, // viewport
            rootMargin: '0px 0px -100px 0px', // Trigger slightly before element is visible
            threshold: 0.1 // Trigger when 10% of element is visible
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add animation class when element enters viewport
                    entry.target.classList.add('is-visible');
                    
                    // Optional: Stop observing after animation (one-time animation)
                    // observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe all elements with animation class
        const animatedElements = document.querySelectorAll('.fade-in-on-scroll');
        animatedElements.forEach(el => observer.observe(el));
    }

    // ===== COUPON GENERATOR =====
    /**
     * Handles coupon code generation and submission to Google Sheets.
     * Validates inputs before submission.
     */
    function initCouponGenerator() {
        const couponForm = document.getElementById('couponForm');
        const loadingDiv = document.getElementById('coupon-loading');
        const resultDiv = document.getElementById('coupon-result');
        const nameInput = document.getElementById('custName');
        const emailInput = document.getElementById('custEmail');
        const finalCodeSpan = document.getElementById('finalCode');
        const expiryDateSpan = document.getElementById('expiryDate');
        
        if (!couponForm) return;
        
        couponForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            
            // ===== VALIDATION =====
            
            // Check name length (minimum 4 characters)
            if (name.length < 4) {
                alert("Please enter your full name (at least 4 characters).");
                nameInput.focus();
                return;
            }
            
            // Validate email format using regex
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                alert("Please enter a valid email address (e.g., name@gmail.com).");
                emailInput.focus();
                return;
            }
            
            // ===== GENERATE COUPON CODE =====
            
            // Generate random characters (3 uppercase letters/numbers)
            const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
            
            // Get current date in DD/MM format (e.g., 0112 for Jan 12)
            const dateStr = new Date().toLocaleDateString('en-GB').slice(0, 5).replace('/', '');
            
            // Combine into coupon code: HANI-0112-X7Y
            const couponCode = `HANI-${dateStr}-${randomChars}`;
            
            // Calculate expiry date (7 days from now)
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 7);
            const expiryStr = expiry.toLocaleDateString('en-GB'); // DD/MM/YYYY format
            
            // ===== UPDATE UI =====
            
            // Hide form, show loading
            couponForm.style.display = 'none';
            loadingDiv.style.display = 'block';
            
            // ===== SUBMIT TO GOOGLE SHEETS =====
            
            // Prepare form data for Google Apps Script
            const formData = new URLSearchParams();
            formData.append('action', 'monthly_offer');
            formData.append('name', name);
            formData.append('email', email);
            formData.append('coupon', couponCode);
            
            // Send POST request to Google Apps Script
            // NOTE: Replace this URL with your actual Google Apps Script Web App URL
            fetch('https://script.google.com/macros/s/AKfycbw5e6lsD0Wy9T2b98YIVvQ63WF4hbF1fqj0_Mw9Jw45pPiYB1DfjzBHbo50Antn3Kjqwg/exec', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Hide loading
                loadingDiv.style.display = 'none';
                
                // Check if there was an error (e.g., duplicate email)
                if (data.result === "error") {
                    alert("❌ " + data.message);
                    // Show form again for retry
                    couponForm.style.display = 'block';
                } else {
                    // Success! Show coupon code
                    resultDiv.style.display = 'block';
                    finalCodeSpan.innerText = couponCode;
                    expiryDateSpan.innerText = expiryStr;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Connection error. Please check your internet and try again.");
                
                // Reset UI on error
                loadingDiv.style.display = 'none';
                couponForm.style.display = 'block';
            });
        });
    }

    // ===== LAZY LOAD IMAGES =====
    /**
     * Load images only when they're about to enter the viewport.
     * Improves initial page load performance.
     * 
     * HOW TO USE:
     * 1. Add loading="lazy" attribute to <img> tags (already in HTML)
     * 2. Modern browsers handle this natively
     * 3. This function is a polyfill for older browsers
     */
    function initLazyLoading() {
        // Check if native lazy loading is supported
        if ('loading' in HTMLImageElement.prototype) {
            // Browser supports native lazy loading, do nothing
            return;
        }
        
        // Fallback for older browsers
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        } else {
            // Very old browser - load all images immediately
            images.forEach(img => {
                img.src = img.dataset.src || img.src;
            });
        }
    }

    // ===== INITIALIZE EVERYTHING ON PAGE LOAD =====
    /**
     * Wait for DOM to be ready before initializing.
     * DOMContentLoaded fires when HTML is parsed (faster than window.onload).
     */
    function init() {
        initParallax();
        initMobileMenu();
        initSmoothScroll();
        initScrollAnimations();
        initCouponGenerator();
        initLazyLoading();
        
        console.log('🎨 Hani Ladies Designer - Parallax Initialized');
        console.log(`📱 Device: ${isMobile ? 'Mobile' : 'Desktop'}`);
        console.log(`✨ Parallax: ${isMobile ? 'CSS Animations' : 'Scroll-based'}`);
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded
        init();
    }

    // ===== EXPOSE API FOR DEBUGGING =====
    /**
     * Useful for testing in browser console.
     * Example: HaniParallax.reInit()
     */
    window.HaniParallax = {
        version: '1.0.0',
        config: CONFIG,
        reInit: init,
        isMobile: () => isMobile,
        
        // Manual parallax update (for debugging)
        updateParallax: handleParallaxScroll,
        
        // Enable/disable parallax on the fly
        toggleParallax: function(enable) {
            CONFIG.enableDesktopParallax = enable;
            if (!enable) {
                // Reset all layers to original position
                document.querySelectorAll('.parallax-layer, .hero-parallax-layer').forEach(layer => {
                    layer.style.transform = 'translate3d(0, 0, 0)';
                });
            }
        }
    };

})();

/* =====================================
   CUSTOMIZATION GUIDE
   =====================================

   HERO PARALLAX SETUP:
   The hero section now features floating design elements that move as you scroll:
   
   1. ADJUST PARALLAX SPEED:
      In HTML, change data-speed attributes on .hero-parallax-layer elements:
      - data-speed="0.1" = very slow (far background)
      - data-speed="0.5" = medium speed
      - data-speed="1.0" = fast (foreground)
      - data-speed="-0.3" = moves in opposite direction

   2. CUSTOMIZE FLOATING ELEMENTS:
      - Reposition: Change top/left % values in inline styles
      - Change icons: Replace fa-scissors with any FontAwesome icon
      - Add more: Copy-paste any .float-element div

   3. ADJUST ELEMENT SIZES:
      Use these classes: bubble-deep (120px), bubble-mid (80px), bubble-front (60px)

   4. MOBILE BEHAVIOR:
      On mobile, parallax elements use CSS animations for smooth floating
      effect (no scroll jacking). Edit animation durations in styles.css.

   ===================================== */
