import React, { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import Nav from "react-bootstrap/Nav";
import useAppContext from "../AppContext";

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const appContext = useAppContext()
  useMemo(()=>{
    console.log(appContext.isLoggedIn());
    
    console.log(location);
    
    
  },[useLocation()])
  const logout = () =>{
    localStorage.clear()
    appContext.logout()
    navigate("/login")
  }
  return (
    <Navbar
      collapseOnSelect
      expand="lg"
      className="navBar"
      style={{ padding: "11px" }}
      sticky="top"
    >
      <Navbar.Brand >
        <i className="fa-solid fa-cubes"></i> SHOP BY ETH
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav" >
        <Nav className="me-auto">
        {appContext.isLoggedIn() &&<Nav.Link className={`${location.pathname==="/dashboard"&&"active-nav-link"}  me-2` } as={Link} to="/dashboard">
            Dashboard
          </Nav.Link>}
          {appContext.isLoggedIn() &&<Nav.Link className={`${location.pathname==="/users"&&"active-nav-link"} me-2` } as={Link} to="/users">
            Users
          </Nav.Link>}
          {appContext.isLoggedIn() &&<Nav.Link className={`${location.pathname==="/products"&&"active-nav-link"} me-2` } as={Link} to="/products">
            Products
          </Nav.Link>}
          {appContext.isLoggedIn() &&<Nav.Link className={`${location.pathname==="/category"&&"active-nav-link"} me-2` } as={Link} to="/category">
            Category
          </Nav.Link>}
          {appContext.isLoggedIn() &&<Nav.Link className={`${location.pathname==="/brands"&&"active-nav-link"} me-2` } as={Link} to="/brands">
            Brands
          </Nav.Link>}
          {appContext.isLoggedIn() &&<Nav.Link className={`${location.pathname==="/orders"&&"active-nav-link"} me-2` } as={Link} to="/orders">
            Orders
          </Nav.Link>}
          {appContext.isLoggedIn() &&<Nav.Link className={`${location.pathname==="/chatList"&&"active-nav-link"} me-2` } as={Link} to="/chatList">
            Chat
          </Nav.Link>}
        </Nav>
        <Nav className="navHead">
          {/* <button
            style={{
              backgroundColor: "transparent",
              borderColor: "transparent",
              paddingRight: "1em",
            }}
          >
            <div style={{ textAlign: "left" }}>
              <i
                className="fa-solid fa-bell"
                style={{ color: "black", position: "relative" }}
              ></i>
              
            </div>
          </button>

          <button
            style={{
              backgroundColor: "transparent",
              borderColor: "transparent",
              pointerEvents: "none",
            }}
          >
            <div style={{ pointerEvents: "auto", textAlign: "left" }}></div>
          </button> */}
         {appContext.isLoggedIn()?         
          <NavDropdown
            title={
              <span>
                <img
                    src={require("./images/images.jpg")}
                    style={{ width: "25px", height: "25px" }}
                    alt=""
                    width="32"
                    height="32"
                    className="rounded-circle me-2"
                  />

                <span className="pro-name-2">Admin</span>
              </span>
            }
            id="navbarScrollingDropdown"
          >
            <NavDropdown.Item className="dropdown-menu-end" onClick={logout}>
              {" "}
              <i className="fas fa-sign-out-alt pe-2"></i>Disconnect
            </NavDropdown.Item>
          </NavDropdown> :<Nav.Link as={Link} to="/login">
            Login
          </Nav.Link>}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Header;
