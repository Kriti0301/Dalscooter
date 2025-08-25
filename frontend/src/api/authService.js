import axios from 'axios';
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import userpool from '../aws/cognitoConfig';
import { toast } from 'react-toastify';

// Authenticate user with Cognito
export const authenticate = (email, password) => {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({
      Username: email,
      Pool: userpool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    user.authenticateUser(authDetails, {
      onSuccess: (result) => {
        console.log('Login successful');
        resolve(result);
      },
      onFailure: (err) => {
        console.error('Login failed:', err);
        toast.error('Invalid Email or Password');
        reject(err);
      },
    });
  });
};

// Logout user and clear local storage
export const logout = async () => {
  const user = userpool.getCurrentUser();

  if (user) {
    user.getSession(async (err, session) => {
      if (err) {
        console.error('Error getting session:', err);
      } else {
        const email = session.getIdToken().payload.email;
      }
    });

    localStorage.removeItem('auth');
    localStorage.removeItem('token');
    user.signOut();
    window.location.href = '/';
  }
};

export const verifySecurityQuestionCheck = async (data) => {
  try {
    const response = await axios.post(`${process.env.REACT_APP_BACKEND_BASE_URL}/getSecurityAnswer`, data);
    return response.data;
  } catch (error) {
    console.error('Security question check failed:', error);
    toast.error('Security question does not match');
    return null;
  }
};

export const verifyCaesarCipher = async (data) => {
  try {
    const response = await axios.post(`${process.env.REACT_APP_BACKEND_BASE_URL}/getShiftKey`, data);
    return response.data;
  } catch (error) {
    console.error('Caesar cipher check failed:', error);
    toast.error('No shift key available');
    return null;
  }
};


export const storeUserDetailsInDynamoDB = async (userDetails) => {
  try {
    const response = await axios.post(`${process.env.REACT_APP_BACKEND_BASE_URL}/register`, userDetails);
    return response.data;
  } catch (error) {
    console.error("API error:", error.response?.data || error.message);
    throw error; // Let caller handle the error
  }
};
