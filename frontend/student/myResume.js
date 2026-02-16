// Resume Data
        let resumeData = {
            personal: {
                fullName: 'Demo Student',
                email: 'demo@student.com',
                phone: '+91 98765 43210',
                location: 'Bangalore, India',
                linkedin: '',
                portfolio: ''
            },
            education: [],
            experience: [],
            skills: [],
            projects: []
        };

        // Auto-save functionality
        let autoSaveTimeout = null;
        let selectedFile = null;

        // Initialize
        function initPage() {
            loadResumeData();
            setupPersonalInfoListeners();
            setupAutoSave();
            setupDragAndDrop();
            renderAll();
            updateProgress();
        }

        // Load resume data from localStorage
        function loadResumeData() {
            const saved = localStorage.getItem('studentResume');
            if (saved) {
                try {
                    resumeData = JSON.parse(saved);
                    updatePersonalInfoFields();
                } catch (e) {
                    console.error('Error loading resume data:', e);
                }
            }
        }

        // Save resume data with auto-save indicator
        function saveResumeData() {
            try {
                localStorage.setItem('studentResume', JSON.stringify(resumeData));
                showAutoSaveIndicator();
                updateProgress();
            } catch (e) {
                console.error('Error saving resume data:', e);
            }
        }

        // Auto-save setup
        function setupAutoSave() {
            document.querySelectorAll('input, textarea').forEach(element => {
                element.addEventListener('input', () => {
                    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
                    autoSaveTimeout = setTimeout(saveResumeData, 1000);
                });
            });
        }

        // Show auto-save indicator
        function showAutoSaveIndicator() {
            const existing = document.querySelector('.auto-save-indicator');
            if (existing) existing.remove();

            const indicator = document.createElement('div');
            indicator.className = 'auto-save-indicator';
            indicator.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Auto-saved
            `;

            document.body.appendChild(indicator);

            setTimeout(() => {
                indicator.style.opacity = '0';
                indicator.style.transform = 'translateY(20px)';
                setTimeout(() => indicator.remove(), 300);
            }, 2000);
        }

        // Calculate and update resume completion progress
        function updateProgress() {
            let totalFields = 0;
            let filledFields = 0;

            // Personal Info (4 required fields)
            const personalFields = ['fullName', 'email', 'phone', 'location'];
            totalFields += personalFields.length;
            personalFields.forEach(field => {
                if (resumeData.personal[field] && resumeData.personal[field].trim()) filledFields++;
            });

            // Education (at least one)
            totalFields += 1;
            if (resumeData.education.length > 0) filledFields += 1;

            // Experience (at least one)
            totalFields += 1;
            if (resumeData.experience.length > 0) filledFields += 1;

            // Skills (at least 3)
            totalFields += 1;
            if (resumeData.skills.length >= 3) filledFields += 1;

            // Projects (at least one)
            totalFields += 1;
            if (resumeData.projects.length > 0) filledFields += 1;

            const progress = Math.min((filledFields / totalFields) * 100, 100);
            document.getElementById('progressPercentage').textContent = `${Math.round(progress)}%`;
            document.getElementById('progressFill').style.width = `${progress}%`;
        }

        // Update personal info fields
        function updatePersonalInfoFields() {
            document.getElementById('fullName').value = resumeData.personal.fullName || '';
            document.getElementById('email').value = resumeData.personal.email || '';
            document.getElementById('phone').value = resumeData.personal.phone || '';
            document.getElementById('location').value = resumeData.personal.location || '';
            document.getElementById('linkedin').value = resumeData.personal.linkedin || '';
            document.getElementById('portfolio').value = resumeData.personal.portfolio || '';
        }

        // Setup personal info listeners
        function setupPersonalInfoListeners() {
            const fields = ['fullName', 'email', 'phone', 'location', 'linkedin', 'portfolio'];
            fields.forEach(field => {
                const element = document.getElementById(field);
                if (element) {
                    element.addEventListener('input', (e) => {
                        resumeData.personal[field] = e.target.value;
                        saveResumeData();
                    });
                }
            });
        }

        // Render all sections - FIXED: Skills empty state
        function renderAll() {
            renderEducation();
            renderExperience();
            renderSkills();
            renderProjects();
        }

        // Education Functions
        function addEducation() {
            showEducationModal();
        }

        function showEducationModal(index = null) {
            const isEdit = index !== null;
            const education = isEdit ? resumeData.education[index] : {
                degree: '',
                institution: '',
                startDate: '',
                endDate: '',
                cgpa: '',
                achievements: ''
            };

            const modal = createModal(
                isEdit ? 'Edit Education' : 'Add Education',
                `
                <div class="form-group">
                    <label class="form-label form-label-required">Degree/Course</label>
                    <input type="text" class="form-input" id="modalDegree" placeholder="B.Tech in Computer Science" value="${education.degree}" required>
                </div>
                <div class="form-group">
                    <label class="form-label form-label-required">Institution/University</label>
                    <input type="text" class="form-input" id="modalInstitution" placeholder="XYZ University" value="${education.institution}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label form-label-required">Start Date</label>
                        <input type="month" class="form-input" id="modalEduStart" value="${education.startDate}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">End Date (or Expected)</label>
                        <input type="month" class="form-input" id="modalEduEnd" value="${education.endDate}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">CGPA/Percentage</label>
                    <input type="text" class="form-input" id="modalCgpa" placeholder="8.5/10 or 85%" value="${education.cgpa}">
                </div>
                <div class="form-group">
                    <label class="form-label">Achievements & Awards (Optional)</label>
                    <textarea class="form-textarea" id="modalAchievements" placeholder="Dean's List, Scholarships, Competitions won..." rows="3">${education.achievements || ''}</textarea>
                </div>
            `,
                () => {
                    const newEducation = {
                        degree: document.getElementById('modalDegree').value.trim(),
                        institution: document.getElementById('modalInstitution').value.trim(),
                        startDate: document.getElementById('modalEduStart').value,
                        endDate: document.getElementById('modalEduEnd').value,
                        cgpa: document.getElementById('modalCgpa').value.trim(),
                        achievements: document.getElementById('modalAchievements').value.trim()
                    };

                    // Validation
                    if (!newEducation.degree || !newEducation.institution || !newEducation.startDate) {
                        showNotification('Please fill in all required fields', 'error');
                        return false;
                    }

                    if (isEdit) {
                        resumeData.education[index] = newEducation;
                    } else {
                        resumeData.education.push(newEducation);
                    }

                    saveResumeData();
                    renderEducation();
                    showNotification(isEdit ? 'Education updated successfully!' : 'Education added successfully!');
                    return true;
                }
            );
        }

        function renderEducation() {
            const list = document.getElementById('educationList');
            if (resumeData.education.length === 0) {
                list.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg><h3>No education added yet</h3><p>Click "Add Education" to get started</p></div>';
                return;
            }

            list.innerHTML = resumeData.education.map((edu, index) => `
                <div class="list-item">
                    <div class="list-item-header">
                        <div>
                            <div class="list-item-title">${edu.degree}</div>
                            <div class="list-item-subtitle">${edu.institution}</div>
                        </div>
                        <div class="list-item-actions">
                            <button class="btn-icon" onclick="showEducationModal(${index})" title="Edit">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn-icon" onclick="deleteEducation(${index})" title="Delete">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="list-item-meta">
                        <span>${formatDate(edu.startDate)} - ${edu.endDate ? formatDate(edu.endDate) : 'Present'}</span>
                        ${edu.cgpa ? `<span>${edu.cgpa}</span>` : ''}
                    </div>
                    ${edu.achievements ? `<div class="list-item-content"><strong>Achievements:</strong> ${edu.achievements}</div>` : ''}
                </div>
            `).join('');
        }

        function deleteEducation(index) {
            if (confirm('Are you sure you want to delete this education entry?')) {
                resumeData.education.splice(index, 1);
                saveResumeData();
                renderEducation();
                showNotification('Education entry deleted');
            }
        }

        // Experience Functions
        function addExperience() {
            showExperienceModal();
        }

        function showExperienceModal(index = null) {
            const isEdit = index !== null;
            const exp = isEdit ? resumeData.experience[index] : {
                title: '',
                company: '',
                location: '',
                startDate: '',
                endDate: '',
                current: false,
                description: '',
                achievements: ''
            };

            const modal = createModal(
                isEdit ? 'Edit Experience' : 'Add Experience',
                `
                <div class="form-group">
                    <label class="form-label form-label-required">Job Title/Position</label>
                    <input type="text" class="form-input" id="modalExpTitle" placeholder="Software Developer Intern" value="${exp.title}" required>
                </div>
                <div class="form-group">
                    <label class="form-label form-label-required">Company</label>
                    <input type="text" class="form-input" id="modalCompany" placeholder="ABC Tech Pvt Ltd" value="${exp.company}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Location</label>
                    <input type="text" class="form-input" id="modalExpLocation" placeholder="Remote / Bangalore" value="${exp.location || ''}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label form-label-required">Start Date</label>
                        <input type="month" class="form-input" id="modalExpStart" value="${exp.startDate}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">End Date</label>
                        <input type="month" class="form-input" id="modalExpEnd" value="${exp.endDate}" ${exp.current ? 'disabled' : ''}>
                    </div>
                </div>
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" id="modalExpCurrent" ${exp.current ? 'checked' : ''} onchange="toggleCurrentExperience(this)">
                        <span class="form-label" style="margin: 0;">Currently working here</span>
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label form-label-required">Description</label>
                    <textarea class="form-textarea" id="modalExpDesc" placeholder="Describe your responsibilities, technologies used, and impact..." rows="4" required>${exp.description}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Key Achievements (Optional)</label>
                    <textarea class="form-textarea" id="modalAchievements" placeholder="Quantify your achievements with numbers and metrics..." rows="3">${exp.achievements || ''}</textarea>
                </div>
            `,
                () => {
                    const newExp = {
                        title: document.getElementById('modalExpTitle').value.trim(),
                        company: document.getElementById('modalCompany').value.trim(),
                        location: document.getElementById('modalExpLocation').value.trim(),
                        startDate: document.getElementById('modalExpStart').value,
                        endDate: document.getElementById('modalExpEnd').value,
                        current: document.getElementById('modalExpCurrent').checked,
                        description: document.getElementById('modalExpDesc').value.trim(),
                        achievements: document.getElementById('modalAchievements').value.trim()
                    };

                    // Validation
                    if (!newExp.title || !newExp.company || !newExp.startDate || !newExp.description) {
                        showNotification('Please fill in all required fields', 'error');
                        return false;
                    }

                    if (isEdit) {
                        resumeData.experience[index] = newExp;
                    } else {
                        resumeData.experience.push(newExp);
                    }

                    saveResumeData();
                    renderExperience();
                    showNotification(isEdit ? 'Experience updated successfully!' : 'Experience added successfully!');
                    return true;
                }
            );

            // Initialize the toggle function for current job
            window.toggleCurrentExperience = function (checkbox) {
                document.getElementById('modalExpEnd').disabled = checkbox.checked;
                if (checkbox.checked) {
                    document.getElementById('modalExpEnd').value = '';
                }
            };
        }

        function renderExperience() {
            const list = document.getElementById('experienceList');
            if (resumeData.experience.length === 0) {
                list.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg><h3>No experience added yet</h3><p>Click "Add Experience" to get started</p></div>';
                return;
            }

            list.innerHTML = resumeData.experience.map((exp, index) => `
                <div class="list-item">
                    <div class="list-item-header">
                        <div>
                            <div class="list-item-title">${exp.title}</div>
                            <div class="list-item-subtitle">${exp.company}${exp.location ? ` • ${exp.location}` : ''}</div>
                        </div>
                        <div class="list-item-actions">
                            <button class="btn-icon" onclick="showExperienceModal(${index})" title="Edit">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn-icon" onclick="deleteExperience(${index})" title="Delete">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="list-item-meta">
                        <span>${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}</span>
                    </div>
                    <div class="list-item-content">${exp.description}</div>
                    ${exp.achievements ? `<div class="list-item-content" style="margin-top: 0.5rem;"><strong>Achievements:</strong> ${exp.achievements}</div>` : ''}
                </div>
            `).join('');
        }

        function deleteExperience(index) {
            if (confirm('Are you sure you want to delete this experience entry?')) {
                resumeData.experience.splice(index, 1);
                saveResumeData();
                renderExperience();
                showNotification('Experience entry deleted');
            }
        }

        // Skills Functions - FIXED: Better empty state
        function handleSkillEnter(event) {
            if (event.key === 'Enter') {
                addSkill();
            } else if (event.key === ',') {
                event.preventDefault();
                addSkill();
            }
        }

        function addSkill() {
            const input = document.getElementById('skillInput');
            const skillsText = input.value.trim();

            if (!skillsText) return;

            // Split by commas and trim each skill
            const newSkills = skillsText.split(',')
                .map(skill => skill.trim())
                .filter(skill => skill.length > 0);

            let addedCount = 0;
            let duplicateCount = 0;

            newSkills.forEach(skill => {
                if (!resumeData.skills.includes(skill)) {
                    resumeData.skills.push(skill);
                    addedCount++;
                } else {
                    duplicateCount++;
                }
            });

            input.value = '';
            saveResumeData();
            renderSkills();

            if (addedCount > 0) {
                showNotification(`${addedCount} skill${addedCount > 1 ? 's' : ''} added successfully!`);
            }
            if (duplicateCount > 0) {
                showNotification(`${duplicateCount} duplicate skill${duplicateCount > 1 ? 's' : ''} ignored`, 'info');
            }
        }

        function renderSkills() {
            const list = document.getElementById('skillsList');
            if (resumeData.skills.length === 0) {
                list.innerHTML = '<div class="empty-state" style="width: 100%;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg><h3>No skills added yet</h3><p>Add skills using the input above</p></div>';
                return;
            }

            list.innerHTML = resumeData.skills.map((skill, index) => `
                <div class="skill-tag" data-skill-index="${index}">
                    ${skill}
                    <button onclick="deleteSkill(${index})" title="Remove skill">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `).join('');
        }

        function deleteSkill(index) {
            resumeData.skills.splice(index, 1);
            saveResumeData();
            renderSkills();
            showNotification('Skill removed');
        }

        // Projects Functions
        function addProject() {
            showProjectModal();
        }

        function showProjectModal(index = null) {
            const isEdit = index !== null;
            const project = isEdit ? resumeData.projects[index] : {
                name: '',
                description: '',
                technologies: '',
                link: '',
                github: '',
                role: ''
            };

            const modal = createModal(
                isEdit ? 'Edit Project' : 'Add Project',
                `
                <div class="form-group">
                    <label class="form-label form-label-required">Project Name</label>
                    <input type="text" class="form-input" id="modalProjectName" placeholder="E-commerce Website" value="${project.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Your Role</label>
                    <input type="text" class="form-input" id="modalProjectRole" placeholder="Full Stack Developer" value="${project.role || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Technologies Used</label>
                    <input type="text" class="form-input" id="modalProjectTech" placeholder="React, Node.js, MongoDB" value="${project.technologies}">
                </div>
                <div class="form-group">
                    <label class="form-label form-label-required">Description</label>
                    <textarea class="form-textarea" id="modalProjectDesc" placeholder="Describe what the project does, your contributions, and the impact..." rows="4" required>${project.description}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Project URL (Live Demo)</label>
                        <input type="url" class="form-input" id="modalProjectLink" placeholder="https://project-demo.com" value="${project.link || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">GitHub Repository</label>
                        <input type="url" class="form-input" id="modalProjectGithub" placeholder="https://github.com/username/project" value="${project.github || ''}">
                    </div>
                </div>
            `,
                () => {
                    const newProject = {
                        name: document.getElementById('modalProjectName').value.trim(),
                        role: document.getElementById('modalProjectRole').value.trim(),
                        technologies: document.getElementById('modalProjectTech').value.trim(),
                        description: document.getElementById('modalProjectDesc').value.trim(),
                        link: document.getElementById('modalProjectLink').value.trim(),
                        github: document.getElementById('modalProjectGithub').value.trim()
                    };

                    // Validation
                    if (!newProject.name || !newProject.description) {
                        showNotification('Please fill in all required fields', 'error');
                        return false;
                    }

                    if (isEdit) {
                        resumeData.projects[index] = newProject;
                    } else {
                        resumeData.projects.push(newProject);
                    }

                    saveResumeData();
                    renderProjects();
                    showNotification(isEdit ? 'Project updated successfully!' : 'Project added successfully!');
                    return true;
                }
            );
        }

        function renderProjects() {
            const list = document.getElementById('projectsList');
            if (resumeData.projects.length === 0) {
                list.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg><h3>No projects added yet</h3><p>Click "Add Project" to get started</p></div>';
                return;
            }

            list.innerHTML = resumeData.projects.map((project, index) => `
                <div class="list-item">
                    <div class="list-item-header">
                        <div>
                            <div class="list-item-title">${project.name}</div>
                            ${project.role ? `<div class="list-item-subtitle">${project.role}</div>` : ''}
                            ${project.technologies ? `<div class="list-item-subtitle">${project.technologies}</div>` : ''}
                        </div>
                        <div class="list-item-actions">
                            <button class="btn-icon" onclick="showProjectModal(${index})" title="Edit">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn-icon" onclick="deleteProject(${index})" title="Delete">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="list-item-content">${project.description}</div>
                    <div class="list-item-meta">
                        ${project.link ? `<a href="${project.link}" target="_blank" style="color: #2440F0; text-decoration: none;">Live Demo ↗</a>` : ''}
                        ${project.github ? `<a href="${project.github}" target="_blank" style="color: #2440F0; text-decoration: none;">GitHub ↗</a>` : ''}
                    </div>
                </div>
            `).join('');
        }

        function deleteProject(index) {
            if (confirm('Are you sure you want to delete this project?')) {
                resumeData.projects.splice(index, 1);
                saveResumeData();
                renderProjects();
                showNotification('Project deleted');
            }
        }

        // Utility Functions
        function formatDate(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr + '-01');
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }

        // Enhanced Modal with better Cancel button
        function createModal(title, body, onSave) {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">${body}</div>
                    <div class="modal-footer">
                        <button class="modal-cancel-btn" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button class="modal-save-btn" id="modalSaveBtn">Save</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            document.getElementById('modalSaveBtn').addEventListener('click', () => {
                if (onSave()) {
                    overlay.remove();
                }
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });

            // Focus on first input
            setTimeout(() => {
                const firstInput = overlay.querySelector('input, textarea, select');
                if (firstInput) firstInput.focus();
            }, 100);

            return overlay;
        }

        function showNotification(message, type = 'success') {
            document.querySelectorAll('.notification').forEach(n => n.remove());

            const notification = document.createElement('div');
            notification.className = 'notification';

            const icon = type === 'error' ?
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>' :
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';

            notification.innerHTML = `${icon} ${message}`;
            notification.style.background = type === 'error' ?
                'linear-gradient(135deg, #ef4444, #dc2626)' :
                'linear-gradient(135deg, #2440F0, #0B1DC1)';

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        // File Upload Functions
        function openUploadModal() {
            document.getElementById('fileUploadModal').style.display = 'flex';
        }

        function closeUploadModal() {
            document.getElementById('fileUploadModal').style.display = 'none';
            removeSelectedFile();
        }

        function handleFileSelect(event) {
            const file = event.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    showNotification('File size exceeds 5MB limit', 'error');
                    return;
                }

                if (!file.type.match('application/pdf') &&
                    !file.type.match('application/msword') &&
                    !file.type.match('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
                    showNotification('Only PDF and Word documents are allowed', 'error');
                    return;
                }

                selectedFile = file;
                document.getElementById('fileName').textContent = file.name;
                document.getElementById('fileSize').textContent = formatFileSize(file.size);
                document.getElementById('selectedFile').style.display = 'flex';
                document.getElementById('processResumeBtn').disabled = false;
            }
        }

        function removeSelectedFile() {
            selectedFile = null;
            document.getElementById('resumeFile').value = '';
            document.getElementById('selectedFile').style.display = 'none';
            document.getElementById('processResumeBtn').disabled = true;
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function setupDragAndDrop() {
            const uploadArea = document.getElementById('uploadArea');

            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');

                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    const file = files[0];
                    const event = { target: { files: [file] } };
                    handleFileSelect(event);
                }
            });
        }

        function processResume() {
            if (!selectedFile) {
                showNotification('Please select a file first', 'error');
                return;
            }

            // Simulate resume processing
            showNotification('Processing resume...', 'info');

            // In a real application, you would:
            // 1. Upload file to server
            // 2. Use OCR/parsing service
            // 3. Return structured data

            setTimeout(() => {
                // Mock auto-fill data
                const mockData = {
                    personal: {
                        fullName: 'John Smith',
                        email: 'john.smith@example.com',
                        phone: '+91 98765 43210',
                        location: 'Mumbai, India',
                        linkedin: 'linkedin.com/in/johnsmith',
                        portfolio: 'github.com/johnsmith'
                    },
                    education: [{
                        degree: 'B.Tech in Computer Science',
                        institution: 'University of Technology',
                        startDate: '2020-09',
                        endDate: '2024-05',
                        cgpa: '8.7/10',
                        achievements: 'Dean\'s List, Academic Scholarship'
                    }],
                    experience: [{
                        title: 'Software Developer Intern',
                        company: 'Tech Solutions Inc',
                        location: 'Remote',
                        startDate: '2023-06',
                        endDate: '2023-08',
                        current: false,
                        description: 'Developed REST APIs using Node.js and Express\nBuilt responsive frontend with React\nOptimized database queries, reducing load time by 40%',
                        achievements: 'Increased application performance by 30%\nReduced bug reports by 25% through improved testing'
                    }],
                    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB', 'Git', 'AWS', 'Docker'],
                    projects: [{
                        name: 'E-commerce Platform',
                        role: 'Full Stack Developer',
                        technologies: 'React, Node.js, MongoDB, Stripe',
                        description: 'Built a full-featured e-commerce platform with user authentication, product catalog, shopping cart, and payment processing.',
                        link: 'https://ecommerce-demo.com',
                        github: 'https://github.com/johnsmith/ecommerce'
                    }]
                };

                // Update resume data
                resumeData = { ...resumeData, ...mockData };
                updatePersonalInfoFields();
                renderAll();
                saveResumeData();

                closeUploadModal();
                showNotification('Resume processed successfully! Data auto-filled.', 'success');
            }, 2000);
        }

        // New Enhancement Functions
        function copyPersonalInfo() {
            const info = `
Name: ${resumeData.personal.fullName}
Email: ${resumeData.personal.email}
Phone: ${resumeData.personal.phone}
Location: ${resumeData.personal.location}
${resumeData.personal.linkedin ? `LinkedIn: ${resumeData.personal.linkedin}\n` : ''}
${resumeData.personal.portfolio ? `Portfolio: ${resumeData.personal.portfolio}` : ''}
            `.trim();

            navigator.clipboard.writeText(info)
                .then(() => showNotification('Personal info copied to clipboard!'))
                .catch(() => showNotification('Failed to copy to clipboard', 'error'));
        }

        function exportResumeData() {
            const dataStr = JSON.stringify(resumeData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'resume-data.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showNotification('Resume data exported as JSON');
        }

        function clearAllData() {
            if (confirm('Are you sure you want to clear all resume data? This cannot be undone.')) {
                resumeData = {
                    personal: {
                        fullName: '',
                        email: '',
                        phone: '',
                        location: '',
                        linkedin: '',
                        portfolio: ''
                    },
                    education: [],
                    experience: [],
                    skills: [],
                    projects: []
                };

                updatePersonalInfoFields();
                renderAll();
                saveResumeData();
                showNotification('All data cleared successfully');
            }
        }

        function saveAllChanges() {
            saveResumeData();
            showNotification('All changes saved successfully!');
        }

        function openSkillsTemplate() {
            const modal = createModal(
                'Skill Templates',
                `
                <div class="form-group">
                    <h4 style="margin-bottom: 1rem;">Common Skill Categories</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
                        <button class="skill-template-btn" onclick="addSkillsFromTemplate('programming')" style="padding: 0.75rem; background: #EEF2FF; border: 1px solid #E0E7FF; border-radius: 8px; cursor: pointer; text-align: left; font-size: 0.875rem;">
                            <strong>Programming</strong><br>
                            <span style="color: #666; font-size: 0.75rem;">JavaScript, Python, Java, C++</span>
                        </button>
                        <button class="skill-template-btn" onclick="addSkillsFromTemplate('web')" style="padding: 0.75rem; background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 8px; cursor: pointer; text-align: left; font-size: 0.875rem;">
                            <strong>Web Development</strong><br>
                            <span style="color: #666; font-size: 0.75rem;">React, Node.js, HTML, CSS</span>
                        </button>
                        <button class="skill-template-btn" onclick="addSkillsFromTemplate('data')" style="padding: 0.75rem; background: #D1FAE5; border: 1px solid #A7F3D0; border-radius: 8px; cursor: pointer; text-align: left; font-size: 0.875rem;">
                            <strong>Data Science</strong><br>
                            <span style="color: #666; font-size: 0.75rem;">Python, SQL, Pandas, ML</span>
                        </button>
                        <button class="skill-template-btn" onclick="addSkillsFromTemplate('soft')" style="padding: 0.75rem; background: #E0E7FF; border: 1px solid #C7D2FE; border-radius: 8px; cursor: pointer; text-align: left; font-size: 0.875rem;">
                            <strong>Soft Skills</strong><br>
                            <span style="color: #666; font-size: 0.75rem;">Communication, Leadership, Teamwork</span>
                        </button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Or add custom skills:</label>
                    <textarea class="form-textarea" id="customSkills" placeholder="Enter skills separated by commas..." rows="3"></textarea>
                </div>
                `,
                () => {
                    const customSkills = document.getElementById('customSkills').value.trim();
                    if (customSkills) {
                        const skills = customSkills.split(',').map(s => s.trim()).filter(s => s.length > 0);
                        skills.forEach(skill => {
                            if (!resumeData.skills.includes(skill)) {
                                resumeData.skills.push(skill);
                            }
                        });
                        saveResumeData();
                        renderSkills();
                        showNotification(`${skills.length} custom skills added!`);
                    }
                    return true;
                }
            );
        }

        function addSkillsFromTemplate(template) {
            const templates = {
                programming: ['JavaScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust'],
                web: ['HTML5', 'CSS3', 'React', 'Vue.js', 'Node.js', 'Express', 'MongoDB'],
                data: ['Python', 'SQL', 'Pandas', 'NumPy', 'Machine Learning', 'Data Analysis', 'Tableau'],
                soft: ['Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Time Management', 'Adaptability']
            };

            const newSkills = templates[template].filter(skill => !resumeData.skills.includes(skill));

            if (newSkills.length === 0) {
                showNotification('All skills from this template are already added', 'info');
                return;
            }

            resumeData.skills = [...resumeData.skills, ...newSkills];
            saveResumeData();
            renderSkills();
            showNotification(`${newSkills.length} skills added from ${template} template!`);
        }

        // Mobile Menu
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
                email: 'demo@student.com'
            };
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function () {
            initMobileMenu();
            getUserData();
            initPage();

            setTimeout(() => {
                document.body.style.opacity = '1';
            }, 50);
        });

        // Initial fade effect
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease';