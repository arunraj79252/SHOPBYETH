import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify';
import { sendNotificationToken } from './app/firebase';

const NO_OP = () => { };

const AppContext = React.createContext()
const useAppContext = () => React.useContext(AppContext)
const LOGIN_API = "auth"
const SEND_SIGNATURE = "auth/verify"
const base_url = process.env.REACT_APP_API_ENDPOINT 

const basicContentType = { "Content-Type": "application/json" };
const AXIOS = axios.create({
  baseURL: process.env.REACT_APP_API_ENDPOINT,
  headers: {
    "Content-Type": "application/json",
    get: basicContentType,
    post: basicContentType,
    put: basicContentType,
    delete: basicContentType,
    patch: basicContentType,
  },
});
const formContentType = {
  "Content-Type": "multipart/form-data ",
};
const AXIOS2 = axios.create({
  baseURL: process.env.REACT_APP_API_ENDPOINT,
  headers: {
    "Content-Type": "multipart/form-data ",
    get: formContentType,
    post: formContentType,
    put: formContentType,
    delete: formContentType,
    patch: formContentType,
  },
});

const logout = async () => {
  try {
      
      await sendNotificationToken("",AXIOS)
      localStorage.clear();
      
      // appContext.setUsername("")
      
          window.location = "/";
    

  } catch (error) {
      console.error(error);
  }
};

AXIOS.interceptors.response.use(
  (response) => {
    console.log(response.status);
    return response;
  },
  function (error) {
    if(error.response.status ===403 && !error.request.responseURL.includes("auth/verify")){
   
      // toast.error(error.response.data.message.error)
      toast.error(error.response.data.message.error, {
        toastId: 'success1',
    })
      localStorage.clear()
      setTimeout(() => {
        window.location = "/"  
      }, 1000);
      
      return Promise.reject(error);
      
    }
    toast.error(error.response.data.message.error)
    return Promise.reject(error);
  }
);
axios.interceptors.response.use(

  (response) => {
    return response;
  },
  function (error) {
    toast.error(error.response.data.message.error)
    return Promise.reject(error);
  }
);

const AppContextProvider = ({ init, children }) => {
  const [count, setCount] = React.useState(0);
  const [loadPrevent, setLoadPrevent] = useState(false)
  const [localcartcount, setLocalcartCount] = React.useState(0);
  const [auth, setAuth] = React.useState(init)
  const [searchKeyword, setSearchKeyword] = React.useState("");
  const [buyNowObj, setBuyNowObj] = React.useState([]);
  const [username, setUsername] = useState(localStorage.getItem("name"))
  const [wishCount, setWishCount] = useState(0)
  const [notificationCount, setNotificationCount] = useState(0)
  const [userStatus,setUserStatus] = useState(+localStorage.getItem("status"))
  const initialState = {
    keyword:"",
    page:1,
    size:24,
    sort:0,
    priceRange:{
      name:"",
      value:""
    },
    rating:{
      name:"",
      value:""
    },
    category:[],
    brand:[],
    subCategory:[],
    type:[],
    gender:[],
    outOfStock:0
    }
  const [productFilter, setProductFilter] = useState(initialState)
  useEffect(() => {
    if (auth !== null) {
      const time = 50000;
      const timeout = setTimeout(() => {
      }, time);

      return () => {
        clearTimeout(timeout);
      };
    }

    return NO_OP;
  }, [auth]);
  const getProducts = () => productFilter

  const setProducts =(key,value) =>{
    console.log(key,value);
    
     if (key === "category") {
      let body ={
        name:"",
        value:""
      }
      setProductFilter((prevState)=>({
        ...prevState,
        [key]:value,
        subCategory:[],
        type:[],
        page:1
      }))
    }
    else if (key === "subCategory") {

      setProductFilter((prevState)=>({
        ...prevState,
        [key]:value,
        type:[],
        page:1
      }))
    }
    else if (key === "page") {
      setProductFilter((prevState)=>({
        ...prevState,
        [key]:value,
        
      }))
    }
    else{
      setProductFilter((prevState)=>({
        ...prevState,
        [key]:value,
        page:1
      }))
    }
      
    
  }
  const resetSetProducts = (key,value) =>{
    console.log(key);
    console.log(value);
    setProductFilter({
      ...initialState,
      [key]:value
    })
  }
  useEffect(()=>{
    console.log(productFilter);
  },[productFilter])

  const setcount=(count)=>{
    setCount(count)
  }
  const setName= (name)=>{
    setUsername(name)
  }
  const setStatus=(value) =>{
    setUserStatus(+value)
  }
  const getStatus = () => userStatus
  const setCartCount = (count) => {
    localStorage.setItem("cartCount", count)
    setLocalcartCount(count);
  }
  const sendSignature = (address, signature) => {
    const body = {
      publicAddress: address,
      signature: signature
    };

    return AXIOS.post(SEND_SIGNATURE, body).then(
      (response) => {
        setAuthorization(response.data.accessToken)
        localStorage.setItem("connected", true);
        localStorage.setItem("usertype", response.data.usertype);
        setUsername(response.data.name)
        localStorage.setItem("refreshToken", response.data.refreshToken)
        localStorage.setItem("name", response.data.name)
        localStorage.setItem("accountAddress", address);
        localStorage.setItem("status", response.data.status);
        setUserStatus(response.data.status)
        if(response.data.name===""){
          localStorage.setItem("name", address)
        }
        setAuth(response.data.accessToken)
        return { status: true, info: response };
      },
      (error) => {
        return { status: false, info: error }
      }
    )
  }
  const setbuyNow = (obj) => {
    setBuyNowObj(obj)
  }
  const getNotification = async () =>{
    await AXIOS.get(base_url+"users/me/notification/count/0",{}).then((res)=>{
        setNotificationCount(res.data.count)
    })

}

  const isLoggedIn = () => auth !== null
  const getName= () =>  username
  const getUserType = () => localStorage.getItem("usertype")

  const getAccessToken = () => auth
  const getAxios2 = () => AXIOS2
  const getAxios = () => AXIOS
  const getCount = () => count
  const getlocalCartCount = () => localStorage.getItem("cartCount")
  const getSearchKeyword = () => searchKeyword
  const wishListCount = () => wishCount
  const setWishListCount = (count)=>{
    localStorage.setItem("wishCount",count)
    setWishCount(count)
  }
  const getNotificationCount = () => notificationCount
  const setPrevent =(flag)=>{
    setLoadPrevent(flag)
  }
  const prevent =() => loadPrevent 
  const context = {
    sendSignature,
    prevent,
    setPrevent,
    isLoggedIn,
    getAccessToken,
    getAxios,
    getAxios2,
    getUserType,
    setcount,
    getCount,
    setCartCount,
    getlocalCartCount,
    setSearchKeyword,
    getSearchKeyword,
    setbuyNow,
    setName,
    getStatus,
    setStatus,
    getNotification,
    getNotificationCount,
    getName,
    getProducts,
    setProducts,
    buyNowObj,
    localcartcount,
    setWishListCount,
    wishListCount,
    resetSetProducts
  }

  return (
    <AppContext.Provider value={context}>{children}</AppContext.Provider>
  )
}

function refreshAccessToken() {

  let refreshToken = localStorage.getItem('refreshToken');
  if (refreshToken === null) {
    return Promise.resolve(null);
  }
  let body = {
    'refreshToken': refreshToken
  }
  return AXIOS.put(LOGIN_API, body, {
    headers: {
      authorization: null,
    },
  }).then(
    (response) => {
      setAuthorization(response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem("accessToken", JSON.stringify(response.data.accessToken));

      return response.data.accessToken;
    },
    (error) => {
      var wishlistCount = localStorage.getItem('wishlistCount');
      var cartCount = localStorage.getItem('cartCount');
      localStorage.clear();
      // localStorage.setItem('wishlistCount', wishlistCount);
      // localStorage.setItem('cartCount', cartCount);
      window.location.href = '/';
      return Promise.reject(error);

    }
  );
}

const setAuthorization = (accessToken) => {
  localStorage.setItem("accessToken", accessToken);
  AXIOS.defaults.headers.common["authorization"] = AXIOS.defaults.headers.get[
    "authorization"
  ] = AXIOS.defaults.headers.post["authorization"] = AXIOS.defaults.headers.put[
  "authorization"
  ] = AXIOS.defaults.headers.delete[
  "authorization"
  ] = AXIOS.defaults.headers.patch["authorization"] =
  "SHOPBYETH " + accessToken;
  AXIOS2.defaults.headers.common["authorization"] = AXIOS2.defaults.headers.get[
    "authorization"
  ] = AXIOS2.defaults.headers.post["authorization"] = AXIOS2.defaults.headers.put[
  "authorization"
  ] = AXIOS2.defaults.headers.delete[
  "authorization"
  ] = AXIOS2.defaults.headers.patch["authorization"] =
  "SHOPBYETH " + accessToken;

  setTimeout(() => {
    refreshAccessToken(localStorage.getItem('refreshToken'))
  }, 540000);
}


export default useAppContext;
export { refreshAccessToken, AppContextProvider }