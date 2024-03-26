import React, { useEffect, useState } from "react";
import { BsFillCartCheckFill } from "react-icons/bs";
import {  FaTrashAlt,FaShoppingCart, FaCartPlus, FaCartArrowDown } from "react-icons/fa";

import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAppContext from "../AppContext";

function Wishlist() {
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const aws_url = process.env.REACT_APP_AWS_ENDPOINT;
  const navigate = useNavigate();
  const appContext = useAppContext();
  const [wishList, setWishList] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getWishList();
  }, []);

  const getWishList = async () => {
    try {
      let path = base_url + "users/wishlist";
      await appContext
        .getAxios()
        .get(path)
        .then((response) => {
          let resp = response.data;
          setWishList(resp);
          setLoading(false);
        });
    } catch (error) {}
  };

  const removeFromWishlist = async (product) => {
    try {
      product.wished = true;
      let wishlistCount = localStorage.getItem("wishlistCount");
      console.log("addToWishlist called", product.wished);
      let path = base_url + "users/wishlist/" + product._id;
      await appContext
        .getAxios()
        .delete(path)
        .then((response) => {
          toast.success("Item removed from wishlist !");
          console.log(response);
          wishlistCount = wishlistCount - 1;
          localStorage.setItem("wishlistCount", wishlistCount);
          getCount();
          // appContext.setcount(1);
          getWishList();
        });
    } catch (error) {
      console.error(error);
    }
  };
  const getCount = async () => {
    try {
      let path = base_url + "users/counts";
      await appContext
        .getAxios()
        .get(path)
        .then((response) => {
          let resp = response.data;

          appContext.setWishListCount(resp.wishlistCount);
        });
    } catch (error) {}
  };
  const addToCart = async (product) => {
    try {
      
      console.log("api called");
      let path = base_url + "users/me/addToCart";
      let newWishList = [...wishList]
      let obj= newWishList.find((res)=>
        res._id === product._id
      )
      obj.isInCart =true
      let body = {
        products: [
          {
            productId: product._id,
            productQuantity: 1,
          },
        ],
      };
      await appContext
        .getAxios()
        .post(path, body)
        .then((response) => {
          console.log(response);
          toast.success("Item added to cart");
          getWishList()
          appContext.setcount(+localStorage.getItem("cartCount") + 1);

        });
    } catch (error) {

    }
  };

  const viewCart = (e) =>{
    e.preventDefault()
    console.log("sss");
    navigate("/cart")
  }
  const productClick = (e, product) => {
    e.preventDefault();
    localStorage.setItem("productId", product._id);
    navigate("/productDetails/" + product._id);
  };
  return (
    <>
    <div className="body-container">
      <div className="breadcrumbs ">
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
                    <Link>Wishlist</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="shopping-cart section mb-4 pt-0">
        <div className="container">
          <div className="row">
            <div className="col-12 mb-4">
              <h4 className="m-4">Wishlist</h4>
              {wishList.length > 0 ? (
                <div className="card shadow">
                  {wishList.map((prod, index) => {
                    return (
                      <div className="card-body m-2" key={index}>
                        <div className="row">
                          <div className="col-xs-12 col-sm-3 col-md-3 col-lg-2 col-12 imgcontainer">
                            <img
                              src={aws_url + prod._id + "/" + prod.coverImage}
                              className="img-fluid wishlistimage cursor-style"
                              alt="product"
                              onClick={(e) => productClick(e, prod)}
                            />
                            {prod.availableStock <= 0 && (
                              <div className="centered"> Out of Stock </div>
                            )}
                          </div>

                          <div className="col-xs-8 col-sm-7 col-md-6 col-lg-7 mt-2">
                            <Link
                              className="mb-2 productname"
                              onClick={(e) => productClick(e, prod)}
                            >
                              {prod.productName}
                            </Link>
                            <div className="prod-description">{prod.description}</div>
                            <div className="mt-4 mb-4">
                              <h5>${prod.price}</h5>
                            </div>
                          </div>
                          <div className="col-sm-2 col-md-3 col-lg-2 wishbutn mt-2 d-flex justify-content-end align-items-center">
                            {prod.isInCart ? (
                             
                              <span>
                              {prod.availableStock > 0 &&
                              
                                <button
                                  className="icon-button me-4"
                                  onClick={(e) => viewCart(e)}
                                  data-toggle="tooltip" data-placement="bottom" title="View in cart"
                                >
                                  <FaCartArrowDown className="icon-large"/>
                                </button>
                            }
                            </span>
                            ):
                            (
                              <span>
                              {prod.availableStock > 0 &&
                              
                              

                                <button
                                  className="icon-button me-4"
                                  onClick={() => addToCart(prod)}
                                  data-toggle="tooltip" data-placement="bottom" title="Add to cart"
                                >
                                  <FaCartPlus className="icon-large"/>
                                </button>
                             }
                            </span>
                              )
                            }
                            <span></span>
                             
                              <button
                                className="icon-button"
                                onClick={(e) => removeFromWishlist(prod)}
                                data-toggle="tooltip" data-placement="bottom" title="Remove from wishlist"
                              >
                                <FaTrashAlt className="icon-large"/>
                              </button>
              
                          </div>
                        </div>

                        <hr
                          className="mt-4"
                          style={{ backgroundColor: "rgb(108 108 108)" }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : loading ? (
                <div class="d-flex justify-content-center">
                  <div class="spinner-border text-warning" role="status">
                    <span class="sr-only"></span>
                  </div>
                </div>
              ) : (
                <div className="card text-center">
                  <div className="m-4">
                    <h6 className="m-4">Your wishlist is empty!</h6>{" "}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* <section className="shop-newsletter section">
                <div className="container">
                    <div className="inner-top">
                        <div className="row">
                            <div className="col-lg-8 offset-lg-2 col-12">
                                <div className="inner">
                                    <h4>Newsletter</h4>
                                    <p> Subscribe to our newsletter and get <span>10%</span> off your first purchase</p>
                                    <form action="mail/mail.php" method="get" target="_blank" className="newsletter-inner">
                                        <input name="EMAIL" placeholder="Your email address" required="" type="email" />
                                        <button className="btn">Subscribe</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}
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
    </>
  );
}

export default Wishlist;
