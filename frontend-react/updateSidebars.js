const fs = require('fs');
const path = require('path');

const studentDir = path.join(__dirname, 'src', 'pages', 'student');
const recruiterDir = path.join(__dirname, 'src', 'pages', 'recruiter');

const studentLink = `
          <button
            className={\`nav-item \${location.pathname.includes('/student/active-internship') || location.pathname.includes('/student/daily-log') || location.pathname.includes('/student/my-logs') || location.pathname.includes('/student/milestones') ? 'active' : ''}\`}
            onClick={() => navigate('/student/active-internship')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span className="nav-item-text">My Internship</span>
          </button>
`;

const recruiterLink = `
          <button
            className={\`nav-item \${location.pathname.includes('/recruiter/mentor-dashboard') || location.pathname.includes('/recruiter/review-logs') || location.pathname.includes('/recruiter/mentees') ? 'active' : ''}\`}
            onClick={() => navigate('/recruiter/mentor-dashboard')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.2 19L18 24M18 24L22.8 19M18 24V14M12 12A5 5 0 1 0 12 2A5 5 0 1 0 12 12Z" />
            </svg>
            <span className="nav-item-text">Mentor Dashboard</span>
          </button>
`;

// Helper to inject
function addLinkToSidebar(dir, linkFragment, insertAfterText) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) {
        if (!f.endsWith('.jsx')) continue;
        const p = path.join(dir, f);
        let c = fs.readFileSync(p, 'utf8');

        // Only inject if it has a sidebar-nav and doesn't already have the link
        if (c.includes('<nav className="sidebar-nav">') && !c.includes(linkFragment.trim())) {
            // Find where to inject
            const insertIdx = c.indexOf(insertAfterText);
            if (insertIdx !== -1) {
                // Find closing button
                const closeBtnIdx = c.indexOf('</button>', insertIdx);
                if (closeBtnIdx !== -1) {
                    const insertPoint = closeBtnIdx + '</button>'.length;
                    c = c.slice(0, insertPoint) + linkFragment + c.slice(insertPoint);
                    fs.writeFileSync(p, c);
                    console.log(`Updated sidebar in ${f}`);
                }
            }
        }
    }
}

addLinkToSidebar(studentDir, studentLink, '<span className="nav-item-text">My Resume</span>');
addLinkToSidebar(recruiterDir, recruiterLink, '<span className="nav-item-text">Manage Internships</span>');

console.log("Done upgrading navigation sidebars");
