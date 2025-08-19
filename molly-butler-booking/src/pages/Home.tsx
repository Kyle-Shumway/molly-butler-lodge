import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  const [weatherData] = useState({
    location: 'Greer, AZ',
    temperature: '72°F',
    condition: 'Partly Cloudy'
  });

  const galleryImages = [
    {
      src: process.env.PUBLIC_URL + '/Historic-Molly-Butler-Lodge-And-Restaurant-Greer-AZ.jpg',
      title: 'Historic Lodge Exterior',
      description: 'The iconic Molly Butler Lodge building, established in 1910'
    },
    {
      src: process.env.PUBLIC_URL + '/mb_interior_lobby.png',
      title: 'Cozy Restaurant Interior',
      description: 'Warm, inviting dining atmosphere for family and friends'
    },
    {
      src: process.env.PUBLIC_URL + '/mb_exterior_summer.jpg',
      title: 'Arizona\'s Oldest Guest Lodge',
      description: 'Over a century of hospitality in the White Mountains'
    },
    {
      src: process.env.PUBLIC_URL + '/mb_interior_dining.png',
      title: 'Mountain Dining Experience',
      description: 'Authentic cuisine in a historic setting'
    },
    {
      src: process.env.PUBLIC_URL + '/mb_exterior_sign.jpg',
      title: 'Greer, Arizona Location',
      description: 'Nestled in the beautiful White Mountains'
    },
    {
      src: process.env.PUBLIC_URL + '/Molly-Butler-Lodge-Restaurant-1280x960.jpg',
      title: 'Family Gatherings',
      description: 'A perfect place for creating lasting memories'
    }
  ];

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thank you ${contactForm.name}! Your message has been received. We'll get back to you soon at ${contactForm.email}.`);
    setContactForm({ name: '', email: '', message: '' });
  };

  useEffect(() => {
    // Smooth scroll offset for navigation
    const handleHashScroll = () => {
      if (window.location.hash) {
        const element = document.getElementById(window.location.hash.slice(1));
        if (element) {
          const headerHeight = 100; // Approximate header height
          const elementPosition = element.offsetTop - headerHeight - 20;
          window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
          });
        }
      }
    };

    // Handle initial load
    setTimeout(handleHashScroll, 100);
    
    // Handle hash changes
    window.addEventListener('hashchange', handleHashScroll);
    return () => window.removeEventListener('hashchange', handleHashScroll);
  }, []);

  return (
    <div className="home">
      {/* Hero Section */}
      <section 
        className="hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${process.env.PUBLIC_URL}/Historic-Molly-Butler-Lodge-And-Restaurant-Greer-AZ.jpg')`
        }}
      >
        <div className="hero-content">
          <h2>Arizona's Oldest Guest Lodge</h2>
          <p>A Place For Family & Friends</p>
          <div className="weather-widget">
            <div className="weather-location">{weatherData.location}</div>
            <div className="weather-temp">{weatherData.temperature}</div>
            <div className="weather-condition">{weatherData.condition}</div>
          </div>
          <Link to="/bookings" className="btn btn-primary">
            Book Your Stay
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section section-white">
        <div className="container">
          <h2 className="section-title">Welcome to Molly Butler Lodge</h2>
          <p className="section-content">
            Nestled in the beautiful White Mountains of Arizona, Molly Butler Lodge has been serving guests since 1910. 
            Our historic lodge offers a warm, welcoming atmosphere where families and friends can gather to create lasting memories.
          </p>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="section section-gray">
        <div className="container">
          <h2 className="section-title">Gallery</h2>
          <div className="gallery-grid">
            {galleryImages.map((image, index) => (
              <div key={index} className="gallery-item">
                <img 
                  src={image.src} 
                  alt={image.title}
                />
                <div className="gallery-item-content">
                  <h3>{image.title}</h3>
                  <p>{image.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Food Section */}
      <section id="food" className="dining-section">
        <div className="container">
          <div className="dining-header">
            <h2 className="section-title">Dining</h2>
            <p className="section-content">
              Experience authentic mountain dining in our historic restaurant. We serve hearty meals made with fresh, local ingredients.
            </p>
          </div>
          
          <div className="dining-content">
            <div className="menu-section">
              <h3 className="menu-section-title">Our Menus</h3>
              <div className="menu-grid">
                <a 
                  href="https://mollybutlerlodge1910.com/wp-content/uploads/2021/08/SHA_2861351_MollyButlerLodge_Dinner_R3_Proof.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="menu-card"
                  style={{ padding: '2rem', textAlign: 'center' }}
                >
                  <h4 className="menu-card-title">Dinner Menu</h4>
                  <p className="menu-card-description">Full dinner selections and specialties</p>
                </a>
                <a 
                  href="https://mollybutlerlodge1910.com/wp-content/uploads/2021/08/SHA_2861351_MollyButlerLodge_Lunch_R4_Proof.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="menu-card"
                  style={{ padding: '2rem', textAlign: 'center' }}
                >
                  <h4 className="menu-card-title">Lunch Menu</h4>
                  <p className="menu-card-description">Lighter fare and lunch favorites</p>
                </a>
                <a 
                  href="https://mollybutlerlodge1910.com/wp-content/uploads/2020/07/Mollys-Kids-Menu-7-20.jpg" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="menu-card"
                  style={{ padding: '2rem', textAlign: 'center' }}
                >
                  <h4 className="menu-card-title">Kids Menu</h4>
                  <p className="menu-card-description">Child-friendly options</p>
                </a>
              </div>
              
              <div className="reservations-box">
                <h3>Reservations</h3>
                <p>We recommend making reservations</p>
                <p>
                  <strong>Call:</strong> <a href="tel:928-735-7226">(928) 735-7226</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section contact-section">
        <div className="container">
          <h2 className="section-title">Contact Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="contact-card" style={{ padding: '2rem' }}>
              <h3 className="contact-card-title">Visit Us</h3>
              <p>109 Main Street<br />Greer, AZ 85927</p>
              <p>
                <strong>Phone:</strong> 
                <a href="tel:928-735-7226" style={{ marginLeft: '0.5rem' }}>(928) 735-7226</a>
              </p>
            </div>
            <div className="contact-card" style={{ padding: '2rem' }}>
              <h3 className="contact-card-title">Send us a message</h3>
              <form onSubmit={handleContactSubmit} className="contact-form-enhanced" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                  required
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  required
                />
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  style={{ resize: 'none' }}
                  required
                />
                <button type="submit">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;