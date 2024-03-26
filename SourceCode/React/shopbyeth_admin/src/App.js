import './App.css';
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Header from './app/header';
import 'bootstrap/dist/css/bootstrap.min.css';
import OrderList from './app/orderList';
import ProductList from './app/productList';
import AddProduct from './app/addProduct';
import Login from './app/login';
import Category from './app/category';
import { ToastContainer } from "react-toastify";
import { AdminProtected } from './app/protected';

import OrderDetails from './app/orderDetails'

import ProductEdit from './app/productEdit';
import BrandList from './app/brandList';
import Dashboard from './app/dashboard';
import SubCategoryList from './app/subCategoryList';
import 'react-image-crop/dist/ReactCrop.css'
import "react-datepicker/dist/react-datepicker.css";
import UserList from './app/userList';
import UserDetails from './app/userDetails';
import Rewards from './app/rewards';
import ChatList from './app/chatList';
import ChatDetails from './app/chatDetails';
function App() {
  return (
    <div className="App">
      <BrowserRouter>
      <Header/>
        <Routes>
          <Route path="/" element={<Navigate replace to="/dashboard" />} />
          <Route path="/login" element={<Login/>} />
          <Route path="/orders" element={<AdminProtected><OrderList/></AdminProtected>} />
          <Route path="/products" element={<AdminProtected><ProductList/></AdminProtected>} />
          <Route path="/products/:id" element ={<AdminProtected><ProductEdit/></AdminProtected>} />
          <Route path="/addproduct" element ={<AdminProtected><AddProduct/></AdminProtected>} />
          <Route path="/category" element ={<AdminProtected><Category/></AdminProtected>} />
          <Route path="/users" element ={<AdminProtected><UserList/></AdminProtected>} />
          <Route path="/user/:id" element ={<AdminProtected><UserDetails  /></AdminProtected>} />

          <Route path="/orderdetails/:id" element={<AdminProtected><OrderDetails/></AdminProtected>} />


          <Route path="/brands" element ={<AdminProtected><BrandList/></AdminProtected>} />
          <Route path="/dashboard" element ={<AdminProtected><Dashboard/></AdminProtected>} />
          <Route path="/category/subcategory/:id" element ={<AdminProtected><SubCategoryList/></AdminProtected>} />
          <Route path="/rewards/:id" element={<AdminProtected><Rewards/></AdminProtected>}/>
          <Route path="/chatlist" element={<AdminProtected><ChatList/></AdminProtected>}/>
          <Route path="/chat/:id" element={<AdminProtected><ChatDetails/></AdminProtected>}/>


        </Routes>
      </BrowserRouter>
      <ToastContainer
        autoClose={1500}
        hideProgressBar
        closeButton={true}
        position="top-right"
      />
    </div>
  );
}

export default App;
