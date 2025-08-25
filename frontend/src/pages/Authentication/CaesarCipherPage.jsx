import React, { useState, useEffect } from "react";
import { Key, RefreshCw, CheckCircle, XCircle, Info, Lightbulb, Home, ArrowRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {verifyCaesarCipher} from './../../api/authService';
import { useAuth } from "../../context/AuthContext";
import { getRole } from "../../utils/CheckRoles";

const CaesarCipher = () => {
  const [cipherText, setCipherText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const [shiftKey, setShiftKey] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const [hasMounted, setHasMounted] = useState(false);
  const {setVerifiedAuthUser} = useAuth();
  useEffect(() => {
    const initializeCipher = async () => {
      setIsLoading(true);
      
      if(location.state == null){
        navigate("/");
        return;
      }
      
      verifyCaesarCipher({ email: location.state.username })
      .then((body) => {
        if (body.shiftKey !== null) {
          setShiftKey(body.shiftKey)
          const original = generateRandomText(4); // Generate random 4-char text
          setOriginalText(original);
          const ciphered = applyCipher(original, parseInt(body.shiftKey));
          console.log("original", original);
          console.log("cipher", ciphered);
          setCipherText(ciphered);
        }
      })
      .catch((err) => {
        console.log(err);
      }).finally(()=> {
        setIsLoading(false);
      });
    };

    if (!hasMounted) {
      setHasMounted(true);
      initializeCipher();
    }
  }, [hasMounted, location.state]);

  // Function to generate random 4-char text
  function generateRandomText(length) {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  }

  // Function to apply Caesar cipher
  function applyCipher(text, shift) {
    return text
      .split("")
      .map((char) => {
        let shiftedChar = String.fromCharCode(
          ((char.charCodeAt(0) - 65 + shift) % 26) + 65
        );
        return shiftedChar;
      })
      .join("");
  }

  // Function to apply reverse Caesar cipher for hint
  function reverseApplyCipher(text, shift) {
    return text
      .split("")
      .map((char) => {
        let shiftedChar = String.fromCharCode(
          ((char.charCodeAt(0) - 65 - shift + 26) % 26) + 65
        );
        return shiftedChar;
      })
      .join("");
  }

  const validateInput = (value) => {
    if (!value.trim()) {
      return "Please enter your answer";
    }
    if (value.trim().length !== 4) {
      return "Answer must be exactly 4 characters";
    }
    if (!/^[A-Za-z]+$/.test(value.trim())) {
      return "Answer must contain only letters";
    }
    return "";
  };

  const handleChange = (e) => {
    const value = e.target.value.toUpperCase();
    setUserInput(value);
    
    if (error) {
      setError("");
    }

    if (touched) {
      const validationError = validateInput(value);
      setError(validationError);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    const validationError = validateInput(userInput);
    setError(validationError);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateInput(userInput);
    if (validationError) {
      setError(validationError);
      setTouched(true);
      return;
    }

    setIsSubmitting(true);
    setAttempts(prev => prev + 1);

    if (userInput.toUpperCase() === originalText) {
        // alert('Correct! Well done.');
        // const authData = JSON.stringify(location.state);
        // localStorage.setItem("auth", authData);
        setVerifiedAuthUser(location.state.auth)
        window.dispatchEvent(new Event("storage")); // Trigger storage event
        toast.success("Successfull Authentication", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
        // logEvent(location.state.username, "ceaser cipher passed");
        window.location.replace(`/${getRole(location.state.auth.jwtToken)}/dashboard`); // or another appropriate route
      } else {
        setIsSubmitting(false);

        if (attempts >= 2) {
          setShowHint(true);
        }
        toast.error("Ceaser Cipher multi-factor failed", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
        setError("Incorrect. Please try again.");
        // logEvent(location.state.username, "ceaser cipher failed");
      }
    
  };

  const handleNewChallenge = () => {
    const original = generateRandomText(4);
    setOriginalText(original);
    const ciphered = applyCipher(original, shiftKey);
    console.log("original", original);
    console.log("cipher", ciphered);
    
    setCipherText(ciphered);
    setUserInput("");
    setError("");
    setTouched(false);
    setAttempts(0);
    setShowHint(false);
  };

  const handleGoHome = () => {
   navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating cipher challenge...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    // <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
    //   <div className="flex min-h-screen items-center justify-center p-4">
    //     <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
    //       {/* Header */}
    //       <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
    //         <div className="flex items-center justify-center mb-4">
    //           <div className="bg-white bg-opacity-20 p-3 rounded-full">
    //             <Key className="w-8 h-8 text-white" />
    //           </div>
    //         </div>
    //         <h1 className="text-2xl font-bold text-white text-center mb-2">
    //           Caesar Cipher Challenge
    //         </h1>
    //         <p className="text-purple-100 text-center text-sm">
    //           Decode the encrypted message to complete authentication
    //         </p>
    //       </div>

    //       {/* Challenge Display */}
    //       <div className="p-8">
    //         <div className="bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 rounded-xl p-6 mb-6">
    //           <div className="text-center">
    //             <p className="text-sm font-medium text-purple-800 mb-3">Encrypted Message</p>
    //             <div className="bg-white rounded-lg p-4 shadow-inner">
    //               <div className="text-3xl font-mono font-bold text-purple-900 tracking-wider">
    //                 {cipherText.split('').map((char, index) => (
    //                   <span 
    //                     key={index}
    //                     className="inline-block mx-1 p-2 bg-purple-50 rounded border-2 border-purple-200"
    //                   >
    //                     {char}
    //                   </span>
    //                 ))}
    //               </div>
    //             </div>
    //             <button
    //               onClick={handleNewChallenge}
    //               className="mt-4 text-sm text-purple-600 hover:text-purple-700 flex items-center justify-center mx-auto transition-colors"
    //             >
    //               <RefreshCw className="w-4 h-4 mr-1" />
    //               Generate New Challenge
    //             </button>
    //           </div>
    //         </div>

    //         {/* Info Panel */}
    //         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    //           <div className="flex items-start">
    //             <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
    //             <div className="text-sm">
    //               <p className="font-medium text-blue-800 mb-1">How it works</p>
    //               <p className="text-blue-700">
    //                 In a Caesar cipher, each letter is shifted by a fixed number of positions in the alphabet. 
    //                 Decode the message above to reveal the original 4-letter word.
    //               </p>
    //             </div>
    //           </div>
    //         </div>

    //         {/* Hint Panel */}
    //         {showHint && (
    //           <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
    //             <div className="flex items-start">
    //               <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
    //               <div className="text-sm">
    //                 <p className="font-medium text-yellow-800 mb-2">Hint</p>
    //                 <p className="text-yellow-700 mb-2">
    //                   Try shifting each letter backward by {shiftKey} positions in the alphabet.
    //                 </p>
    //                 <div className="text-xs text-yellow-600 font-mono bg-yellow-100 p-2 rounded">
    //                   Example: {cipherText[0]} → {reverseApplyCipher(cipherText[0], shiftKey)}
    //                 </div>
    //               </div>
    //             </div>
    //           </div>
    //         )}

    //         {/* Input Form */}
    //         <div className="mb-6">
    //           <label htmlFor="answer" className="block text-sm font-semibold text-gray-700 mb-2">
    //             Your Answer
    //           </label>
    //           <input
    //             type="text"
    //             id="answer"
    //             value={userInput}
    //             onChange={handleChange}
    //             onBlur={handleBlur}
    //             maxLength={4}
    //             disabled={isSubmitting}
    //             className={`w-full px-4 py-3 text-center text-xl font-mono font-bold tracking-wider border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
    //               error && touched
    //                 ? "border-red-300 bg-red-50"
    //                 : "border-gray-300 bg-white hover:border-gray-400"
    //             } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
    //             placeholder="ABCD"
    //           />
              
    //           {error && touched && (
    //             <div className="mt-2 flex items-center text-red-600">
    //               <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />
    //               <p className="text-sm">{error}</p>
    //             </div>
    //           )}

    //           {attempts > 0 && !error && (
    //             <p className="mt-2 text-sm text-gray-600">
    //               Attempts: {attempts}
    //             </p>
    //           )}
    //         </div>

    //         {/* Actions */}
    //         <div className="space-y-4">
    //           <button
    //             type="button"
    //             onClick={handleSubmit}
    //             disabled={isSubmitting || (error && touched)}
    //             className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all duration-200 ${
    //               isSubmitting || (error && touched)
    //                 ? "bg-gray-400 cursor-not-allowed"
    //                 : "bg-purple-600 hover:bg-purple-700 hover:shadow-lg active:transform active:scale-95"
    //             } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
    //           >
    //             {isSubmitting ? (
    //               <>
    //                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    //                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    //                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    //                 </svg>
    //                 Decoding...
    //               </>
    //             ) : (
    //               <>
    //                 <CheckCircle className="w-5 h-5 mr-2" />
    //                 Submit Answer
    //               </>
    //             )}
    //           </button>

    //           <button
    //             type="button"
    //             onClick={handleGoHome}
    //             disabled={isSubmitting}
    //             className={`w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white transition-all duration-200 ${
    //               isSubmitting
    //                 ? "opacity-50 cursor-not-allowed"
    //                 : "hover:bg-gray-50 hover:border-gray-400 active:transform active:scale-95"
    //             } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
    //           >
    //             <Home className="w-5 h-5 mr-2" />
    //             Back to Home
    //           </button>
    //         </div>
    //       </div>

    //       {/* Progress Indicator */}
    //       <div className="bg-gray-50 px-8 py-4">
    //         <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
    //           <div className="flex items-center">
    //             <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
    //               <CheckCircle className="w-3 h-3 text-white" />
    //             </div>
    //             <span className="text-green-600 font-medium">Login</span>
    //           </div>
    //           <ArrowRight className="w-4 h-4 text-gray-400" />
    //           <div className="flex items-center">
    //             <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
    //               <CheckCircle className="w-3 h-3 text-white" />
    //             </div>
    //             <span className="text-green-600 font-medium">Security</span>
    //           </div>
    //           <ArrowRight className="w-4 h-4 text-gray-400" />
    //           <div className="flex items-center">
    //             <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-2">
    //               <span className="text-white text-xs font-bold">3</span>
    //             </div>
    //             <span className="text-purple-600 font-medium">Cipher</span>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </div>
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border">
      {/* Header */}
      <div className="bg-slate-900 px-8 py-6">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-blue-600 p-3 rounded-full">
            <Key className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Caesar Cipher Challenge
        </h1>
        <p className="text-slate-300 text-center text-sm">
          Decode the encrypted message to complete authentication
        </p>
      </div>

      {/* Challenge Display */}
      <div className="p-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="text-center">
            <p className="text-sm font-medium text-blue-800 mb-3">Encrypted Message</p>
            <div className="bg-white rounded-lg p-4 shadow-inner">
              <div className="text-3xl font-mono font-bold text-blue-900 tracking-wider">
                {cipherText.split('').map((char, index) => (
                  <span 
                    key={index}
                    className="inline-block mx-1 p-2 bg-blue-50 rounded border-2 border-blue-200"
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={handleNewChallenge}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center mx-auto transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Generate New Challenge
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-gray-800 mb-1">How it works</p>
              <p className="text-gray-700">
                In a Caesar cipher, each letter is shifted by a fixed number of positions in the alphabet. 
                Decode the message above to reveal the original 4-letter word.
              </p>
            </div>
          </div>
        </div>

        {/* Hint Panel */}
        {showHint && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-2">Hint</p>
                <p className="text-yellow-700 mb-2">
                  Try shifting each letter backward by {shiftKey} positions in the alphabet.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Your Answer
          </label>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.toUpperCase())}
            onBlur={() => setTouched(true)}
            maxLength={4}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 text-center text-xl font-mono font-bold tracking-wider border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              error && touched
                ? "border-red-300 bg-red-50"
                : "border-gray-300 bg-white hover:border-gray-400"
            } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            placeholder="ABCD"
          />
          
          {error && touched && (
            <div className="mt-2 flex items-center text-red-600">
              <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {attempts > 0 && !error && (
            <p className="mt-2 text-sm text-gray-600">
              Attempts: {attempts}
            </p>
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
                Decoding...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Submit Answer
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
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
            <span className="text-green-600 font-medium">Login</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
            <span className="text-green-600 font-medium">Security</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs font-bold">3</span>
            </div>
            <span className="text-blue-600 font-medium">Cipher</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default CaesarCipher;