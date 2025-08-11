// Mobile navigation toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
        navMenu.classList.remove('active');
    }
});

// Smooth scrolling for navigation links with offset
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = target.offsetTop - headerHeight - 20; // 20px extra padding
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Weather widget functionality
async function loadWeather() {
    const weatherInfo = document.getElementById('weather-info');
    
    // Using a simple weather API (you may need to get an API key)
    // For now, showing placeholder data
    try {
        // This is a placeholder - you'd need to implement actual weather API
        const mockWeatherData = {
            location: 'Greer, AZ',
            temperature: '72°F',
            condition: 'Partly Cloudy',
            humidity: '45%'
        };
        
        weatherInfo.innerHTML = `
            <div class="weather-location">${mockWeatherData.location}</div>
            <div class="weather-temp">${mockWeatherData.temperature}</div>
            <div class="weather-condition">${mockWeatherData.condition}</div>
        `;
    } catch (error) {
        weatherInfo.innerHTML = `
            <div class="weather-location">Greer, AZ</div>
            <div class="weather-temp">Weather Unavailable</div>
        `;
    }
}

// Gallery functionality
const galleryImages = [
    {
        src: 'Historic-Molly-Butler-Lodge-And-Restaurant-Greer-AZ.jpg',
        title: 'Historic Lodge Exterior',
        description: 'The iconic Molly Butler Lodge building, established in 1910'
    },
    {
        src: 'Molly-Butler-Lodge-Restaurant-1280x960.jpg',
        title: 'Cozy Restaurant Interior',
        description: 'Warm, inviting dining atmosphere for family and friends'
    },
    {
        src: 'Historic-Molly-Butler-Lodge-And-Restaurant-Greer-AZ.jpg',
        title: 'Arizona\'s Oldest Guest Lodge',
        description: 'Over a century of hospitality in the White Mountains'
    },
    {
        src: 'Molly-Butler-Lodge-Restaurant-1280x960.jpg',
        title: 'Mountain Dining Experience',
        description: 'Authentic cuisine in a historic setting'
    },
    {
        src: 'Historic-Molly-Butler-Lodge-And-Restaurant-Greer-AZ.jpg',
        title: 'Greer, Arizona Location',
        description: 'Nestled in the beautiful White Mountains'
    },
    {
        src: 'Molly-Butler-Lodge-Restaurant-1280x960.jpg',
        title: 'Family Gatherings',
        description: 'A perfect place for creating lasting memories'
    }
];

function loadGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    
    galleryImages.forEach(image => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.innerHTML = `
            <img src="${image.src}" alt="${image.title}" loading="lazy">
            <div class="gallery-item-content">
                <h3>${image.title}</h3>
                <p>${image.description}</p>
            </div>
        `;
        galleryGrid.appendChild(galleryItem);
    });
}

// Contact form handling
document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    // Here you would typically send the form data to a server
    // For now, we'll just show a success message
    alert(`Thank you ${name}! Your message has been received. We'll get back to you soon at ${email}.`);
    
    // Reset the form
    this.reset();
});

// Initialize page functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadWeather();
    loadGallery();
    
    // Add scroll effect to header
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(139, 69, 19, 0.95)';
        } else {
            header.style.background = '#8B4513';
        }
    });
});

// Add some interactive animations
function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe sections for scroll animations
    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
}

// Initialize scroll animations
document.addEventListener('DOMContentLoaded', addScrollAnimations);