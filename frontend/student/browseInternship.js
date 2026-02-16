// Enhanced sample internships data
const internshipsData = [
    {
        id: 1,
        title: 'Full Stack Developer Intern',
        company: 'TechCorp',
        logo: 'TC',
        location: 'Bangalore',
        type: 'Full-time',
        duration: 6,
        category: 'technology',
        stipend: 25000,
        description: 'Work on cutting-edge web applications using React, Node.js, and MongoDB. Learn from experienced developers and contribute to real-world projects.',
        skills: [
            { name: 'React', level: 'intermediate' },
            { name: 'Node.js', level: 'intermediate' },
            { name: 'MongoDB', level: 'beginner' },
            { name: 'JavaScript', level: 'intermediate' }
        ],
        requirements: [
            'Currently enrolled in a Computer Science program',
            'Basic knowledge of JavaScript and web development',
            'Familiarity with Git and version control'
        ],
        perks: ['Flexible hours', 'Mentorship program', 'Certificate of completion', 'Free snacks'],
        postedDate: new Date('2024-02-01'),
        applied: false,
        bookmarked: false
    },
    {
        id: 2,
        title: 'UI/UX Design Intern',
        company: 'DesignStudio',
        logo: 'DS',
        location: 'Remote',
        type: 'Remote',
        duration: 3,
        category: 'design',
        stipend: 15000,
        description: 'Create beautiful user interfaces and experiences for mobile and web applications. Work with Figma, Adobe XD, and collaborate with product teams.',
        skills: [
            { name: 'Figma', level: 'intermediate' },
            { name: 'Adobe XD', level: 'beginner' },
            { name: 'Prototyping', level: 'intermediate' },
            { name: 'Wireframing', level: 'beginner' }
        ],
        requirements: [
            'Portfolio of design work',
            'Understanding of design principles',
            'Excellent communication skills'
        ],
        perks: ['Remote work', 'Design software provided', 'Portfolio review', 'Networking events'],
        postedDate: new Date('2024-02-03'),
        applied: false,
        bookmarked: false
    },
    {
        id: 3,
        title: 'Digital Marketing Intern',
        company: 'MarketPro',
        logo: 'MP',
        location: 'Mumbai',
        type: 'Full-time',
        duration: 4,
        category: 'marketing',
        stipend: 12000,
        description: 'Learn digital marketing strategies including SEO, SEM, social media marketing, and content creation. Hands-on experience with marketing tools.',
        skills: [
            { name: 'SEO', level: 'beginner' },
            { name: 'Social Media', level: 'intermediate' },
            { name: 'Content Writing', level: 'intermediate' },
            { name: 'Analytics', level: 'beginner' }
        ],
        requirements: [
            'Strong writing skills',
            'Social media savvy',
            'Creative mindset'
        ],
        perks: ['Marketing certification', 'Industry exposure', 'Team events', 'Skill development'],
        postedDate: new Date('2024-02-02'),
        applied: false,
        bookmarked: false
    },
    {
        id: 4,
        title: 'Data Science Intern',
        company: 'DataMinds',
        logo: 'DM',
        location: 'Pune',
        type: 'Full-time',
        duration: 6,
        category: 'technology',
        stipend: 30000,
        description: 'Work on machine learning projects, data analysis, and predictive modeling. Use Python, TensorFlow, and work with large datasets.',
        skills: [
            { name: 'Python', level: 'intermediate' },
            { name: 'Machine Learning', level: 'advanced' },
            { name: 'TensorFlow', level: 'beginner' },
            { name: 'Data Analysis', level: 'intermediate' }
        ],
        requirements: [
            'Strong mathematical background',
            'Python programming experience',
            'Understanding of ML algorithms'
        ],
        perks: ['Research opportunities', 'Conference attendance', 'High stipend', 'Career guidance'],
        postedDate: new Date('2024-02-04'),
        applied: false,
        bookmarked: false
    },
    {
        id: 5,
        title: 'Content Writer Intern',
        company: 'ContentHub',
        logo: 'CH',
        location: 'Remote',
        type: 'Part-time',
        duration: 3,
        category: 'marketing',
        stipend: 8000,
        description: 'Create engaging content for blogs, social media, and websites. Learn SEO writing and content strategy from experienced writers.',
        skills: [
            { name: 'Writing', level: 'intermediate' },
            { name: 'SEO', level: 'beginner' },
            { name: 'Research', level: 'intermediate' },
            { name: 'Editing', level: 'beginner' }
        ],
        requirements: [
            'Excellent writing skills',
            'Attention to detail',
            'Ability to meet deadlines'
        ],
        perks: ['Flexible schedule', 'Portfolio building', 'Editor feedback', 'Remote work'],
        postedDate: new Date('2024-02-05'),
        applied: false,
        bookmarked: false
    },
    {
        id: 6,
        title: 'Business Analyst Intern',
        company: 'BizConsult',
        logo: 'BC',
        location: 'Delhi',
        type: 'Full-time',
        duration: 5,
        category: 'finance',
        stipend: 20000,
        description: 'Analyze business processes, create reports, and work on strategic projects. Learn data visualization and business intelligence tools.',
        skills: [
            { name: 'Excel', level: 'intermediate' },
            { name: 'PowerBI', level: 'beginner' },
            { name: 'Analysis', level: 'intermediate' },
            { name: 'SQL', level: 'beginner' }
        ],
        requirements: [
            'Analytical mindset',
            'Problem-solving skills',
            'Basic Excel knowledge'
        ],
        perks: ['Corporate exposure', 'Analytics training', 'Networking', 'Career path'],
        postedDate: new Date('2024-01-30'),
        applied: false,
        bookmarked: false
    },
    {
        id: 7,
        title: 'Mobile App Developer Intern',
        company: 'AppWorks',
        logo: 'AW',
        location: 'Hyderabad',
        type: 'Full-time',
        duration: 6,
        category: 'technology',
        stipend: 22000,
        description: 'Develop mobile applications for Android and iOS using React Native. Work on real client projects and learn mobile development best practices.',
        skills: [
            { name: 'React Native', level: 'intermediate' },
            { name: 'JavaScript', level: 'intermediate' },
            { name: 'Mobile Dev', level: 'beginner' },
            { name: 'APIs', level: 'beginner' }
        ],
        requirements: [
            'Basic programming knowledge',
            'Interest in mobile development',
            'Problem-solving attitude'
        ],
        perks: ['App store publishing', 'Code review', 'Mobile dev workshop', 'Team collaboration'],
        postedDate: new Date('2024-02-06'),
        applied: false,
        bookmarked: false
    },
    {
        id: 8,
        title: 'Graphic Design Intern',
        company: 'Creative Labs',
        logo: 'CL',
        location: 'Bangalore',
        type: 'Part-time',
        duration: 3,
        category: 'design',
        stipend: 10000,
        description: 'Design graphics for marketing campaigns, social media, and brand materials. Work with Adobe Creative Suite and learn brand design.',
        skills: [
            { name: 'Photoshop', level: 'intermediate' },
            { name: 'Illustrator', level: 'beginner' },
            { name: 'Branding', level: 'beginner' },
            { name: 'Typography', level: 'intermediate' }
        ],
        requirements: [
            'Creative portfolio',
            'Adobe Creative Suite basics',
            'Eye for design'
        ],
        perks: ['Design software', 'Creative freedom', 'Portfolio pieces', 'Flexible hours'],
        postedDate: new Date('2024-02-07'),
        applied: false,
        bookmarked: false
    },
    {
        id: 9,
        title: 'HR Intern',
        company: 'PeopleFirst',
        logo: 'PF',
        location: 'Mumbai',
        type: 'Full-time',
        duration: 4,
        category: 'hr',
        stipend: 15000,
        description: 'Assist with recruitment, employee engagement, and HR operations. Learn HR best practices and work with HRIS systems.',
        skills: [
            { name: 'Recruitment', level: 'beginner' },
            { name: 'Communication', level: 'intermediate' },
            { name: 'HR Operations', level: 'beginner' },
            { name: 'Onboarding', level: 'beginner' }
        ],
        requirements: [
            'Excellent communication skills',
            'Organizational abilities',
            'Interest in HR'
        ],
        perks: ['HR certification prep', 'Recruitment experience', 'Corporate culture', 'Networking'],
        postedDate: new Date('2024-01-28'),
        applied: false,
        bookmarked: false
    },
    {
        id: 10,
        title: 'Sales & Business Development Intern',
        company: 'GrowthCo',
        logo: 'GC',
        location: 'Delhi',
        type: 'Full-time',
        duration: 5,
        category: 'sales',
        stipend: 18000,
        description: 'Generate leads, close deals, and build client relationships. Learn sales strategies and CRM tools in a fast-paced environment.',
        skills: [
            { name: 'Sales', level: 'beginner' },
            { name: 'Communication', level: 'intermediate' },
            { name: 'CRM', level: 'beginner' },
            { name: 'Negotiation', level: 'beginner' }
        ],
        requirements: [
            'Confident communicator',
            'Goal-oriented mindset',
            'Basic computer skills'
        ],
        perks: ['Commission opportunities', 'Sales training', 'Client exposure', 'Career growth'],
        postedDate: new Date('2024-02-08'),
        applied: false,
        bookmarked: false
    },
    {
        id: 11,
        title: 'Cybersecurity Intern',
        company: 'SecureNet',
        logo: 'SN',
        location: 'Remote',
        type: 'Remote',
        duration: 6,
        category: 'technology',
        stipend: 28000,
        description: 'Learn about network security, ethical hacking, and security auditing. Work on real security projects and earn certifications.',
        skills: [
            { name: 'Security', level: 'advanced' },
            { name: 'Network', level: 'intermediate' },
            { name: 'Ethical Hacking', level: 'beginner' },
            { name: 'Linux', level: 'intermediate' }
        ],
        requirements: [
            'Networking fundamentals',
            'Interest in security',
            'Problem-solving skills'
        ],
        perks: ['Security certification', 'Hands-on projects', 'Remote work', 'Industry mentors'],
        postedDate: new Date('2024-02-09'),
        applied: false,
        bookmarked: false
    },
    {
        id: 12,
        title: 'Financial Analyst Intern',
        company: 'FinanceHub',
        logo: 'FH',
        location: 'Pune',
        type: 'Full-time',
        duration: 5,
        category: 'finance',
        stipend: 23000,
        description: 'Analyze financial data, create models, and assist with investment research. Learn financial modeling and valuation techniques.',
        skills: [
            { name: 'Finance', level: 'intermediate' },
            { name: 'Excel', level: 'advanced' },
            { name: 'Modeling', level: 'beginner' },
            { name: 'Analysis', level: 'intermediate' }
        ],
        requirements: [
            'Finance/Accounting background',
            'Advanced Excel skills',
            'Analytical thinking'
        ],
        perks: ['Financial modeling training', 'Industry exposure', 'Mentorship', 'Career path'],
        postedDate: new Date('2024-02-10'),
        applied: false,
        bookmarked: false
    }
];

// State management
let displayedInternships = [];
let currentPage = 1;
const itemsPerPage = 6;
let isLoading = false;
let searchTimeout;

// Active filters state
let activeFilters = {
    location: '',
    types: [],
    duration: '',
    category: '',
    stipend: '',
    levels: []
};

// Initialize page
function initPage() {
    displayedInternships = [...internshipsData];
    loadInternships();
    loadApplications();
    loadBookmarks();
    updateResultsCount();
    updateActiveFiltersDisplay();
    updateFilterCounts();
}

// Load internships with skeleton loading
function loadInternships() {
    const internshipsList = document.getElementById('internshipsList');
    const startIndex = 0;
    const endIndex = currentPage * itemsPerPage;
    const internshipsToShow = displayedInternships.slice(startIndex, endIndex);

    if (isLoading) return;
    isLoading = true;

    // Show skeleton loading
    if (currentPage === 1) {
        internshipsList.innerHTML = `
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        `;
    }

    // Simulate API delay
    setTimeout(() => {
        if (internshipsToShow.length === 0) {
            internshipsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </div>
                    <h3>No internships found</h3>
                    <p>Try adjusting your filters to see more results</p>
                    <div class="empty-state-actions">
                        <button class="primary-btn" onclick="clearAllFilters()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 3v18h18"></path>
                                <path d="m7 13 4-4 4 4 6-6"></path>
                                <path d="M21 3v6h-6"></path>
                            </svg>
                            Clear All Filters
                        </button>
                        <button class="primary-btn" onclick="window.location.reload()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                <path d="M3 3v5h5"></path>
                                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                                <path d="M16 16h5v5"></path>
                            </svg>
                            Refresh Page
                        </button>
                    </div>
                </div>
            `;
            document.getElementById('loadMoreContainer').style.display = 'none';
        } else {
            internshipsList.innerHTML = internshipsToShow.map(internship => createInternshipCard(internship)).join('');

            // Show/hide load more button
            const loadMoreContainer = document.getElementById('loadMoreContainer');
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (endIndex >= displayedInternships.length) {
                loadMoreContainer.style.display = 'none';
            } else {
                loadMoreContainer.style.display = 'block';
                loadMoreBtn.disabled = false;
                loadMoreBtn.textContent = 'Load More Internships';
            }

            // Add event listeners
            attachEventListeners();
        }
        
        isLoading = false;
    }, 800);
}

// Create internship card HTML with enhanced features
function createInternshipCard(internship) {
    const bookmarkedClass = internship.bookmarked ? 'bookmarked' : '';
    const appliedClass = internship.applied ? 'applied' : '';
    const appliedText = internship.applied ? 'Applied' : 'Apply Now';
    const relativeTime = getRelativeTime(internship.postedDate);
    
    // Get skill levels for filtering
    const skillLevels = [...new Set(internship.skills.map(skill => skill.level))];
    const levelClasses = skillLevels.map(level => `level-${level}`).join(' ');

    return `
        <div class="internship-card" data-id="${internship.id}" tabindex="0" role="button" aria-label="View details for ${internship.title} at ${internship.company}">
            <div class="card-header">
                <div class="company-info">
                    <div class="company-logo" aria-label="${internship.company} logo">${internship.logo}</div>
                    <div class="internship-details">
                        <h3 class="internship-title">${internship.title}</h3>
                        <p class="company-name">${internship.company}</p>
                        <div class="internship-meta">
                            <div class="meta-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                ${internship.location}
                            </div>
                            <div class="meta-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                ${internship.duration} months
                            </div>
                            <div class="meta-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                ${internship.type}
                            </div>
                        </div>
                        <div class="posted-time">${relativeTime}</div>
                    </div>
                </div>
                <button class="bookmark-btn ${bookmarkedClass}" data-id="${internship.id}" aria-label="${internship.bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                </button>
            </div>
            <p class="card-description">${internship.description}</p>
            <div class="card-tags">
                ${internship.skills.map((skill, index) => `
                    <span class="tag ${index === 0 ? 'primary' : ''} ${levelClasses}" aria-label="${skill.name} skill, ${skill.level} level">${skill.name}</span>
                `).join('')}
            </div>
            <div class="card-footer">
                <div class="stipend">₹${internship.stipend.toLocaleString()}/month</div>
                <button class="apply-btn ${appliedClass}" data-id="${internship.id}" aria-label="${appliedText} to ${internship.title}">${appliedText}</button>
            </div>
        </div>
    `;
}

// Attach event listeners to dynamic elements
function attachEventListeners() {
    // Bookmark buttons
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            toggleBookmark(id, btn);
        });
    });

    // Apply buttons
    document.querySelectorAll('.apply-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            applyToInternship(id, btn);
        });
    });

    // Card clicks
    document.querySelectorAll('.internship-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                const id = parseInt(card.dataset.id);
                viewInternshipDetails(id);
            }
        });
        
        // Keyboard support
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const id = parseInt(card.dataset.id);
                viewInternshipDetails(id);
            }
        });
    });
}

// Toggle bookmark with ripple effect
function toggleBookmark(id, btn) {
    const internship = internshipsData.find(i => i.id === id);
    if (internship) {
        internship.bookmarked = !internship.bookmarked;
        btn.classList.toggle('bookmarked');
        
        // Ripple effect
        createRippleEffect(btn);
        
        // Save to localStorage
        saveBookmarks();
        
        const message = internship.bookmarked ? 'Added to bookmarks' : 'Removed from bookmarks';
        showNotification(message);
    }
}

// Apply to internship
function applyToInternship(id, btn) {
    const internship = internshipsData.find(i => i.id === id);
    if (internship && !internship.applied) {
        internship.applied = true;
        btn.classList.add('applied');
        btn.textContent = 'Applied';
        btn.setAttribute('aria-label', `Applied to ${internship.title}`);
        
        // Ripple effect
        createRippleEffect(btn);
        
        // Save application
        saveApplication(internship);
        
        showNotification('Application submitted successfully!');
    }
}

// View internship details - FIXED CLOSE BUTTON
function viewInternshipDetails(id) {
    const internship = displayedInternships.find(i => i.id === id);
    if (internship) {
        // Create modal for detailed view
        const modal = document.createElement('div');
        modal.id = 'internshipModal';
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
            <div class="modal-content" style="background: white; border-radius: 16px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative;">
                <button class="close-modal" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; cursor: pointer; padding: 0.5rem; z-index: 10001;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div style="padding: 2rem;">
                    <div style="margin-bottom: 1.5rem;">
                        <h2 style="font-size: 1.5rem; font-weight: 700; color: #000; margin-bottom: 0.5rem;">${internship.title}</h2>
                        <p style="font-size: 1.125rem; color: #666;">${internship.company}</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 12px;">
                        <div>
                            <div style="font-size: 0.875rem; color: #666; margin-bottom: 0.25rem;">Location</div>
                            <div style="font-weight: 600;">${internship.location}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: #666; margin-bottom: 0.25rem;">Duration</div>
                            <div style="font-weight: 600;">${internship.duration} months</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: #666; margin-bottom: 0.25rem;">Stipend</div>
                            <div style="font-weight: 600;">₹${internship.stipend.toLocaleString()}/month</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: #666; margin-bottom: 0.25rem;">Type</div>
                            <div style="font-weight: 600;">${internship.type}</div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Description</h3>
                        <p style="color: #1f2937; line-height: 1.6;">${internship.description}</p>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Skills Required</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${internship.skills.map(skill => `
                                <span style="padding: 0.375rem 0.75rem; background: #EEF2FF; color: #2440F0; border-radius: 6px; font-size: 0.875rem;">
                                    ${skill.name} (${skill.level})
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Requirements</h3>
                        <ul style="color: #1f2937; padding-left: 1.5rem;">
                            ${internship.requirements.map(req => `<li style="margin-bottom: 0.5rem;">${req}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Perks & Benefits</h3>
                        <ul style="color: #1f2937; padding-left: 1.5rem;">
                            ${internship.perks.map(perk => `<li style="margin-bottom: 0.5rem;">${perk}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button class="modal-close-btn" style="padding: 0.75rem 1.5rem; border: 1px solid #d1d5db; background: white; border-radius: 8px; cursor: pointer;">
                            Close
                        </button>
                        <button class="modal-apply-btn" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #2440F0, #0B1DC1); color: white; border: none; border-radius: 8px; cursor: pointer;">
                            ${internship.applied ? 'Applied' : 'Apply Now'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners for closing
        const closeBtn = modal.querySelector('.close-modal');
        const closeModalBtn = modal.querySelector('.modal-close-btn');
        const applyBtn = modal.querySelector('.modal-apply-btn');
        
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        closeModalBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        applyBtn.addEventListener('click', () => {
            applyToInternshipModal(id);
        });
        
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
}

// Apply from modal
function applyToInternshipModal(id) {
    const btn = document.querySelector(`.apply-btn[data-id="${id}"]`);
    if (btn) {
        applyToInternship(id, btn);
        const modal = document.getElementById('internshipModal');
        if (modal) {
            modal.remove();
        }
    }
}

// Apply filters with debouncing
function applyFilters() {
    // Clear existing timeout
    clearTimeout(searchTimeout);
    
    // Set new timeout
    searchTimeout = setTimeout(() => {
        // Update active filters state
        activeFilters = {
            location: document.getElementById('locationFilter').value,
            types: Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked')).map(cb => cb.value),
            duration: document.getElementById('durationFilter').value,
            category: document.getElementById('categoryFilter').value,
            stipend: document.getElementById('stipendFilter').value,
            levels: Array.from(document.querySelectorAll('#skillLevelFilter input[type="checkbox"]:checked')).map(cb => cb.value)
        };

        displayedInternships = internshipsData.filter(internship => {
            // Location filter
            if (activeFilters.location && internship.location.toLowerCase() !== activeFilters.location) return false;

            // Type filter
            if (activeFilters.types.length > 0) {
                const internshipType = internship.type.toLowerCase();
                if (!activeFilters.types.some(type => internshipType.includes(type))) return false;
            }

            // Duration filter
            if (activeFilters.duration) {
                const months = internship.duration;
                if (activeFilters.duration === '1-3' && (months < 1 || months > 3)) return false;
                if (activeFilters.duration === '3-6' && (months < 3 || months > 6)) return false;
                if (activeFilters.duration === '6+' && months < 6) return false;
            }

            // Category filter
            if (activeFilters.category && internship.category !== activeFilters.category) return false;

            // Stipend filter
            if (activeFilters.stipend && internship.stipend < parseInt(activeFilters.stipend)) return false;

            // Skill level filter
            if (activeFilters.levels.length > 0) {
                const skillLevels = [...new Set(internship.skills.map(skill => skill.level))];
                if (!activeFilters.levels.some(level => skillLevels.includes(level))) return false;
            }

            // Search filter
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            if (searchTerm) {
                const matchesSearch = 
                    internship.title.toLowerCase().includes(searchTerm) ||
                    internship.company.toLowerCase().includes(searchTerm) ||
                    internship.description.toLowerCase().includes(searchTerm) ||
                    internship.skills.some(skill => skill.name.toLowerCase().includes(searchTerm)) ||
                    internship.requirements.some(req => req.toLowerCase().includes(searchTerm));
                if (!matchesSearch) return false;
            }

            return true;
        });

        currentPage = 1;
        loadInternships();
        updateResultsCount();
        updateActiveFiltersDisplay();
    }, 300);
}

// Clear all filters
function clearAllFilters() {
    document.getElementById('locationFilter').value = '';
    document.getElementById('durationFilter').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('stipendFilter').value = '';
    document.getElementById('searchInput').value = '';
    
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    activeFilters = {
        location: '',
        types: [],
        duration: '',
        category: '',
        stipend: '',
        levels: []
    };

    applyFilters();
}

// Update active filters display
function updateActiveFiltersDisplay() {
    const activeFiltersContainer = document.getElementById('activeFilters');
    const chips = [];
    
    // Location filter
    if (activeFilters.location) {
        chips.push(createFilterChip('location', activeFilters.location, 'Location'));
    }
    
    // Type filters
    activeFilters.types.forEach(type => {
        chips.push(createFilterChip('type', type, 'Type'));
    });
    
    // Duration filter
    if (activeFilters.duration) {
        let displayText = activeFilters.duration;
        if (displayText === '1-3') displayText = '1-3 months';
        if (displayText === '3-6') displayText = '3-6 months';
        if (displayText === '6+') displayText = '6+ months';
        chips.push(createFilterChip('duration', activeFilters.duration, displayText));
    }
    
    // Category filter
    if (activeFilters.category) {
        chips.push(createFilterChip('category', activeFilters.category, 'Category'));
    }
    
    // Stipend filter
    if (activeFilters.stipend) {
        chips.push(createFilterChip('stipend', activeFilters.stipend, `Min ₹${activeFilters.stipend}`));
    }
    
    // Level filters
    activeFilters.levels.forEach(level => {
        chips.push(createFilterChip('level', level, level.charAt(0).toUpperCase() + level.slice(1)));
    });
    
    if (chips.length > 0) {
        activeFiltersContainer.innerHTML = chips.join('');
        activeFiltersContainer.classList.remove('hidden');
        
        // Add remove event listeners
        document.querySelectorAll('.filter-chip-remove').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.dataset.type;
                const value = this.dataset.value;
                removeFilter(type, value);
            });
        });
    } else {
        activeFiltersContainer.classList.add('hidden');
    }
}

// Create filter chip HTML
function createFilterChip(type, value, displayText) {
    return `
        <div class="filter-chip">
            ${displayText}
            <button class="filter-chip-remove" data-type="${type}" data-value="${value}" aria-label="Remove ${displayText} filter">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `;
}

// Remove specific filter
function removeFilter(type, value) {
    switch(type) {
        case 'location':
            document.getElementById('locationFilter').value = '';
            break;
        case 'type':
            const typeCheckbox = document.querySelector(`input[value="${value}"]`);
            if (typeCheckbox) typeCheckbox.checked = false;
            break;
        case 'duration':
            document.getElementById('durationFilter').value = '';
            break;
        case 'category':
            document.getElementById('categoryFilter').value = '';
            break;
        case 'stipend':
            document.getElementById('stipendFilter').value = '';
            break;
        case 'level':
            const levelCheckbox = document.querySelector(`#skillLevelFilter input[value="${value}"]`);
            if (levelCheckbox) levelCheckbox.checked = false;
            break;
    }
    
    applyFilters();
}

// Sort internships
function sortInternships() {
    const sortBy = document.getElementById('sortBy').value;

    switch (sortBy) {
        case 'recent':
            displayedInternships.sort((a, b) => b.postedDate - a.postedDate);
            break;
        case 'stipend-high':
            displayedInternships.sort((a, b) => b.stipend - a.stipend);
            break;
        case 'stipend-low':
            displayedInternships.sort((a, b) => a.stipend - b.stipend);
            break;
        case 'duration':
            displayedInternships.sort((a, b) => a.duration - b.duration);
            break;
    }

    currentPage = 1;
    loadInternships();
}

// Load more internships
function loadMore() {
    if (isLoading) return;
    
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading...';
    
    currentPage++;
    loadInternships();
    
    // Smooth scroll to new content
    setTimeout(() => {
        const cards = document.querySelectorAll('.internship-card');
        const lastOldCard = cards[cards.length - itemsPerPage - 1];
        if (lastOldCard) {
            lastOldCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 100);
}

// Update results count
function updateResultsCount() {
    const count = displayedInternships.length;
    const resultsCount = document.getElementById('resultsCount');
    resultsCount.textContent = `Showing ${Math.min(currentPage * itemsPerPage, count)} of ${count} internship${count !== 1 ? 's' : ''}`;
}

// Update filter counts
function updateFilterCounts() {
    const categories = ['technology', 'marketing', 'design', 'finance', 'hr', 'sales'];
    categories.forEach(category => {
        const count = internshipsData.filter(i => i.category === category).length;
        const option = document.querySelector(`#categoryFilter option[value="${category}"]`);
        if (option) {
            option.textContent = `${option.textContent} (${count})`;
        }
    });
}

// Get relative time
function getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Posted today';
    if (days === 1) return 'Posted yesterday';
    if (days < 7) return `Posted ${days} days ago`;
    if (days < 30) return `Posted ${Math.floor(days/7)} week${Math.floor(days/7) === 1 ? '' : 's'} ago`;
    return `Posted ${Math.floor(days/30)} month${Math.floor(days/30) === 1 ? '' : 's'} ago`;
}

// Create ripple effect
function createRippleEffect(button) {
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
    
    setTimeout(() => ripple.remove(), 600);
}

// Save applications to localStorage
function saveApplication(internship) {
    const applications = JSON.parse(localStorage.getItem('studentApplications') || '[]');
    const application = {
        id: Date.now(),
        internshipId: internship.id,
        title: internship.title,
        company: internship.company,
        logo: internship.logo,
        location: internship.location,
        stipend: internship.stipend,
        appliedDate: new Date().toISOString(),
        status: 'pending'
    };
    applications.push(application);
    localStorage.setItem('studentApplications', JSON.stringify(applications));
}

// Load applications from localStorage
function loadApplications() {
    const applications = JSON.parse(localStorage.getItem('studentApplications') || '[]');
    applications.forEach(app => {
        const internship = internshipsData.find(i => i.id === app.internshipId);
        if (internship) {
            internship.applied = true;
        }
    });
}

// Save bookmarks
function saveBookmarks() {
    const bookmarks = internshipsData.filter(i => i.bookmarked).map(i => i.id);
    localStorage.setItem('studentBookmarks', JSON.stringify(bookmarks));
}

// Load bookmarks
function loadBookmarks() {
    const bookmarks = JSON.parse(localStorage.getItem('studentBookmarks') || '[]');
    bookmarks.forEach(id => {
        const internship = internshipsData.find(i => i.id === id);
        if (internship) {
            internship.bookmarked = true;
        }
    });
}

// Show notification
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
    const keyboardHint = document.getElementById('keyboardHint');
    
    if (searchInput) {
        // Debounced search
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applyFilters();
            }, 300);
        });

        // Focus search on "/" key
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
                applyFilters();
            }
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
        alert('You have been logged out successfully!');
        window.location.href = 'index.html';
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

    // Add fade in effect
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Initial fade effect
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.3s ease';