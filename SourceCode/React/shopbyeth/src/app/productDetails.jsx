import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { Galleria } from "primereact/galleria";
import useAppContext from "../AppContext";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import ReactImageGallery from "react-image-gallery";
import ReactImageMagnify from "react-image-magnify";
import { Rating } from "primereact/rating";
import moment from "moment";
import RatingModal from "./ratingModal";
import { IoMdStar } from "react-icons/io";
import ProgressBar from "react-bootstrap/ProgressBar";
import imageZoom from "./imageZoom";
import Slider from "react-slick";
import { FacebookShareButton, WhatsappShareButton, FacebookIcon, WhatsappIcon, EmailShareButton, EmailIcon, TwitterShareButton, TwitterIcon } from "react-share";
import { async } from "@firebase/util";
import { TiArrowForwardOutline } from "react-icons/ti";
import ReviewDetailModal from "./reviewDetailModal";
const Border = styled.div`
  border-bottom: 1px solid black;
`;
const ProductDetails = () => {
  const imageGalleryRef = useRef(null)
  const params = useParams();
  const productId = params.id;
  const shareUrl = 'https://shopbyeth.innovaturelabs.com/productDetails/' + params.id;
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const aws_url = process.env.REACT_APP_AWS_ENDPOINT;
  const aws_feedback_url ="https://locals3-shopbyeth.innovaturelabs.com/shopbyeth/feedbackImages/"
  const appContext = useAppContext();
  const navigate = useNavigate();
  const [ratingShow, setRatingShow] = useState(false);
  const [images, setImages] = useState(null);
  const [productObj, setProductObj] = useState(null);
  const [maxRating, setMaxRating] = useState(1);
  const [similarProducts, setSimilarProducts] = useState([])
  const connected = localStorage.getItem("connected");
  const loginStatus = +localStorage.getItem("status");
  const [wishListDelay, setWishListDelay] = useState(false)
  const [myFeedback, setMyFeedback] = useState([]);
  const localStorageCartList = JSON.parse(localStorage.getItem("cartList"));
  const [ratingCount, setRatingCount] = useState(0);
  const [offer, setOffer] = useState(0);
  const userId = localStorage.getItem("accountAddress");
  const [hasRated, setHasRated] = useState(false);
  const [viewMore, setViewMore] = useState(true);
  const [showRatingImage, setShowRatingImage] = useState(false)
  const [feedbackSelected, setFeedbackSelected] = useState()
  const [userSelected, setUserSelected] = useState()
  const [feedbackViewMore, setFeedbackViewMore] = useState([])
  const responsiveOptions2 = [
    {
      breakpoint: "1024px",
      numVisible: 5,
    },
    {
      breakpoint: "768px",
      numVisible: 3,
    },
    {
      breakpoint: "560px",
      numVisible: 1,
    },
  ];

  useEffect(() => {
    getProductDetails();
    getSimilarProducts();
    console.log("url", shareUrl);
  }, []);
  useEffect(() => {
    console.log("Ssss");
  }, [imageGalleryRef.current])
  const imageOnClick = () => {

    console.log(images);
    let image = images.map(({ original, thumbnail }) => ({ original, thumbnail }))
    console.log(image);
    // setImages(image)
    imageGalleryRef.current.fullScreen()
  }
  const onIMageScreenChange = () => {
    console.log("sssaa");
    console.log(imageGalleryRef.current, "www");
  }
  const getSimilarProducts = async () => {
    const path = base_url + "public/products/similarProducts/" + productId;

    await appContext
    .getAxios()
    .get(path).then((res) => {
        console.log("logged trend", res.data.docs);
        setSimilarProducts(res.data.docs);
      })
      .catch((err) => {
        console.log(err);
      });

    console.log("similar", similarProducts);
  }
  useEffect(() => {
    if (productObj?.description) {
      productObj.description.split("\n").map((res, i) => {
        console.log(res);
      });

    }
  }, [productObj])
  const getProductDetails = () => {
    if (connected && loginStatus === 1) {
      getUserProductDetails();
    } else {
      getPublicProductDetails();
    }
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
  const ratingClose = () => {
    setRatingShow(false);
    getProductDetails();
  };
  const seeAllReviews = (e, product) => {
    e.preventDefault();
    navigate("/ratingdetails/" + product._id, { state: { product: product } });
  };
  const getPublicProductDetails = async () => {
    try {
      console.log("productid", productId);
      let path = base_url + "public/products/" + productId;
      await axios.get(path).then((response) => {
        let resp = response.data;
        if (localStorageCartList) {
          let check = localStorageCartList.find((res) => res._id === productId);
          if (check) {
            resp.isInCart = true;
          }
        }

        setProductObj(resp);
        setFeedbackViewMore(new Array(resp?.data?.feedback?.length)?.fill(false))
        setMaxRating(
          Math.max(
            resp.fiveStar,
            resp.fourStar,
            resp.threeStar,
            resp.twoStar,
            resp.oneStar
          )
        );
        console.log(resp);
        let images = resp.productImages.map((obj) => {
          let name = {
            original: aws_url + productId + "/" + obj,
            thumbnail: aws_url + productId + "/" + obj,
            originalHeight: "600px",
          };
          return name;
        });
        setImages(images);
        var offerpercent =
          ((resp.originalPrice - resp.price) / resp.originalPrice) * 100;
        setOffer(Math.round(offerpercent));
      });
    } catch (error) { }
  };
  const deleteReview = async (e, id) => {
    e.preventDefault();
    await appContext
      .getAxios()
      .delete(base_url + "users/products/feedback/" + params.id + "/" + id)
      .then(() => {
        toast.success("Review deleted successfully");
        getProductDetails();
      });
  };
  var settings = {
    infinite: true,
    slidesToShow: 6,
    slidesToScroll: 2,
    autoplay: false,
    speed: 2000,

    responsive: [
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 2,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
    ],
  };
  var similarSettings = {
    infinite: true,
    slidesToShow: 6,
    slidesToScroll: 2,
    autoplay: false,
    speed: 2000,

    responsive: [
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 2,
        },
      },
      {
        breakpoint: 1000,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 2,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
    ],
  };
  const getUserProductDetails = async () => {
    try {
      console.log("productid", productId);
      let path = base_url + "users/products/" + productId;
      await appContext
        .getAxios()
        .get(path)
        .then((response) => {
          let resp = response.data;
          setProductObj(resp);
          setFeedbackViewMore(new Array(resp?.data?.feedback?.length)?.fill(false))
          setMaxRating(
            Math.max(
              resp.fiveStar,
              resp.fourStar,
              resp.threeStar,
              resp.twoStar,
              resp.oneStar
            )
          );
          let images = resp.productImages.map((obj) => {
            let name = {
              original: aws_url + productId + "/" + obj,
              thumbnail: aws_url + productId + "/" + obj,
              originalHeight: "600px",
            };
            return name;
          });
          setImages(images);
          console.log(images);
          var offerpercent =
            ((resp.originalPrice - resp.price) / resp.originalPrice) * 100;
          setOffer(Math.round(offerpercent));

          setHasRated(resp.hasRated);
          console.log(productObj.feedback);
          setMyFeedback(productObj.feedback);
        });
    } catch (error) { }
  };
  const openRatingImage = (e,res,name)=>{
    e.preventDefault()
    setShowRatingImage(true)
    setFeedbackSelected(res)
    setUserSelected(name)
  }
  const itemTemplate = (item) => {
    return (
      <img
        className=""
        src={item.image}
        onError={(e) =>
        (e.target.src =
          "https://www.primefaces.org/wp-content/uploads/2020/05/placeholder.png")
        }
        alt={item.alt}
        style={{
          width: "100%",
          display: "block",
          maxHeight: "500px",
          height: "500px",
        }}
      />
    );
  };
  const ratingImageClose = () =>{
    setShowRatingImage(false)
  }
  const thumbnailTemplate = (item) => {
    return (
      <img
        src={item.thumb}
        className=""
        onError={(e) =>
        (e.target.src =
          "https://www.primefaces.org/wp-content/uploads/2020/05/placeholder.png")
        }
        alt={item.alt}
        style={{ width: "100%", display: "block" }}
      />
    );
  };
  useEffect(() => {
    let data = [
      {
        name: "Ferrari",
        image:
          "https://www.primefaces.org/primereact/images/galleria/galleria1.jpg",
        thumb:
          "https://www.primefaces.org/primereact/images/galleria/galleria1s.jpg",
        price: "$4573",
      },
      {
        name: "Obaku",
        image:
          "https://www.primefaces.org/primereact/images/galleria/galleria2.jpg",
        thumb:
          "https://www.primefaces.org/primereact/images/galleria/galleria2s.jpg",
        price: "$5575",
      },
      {
        name: "Tommy Hilfiger",
        image:
          "https://www.primefaces.org/primereact/images/galleria/galleria3s.jpg",
        thumb:
          "https://www.primefaces.org/primereact/images/galleria/galleria1s.jpg",
        price: "$3024",
      },
      {
        name: "Citizen",
        image: "image.png",
        thumb:
          "https://www.primefaces.org/primereact/images/galleria/galleria1s.jpg",
        price: "$2650",
      },
      {
        name: "Seiko",
        image:
          "https://preview.colorlib.com/theme/timezone/assets/img/gallery/xpopular5.png.pagespeed.ic.ak-jzjbDc8.webp",
        thumb:
          "https://www.primefaces.org/primereact/images/galleria/galleria1s.jpg",
        price: "$4573",
      },
      {
        name: "Daniel Wellington",
        image:
          "https://preview.colorlib.com/theme/timezone/assets/img/gallery/xpopular6.png.pagespeed.ic.Q3zrxHTInj.webp",
        thumb:
          "https://www.primefaces.org/primereact/images/galleria/galleria1s.jpg",
        price: "$4573",
      },
      {
        name: "Tissot",
        image:
          "https://preview.colorlib.com/theme/timezone/assets/img/gallery/xpopular1.png.pagespeed.ic.V6f1NFO7gC.webp",
        thumb:
          "https://www.primefaces.org/primereact/images/galleria/galleria1s.jpg",
        price: "$4573",
      },
      {
        name: "Titan",
        image:
          "https://preview.colorlib.com/theme/timezone/assets/img/gallery/xpopular2.png.pagespeed.ic.tyRElexSbg.webp",
        thumb:
          "https://www.primefaces.org/primereact/images/galleria/galleria1s.jpg",
        price: "$2650",
      },
    ];
    // setImages(data)
  }, []);

  const addToCart = async () => {
    try {
      if (connected && loginStatus === 1) {
        let path = base_url + "users/me/addToCart";
        let body = {
          products: [
            {
              productId: productObj._id,
              productQuantity: 1,
            },
          ],
        };
        await appContext
          .getAxios()
          .post(path, body)
          .then((response) => {
            console.log(response);
            appContext.setcount(+localStorage.getItem("cartCount") + 1);
            toast.success("Item added to cart !");
            getProductDetails();
            getSimilarProducts()
          });
      } else {
        setProductObj({ ...productObj, isInCart: true });
        let cartCount = +localStorage.getItem("cartCount");
        let array = [];
        if (localStorageCartList) array = localStorageCartList;
        productObj.id = productObj._id;
        array.push(productObj);
        cartCount = cartCount + 1;
        appContext.setCartCount(cartCount);
        localStorage.setItem("cartList", JSON.stringify(array));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addToWishlist = async (e,product) => {
    try {
      e.preventDefault()
 
        setWishListDelay(true)
        let path = base_url + "users/wishlist";
      let body = {
        productId: product._id,
      };
      await appContext
        .getAxios()
        .post(path, body)
        .then((response) => {
          console.log(response);
          appContext.setcount(appContext.wishListCount() + 1);
          toast.success("Item added to wishlist !");
          getSimilarProducts();
          getProductDetails();
          setTimeout(() => {
            setWishListDelay(false)  
          }, 700);
        });  

      
    } catch (error) { 
      setWishListDelay(false) 
    }
  };

  const goToCart = async () => {
    navigate("/cart");
  };

  const buyNow = async () => {

    if (appContext.getStatus() === 1) {
      let prodArray = productObj;
      prodArray.quantity = 1;
      localStorage.setItem("buyNowProduct", JSON.stringify(prodArray));
      appContext.setbuyNow(productObj);
      localStorage.setItem("checkoutPath", 1);
      navigate("/checkout", { state: { id: "buynow" } });
    }
    else {
      toast.error("Please login", { toastId: 'loginId' })
    }
  }

  const removeFromWishlist = async (e,product) => {
    try {
      e.preventDefault()
   
        setWishListDelay(true)
        console.log("addToWishlist called");
        let path = base_url + "users/wishlist/" + product._id;
        await appContext
          .getAxios()
          .delete(path)
          .then((response) => {
            toast.success("Item removed from wishlist !");
            getSimilarProducts();
            console.log(response);
            appContext.setcount(appContext.wishListCount() - 1);
            getProductDetails();
            setTimeout(() => {
              setWishListDelay(false)  
            }, 700);
            
          });  

      
    } catch (error) { 
      setWishListDelay(false) 
    }
  };

  const myRenderItem = () => {
    <div>
      <span style={{ left: "45%" }} className="image-gallery-description">
        hello world
      </span>
    </div>;
  };
  const rateProduct = () => {
    setRatingShow(true);
  };
  const setView = (e, val) => {
    if (val === 0) {
      setViewMore(false);
    } else {
      setViewMore(true);
    }
  };
  const imageMouseOver = (e) => {
    e.preventDefault()
    console.log(e);
    console.log(imageGalleryRef.current.state.currentIndex, "wwww");
    console.log("Wwwwwwwwwwwwwww");
    let lense = document.getElementsByClassName('img-zoom-lens')
    let zoomResult = document.getElementById("myresult")
    zoomResult.style.display = "inherit"
    console.log(lense);
    if (lense.length > 0) {
      lense[0].style.visibility = "inherit"
    }
    imageZoom('image-gallery-image', 'myresult', imageGalleryRef.current.state.currentIndex)
  }
  const imageMouseLeave = (e) => {
    let lense = document.getElementsByClassName('img-zoom-lens')
    let zoomResult = document.getElementById("myresult")
    zoomResult.style.display = "none"
    console.log(lense);
    if (lense) {
      lense[0].style.visibility = "hidden"
    }
    lense.forEach(element => {
      element.style.display = "none"
    });
    lense.style.display = "none"
  }
  const setMore =(e,index,flag)  =>{
    e.preventDefault()
    let viewArray = feedbackViewMore
    viewArray[index] =flag 
    setFeedbackViewMore([...viewArray])
  }
  const productClick = async (product) => {
    
   
    const url = "/productDetails/" + product.id;
    window.open(url, '_self')?.focus();
    
  };
  return (
    <div className="container body-container">
      {productObj ? (
        <div className="row">
          <div className="col-12">
            <div className="breadcrumbs breadcrumbs-details">
              <div className="bread-inner">
                <ul className="bread-list">
                  <li>
                    <Link to={"/"}>
                      Home<i className="fa-solid fa-arrow-right"></i>
                    </Link>
                  </li>
                  <li className="active">
                    <Link to={"/products"}>
                      Products <i className="fa-solid fa-arrow-right"></i>
                    </Link>
                  </li>
                  <li className="active">
                    <Link className="text-break">{productObj.productName.length < 20 ? productObj.productName : productObj.productName.slice(0, 21) + " ......"}</Link>
                  </li>
                </ul>
              </div>

            </div>
          </div>
          <div className="col-xl-4 col-lg-5  col-md-6 col-12 my-2">
            <div className="card product-card">
              <div className="d-flex justify-content-end align-items-end">
                {/* <FacebookShareButton
                  url={shareUrl}
                  quote={"Check out this product:"}
                  hashtag="#shopbyeth"
                >
                  <FacebookIcon size={40} round={true} />
                </FacebookShareButton>
                <WhatsappShareButton
                  url={shareUrl}
                  title={"Check out this product on Shop by eth"}

                >
                  <WhatsappIcon size={40} round={true} />
                </WhatsappShareButton>
                <EmailShareButton
                  url={shareUrl}
                  subject={"Shop By Eth"}
                  body="Checkout this product:"
                >
                  <EmailIcon size={40} round={true} />
                </EmailShareButton>
                <TwitterShareButton
                  url={shareUrl}
                  title={"Check out this product on Shop by eth"}
                  hashtags={["shopbyeth"]}
                >
                  <TwitterIcon size={40} round={true} />
                </TwitterShareButton> */}
                <div class="dropdown">
                  <div class="dropbtn"><TiArrowForwardOutline /></div>
                  <div class="dropdown-content">

                    <FacebookShareButton
                      url={shareUrl}
                      quote={"Check out this product:"}
                      hashtag="#shopbyeth"
                      className="share-button"
                    >
                      <FacebookIcon size={40} round={true} className="pl-5" />
                    </FacebookShareButton>


                    <WhatsappShareButton
                      url={shareUrl}
                      title={"Check out this product on Shop by eth"}
                      className="share-button"
                    >
                      <WhatsappIcon size={40} round={true} />
                    </WhatsappShareButton>


                    <TwitterShareButton
                      url={shareUrl}
                      title={"Check out this product on Shop by eth"}
                      hashtags={["shopbyeth"]}
                      className="share-button"
                    >
                      <TwitterIcon size={40} round={true} />
                    </TwitterShareButton>

                  </div>
                </div>
                {connected ? (
                  !productObj.isWishlisted ? (
                    <Link className={`${wishListDelay && "delay-wishlist"}`}>
                      <i
                        className="fa-regular fa-heart productdetailsicon m-4 mb-2"
                        onClick={(e) => addToWishlist(e,productObj)}
                      ></i>
                    </Link>
                  ) : (
                    <Link className={`${wishListDelay && "delay-wishlist"}`}>
                      <i
                        className="fa-solid fa-heart productdetailsicon m-4 mb-2"
                        onClick={(e) => removeFromWishlist(e,productObj)}
                      ></i>
                    </Link>
                  )
                ) : (
                  ""
                )}
              </div>
              {images ? (
                // <Galleria value={images} responsiveOptions={responsiveOptions2} numVisible={4} thumbnailsPosition="left"
                //   item={itemTemplate} thumbnail={thumbnailTemplate} style={{ maxWidth: '640px',maxHeight:'500px' }} />

                <ReactImageGallery
                  ref={imageGalleryRef}
                  onMouseOver={e => imageMouseOver(e)}
                  onMouseLeave={e => imageMouseLeave(e)}
                  items={images}
                  showPlayButton={false}
                  showFullscreenButton={false}
                  showNav={false}
                  slideOnThumbnailOver={true}
                  thumbnailPosition="left"
                >
                  {" "}
                </ReactImageGallery>
              ) : (
                ""
              )}
            </div>
          </div>
          <div className="col-xl-8 col-lg-7 col-md-6 col-12 my-2">
            <div className="row">
              <div className="details-contents">
                <div className="result-container">

                  <div id="myresult" className="img-zoom-result"></div>
                </div>
                <div className="detail-remain-contents row">

                  <Border className="pb-3">
                    <div className="col-12 pb-1">
                      <h3 className="text-break product-detail-spacing">{productObj.productName}</h3>
                    </div>
                    <div className="col-12 pb-4" style={{ display: "flex" }}>
                      <Rating
                        value={productObj.averageRating}
                        readOnly
                        stars={5}
                        cancel={false}
                      />
                      <span className="ms-4">{productObj.ratingCount} ratings</span>
                    </div>
                    {productObj.description.length < 200 ? (
                      <div className="">
                        {productObj.description.split("\n").map((str, i) => (
                          <span className="text-break" key={i}>
                            {str}
                            <br />
                          </span>
                        ))}
                      </div>
                    ) : viewMore ? (
                      <>
                        <div className="text-break">
                          {(productObj.description.slice(0, 200)).split("\n").map((str, i) => (
                            <span key={i}>

                              {str}
                              <br />
                            </span>
                          ))}
                        </div>

                        <span className="fw-bolder view-button" onClick={(e) => setView(e, 0)}>View more</span>

                      </>
                    ) : (
                      <>
                        <div className="text-break">
                          {(productObj.description).split("\n").map((str, i) => (
                            <span key={i}>

                              {str}
                              <br />
                            </span>
                          ))}
                        </div>

                        <span className="fw-bolder view-button" onClick={(e) => setView(e, 1)}>View less</span>
                      </>
                    )}
                  </Border>
                  <Border className="py-2">
                    {productObj.availableStock <= 0 ? (
                      <div className="col-12 py-2 pb-4 stockalert">
                        {" "}
                        <h4 className="" style={{ fontWeight: "bold" }}>
                          Out of Stock{" "}
                        </h4>
                      </div>
                    ) : (
                      ""
                    )}
                    {productObj.deleted && (
                      <div className="col-12 py-2 pb-4 stockalert">
                        {" "}
                        <h4 className="" style={{ fontWeight: "bold" }}>
                          Unavailable{" "}
                        </h4>
                      </div>
                    )}
                    <div className="col-12 pb-4 d-flex">
                      <h5 className="me-3" style={{ fontWeight: "bold" }}>
                        ${numToFixed(productObj.price)}
                      </h5>

                      {productObj.price !== productObj.originalPrice && (
                        <span>
                          <s>${numToFixed(productObj.originalPrice)}</s>
                        </span>
                      )}
                      {offer !== 0 && (
                        <span className="ms-4 success">{offer === 100 ? '99' : offer}% off</span>
                      )}
                      <></>
                      {productObj.availableStock <= 10 &&
                        productObj.availableStock > 0 ? (
                        <span className="stockalert ms-2">
                          Hurry, Only {productObj.availableStock} left !
                        </span>
                      ) : (
                        ""
                      )}
                    </div>
                  </Border>
                  <Border className="py-4">
                    <div className="buttons">
                      <div className="row">
                        <div className="col-9"></div>
                        <div className=" col-lg-6 col-12">
                          {!productObj.isInCart ? (
                            <button
                              type="button"
                              className="btn container-fluid"
                              onClick={addToCart}
                              disabled={productObj.availableStock === 0 || productObj.deleted}
                            >
                              ADD TO CART
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn container-fluid"
                              onClick={goToCart}
                              disabled={productObj.availableStock === 0 || productObj.deleted}
                            >
                              Go TO CART
                            </button>
                          )}
                        </div>
                        <div className=" col-lg-6 col-12">
                          <button
                            type="button"
                            className="btn container-fluid "
                            onClick={buyNow}
                            disabled={productObj.availableStock === 0}
                          >
                            BUY NOW
                          </button>
                        </div>
                      </div>
                    </div>
                  </Border>
                </div>
              </div>
            </div>

          </div>

          <div className="container-fluid shadow mb-4">
            <ul className="list-group list-group-flush">
              <li className="list-group-item py-4">
                <h3 style={{ textAlign: "start" }} className="py-2 pb-4 mt-4">
                  Product Description
                </h3>
              </li>
              {productObj.specifications ? (
                Object.keys(productObj.specifications)?.map((key, i) => {
                  return (
                    <li className="list-group-item py-4 d-flex " key={i}>
                      <span className="col-6 fw-bold product-spec">{key}</span>
                      <span className="col-6 product-spec">
                        {productObj.specifications[key]}
                      </span>
                    </li>
                  );
                })
              ) : (
                <li className="list-group-item py-4">
                  <div>No description</div>
                </li>
              )}
            </ul>
          </div>
          {similarProducts.length>0 && <div className="container-fluid shadow mb-4">
            <div className="slider m-4">
              <h2 className="pt-5 ps-3"> Similar products</h2>
              {similarProducts.length>6?<Slider {...similarSettings}>
                {
                  similarProducts.map((result, index) => {
                    console.log("11111111",similarProducts);
                    return (
                      <div key={index} className="col-xl-6 col-lg-6 col-md col-12 p-1">
                        <div className="single-product">
                          <div className="product-img">
                            <a onClick={() => productClick(result)}>
                              <img
                                className={
                                  result.availableStock === 0
                                    ? "outofstockimg"
                                    : "default-img"
                                }
                                src={
                                  aws_url + result.id + "/" + result.coverImage
                                }
                                alt="#"
                              />
                              <img
                                className={`hover-img ${result.availableStock === 0
                                    ? "outofstockimg"
                                    : ""
                                  }`}
                                src={
                                  aws_url + result.id + "/" + result.coverImage
                                }
                                alt="#"
                              />
                              {result.availableStock === 0 ? (
                                <div className="centered">Out of Stock</div>
                              ) : (
                                ""
                              )}
                            </a>

                            <div className="button-head">
                              <div className="product-action">
                                {(() => {
                                  if (
                                    result.isWishlisted === false
                                  ) {
                                    return (
                                      <a title="Wishlist">
                                        <i
                                          className=" fa-regular fa-heart "
                                          onClick={() =>
                                            addToWishlist(result)
                                          }
                                        ></i>
                                        <span>Add to Wishlist</span>
                                      </a>
                                    );
                                  } else if (
                                    result.isWishlisted === true
                                  ) {
                                    return (
                                      <a title="Wishlist">
                                        <i
                                          className=" fa fa-heart "
                                          onClick={() =>
                                            removeFromWishlist(
                                              result
                                            )
                                          }
                                        ></i>
                                        <span>
                                          Remove from Wishlist
                                        </span>
                                      </a>
                                    );
                                  }
                                })()}
                              </div>

                              {result.availableStock > 0 && (() => {
                                console.log(
                                  "html",
                                  result.isInCart
                                );
                                if (
                                  result.isInCart == false ||
                                  result.isInCart == undefined
                                ) {
                                  return (
                                    <div className="product-action-2">
                                      <a
                                        title="Add to cart"
                                        onClick={() =>
                                          addToCart(result)
                                        }
                                      >
                                        Add to cart
                                      </a>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="product-action-2">
                                      <a
                                        title="go to cart"
                                        onClick={() =>
                                          goToCart(result)
                                        }
                                      >
                                        go to cart
                                      </a>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                          <div className="product-content">
                            <h3 className="product-name">
                              <Link
                               onClick={() => productClick(result)}
                              >
                                {result.productName}
                              </Link>
                            </h3>
                            <div className="product-price">
                              <span className="fw-bold fs-5">
                                ${numToFixed(result.price)}
                              </span>
                              {result.originalPrice !== result.price && <span className="ps-3 fs-7"><s>${numToFixed(result.originalPrice)}</s></span>}
                              {Math.round(((result.originalPrice - result.price) / result.originalPrice) * 100) > 0 && <span className="success ps-3 fs-8">{Math.round(((result.originalPrice - result.price) / result.originalPrice) * 100) === 100 ? 99 : Math.round(((result.originalPrice - result.price) / result.originalPrice) * 100)}% off</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </Slider>:
              
              <div className="row">
              {similarProducts.map((result, index) => {
                console.log("000000",similarProducts);
                return (
                  <div key={index} className="col-lg-2 col-md-4 col-6">
                    <div className="single-product">
                      <div className="product-img">
                        <a onClick={() => productClick(result)}>
                        <img
                className={
                  result.availableStock === 0
                    ? "outofstockimg"
                    : "default-img"
                }
                src={
                  aws_url + result.id + "/" + result.coverImage
                }
                alt="#"
              />
              <img
                className={`hover-img ${
                  result.availableStock === 0
                    ? "outofstockimg"
                    : ""
                }`}
                src={
                  aws_url + result.id + "/" + result.coverImage
                }
                alt="#"
              />
              {result.availableStock === 0 ? (
                <div className="centered">Out of Stock</div>
              ) : (
                ""
              )}
                        </a>

                        <div className="button-head">
                          <div className="product-action">
                            {(() => {
                              if (
                                result.isWishlisted === false
                              ) {
                                return (
                                  <a title="Wishlist">
                                    <i
                                      className=" fa-regular fa-heart "
                                      onClick={() =>
                                        addToWishlist(result.id)
                                      }
                                    ></i>
                                    <span>Add to Wishlist</span>
                                  </a>
                                );
                              } else if (
                                result.isWishlisted === true
                              ) {
                                return (
                                  <a title="Wishlist">
                                    <i
                                      className=" fa fa-heart "
                                      onClick={() =>
                                        removeFromWishlist(
                                          result.id
                                        )
                                      }
                                    ></i>
                                    <span>
                                      Remove from Wishlist
                                    </span>
                                  </a>
                                );
                              }
                            })()}
                          </div>

                          {result.availableStock>0 &&(() => {
                            console.log(
                              "html",
                              result.isInCart
                            );
                            if (
                              result.isInCart == false ||
                              result.isInCart == undefined
                            ) {
                              return (
                                <div className="product-action-2">
                                  <a
                                    title="Add to cart"
                                    onClick={() =>
                                      addToCart(result)
                                    }
                                  >
                                    Add to cart
                                  </a>
                                </div>
                              );
                            } else {
                              return (
                                <div className="product-action-2">
                                  <a
                                    title="go to cart"
                                    onClick={() =>
                                      goToCart(result)
                                    }
                                  >
                                    go to cart
                                  </a>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                      <div className="product-content">
                        <h3 className="product-name">
                          <Link
                            onClick={() => productClick(result)}
                          >
                            {result.productName}
                          </Link>
                        </h3>
                        <div className="product-price">
                          <span className="fw-bold fs-5">
                            ${numToFixed(result.price)}
                          </span>
                           {result.originalPrice !== result.price &&<span className="ps-3 fs-7"><s>${numToFixed(result.originalPrice)}</s></span>}
                           {Math.round(((result.originalPrice-result.price)/result.originalPrice)*100) >0 &&<span className="success ps-3 fs-8">{Math.round(((result.originalPrice-result.price)/result.originalPrice)*100)}% off</span>}
                            </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>}
            </div>
          </div>}
          <div className="container-fluid shadow mb-4 review">
            <ul className="list-group list-group-flush">
              <li className="list-group-item py-4">
                <div className="d-flex justify-content-between">
                  <span>
                    <h3 className="py-2 pb-4">Customer Reviews</h3>
                  </span>
                  <span>
                    {appContext.isLoggedIn() &&
                      appContext.getStatus() === 1 &&
                      productObj?.hasBought &&
                      !productObj?.hasRated && (
                        <button className="btn" onClick={rateProduct}>
                          Rate Product
                        </button>
                      )}

                    {appContext.isLoggedIn() &&
                      appContext.getStatus() === 1 &&
                      productObj?.hasBought &&
                      productObj?.hasRated && (
                        <button className="btn" onClick={rateProduct}>
                          Edit Review
                        </button>
                      )}
                  </span>
                </div>
              </li>
              {productObj.feedback.length > 0 && (
                <li className="list-group-item py-4">
                  <div className="row d-flex align-items-center">
                    <div className="col-lg-1 col-md-2 col-6">
                      <div className="ratings">
                        <span className="rating-count pb-3">
                          {productObj.averageRating.toFixed(1)}
                        </span>
                        <span className="caption">
                          {productObj.feedback.length} Ratings
                        </span>
                      </div>
                    </div>
                    <div className="col-lg-2 col-md-4 col-6">
                      <span className="rating-list">
                        <span className="me-1 d-flex align-items-center">
                          5 <IoMdStar />
                        </span>
                        <ProgressBar
                          className="my-1 rating-progress"
                          variant="success"
                          now={(productObj.fiveStar / maxRating) * 100}
                        />{" "}
                        <span className="ms-1 caption">
                          {productObj.fiveStar}
                        </span>
                      </span>
                      <span className="rating-list">
                        <span className="me-1 d-flex align-items-center">
                          4 <IoMdStar />
                        </span>
                        <ProgressBar
                          className="my-1 rating-progress"
                          variant="success"
                          now={(productObj.fourStar / maxRating) * 100}
                        />{" "}
                        <span className="ms-1 caption">
                          {productObj.fourStar}
                        </span>
                      </span>
                      <span className="rating-list">
                        <span className="me-1 d-flex align-items-center">
                          3 <IoMdStar />
                        </span>
                        <ProgressBar
                          className="my-1 rating-progress"
                          variant="success"
                          now={(productObj.threeStar / maxRating) * 100}
                        />{" "}
                        <span className="ms-1 caption">
                          {productObj.threeStar}
                        </span>
                      </span>
                      <span className="rating-list">
                        <span className="me-1 d-flex align-items-center">
                          2 <IoMdStar />
                        </span>
                        <ProgressBar
                          className="my-1 rating-progress"
                          variant="danger"
                          now={(productObj.twoStar / maxRating) * 100}
                        />{" "}
                        <span className="ms-1 caption">
                          {productObj.twoStar}
                        </span>
                      </span>
                      <span className="rating-list">
                        <span className="me-1 d-flex align-items-center">
                          1 <IoMdStar />
                        </span>
                        <ProgressBar
                          className="my-1 rating-progress"
                          variant="danger"
                          now={(productObj.oneStar / maxRating) * 100}
                        />{" "}
                        <span className="ms-1 caption">
                          {productObj.oneStar}
                        </span>
                      </span>
                    </div>
                    <div className="col-lg-9 col-md-6 col-12 d-flex justify-content-center py-2">
                      {productObj.feedback.length > 0 && (
                        <button
                          className="btn"
                          onClick={(e) => seeAllReviews(e, productObj)}
                        >
                          See all Reviews
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              )}
              {productObj?.feedback?.length > 0 ? (
                productObj.feedback.slice(0,3).map((obj, i) => {
                  return (
                    <li className="list-group-item py-4" key={i}>
                      <div>
                        <div className="d-flex justify-content-between pb-1 ">
                          <span className=" mt-1 fw-bold">
                            {obj.reviewTitle}
                          </span>
                          <span>
                            {userId === obj.userId && (
                              <button
                                className="review-delete-button"
                                onClick={(e) => deleteReview(e, obj._id)}
                              >
                                {" "}
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            )}
                          </span>
                        </div>

                        <div className="pb-1">
                          <Rating
                            value={obj.rating}
                            readOnly
                            stars={5}
                            cancel={false}
                          />
                        </div>
                        {/* <div className="rating-desc">{obj.review.split("\n").map((res, i) => {
                          return (
                            <>
                              {res}
                              <br />
                            </>
                          )
                        })}</div> */}
                        {obj.review?.length<70&&<div className="rating-desc ">{obj.review?.split("\n").map((res, i) => {
                          return (
                            <span key={i}>
                              {res}
                              <br />
                            </span>
                          )
                        })}</div>}
                        {(obj.review?.length>70&&feedbackViewMore[i])&&<div className="rating-desc ">{obj.review?.split("\n").map((res, i) => {
                          return (
                            <span key={i}>
                              {res}
                              <br />
                            </span>
                          )
                        })}
                        <span className="fw-bolder view-button " onClick={e=>setMore(e,i,false)}>View less</span>
                        </div>}
                        {(obj.review?.length>70&&!feedbackViewMore[i])&&<div className="rating-desc ">{obj.review?.slice(0,70).split("\n").map((res, i) => {
                          return (
                            <span  key={i}>
                              {res}
                              <br />
                            </span>
                          )
                        })}
                          <span className="fw-bolder view-button" onClick={e=>setMore(e,i,true)}>View more</span>
                        </div>}
                        <div className="rating-image-list d-flex">
                        {obj?.feedbackImages?.map((res,index)=>{
                          return(<div className="image-feedback-view p-2" key={index} onClick={e=>openRatingImage(e,obj,obj.username)}>
                            <img src={aws_feedback_url+obj._id+"/"+res} height="62" width="62" alt="" />
                          </div>)
                        })}
                      </div>
                        <div className="reviewdate pb-2 d-flex">
                          <i className="fa-solid fa-circle-user reviewuser pe-2"></i>
                          <span className="pe-2">{obj.username}</span>
                          {moment(obj.date).format("D MMMM YYYY")}
                        </div>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="list-group-item py-4">
                  <div>No Ratings Yet. Be the first to Review this product</div>
                </li>
              )}
            </ul>
          </div>

          <div className="container-fluid shadow  mb-4">
            <ul className="list-group list-group-flush py-4">
              <li className="list-group-item py-4">
                <h3 className="py-2 pb-4" style={{ textAlign: "start" }}>
                  Delivery Info
                </h3>
              </li>
              <li className="list-group-item  ">
                <div className="row ">
                  <div className="col-12 py-2">
                    We deliver products worldwide.
                  </div>
                  <div className="col-12 py-2">
                    Deliveries are open to all locations ( Both inside and
                    Outside India ).
                  </div>
                  <div className="col-12 py-2">
                    We are working to ensure that all orders reach you in
                    minimal time. Average delivery time for Orders within India
                    is 1 to 7 days.
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        ""
      )}
      <ReviewDetailModal
      show={showRatingImage}
      feedback={feedbackSelected}
      close = {ratingImageClose}
      username={userSelected}
      />
      <RatingModal
        feedback={productObj?.feedback}
        show={ratingShow}
        isRated={hasRated}
        close={ratingClose}
        id={productId}
      />
    </div>
  );
};

export default ProductDetails;
