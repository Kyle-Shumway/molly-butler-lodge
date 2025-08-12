import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavClick = (sectionId: string) => {
    setIsMenuOpen(false);
    
    if (sectionId === 'home') {
      const isHomePage = window.location.pathname === '/molly-butler-lodge/' || window.location.pathname === '/molly-butler-lodge';
      if (isHomePage) {
        // Already on home page, just scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Navigate to home page
        navigate('/');
      }
      return;
    }

    // Navigate to home first if not already there
    const isHomePage = window.location.pathname === '/molly-butler-lodge/' || window.location.pathname === '/molly-butler-lodge';
    if (!isHomePage) {
      navigate('/');
      setTimeout(() => scrollToSection(sectionId), 100);
    } else {
      scrollToSection(sectionId);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 100; // Height of fixed header
      const elementPosition = element.offsetTop - headerHeight - 20;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header className="header">
      <nav className="nav">
        <Link to="/" className="logo">
          <h1>Molly Butler Lodge</h1>
          <span className="tagline">Est. 1910</span>
        </Link>

        <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <li><button onClick={() => handleNavClick('home')}>Home</button></li>
          <li><button onClick={() => handleNavClick('about')}>About</button></li>
          <li><button onClick={() => handleNavClick('gallery')}>Gallery</button></li>
          <li><button onClick={() => handleNavClick('food')}>Food</button></li>
          <li><Link to="/bookings" onClick={() => setIsMenuOpen(false)}>Rooms</Link></li>
          <li><button onClick={() => handleNavClick('contact')}>Contact</button></li>
        </ul>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="nav-toggle"
        >
          ☰
        </button>
      </nav>
    </header>
  );
};

export default Header;