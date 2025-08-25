import React from 'react';
import { LockKeyhole, ArrowLeft, HomeIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Lock Icon */}
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <LockKeyhole className="w-12 h-12 text-red-500" />
          </div>

          {/* Error Message */}
          <h1 className="text-4xl font-bold text-gray-800 mb-4">403</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-8">
            Sorry, you don't have permission to access this page. Please contact 
            your administrator if you believe this is a mistake.
          </p>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleGoBack}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <HomeIcon className="w-5 h-5" />
              Return to Home
            </button>
          </div>

          {/* Support Link */}
          {/* <div className="mt-8 text-sm text-gray-500">
            Need help?{' '}
            <a 
              href="/support" 
              className="text-red-500 hover:text-red-600 font-medium"
            >
              Contact Support
            </a>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;