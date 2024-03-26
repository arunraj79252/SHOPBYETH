import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAppContext from "../AppContext";
import { FaEthereum } from "react-icons/fa";

function Cart() {
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const aws_url = process.env.REACT_APP_AWS_ENDPOINT;
  const appContext = useAppContext();
  const navigate = useNavigate();
  const [itemList, setItemList] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [ethereumPrice, setEthereumPrice] = useState(0);
  const [payableAmount, setPayableAmount] = useState([]);
  const connected = localStorage.getItem("connected");
  const loginStatus = +localStorage.getItem("status");
  const [loading, setLoading] = useState(true)
  const localStorageCartList = JSON.parse(localStorage.getItem("cartList"));
  const [enableButton, setEnableButton] = useState(false)
  // useEffect(() => {
  //   localStorage.removeItem("buyNowProduct");
  //   if (connected && loginStatus === 1) {
  //     getCartList();
  //   } else {
  //     getLocalCartList();
  //   }
  //   console.log("new build");
  // }, []);

  useEffect(() => {
    localStorage.removeItem("buyNowProduct");
    if (appContext.getStatus() === 1) {
      getCartList();
    }
    else {
      getLocalCartList()
    }
  }, [appContext.getStatus()])
  useEffect(() => {
    console.log(loading);
  }, [loading])

  useEffect(() => {
    if (itemList) {
      let flag = false
      itemList.forEach((res) => {
        if (res.quantity > res.availableStock || res.availableStock === 0) {
          flag = true
        }
      })
      setEnableButton(flag)
    }
  }, [itemList])

  const getCartList = async () => {
    try {
      let path = base_url + "users/me/viewCartItems";
      await appContext
        .getAxios()
        .get(path)
        .then((response) => {
          console.log("resp",response);
          let resp = response.data;
          if (resp) {
            let array = resp?.map((data) => {
              data.amount = data.quantity * data.price;
              return data;
            });
            setItemList(array);
            console.log(response);
            getCartTotal(resp);
            
          }
          setLoading(false)
        });
    } catch (error) { }
  };
  useEffect(() => {
    // itemList.
  }, [itemList]);

  const getLocalCartList = async (resp) => {
    try {
      if (localStorageCartList) {
        let idList = [];
        localStorageCartList.map((data) => {
          idList.push(data.id);

          if (!data.quantity) {
            data.quantity = 1;
          }
          data.amount = data.quantity * data.price;
          return data;
        });
        console.log(localStorageCartList);
        // console.log(idList);
        getLocalNewPriceDetails(idList, localStorageCartList);
        setLoading(false)
        setItemList(localStorageCartList);
        getCartTotal(localStorageCartList);
      }
      else {
        setLoading(false)
      }
    } catch (error) { }
  };
  const getLocalNewPriceDetails = async (id, localStorageCartList) => {
    let body = {
      productIds: id,
    };
    await axios
      .post(base_url + "public/products/productInfo", body)
      .then((res) => {
        console.log(res.data);
        let realPrice = res.data;
        // let abc = res.data.find((res)=>res.id=131669279994799)
        // console.log(abc);
        localStorageCartList.map((res) => {
          // console.log(realPrice.find((data)=>res._id===data.id));
          res.price = realPrice.find((data) => res._id === data.id).price;
          res.amount = res.quantity * res.price;
          console.log(res.price);
          res.availableStock = realPrice.find(
            (data) => res._id === data.id
          ).availableStock;
          return res;
        });
        console.log(localStorageCartList);
        setItemList(localStorageCartList);
        getCartTotal(localStorageCartList);
        setLoading(false)
      });
  };

  const removeItemFromCart = async (rowdata, index) => {
    // e.preventDefault()
    if (appContext.isLoggedIn() && appContext.getStatus() === 1) {
      try {


        console.log("api called");
        let path = base_url + "users/me/deleteCartItems/" + rowdata._id;

        await appContext
          .getAxios()
          .delete(path)
          .then((response) => {
            appContext.setcount(+localStorage.getItem("cartCount") - 1);
            console.log(response);
            toast.success("Item removed from cart !");
            console.log(index);
            if (index !== -1) {
              // array.splice(0,index, 1);
              setItemList([...itemList.slice(0, index),
              ...itemList.slice(index + 1, itemList.length)]);
              getCartTotal([...itemList.slice(0, index),
              ...itemList.slice(index + 1, itemList.length)]);
              setLoading(false)
            }
          });
      } catch (error) {
        console.error(error);
      }
    } else {
      var array = [
        ...itemList.splice(0, index),
        ...itemList.splice(index + 1, itemList.length),
      ];
      // setItemList([...itemList.splice(0,index),...itemList.splice(index+1,itemList.length)]);
      // getCartTotal([...itemList.splice(0,index),...itemList.splice(index+1,itemList.length)]);
      console.log(array);
      setItemList(array);
      getCartTotal(array);
      console.log(array);
      setLoading(false)
      // console.log(arra);
      localStorage.setItem("cartList", JSON.stringify(array));
    }
  };
  const checkout = () => {
    try {
      if (appContext.isLoggedIn() && appContext.getStatus() === 1) {
        localStorage.setItem("checkoutPath", 0);
        navigate("/checkout", { state: { id: "cart", amount: cartTotal } });
      } else {
        toast.error("Please login first");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const continueShopping = () => {
    try {
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };
  const quantityChange = async (mode, product, quantity, i) => {
    // debugger;
    var array = [...itemList];
    if (mode === "plus") {
      if (product.availableStock === 0) {
        toast.error("Product is out of stock");
        return;
      } else if (quantity + 1 > product.availableStock) {
        toast.error(
          "We're sorry! only " +
          product.availableStock +
          " quantity is in stock"
        );
        return;
      }
      array[i].quantity = quantity + 1;
    } else {

      if (product.availableStock === 0 || quantity - 1 === 0) {
        removeItemFromCart(product, i)
        return
      }
      else if (quantity - 1 > product.availableStock) {
        array[i].quantity = product.availableStock;
      } else {
        array[i].quantity = quantity - 1;
      }
    }

    if (appContext.isLoggedIn() && appContext.getStatus() === 1) {
      try {
        console.log(product);
        let path = base_url + "users/me/addToCart";
        let body = {
          products: [
            {
              productId: product._id,
              productQuantity: array[i].quantity,
            },
          ],
        };

        await appContext
          .getAxios()
          .post(path, body)
          .then((response) => {
            console.log(response);
            array[i].amount = array[i].quantity * array[i].price;
            setItemList(array);
            setLoading(false)
            getCartTotal(array);
          });
      } catch (error) {
        console.error(error);
      }
    } else {
      array[i].amount = array[i].quantity * array[i].price;
      console.log(array);
      getCartTotal(array);
      setItemList(array);
      setLoading(false)
      localStorage.setItem("cartList", JSON.stringify(array));
    }
  };
  const applyCoupon = () => {
    try {
    } catch (error) {
      console.error(error);
    }
  };

  const getCartTotal = (data) => {
    try {
      console.log("list", data);
      let newList = []
      var subtotal = 0;
      for (let obj of data) {
        newList.push(obj.amount)
        console.log(Number(subtotal) + " + " + Number(obj.amount));
        subtotal = Number(subtotal) + Number(obj.amount);
        console.log("sub " + subtotal, obj.amount);
      }

      setCartTotal(subtotal.toFixed(4));
      appContext.setCartCount(data.length);
      localStorage.setItem("cartTotal", data.length);
      setPayableAmount(subtotal.toFixed(4));
      getEthPrice(subtotal);

    } catch (error) {
      console.error(error);
    }
  };
  const getEthPrice = async (price) => {
    try {
      let path = "https://api.coinconvert.net/convert/usd/eth?amount=" + price;
      await axios.get(path).then((response) => {
        let resp = response.data;
        if (resp) {
          let data = resp.ETH
          console.log("data", data);
          localStorage.setItem("ETHPrice", data);
          setEthereumPrice(data);
        }
      });
    } catch (error) { }
  };

  const productClick = (e, product) => {
    e.preventDefault();
    localStorage.setItem("productId", product._id);
    navigate("/productDetails/" + product._id);
  };
  const addToWishlist = async (id) => {
    console.log("idd",id);
    const path = process.env.REACT_APP_API_ENDPOINT;
    let body = {
      productId: id,
    };
    await appContext
      .getAxios()
      .post(path + "users/wishlist", body)
      .then((res) => {
        console.log("hoii", id);
        console.log(res);
        toast.success("Item added to wishlist !");
        // var tempProductarray = [...trending];
        // let obj = tempProductarray.find((a) => a.id === id);
        // obj.isWishlisted = true;
        // setTrending(tempProductarray);
        appContext.setcount(appContext.wishListCount() + 1);
        getCartList();
        //setTrending(res.data.docs)
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const removeFromWishlist = async (id) => {
    await appContext
      .getAxios()
      .delete(base_url + `users/wishlist/${id}`)
      .then((res) => {
        console.log("hoii", id);
        console.log(res);
        toast.success("Item removed from wishlist !");
        getCartList();
        appContext.setcount(appContext.wishListCount()-1);
          
        //setTrending(res.data.docs)
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <>
      <div className="breadcrumbs">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="bread-inner">
                <ul className="bread-list">
                  <li>
                    <Link to={"/"}>
                      Home<i className="fa-solid fa-arrow-right"></i>
                    </Link>
                  </li>
                  <li className="active">
                    <Link>Cart</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="shopping-cart section body-container">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <table className="table shopping-summery">
                <thead>
                  <tr className="main-hading">
                    <th>PRODUCT</th>
                    <th>NAME</th>
                    <th className="text-center">UNIT PRICE</th>
                    <th className="text-center">QUANTITY</th>
                    <th className="text-center">TOTAL</th>
                    <th className="text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    itemList.length > 0 ? (
                      itemList.map((result, index) => {
                        return (
                          <tr key={index} className="my-2">
                            <td className="image cart-image-row" data-title="No">
                              <div className="cart-image-container">
                                <img
                                  className={`cursor-style ${(result.availableStock === 0 ||
                                      result.quantity > result.availableStock) &&
                                    "outofstockimg"
                                    }`}
                                  src={
                                    aws_url + result._id + "/" + result.coverImage
                                  }
                                  alt="https://via.placeholder.com/100x100"
                                  onClick={(e) => productClick(e, result)}
                                />
                                {(result.availableStock === 0 ||
                                  result.quantity > result.availableStock) && (
                                    <div className="centered">No stock</div>
                                  )}
                              </div>
                            </td>
                            <td className="product-des" data-title="Description">
                              <span>
                                <p className="product-name">
                                  <a
                                    href=" "
                                    className={`${(result.availableStock === 0 ||
                                        result.quantity >
                                        result.availableStock) &&
                                      "text-danger"
                                      }`}
                                    onClick={(e) => productClick(e, result)}
                                  >
                                    {result.productName}
                                  </a>
                                </p>

                                <p
                                  className={`product-des ${(result.availableStock === 0 ||
                                      result.quantity > result.availableStock) &&
                                    "text-danger"
                                    }`}
                                >
                                  {result.description}
                                </p>
                              </span>
                            </td>
                            <td className="price" data-title="Price">
                              <span
                                className={`${(result.availableStock === 0 ||
                                    result.quantity > result.availableStock) &&
                                  "text-danger"
                                  }`}
                              >
                                ${result.price}{" "}
                              </span>
                            </td>
                            <td className="qty" data-title="Qty">
                              <div className="quantiy-container">
                                <div className="input-group">
                                  <div className="button minus">
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-number"
                                      disabled={result.quantity <= 0}
                                      data-type="minus"
                                      data-field="quant[1]"
                                      onClick={(e) =>
                                        quantityChange(
                                          "minus",
                                          result,
                                          result.quantity,
                                          index
                                        )
                                      }
                                    >
                                      <i className="fa-solid fa-minus"></i>
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    name="quant[1]"
                                    className={`input-number ${(result.availableStock === 0 ||
                                        result.quantity >
                                        result.availableStock) &&
                                      "text-danger"
                                      }`}
                                    data-min="1"
                                    data-max="100"
                                    value={result.quantity}
                                  />
                                  <div className="button plus">
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-number"
                                      disabled={result.quantity === 10 || result.quantity + 1 > result.availableStock}
                                      data-type="plus"
                                      data-field="quant[1]"
                                      onClick={(e) =>
                                        quantityChange(
                                          "plus",
                                          result,
                                          result.quantity,
                                          index
                                        )
                                      }
                                    >
                                      <i className="fa-solid fa-plus"></i>
                                    </button>
                                  </div>
                                </div>

                                {/* {result.availableStock === 0 ? (
                                <div className="quantity-error text-danger">
                                  Out of stock
                                </div>
                              ) : (
                                <div className="quantity-error text-danger">
                                  only {result.availableStock} stock is
                                  available
                                </div>} */}


                                {(result.availableStock === 0 ||
                                  result.quantity > result.availableStock) && <>
                                    {result.availableStock === 0 ? <div className="quantity-error text-danger">
                                      Out of stock
                                    </div> : <div className="quantity-error text-danger">
                                      only {result.availableStock} stock is
                                      available
                                    </div>}
                                  </>
                                }
                                {/* {(result.availableStock === result.quantity && result.availableStock !== 0) &&
                                <div className="quantity-error text-danger">
                                Out of stocks
                                </div>
                              } */}
                              </div>
                            </td>
                            <td className="total-amount" data-title="Total">
                              <span
                                className={`${(result.availableStock === 0 || result.quantity > result.availableStock) && "text-danger"
                                  }`}
                              >
                                ${result.amount.toFixed(3)}
                              </span>
                            </td>
                            <td className="action" data-title="Remove">
                              <Link className="single-icon">
                                <i
                                  onClick={(e) =>
                                    removeItemFromCart(result, index)
                                  }
                                  className="fa-solid fa-trash-can"
                                  title="Remove from cart"
                                ></i>
                              </Link>
                              {loginStatus===1&&<Link>
                                {!result.isInWishlist?<i className=" fa-regular fa-heart ms-2 single-icon" title="Add to wishlist" onClick={(e)=>addToWishlist(result._id)}></i>:<i className=" fa fa-heart ms-2 single-icon" title="Remove from wishlist" onClick={(e)=>removeFromWishlist(result._id)}></i>}
                              </Link>}
                            </td>
                          </tr>
                        );
                      })
                    ) : loading ? <tr>
                      <td className="text-center" colSpan={6}>

                        <div class="spinner-border text-warning mt-5" role="status">
                          <span class="sr-only"></span>
                        </div>
                      </td>
                    </tr>

                      : (
                        <tr>
                          <td className="text-center" colSpan={6}>
                            <h6>Your basket is empty!</h6>
                            <button className="btn mt-4" onClick={continueShopping}>
                              Shop Now
                            </button>
                          </td>
                        </tr>
                      )}
                </tbody>
              </table>
            </div>
          </div>
          {itemList.length > 0 && (
            <div className="row">
              <div className="col-12">
                <div className="total-amount">
                  <div className="row">
                    <div className="col-lg-8 col-md-5 col-12">
                      <div className="left">
                        {/* <div className="coupon">
                                                <form action="#" target="_blank">
                                                    <input name="Coupon" placeholder="Enter Your Coupon" />
                                                    <button className="btn" onClick={applyCoupon}>Apply</button>
                                                </form>
                                            </div>
                                            <div className="checkbox">
                                                <label className="checkbox-inline" htmlFor="2"><input name="news" id="2" type="checkbox" /> Shipping (+10$)</label>
                                            </div> */}
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-7 col-12">
                      <div className="right">
                        <ul>
                          <li>
                            Cart Subtotal<span>${cartTotal}</span>
                          </li>
                          <li>
                            Shipping<span>Free</span>
                          </li>
                          <li>
                            You Save<span>$0.00</span>
                          </li>
                          <li className="last">
                            You Pay
                            <span className="d-flex align-items-center">
                              ${payableAmount} ( <FaEthereum /> {ethereumPrice.toFixed(10)})
                            </span>
                          </li>
                        </ul>
                        <div className="button5">
                          <button className="btn" disabled={enableButton} onClick={checkout}>
                            Checkout
                          </button>
                          <button className="btn" onClick={continueShopping}>
                            Continue shopping
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
           
          </div>
        </div>
      </section> */}
    </>
  );
}

export default Cart;
