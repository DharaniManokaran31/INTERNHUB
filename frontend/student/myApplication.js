// Mock applications data
const applicationsData = [
    {
        id: 1,
        title: 'Full Stack Developer Intern',
        company: 'TechCorp',
        logo: 'TC',
        location: 'Bangalore',
        stipend: 25000,
        appliedDate: new Date('2024-01-25'),
        status: 'shortlisted',
        timeline: [
            { event: 'Application Submitted', date: '2024-01-25', completed: true },
            { event: 'Resume Shortlisted', date: '2024-01-28', completed: true },
            { event: 'Interview Scheduled', date: '2024-02-05', completed: false }
        ]
    },
    {
        id: 2,
        title: 'UI/UX Design Intern',
        company: 'DesignStudio',
        logo: 'DS',
        location: 'Remote',
        stipend: 15000,
        appliedDate: new Date('2024-01-28'),
        status: 'pending',
        timeline: [
            { event: 'Application Submitted', date: '2024-01-28', completed: true },
            { event: 'Under Review', date: '', completed: false }
        ]
    },
    {
        id: 3,
        title: 'Data Science Intern',
        company: 'DataMinds',
        logo: 'DM',
        location: 'Pune',
        stipend: 30000,
        appliedDate: new Date('2024-01-20'),
        status: 'rejected',
        timeline: [
            { event: 'Application Submitted', date: '2024-01-20', completed: true },
            { event: 'Application Reviewed', date: '2024-01-24', completed: true },
            { event: 'Not Selected', date: '2024-01-26', completed: true }
        ]
    },
    {
        id: 4,
        title: 'Marketing Intern',
        company: 'MarketPro',
        logo: 'MP',
        location: 'Mumbai',
        stipend: 12000,
        appliedDate: new Date('2024-02-01'),
        status: 'interview',
        timeline: [
            { event: 'Application Submitted', date: '2024-02-01', completed: true },
            { event: 'Resume Shortlisted', date: '2024-02-03', completed: true },
            { event: 'Interview Round 1', date: '2024-02-07', completed: true },
            { event: 'Final Interview', date: '2024-02-10', completed: false }
        ]
    },
    {
        id: 5,
        title: 'Backend Developer Intern',
        company: 'CloudSystems',
        logo: 'CS',
        location: 'Remote',
        stipend: 22000,
        appliedDate: new Date('2024-01-30'),
        status: 'pending',
        timeline: [
            { event: 'Application Submitted', date: '2024-01-30', completed: true },
            { event: 'Under Review', date: '', completed: false }
        ]
    }
];

let displayedApplications = [];
let currentFilter = 'all';
let isLoading = false;

// Status configurations
const statusConfig = {
    pending: {
        label: 'Under Review',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>`
    },
    shortlisted: {
        label: 'Shortlisted',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`
    },
    rejected: {
        label: 'Rejected',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`
    },
    interview: {
        label: 'Interview Scheduled',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>`
    }
};

// Initialize page
function initPage() {
    loadApplicationsData();
    displayedApplications = [...applicationsData];
    loadApplications();
    updateCounts();
    
    // Add click handlers to stats cards
    document.querySelectorAll('.stat-card-small').forEach(card => {
        card.addEventListener('click', function() {
            const status = this.querySelector('.stat-card-info h4').textContent.toLowerCase();
            if (status.includes('total')) filterByStatus('all');
            else if (status.includes('shortlisted')) filterByStatus('shortlisted');
            else if (status.includes('review')) filterByStatus('pending');
            else if (status.includes('rejected')) filterByStatus('rejected');
        });
    });
}

// Load applications data from localStorage
function loadApplicationsData() {
    const savedApplications = JSON.parse(localStorage.getItem('studentApplications') || '[]');
    if (savedApplications.length > 0) {
        // Merge saved applications with mock data
        savedApplications.forEach(saved => {
            const exists = applicationsData.find(app => app.id === saved.internshipId);
            if (!exists && saved.title) {
                applicationsData.push({
                    id: saved.internshipId,
                    title: saved.title,
                    company: saved.company,
                    logo: saved.logo || saved.company.substring(0, 2).toUpperCase(),
                    location: saved.location,
                    stipend: saved.stipend,
                    appliedDate: new Date(saved.appliedDate),
                    status: saved.status || 'pending',
                    timeline: [
                        { event: 'Application Submitted', date: new Date(saved.appliedDate).toLocaleDateString(), completed: true },
                        { event: 'Under Review', date: '', completed: false }
                    ]
                });
            }
        });
    }
}

// Load applications with skeleton loading
function loadApplications() {
    const grid = document.getElementById('applicationsGrid');

    if (isLoading) return;
    isLoading = true;

    // Show skeleton loading
    grid.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
    `;

    // Simulate loading delay
    setTimeout(() => {
        if (displayedApplications.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"></path>
                        </svg>
                    </div>
                    <h3>No applications ${currentFilter !== 'all' ? 'in this category' : 'yet'}</h3>
                    <p>${currentFilter === 'all' ? 'Start applying to internships to track your applications here' : 'You don\'t have any applications with this status yet'}</p>
                    ${currentFilter === 'all' ? `
                        <button class="btn-primary" onclick="window.location.href='browse-internships.html'">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            Browse Internships
                        </button>
                    ` : ''}
                </div>
            `;
        } else {
            grid.innerHTML = displayedApplications.map(app => createApplicationCard(app)).join('');
        }

        isLoading = false;
    }, 300); // Reduced loading time
}

// Create application card
function createApplicationCard(app) {
    const config = statusConfig[app.status];
    const relativeDate = getRelativeTime(app.appliedDate);

    return `
        <div class="application-card">
            <div class="app-card-header">
                <div class="app-company-info">
                    <div class="app-company-logo">${app.logo}</div>
                    <div class="app-details">
                        <h3 class="app-title">${app.title}</h3>
                        <p class="app-company-name">${app.company}</p>
                        <div class="app-meta">
                            <div class="app-meta-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                ${app.location}
                            </div>
                            <div class="app-meta-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="1" x2="12" y2="23"></line>
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                </svg>
                                ₹${app.stipend.toLocaleString()}/month
                            </div>
                            <div class="app-meta-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                Applied ${relativeDate}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="app-status-badge ${app.status}">
                    ${config.icon}
                    ${config.label}
                </div>
            </div>

            <div class="app-timeline">
                ${app.timeline.map(item => `
                    <div class="timeline-item">
                        <div class="timeline-dot ${item.completed ? 'completed' : item.date ? 'active' : 'inactive'}"></div>
                        <span class="timeline-text"><strong>${item.event}</strong></span>
                        ${item.date ? `<span class="timeline-date">${item.date}</span>` : ''}
                    </div>
                `).join('')}
            </div>

            <div class="app-card-footer">
                <div class="app-actions">
                    <button class="btn-secondary" onclick="viewApplicationDetails(${app.id})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View Details
                    </button>
                    ${app.status === 'pending' || app.status === 'shortlisted' ? `
                        <button class="btn-danger" onclick="withdrawApplication(${app.id})">
                            Withdraw Application
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// Filter by status
function filterByStatus(status) {
    currentFilter = status;

    // Update active tab
    document.querySelectorAll('.status-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-status="${status}"]`).classList.add('active');

    // Filter applications
    if (status === 'all') {
        displayedApplications = [...applicationsData];
    } else {
        displayedApplications = applicationsData.filter(app => app.status === status);
    }

    loadApplications();
}

// View application details - FIXED CLOSE BUTTON
function viewApplicationDetails(id) {
    const app = applicationsData.find(a => a.id === id);
    if (!app) return;

    const modal = document.createElement('div');
    modal.id = 'applicationModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 1rem;
        animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
        <div class="modal-content" style="background: white; border-radius: 16px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative;">
            <button class="close-modal" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; cursor: pointer; padding: 0.5rem; z-index: 10001;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div style="padding: 2rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="width: 56px; height: 56px; border-radius: 10px; background: linear-gradient(135deg, #f3f4f6, #e5e7eb); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.25rem; color: #2440F0;">
                        ${app.logo}
                    </div>
                    <div>
                        <h2 style="font-size: 1.5rem; font-weight: 700; color: #000; margin-bottom: 0.5rem;">${app.title}</h2>
                        <p style="font-size: 1.125rem; color: #666;">${app.company} • ${app.location}</p>
                    </div>
                </div>

                <div style="margin-bottom: 2rem;">
                    <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: #000;">Application Status</h3>
                    <div style="padding: 1rem; background: #f8fafc; border-radius: 8px;">
                        ${app.timeline.map(item => `
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; padding: 0.5rem; border-radius: 6px; background: ${item.completed ? 'rgba(16, 185, 129, 0.1)' : 'white'}; transition: all 0.2s ease;">
                                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${item.completed ? '#10b981' : '#d1d5db'};"></div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: #000;">${item.event}</div>
                                    ${item.date ? `<div style="font-size: 0.875rem; color: #666;">${item.date}</div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="modal-close-btn" style="padding: 0.75rem 1.5rem; border: 1px solid #d1d5db; background: white; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='#f3f4f6'">
                        Close
                    </button>
                    ${app.status === 'pending' || app.status === 'shortlisted' ? `
                        <button class="modal-withdraw-btn" style="padding: 0.75rem 1.5rem; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='#b91c1c'">
                            Withdraw Application
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // Add event listeners for closing
    const closeBtn = modal.querySelector('.close-modal');
    const closeModalBtn = modal.querySelector('.modal-close-btn');
    const withdrawBtn = modal.querySelector('.modal-withdraw-btn');
    
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    closeModalBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', () => {
            withdrawApplicationModal(id);
        });
    }
    
    // Close when clicking outside modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Close with Escape key
    const closeModalHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeModalHandler);
        }
    };
    document.addEventListener('keydown', closeModalHandler);
    
    // Clean up event listener when modal is removed
    modal.addEventListener('DOMNodeRemoved', () => {
        document.removeEventListener('keydown', closeModalHandler);
    });
}

// Withdraw application
function withdrawApplication(id) {
    if (confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
        const index = applicationsData.findIndex(app => app.id === id);
        if (index !== -1) {
            applicationsData.splice(index, 1);
            filterByStatus(currentFilter);
            updateCounts();
            showNotification('Application withdrawn successfully');
        }
    }
}

// Withdraw from modal
function withdrawApplicationModal(id) {
    const modal = document.getElementById('applicationModal');
    if (modal) {
        modal.remove();
    }
    withdrawApplication(id);
}

// Update counts
function updateCounts() {
    const total = applicationsData.length;
    const pending = applicationsData.filter(a => a.status === 'pending').length;
    const shortlisted = applicationsData.filter(a => a.status === 'shortlisted').length;
    const interview = applicationsData.filter(a => a.status === 'interview').length;
    const rejected = applicationsData.filter(a => a.status === 'rejected').length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('shortlistedCount').textContent = shortlisted;
    document.getElementById('rejectedCount').textContent = rejected;

    document.getElementById('badgeAll').textContent = total;
    document.getElementById('badgePending').textContent = pending;
    document.getElementById('badgeShortlisted').textContent = shortlisted;
    document.getElementById('badgeInterview').textContent = interview;
    document.getElementById('badgeRejected').textContent = rejected;
}

// Get relative time
function getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? '' : 's'} ago`;
    return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? '' : 's'} ago`;
}

// Show notification
function showNotification(message) {
    document.querySelectorAll('.custom-notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'notificationSlideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// User dropdown toggle
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('userDropdown');
    const userProfile = document.querySelector('.user-profile');
    
    if (dropdown && userProfile) {
        const isClickInsideDropdown = dropdown.contains(event.target);
        const isClickOnProfile = userProfile.contains(event.target);
        
        if (!isClickInsideDropdown && !isClickOnProfile) {
            dropdown.classList.remove('show');
        }
    }
});

// Update user profile info from localStorage
function updateUserProfile() {
    const userData = getUserData();
    document.getElementById('userName').textContent = userData.name || 'Demo Student';
    document.getElementById('userEmail').textContent = userData.email || 'demo@student.com';
}

// Update the initPage function to include user profile
function initPage() {
    loadResumeData();
    setupPersonalInfoListeners();
    setupAutoSave();
    setupDragAndDrop();
    updateUserProfile(); // Add this line
    renderAll();
    updateProgress();
}

// Common JavaScript - Mobile menu, navigation, etc.
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

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = e.target.value.toLowerCase().trim();
                if (searchTerm) {
                    displayedApplications = applicationsData.filter(app =>
                        app.title.toLowerCase().includes(searchTerm) ||
                        app.company.toLowerCase().includes(searchTerm) ||
                        app.location.toLowerCase().includes(searchTerm)
                    );
                } else {
                    displayedApplications = currentFilter === 'all'
                        ? [...applicationsData]
                        : applicationsData.filter(app => app.status === currentFilter);
                }
                loadApplications();
            }, 300); // Debounce search
        });
    }
}

function initNotifications() {
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            showNotification('You have no new notifications');
            const badge = notificationBtn.querySelector('.notification-badge');
            if (badge) {
                badge.style.opacity = '0';
                setTimeout(() => badge.remove(), 300);
            }
        });
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('studentSession');
        showNotification('Logged out successfully!');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
}

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

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initSearch();
    initNotifications();
    updateUserProfile();
    initPage();

    // Faster loading
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 50);
});

// Initial fade effect
document.body.style.opacity = '1';
document.body.style.transition = 'opacity 0.2s ease';