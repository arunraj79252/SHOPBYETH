import React from 'react'
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
const UserProtected = ({ children }) => {
    let token = localStorage.getItem("refreshToken");
    let status = localStorage.getItem("status")
    console.log("statuss",status);
    if (!token || (!token && status ==="1")) {
        toast.error("Please login");
        return <Navigate to="/" replace />;
    }
    return children;
}

export { UserProtected};