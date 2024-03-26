import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAppContext from "../AppContext";
// import { Toast } from "bootstrap";
import { toast } from "react-toastify";


const Login = () => {
  const navigate = useNavigate()
  const appContext = useAppContext();
  const [user, setUser] = useState({
    username: "",
    password: "",
  });
  const [enableButton, setEnableButton] = useState(false);
  const onInputChange = (e) => {
    e.preventDefault();
    setUser({ ...user, [e.target.name]: e.target.value });
  };
  useEffect(() => {
    if (user.username && user.password) {
      setEnableButton(true);
    }
  }, [user]);
  const submitHandle = (e) => {
    e.preventDefault()
    console.log(user);
    appContext.login(user).then((res)=>{
      if (res.status) {
        toast.success("Login Successfull")
        navigate("/dashboard")
      }
    })
  };
  return (
    <div className="container">
      <div className="row">
        <div className="col-lg-3 col-0"></div>
        <div className="col-lg-6 col-12">
          <div className="login-container">
            <h2 className="my-5 py-5 ">Login</h2>
            <div className="shadow ">
              <form className="form p-4" id="regForm">
                <div className="form-group mt-4">
                  <label className="mb-2">Username</label>
                  <input
                    name="username"
                    type="text"
                    value={user.username}
                    autoComplete="off"
                    placeholder=""
                    className={`form-control ${false ? "is-invalid" : ""}`}
                    onChange={(e) => onInputChange(e)}
                  />
                  {/* {nameError ? <div className="invalid-feedback ">{nameError}</div> : ''} */}
                </div>

                <div className="form-group mt-4">
                  <label className="pb-2">
                    Password<span></span>
                  </label>
                  <input
                    name="password"
                    className={`form-control ${false ? "is-invalid" : ""}`}
                    type="password"
                    placeholder=""
                    value={user.password}
                    onChange={(e) => onInputChange(e)}
                  />
                  {/* {phoneError ? <div className="invalid-feedback ">{phoneError}</div> : ''} */}
                </div>
                <div className="login-button mt-4 mb-3">
                  <button className={`button ${!enableButton && 'disableButton'}`} disabled={!enableButton} onClick={e=>submitHandle(e)}>Submit</button>
                </div>
                {/* <div className="col-12 mt-5">
                    <div className="form-group button">
                      <button
                        type="button"
                        className={`btn float-right${
                          false ? "disableButton" : ""
                        }`}
                        onClick={submitHandle}
                        disabled={false}
                      >
                        Register
                      </button>
                    </div>
                  </div> */}
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-0"></div>
      </div>
    </div>
  );
};

export default Login;
