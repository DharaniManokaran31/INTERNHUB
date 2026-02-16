// Dashboard JavaScript - All visual effects from Browse Internships

// Mobile menu toggle - FROM BROWSE INTERNSHIPS
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }
}

// Active navigation highlighting
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    // Set active based on current page
    const currentPage = window.location.pathname.split('/').pop();
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.includes(currentPage)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
            }

            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Close mobile menu on navigation
            if (window.innerWidth <= 1024) {
                const sidebar = document.getElementById('sidebar');
                const sidebarOverlay = document.getElementById('sidebarOverlay');
                if (sidebar && sidebarOverlay) {
                    sidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                }
            }
        });
    });
}

// Search functionality with debouncing - FROM BROWSE INTERNSHIPS
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBar = document.querySelector('.search-bar');
    const keyboardHint = document.getElementById('keyboardHint');

    if (searchInput) {
        // Debounced search (300ms delay)
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(searchInput.value);
            }, 300);
        });

        // Handle Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(searchInput.value);
            }
        });

        // Focus search on "/" key - FROM BROWSE INTERNSHIPS
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                searchInput.focus();
                
                // Show keyboard hint
                if (keyboardHint) {
                    keyboardHint.classList.add('show');
                    setTimeout(() => {
                        keyboardHint.classList.remove('show');
                    }, 2000);
                }
            }
            
            // Escape key clears search
            if (e.key === 'Escape' && document.activeElement === searchInput) {
                searchInput.value = '';
                performSearch('');
            }
        });
    }
}

function performSearch(query) {
    console.log('Searching for:', query);
    // In a real app, this would redirect to browse internships page with search
    if (query.trim()) {
        window.location.href = `browseInternship.html?search=${encodeURIComponent(query)}`;
    } else {
        window.location.href = 'browseInternship.html';
    }
}

// Ripple effect for buttons - FROM BROWSE INTERNSHIPS
function initRippleEffects() {
    const buttons = document.querySelectorAll('.primary-btn, .secondary-btn, .notification-btn');

    buttons.forEach(button => {
        button.addEventListener('click', function (e) {
            createRippleEffect(this, e);
        });
    });
}

function createRippleEffect(button, event) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Notification button click handler - FROM BROWSE INTERNSHIPS
function initNotifications() {
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            showNotification('You have no new notifications');
            const badge = notificationBtn.querySelector('.notification-badge');
            if (badge) {
                badge.style.opacity = '0';
                setTimeout(() => {
                    badge.remove();
                }, 300);
            }
        });
    }
}

// Show notification - FROM BROWSE INTERNSHIPS
function showNotification(message) {
    // Remove existing notifications
    document.querySelectorAll('.custom-notification').forEach(n => n.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #2440F0, #0B1DC1);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(36, 64, 240, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-family: inherit;
        font-size: 0.9375rem;
        font-weight: 500;
        max-width: 300px;
    `;
    notification.textContent = message;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 3000);
}

// Logout functionality
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        console.log('User logged out');
        localStorage.removeItem('studentSession');
        showNotification('You have been logged out successfully!');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Get stored user data
function getUserData() {
    const userData = localStorage.getItem('studentSession');
    if (userData) {
        return JSON.parse(userData);
    }
    return {
        name: 'Demo Student',
        email: 'demo@student.com',
        initials: 'DS'
    };
}

// Update user profile display
function updateUserProfile() {
    const userData = getUserData();
    const userNameElements = document.querySelectorAll('.user-name-sidebar');
    const userAvatarElements = document.querySelectorAll('.user-avatar-sidebar');

    userNameElements.forEach(el => {
        el.textContent = userData.name;
    });

    userAvatarElements.forEach(el => {
        el.textContent = userData.initials;
    });
}

// Dynamic greeting based on time
function updateGreeting() {
    const hour = new Date().getHours();
    const element = document.getElementById('greeting');
    const userData = getUserData();
    const firstName = userData.name.split(' ')[0];

    let greeting = 'Welcome back';

    if (hour < 12) {
        greeting = 'Good morning';
    } else if (hour < 18) {
        greeting = 'Good afternoon';
    } else {
        greeting = 'Good evening';
    }

    if (element) {
        element.textContent = `${greeting}, ${firstName}!`;
    }
}

// Initialize all common functionality
function initCommon() {
    initMobileMenu();
    initNavigation();
    initSearch();
    initRippleEffects();
    initNotifications();
    updateUserProfile();
    updateGreeting();
}

// Dashboard specific JavaScript

// Get application statistics
function getApplicationStats() {
    const applications = JSON.parse(localStorage.getItem('studentApplications') || '[]');

    return {
        total: applications.length,
        shortlisted: applications.filter(app => app.status === 'shortlisted').length,
        pending: applications.filter(app => app.status === 'pending').length
    };
}

// Update stat cards
function updateStatCards() {
    const stats = getApplicationStats();

    // Update values
    document.getElementById('totalApplications').textContent = stats.total;
    document.getElementById('shortlistedCount').textContent = stats.shortlisted;
    document.getElementById('pendingCount').textContent = stats.pending;
}

// Navigation functions
function browseInternships() {
    window.location.href = 'browseInternship.html';
}

function viewAllApplications() {
    window.location.href = 'myApplication.html';
}

// Initialize dashboard
function initDashboard() {
    updateStatCards();
}

// Run when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initCommon();
    initDashboard();

    // Add loading effect on initial load
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Initial page load effect
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.3s ease';
