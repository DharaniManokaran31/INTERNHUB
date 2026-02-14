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
      text: "InternHub made finding my dream internship so easy! The platform is intuitive and I got matched with amazing companies.",
      author: "Sarah Miller",
      role: "Computer Science Student",
      initials: "SM"
    },
    {
      text: "As a recruiter, InternHub streamlined our hiring process. We found talented interns quickly and efficiently.",
      author: "John Davis",
      role: "HR Manager, Tech Corp",
      initials: "JD"
    },
    {
      text: "The best internship platform I've used. Clean interface, great features, and excellent support team.",
      author: "Emily Lee",
      role: "Engineering Student",
      initials: "EL"
    }
  ];

  // FAQ data
  const faqItems = [
    {
      question: "Is InternHub free to use?",
      answer: "Yes! InternHub is completely free for students. Recruiters can post a limited number of internships for free, with premium plans available for additional features."
    },
    {
      question: "How do I create an account?",
      answer: "Click the 'Get Started' button, choose your account type (student or recruiter), and fill out the registration form. You'll receive a confirmation email to activate your account."
    },
    {
      question: "Can I apply to multiple internships?",
      answer: "Absolutely! Students can apply to as many internships as they want. We encourage you to explore different opportunities and find the perfect match."
    },
    {
      question: "How long does the application process take?",
      answer: "The timeline varies by company, but most recruiters review applications within 1-2 weeks. You'll receive updates on your application status through the platform."
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
              Find Your Perfect <span className="highlight">Internship Match</span>
            </h1>
            <p>
              Connect with top companies, apply to exciting opportunities, and kickstart your career. 
              The complete platform for students and recruiters.
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={() => navigate('/register')}>
                Start Your Journey →
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/login')}>
                I have an account
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
              <h3>10,000+</h3>
              <p>Active Students</p>
            </div>
            <div className="stat-item fade-in">
              <h3>500+</h3>
              <p>Partner Companies</p>
            </div>
            <div className="stat-item fade-in">
              <h3>5,000+</h3>
              <p>Internships Posted</p>
            </div>
            <div className="stat-item fade-in">
              <h3>95%</h3>
              <p>Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header fade-in">
            <h2>How It Works</h2>
            <p>Getting started is easy. Follow these simple steps to find your perfect internship.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card fade-in">
              <div className="step-number">1</div>
              <h3>Create Account</h3>
              <p>Sign up as a student or recruiter in just a few clicks.</p>
            </div>
            <div className="step-card fade-in">
              <div className="step-number">2</div>
              <h3>Build Profile</h3>
              <p>Upload your resume and showcase your skills and experience.</p>
            </div>
            <div className="step-card fade-in">
              <div className="step-number">3</div>
              <h3>Apply or Post</h3>
              <p>Students apply to internships, recruiters post opportunities.</p>
            </div>
            <div className="step-card fade-in">
              <div className="step-number">4</div>
              <h3>Get Matched</h3>
              <p>Find your perfect match and start your journey.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header fade-in">
            <h2>Built for Everyone</h2>
            <p>Whether you're a student, recruiter, or admin, we've got you covered.</p>
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
                  <span>Browse and apply to internships</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Upload resumes and cover letters</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Track application status in real-time</span>
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
              <h3>For Recruiters</h3>
              <ul className="feature-list">
                <li>
                  <span className="check-icon">✓</span>
                  <span>Post internship opportunities</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Review and filter applicants</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Shortlist or reject with one click</span>
                </li>
              </ul>
            </div>

            {/* For Administrators */}
            <div className="feature-card fade-in">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3>For Administrators</h3>
              <ul className="feature-list">
                <li>
                  <span className="check-icon">✓</span>
                  <span>Approve/decline accounts</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Monitor platform statistics</span>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <span>Manage users and internships</span>
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
            <h2>What Our Users Say</h2>
            <p>Hear from students and recruiters who found success with InternHub.</p>
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
            <p>Find answers to common questions about InternHub.</p>
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

      {/* CTA Section */}
      <section className="cta" id="get-started">
        <div className="container">
          <div className="cta-card fade-in">
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of students and recruiters using InternHub to find their perfect match.</p>
            <button className="btn" onClick={() => navigate('/register')}>
              Create Free Account
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;