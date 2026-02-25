import { useState } from 'react';
import PropTypes from 'prop-types';

const LabPartnerCard = ({ labPartner, onViewDetails }) => {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border-2 border-[#3f8554]">
      {/* Lab Partner Image/Icon */}
      <div className="h-48 bg-gradient-to-br from-[#225533] to-[#3f8554] flex items-center justify-center relative overflow-hidden">
        {!imageError && labPartner.profileImage ? (
          <img
            src={labPartner.profileImage}
            alt={labPartner.laboratoryName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-[#fffff0] flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-[#225533]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" 
              />
            </svg>
          </div>
        )}
      </div>

      {/* Lab Partner Info */}
      <div className="p-6">
        <h3 className="text-2xl font-bold text-[#225533] mb-2">
          {labPartner.laboratoryName}
        </h3>
        
        <div className="mb-3">
          <p className="text-gray-600 text-sm mb-1">
            <span className="font-semibold">Contact Person:</span>
          </p>
          <p className="text-[#3f8554] font-medium">{labPartner.name}</p>
        </div>

        <div className="mb-3">
          <p className="text-gray-600 text-sm mb-1">
            <span className="font-semibold">Address:</span>
          </p>
          <p className="text-[#225533] text-sm">{labPartner.laboratoryAddress}</p>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 text-sm mb-1">
            <span className="font-semibold">Contact:</span>
          </p>
          <p className="text-[#225533]">{labPartner.phone}</p>
          <p className="text-[#225533] text-sm">{labPartner.email}</p>
        </div>

        {/* License Badge */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 mb-4">
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
            <div>
              <span className="text-sm font-semibold text-green-600 block">Licensed</span>
              <span className="text-xs text-gray-500">Lic: {labPartner.licenseNumber}</span>
            </div>
          </div>
        </div>

        {/* Approved Badge */}
        <div className="mb-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
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
          Admin Approved
        </div>

        {/* View Tests & Book Button */}
        <button
          onClick={() => onViewDetails(labPartner)}
          className="w-full mt-4 bg-[#3f8554] hover:bg-[#225533] text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
            />
          </svg>
          View Tests & Book
        </button>
      </div>
    </div>
  );
};

LabPartnerCard.propTypes = {
  labPartner: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    laboratoryName: PropTypes.string.isRequired,
    laboratoryAddress: PropTypes.string.isRequired,
    licenseNumber: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    profileImage: PropTypes.string,
  }).isRequired,
  onViewDetails: PropTypes.func.isRequired,
};

export default LabPartnerCard;
