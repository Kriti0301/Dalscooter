import React, { useState, useEffect } from "react";
import {
  Shield,
  Check,
  AlertCircle,
  Lock,
  Home,
} from "lucide-react";
import { verifySecurityQuestionCheck } from "./../../api/authService";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";

const SecurityQuestionCheck = () => {
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Simulate loading security question
    const loadSecurityQuestion = async () => {
      setIsLoading(true);
    //   // Simulate API call delay
    //   await new Promise((resolve) => setTimeout(resolve, 1000));
      setSecurityQuestion("What’s your favorite movie?");
      setIsLoading(false);
    };

    loadSecurityQuestion();
  }, []);

  const validateAnswer = (value) => {
    if (!value.trim()) {
      return "Please enter an answer to the security question";
    }
    if (value.trim().length < 2) {
      return "Answer must be at least 2 characters long";
    }
    return "";
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setAnswer(value);

    // Clear error when user starts typing
    if (error) {
      setError("");
    }

    // Validate if field has been touched
    if (touched) {
      const validationError = validateAnswer(value);
      setError(validationError);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    const validationError = validateAnswer(answer);
    setError(validationError);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateAnswer(answer);
    if (validationError) {
      setError(validationError);
      setTouched(true);
      return;
    }
    let state = location.state;
    let data = {
      email: state.username,
    };

    setIsSubmitting(true);
    verifySecurityQuestionCheck(data)
      .then(async (body) => {
        if (body.securityAnswer === answer) {
          toast.success("Security QnA Passed", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
          });
        //   await logEvent(state.username, "security question passed");
          navigate("/verifyceasercipher", {
            state: { username: state.username, auth: state.auth },
          });
        } else {
          toast.error("Wrong Answer inputed for Question", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
          });
        }
      })
      .catch(async (err) => {
        toast.error("Wrong Answer inputed for Question", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
        console.log(err);
        // await logEvent(state.username, "security question failed");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleGoHome = () => {
  navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading security question...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border">
      {/* Header */}
      <div className="bg-slate-900 px-8 py-6">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-blue-600 p-3 rounded-full">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Security Verification
        </h1>
        <p className="text-slate-300 text-center text-sm">
          Please answer your security question to continue
        </p>
      </div>

      {/* Form */}
      <div className="p-8">
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Lock className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">
                  Security Question
                </p>
                <p className="text-blue-700 font-medium">
                  {securityQuestion}
                </p>
              </div>
            </div>
          </div>

          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Your Answer
          </label>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onBlur={() => setTouched(true)}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              error && touched
                ? "border-red-300 bg-red-50"
                : "border-gray-300 bg-white hover:border-gray-400"
            } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            placeholder="Enter your answer"
          />

          {error && touched && (
            <div className="mt-2 flex items-center text-red-600">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (error && touched)}
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all duration-200 ${
              isSubmitting || (error && touched)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Verifying...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Verify Answer
              </>
            )}
          </button>

          <button
            disabled={isSubmitting}
            className={`w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white transition-all duration-200 ${
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-50 hover:border-gray-400"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-gray-50 px-8 py-4 border-t">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-green-600 font-medium">Login</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300"></div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <span className="text-blue-600 font-medium">Security</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300"></div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2">
              <span className="text-gray-500 text-xs font-bold">3</span>
            </div>
            <span className="text-gray-500">Cipher</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default SecurityQuestionCheck;
