/* ============================================
   ShadowBlade SMP - Hlavní JavaScript
   ============================================ */

'use strict';

// --- DOM Ready ---
document.addEventListener('DOMContentLoaded', () => {
    SoundManager.init();
    initMouseGlow();
    initNavigation();
    initScrollAnimations();
    initBackToTop();
    initCopyIP();
    initSmoothScroll();
    initMobileMenu();
    initParticles();
    initFadeIn();
    initIntroAnimation();
    initScrollProgress();
    initCardTilt();
    initTypewriter();
    initParallax();
    initPageReveal();
    initSoundEffects();
});

// --- Sound Manager (Web Audio API) ---
const SoundManager = {
    ctx: null,
    initialized: false,

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Audio not supported');
        }
    },

    // Ensure context is resumed on first user interaction
    ensureResumed() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    play(type) {
        if (!this.initialized || !this.ctx) return;
        this.ensureResumed();
        
        switch(type) {
            case 'sword': this._synthSword(); break;
            case 'impact': this._synthImpact(); break;
            case 'click': this._synthClick(); break;
            case 'hover': this._synthHover(); break;
            case 'success': this._synthSuccess(); break;
            case 'whoosh': this._synthWhoosh(); break;
        }
    },

    _synthSword() {
        // Rising pitch swoosh
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.4);
    },

    _synthImpact() {
        // Low thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.3);
    },

    _synthClick() {
        // Subtle click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.08);
    },

    _synthHover() {
        // Soft ping
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.15);
    },

    _synthSuccess() {
        // Rising chime
        [0, 0.1, 0.2].forEach((delay, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime([523, 659, 784][i], this.ctx.currentTime + delay);
            gain.gain.setValueAtTime(0.06, this.ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.3);
            osc.connect(gain).connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + delay);
            osc.stop(this.ctx.currentTime + delay + 0.3);
        });
    },

    _synthWhoosh() {
        // Noise-like whoosh using filtered noise
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.3);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        source.connect(filter).connect(gain).connect(this.ctx.destination);
        source.start();
    }
};

// --- Navigation ---
function initNavigation() {
    const nav = document.querySelector('nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add/remove scrolled class
        if (currentScroll > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Active nav link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || 
            (currentPage === '' && href === 'index.html') ||
            (currentPage === '/' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// --- Mobile Menu ---
function initMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        navLinks.classList.toggle('open');
        document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            navLinks.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !toggle.contains(e.target)) {
            toggle.classList.remove('active');
            navLinks.classList.remove('open');
            document.body.style.overflow = '';
        }
    });
}

// --- Scroll Animations ---
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right, .fade-in-scale').forEach(el => {
        observer.observe(el);
    });
}

// --- Back to Top ---
function initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// --- Copy IP ---
function initCopyIP() {
    document.querySelectorAll('.copy-ip').forEach(el => {
        el.addEventListener('click', async () => {
            const ip = el.getAttribute('data-ip') || 'shadowbladesmp.org';
            
            try {
                await navigator.clipboard.writeText(ip);
                el.classList.add('copied');
                showToast('✅ IP adresa zkopírována: ' + ip);
                
                setTimeout(() => {
                    el.classList.remove('copied');
                }, 2000);
            } catch (err) {
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.value = ip;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                el.classList.add('copied');
                showToast('✅ IP adresa zkopírována: ' + ip);
                
                setTimeout(() => {
                    el.classList.remove('copied');
                }, 2000);
            }
        });
    });
}

// --- Smooth Scroll ---
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// --- Toast Notification ---
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Force reflow
    toast.offsetHeight;

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Make showToast globally accessible
window.showToast = showToast;

// --- Particle Background ---
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(16, 185, 129, ${this.opacity})`;
            ctx.fill();
        }
    }

    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 150) {
                    const opacity = (1 - distance / 150) * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        connectParticles();
        animationId = requestAnimationFrame(animate);
    }

    function init() {
        resize();
        const count = Math.min(Math.floor(canvas.width * canvas.height / 8000), 80);
        particles = Array.from({ length: count }, () => new Particle());
        animate();
    }

    window.addEventListener('resize', resize);
    init();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (animationId) cancelAnimationFrame(animationId);
    });
}

// --- Mouse Glow Follower ---
function initMouseGlow() {
    const glow = document.getElementById('mouse-glow');
    if (!glow) return;

    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        glow.classList.add('visible');
    });

    document.addEventListener('mouseleave', () => {
        glow.classList.remove('visible');
    });

    // Smooth follow
    function animate() {
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;
        glow.style.transform = `translate(${currentX - 250}px, ${currentY - 250}px)`;
        requestAnimationFrame(animate);
    }
    animate();
}

// --- Page Reveal on Load ---
function initPageReveal() {
    // Add page-reveal class to sections for staggered entrance
    const sections = document.querySelectorAll('.section, .page-header, .content-section');
    sections.forEach(section => {
        section.classList.add('page-reveal');
    });
    
    // Reveal after intro
    setTimeout(() => {
        document.querySelectorAll('.page-reveal').forEach(el => {
            el.classList.add('revealed');
        });
    }, 3500);
}

// --- Intro Animation (PREMIUM) ---
function initIntroAnimation() {
    const overlay = document.getElementById('intro-overlay');
    if (!overlay) return;

    const particlesContainer = overlay.querySelector('.intro-particles');
    
    function createBurst(count = 50, spread = 250) {
        if (!particlesContainer) return;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'intro-particle';
            const angle = (i / count) * 360;
            const dist = 80 + Math.random() * spread;
            const x = Math.cos(angle * Math.PI / 180) * dist;
            const y = Math.sin(angle * Math.PI / 180) * dist;
            p.style.setProperty('--x', x + 'px');
            p.style.setProperty('--y', y + 'px');
            p.style.setProperty('--dur', (0.6 + Math.random() * 0.8) + 's');
            p.style.animationDelay = (Math.random() * 0.4) + 's';
            p.style.width = (2 + Math.random() * 4) + 'px';
            p.style.height = p.style.width;
            particlesContainer.appendChild(p);
        }
        setTimeout(() => {
            if (particlesContainer) particlesContainer.innerHTML = '';
        }, 2500);
    }

    // Create energy rings
    function createEnergyRing() {
        for (let i = 0; i < 3; i++) {
            const ring = document.createElement('div');
            ring.className = 'intro-energy-ring';
            ring.style.left = '50%';
            ring.style.top = '50%';
            ring.style.transform = 'translate(-50%, -50%)';
            ring.style.animationDelay = (i * 0.3) + 's';
            ring.style.borderColor = `rgba(16, 185, 129, ${0.5 - i * 0.15})`;
            overlay.appendChild(ring);
            setTimeout(() => ring.remove(), 2500);
        }
    }

    // Create screen flash element
    const flash = document.createElement('div');
    flash.className = 'intro-flash';
    overlay.appendChild(flash);
    setTimeout(() => flash.remove(), 2000);

    // Create loading bar
    const loading = document.createElement('div');
    loading.className = 'intro-loading';
    loading.innerHTML = '<div class="intro-loading-bar"></div>';
    overlay.appendChild(loading);

    // Sounds
    setTimeout(() => SoundManager.play('sword'), 200);
    setTimeout(() => SoundManager.play('impact'), 500);
    setTimeout(() => SoundManager.play('whoosh'), 1000);
    setTimeout(() => {
        SoundManager.play('impact');
        SoundManager.play('success');
    }, 1600);

    // Particle bursts
    setTimeout(createBurst, 500, 50, 200);
    setTimeout(createBurst, 1000, 30, 300);
    setTimeout(createBurst, 1600, 60, 250);
    
    // Energy rings
    setTimeout(createEnergyRing, 400);
    setTimeout(createEnergyRing, 1000);

    // Prevent scroll during intro
    document.body.style.overflow = 'hidden';

    // Hide overlay after animation
    setTimeout(() => {
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
        setTimeout(() => {
            overlay.style.display = 'none';
            // Trigger page reveal after intro fully ends
            document.querySelectorAll('.page-reveal').forEach(el => {
                el.classList.add('revealed');
            });
        }, 800);
    }, 3200);
}

// --- Scroll Progress Bar ---
function initScrollProgress() {
    const bar = document.querySelector('.scroll-progress');
    if (!bar) return;

    window.addEventListener('scroll', () => {
        const winScroll = document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        bar.style.width = scrolled + '%';
    });
}

// --- Card 3D Tilt ---
function initCardTilt() {
    const cards = document.querySelectorAll('.feature-card, .stat-card, .staff-card, .news-card, .vote-card, .content-card, .discord-section');
    
    cards.forEach(card => {
        let isHovered = false;
        
        card.addEventListener('mouseenter', () => {
            isHovered = true;
        });
        
        card.addEventListener('mousemove', (e) => {
            if (!isHovered) return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / centerY * -6;
            const rotateY = (x - centerX) / centerX * 6;
            
            card.style.setProperty('--tilt-x', `${rotateX}deg`);
            card.style.setProperty('--tilt-y', `${rotateY}deg`);
            card.classList.add('tilt-active');
        });
        
        card.addEventListener('mouseleave', () => {
            isHovered = false;
            card.classList.remove('tilt-active');
            card.style.removeProperty('--tilt-x');
            card.style.removeProperty('--tilt-y');
        });
    });
}

// --- Typewriter Effect ---
function initTypewriter() {
    const elements = document.querySelectorAll('.typewriter-text');
    
    elements.forEach(el => {
        const text = el.textContent;
        el.textContent = '';
        let i = 0;
        
        const type = () => {
            if (i < text.length) {
                el.textContent += text.charAt(i);
                i++;
                setTimeout(type, 50 + Math.random() * 50);
            } else {
                el.style.borderRight = 'none';
            }
        };
        
        // Start typing after a delay
        setTimeout(type, 2000);
    });
}

// --- Parallax Scrolling ---
function initParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroHeight = hero.offsetHeight;
        
        if (scrolled < heroHeight) {
            // Gentle parallax on hero content
            const content = hero.querySelector('.hero-content');
            if (content) {
                const translateY = scrolled * 0.12;
                const opacity = Math.max(0, 1 - (scrolled / (heroHeight * 0.7)));
                content.style.transform = `translateY(${translateY}px)`;
                content.style.opacity = opacity;
            }
            
            // Scale down server status card
            const statusCard = hero.querySelector('.server-status-card');
            if (statusCard) {
                const scale = Math.max(0.95, 1 - scrolled / (heroHeight * 2));
                statusCard.style.transform = `scale(${scale})`;
            }
        } else {
            // Reset when scrolled past
            const content = hero.querySelector('.hero-content');
            if (content) {
                content.style.transform = '';
                content.style.opacity = '';
            }
            const statusCard = hero.querySelector('.server-status-card');
            if (statusCard) {
                statusCard.style.transform = '';
            }
        }
    });
}

// --- Sound Effects Integration ---
function initSoundEffects() {
    // Button clicks
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => SoundManager.play('hover'));
        btn.addEventListener('click', () => SoundManager.play('click'));
    });

    // Navigation links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('mouseenter', () => SoundManager.play('hover'));
    });

    // Card hover
    document.querySelectorAll('.feature-card, .stat-card, .staff-card, .news-card, .content-card, .vote-card').forEach(card => {
        card.addEventListener('mouseenter', () => SoundManager.play('hover'));
    });

    // Copy IP
    document.querySelectorAll('.copy-ip').forEach(el => {
        el.addEventListener('click', () => {
            setTimeout(() => SoundManager.play('success'), 100);
        });
    });

    // Discord link
    document.querySelectorAll('.discord-link').forEach(el => {
        el.addEventListener('mouseenter', () => SoundManager.play('hover'));
    });

    // Back to top
    const backBtn = document.querySelector('.back-to-top');
    if (backBtn) {
        backBtn.addEventListener('click', () => SoundManager.play('click'));
    }

    // FAQ toggles
    document.querySelectorAll('.faq-question').forEach(el => {
        el.addEventListener('click', () => SoundManager.play('click'));
    });

    // Filter tags
    document.querySelectorAll('.filter-tag').forEach(el => {
        el.addEventListener('click', () => SoundManager.play('click'));
    });

    // Mobile menu
    document.querySelector('.menu-toggle')?.addEventListener('click', () => SoundManager.play('click'));
}

// --- Override showToast to add sound ---
const _originalShowToast = window.showToast;
window.showToast = function(message, type = 'success') {
    if (type === 'success') SoundManager.play('success');
    _originalShowToast(message, type);
};

// --- Fade In on Load (for elements without observer) ---
function initFadeIn() {
    // Add fade-in class to elements that should animate on load
    document.querySelectorAll('.hero-content > *').forEach((el, i) => {
        el.classList.add('fade-in');
        el.classList.add(`delay-${Math.min(i + 1, 6)}`);
    });

    // Trigger observer for these elements
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}
