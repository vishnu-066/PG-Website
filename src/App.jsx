import React, { useState, useEffect } from 'react';
import logo from './logo.jpg';
import AdminPortal from './components/AdminPortal.jsx';

const rooms = [
  {
    type: 'Single Sharing',
    price: '₹15,000',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80',
    copy: 'Your own quiet, fully furnished premium space for ultimate privacy.'
  },
  {
    type: 'Double Sharing',
    price: '₹8,000',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80',
    copy: 'Spacious room designed for two, balancing privacy and comfort.'
  },
  {
    type: 'Triple Sharing',
    price: '₹6,000',
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=900&q=80',
    copy: 'Bright, social, and budget-friendly living with all premium services.'
  },
];

const faqData = [
  {
    question: 'What is included in the monthly rent?',
    answer: 'Your rent covers three high-quality home-style meals daily, high-speed Wi-Fi, 24/7 security, access to automatic washing machines, continuous hot water geysers, dedicated bike parking, regular housekeeping, and clean drinking water.'
  },
  {
    question: 'Is there a security deposit?',
    answer: 'Yes. A security deposit of ₹2,000 is required, where ₹1,000 is a fixed deposit, and ₹1,000 will be fully refunded to you at the time of your leaving.'
  },
  {
    question: 'Are visitors and family members allowed?',
    answer: 'Visitors and family members are allowed in the common lounge and reception areas between 9:00 AM and 8:00 PM. Overnight stays for guests require prior approval from the PG manager.'
  },
  {
    question: 'What is the notice period before moving out?',
    answer: 'We require a standard 30-day notice period before check-out to process your deposit refund and coordinate room availability.'
  }
];

function App() {
  const [isAdminView, setIsAdminView] = useState(() => {
    try {
      return window.location.hash.startsWith('#/admin');
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminView(window.location.hash.startsWith('#/admin'));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light';
    } catch (e) {
      return 'light';
    }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('Double Sharing');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', moveIn: '' });
  const [activeFaq, setActiveFaq] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 8);
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  // Handle escape key and body scroll lock for mobile menu drawer
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const submit = (event) => {
    event.preventDefault();
    setNotice(`Thank you, ${form.name}! We have received your query for a ${selectedRoom} room. Our manager will call you on ${form.phone} within 2 hours.`);
    setForm({ name: '', phone: '', moveIn: '' });
  };

  const toggleFaq = (index) => {
    setActiveFaq(prev => (prev === index ? null : index));
  };

  if (isAdminView) {
    return <AdminPortal onBackToHome={() => window.location.hash = '#/'} />;
  }

  return (
    <main>
      {/* Header */}
      <header className={`topbar ${menuOpen ? 'menu-active' : ''} ${isScrolled ? 'is-scrolled' : ''}`}>
        <button className="brand" onClick={() => scrollTo('home')} aria-label="Sri Venkateswara Gents PG home">
          <img src={logo} alt="Sri Venkateswara Gents PG Logo" className="brand-logo" />
          <span className="brand-title">
            <span className="brand-main">Sri Venkateswara</span>
            <span className="brand-sub">Gents PG</span>
          </span>
        </button>

        <div className="topbar-right">
          <nav className="desktop-nav">
            <button onClick={() => scrollTo('home')}>Home</button>
            <button onClick={() => scrollTo('rooms')}>Rooms</button>
            <button onClick={() => scrollTo('amenities')}>Amenities</button>
            <button onClick={() => scrollTo('hotspots')}>Location</button>
            <button onClick={() => scrollTo('faq')}>FAQ</button>
            <button onClick={() => { window.location.hash = '#/admin'; setMenuOpen(false); }} style={{ color: 'var(--primary)', fontWeight: '600' }}>Admin Portal</button>
            <button onClick={() => scrollTo('contact')} className="nav-cta">
              Book a visit 
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </nav>

          <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            )}
          </button>

          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Standalone Mobile Sidebar Backdrop */}
      {menuOpen && (
        <div className="nav-backdrop open" onClick={() => setMenuOpen(false)} />
      )}

      {/* Standalone Mobile Sidebar Drawer (EXACT match with Admin Portal mobile drawer) */}
      <div className={`admin-sidebar public-sidebar-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-info">
            <img src={logo} alt="Sri Venkateswara Gents PG Logo" />
            <div>
              <h3>Sri Venkateswara</h3>
              <span>Gents PG</span>
            </div>
          </div>
          <button 
            className="mobile-sidebar-close-btn" 
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <button className={`sidebar-nav-item ${activeSection === 'home' ? 'active' : ''}`} onClick={() => scrollTo('home')}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Home</span>
          </button>
          
          <button className={`sidebar-nav-item ${activeSection === 'rooms' ? 'active' : ''}`} onClick={() => scrollTo('rooms')}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M2 22V14M22 22V12M2 14h20M2 18h20M6 10h12M6 6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4H6V6z" />
            </svg>
            <span>Rooms & Rates</span>
          </button>

          <button className={`sidebar-nav-item ${activeSection === 'amenities' ? 'active' : ''}`} onClick={() => scrollTo('amenities')}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>Amenities</span>
          </button>

          <button className={`sidebar-nav-item ${activeSection === 'hotspots' ? 'active' : ''}`} onClick={() => scrollTo('hotspots')}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>Location</span>
          </button>

          <button className={`sidebar-nav-item ${activeSection === 'faq' ? 'active' : ''}`} onClick={() => scrollTo('faq')}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>FAQ</span>
          </button>

          <button className="sidebar-nav-item admin-portal-item" onClick={() => { window.location.hash = '#/admin'; setMenuOpen(false); }}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Admin Portal</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-user-profile-badge">
            <div className="profile-initials">
              SV
            </div>
            <div className="profile-details">
              <h4>Sri Venkateswara</h4>
              <span>Gents PG Management</span>
            </div>
          </div>

          <div className="sidebar-action-buttons">
            <button onClick={() => scrollTo('contact')} className="sidebar-action-btn back-home" style={{ width: '100%', justifyContent: 'center', background: 'var(--primary)', color: '#fff', border: 'none' }}>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
              <span>Book a Visit</span>
            </button>
          </div>
        </div>
      </div>

      <div className="page-content-wrapper">
        {/* Hero Section */}
        <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow">PREMIUM GENTS PG</p>
          <h1>Comfortable living,<br />feels like <em>home.</em></h1>
          <p className="hero-text">
            Thoughtfully designed gents PG spaces combining privacy, delicious home-style meals, and top-tier facilities for professionals and students.
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={() => scrollTo('rooms')}>
              Explore Rooms
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <button className="play" onClick={() => scrollTo('amenities')}>
              <i>▶</i> Learn benefits
            </button>
          </div>
          <div className="rating">
            <div className="avatars">
              <span>R</span>
              <span>A</span>
              <span>K</span>
            </div>
            <strong>4.9/5 Rating</strong>
            <span>Loved by 200+ current and past residents</span>
          </div>
        </div>

        <div className="hero-image-container">
          <div className="hero-image-wrapper">
            <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1500&q=85" alt="Clean and modern premium gents PG room" />
            <div className="availability">
              <span></span> Booking active for this month
            </div>
          </div>
          <div className="hero-stamp">
            SINCE<br />
            <b>2018</b><br />
            SV PG
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="intro">
        <p className="eyebrow">BUILT FOR MODERN PROFESSIONALS</p>
        <h2>More than just a roof.<br />A space to <em>focus & grow.</em></h2>
        <p>
          Sri Venkateswara Gents PG delivers stress-free housing with premium services. We handle the daily chores—meals, cleaning, laundry, power backup—so you can fully focus on your career, studies, and life goals.
        </p>
      </section>

      {/* Rooms Section */}
      <section className="rooms" id="rooms">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CHOOSE YOUR SPACE</p>
            <h2>Rooms configured for <em>comfort.</em></h2>
          </div>
          <button className="text-btn" onClick={() => scrollTo('contact')}>
            Check Availability
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

        <div className="room-grid">
          {rooms.map(room => (
            <article 
              className={`room-card ${selectedRoom === room.type ? 'selected' : ''}`} 
              key={room.type} 
              onClick={() => setSelectedRoom(room.type)}
            >
              <img src={room.image} alt={`${room.type} room layout`} />
              <div>
                <span className="room-type">{room.type}</span>
                <h3>{room.price}<small>/ month</small></h3>
                <p>{room.copy}</p>
                <button aria-label={`Select ${room.type}`}>
                  {selectedRoom === room.type ? 'Selected ✓' : 'Select Room'} 
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Amenities Section */}
      <section className="amenities" id="amenities">
        <div className="amenity-photo-container">
          <div className="amenity-photo">
            <img src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1100&q=80" alt="Shared common lounge and work space in PG" />
          </div>
        </div>
        <div className="amenity-copy">
          <p className="eyebrow">HASSLE-FREE LIVING</p>
          <h2>All premium amenities<br />included <em>at no extra cost.</em></h2>
          <div className="amenity-grid">
            <div className="amenity-card">
              <svg viewBox="0 0 24 24">
                <path d="M12 20h.01M16.24 15.76a6 6 0 0 0-8.49 0M19.07 12.93a10 10 0 0 0-14.14 0M21.9 10.1a14 14 0 0 0-19.8 0" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>High-speed Wi-Fi</h3>
              <p>Uncapped, dual-band internet coverage in all rooms for seamless work & streaming.</p>
            </div>
            <div className="amenity-card">
              <svg viewBox="0 0 24 24">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 2v3M10 2v3M14 2v3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>Home-style Meals</h3>
              <p>Fresh, healthy, and hygienic North & South Indian meals prepared daily in-house.</p>
            </div>
            <div className="amenity-card">
              <svg viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>24/7 Security</h3>
              <p>CCTV surveillance, biometric entry lock, and warden availability for security.</p>
            </div>
            <div className="amenity-card">
              <svg viewBox="0 0 24 24">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                <circle cx="12" cy="13" r="4"/>
                <line x1="6" y1="6" x2="6.01" y2="6"/>
                <line x1="10" y1="6" x2="14" y2="6"/>
              </svg>
              <h3>Washing Machine</h3>
              <p>Fully-automatic washing machines for hassle-free and quick self-service laundry.</p>
            </div>
            <div className="amenity-card">
              <svg viewBox="0 0 24 24">
                <path d="M14 4.5V14a4 4 0 1 1-4 0V4.5a2 2 0 1 1 4 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>Hot Water (Heat Pump)</h3>
              <p>Continuous hot water geyser systems powered by energy-efficient heat pumps.</p>
            </div>
            <div className="amenity-card">
              <svg viewBox="0 0 24 24">
                <circle cx="5.5" cy="17.5" r="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="18.5" cy="17.5" r="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 6h5v2M12 12h3.5l2.5 5.5M5.5 17.5L9 9h6M12 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>Bike Parking</h3>
              <p>Dedicated, safe, and secure two-wheeler parking spaces inside the PG gates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Location Hotspots Section */}
      <section className="hotspots" id="hotspots">
        <p className="eyebrow" style={{ textAlign: 'center' }}>PRIME LOCATION</p>
        <h2 style={{ textAlign: 'center', marginBottom: '12px' }}>Perfect connectivity to <em>everything.</em></h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 48px' }}>
          Sri Venkateswara Gents PG is strategically situated close to primary business hubs, transportation networks, and daily requirements.
        </p>

        <div className="hotspots-grid">
          <div className="hotspot-card">
            <div className="hotspot-icon">
              <svg viewBox="0 0 24 24">
                <rect x="4" y="3" width="16" height="14" rx="2"/>
                <line x1="9" y1="17" x2="6" y2="21"/>
                <line x1="15" y1="17" x2="18" y2="21"/>
                <line x1="4" y1="10" x2="20" y2="10"/>
              </svg>
            </div>
            <h3>Transit Connectivity</h3>
            <ul>
              <li><span>Metro Station</span> <span>5 Min Walk</span></li>
              <li><span>Main Bus Terminal</span> <span>10 Min Walk</span></li>
              <li><span>Auto/Cab Stand</span> <span>1 Min Walk</span></li>
            </ul>
          </div>

          <div className="hotspot-card">
            <div className="hotspot-icon">
              <svg viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <h3>Work & IT Hubs</h3>
            <ul>
              <li><span>Tech Park Alpha</span> <span>10 Min Drive</span></li>
              <li><span>Global Business Center</span> <span>15 Min Drive</span></li>
              <li><span>Financial District</span> <span>20 Min Drive</span></li>
            </ul>
          </div>

          <div className="hotspot-card">
            <div className="hotspot-icon">
              <svg viewBox="0 0 24 24">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              </svg>
            </div>
            <h3>Daily Essentials</h3>
            <ul>
              <li><span>Food Street & Diners</span> <span>2 Min Walk</span></li>
              <li><span>Supermarket / Mall</span> <span>5 Min Walk</span></li>
              <li><span>Multi-specialty Clinic</span> <span>3 Min Drive</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq" id="faq">
        <p className="eyebrow" style={{ textAlign: 'center' }}>HAVE QUESTIONS?</p>
        <h2 style={{ textAlign: 'center' }}>Frequently Asked <em>Questions.</em></h2>
        
        <div className="faq-container">
          {faqData.map((faq, index) => (
            <div className={`faq-item ${activeFaq === index ? 'open' : ''}`} key={index}>
              <button className="faq-question" onClick={() => toggleFaq(index)}>
                {faq.question}
                <svg viewBox="0 0 24 24">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking Form (Visit) */}
      <section className="visit" id="contact">
        <div>
          <p className="eyebrow">VISIT SRI VENKATESWARA PG</p>
          <h2>Schedule a visit.<br />Experience the <em>comfort.</em></h2>
          <p>Book a visit and our team will guide you through the layouts, dining setup, and common areas.</p>
          <div className="visit-info">
            <span>
              <svg viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Kodathi Gate, behind hanuman archi, Sarjapur - Ambalipura road, Banglore karnataka 560035
            </span>
            <span>
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Available for visits: Mon–Sun, 9:00 AM–8:00 PM
            </span>
          </div>
        </div>

        <div className="visit-card">
          <h3>Request a Callback</h3>
          <p className="card-subtitle">Select your room type, enter details, and we’ll reach out immediately.</p>
          
          <form onSubmit={submit}>
            <div className="form-group">
              <input 
                id="name-input"
                required 
                placeholder=" "
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
              />
              <label htmlFor="name-input">Your Full Name</label>
            </div>
            
            <div className="form-group">
              <input 
                id="phone-input"
                required 
                type="tel" 
                placeholder=" "
                value={form.phone} 
                onChange={e => setForm({...form, phone: e.target.value})} 
              />
              <label htmlFor="phone-input">Phone Number</label>
            </div>
            
            <div className="form-group">
              <input 
                id="date-input"
                required 
                type="text"
                onFocus={(e) => (e.target.type = 'date')}
                onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                placeholder=" "
                value={form.moveIn} 
                onChange={e => setForm({...form, moveIn: e.target.value})} 
              />
              <label htmlFor="date-input">Preferred Move-in Date</label>
            </div>
            
            <div className="chosen-room">
              <span>Selected Room Option:</span>
              <b>{selectedRoom}</b>
            </div>
            
            <button className="primary wide" type="submit">
              Submit Request 
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            
            {notice && <p className="notice" role="status">{notice}</p>}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <div className="footer-brand">
            <button className="brand" onClick={() => scrollTo('home')}>
              <img src={logo} alt="Sri Venkateswara Gents PG Logo" className="brand-logo" />
              <span className="brand-title">
                <span className="brand-main">SV Gents PG</span>
              </span>
            </button>
            <p>Premium, high-comfort gents PG offering home-style food, high security, and high-speed Wi-Fi in the heart of the city.</p>
          </div>
          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><button onClick={() => scrollTo('home')} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', color: 'inherit' }}>Home</button></li>
              <li><button onClick={() => scrollTo('rooms')} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', color: 'inherit' }}>Rooms</button></li>
              <li><button onClick={() => scrollTo('amenities')} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', color: 'inherit' }}>Amenities</button></li>
              <li><button onClick={() => scrollTo('hotspots')} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', color: 'inherit' }}>Location</button></li>
              <li><button onClick={() => window.location.hash = '#/admin'} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', color: 'var(--primary)', fontWeight: '600' }}>Owner Portal</button></li>
            </ul>
          </div>
          <div className="footer-contact">
            <h4>Contact Details</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a href="tel:+919110752349">
                <svg viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                +91 91107 52349
              </a>
              <a href="mailto:contact@svpg.in">
                <svg viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                contact@svpg.in
              </a>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '8px', fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '4px' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--primary)" strokeWidth="2" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>Kodathi Gate, behind hanuman archi, Sarjapur - Ambalipura road, Banglore karnataka 560035</span>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Sri Venkateswara Gents PG. All rights reserved.</span>
          <span>Made with care for premium gents PG.</span>
        </div>
      </footer>
      </div>
    </main>
  );
}

export default App;
