import axios from "axios";
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const NO_OP = () => {};

const AppContext = React.createContext();
const useAppContext = () => React.useContext(AppContext);
const LOGIN_API = "auth/admin/login";
// const SEND_SIGNATURE = "auth/verify"

const basicContentType = { "Content-Type": "application/json" };
const formContentType = {
  "Content-Type": "multipart/form-data ",
};
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
const genderList = [
  { id: 0, name: "Unisex" },
  { id: 1, name: "Male" },
  { id: 2, name: "Female" },
  {id:3,name:"Boy"},
  {id:4,name:"Girl"},
  {id:5,name:"Kid-unisex"}
];
const dialColorList = [
  { id: 0, name: "Blue" },
  { id: 1, name: "Black" },
  { id: 2, name: "Beige" },
  { id: 3, name: "Green" },
  { id: 4, name: "Orange" },
  { id: 5, name: "Grey" },
  { id: 6, name: "Gold" },
  { id: 7, name: "Maroon" },
  { id: 8, name: "Pink" },
  { id: 9, name: "Red" },
  { id: 10, name: "Silver" },
];

const strapColorList = [
  { id: 0, name: "Blue" },
  { id: 1, name: "Black" },
  { id: 2, name: "Beige" },
  { id: 3, name: "Green" },
  { id: 4, name: "Orange" },
  { id: 5, name: "Grey" },
  { id: 6, name: "Gold" },
  { id: 7, name: "Maroon" },
  { id: 8, name: "Pink" },
  { id: 9, name: "Red" },
  { id: 10, name: "Silver" },
];
const dialShapeList = [
  { id: 0, name: "Oval" },
  { id: 1, name: "Rectangle" },
  { id: 2, name: "Round" },
  { id: 3, name: "Tonneau" },
  { id: 4, name: "Square" },
  { id: 5, name: "Asymmetrical" },
];
const strapMaterialList = [
  { id: 0, name: "Metal" },
  { id: 1, name: "Plastic" },
  { id: 2, name: "Stainless steel" },
  { id: 3, name: "Leather" },
  { id: 4, name: "Silicone" },
  { id: 5, name: "Fabric" },
];

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

AXIOS.interceptors.response.use(
  (response) => {
    return response;
  },
  function (error) {
    toast.error(error.response.data.message.error);
    return Promise.reject(error);
  }
);
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  function (error) {
    toast.error(error.response.data.message.error);
    return Promise.reject(error);
  }
);

const AppContextProvider = ({ init, children }) => {
  const [auth, setAuth] = React.useState(init);
  useEffect(() => {
    if (auth !== null) {
      const time = 50000;
      const timeout = setTimeout(() => {}, time);

      return () => {
        clearTimeout(timeout);
      };
    }

    return NO_OP;
  }, [auth]);

  const login = (body) => {
    return AXIOS.post(LOGIN_API, body).then(
      (response) => {
        console.log(response);
        setAuthorization(response.data.token);
        localStorage.setItem("connected", true);
        localStorage.setItem("refreshToken", response.data.refreshToken);

        setAuth(response.data.accessToken);
        return { status: true, info: response };
      },
      (error) => {
        return { status: false, info: error };
      }
    );
  };
  const logout = () => {
    setAuth(null);
  }; 
  const isLoggedIn = () => auth !== null;
  const getUserType = () => localStorage.getItem("usertype");

  const getAccessToken = () => auth;

  const getAxios = () => AXIOS;
  const getAxios2 = () => AXIOS2;
  const gender = () => genderList;
  const strapColor = () => strapColorList;
  const strapMaterial = () => strapMaterialList;
  const dialShape = () => dialShapeList;
  const dialColor = () => dialColorList;

  const context = {
    login,
    isLoggedIn,
    getAccessToken,
    getAxios,
    getUserType,
    logout,
    getAxios2,
    gender,
    strapMaterial,
    strapColor,
    dialShape,
    dialColor
  };

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
};

function refreshAccessToken() {
  let refreshToken = localStorage.getItem("refreshToken");
  if (refreshToken === null) {
    return Promise.resolve(null);
  }
  let body = {
    refreshToken: refreshToken,
  };
  return AXIOS.put(LOGIN_API, body, {
    headers: {
      authorization: null,
    },
  }).then(
    (response) => {
      console.log(response);
      setAuthorization(response.data.token);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("accessToken", response.data.token);

      return response.data.accessToken;
    },
    (error) => {
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }
  );
}

const setAuthorization = (accessToken) => {
  localStorage.setItem("accessToken", accessToken);
  AXIOS.defaults.headers.common["authorization"] =
    AXIOS.defaults.headers.get["authorization"] =
    AXIOS.defaults.headers.post["authorization"] =
    AXIOS.defaults.headers.put["authorization"] =
    AXIOS.defaults.headers.delete["authorization"] =
    AXIOS.defaults.headers.patch["authorization"] =
      "ADMIN@SHOPBYETH " + accessToken;
  AXIOS2.defaults.headers.common["authorization"] =
    AXIOS2.defaults.headers.get["authorization"] =
    AXIOS2.defaults.headers.post["authorization"] =
    AXIOS2.defaults.headers.put["authorization"] =
    AXIOS2.defaults.headers.delete["authorization"] =
    AXIOS2.defaults.headers.patch["authorization"] =
      "ADMIN@SHOPBYETH " + accessToken;

  setTimeout(() => {
    refreshAccessToken();
  }, 540000);
};

export default useAppContext;
export { refreshAccessToken, AppContextProvider };
