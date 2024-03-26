import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAppContext from "../AppContext";
import {
  makePayment,
  getCoinBalance,
  getEthereumBalance,
} from "./blockchain-util";
import { BsCoin } from "react-icons/bs";
import Modal from "react-bootstrap/Modal";
import axios from "axios";

import { FaEthereum } from "react-icons/fa";
import DeleteConfirmModal from "./deleteConfirmModal";
import PaymentConfirmModal from "./paymentConfirmModal";
import ReactImageGallery from "react-image-gallery";

function Checkout() {
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const aws_url = process.env.REACT_APP_AWS_ENDPOINT;
  const appContext = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  //const actionFrom = location.state.id;
  const connected = localStorage.getItem("connected");
  const loginStatus = +localStorage.getItem("status");
  const [cartTotal, setCartTotal] = useState(0);
  const [ethPrice, setethPrice] = useState(0);
  const [modalBody, setModalBody] = useState({
    title: "",
    body: "",
    id: ""
  })
  const addressList = [
    { id: "IN", value: "India" },
    { id: "AF", value: "Afghanistan" },
    { id: "AX", value: "Åland Islands" },
    { id: "AL", value: "Albania" },
    { id: "DZ", value: "Algeria" },
    { id: "AS", value: "American Samoa" },

  ]
  const qtyList =Array.from({length: 10}, (_, i) => i + 1)
  const actionFrom = localStorage.getItem('checkoutPath');
  const [paymentModal, setPaymentModal] = useState(false)
  const [payableAmount, setPayableAmount] = useState(0.0);
  const [payableDiscountAmount, setPayableDiscountAmount] = useState(0);
  const [shippingCharge, setShippingCharge] = useState(0.0);
  const [addressBook, setAddressBook] = useState([]);
  const [selectedIndex, setselectedIndex] = useState(0);
  const [selectAddress, setselectAddress] = useState();
  const [editAdrsIndex, seteditAdrsIndex] = useState(null);
  const [addNew, setaddNew] = useState(false);
  const [products, setProducts] = useState([]);
  const [show, setShow] = useState(false);
  const [confirmShow, setConfirmShow] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [nameError, setNameError] = useState("");
  const [addrsError, setAddrsError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [localityError, setLocalityError] = useState("");
  const [cityError, setCityError] = useState("");
  const [stateError, setStateError] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [nameValid, setNameValid] = useState(false);
  const [adrsValid, setAdrsValid] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [localityValid, setLocalityValid] = useState(false);
  const [cityValid, setCityValid] = useState(false);
  const [stateValid, setStateValid] = useState(false);
  const [pinValid, setPinValid] = useState(false);
  const [enableButton, setEnableButton] = useState(true);
  const [coinBalance, setCoinBalance] = useState(0);
  const [coinsUsed, setCoinsUsed] = useState(false);
  const [totalCoinsUsed, settotalCoinsUsed] = useState(0);
  const [initial, setInitial] = useState(false)
  const [quantity,setQuantity] = useState(1)

  const [addressObj, setAddressObj] = useState({
    name: "",
    mobile: "",
    pincode: "",
    state: "",
    address: "",
    locality: "",
    city: "",
    label: 1,
    country: "IN",
  });

  const getCountry = (id) => {
    return addressList.find(res => res.id === id)?.value
  }

  useEffect(() => {
    if (initial) {
      setEnableButton(true)
      setInitial(false)
    }
    else {
      let flag = addressValidate(addressObj);
      console.log(flag);
      setEnableButton(flag);
    }


  }, [addressObj]);

  const [error, setError] = useState({
    name: "",
    mobile: "",
    pincode: "",
    state: "",
    address: "",
    locality: "",
    city: "",
    label: "",
    country: "",
  });

  const {
    name,
    mobile,
    pincode,
    state,
    address,
    locality,
    city,
    Label,
    country,
  } = addressObj;
  const [buyNowObj, setBuyNowObj] = useState(
    JSON.parse(localStorage.getItem("buyNowProduct"))
  );
  useEffect(() => {
    if (connected && loginStatus === 1) {
      setBuyNowObj(JSON.parse(localStorage.getItem("buyNowProduct")));
      getCartList();
      getAdrsList();
      getCoinBalance();
      
    }
    console.log(qtyList);
  }, []);
  
  
  const getCount = async () => {
    try {
      let path = base_url + "users/counts";
      await appContext
        .getAxios()
        .get(path)
        .then((response) => {
          let resp = response.data;
          appContext.setCartCount(resp.cartCount);
          localStorage.setItem("cartCount", resp.cartCount);
        });
    } catch (error) { }
  };

  const getCoinBalance = async () => {
    await appContext
      .getAxios()
      .get(base_url + "users/me")
      .then((res) => {
        console.log(res.data);
        setCoinBalance(res.data.coinBalance);
      });
  };

  const getCartList = async () => {
    try {
      const actionFrom = localStorage.getItem('checkoutPath');
      if (actionFrom === "1") {
        setProducts([JSON.parse(localStorage.getItem("buyNowProduct"))]);
        console.log("total", buyNowObj.price);
        setPayableAmount(buyNowObj.price);
        setPayableDiscountAmount(buyNowObj.price);
        setCartTotal(buyNowObj.price);
        setShippingCharge(0);
        getEthPrice(buyNowObj.price);
      } else {
        // let total = location.state.amount;
        let path = base_url + "users/me/viewCartItems";
        await appContext
          .getAxios()
          .get(path)
          .then((response) => {
            let resp = response.data;
            if (resp) {
              setProducts(resp);
              console.log(resp.products);
              let total = 0
              resp.forEach(element => {
                total += (element.price * element.quantity)
              });
              setCartTotal(total.toFixed(4));

              setShippingCharge(0);
              let amount = total + shippingCharge;
              setPayableAmount(amount);
              getEthPrice(amount);
              setPayableDiscountAmount(amount.toFixed(4));
              // getCartTotal(resp.products);
            }
          });
      }
    } catch (error) { }
  };

  const getEthPrice = async (price) => {
    console.log(price);
    try {
      let path = "https://api.coinconvert.net/convert/usd/eth?amount=" + price;
      await axios.get(path).then((response) => {
        let resp = response.data;
        if (resp) {
          let data = resp.ETH
          console.log("data", data);
          localStorage.setItem("ETHPrice", data);
          setethPrice(data);
        }
      });
    } catch (error) {
      setethPrice(0)
    }
  };
  const priceStockCheck = async () => {
    console.log("products",products);
    let body = {
      products: []
    }
    // products.forEach((res) => {
    //   let obj = {
    //     _id: "" + res._id,
    //     productQuantity: res.quantity,
    //     amount: res.price,

    //   }
    //   body.products.push(obj)
    // })
    const actionFrom = localStorage.getItem('checkoutPath');
      if (actionFrom === "1") {
        let body = {
          products: []
        }

        console.log("pppppp",quantity);
        
        products.forEach((res) => {
          let obj = {
            _id: "" + res._id,
            productQuantity: quantity,
            amount: res.price,
    
          }
          body.products.push(obj)
        })
        console.log("hfdkabc.kdjcb",body.products);
        body.deliveryAddressId = selectAddress._id
        await appContext.getAxios().post(base_url + "users/me/createOrder", body).then((res) => {
          setCheckoutLoading(true)
          checkout(res.data.orderId)
        },
        ).catch((error) => {
          console.log(error);
          const actionFrom = localStorage.getItem('checkoutPath');
          setCheckoutLoading(false)
          if (actionFrom === "1") {
            navigate("/productDetails/" + products[0]._id);
          }
          else {
            navigate("/cart")
          }
    
        })
      }
      else{
        let body = {
          products: []
        }
        products.forEach((res) => {
          let obj = {
            _id: "" + res._id,
            productQuantity: res.quantity,
            amount: res.price,
    
          }
          body.products.push(obj)
        })
        console.log("else",body.products);
        body.deliveryAddressId = selectAddress._id
        await appContext.getAxios().post(base_url + "users/me/createOrder", body).then((res) => {
          setCheckoutLoading(true)
          checkout(res.data.orderId)
        },
        ).catch((error) => {
          console.log(error);
          const actionFrom = localStorage.getItem('checkoutPath');
          setCheckoutLoading(false)
          if (actionFrom === "1") {
            navigate("/productDetails/" + products[0]._id);
          }
          else {
            navigate("/cart")
          }
    
        })
      }
      
    console.log("bdyprdc",body.products);
   

  }
  useEffect(() => {
    if (appContext.prevent()) {
      setPaymentModal(true)
    }
    else {
      setPaymentModal(false)
    }
  }, [appContext.prevent()])


  const checkout = async (orderId) => {
    try {
      let discount = coinsUsed ? totalCoinsUsed : 0;
      console.log(discount);
      const actionFrom = localStorage.getItem('checkoutPath');
      let balance = await getEthereumBalance();
      let cBal = balance / Math.pow(10, 18);

      console.log("balance", selectAddress);
      if (+ethPrice <= cBal) {
        console.log(parseFloat(ethPrice.toFixed(10)));
        appContext.setPrevent(true)
        var txnHash = await makePayment(ethPrice.toFixed(10), discount, orderId);
        appContext.setPrevent(false)
        console.log(txnHash);
        if (txnHash !== -1) {
          let body = {
            orderId: orderId,
            paymentTxHash: txnHash,
          };
          console.log(actionFrom, "ss")

          if (actionFrom === "0") {
            body.isFromCart = true
          } else {
            body.isFromCart = false
          }
          let path = base_url + "users/me/completeOrder"
          await appContext
            .getAxios()
            .patch(path, body)
            .then((response) => {

              console.log(response);
              toast.success("Order created!");
              localStorage.removeItem("buyNowProduct");
              setCheckoutLoading(false)
              getCount();
              navigate("/orderdetails/" + orderId, { replace: true });
            });
        }
        else {
          setCheckoutLoading(false)
        }


      } else {
        setCheckoutLoading(false)
        toast.warn("Insufficient Balance");
      }
    } catch (error) {
      console.log("works");
      setCheckoutLoading(false)
      console.error(error);
    }
  };
  const productClick = (e, id) => {
    e.preventDefault();
    localStorage.setItem("productId", id);
    navigate("/productDetails/" + id);
  };

  const numToFixed = (num) => {
    if ((num + "").split(".").length === 1) {

      return num
    }
    else {
      let stringNum = (num + "").split(".")
      return stringNum[0] + "." + stringNum[1].slice(0, 6)
    }

  }
  const getAdrsList = async () => {
    try {
      let path = base_url + "users/me/address";
      await appContext
        .getAxios()
        .get(path)
        .then((response) => {
          let resp = response.data;
          if (resp) {
            setAddressBook(resp[0].address);
            console.log(resp[0]);
            console.log(resp[0].address);
            let index = resp[0].address.findIndex((res) =>
              res.primary === 1)
            console.log(index);
            setselectedIndex(index)
            setselectAddress(resp[0].address[index]);

          }
          if (resp[0].address.length === 0) {
            setaddNew(true);
          }
        });
    } catch (error) { }
  };

  const addnewAdrs = () => {
    setaddNew(true);
    setAddressObj({
      name: "",
      mobile: "",
      pincode: "",
      state: "",
      address: "",
      locality: "",
      city: "",
      label: 1,
      country: "IN",
    });
    seteditAdrsIndex(null);
  };

  const adrsChange = (index, addrs) => {
    try {
      setselectedIndex(index);
      setselectAddress(addrs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    console.log(selectAddress);
  }, [selectAddress]);
  const editAddress = (index, adrs) => {
    try {

      seteditAdrsIndex(index);
      console.log(adrs);
      setAddressObj(adrs);
      setaddNew(false);
      setInitial(true)
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    console.log(enableButton);
  }, [enableButton])
  const deleteAddress = async (id) => {
    try {
      let path = base_url + "users/me/address/" + id;
      await appContext
        .getAxios()
        .delete(path)
        .then((response) => {
          console.log(response);
          toast.success("Address Deleted Successfully!");
          getAdrsList();
        });
      setModalBody(
        {

          title: "",
          body: "",
          id: ""

        }
      )
      setAddressObj({
        name: "",
        mobile: "",
        pincode: "",
        state: "",
        address: "",
        locality: "",
        city: "",
        label: 1,
        country: "IN",
      });
      setConfirmShow(false)
    } catch (err) {
      console.error(err);
    }
  };
  const modalConfirmOpen = (e, address) => {
    e.preventDefault()
    let body = {
      title: "Address delete",
      "body": "Do you want to delete address",
      id: address._id
    }
    setModalBody(body)
    setConfirmShow(true)

  }
  const modalClose = () => {
    setConfirmShow(false)
  }
  const modalConfirm = (id) => {
    deleteAddress(id)
  }
  const updateAddress = async (e, index, adrs) => {
    try {
      e.preventDefault();
      let path = base_url + "users/me/address/" + addressObj._id;
      console.log(addressObj);
      await appContext
        .getAxios()
        .patch(path, addressObj)
        .then((response) => {
          console.log(response);
          toast.success("Address Updated Successfully!");
          getAdrsList();
          seteditAdrsIndex(null);
        });
      setselectedIndex(index);
      setselectAddress(addressObj);
    } catch (err) {
      console.error(err);
    }
  };

  const addAddress = async (e) => {
    try {
      e.preventDefault();
      let path = base_url + "users/me/address";
      await appContext
        .getAxios()
        .put(path, addressObj)
        .then((response) => {
          console.log(response);
          toast.success("Address Added Successfully!");
          getAdrsList();
          setaddNew(false);
        });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClose = () => {
    setShow(false);
  };

  const handleShow = () => {
    setShow(true);
  };
  const validate = (key, value) => {
    let stringRegex = new RegExp(/^[A-Za-z0-9 .,]+$/);
    if (key === "name") {
      let nameRegex = new RegExp("^[a-zA-Z . \b]+$");
      if (value === "") {
        setError({
          ...error,
          [key]: "Name is required",
        });
      } else if (value.length < 3 || value.length > 100) {
        setError({
          ...error,
          [key]: "Enter valid name",
        });
      }

      else if (!nameRegex.test(value)) {
        setError({
          ...error,
          [key]: "Name must not contain numbers special characters",
        });
      }
      else {
        setError({
          ...error,
          [key]: "",
        });
      }
    } else if (key === "mobile") {
      // debugger;
      let phoneRegex = RegExp(/^\d{10}$/);
      if (value === "") {
        setError({
          ...error,
          [key]: "Phone no is required",
        });
      } else if (!phoneRegex.test(value) || value[0] === "0") {
        setError({
          ...error,
          [key]: "Enter valid phone no",
        });
      } else {
        setError({
          ...error,
          [key]: "",
        });
      }
    }

    // else if (
    //   key === "address" ||
    //   key === "locality" ||
    //   key === "city" 
    // ) {
    //   if (value === "") {
    //     setError({
    //       ...error,
    //       [key]: key + " is required",
    //     });
    //   } else if (value.length < 1 || value.length > 50) {
    //     setError({
    //       ...error,
    //       [key]: "Enter valid " + key,
    //     });
    //   }
    //   else if (!stringRegex.test(value)) {
    //     setError({
    //       ...error,
    //       [key]: key+" must not contain special characters",
    //     });
    //   }
    //    else {
    //     setError({
    //       ...error,
    //       [key]: "",
    //     });
    //   }
    // }
    else if (key === "address") {

      if (value === "") {
        setError({
          ...error,
          [key]: key + " is required",
        });
      } else if (value.length < 3 || value.length > 50) {
        setError({
          ...error,
          [key]: "Enter valid " + key,
        });
      }
      else if (!stringRegex.test(value)) {
        setError({
          ...error,
          [key]: key + " must not contain special characters",
        });
      }
      else {
        setError({
          ...error,
          [key]: "",
        });
      }

    }
    else if (key === "locality") {
      let regex = new RegExp(/^[A-Za-z0-9 .,]+$/);
      if (value === "") {
        setError({
          ...error,
          [key]: key + " is required",
        });
      } else if (value.length < 3 || value.length > 50) {
        setError({
          ...error,
          [key]: "Enter valid " + key,
        });
      }
      else if (!regex.test(value)) {
        setError({
          ...error,
          [key]: key + " must not contain special characters",
        });
      }
      else {
        setError({
          ...error,
          [key]: "",
        });
      }

    }
    else if (key === "city") {
      let nameRegex = new RegExp("^[a-zA-Z \b]+$");
      if (value === "") {
        setError({
          ...error,
          [key]: key + " is required",
        });
      } else if (value.length < 3 || value.length > 50) {
        setError({
          ...error,
          [key]: "Enter valid " + key,
        });
      }
      else if (!nameRegex.test(value)) {
        setError({
          ...error,
          [key]: key + " must not contain special characters and numbers",
        });
      }

      else {
        setError({
          ...error,
          [key]: "",
        });
      }
    }
    else if (key === "state") {
      let nameRegex = new RegExp("^[a-zA-Z \b]+$");
      if (value === "") {
        setError({
          ...error,
          [key]: key + " is required",
        });
      } else if (value.length < 3 || value.length > 20) {
        setError({
          ...error,
          [key]: "Enter valid " + key,
        });
      }
      else if (!nameRegex.test(value)) {
        setError({
          ...error,
          [key]: key + " must not contain special characters and numbers",
        });
      }

      else {
        setError({
          ...error,
          [key]: "",
        });
      }
    } else if (key === "pincode") {
      let pinRegex = RegExp(/^(\d{6})$/);
      if (value === "") {
        setError({
          ...error,
          [key]: key + " is required",
        });
      } else if (!pinRegex.test(value) || value[0] === "0") {
        setError({
          ...error,
          [key]: "Enter valid " + key,
        });
      } else {
        setError({
          ...error,
          [key]: "",
        });
      }
    }

  };


  const addressValidate = (addressObj) => {
    let flag = false;
    let pinRegex = RegExp(/^(\d{6})$/);
    let phoneRegex = RegExp(/^\d{10}$/);
    let nameRegex = new RegExp("^[a-zA-Z . \b]+$");
    let addressRegex = new RegExp(/^[A-Za-z0-9 .,]+$/);
    let localityRegex = new RegExp(/^[A-Za-z0-9 ]+$/);
    let stateRegex = new RegExp("^[a-zA-Z \b]+$");

    if (
      addressObj.name === "" ||
      addressObj.name?.length < 3 ||
      addressObj.name?.length > 100 ||
      addressObj.mobile === "" ||
      !phoneRegex.test(addressObj.mobile) ||
      addressObj.address?.length < 3 ||
      addressObj.address?.length > 50 ||
      addressObj.locality?.length < 3 ||
      addressObj.locality?.length > 50 ||
      addressObj.city?.length < 3 ||
      addressObj.city?.length > 50 ||
      addressObj.state?.length < 3 ||
      addressObj.state?.length > 20 ||
      !pinRegex.test(addressObj.pincode) ||
      addressObj.pincode[0] === "0" ||
      addressObj.mobile[0] === "0" ||
      !nameRegex.test(addressObj.name) ||
      !addressRegex.test(addressObj.address) ||
      !addressRegex.test(addressObj.locality) ||
      !stateRegex.test(addressObj.state) ||
      !stateRegex.test(addressObj.city)
    ) {
      flag = true;
    }
    return flag;
  };
  const onCheckChange = (e) => {
    if (e.target.checked) {
      setAddressObj({ ...addressObj, [e.target.name]: 1 });
    }
    else {
      setAddressObj({ ...addressObj, [e.target.name]: 0 });
    }

  }
  const onInputChange = (e) => {
    console.log("sss");
    console.log(e.target.name);
    let key = e.target.name;
    e.preventDefault();
    if (key === "label") {
      setAddressObj({ ...addressObj, [e.target.name]: +e.target.value });
      validate(e.target.name, e.target.value);
      return;
    }

    setAddressObj({ ...addressObj, [e.target.name]: e.target.value });
    validate(e.target.name, e.target.value);
  };
  const coinCheckHandle = (e) => {
    setCoinsUsed(e.target.checked);
    if (e.target.checked) {
      if (cartTotal >= coinBalance) {
        settotalCoinsUsed(coinBalance);
        setPayableDiscountAmount(((payableAmount * 10000) - (coinBalance*10000))/10000);
        getEthPrice(payableAmount - coinBalance);
      } else {
        settotalCoinsUsed(cartTotal);
        setPayableDiscountAmount(((payableAmount*10000) - (cartTotal*10000))/10000);
        getEthPrice(payableAmount - cartTotal)
      }
      
    }
    else {
      setPayableDiscountAmount(payableAmount);
      if (payableAmount) {
        getEthPrice(payableAmount);
      }
    }
  };
  // useEffect(() => {
  //   if (coinsUsed) {
  //     //   console.log(payableAmount - totalCoinsUsed);
  //     //   setPayableAmount(payableAmount - totalCoinsUsed);
  //     //   getEthPrice(payableAmount - totalCoinsUsed);
  //     setPayableDiscountAmount(payableAmount - totalCoinsUsed);
  //     getEthPrice(payableAmount - totalCoinsUsed);
  //   } else {
  //     console.log(payableAmount);
  //     setPayableDiscountAmount(payableAmount);
  //     if (payableAmount) {
  //       getEthPrice(payableAmount);
  //     }
  //   }
  // }, [coinsUsed]);
  const setCoins =()=>{
    console.log("hiiii");
    setPayableDiscountAmount(payableAmount - cartTotal);
    getEthPrice(payableAmount - cartTotal)
  }
 
const changeQnt=(val,price)=>{
  let prod =products
  prod[0].quantity =val
  setProducts(prod)
  console.log(prod);

  if(coinsUsed){
    
    const qty = parseInt(val)
    const total=price * qty;
    console.log("toatl",total);
    setQuantity(qty)
    setCartTotal(total);
    setPayableAmount(total)
    
   
    if (total >= coinBalance) {
      settotalCoinsUsed(coinBalance);
      setPayableDiscountAmount(total - coinBalance);
      getEthPrice(total - coinBalance);
      console.log(payableAmount);
      console.log("ppp",payableAmount - coinBalance);
    } else {
      settotalCoinsUsed(total);
      setPayableDiscountAmount(payableAmount - cartTotal);
      getEthPrice(payableAmount - cartTotal)
      console.log("ppp",payableAmount - cartTotal);
      //setethPrice(0)
    }
  }
  else{
     const qty = parseInt(val)
    const total=price * qty;
    console.log("toat",total);
    setQuantity(qty)
    setCartTotal(total);
    setPayableAmount(total)
    setPayableDiscountAmount(total);
    getEthPrice(total)
  }
  
}

  return (
    <div className="body-container">
      <div className="breadcrumbs">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="bread-inner">
                <ul className="bread-list">
                  <li>
                    <Link to="/">
                      Home<i className="fa-solid fa-arrow-right"></i>
                    </Link>
                  </li>
                  <li className="active">
                    <Link>Checkout</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="shop checkout section">
        <div className="container">
          <div className="row">
            <h2 className="">Make Your Checkout Here</h2>
            <div className="col-lg-8 col-12">
              <div className="checkout-form">
                <div className="card shadow">
                  {addressBook.length > 0
                    ? addressBook.map((addrs, index) => {
                      return (
                        <div className="p-4 m-2 adrsborder" key={index}>
                          <div className="row">
                            <div className="col-lg-1 col-sm-1 col-sx-1 col-md-1">
                              <input
                                type="radio"
                                id="adrs"
                                className="form-check-input"
                                name="adrs"
                                value={addrs}
                                onChange={() => adrsChange(index, addrs)}
                                checked={selectedIndex === index && true}
                              ></input>
                            </div>
                            <div className="col-lg-11 col-sm-11 col-sx-11 col-md-11">
                              {editAdrsIndex !== index && (
                                <div>
                                  {" "}
                                  <div className="mb-3 d-flex">
                                    <h5 className="address-name">{addrs.name}</h5>{" "}
                                    <span className="adrslabel">
                                      {addrs.label === 0 && "HOME"}
                                      {addrs.label === 1 && "WORK"}
                                      {addrs.label === 2 && "OTHER"}
                                    </span>{" "}
                                    <span
                                      className="ms-4"
                                      onClick={() =>
                                        editAddress(index, addrs)
                                      }
                                    >
                                      <i
                                        className="fa-solid fa-pen"
                                        title="Edit address"
                                      ></i>
                                    </span>
                                    <span
                                      className="ms-4"
                                      onClick={(e) => modalConfirmOpen(e, addrs)}
                                    >
                                      <i
                                        className="fa-solid fa-trash"
                                        title="Delete address"
                                      ></i>
                                    </span>
                                  </div>
                                  <div className="mb-1">
                                    {addrs.address}, {addrs.locality}
                                  </div>
                                  <div className="mb-1">
                                    {addrs.city}, {addrs.state},{" "}

                                  </div>
                                  <div className="mb-1">

                                    {addrs.pincode} ,{" "}
                                    {getCountry(addrs.country) ? getCountry(addrs.country) : addrs.country}
                                  </div>
                                  <div className="mb-3">
                                    Phone : {addrs.mobile}
                                  </div>
                                  {/* {selectedIndex === index && <div> <button className="btn" onClick={() => setselectAddress(addrs)}>DELIVER HERE</button></div>} */}
                                </div>
                              )}
                              {editAdrsIndex === index && (
                                <form className="form">
                                  <div className="row">
                                    <div className="col-lg-6 col-md-6 col-12">
                                      <div className="form-group">
                                        <label>
                                          Full Name<span>*</span>
                                        </label>
                                        <input
                                          type="text"
                                          name="name"
                                          value={name}
                                          placeholder=""
                                          className={`form-control ${error.name ? "is-invalid" : ""
                                            }`}
                                          onChange={(e) => onInputChange(e)}
                                        />
                                        {error.name ? (
                                          <div className="invalid-feedback ">
                                            {error.name}
                                          </div>
                                        ) : (
                                          ""
                                        )}
                                      </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6 col-12">
                                      <div className="form-group">
                                        <label>
                                          Phone Number<span>*</span>
                                        </label>
                                        <input
                                          type="text"
                                          name="mobile"
                                          value={mobile}
                                          className={`form-control ${error.mobile ? "is-invalid" : ""
                                            }`}
                                          placeholder=""
                                          required="required"
                                          onChange={(e) => onInputChange(e)}
                                        />
                                        {error.mobile ? (
                                          <div className="invalid-feedback ">
                                            {error.mobile}
                                          </div>
                                        ) : (
                                          ""
                                        )}
                                      </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6 col-12">
                                      <div className="form-group">
                                        <label>
                                          Address<span>*</span>
                                        </label>
                                        <input
                                          type="text"
                                          name="address"
                                          value={address}
                                          className={`form-control ${error.address ? "is-invalid" : ""
                                            }`}
                                          placeholder=""
                                          required="required"
                                          onChange={(e) => onInputChange(e)}
                                        />
                                        {error.address ? (
                                          <div className="invalid-feedback ">
                                            {error.address}
                                          </div>
                                        ) : (
                                          ""
                                        )}
                                      </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6 col-12">
                                      <div className="form-group">
                                        <label>
                                          Locality<span>*</span>
                                        </label>
                                        <input
                                          type="text"
                                          name="locality"
                                          value={locality}
                                          className={`form-control ${error.locality ? "is-invalid" : ""
                                            }`}
                                          placeholder=""
                                          required="required"
                                          onChange={(e) => onInputChange(e)}
                                        />
                                        {error.locality ? (
                                          <div className="invalid-feedback ">
                                            {error.locality}
                                          </div>
                                        ) : (
                                          ""
                                        )}
                                      </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6 col-12">
                                      <div className="form-group">
                                        <label>
                                          City<span>*</span>
                                        </label>
                                        <input
                                          type="text"
                                          name="city"
                                          value={city}
                                          className={`form-control ${error.city ? "is-invalid" : ""
                                            }`}
                                          placeholder=""
                                          required="required"
                                          onChange={(e) => onInputChange(e)}
                                        />
                                        {error.city ? (
                                          <div className="invalid-feedback ">
                                            {error.city}
                                          </div>
                                        ) : (
                                          ""
                                        )}
                                      </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6 col-12">
                                      <div className="form-group">
                                        <label>
                                          Country<span>*</span>
                                        </label>
                                        <select
                                          name="country"
                                          id="country"
                                          value={addressObj.country}
                                          onChange={(e) => onInputChange(e)}
                                        >
                                          <option value="IN">India</option>
                                          <option value="AF">
                                            Afghanistan
                                          </option>
                                          <option value="AX">
                                            Åland Islands
                                          </option>
                                          <option value="AL">Albania</option>
                                          <option value="DZ">Algeria</option>
                                          <option value="AS">
                                            American Samoa
                                          </option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6 col-12">
                                      <div className="form-group">
                                        <label>
                                          State / Divition<span>*</span>
                                        </label>
                                        {/* <select name="state-province" id="state-province" value={state}>
                                                                                <option value="divition" selected="selected">New Yourk</option>
                                                                                <option>Los Angeles</option>
                                                                                <option>Chicago</option>
                                                                                <option>Houston</option>
                                                                                <option>San Diego</option>
                                                                                <option>Dallas</option>
                                                                                <option>Charlotte</option>
                                                                            </select> */}
                                        <input
                                          type="text"
                                          name="state"
                                          value={state}
                                          placeholder=""
                                          className={`form-control ${error.state ? "is-invalid" : ""
                                            }`}
                                          required="required"
                                          onChange={(e) => onInputChange(e)}
                                        />
                                        {error.state ? (
                                          <div className="invalid-feedback ">
                                            {error.state}
                                          </div>
                                        ) : (
                                          ""
                                        )}
                                      </div>
                                    </div>

                                    <div className="col-lg-6 col-md-6 col-12">
                                      <div className="form-group">
                                        <label>
                                          Postal Code<span>*</span>
                                        </label>
                                        <input
                                          type="text"
                                          name="pincode"
                                          value={pincode}
                                          className={`form-control ${error.pincode ? "is-invalid" : ""
                                            }`}
                                          placeholder=""
                                          required="required"
                                          onChange={(e) => onInputChange(e)}
                                        />
                                        {error.pincode ? (
                                          <div className="invalid-feedback ">
                                            {error.pincode}
                                          </div>
                                        ) : (
                                          ""
                                        )}
                                      </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6 col-12">
                                      <div className="form-group">
                                        <label>
                                          Type<span>*</span>
                                        </label>
                                        <select
                                          name="label"
                                          id="country"
                                          value={addressObj.label}
                                          onChange={(e) => onInputChange(e)}
                                        >
                                          <option value={0}>Home</option>
                                          <option value={1}>Work</option>
                                          <option value={2}>Other</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6 col-12 d-flex align-items-center">
                                      <div class="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          name="primary"
                                          value={addressObj.primary}
                                          id="flexCheckDefault"
                                          checked={addressObj.primary === 1}
                                          onChange={(e) => onCheckChange(e)}
                                        />
                                        <label
                                          className="form-check-label"
                                        >
                                          Make as default address
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ float: "right" }}>
                                    <button
                                      className="btn me-4"
                                      onClick={(e) =>
                                        updateAddress(e, index, addrs)
                                      }
                                      disabled={enableButton}
                                    >
                                      {" "}
                                      SAVE & DELIVER HERE
                                    </button>
                                    <span></span>
                                    <button
                                      className="btn"
                                      onClick={() => seteditAdrsIndex(null)}
                                    >
                                      {" "}
                                      CANCEL
                                    </button>
                                  </div>
                                </form>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                    : ""}

                  {!addNew ? (
                    addressBook.length !== 3 && <Link
                      className="m-4 ps-4 adrslink"
                      onClick={() => addnewAdrs()}
                    >
                      Add a new address
                    </Link>
                  ) : (
                    <form className="form p-4 mx-4">
                      <div className="row">
                        <div className="col-12 mb-4">
                          <h5>Add New Address</h5>
                        </div>
                        <div className="col-lg-6 col-md-6 col-12">
                          <div className="form-group">
                            <label>
                              Full Name<span>*</span>
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={name}
                              placeholder=""
                              className={`form-control ${error.name ? "is-invalid" : ""
                                }`}
                              required="required"
                              onChange={(e) => onInputChange(e)}
                            />
                            {error.name ? (
                              <div className="invalid-feedback ">
                                {error.name}
                              </div>
                            ) : (
                              ""
                            )}
                          </div>
                        </div>
                        <div className="col-lg-6 col-md-6 col-12">
                          <div className="form-group">
                            <label>
                              Phone Number<span>*</span>
                            </label>
                            <input
                              type="text"
                              name="mobile"
                              value={mobile}
                              placeholder=""
                              className={`form-control ${error.mobile ? "is-invalid" : ""
                                }`}
                              required="required"
                              onChange={(e) => onInputChange(e)}
                            />
                            {error.mobile ? (
                              <div className="invalid-feedback ">
                                {error.mobile}
                              </div>
                            ) : (
                              ""
                            )}
                          </div>
                        </div>
                        <div className="col-lg-6 col-md-6 col-12">
                          <div className="form-group">
                            <label>
                              Address Line 1<span>*</span>
                            </label>
                            <input
                              type="text"
                              name="address"
                              value={address}
                              placeholder=""
                              className={`form-control ${error.address ? "is-invalid" : ""
                                }`}
                              required="required"
                              onChange={(e) => onInputChange(e)}
                            />
                            {error.address ? (
                              <div className="invalid-feedback ">
                                {error.address}
                              </div>
                            ) : (
                              ""
                            )}
                          </div>
                        </div>

                        <div className="col-lg-6 col-md-6 col-12">
                          <div className="form-group">
                            <label>
                              Locality<span>*</span>
                            </label>
                            <input
                              type="text"
                              name="locality"
                              value={locality}
                              placeholder=""
                              className={`form-control ${error.locality ? "is-invalid" : ""
                                }`}
                              required="required"
                              onChange={(e) => onInputChange(e)}
                            />
                            {error.locality ? (
                              <div className="invalid-feedback ">
                                {error.locality}
                              </div>
                            ) : (
                              ""
                            )}
                          </div>
                        </div>
                        <div className="col-lg-6 col-md-6 col-12">
                          <div className="form-group">
                            <label>
                              City<span>*</span>
                            </label>
                            <input
                              type="text"
                              name="city"
                              value={city}
                              placeholder=""
                              className={`form-control ${error.city ? "is-invalid" : ""
                                }`}
                              required="required"
                              onChange={(e) => onInputChange(e)}
                            />
                            {error.city ? (
                              <div className="invalid-feedback ">
                                {error.city}
                              </div>
                            ) : (
                              ""
                            )}
                          </div>
                        </div>
                        <div className="col-lg-6 col-md-6 col-12">
                          <div className="form-group">
                            <label>
                              Country<span>*</span>
                            </label>
                            <select
                              name="country"
                              id="country"
                              value={addressObj.country}
                              onChange={(e) => onInputChange(e)}
                            >
                              <option value="IN">India</option>
                              <option value="AF">Afghanistan</option>
                              <option value="AX">Åland Islands</option>
                              <option value="AL">Albania</option>
                              <option value="DZ">Algeria</option>
                              <option value="AS">American Samoa</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-lg-6 col-md-6 col-12">
                          <div className="form-group">
                            <label>
                              State / Divition<span>*</span>
                            </label>
                            {/* <select name="state-province" id="state-province" value={state}>
                                                            <option value="divition" selected="selected">New Yourk</option>
                                                            <option>Los Angeles</option>
                                                            <option>Chicago</option>
                                                            <option>Houston</option>
                                                            <option>San Diego</option>
                                                            <option>Dallas</option>
                                                            <option>Charlotte</option>
                                                        </select> */}
                            <input
                              type="text"
                              name="state"
                              value={state}
                              placeholder=""
                              className={`form-control ${error.state ? "is-invalid" : ""
                                }`}
                              required="required"
                              onChange={(e) => onInputChange(e)}
                            />
                            {error.state ? (
                              <div className="invalid-feedback ">
                                {error.state}
                              </div>
                            ) : (
                              ""
                            )}
                          </div>
                        </div>

                        <div className="col-lg-6 col-md-6 col-12">
                          <div className="form-group">
                            <label>
                              Postal Code<span>*</span>
                            </label>
                            <input
                              type="text"
                              name="pincode"
                              value={pincode}
                              placeholder=""
                              className={`form-control ${error.pincode ? "is-invalid" : ""
                                }`}
                              required="required"
                              onChange={(e) => onInputChange(e)}
                            />
                            {error.pincode ? (
                              <div className="invalid-feedback ">
                                {error.pincode}
                              </div>
                            ) : (
                              ""
                            )}
                          </div>
                        </div>
                        <div className="col-lg-6 col-md-6 col-12">
                          <div className="form-group">
                            <label>
                              Label<span>*</span>
                            </label>
                            <select
                              name="label"
                              id="country"
                              value={addressObj.label}
                              onChange={(e) => onInputChange(e)}
                            >
                              <option value={0}>Home</option>
                              <option value={1}>Work</option>
                              <option value={2}>Other</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-lg-6 col-md-6 col-12"></div>
                      </div>
                      <div style={{ float: "right" }}>
                        <button
                          onClick={(e) => addAddress(e)}
                          className="btn me-4"
                          disabled={enableButton}
                        >
                          {" "}
                          SAVE
                        </button>
                        <span></span>
                        <button
                          className="btn"
                          onClick={() => setaddNew(false)}
                        >
                          {" "}
                          CANCEL
                        </button>
                      </div>
                    </form>
                  )}
                </div>
                {products.length > 0 && (
                  <div className="card shadow mt-4">
                    <h4 className="m-4">Order Summary</h4>

                    {products.map((prod, index) => {
                      console.log("prodcts", products);
                      return (
                        <div className="card-body m-2 " key={index} >
                          <div className="row" >
                            <div className="col-2 image pb-4 checkout cat-select" onClick={e => productClick(e, prod._id)}>
                              <img
                                  src={aws_url + prod._id + "/" + prod.coverImage}
                                  className="img-fluid"
                                  alt="Phone"
                                />
                            </div>
                            <div className="col-10">
                              <h6 className="  name-select click-cursor" onClick={e => productClick(e, prod._id)}>{prod.productName}</h6>
                              <div className="prod-description " >{prod.description}</div>
                              <div className="row py-2">
                                <div className="col-6">
                                <span className="bold-font" >
                                  ${prod.price * prod.quantity}
                                </span>
                                </div>
                                <div className="col-6">
                                {actionFrom === "1" ? <div className="form-group">
                              <label for="exampleFormControlInput12">quantity : </label>
                              <select  id= "country" aria-label="Default select example" value={prod.quantity} onChange={e=> changeQnt(e.target.value,prod.price)}>
                                {qtyList.map((res,index)=>{
                                  return(<option value={res} disabled={res>prod.availableStock} key={index}>{res}</option>)
                                })}

                              </select>
                            </div>:<div className="">
                              <div>quantity :{prod.quantity}</div>
                              </div>}
                                </div>
                              </div>
                              <div className="col-12">
                              <span>Delivery in 5 days |</span>{" "}
                              <span className="success">Free</span>
                              </div>
                             
                            </div>

                            {/* <div className="col-xs-12 col-sm-3 col-md-3 col-lg-3 col-12 image pb-4 checkout cat-select" onClick={e => productClick(e, prod._id)}>
                              <img
                                src={aws_url + prod._id + "/" + prod.coverImage}
                                className="img-fluid"
                                alt="Phone"
                              />
                            </div>

                            <div className="col-xs-8 col-sm-8 col-md-5 col-lg-5">
                              <h6 className=" mb-2 cat-select" onClick={e => productClick(e, prod._id)}>{prod.productName}</h6>
                              <div className="prod-description cat-select" onClick={e => productClick(e, prod._id)}>{prod.description}</div>
                              <div>
                                <p className="font-weight-bold" >
                                  ${prod.price * prod.quantity}
                                </p>
                              </div>
                            </div>
                           {actionFrom === "1" ? <div className="col-sm-5 col-md-4 col-lg-2 d-flex align-items-baseline">
                              <div className="pe-1">quantity : </div>
                              <select class="form-select" aria-label="Default select example" value={prod.quantity} style={{width:"50%"}} onChange={e=> changeQnt(e.target.value,prod.price)}>
                                {qtyList.map((res,index)=>{
                                  return(<option value={res} disabled={res>prod.availableStock} key={index}>{res}</option>)
                                })}

                              </select>
                            </div>:<div className="col-sm-5 col-md-4 col-lg-2 d-flex align-items-baseline">
                              <div>quantity :{prod.quantity}</div>
                              </div>}
                           
                            <div className="col-sm-5 col-md-4 col-lg-3" >

                              <span>Delivery in 5 days |</span>{" "}
                              <span className="success">Free</span>
                            </div> */}
                          </div>
                          
                          <hr
                            className="mt-4"
                            style={{ backgroundColor: "rgb(108 108 108)" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-4 col-12">
              {coinBalance > 0 && (
                <div className="order-details">
                  <div className="single-widget">
                    <h2>Use Coins</h2>
                    <div className="content">

                      <ul>
                        <li >
                          <input
                            className="form-check-input"
                            type="checkbox"
                            value={coinsUsed}
                            id="flexCheckDefault"
                            onChange={(e) => coinCheckHandle(e)}
                          />
                          <label className="form-check-label ps-2">Use Coins</label>

                          <span className="coin-use">
                            {numToFixed(coinBalance)}&nbsp;&nbsp;
                            <BsCoin className="coin-icon" />
                          </span>
                        </li>
                        <li>
                          {totalCoinsUsed > 0 && coinsUsed && (
                            <span className="success">
                              {numToFixed(totalCoinsUsed)} &nbsp;coins used
                            </span>
                          )}
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* <div className="single-widget get-button">
                  <div className="content">
                    {selectAddress && (
                      <div className="button">
                        <button className="btn mt-4" onClick={checkout}>
                          <span className="ms-2">checkout with metamask</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div> */}
                </div>
              )}

              <div className="order-details">
                <div className="single-widget">
                  <h2>CART TOTALS</h2>
                  <div className="content">
                    <ul>
                      <li>
                        Sub Total<span>${cartTotal}</span>
                      </li>
                      <li>
                        (+) Shipping<span>${shippingCharge}</span>
                      </li>
                      {totalCoinsUsed > 0 && coinsUsed && (
                        <li>
                          Coins<span>${numToFixed(totalCoinsUsed)}</span>
                        </li>
                      )}
                      <li className="last">
                        Total
                        <span className="d-flex align-items-center">
                          ${payableDiscountAmount} ( <FaEthereum /> {ethPrice.toFixed(10)})
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="single-widget get-button">
                  <div className="content">
                    {selectAddress && (
                      <div className="button">
                        <button className="btn checkout-btn mt-4" onClick={priceStockCheck} disabled={checkoutLoading}>
                          {/* <img src="https://img.icons8.com/color/2x/metamask-logo.png"></img> */}
                          {/* <span className="ms-2">checkout with metamask</span> */}
                          {/* <div class="spinner-border text-warning" role="status">
                      <span class="sr-only"></span>
                    </div> */}
                          {checkoutLoading ? <div class="spinner-border text-warning" role="status">
                            <span class="sr-only"></span>
                          </div> : <span className="ms-2">checkout with metamask</span>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <section className="shop-services section home">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 col-md-6 col-12">
              <div className="single-service">
                <i className="fa-solid fa-truck nonclick"></i>
                <h4>Free shiping</h4>
                <p>Orders over $100</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="single-service">
                <i className="fa-solid fa-rotate nonclick"></i>
                <h4>Free Return</h4>
                <p>Within 30 days returns</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="single-service">
                <i className="fa-solid fa-lock nonclick"></i>
                <h4>Secure Payment</h4>
                <p>100% secure payment</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-12">
              <div className="single-service">
                <i className="fa-solid fa-tag nonclick"></i>
                <h4>Best Price</h4>
                <p>Guaranteed price</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* <section className="shop-newsletter section">
        <div className="container">
          <div className="inner-top">
            <div className="row">
              <div className="col-lg-8 offset-lg-2 col-12">
                <div className="inner">
                  <h4>Newsletter</h4>
                  <p>
                    {" "}
                    Subscribe to our newsletter and get <span>10%</span> off
                    your first purchase
                  </p>
                  <form
                    action="mail/mail.php"
                    method="get"
                    target="_blank"
                    className="newsletter-inner"
                  >
                    <input
                      name="EMAIL"
                      placeholder="Your email address"
                      required=""
                      type="email"
                    />
                    <button className="btn">Subscribe</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}
      <Modal
        dialogClassName="my-modal"
        show={show}
        onHide={handleClose}
        backdrop="static"
      >
        <Modal.Header>
          <Modal.Title>
            <h5>Remove Item</h5>
          </Modal.Title>
          <button
            type="button"
            onClick={handleClose}
            className="close"
            data-dismiss="modal"
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </Modal.Header>
        <Modal.Body>
          <>
            <div className="container p-4">
              <div className="p-2">
                <p>Are you sure you want to remove this item?</p>
              </div>
              <div className="mt-4" style={{ float: "right" }}>
                <button className="me-3 btn" onClick={handleClose}>
                  Cancel
                </button>
                <button className="mr-3 btn" onClick={handleClose}>
                  Remove
                </button>
              </div>
            </div>
          </>
        </Modal.Body>
      </Modal>
      <DeleteConfirmModal show={confirmShow} close={modalClose} body={modalBody} confirm={modalConfirm} />
      <PaymentConfirmModal show={paymentModal} />
    </div>
  );
}

export default Checkout;
