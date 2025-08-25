import React from "react";
import { Route, Routes } from "react-router-dom";
import { Register } from "../pages/Authentication/RegisterPage";
import { Login } from "../pages/Authentication/LoginPage";

import UnauthorizedPage from "../pages/Authentication/UnauthorizedPage";
import VerificationEmail from "../pages/Authentication/VerifyEmailPage";
import SecurityQuestionCheck from "../pages/Authentication/SecurityQuestionCheck";
import CaesarCipher from "../pages/Authentication/CaesarCipherPage";
import DalScooterLanding from "../pages/Landing";
import CustomerReviews from "../pages/CustomerReviews";

const PublicRoutes = () => {
  return (
    <Routes>
      <Route exact path="/" element={<DalScooterLanding />}/>
      <Route exact path="/reviews" element={<CustomerReviews />}/>

      <Route exact path="/login/:type" element={<Login />} />
      <Route path="/verifysecurityanswer" element={<SecurityQuestionCheck />} />
      <Route path="/verifyceasercipher" element={<CaesarCipher />} />
    
      <Route exact path="/verify" element={<VerificationEmail />} />
      <Route exact path="/register/:type" element={<Register />} />
      <Route exact path="/" element={<Login />} />
      <Route exact path="/unauthorized" element={<UnauthorizedPage />} />
    </Routes>
  );
};

export default PublicRoutes;
