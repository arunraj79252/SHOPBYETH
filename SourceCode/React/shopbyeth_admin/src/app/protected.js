import React from 'react'
import { Navigate } from "react-router-dom";
const AdminProtected = ({ children }) => {
    let token = localStorage.getItem("refreshToken");
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

export { AdminProtected};
