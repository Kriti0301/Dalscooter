import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import userpool from '../../aws/cognitoConfig';
import { CognitoUser } from "amazon-cognito-identity-js";
import { toast } from 'react-toastify';
import { Mail } from 'lucide-react';

// Validation schema
const validationSchema = Yup.object({
  code: Yup.string()
    .required('Verification code is required')
    .min(6, 'Verification code must be at least 6 characters')
    .matches(/^\d+$/, 'Verification code must contain only numbers'),
});

const VerificationEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const initialValues = {
    code: '',
  };

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const state = location.state;
      
      if (!state || !state.username) {
        toast.error("Session expired. Please register again.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
        navigate('/user/register');
        return;
      }

      const userData = {
        Username: state.username,
        Pool: userpool,
      };

      const cognitoUser = new CognitoUser(userData);
      
      cognitoUser.confirmRegistration(values.code, true, function (err, result) {
        if (err) {
          console.error('Verification error:', err);
          toast.error("Email Verification Failed. Please check the code", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
          });
          setFieldError('code', 'Invalid verification code. Please try again.');
          setSubmitting(false);
          return;
        }
        
        console.log("Verification successful:", result);
        toast.success("Email Verification Successful", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
        setSubmitting(false);
        navigate('/login/user');
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("An unexpected error occurred", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      setSubmitting(false);
    }
  };

  const handleResendCode = () => {
    const state = location.state;
    if (!state || !state.username) {
      toast.error("Session expired. Please register again.", {
        position: "top-right",
        autoClose: 5000,
        theme: "dark",
      });
      navigate('/user/register');
      return;
    }

    const userData = {
      Username: state.username,
      Pool: userpool,
    };

    const cognitoUser = new CognitoUser(userData);
    
    cognitoUser.resendConfirmationCode(function(err, result) {
      if (err) {
        console.error('Resend error:', err);
        toast.error("Failed to resend verification code", {
          position: "top-right",
          autoClose: 5000,
          theme: "dark",
        });
        return;
      }
      console.log('Resend result:', result);
      toast.success("Verification code resent to your email", {
        position: "top-right",
        autoClose: 5000,
        theme: "dark",
      });
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Image (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="w-20 h-20 mx-auto mb-8 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Almost There!</h2>
          <p className="text-xl text-slate-300 max-w-md mx-auto">
            We've sent a verification code to your email. Please check your inbox and enter the code to complete your registration.
          </p>
        </div>
      </div>


      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-indigo-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
            <p className="text-gray-600">
              Enter the 6-digit verification code sent to your email address
            </p>
            {location.state?.username && (
              <p className="text-sm text-indigo-600 mt-2 font-medium">
                {location.state.username}
              </p>
            )}
          </div>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form className="space-y-6">
                {/* Verification Code Field */}
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <Field
                    type="text"
                    name="code"
                    maxLength="6"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-center text-2xl font-mono tracking-widest ${
                      errors.code && touched.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                  <ErrorMessage name="code" component="p" className="mt-1 text-sm text-red-600" />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    'Verify Email'
                  )}
                </button>

                {/* Additional Actions */}
                <div className="space-y-4">
                  {/* Resend Code */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                      Didn't receive the code? Resend
                    </button>
                  </div>

                  {/* Navigation Links */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      className="text-gray-600 hover:text-gray-700 font-medium transition-colors"
                    >
                      ← Back to Home
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/login/user")}
                      className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                      Already verified? Sign in
                    </button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Tip:</strong> Check your spam/junk folder if you don't see the email. The code expires in 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationEmail;