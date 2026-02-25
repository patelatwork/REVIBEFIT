import { useState } from 'react';
import PropTypes from 'prop-types';

const TrainerCard = ({ trainer }) => {
  const [imageError, setImageError] = useState(false);
  
  const getCertificationUrl = (certPath) => {
    if (!certPath) return null;
    // If it's already a full URL, return it
    if (certPath.startsWith('http')) return certPath;
    // Otherwise, construct the backend URL
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${certPath}`;
  };

  const handleViewCertification = () => {
    const certUrl = getCertificationUrl(trainer.certifications);
    if (certUrl) {
      window.open(certUrl, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border-2 border-[#3f8554]">
      {/* Trainer Image */}
      <div className="h-64 bg-gradient-to-br from-[#225533] to-[#3f8554] flex items-center justify-center relative overflow-hidden">
        {!imageError && trainer.profileImage ? (
          <img
            src={trainer.profileImage}
            alt={trainer.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-[#fffff0] flex items-center justify-center">
            <span className="text-5xl font-bold text-[#225533]">
              {trainer.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Trainer Info */}
      <div className="p-6">
        <h3 className="text-2xl font-bold text-[#225533] mb-2">{trainer.name}</h3>
        
        <div className="mb-4">
          <p className="text-gray-600 text-sm mb-1">
            <span className="font-semibold">Specialization:</span>
          </p>
          <p className="text-[#3f8554] font-medium">{trainer.specialization}</p>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 text-sm mb-1">
            <span className="font-semibold">Contact:</span>
          </p>
          <p className="text-[#225533]">{trainer.phone}</p>
          <p className="text-[#225533] text-sm">{trainer.email}</p>
        </div>

        {/* Certification Badge */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center">
            <svg 
              className="w-6 h-6 text-green-500 mr-2" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                clipRule="evenodd" 
              />
            </svg>
            <span className="text-sm font-semibold text-green-600">Certified</span>
          </div>
          
          {trainer.certifications && (
            <button
              onClick={handleViewCertification}
              className="text-sm text-[#3f8554] hover:text-[#225533] font-semibold underline transition-colors duration-200"
            >
              View Certification
            </button>
          )}
        </div>

        {/* Approved Badge */}
        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          <svg 
            className="w-4 h-4 mr-1" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          </svg>
          Approved & Verified
        </div>
      </div>
    </div>
  );
};

TrainerCard.propTypes = {
  trainer: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    age: PropTypes.number.isRequired,
    specialization: PropTypes.string.isRequired,
    certifications: PropTypes.string,
    profileImage: PropTypes.string,
    isApproved: PropTypes.bool,
  }).isRequired,
};

export default TrainerCard;
