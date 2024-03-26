import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAppContext from "../AppContext";

function Registration() {
  const navigate = useNavigate();
  const appContext = useAppContext();
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const accountAddress = localStorage.getItem("accountAddress");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [nameValid, setNameValid] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [enableButton, setEnableButton] = useState(true);
  const [user, setUser] = useState({
    name: "",
    phoneNo: "",
    email: "",
    publicAddress: "",
  });
  const [error, setError] = useState({
    name: "",
    phoneNo: "",
    email: "",
    publicAddress: "",
  });

  useEffect(() => {
    registerValidate();
  }, [user]);

  const { name, phoneNo, email } = user;
  const onInputChange = (e) => {
    e.preventDefault();
    setUser({ ...user, [e.target.name]: e.target.value });
    if (e.target.name === "name") {
      let nameRegex = new RegExp("^[a-zA-Z . \b]+$");
      if (e.target.value === "") {
        setError({
          ...error,
          name: "Name is required",
        });
      } else if (e.target.value.length < 3) {
        setError({
          ...error,
          name: "Name must contain at least 3 characters",
        });
      } else if (e.target.value.length > 100) {
        setError({
          ...error,
          name: "Name must not exceed 100 characters",
        });
      } else if (!nameRegex.test(e.target.value)) {
        setError({
          ...error,
          name: "Name must not contain numbers and special characters",
        });
      } else {
        setError({
          ...error,
          name: "",
        });
      }
      // setEnableButton(true)
    }

    if (e.target.name === "email") {
      let email = e.target.value;
      let emailCheck = new RegExp( /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/).test(
        email
      );
      if (email === "") {
        setError({
          ...error,
          email: "Email is required",
        });
      } else if (!emailCheck || email.length > 320) {
        setError({
          ...error,
          email: "Enter valid email",
        });
      } else {
        setError({
          ...error,
          email: "",
        });
      }
    }
    if (e.target.name === "phoneNo") {
      let phoneNo = e.target.value;
      let phoneCheck = new RegExp(/^\d{10}$/).test(phoneNo);
      if (phoneNo !== "" && !phoneCheck) {
        setError({
          ...error,
          phoneNo: "Enter valid phone no",
        });
      } else {
        setError({
          ...error,
          phoneNo: "",
        });
      }
    }
  };
  const registerValidate = () => {
    let flag = false;
    let nameRegex = new RegExp("^[a-zA-Z . \b]+$");
    let emailCheck = new RegExp( /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/).test(
      email
    );
    let phoneCheck = new RegExp(/^\d{10}$/).test(user.phoneNo);
    if (
      user.name === "" ||
      user.name.length < 3 ||
      user.name.length > 100 ||
      !nameRegex.test(user.name) ||
      user.email === "" ||
        !emailCheck || user.email.length > 320 ||
      (!phoneCheck && user.phoneNo !== "")
    ) {
      flag = true;
    }
    setEnableButton(flag);
  };

  const register = async (e) => {
    e.preventDefault()
    user.publicAddress = accountAddress;
    const path = base_url + "users";
    await appContext
      .getAxios()
      .post(path, user)
      .then(
        (response) => {
          if (response !== undefined && response.status === 200) {
            localStorage.setItem("name", user.name);
            appContext.setName(user.name)
            localStorage.setItem("status", 1);
            appContext.setStatus(1)
            toast.success("Registered Successfully !");
            if (localStorage.getItem("pathName")) {
              let path = localStorage.getItem("pathName")
              localStorage.removeItem("pathName")
              navigate(path)
            }  
            else{
              navigate("/");
            
            }
              
         
          } else {
            // toast.error("Error !");
          }
        },
        (error) => {
          console.log("Error", error.response);
        }
      );
  };
  const cancel = (e) =>{
    e.preventDefault()
    localStorage.clear();
    window.location = "/";
  }
  return (
    <div className="body-container">
      <section id="contact-us" className="contact-us section">
        <div className="container">
          <div className="contact-head">
            <div className="row form-main">
              <div className="title">
                <h3>Create Your Account</h3>
              </div>
              <div className="col-lg-8 col-12">
                <img
                  src="https://www.fossil.com/on/demandware.static/-/Library-Sites-FossilSharedLibrary/default/dw374e6f83/2022/SU22/set_0725_us_watches_dgp/Slices/0725_DGP_Watches_Hero2_Bracelets_Mobile.jpg"
                  height="250"
                ></img>
              </div>
              <div className="col-lg-4 col-12">
                <form className="form" id="regForm">
                  <div className="row">
                    <div className="form-group mt-4">
                      <label>
                        Name<span>*</span>
                      </label>
                      <input
                        name="name"
                        value={name}
                        type="text"
                        placeholder=""
                        className={`form-control ${
                          error.name ? "is-invalid" : ""
                        }`}
                        onChange={(e) => onInputChange(e)}
                      />
                      {error.name ? (
                        <div className="invalid-feedback ">{error.name}</div>
                      ) : (
                        ""
                      )}
                    </div>

                    <div className="form-group mt-4">
                      <label>
                        Email<span>*</span>
                      </label>
                      <input
                        name="email"
                        className={`form-control ${
                          error.email ? "is-invalid" : ""
                        }`}
                        value={email}
                        type="email"
                        placeholder=""
                        onChange={(e) => onInputChange(e)}
                      />
                      {error.email ? (
                        <div className="invalid-feedback ">{error.email}</div>
                      ) : (
                        ""
                      )}
                    </div>
                    <div className="form-group mt-4">
                      <label>
                        Phone<span></span>
                      </label>
                      <input
                        name="phoneNo"
                        className={`form-control ${
                          error.phoneNo ? "is-invalid" : ""
                        }`}
                        value={phoneNo}
                        type="text"
                        placeholder=""
                        onChange={(e) => onInputChange(e)}
                      />
                      {error.phoneNo ? (
                        <div className="invalid-feedback ">{error.phoneNo}</div>
                      ) : (
                        ""
                      )}
                    </div>
                    <div className="col-12 mt-5">
                      <div className="form-group register-buttons button">
                        <button
                          type="button"
                          className={`mb-2 btn  float-right${
                            enableButton ? "disableButton" : ""
                          }`}
                          onClick={e=>register(e)}
                          disabled={enableButton}
                        >
                          Register
                        </button>
                        <button
                          type="button"
                          className={`mb-2 btn float-right${
                           false ? "disableButton" : ""
                          }`}
                          onClick={e=>cancel(e)}
                        
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
export default Registration;
