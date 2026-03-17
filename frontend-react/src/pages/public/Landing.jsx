// src/pages/public/Landing.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';

const Landing = () => {
  const navigate = useNavigate();
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState(null);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderScrolled(window.scrollY > 10);
      
      // Fade-in animation for elements
      const fadeElements = document.querySelectorAll('.fade-in');
      fadeElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight - 50;
        if (isVisible) {
          el.classList.add('visible');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // FAQ toggle function
  const toggleFAQ = (index) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Testimonials data
  const testimonials = [
    {
      text: "Zoyaraa's internship program gave me real-world experience. I worked on production code and got mentored by senior developers. Now I have a full-time offer!",
      author: "Priya D",
      role: "Frontend Intern → Full-time Developer",
      initials: "PD"
    },
    {
      text: "As a mentor at Zoyaraa, I've guided 5 interns who all got placed. The daily log system helps track progress and provide timely feedback.",
      author: "Rajesh M",
      role: "Tech Lead - Frontend",
      initials: "RM"
    },
    {
      text: "Managing 50+ recruiters across departments is easy with Zoyaraa's HR dashboard. The certificate system ensures quality control.",
      author: "Priya K",
      role: "HR Manager",
      initials: "PK"
    }
  ];

  // FAQ data
  const faqItems = [
    {
      question: "Is Zoyaraa internship paid?",
      answer: "Yes! All Zoyaraa internships come with competitive stipends based on role and duration. Stipends range from ₹10,000 to ₹30,000 per month depending on the department and your skills."
    },
    {
      question: "How are mentors assigned?",
      answer: "Each intern is assigned a mentor from their department - the same person who selected them during interviews. You'll have weekly 1:1 sessions and daily feedback on your work."
    },
    {
      question: "What is the daily log system?",
      answer: "Interns submit daily work logs which mentors review and approve. This ensures continuous feedback and progress tracking. It also creates a record of your work for your final certificate."
    },
    {
      question: "Do I get a certificate?",
      answer: "Yes! Upon successful completion, you receive a verified certificate with QR code that employers can verify online. The certificate includes your grade, skills acquired, and mentor's recommendation."
    }
  ];

  return (
    <div className="landing-page">
      {/* Scroll to Top Button */}
      <button 
        className={`scroll-top ${window.scrollY > 300 ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
      </button>

      {/* Header */}
      <Header isScrolled={isHeaderScrolled} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="container">
          <div className="hero-content fade-in">
            <h1>
              Join <span className="highlight">Zoyaraa's</span> Internship Program
            </h1>
            <p>
              Launch your career with India's fastest growing tech company. Work on real projects, 
              learn from industry experts, and get certified. Exclusive opportunities across all departments.
            </p>
            <div className="hero-buttons" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {/* For Students - New Registration */}
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/register')}
              >
                Student Registration →
              </button>
              
              {/* For Everyone - Login */}
              <button 
                className="btn btn-outline" 
                onClick={() => navigate('/login')}
              >
                Login
              </button>
            </div>
            
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item fade-in">
              <h3>2,500+</h3>
              <p>Students Placed</p>
            </div>
            <div className="stat-item fade-in">
              <h3>50+</h3>
              <p>Departments</p>
            </div>
            <div className="stat-item fade-in">
              <h3>300+</h3>
              <p>Expert Mentors</p>
            </div>
            <div className="stat-item fade-in">
              <h3>92%</h3>
              <p>Placement Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header fade-in">
            <h2>Your Journey at Zoyaraa</h2>
            <p>Four simple steps to launch your career with us.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card fade-in">
              <div className="step-number">1</div>
              <h3>Create Account</h3>
              <p>Sign up as a student and complete your profile with your skills and resume.</p>
            </div>
            <div className="step-card fade-in">
              <div className="step-number">2</div>
              <h3>Browse Opportunities</h3>
              <p>Explore internships across Frontend, Backend, DevOps, Marketing, and more.</p>
            </div>
            <div className="step-card fade-in">
              <div className="step-number">3</div>
              <h3>Apply & Get Selected</h3>
              <p>Apply to roles that match your skills. Get shortlisted and attend interviews.</p>
            </div>
            <div className="step-card fade-in">
              <div className="step-number">4</div>
              <h3>Start Your Journey</h3>
              <p>Join Zoyaraa, work on real projects, and get mentored by industry experts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header fade-in">
            <h2>Built for Zoyaraa's Success</h2>
            <p>Whether you're a student, recruiter, or HR, we've got you covered.</p>
          </div>
          <div className="features-grid">
            {/* For Students */}
            <div className="feature-card fade-in">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
              </div>
              <h3>For Students</h3>
              <ul className="feature-list">
                <li>
                  <span className="check-icon">✓</span>
                  <span>Apply to Zoyaraa's exclusive internships</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Get mentored by department leads</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Track progress with daily logs</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Earn verified certificates</span>
                </li>
              </ul>
            </div>

            {/* For Recruiters */}
            <div className="feature-card fade-in">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <h3>For Zoyaraa Recruiters</h3>
              <ul className="feature-list">
                <li>
                  <span className="check-icon">✓</span>
                  <span>Post department-specific internships</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Review applicants from your department only</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Shortlist, interview, and select candidates</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Mentor interns with daily log reviews</span>
                </li>
              </ul>
            </div>

            {/* For HR Team */}
            <div className="feature-card fade-in">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3>For HR Team</h3>
              <ul className="feature-list">
                <li>
                  <span className="check-icon">✓</span>
                  <span>Manage all departments and recruiters</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Invite and onboard new recruiters</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Approve certificates for interns</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Track platform-wide analytics</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="container">
          <div className="section-header fade-in">
            <h2>Success Stories</h2>
            <p>Hear from students and mentors who found success with Zoyaraa.</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div className="testimonial-card fade-in" key={index}>
                <p className="testimonial-text">{testimonial.text}</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.initials}</div>
                  <div className="author-info">
                    <h4>{testimonial.author}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq" id="faq">
        <div className="container">
          <div className="section-header fade-in">
            <h2>Frequently Asked Questions</h2>
            <p>Find answers to common questions about Zoyaraa's internship program.</p>
          </div>
          <div className="faq-list">
            {faqItems.map((item, index) => (
              <div className="faq-item fade-in" key={index}>
                <button 
                  className="faq-question" 
                  onClick={() => toggleFAQ(index)}
                >
                  <span>{item.question}</span>
                  <svg 
                    className={`faq-icon ${activeFAQ === index ? 'active' : ''}`} 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className={`faq-answer ${activeFAQ === index ? 'active' : ''}`}>
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - FIXED WITH CLEAR LOGIN OPTIONS */}
      <section className="cta" id="get-started">
        <div className="container">
          <div className="cta-card fade-in">
            <h2>Ready to Start Your Journey?</h2>
            <p>Join Zoyaraa's internship program and launch your career with India's fastest growing tech company.</p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* For New Students */}
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/register')}
              >
                Student Registration →
              </button>
              
              {/* For All Users to Login */}
              <button 
                className="btn btn-outline" 
                onClick={() => navigate('/login')}
              >
                Login (Students / Recruiters / HR)
              </button>
            </div>
            
            {/* Help text - Clear instructions for all user types */}
            <div style={{ 
              marginTop: '1.5rem', 
              fontSize: '0.9rem', 
              color: '#666',
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'left'
            }}>
              <p style={{ marginBottom: '0.5rem', fontWeight: '600', color: '#333' }}>📌 Not sure where to go?</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '0.25rem' }}>• 👨‍🎓 <strong>New student?</strong> Click "Student Registration" above</li>
                <li style={{ marginBottom: '0.25rem' }}>• 👔 <strong>Existing student?</strong> Click "Login" and use your credentials</li>
                <li style={{ marginBottom: '0.25rem' }}>• 👑 <strong>Zoyaraa Recruiter or HR?</strong> Click "Login" and use your work email</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;