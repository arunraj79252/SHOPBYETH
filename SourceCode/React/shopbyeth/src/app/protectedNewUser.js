import React from 'react'
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
const ProtectedNewUser = ({ children }) => {
    let token = localStorage.getItem("status");
    console.log(token);
    if (token === "0") {
        return children;
        
    }
    else{
        toast.error("Not allowed");
        return <Navigate to="/" replace />;
    }
    
}

export default ProtectedNewUser