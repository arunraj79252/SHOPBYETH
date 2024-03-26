import React from "react";
import "./App.css";
import Header from "./app/header";
import Home from "./app/home";
import Footer from "./app/footer";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Products from "./app/products";
import Checkout from "./app/checkout";
import Cart from "./app/cart";
import ProductDetails from "./app/productDetails";
import Registration from "./app/registration";
import Wishlist from "./app/wishlist";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import OrderList from "./app/orderList";
import OrderDetails from "./app/oderDetails";
import MyProfile from "./app/myProfile";
import 'react-multi-carousel/lib/styles.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import MyRewards from "./app/myRewards";
import Notification from "./app/notification";
import RatingList from "./app/ratingList";
import {UserProtected} from "./app/protected"
import ProtectedNewUser from "./app/protectedNewUser";


function App() {
  return (
    <>
      <div className="App">
        <BrowserRouter>
          <Header></Header>
          <Routes>
            <Route path="/products" element={<Products />} />
            <Route path="/" element={<Home />} />
            <Route path="/checkout" element={<UserProtected><Checkout /></UserProtected>} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/productDetails/:id" element={<ProductDetails />} />
            <Route path="/register" element={<ProtectedNewUser><Registration /></ProtectedNewUser>} />
            <Route path="/notifications" element={<UserProtected><Notification /></UserProtected>} />
            <Route path="/ratingdetails/:id" element={<RatingList />} />
            <Route path="/wishlist" element={<UserProtected><Wishlist /></UserProtected>} />
            <Route path="/orders" element={<UserProtected><OrderList /></UserProtected>} />
            <Route path="/orderdetails/:id" element={<UserProtected><OrderDetails /></UserProtected>} />
            <Route path="/profile" element={<UserProtected><MyProfile /></UserProtected>} />
            <Route path="/rewards" element={<UserProtected><MyRewards /></UserProtected>} />
            <Route path="/notifications" element={<UserProtected><Notification /></UserProtected>} />




          </Routes>
        </BrowserRouter>
        <Footer></Footer>
      </div>
      <ToastContainer
        autoClose={1500}
        hideProgressBar
        closeButton={true}
        position="top-right"
      />
    </>
  );
}

export default App;
