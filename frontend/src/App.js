import React from "react";
import { BrowserRouter} from "react-router-dom";
import PublicRoutes from "./routes/PublicRoutes";
import { ToastContainer } from "react-toastify";
import { useAuth } from "./context/AuthContext";
import ProtectedRoutes from "./routes/ProtectedRoutes";
import ChatBot from './components/ChatBot';

// src/index.js  (or the very top of App.jsx – anywhere before <FranchiseMap/>)
import 'mapbox-gl/dist/mapbox-gl.css';
import { getRole } from "./utils/CheckRoles";

function AppWrapper() {
 
  return (
    <>
      <PublicRoutes />
      <ProtectedRoutes/>
    </>
  );
}

function App() {
  const {authUser,token} = useAuth();

  const userRole = token ? getRole(token) : null;

  return (
    <>
      <BrowserRouter>
        {/* <AuthProvider> */}
          <AppWrapper />
        {/* </AuthProvider> */}
      </BrowserRouter>

      {/* Chatbot injected outside routing so it's always available */}
      {userRole?.toLowerCase() !== "franchise" && !window.location.pathname.includes('login') && !window.location.pathname.includes('register') && <ChatBot />}
      <ToastContainer/>
    </>
  );
}

export default App;

