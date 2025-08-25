import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRole } from "../utils/CheckRoles";


const PrivateRoute = ({ allowedRoles }) => {
  const { token } = useAuth();
  
  if (!token) {
    return <Navigate to="/login/user" replace />;
  }

  const role = getRole(token);
  if (!role)     
   return <Navigate to="/login/user" replace />;
   
  if (!allowedRoles.includes(role))
    return <Navigate to="/unauthorized" replace />;
 

  return <Outlet />; // This renders the nested routes inside the private route
};

export default PrivateRoute;
