// components/PrivateRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import "../index.css";
import Loader from "../components/ui/Loader";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children, roles }) => {
const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#00b090] via-[#00a080] to-[#008361] ">
        <Loader/>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" />; // make sure this route exists
  }

  return children;
};

export default PrivateRoute;