import React, { useEffect, useState } from "react";
import useAppContext from "../AppContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Slider from "react-slick";
import Carousel from "react-multi-carousel";

function Home() {
  const appContext = useAppContext();
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const path = process.env.REACT_APP_API_ENDPOINT;
  const connected = localStorage.getItem("connected");
  const loginStatus = +localStorage.getItem("status");
  const aws_url = process.env.REACT_APP_AWS_ENDPOINT;
  const [productList, setProductList] = useState([]);
  const navigate = useNavigate();
  const localStorageCartList = JSON.parse(localStorage.getItem("cartList"));
  const [trending, setTrending] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [topViewed, setTopViewed] = useState([]);
  const [onSale, setOnSale] = useState([]);
  const [gender, setGender] = useState(0);
  const [images,setImages] = useState([])
  const [homeImages,setHomeImages] = useState([])
  var settings = {
    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 2,
    autoplay: true,
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
  var settingsBanner = {
    arrows:false,
    infinite: true,
    dots:true,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    speed: 2000,
    autoplaySpeed:7000,
    // fade:true,
    
    
    responsive: [
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
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
  useEffect(() => {
    getTrendingMen();
    getBestSellers();
    getOnSale();
    getTopViewed();
    console.log("login status", loginStatus);
    console.log("connected", connected);
    getImages()
  }, [loginStatus]);

  const getTrendingMen = async () => {
    setGender(0);
    if (loginStatus === 1) {
      await appContext
        .getAxios()
        .get(path + "users/products", {
          params: { gender: 1, size: 8, views: -1, outOfStock: 0 },
        })
        .then((res) => {
          console.log("logged trend", res.data.docs);
          setTrending(res.data.docs);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      await appContext
        .getAxios()
        .get(path + "public/products", {
          params: { gender: 1, size: 8, views: -1, outOfStock: 0 },
        })
        .then((res) => {
          console.log("not logged trend", res.data.docs);
          setTrending(res.data.docs);
          let resp = res.data.docs;
          if (localStorageCartList) {
            for (let cartObj of localStorageCartList) {
              let data = resp
                .filter((obj) => obj.id === cartObj.id)
                .map((el) => {
                  console.log("ff", el);
                  el.isInCart = true;
                  return el;
                });
            }
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const addToWishlist = async (id) => {
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
        var tempProductarray = [...trending];
        let obj = tempProductarray.find((a) => a.id === id);
        obj.isWishlisted = true;
        setTrending(tempProductarray);
        appContext.setcount(appContext.wishListCount() + 1);
        //setTrending(res.data.docs)
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const addToWishlistBest = async (id) => {
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
        var tempProductarray = [...bestSelling];
        let obj = tempProductarray.find((a) => a.id === id);
        obj.isWishlisted = true;
        setBestSelling(tempProductarray);
        appContext.setcount(appContext.wishListCount() + 1);

        //setTrending(res.data.docs)
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const addToWishlistTop = async (id) => {
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
        var tempProductarray = [...topViewed];
        let obj = tempProductarray.find((a) => a.id === id);
        obj.isWishlisted = true;
        setTopViewed(tempProductarray);
        appContext.setcount(appContext.wishListCount() + 1);

        //setTrending(res.data.docs)
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const removeFromWishlist = async (id) => {
    await appContext
      .getAxios()
      .delete(path + `users/wishlist/${id}`)
      .then((res) => {
        console.log("hoii", id);
        console.log(res);
        toast.success("Item removed from wishlist !");
        var tempProductarray = [...trending];
        let obj = tempProductarray.find((a) => a.id === id);
        obj.isWishlisted = false;
        setTrending(tempProductarray);
        appContext.setcount(appContext.wishListCount() - 1);

        //setTrending(res.data.docs)
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const removeFromWishlistBest = async (id) => {
    await appContext
      .getAxios()
      .delete(path + `users/wishlist/${id}`)
      .then((res) => {
        console.log("hoii", id);
        console.log(res);
        toast.success("Item removed from wishlist !");
        var tempProductarray = [...bestSelling];
        let obj = tempProductarray.find((a) => a.id === id);
        obj.isWishlisted = false;
        setBestSelling(tempProductarray);
        appContext.setcount(appContext.wishListCount() - 1);

        //setTrending(res.data.docs)
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const removeFromWishlistTop = async (id) => {
    setGender(0);
    await appContext
      .getAxios()
      .delete(path + `users/wishlist/${id}`)
      .then((res) => {
        console.log("hoii", id);
        console.log(res);
        toast.success("Item removed from wishlist !");
        var tempProductarray = [...topViewed];
        let obj = tempProductarray.find((a) => a.id === id);
        obj.isWishlisted = false;
        setTopViewed(tempProductarray);
        appContext.setcount(appContext.wishListCount() - 1);

        //setTrending(res.data.docs)
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const getTrendingWomen = async () => {
    setGender(1);
    if (loginStatus === 1) {
      await appContext
        .getAxios()
        .get(path + "users/products", {
          params: { gender: 2, size: 8, views: -1, outOfStock: 0 },
        })
        .then((res) => {
          console.log("logged trend", res.data.docs);
          setTrending(res.data.docs);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      await appContext
        .getAxios()
        .get(path + "public/products", {
          params: { gender: 2, size: 8, views: -1, outOfStock: 0 },
        })
        .then((res) => {
          console.log("not logged trend", res.data.docs);
          setTrending(res.data.docs);
          let resp = res.data.docs;
          if (localStorageCartList) {
            for (let cartObj of localStorageCartList) {
              let data = resp
                .filter((obj) => obj.id === cartObj.id)
                .map((el) => {
                  console.log("ff", el);
                  el.isInCart = true;
                  return el;
                });
            }
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
 const getTrendingKids =async () =>{
  setGender(2)
  if (loginStatus === 1) {
    await appContext
      .getAxios()
      .get(path + "users/products", {
        params: { gender: 5, size: 8, views: -1, outOfStock: 0 },
      })
      .then((res) => {
        console.log("logged trend", res.data.docs);
        setTrending(res.data.docs);
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    await appContext
      .getAxios()
      .get(path + "public/products", {
        params: { gender: 5, size: 8, views: -1, outOfStock: 0 },
      })
      .then((res) => {
        console.log("not logged trend", res.data.docs);
        setTrending(res.data.docs);
        let resp = res.data.docs;
        if (localStorageCartList) {
          for (let cartObj of localStorageCartList) {
            let data = resp
              .filter((obj) => obj.id === cartObj.id)
              .map((el) => {
                console.log("ff", el);
                el.isInCart = true;
                return el;
              });
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
 }
 const getImages = async() =>{
    await appContext.getAxios().get(path+"public/homeImage").then((res)=>{
      console.log("images",res.data[0]);
      setImages(res.data[0])
      setHomeImages(res.data[0].homeImages)
      // setHomeImages(["https://www.swisstimehouse.com/img/cms/dec%2022/desktop%20banner%20womens%202500x1250-min.jpg","https://cdn.shopify.com/s/files/1/0046/3454/2129/collections/Michael_Kors_1920_x_667_px.jpg?v=1607083751","https://cdn.shopify.com/s/files/1/0046/3454/2129/files/Home_Page_Banner_desktop_G-Shock.jpg?v=1613552677","https://cdn.shopify.com/s/files/1/0046/3454/2129/files/Aspen_1920_x_667_px.jpg?v=1642580133","https://www.swisstimehouse.com/img/cms/rolex/desktop-banner-2880x1080-min(1).webp"])
    })
 }
  const getBestSellers = async () => {
    if (loginStatus === 1) {
      await appContext
        .getAxios()
        .get(path + "users/products", { params: { size: 10, sales: -1, outOfStock: 0 } })
        .then((res) => {
          console.log("bestsellers", res.data.docs);
          setBestSelling(res.data.docs);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      await appContext
        .getAxios()
        .get(path + "public/products", { params: { size: 10, sales: -1, outOfStock: 0 } })
        .then((res) => {
          console.log("bestsellers", res.data.docs);
          setBestSelling(res.data.docs);
          let resp = res.data.docs;
          if (localStorageCartList) {
            for (let cartObj of localStorageCartList) {
              let data = resp
                .filter((obj) => obj.id === cartObj.id)
                .map((el) => {
                  console.log("ff", el);
                  el.isInCart = true;
                  return el;
                });
            }
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
  const getOnSale = async () => {
    if (loginStatus === 1) {
      await appContext
        .getAxios()
        .get(path + "users/products", {
          params: { size: 3, views: -1, sales: -1, outOfStock: 0 },
        })
        .then((res) => {
          console.log("onsale", res.data.docs);
          setOnSale(res.data.docs);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      await appContext
        .getAxios()
        .get(path + "public/products", {
          params: { size: 3, views: -1, sales: -1, outOfStock: 0 },
        })
        .then((res) => {
          console.log("onsale", res.data.docs);
          setOnSale(res.data.docs);
          let resp = res.data.docs;
          if (localStorageCartList) {
            for (let cartObj of localStorageCartList) {
              let data = resp
                .filter((obj) => obj.id === cartObj.id)
                .map((el) => {
                  //console.log("ff", el);
                  el.isInCart = true;
                  return el;
                });
            }
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
  const getTopViewed = async () => {
    if (loginStatus === 1) {
      await appContext
        .getAxios()
        .get(path + "users/products", { params: { size: 10, views: -1, outOfStock: 0 } })
        .then((res) => {
          console.log("topview", res.data.docs);
          setTopViewed(res.data.docs);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      await appContext
        .getAxios()
        .get(path + "public/products", { params: { size: 10, views: -1, outOfStock: 0 } })
        .then((res) => {
          console.log("topview", res.data.docs);
          setTopViewed(res.data.docs);
          let resp = res.data.docs;
          if (localStorageCartList) {
            for (let cartObj of localStorageCartList) {
              let data = resp
                .filter((obj) => obj.id === cartObj.id)
                .map((el) => {
                  console.log("ff", el);
                  el.isInCart = true;
                  return el;
                });
            }
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const addToCart = async (product) => {
    console.log("addd to cart");
    try {
      if (loginStatus === 1) {
        let path = base_url + "users/me/addToCart";
        let body = {
          products: [
            {
              productId: product.id,
              productQuantity: 1,
            },
          ],
        };
        await appContext
          .getAxios()
          .post(path, body)
          .then((response) => {
            console.log(response);
            var tempProductarray = [...trending];
            let obj = tempProductarray.find((a) => a.id === product.id);
            obj.isInCart = true;
            setTrending(tempProductarray);
            appContext.setcount(+localStorage.getItem("cartCount") + 1);
            toast.success("Item added to cart !");
          });
      } else {
        var tempProductarray = [...trending];
        console.log("temp arr", tempProductarray);
        let obj = tempProductarray.find((a) => a.id === product.id);
        console.log(product);
        obj.isInCart = true;
        setTrending(tempProductarray);
        console.log("trending", trending);
        let cartCount = +localStorage.getItem("cartCount");
        console.log("cart count", cartCount);
        let array = [];
        if (localStorageCartList) array = localStorageCartList;
        product._id = product.id;
        array.push(product);
        //product.wished = true;

        cartCount = cartCount + 1;
        console.log(array);
        console.log("cartcount", cartCount);
        appContext.setCartCount(cartCount);
        localStorage.setItem("cartList", JSON.stringify(array));
        toast.success("Item added to cart !");
      }
    } catch (error) {
      console.error(error);
    }
  };
  const addToCartBest = async (product) => {
    console.log("addd to cart");
    try {
      if (loginStatus === 1) {
        let path = base_url + "users/me/addToCart";
        let body = {
          products: [
            {
              productId: product.id,
              productQuantity: 1,
            },
          ],
        };
        await appContext
          .getAxios()
          .post(path, body)
          .then((response) => {
            console.log(response);
            var tempProductarray = [...bestSelling];
            let obj = tempProductarray.find((a) => a.id === product.id);
            obj.isInCart = true;
            setBestSelling(tempProductarray);
            appContext.setcount(+localStorage.getItem("cartCount") + 1);
            toast.success("Item added to cart !");
          });
      } else {
        var tempProductarray = [...bestSelling];
        console.log("temp arr", tempProductarray);
        let obj = tempProductarray.find((a) => a.id === product.id);
        console.log(product);
        product._id = product.id;
        obj.isInCart = true;
        setBestSelling(tempProductarray);
        console.log("trending", trending);
        let cartCount = +localStorage.getItem("cartCount");
        console.log("cart count", cartCount);
        let array = [];
        if (localStorageCartList) array = localStorageCartList;
        array.push(product);
        //product.wished = true;

        cartCount = cartCount + 1;
        console.log("cartcount", cartCount);
        appContext.setCartCount(cartCount);
        localStorage.setItem("cartList", JSON.stringify(array));
        toast.success("Item added to cart !");
      }
    } catch (error) {
      console.error(error);
    }
  };
  const addToCartTop = async (product) => {
    console.log("addd to cart");
    try {
      if (loginStatus === 1) {
        let path = base_url + "users/me/addToCart";
        let body = {
          products: [
            {
              productId: product.id,
              productQuantity: 1,
            },
          ],
        };
        await appContext
          .getAxios()
          .post(path, body)
          .then((response) => {
            console.log(response);
            var tempProductarray = [...topViewed];
            let obj = tempProductarray.find((a) => a.id === product.id);
            obj.isInCart = true;
            setTopViewed(tempProductarray);
            appContext.setcount(+localStorage.getItem("cartCount") + 1);
            toast.success("Item added to cart !");
          });
      } else {
        var tempProductarray = [...topViewed];
        product._id = product.id;
        console.log("temp arr", tempProductarray);
        let obj = tempProductarray.find((a) => a.id === product.id);
        console.log(product);
        obj.isInCart = true;
        setTopViewed(tempProductarray);
        console.log("trending", trending);
        let cartCount = +localStorage.getItem("cartCount");
        console.log("cart count", cartCount);
        let array = [];
        if (localStorageCartList) array = localStorageCartList;
        array.push(product);
        //product.wished = true;

        cartCount = cartCount + 1;
        console.log("cartcount", cartCount);
        appContext.setCartCount(cartCount);
        localStorage.setItem("cartList", JSON.stringify(array));
        toast.success("Item added to cart !");
      }
    } catch (error) {
      console.error(error);
    }
  };
  const goToCart = (id) => {
    navigate("/cart");
  };
  const productClick = (product) => {
    localStorage.setItem("productId", product.id);
    navigate("/productDetails/" + product.id);
  };
  const gotoMen = () => {
    //localStorage.setItem("productId",product.id)
    navigate("/products", { state: { fromHome: 1, gender: 1 } });
  };
  const gotoWomen = () => {
    navigate("/products", { state: { fromHome: 1, gender: 2 } });
  };
  const gotoProducts = async (e, key, value) => {
    try {

      e.preventDefault()
      if (key === "gender") {
        let body = [{
          "value": "",
          "name": value
        }]
        if (value === "female") {
          body[0].value = 2
        } else if(value==="male") {
          body[0].value = 1
        }
        else if(value==="boy") {
          body[0].value = 3
        }
        else if(value==="girl") {
          body[0].value = 4
        }
        appContext.resetSetProducts(key, body)
        appContext.setSearchKeyword("")
        navigate("/products");
        return

      }
      else if(key === "category"){
        let body = value
      console.log("body",body);
        appContext.resetSetProducts(key, body)
        appContext.setSearchKeyword("")
        navigate("/products");
      }
      else{

      appContext.resetSetProducts("sort", +value)
      appContext.setSearchKeyword("")
      navigate("/products");
      }
    } catch (error) {

    }
  };
  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 4,
      // optional, default to 1.
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2,
      //slidesToSlide: 2 // optional, default to 1.
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
      // slidesToSlide: 1 // optional, default to 1.
    },
  };
  const goProducts =()=>{
    appContext.resetSetProducts("keyword","")
    navigate("/products"); 
  }
  return (
    <div className="body-container">
      
      <section className="">
        <div className="">
      <Slider {...settingsBanner}>
        {/* <img className="banner-image" src="https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885__480.jpg"></img>
        <img className="banner-image" src="https://rukminim1.flixcart.com/fk-p-flap/844/140/image/3f1e47bf88498450.jpg?q=50"></img> */}
      {
      homeImages.map((result,index)=>{
        return(
          <img src={"https://locals3-shopbyeth.innovaturelabs.com/shopbyeth/homeImages/"+images._id+"/"+result} className="banner-image cursor" onClick={goProducts}></img>
          // <img key={index} src={result} className="banner-image cursor" alt="" onClick={goProducts}/>
        )
      })
     }
      </Slider>
      </div>
      </section>
      <section className="container my-4">
        <div className="d-flex justify-content-center mt-5 row">
          
          <div className="col-lg-2 col-md-4 algn click-cursor text-center" onClick={e => gotoProducts(e, "gender", "male")}>
      
            <img className="cursor gender-home" src="https://lmsin.net/cdn-cgi/image/w=195,q=70,fit=cover/https://70415bb9924dca896de0-34a37044c62e41b40b39fcedad8af927.lmsin.net/LS-Fest/LS-new/LSUber-Men-Desk-Category-Banner2-14Oct22.jpg" style={{ borderRadius: "50%",height:"145px",width:"145px" }} ></img>
           
              <h5 className="pt-3">Men</h5>
           
          </div>
          <div className="col-lg-2 col-md-4 algn click-cursor text-center" onClick={e => gotoProducts(e, "gender", "female")}>
   
            <img  className="cursor gender-home" src="https://lmsin.net/cdn-cgi/image/w=195,q=70,fit=cover/https://70415bb9924dca896de0-34a37044c62e41b40b39fcedad8af927.lmsin.net/LS-Fest/LS-new/Women-Desk-Category-Banner3-14Oct22.jpg" style={{ borderRadius: "50%",height:"145px",width:"145px" }} ></img>
            <h5 className="pt-3">Women</h5>
  
          </div>
          <div className="col-lg-2 col-md-4 algn click-cursor text-center" onClick={e => gotoProducts(e, "gender", "boy")}>

            <img  className="cursor gender-home" src="https://lmsin.net/cdn-cgi/image/w=195,q=70,fit=cover/https://70415bb9924dca896de0-34a37044c62e41b40b39fcedad8af927.lmsin.net/LS-Fest/LS-new/LSUber-Kids-Desk-Category-Banner1-14Oct22.jpg" style={{ borderRadius: "50%",height:"145px",width:"145px"}} ></img>
            <h5 className="pt-3">Boy</h5>

          </div>
          <div className="col-lg-2 col-md-4 algn click-cursor text-center" onClick={e => gotoProducts(e, "gender", "girl")}>

            <img  className="cursor gender-home" src="https://lmsin.net/cdn-cgi/image/w=195,q=70,fit=cover/https://70415bb9924dca896de0-34a37044c62e41b40b39fcedad8af927.lmsin.net/LS-Fest/LS-new/LSUber-Kids-Desk-Category-Banner4-14Oct22.jpg" style={{ borderRadius: "50%",height:"145px",width:"145px" }} ></img>
            <h5 className="pt-3">Girl</h5>
   
          </div>
          
        </div>
      </section>
      {/* <section className="hero-slider">
        <div className="single-slider">
          <div className="container">
            <div className="row no-gutters">
              <div className="col-lg-9 offset-lg-3 col-12">
                <div className="text-inner">
                  <div className="row">
                    <div className="col-lg-7 col-12"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}
      {/* <section className="small-banner section">
        <div className="container">
          <div className="row">
            
            <div className="col-xl-5 col-lg-4 col-md-6 col-12">
              <div>
                <a onClick={e => gotoProducts(e, "gender", "female")} className="cursor">
                  <img
                    src="https://cdn.shopify.com/s/files/1/0046/3454/2129/files/Women1_jpg_765x.jpg?v=1649758267"
                    alt="#"
                  />
                </a>
              </div>
            </div>
            <div className="col-xl-2 col-lg-4 ">
              <div></div>
            </div>
            
            <div className="col-xl-5 col-lg-4 col-md-6 col-12">
              <div>
                <a onClick={e => gotoProducts(e, "gender", "male")} className="cursor">
                  {" "}
                  <img
                    src="https://cdn.shopify.com/s/files/1/0046/3454/2129/files/men1_jpg_765x.jpg?v=1649758283"
                    alt="#"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section> */}
      {/* End Small Banner */}

      {/* Start Product Area */}
      <section className="container">
      <div className="row">
            <div className="col-12">
              <div className="section-title mt-4">
                <h2>Top categories</h2>
              </div>
            </div>
          </div>
          <div className="row mb-3">
          {/* <div className="col-2" ></div> */}
          <div className="col-lg-2 col-md-4 mb-4 text-center">
            <img className="cursor" src="https://rukminim1.flixcart.com/fk-p-flap/128/128/image/7f7355480c6adc16.png?q=100" style={{ borderRadius: "50%",height:"85%" }} onClick={e => gotoProducts(e, "category", {name:'Fashion',value:'CAT1674462768089'})}></img>
            <div>
              <h5 className="pt-3">Fashion</h5>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 mb-4 text-center click-cursor" onClick={e => gotoProducts(e, "category", {name:'Electronics',value:'CAT1674462778453'})}>
            <img className="cursor" src="https://rukminim1.flixcart.com/fk-p-flap/128/128/image/361d53b8725c2d2d.png?q=100" style={{ borderRadius: "50%",height:"85%" }} ></img>
            <h5 className="pt-3">Electronics</h5>
          </div>
          <div  className="col-lg-2 col-md-4 mb-4 text-center click-cursor" onClick={e => gotoProducts(e, "category", {name:'Appliances',value:'CAT1674462821806'})}>
            <img className="cursor" src="https://rukminim1.flixcart.com/flap/128/128/image/0ff199d1bd27eb98.png?q=100" style={{ borderRadius: "50%",height:"85%" }} ></img>
            <h5 className="pt-3">Appliances</h5>
          </div>
          <div className="col-lg-2 col-md-4 mb-4 text-center click-cursor" onClick={e => gotoProducts(e, "category", {name:'Grocery',value:'CAT1674462840443'})}>
            <img className="cursor" src="https://rukminim1.flixcart.com/fk-p-flap/128/128/image/46376ceed3448aff.png?q=100" style={{ borderRadius: "50%",height:"85%" }} ></img>
            <h5 className="pt-3">Grocery</h5>
          </div>
          <div className="col-lg-2 col-md-4 mb-4 text-center click-cursor" onClick={e => gotoProducts(e, "category", {name:'Accessories',value:'CAT1674462810989'})}>
            <img className="cursor" src="https://s.alicdn.com/@sc04/kf/H216a2d1b995041cca55559236e93c113O.jpg_120x120.jpg" style={{ borderRadius: "50%",height:"85%" }} ></img>
            <h5 className="pt-3">Accessories</h5>
          </div>
          <div className="col-lg-2 col-md-4 mb-4 text-center click-cursor" onClick={e => gotoProducts(e, "category", {name:'Jewellery',value:'CAT1674462789576'})}>
            <img className="cursor" src="https://s.alicdn.com/@sc04/kf/H564dcd3c11084b62aa40939c84010d24X.jpg_120x120xz.jpg" style={{ borderRadius: "50%",height:"85%" }} ></img>
            <h5 className="pt-3">Jewellery</h5>
          </div>
          {/* <div className="col-2"></div> */}
        </div>
          </section>
      <div className="product-area section">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="section-title">
                <h2>Trending Items</h2>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <div className="product-info">
                <div className="nav-main">
                  {/* Tab Nav */}
                  <ul className="nav nav-tabs" id="myTab" role="tablist">
                    <li className="nav-item">
                      <a
                        className={`nav-link cursor ${gender === 0 ? "active" : ""
                          }`}
                        data-toggle="tab"
                        onClick={getTrendingMen}
                        role="tab"
                      >
                        Men
                      </a>
                    </li>
                    <li className="nav-item">
                      <a
                        className={`nav-link cursor ${gender === 1 ? "active" : ""
                          }`}
                        data-toggle="tab"
                        onClick={getTrendingWomen}
                        role="tab"
                      >
                        Women
                      </a>
                    </li>
                    <li className="nav-item">
                      <a
                        className={`nav-link cursor ${gender === 2 ? "active" : ""
                          }`}
                        data-toggle="tab"
                        onClick={getTrendingKids}
                        role="tab"
                      >
                        Kids
                      </a>
                    </li>
                    {/* <li className="nav-item"><a className="nav-link" data-toggle="tab" role="tab">Kids</a></li>
                                        <li className="nav-item"><a className="nav-link" data-toggle="tab" role="tab">Accessories</a></li> */}
                  </ul>
                  {/*/ End Tab Nav */}
                </div>
                {trending.length ? <div className="container ">
                  <div className="tab-content" id="myTabContent">
                    <div
                      className="tab-pane fade show active"
                      id="man"
                      role="tabpanel"
                    >
                      <div className="tab-single">
                        <div className="row">
                          {trending.length > 3 ? <Slider {...settings}>
                            {trending.map((result, index) => {
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
                                          to={"productDetails/" + result.id}
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
                          </Slider> :
                            <div className="row">
                              {trending.map((result, index) => {
                                return (
                                  <div key={index} className="col-lg-3 col-md-4 col-6">
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
                                            to={"productDetails/" + result.id}
                                          >
                                            {result.productName}
                                          </Link>
                                        </h3>
                                        <div className="product-price">
                                          <span className="fw-bold fs-5">
                                            ${numToFixed(result.price)}
                                          </span>
                                          {result.originalPrice !== result.price && <span className="ps-3 fs-7"><s>${numToFixed(result.originalPrice)}</s></span>}
                                          {Math.round(((result.originalPrice - result.price) / result.originalPrice) * 100) > 0 && <span className="success ps-3 fs-8">{Math.round(((result.originalPrice - result.price) / result.originalPrice) * 100)}% off</span>}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>



                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div> :
                  <div className="products p-5  fw-bold text-center">No Products</div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {bestSelling.length > 0 ? (
        <div className="container">
          <div class="shadow p-3 mb-5 bg-white rounded row">
            <div class="col-xl-3 col-lg-3 col-md col-12 card-container">
              <div className="card-buttons">
                <div className="heading py-2">
                  <h2>Best Selling</h2>
                </div>
                <div className="button">
                  <button
                    type="button"
                    className="btn  btn-number"
                    data-type="minus"
                    data-field="quant[1]"
                    onClick={e => gotoProducts(e, "sales", 2)}
                  >
                    View all
                  </button>
                </div>
              </div>

              <div></div>
            </div>
            <div class="col-xl-9 col-lg-9 col-md col-12">
              {bestSelling.length > 3 ? <Slider {...settings}>
                {bestSelling.map((result, index) => {
                  return (
                    <div key={index} className="ss">
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
                                if (result.isWishlisted == false) {
                                  return (
                                    <a title="Wishlist">
                                      <i
                                        className=" fa-regular fa-heart "
                                        onClick={() =>
                                          addToWishlistBest(result.id)
                                        }
                                      ></i>
                                      <span>Add to Wishlist</span>
                                    </a>
                                  );
                                } else if (result.isWishlisted == true) {
                                  return (
                                    <a title="Wishlist">
                                      <i
                                        className=" fa fa-heart "
                                        onClick={() =>
                                          removeFromWishlistBest(result.id)
                                        }
                                      ></i>
                                      <span>Remove from Wishlist</span>
                                    </a>
                                  );
                                }
                              })()}
                            </div>

                            {result.availableStock > 0 && (() => {
                              console.log("html", result.isInCart);
                              if (
                                result.isInCart == false ||
                                result.isInCart == undefined
                              ) {
                                return (
                                  <div className="product-action-2">
                                    <a
                                      title="Add to cart"
                                      onClick={() => addToCartBest(result)}
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
                                      onClick={() => goToCart(result)}
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
                            <Link to={"/productDetails/" + result.id}>
                              {result.productName}
                            </Link>
                          </h3>
                          <div className="product-price">
                            <span className="fw-bold fs-5">${numToFixed(result.price)}</span>
                            {result.originalPrice !== result.price && <span className="ps-3 fs-7"><s>${numToFixed(result.originalPrice)}</s></span>}
                            {Math.round(((result.originalPrice - result.price) / result.originalPrice) * 100) > 0 && <span className="success ps-3 fs-8">{Math.round(((result.originalPrice - result.price) / result.originalPrice) * 100) === 100 ? 99 : Math.round(((result.originalPrice - result.price) / result.originalPrice) * 100)}% off</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Slider> :
                <div className="row">
                  {bestSelling.map((result, index) => {
                    return (
                      <div key={index} className="col-lg-3 col-md-4 col-6">
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
                                  if (result.isWishlisted == false) {
                                    return (
                                      <a title="Wishlist">
                                        <i
                                          className=" fa-regular fa-heart "
                                          onClick={() =>
                                            addToWishlistBest(result.id)
                                          }
                                        ></i>
                                        <span>Add to Wishlist</span>
                                      </a>
                                    );
                                  } else if (result.isWishlisted == true) {
                                    return (
                                      <a title="Wishlist">
                                        <i
                                          className=" fa fa-heart "
                                          onClick={() =>
                                            removeFromWishlistBest(result.id)
                                          }
                                        ></i>
                                        <span>Remove from Wishlist</span>
                                      </a>
                                    );
                                  }
                                })()}
                              </div>

                              {result.availableStock > 0 && (() => {
                                console.log("html", result.isInCart);
                                if (
                                  result.isInCart == false ||
                                  result.isInCart == undefined
                                ) {
                                  return (
                                    <div className="product-action-2">
                                      <a
                                        title="Add to cart"
                                        onClick={() => addToCartBest(result)}
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
                                        onClick={() => goToCart(result)}
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
                              <Link to={"/productDetails/" + result.id}>
                                {result.productName}
                              </Link>
                            </h3>
                            <div className="product-price">
                              <span className="fw-bold fs-5">${numToFixed(result.price)}</span>
                              {result.originalPrice !== result.price && <span className="ps-3 fs-7"><s>${numToFixed(result.originalPrice)}</s></span>}
                              {Math.round(((result.originalPrice - result.price) / result.originalPrice) * 100) > 0 && <span className="success ps-3 fs-8">{Math.round(((result.originalPrice - result.price) / result.originalPrice) * 100)}% off</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              }
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
      {topViewed.length > 0 ? (
        <div className="container">
          <div class="shadow p-3 mb-5 bg-white rounded row">
            <div class="col-xl-3 col-lg-3 col-md-3 col-12 card-container">
              <div className="card-buttons">
                <div className="heading py-2">
                  <h2>Top Viewed</h2>
                </div>

                <div className="button">
                  <button
                    type="button"
                    className="btn btn-number"
                    data-type="minus"
                    data-field="quant[1]"
                    onClick={e => gotoProducts(e, "sort", 5)}
                  >
                    View all
                  </button>
                </div>
              </div>
            </div>
            <div class="col-xl-9 col-lg-9 col-md-9 col-12">

              {topViewed.length > 3 ? <Slider {...settings}>
                {topViewed.map((result, index) => {
                  return (
                    <div className="ss p-2" key={index}>
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
                                if (result.isWishlisted == false) {
                                  return (
                                    <a title="Wishlist">
                                      <i
                                        className=" fa-regular fa-heart "
                                        onClick={() =>
                                          addToWishlistTop(result.id)
                                        }
                                      ></i>
                                      <span>Add to Wishlist</span>
                                    </a>
                                  );
                                } else if (result.isWishlisted == true) {
                                  return (
                                    <a title="Wishlist">
                                      <i
                                        className=" fa fa-heart "
                                        onClick={() =>
                                          removeFromWishlistTop(result.id)
                                        }
                                      ></i>
                                      <span>Remove from Wishlist</span>
                                    </a>
                                  );
                                }
                              })()}
                            </div>

                            {result.availableStock > 0 && (() => {
                              console.log("html", result.isInCart);
                              if (
                                result.isInCart == false ||
                                result.isInCart == undefined
                              ) {
                                return (
                                  <div className="product-action-2">
                                    <a
                                      title="Add to cart"
                                      onClick={() => addToCartTop(result)}
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
                                      onClick={() => goToCart(result)}
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
                            <Link to={"productDetails/" + result.id}>
                              {result.productName}
                            </Link>
                          </h3>
                          <div className="product-price">
                            <span className="fw-bold fs-5">${numToFixed(result.price)}</span>
                            {result.originalPrice !== result.price && <span className="ps-3 fs-7"><s>${numToFixed(result.originalPrice)}</s></span>}
                            {Math.round(((result.originalPrice - result.price) / result.originalPrice) * 100) > 0 && <span className="success ps-3 fs-8">{Math.round(((result.originalPrice - result.price) / result.originalPrice) * 100) === 100 ? 99 : Math.round(((result.originalPrice - result.price) / result.originalPrice) * 100)}% off</span>}

                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Slider> :
                <div className="row">
                  {topViewed.map((result, index) => {
                    return (
                      <div className="col-lg-3 col-md-4 col-6 p-2" key={index}>
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
                                  if (result.isWishlisted == false) {
                                    return (
                                      <a title="Wishlist">
                                        <i
                                          className=" fa-regular fa-heart "
                                          onClick={() =>
                                            addToWishlistTop(result.id)
                                          }
                                        ></i>
                                        <span>Add to Wishlist</span>
                                      </a>
                                    );
                                  } else if (result.isWishlisted == true) {
                                    return (
                                      <a title="Wishlist">
                                        <i
                                          className=" fa fa-heart "
                                          onClick={() =>
                                            removeFromWishlistTop(result.id)
                                          }
                                        ></i>
                                        <span>Remove from Wishlist</span>
                                      </a>
                                    );
                                  }
                                })()}
                              </div>

                              {result.availableStock > 0 && (() => {
                                console.log("html", result.isInCart);
                                if (
                                  result.isInCart == false ||
                                  result.isInCart == undefined
                                ) {
                                  return (
                                    <div className="product-action-2">
                                      <a
                                        title="Add to cart"
                                        onClick={() => addToCartTop(result)}
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
                                        onClick={() => goToCart(result)}
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
                              <Link to={"productDetails/" + result.id}>
                                {result.productName}
                              </Link>
                            </h3>
                            <div className="product-price">
                              <span className="fw-bold fs-5">${numToFixed(result.price)}</span>
                              {result.originalPrice !== result.price && <span className="ps-3 fs-7"><s>${numToFixed(result.originalPrice)}</s></span>}
                              {Math.round(((result.originalPrice - result.price) / result.originalPrice) * 100) > 0 && <span className="success ps-3 fs-8">{Math.round(((result.originalPrice - result.price) / result.originalPrice) * 100)}% off</span>}

                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>
              }
              {/* </Carousel> */}
            </div>
          </div>
        </div>
      ) : (
        ""
      )}

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
      {/* End Shop Services Area */}

      {/* Start Shop Newsletter  */}

      {/* End Shop Newsletter */}

      {/* Modal */}
      <div className="modal fade" id="exampleModal" tabIndex="-1" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span className="ti-close" aria-hidden="true"></span>
              </button>
            </div>
            <div className="modal-body">
              <div className="row no-gutters">
                <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
                  {/* Product Slider */}
                  <div className="product-gallery">
                    <div className="quickview-slider-active">
                      <div className="single-slider">
                        <img
                          src="https://via.placeholder.com/569x528"
                          alt="#"
                        />
                      </div>
                      <div className="single-slider">
                        <img
                          src="https://via.placeholder.com/569x528"
                          alt="#"
                        />
                      </div>
                      <div className="single-slider">
                        <img
                          src="https://via.placeholder.com/569x528"
                          alt="#"
                        />
                      </div>
                      <div className="single-slider">
                        <img
                          src="https://via.placeholder.com/569x528"
                          alt="#"
                        />
                      </div>
                    </div>
                  </div>
                  {/* End Product slider */}
                </div>
                <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
                  <div className="quickview-content">
                    <h2>Flared Shift Dress</h2>
                    <div className="quickview-ratting-review">
                      <div className="quickview-ratting-wrap">
                        <div className="quickview-ratting">
                          <i className="yellow fa fa-star"></i>
                          <i className="yellow fa fa-star"></i>
                          <i className="yellow fa fa-star"></i>
                          <i className="yellow fa fa-star"></i>
                          <i className="fa fa-star"></i>
                        </div>
                        <a href=" "> (1 customer review)</a>
                      </div>
                      <div className="quickview-stock">
                        <span>
                          <i className="fa fa-check-circle-o"></i> in stock
                        </span>
                      </div>
                    </div>
                    <h3>$29.00</h3>
                    <div className="quickview-peragraph">
                      <p>
                        Lorem ipsum dolor sit amet, consectetur adipisicing
                        elit. Mollitia iste laborum ad impedit pariatur esse
                        optio tempora sint ullam autem deleniti nam in quos qui
                        nemo ipsum numquam.
                      </p>
                    </div>
                    <div className="size">
                      <div className="row">
                        <div className="col-lg-6 col-12">
                          <h5 className="title">Size</h5>
                          <select>
                            <option value="value">s</option>
                            <option>m</option>
                            <option>l</option>
                            <option>xl</option>
                          </select>
                        </div>
                        <div className="col-lg-6 col-12">
                          <h5 className="title">Color</h5>
                          <select>
                            <option value="value">orange</option>
                            <option>purple</option>
                            <option>black</option>
                            <option>pink</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="quantity">
                      {/* Input Order */}
                      <div className="input-group">
                        <div className="button minus">
                          <button
                            type="button"
                            className="btn btn-primary btn-number"
                            disabled="disabled"
                            data-type="minus"
                            data-field="quant[1]"
                          >
                            <i className="ti-minus"></i>
                          </button>
                        </div>
                        <input
                          type="text"
                          name="quant[1]"
                          className="input-number"
                          data-min="1"
                          data-max="1000"
                        />
                        <div className="button plus">
                          <button
                            type="button"
                            className="btn btn-primary btn-number"
                            data-type="plus"
                            data-field="quant[1]"
                          >
                            <i className="ti-plus"></i>
                          </button>
                        </div>
                      </div>
                      {/*/ End Input Order */}
                    </div>
                    <div className="add-to-cart">
                      <a href=" " className="btn">
                        Add to cart
                      </a>
                      <a href=" " className="btn min">
                        <i className="fa-regular fa-heart"></i>
                      </a>
                      <a href=" " className="btn min">
                        <i className="fa fa-compress"></i>
                      </a>
                    </div>
                    <div className="default-social">
                      <h4 className="share-now">Share:</h4>
                      <ul>
                        <li>
                          <a className="facebook" href=" ">
                            <i className="fa fa-facebook"></i>
                          </a>
                        </li>
                        <li>
                          <a className="twitter" href=" ">
                            <i className="fa fa-twitter"></i>
                          </a>
                        </li>
                        <li>
                          <a className="youtube" href=" ">
                            <i className="fa fa-pinterest-p"></i>
                          </a>
                        </li>
                        <li>
                          <a className="dribbble" href=" ">
                            <i className="fa fa-google-plus"></i>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
