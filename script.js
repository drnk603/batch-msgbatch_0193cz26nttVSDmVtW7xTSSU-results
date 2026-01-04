(function() {
    'use strict';
    
    window.__app = window.__app || {};
    
    if (window.__app.initialized) {
        return;
    }
    
    const Utils = {
        debounce: function(func, wait) {
            let timeout;
            return function() {
                const context = this;
                const args = arguments;
                const later = function() {
                    timeout = null;
                    func.apply(context, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        throttle: function(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => { inThrottle = false; }, limit);
                }
            };
        },
        
        escapeHtml: function(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return String(text).replace(/[&<>"']/g, m => map[m]);
        }
    };
    
    const BurgerMenu = {
        init: function() {
            if (window.__app.burgerInit) return;
            window.__app.burgerInit = true;
            
            const toggle = document.querySelector('.navbar-toggler');
            const collapse = document.querySelector('#navbarNav, .navbar-collapse');
            
            if (!toggle || !collapse) return;
            
            let isOpen = false;
            
            const open = () => {
                isOpen = true;
                collapse.classList.add('show');
                collapse.style.height = 'calc(100vh - var(--header-h))';
                toggle.setAttribute('aria-expanded', 'true');
                document.body.style.overflow = 'hidden';
            };
            
            const close = () => {
                isOpen = false;
                collapse.classList.remove('show');
                collapse.style.height = '';
                toggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            };
            
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                isOpen ? close() : open();
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && isOpen) {
                    close();
                }
            });
            
            document.addEventListener('click', (e) => {
                if (isOpen && !toggle.contains(e.target) && !collapse.contains(e.target)) {
                    close();
                }
            });
            
            const links = collapse.querySelectorAll('.nav-link');
            links.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth < 1024) {
                        close();
                    }
                });
            });
            
            window.addEventListener('resize', Utils.debounce(() => {
                if (window.innerWidth >= 1024 && isOpen) {
                    close();
                }
            }, 250));
        }
    };
    
    const SmoothScroll = {
        init: function() {
            if (window.__app.smoothScrollInit) return;
            window.__app.smoothScrollInit = true;
            
            const isHomepage = location.pathname === '/' || location.pathname === '/index.html';
            
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    const href = this.getAttribute('href');
                    if (!href || href === '#' || href === '#!') return;
                    
                    const targetId = href.replace('#', '');
                    const target = document.getElementById(targetId);
                    
                    if (target && isHomepage) {
                        e.preventDefault();
                        const header = document.querySelector('header');
                        const offset = header ? header.offsetHeight : 72;
                        const targetTop = target.getBoundingClientRect().top + window.pageYOffset - offset;
                        
                        window.scrollTo({
                            top: targetTop,
                            behavior: 'smooth'
                        });
                    } else if (!isHomepage) {
                        this.setAttribute('href', '/' + href);
                    }
                });
            });
        }
    };
    
    const ScrollSpy = {
        init: function() {
            if (window.__app.scrollSpyInit) return;
            window.__app.scrollSpyInit = true;
            
            const sections = document.querySelectorAll('section[id]');
            const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
            
            if (sections.length === 0 || navLinks.length === 0) return;
            
            const observerOptions = {
                root: null,
                rootMargin: '-20% 0px -70% 0px',
                threshold: 0
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        navLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === '#' + entry.target.id) {
                                link.classList.add('active');
                                link.setAttribute('aria-current', 'page');
                            } else {
                                link.removeAttribute('aria-current');
                            }
                        });
                    }
                });
            }, observerOptions);
            
            sections.forEach(section => observer.observe(section));
        }
    };
    
    const ImageAnimations = {
        init: function() {
            if (window.__app.imageAnimInit) return;
            window.__app.imageAnimInit = true;
            
            const images = document.querySelectorAll('img');
            
            images.forEach(img => {
                if (!img.hasAttribute('loading') && !img.classList.contains('c-logo__img')) {
                    img.setAttribute('loading', 'lazy');
                }
                
                if (!img.classList.contains('img-fluid')) {
                    img.classList.add('img-fluid');
                }
                
                img.style.opacity = '0';
                img.style.transform = 'translateY(20px)';
                img.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
                
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0)';
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.1 });
                
                observer.observe(img);
                
                img.addEventListener('error', function() {
                    this.src = 'data:image/svg+xml;base64,' + btoa(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#f8f9fa"/><text x="50%" y="50%" text-anchor="middle" fill="#6c757d">Image not found</text></svg>'
                    );
                    this.style.objectFit = 'contain';
                });
            });
        }
    };
    
    const FormValidation = {
        patterns: {
            name: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
            email: /^[^s@]+@[^s@]+.[^s@]+$/,
            phone: /^[ds+-()]{10,20}$/,
            message: /^.{10,}$/
        },
        
        messages: {
            name: 'Bitte geben Sie einen gültigen Namen ein (2-50 Zeichen)',
            email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
            phone: 'Bitte geben Sie eine gültige Telefonnummer ein (10-20 Zeichen)',
            message: 'Die Nachricht muss mindestens 10 Zeichen lang sein',
            privacy: 'Bitte akzeptieren Sie die Datenschutzerklärung',
            service: 'Bitte wählen Sie einen Service aus'
        },
        
        init: function() {
            if (window.__app.formValidationInit) return;
            window.__app.formValidationInit = true;
            
            const forms = document.querySelectorAll('form');
            
            forms.forEach(form => {
                const fields = {
                    name: form.querySelector('#name'),
                    email: form.querySelector('#email'),
                    phone: form.querySelector('#phone'),
                    service: form.querySelector('#service'),
                    message: form.querySelector('#message'),
                    privacy: form.querySelector('#privacy')
                };
                
                Object.keys(fields).forEach(key => {
                    const field = fields[key];
                    if (!field) return;
                    
                    const errorEl = document.createElement('div');
                    errorEl.className = 'invalid-feedback';
                    errorEl.style.display = 'none';
                    field.parentNode.appendChild(errorEl);
                    
                    field.addEventListener('blur', () => {
                        this.validateField(field, key, errorEl);
                    });
                    
                    field.addEventListener('input', () => {
                        if (errorEl.style.display === 'block') {
                            this.validateField(field, key, errorEl);
                        }
                    });
                });
                
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSubmit(form, fields);
                });
            });
        },
        
        validateField: function(field, type, errorEl) {
            let isValid = true;
            let message = '';
            
            if (type === 'privacy') {
                isValid = field.checked;
                message = this.messages[type];
            } else if (type === 'service') {
                isValid = field.value !== '' && field.value !== 'Wählen Sie einen Service';
                message = this.messages[type];
            } else {
                const value = field.value.trim();
                isValid = this.patterns[type] && this.patterns[type].test(value);
                message = this.messages[type];
            }
            
            if (!isValid) {
                field.classList.add('has-error');
                field.style.borderColor = 'var(--color-error)';
                errorEl.textContent = message;
                errorEl.style.display = 'block';
                return false;
            } else {
                field.classList.remove('has-error');
                field.style.borderColor = '';
                errorEl.style.display = 'none';
                return true;
            }
        },
        
        handleSubmit: function(form, fields) {
            let isFormValid = true;
            
            Object.keys(fields).forEach(key => {
                const field = fields[key];
                if (!field) return;
                
                const errorEl = field.parentNode.querySelector('.invalid-feedback');
                if (!this.validateField(field, key, errorEl)) {
                    isFormValid = false;
                }
            });
            
            if (!isFormValid) {
                Notifications.show('Bitte füllen Sie alle Felder korrekt aus', 'danger');
                return;
            }
            
            const submitBtn = form.querySelector('button[type="submit"]');
            if (!submitBtn) return;
            
            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Wird gesendet...';
            
            setTimeout(() => {
                Notifications.show('Nachricht erfolgreich gesendet!', 'success');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                
                setTimeout(() => {
                    window.location.href = 'thank_you.html';
                }, 1500);
            }, 2000);
        }
    };
    
    const Notifications = {
        container: null,
        
        init: function() {
            if (window.__app.notificationsInit) return;
            window.__app.notificationsInit = true;
            
            this.container = document.createElement('div');
            this.container.className = 'position-fixed top-0 end-0 p-3';
            this.container.style.zIndex = '9999';
            document.body.appendChild(this.container);
        },
        
        show: function(message, type = 'info') {
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show`;
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-20px)';
            alert.style.transition = 'all 0.3s ease-out';
            alert.innerHTML = `
                ${Utils.escapeHtml(message)}
                <button type="button" class="btn-close" aria-label="Close"></button>
            `;
            
            this.container.appendChild(alert);
            
            setTimeout(() => {
                alert.style.opacity = '1';
                alert.style.transform = 'translateY(0)';
            }, 10);
            
            const closeBtn = alert.querySelector('.btn-close');
            closeBtn.addEventListener('click', () => this.remove(alert));
            
            setTimeout(() => this.remove(alert), 5000);
        },
        
        remove: function(alert) {
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        }
    };
    
    const MicroInteractions = {
        init: function() {
            if (window.__app.microInit) return;
            window.__app.microInit = true;
            
            const elements = document.querySelectorAll('.btn, .c-button, .card, .c-card, .nav-link, a');
            
            elements.forEach(el => {
                el.style.transition = 'all 0.3s ease-in-out';
                
                el.addEventListener('mouseenter', () => {
                    if (el.classList.contains('btn') || el.classList.contains('c-button')) {
                        el.style.transform = 'translateY(-2px) scale(1.02)';
                        el.style.boxShadow = 'var(--shadow-md)';
                    } else if (el.classList.contains('card') || el.classList.contains('c-card')) {
                        el.style.transform = 'translateY(-4px)';
                        el.style.boxShadow = 'var(--shadow-lg)';
                    }
                });
                
                el.addEventListener('mouseleave', () => {
                    el.style.transform = '';
                    el.style.boxShadow = '';
                });
                
                el.addEventListener('mousedown', () => {
                    if (el.classList.contains('btn') || el.classList.contains('c-button')) {
                        el.style.transform = 'scale(0.98)';
                    }
                });
                
                el.addEventListener('mouseup', () => {
                    if (el.classList.contains('btn') || el.classList.contains('c-button')) {
                        el.style.transform = 'translateY(-2px) scale(1.02)';
                    }
                });
            });
        }
    };
    
    const RippleEffect = {
        init: function() {
            if (window.__app.rippleInit) return;
            window.__app.rippleInit = true;
            
            const elements = document.querySelectorAll('.btn, .c-button, .nav-link');
            
            elements.forEach(el => {
                el.style.position = 'relative';
                el.style.overflow = 'hidden';
                
                el.addEventListener('click', function(e) {
                    const ripple = document.createElement('span');
                    const rect = this.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    const x = e.clientX - rect.left - size / 2;
                    const y = e.clientY - rect.top - size / 2;
                    
                    ripple.style.width = ripple.style.height = size + 'px';
                    ripple.style.left = x + 'px';
                    ripple.style.top = y + 'px';
                    ripple.style.position = 'absolute';
                    ripple.style.borderRadius = '50%';
                    ripple.style.background = 'rgba(255, 255, 255, 0.6)';
                    ripple.style.transform = 'scale(0)';
                    ripple.style.animation = 'ripple 0.6s ease-out';
                    ripple.style.pointerEvents = 'none';
                    
                    this.appendChild(ripple);
                    
                    setTimeout(() => {
                        ripple.remove();
                    }, 600);
                });
            });
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    const ScrollAnimations = {
        init: function() {
            if (window.__app.scrollAnimInit) return;
            window.__app.scrollAnimInit = true;
            
            const elements = document.querySelectorAll('.card, .c-card, h1, h2, h3, .lead, p, .btn, .c-button');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
            
            elements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
                observer.observe(el);
            });
        }
    };
    
    const CountUp = {
        init: function() {
            if (window.__app.countUpInit) return;
            window.__app.countUpInit = true;
            
            const counters = document.querySelectorAll('[data-count]');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animate(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            counters.forEach(counter => observer.observe(counter));
        },
        
        animate: function(element) {
            const target = parseInt(element.getAttribute('data-count'));
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    element.textContent = target;
                    clearInterval(timer);
                } else {
                    element.textContent = Math.floor(current);
                }
            }, 16);
        }
    };
    
    const Accordion = {
        init: function() {
            if (window.__app.accordionInit) return;
            window.__app.accordionInit = true;
            
            const buttons = document.querySelectorAll('.accordion-button');
            
            buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const target = button.getAttribute('data-bs-target');
                    const collapse = document.querySelector(target);
                    
                    if (!collapse) return;
                    
                    const isExpanded = button.getAttribute('aria-expanded') === 'true';
                    
                    if (isExpanded) {
                        button.setAttribute('aria-expanded', 'false');
                        button.classList.add('collapsed');
                        collapse.classList.remove('show');
                    } else {
                        button.setAttribute('aria-expanded', 'true');
                        button.classList.remove('collapsed');
                        collapse.classList.add('show');
                    }
                });
            });
        }
    };
    
    const PrivacyModal = {
        init: function() {
            if (window.__app.privacyModalInit) return;
            window.__app.privacyModalInit = true;
            
            const privacyLinks = document.querySelectorAll('a[href*="privacy"]');
            
            privacyLinks.forEach(link => {
                if (link.closest('form')) {
                    link.addEventListener('click', (e) => {
                        if (e.ctrlKey || e.metaKey) return;
                        
                        e.preventDefault();
                        window.open(link.href, '_blank', 'width=800,height=600');
                    });
                }
            });
        }
    };
    
    const ScrollToTop = {
        init: function() {
            if (window.__app.scrollTopInit) return;
            window.__app.scrollTopInit = true;
            
            const button = document.createElement('button');
            button.innerHTML = '↑';
            button.className = 'scroll-to-top';
            button.setAttribute('aria-label', 'Nach oben scrollen');
            button.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: var(--color-primary);
                color: white;
                border: none;
                font-size: 24px;
                cursor: pointer;
                opacity: 0;
                transform: scale(0);
                transition: all 0.3s ease-in-out;
                z-index: 1000;
                box-shadow: var(--shadow-lg);
            `;
            
            document.body.appendChild(button);
            
            window.addEventListener('scroll', Utils.throttle(() => {
                if (window.pageYOffset > 300) {
                    button.style.opacity = '1';
                    button.style.transform = 'scale(1)';
                } else {
                    button.style.opacity = '0';
                    button.style.transform = 'scale(0)';
                }
            }, 100));
            
            button.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    };
    
    const Init = {
        run: function() {
            if (window.__app.initialized) return;
            
            BurgerMenu.init();
            SmoothScroll.init();
            ScrollSpy.init();
            ImageAnimations.init();
            Notifications.init();
            FormValidation.init();
            MicroInteractions.init();
            RippleEffect.init();
            ScrollAnimations.init();
            CountUp.init();
            Accordion.init();
            PrivacyModal.init();
            ScrollToTop.init();
            
            window.__app.initialized = true;
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Init.run());
    } else {
        Init.run();
    }
})();
