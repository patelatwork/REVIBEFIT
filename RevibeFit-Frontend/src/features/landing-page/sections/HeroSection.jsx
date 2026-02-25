import { Link } from 'react-router-dom';
import heroImage from '../../../assets/Fitness.jpeg';

const HeroSection = () => {
  return (
    <section 
      className="relative min-h-screen flex items-center bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7)), url(${heroImage})`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="max-w-3xl">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#225533] leading-tight mb-6 text-left">
            Transform Your Life Through Fitness
          </h1>
          
          {/* Subheading */}
          <p className="text-lg md:text-xl text-gray-700 mb-10 leading-relaxed text-left">
            Join RevibeFit and get access to personalized workout plans, expert trainers, and a 
            supportive community to help you achieve your fitness goals.
          </p>
          
          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/signup" 
              className="inline-flex items-center justify-center px-8 py-4 bg-[#3f8554] text-white text-lg font-semibold rounded-full hover:bg-[#225533] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started
              <svg 
                className="ml-2 w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 7l5 5m0 0l-5 5m5-5H6" 
                />
              </svg>
            </Link>
            
            <a 
              href="https://youtu.be/37UhELFvPec?si=uLh9roUn1fL0PKep"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#3f8554] text-lg font-semibold rounded-full border-2 border-[#3f8554] hover:bg-[#3f8554] hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg 
                className="mr-2 w-6 h-6" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  d="M8 5v14l11-7z" 
                />
              </svg>
              Watch Video
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
