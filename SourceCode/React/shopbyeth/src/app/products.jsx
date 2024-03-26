import React, { useEffect, useRef, useState } from "react";
import useAppContext from "../AppContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { IoMdStar } from "react-icons/io";
import { toast } from "react-toastify";
import ReactPaginate from "react-paginate";
import axios from "axios";
import { Rating } from "primereact/rating";
import Paginations from "./pagination";
import {
  AiOutlineSearch
} from "react-icons/ai";

const Products = () => {
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const aws_url = process.env.REACT_APP_AWS_ENDPOINT;
  const location = useLocation();
  const appContext = useAppContext();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [totalPage, setTotalPage] = useState(0);
  const [value5, setValue5] = useState([0, 1000]);
  const [productList, setproductList] = useState([]);
  const connected = localStorage.getItem("connected");
  const loginStatus = +localStorage.getItem("status");
  const localStorageCartList = JSON.parse(localStorage.getItem("cartList"));
  const searchKeyword = appContext.getSearchKeyword();
  const [categoryLoading, setCategoryLoading] = useState(true)
  const [brandLoading, setBrandLoading] = useState(true)
  const [IsSubCategory, setIsSubCategory] = useState(false)
  const [count,setCount] = useState(0)
  const word = appContext.keyword
  // const [selectedCategro, setselectedCategro] = useState(second)
  const [viewMore, setViewMore] = useState({
    category:true,
    brand:true,
    subCategory:true,
    type:true
  }) 
  const [priceList, setPriceList] = useState([
    { name: "Under $250", value: "0,250" },
    { name: "$250 - $500", value: "250,500" },
    { name: "$500 - $750", value: "500,750" },
    { name: "$750 -$1000 ", value: "750,1000" },
    { name: "Above $1000", value: "1000,1000000000" },
  ]);
  const ratingList = [
    { name: "4★ & above", value: 4 },
    { name: "3★ & above", value: 3 },
    { name: "2★ & above", value: 2 },
    { name: "1★ & above", value: 1 },
  ];
  const sortByList = [
    { name: "Price: Low to High", value: 4 },
    { name: "Price: High to Low", value: 3 },
    { name: "Popularity", value: 2 },
    { name: "Highly Rated", value: 1 },
    { name: "Trending", value: 5 }, 
    { name: "Latest Arrivals", value: 0 },
  ];

  const [filterArray, setFilterArray] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [brands, setBrands] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);
  const [typeList, setTypeList] = useState([]);
  const [loading,setLoading] = useState(true)

  const [subCategoryKeyword, setSubCategoryKeyword] = useState("")

  const [totalItems, setTotalItems] = useState(0)

  //const fromHome = location.state.fromHome;
  var gender = 0;

  // useEffect(() => {
  //   console.log(location.state);

  //   dateSort.current = -1;
  //   setSortBy("createdAt");
  //   getCategory("");
  //   getBrands("");

  //   window.scrollTo(0, 0);
  // }, [page, searchKeyword]);
  const searchCategory = (e) =>{
    getCategory(e.target.value)
  }


  const searchBrand=(e)=>{
    e.preventDefault()
    getBrands(e.target.value)
  }
  useEffect(()=>{
    getCategory("");
      getBrands("");
  },[])

  useEffect(()=>{
    getProducts();
    
    // console.log(appContext.getProducts().gender.map(res=>res.value).join(","));
  },[appContext.getProducts()])

  useEffect(()=>{
    if (appContext.getProducts().category.value) {
      subCategorySearch(appContext.getProducts().category.value,subCategoryKeyword)
    }
  },[subCategoryKeyword])

  useEffect(() => {}, [location.state]);
  const numToFixed =(num)=>{
    if ((num+"").split(".").length===1 ) {

      return num
    }
    else{
     let stringNum = (num+"").split(".")
     return stringNum[0]+"."+stringNum[1].slice(0,6)
    }

  }
  const getCategory = async (keyword) => {
    try {
      // let path = base_url + "public/category/CAT78";
      let path = base_url + "public/category/";
      let params ={keyword:keyword.trim()}
      await appContext
        .getAxios()
        .get(path,{params:params})
        .then((response) => {
          setCategoryList(response.data.docs);
          setCategoryLoading(false)
        });
    } catch (error) {
      console.error(error);
    }
  };
  const subCategorySearch = async (id,key)=>{
    let params={keyword:key.trim()}
    let path = base_url + "public/category/" + id;
      await appContext
        .getAxios()
        .get(path,{params:params})
        .then((response) => {
          setSubCategoryList(response.data.docs);
        });
  }
  const getSubCategory = async (e, id, name) => {
    try {
      if (e.target.checked) {
        let body = {
          value: id,
          name: name,
        };
        appContext.setProducts("category",body)
        let path = base_url + "public/category/" + id;
        // let path = base_url + "public/category/";
        await appContext
          .getAxios()
          .get(path)
          .then((response) => {
            setViewMore({
              ...viewMore,
              "subCategory":true,
              "type":true
            })
            setSubCategoryKeyword("")
            // console.log(response.data[0].subCategories);
            setSubCategoryList(response.data.docs);
            
          });
      }
      else{
        let body = {
          value: "",
          name: "",
        };
        appContext.setProducts("category",body)
        setSubCategoryKeyword("")
        setSubCategoryList([])
      }
     
        // appContext.setProducts("category",body)
      setTypeList([]);
     
    } catch (error) {
      console.error(error);
    }
  };
  const getType = async (e, id, name) => {
    try {

      if (e.target.checked) {
        let body =[
          ...appContext.getProducts().subCategory,
          {"name":name,"value":id}
        ]
        console.log(body);
        appContext.setProducts("subCategory",body)
      }
      else{
        let body = [
          ...appContext.getProducts().subCategory.filter((res)=>res.value!==id)
        ]
        console.log(body);
        appContext.setProducts("subCategory",body)
        console.log("no");
      }

    } catch (error) {}
  };
  const getTypeList = async(id) =>{
    let path = base_url + "public/type/" + id;
    await axios.get(path).then((res) => {
        setTypeList(res.data);
        setViewMore({
          ...viewMore,
          "type":true
        })
      });
  }
  const getTypeFilter = (e, id, name) => {
    // let body = {
    //   value: id,
    //   name: name,
    // };
    // appContext.setProducts("type",body)
    if (e.target.checked) {
      let body =[
        ...appContext.getProducts().type,
        {"name":name,"value":id}
      ]
      console.log(body);
      appContext.setProducts("type",body)
    }
    else{
      let body = [
        ...appContext.getProducts().type.filter((res)=>res.value!==id)
      ]
      console.log(body);
      appContext.setProducts("type",body)
      console.log("no");
    }

  };
  const getBrands = async (keyword) => {
    try {
      let params = {keyword:keyword.trim()}
      let path = base_url + "public/brand";
      await appContext
        .getAxios()
        .get(path,{params:params})
        .then((response) => {
          let resp = response.data.docs;
          setBrands(resp);
          setBrandLoading(false)
        });
    } catch (error) {
      console.error(error);
    }
  };
  const getProducts = async () => {
    try {
      const productFilter = await appContext.getProducts();
      console.log(productFilter);
      setPage(productFilter.page)
      let params = {
        page: productFilter.page,
        size: productFilter.size,
        keyword: productFilter.keyword,
      };
      switch (productFilter.sort) {
        case 0:
          params.createdAt =-1
          break;
        case 1:
          params.avgRating = -1
          break;
          case 2:
            params.sales = -1
            break;
          case 3:
            params.price =-1
            break
          case 4:
            params.price =1
            break;
          case 5:
            params.views =-1
            break;
        default:
          break;
      }
      // if (priceSort.current) params.price = priceSort.current;
      // if (dateSort.current) params.createdAt = dateSort.current;
      // if (salesSort.current) params.sales = salesSort.current;
      // if (ratingSort.current) params.avgRating = ratingSort.current;

      let array = [];
      if (productFilter.priceRange.value) {
        array.push({ name: productFilter.priceRange.name, type: "price" });
        params.priceRange = productFilter.priceRange.value;
      }
      if (productFilter.rating.value) {
        array.push({ name: productFilter.rating.name, type: "rate" });
        params.rating = productFilter.rating.value;
      }
      if (productFilter.category.value) {
        array.push({ name: productFilter.category.name, type: "category" });
        params.category = productFilter.category.value;
      }
      if (productFilter.brand.length>0) {
        // array.push({ name: productFilter.brand.name, type: "brand" });
        array.push(
          ...productFilter.brand.map((res)=>{
            res.type="brand"
            return res
          })
        )
        params.brand = productFilter.brand.map(res=>res.value).join(",")
      }
      if (productFilter.subCategory.length>0) {
        // array.push({
        //   name: productFilter.subCategory.name,
        //   type: "subCategory",
        // });
        array.push(
          ...productFilter.subCategory.map((res)=>{
            res.type="subCategory"
            return res
          })
        )
        // params.subCategory = productFilter.subCategory.value;
        params.subCategory = productFilter.subCategory.map(res=>res.value).join(",")
        if (productFilter.subCategory.length===1) {
          getTypeList(productFilter.subCategory.map(res=>res.value).join(","))
        }
        else{
          setTypeList([])
        }
        
      }
      else{
        setTypeList([])
      }
      if (productFilter.type.length>0) {
        // array.push({ name: productFilter.type.name, type: "type" });
        array.push(
          ...productFilter.type.map((res)=>{
            res.type="type"
            return res
          })
        )
        params.typeId= productFilter.type.map(res=>res.value).join(",")
        // params.typeId = productFilter.type.value;
      }
      if (productFilter.gender.length>0) {
        array.push(
          ...productFilter.gender.map(res=>
            {res.type="gender"
             return res
          }
        ))
        params.gender = productFilter.gender.map(res=>res.value).join(",")
      }
      console.log(productFilter.outOfStock,"sss");
      if (+productFilter.outOfStock === 0) {
        
          
        params.outOfStock =0
      }
      else {
        
        array.push({
          name: "Include out of stock",
          type: "outOfStock",
        });
      }

      setFilterArray(array);
      console.log(params);
      
      if (connected && loginStatus === 1) {
        getUserProducts(params)
      } else {
        getPublicProducts(params);
      }
    } catch (error) {}
  };

  const getUserProducts = async (params) => {
    try {
      console.log(params);
      let path = base_url + "users/products";
      await appContext
        .getAxios()
        .get(path, { params })
        .then((response) => {
          let resp = response.data.docs;
          setTotalPage(response.data.totalPages);
          setTotalItems(response.data.totalDocs)
          // if (localStorageCartList) {
          //   for (let cartObj of localStorageCartList) {
          //     let data = resp.filter(obj => obj.id === cartObj.id).map(el => {
          //       console.log("ff", el);
          //       el.isInCart = true;
          //       return el
          //     })
          //   }
          // }
          setproductList(resp);
          setLoading(false)
          setCount(response.data.totalDocs)
          console.log("response",response);
          window.scrollTo(0, 0);
        });
    } catch (error) {}
  };

  const getPublicProducts = async (params) => {
    try {
      let path = base_url + "public/products";
      await axios.get(path, { params }).then((response) => {
        let resp = response.data.docs;
        setTotalPage(response.data.totalPages);
        window.scrollTo(0, 0);
        setCount(response.data.totalDocs)
        console.log("hiii",response);
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
         setproductList(resp);
         setTotalItems(response.data.totalDocs)
         setLoading(false)
         setCount(resp.data.totalDocs)
        console.log("public",resp);
      });
    } catch (error) {}
  };
  const addToCart = async (product) => {
    try {
      if (connected && loginStatus === 1) {
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
            var tempProductarray = [...productList];
            let obj = tempProductarray.find((a) => a.id === product.id);
            obj.isInCart = true;
            setproductList(tempProductarray);
            appContext.setcount(+localStorage.getItem("cartCount") + 1);
            toast.success("Item added to cart !");
          });
      } else {
        var tempProductarray = [...productList];
        let obj = tempProductarray.find((a) => a.id === product.id);
        obj.isInCart = true;
        setproductList(tempProductarray);
        let cartCount = +localStorage.getItem("cartCount");
        let array = [];
        if (localStorageCartList) array = localStorageCartList;
        product._id = product.id;
        array.push(product);
        product.wished = true;
        console.log("addToWishlist called", product.wished);
        cartCount = cartCount + 1;
        appContext.setCartCount(cartCount);
        localStorage.setItem("cartList", JSON.stringify(array));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addToWishlist = async (product) => {
    try {
      let path = base_url + "users/wishlist";
      let body = {
        productId: product.id,
      };
      await appContext
        .getAxios()
        .post(path, body)
        .then((response) => {
          console.log(response);
          toast.success("Item added to wishlist !");
          var tempProductarray = [...productList];
          let obj = tempProductarray.find((a) => a.id === product.id);
          obj.isWishlisted = true;
          setproductList(tempProductarray);
          appContext.setcount(product._id);
        });
    } catch (error) {}
  };

  const removeFromWishlist = async (product) => {
    try {
      console.log("addToWishlist called");
      let path = base_url + "users/wishlist/" + product.id;
      await appContext
        .getAxios()
        .delete(path)
        .then((response) => {
          console.log(response);
          toast.success("Item removed from wishlist !");
          var tempProductarray = [...productList];
          let obj = tempProductarray.find((a) => a.id === product.id);
          obj.isWishlisted = false;
          setproductList(tempProductarray);
          appContext.setcount(product.id);
        });
    } catch (error) {}
  };

  const pageChange = (number) => {
    // e.preventDefault()
    console.log(number.selected + 1);
    setPage(number.selected + 1);
    appContext.setProducts("page",number)
  };

  const productClick = (product) => {
    console.log("hello");
    // localStorage.setItem("productId",product.id)
    navigate("/productDetails/" + product.id);
  };

  const setPriceRange = (e,range) => {
    // setValue5(range.value);
    if (e.target.checked) {
      appContext.setProducts('priceRange',range)  
    }
    else{
      appContext.setProducts('priceRange',{name:"",value:""})  
    }
    console.log(range);
    
    
  };

  const ratingFilter = (e,rate) => {
    if (e.target.checked) {
      appContext.setProducts("rating",rate)  
    }
    else{
      appContext.setProducts("rating",{name:"",value:""})
    }
    
    // getProducts();
  };

  const brandFilter = (e,brand) => {
    // let body ={
    //   name:brand.name,
    //   value:brand._id
    // }
    let name = brand.name
    let id = brand._id
    // console.log(brand);
    // appContext.setProducts("brand",body)
    if (e.target.checked) {
      let body =[
        ...appContext.getProducts().brand,
        {"name":name,"value":id}
      ]
      console.log(body);
      appContext.setProducts("brand",body)
    }
    else{
      let body = [
        ...appContext.getProducts().brand.filter((res)=>res.value!==id)
      ]
      console.log(body);
      appContext.setProducts("brand",body)
      console.log("no");
    }

  };

  const removeCriteria = (criteria, i) => {
    let type = filterArray[i].type;
    let value  = filterArray[i].value
    console.log(type);
    // array = array.splice(i, 1)
    let body= {
      name:"",
      value:""
    }
    
    switch (type) {
      
      case "price":
        appContext.setProducts("priceRange",body)
        break;
      case "rate":
        appContext.setProducts("rating",body)
        break;
      case "category":
        appContext.setProducts("category",body)
        setSubCategoryList([]);
        setTypeList([]);
        setSubCategoryKeyword("")
        break;
      case "subCategory":
        appContext.setProducts("subCategory",appContext.getProducts().subCategory.filter((res)=>res.value!==value))
        setTypeList([]);
        break;
      case "type":
        appContext.setProducts("type",appContext.getProducts().type.filter((res)=>res.value!==value))
        break;
      case "brand":
        appContext.setProducts("brand",appContext.getProducts().brand.filter((res)=>res.value!==value))
        break;
      case "gender":
        appContext.setProducts("gender",appContext.getProducts().gender.filter((res)=>res.value!==value))
        break;
      case "outOfStock":
        appContext.setProducts("outOfStock",0 )
        break;
      default:
        break;
    }
    setFilterArray([
      ...filterArray.splice(0, i),
      ...filterArray.splice(i + 1, filterArray.length),
    ]);
  };

  const onSort = async(e) => {
    e.preventDefault()
    console.log(e.target.value);
    await appContext.setProducts("sort", +e.target.value)
    
    // let keyword = e.target.value
    // if (keyword === "lowToHigh") {
    //   priceSort.current = 1;
    //   dateSort.current = null;
    //   salesSort.current = null;
    //   viewSort.current = null
    //   ratingSort.current = null;
    // } else if (keyword === "highToLow") {
    //   priceSort.current = -1;
    //   dateSort.current = null;
    //   viewSort.current = null;
    //   salesSort.current = null;
    //   ratingSort.current = null;
    // } else if (keyword === "createdAt") {
    //   dateSort.current = -1
    //   priceSort.current = null;
    //   viewSort.current = null;
    //   salesSort.current = null;
    //   ratingSort.current = null;
    // } else if (keyword === "sales") {
    //   salesSort.current = -1
    //   viewSort.current = null
    //   dateSort.current = null;
    //   priceSort.current = null;
    //   ratingSort.current = null;
    // }
    // else if (keyword === "rating") {
    //   ratingSort.current = -1
    //   salesSort.current = null
    //   viewSort.current = null;
    //   dateSort.current = null;
    //   priceSort.current = null;
    // }
    // setSortBy(e.target.value)
    // getProducts()
  };
  const getGender = (e, id, name) => {
    if (e.target.checked) {
      let body =[
        ...appContext.getProducts().gender,
        {"name":name,"value":id}
      ]
      console.log(body);
      appContext.setProducts("gender",body)
    }
    else{
      let body = [
        ...appContext.getProducts().gender.filter((res)=>res.value!==id)
      ]
      console.log(body);
      appContext.setProducts("gender",body)
      console.log("no");
    }
    
    // console.log(genderArray);
    

    // appContext.setProducts("gender",body)
    // console.log(genderRef.current);
    // getProducts();
  };

  const viewMoreField = (e,flag,field) =>{
    e.preventDefault()
    setViewMore({...viewMore,
      [field]:flag
    }
      
      )
  }
  const onOutOfStockChange =(e) =>{
    // e.preventDefault()
    if (e.target.checked) {
     appContext.setProducts("outOfStock",-1) 
    }
    else{
      appContext.setProducts("outOfStock",0)
    }
  } 

  return (
    <div className="shop body-container">
      <div className="breadcrumbs mb-3">
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
                    <Link>Shop Grid</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="product-area shop-sidebar shop section dsply">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 col-md-4 col-12">
              <div className="shop-sidebar sidebar-products">
                {filterArray.length > 0 ? (
                  <div className="single-widget category">
                    <h3 className="title">Filters</h3>
                    <ul className="categor-lists filter-list">
                      {filterArray.map((criteria, i) => {
                        return (
                          <li
                            key={i}
                            className="filterclass mb-2 me-2"
                          
                          >
                            <span className="filter-name">{criteria.name}</span>
                            <span>
                              <i className="fa-solid fa-xmark ms-4"   onClick={() => removeCriteria(criteria, i)}></i>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  ""
                )}

                <div className="single-widget category">
                  <h3 className="title">Gender</h3>
                  <ul className="categor-list">
                    <li
                      className=""
                      // onClick={(e) => getGender(e, 0, "unisex")}
                    >
                      <div className="form-check ms-1 cat-select cursor">
                     
                      <label className="form-check-label d-block cursor" for="flexCheckDefault1" >
                      <input className="form-check-input cursor" type="checkbox" checked={appContext.getProducts()?.gender?.map(res=>res.value).includes(0)} onChange={(e) => getGender(e, 0, "unisex")} value="0" id="flexCheckDefault1"/>
                        Unisex
                      </label>
                      </div>
             
                    </li>
                    <li
                      className=""
                      // onClick={(e) => getGender(e, 1, "male")}
                    >
                     <div className="form-check ms-1 cat-select cursor">
                     <label className="form-check-label d-block cursor" for="flexCheckDefault2">
                      <input className="form-check-input cursor" onChange={(e) => getGender(e, 1, "male")} type="checkbox" checked={appContext.getProducts().gender.map(res=>res.value).includes(1)} value="1" id="flexCheckDefault2"/>
                     
                        Male
                      </label>
                      </div>
                    </li>
                    <li
                      className=""
                      // onClick={(e) => getGender(e, 2, "female")}
                    >
                      <div className="form-check ms-1 cat-select cursor">
                      <label className="form-check-label d-block cursor" for="flexCheckDefault3">
                      <input className="form-check-input cursor" onChange={(e) => getGender(e, 2, "female")} checked={appContext.getProducts().gender.map(res=>res.value).includes(2)} type="checkbox" value="2" id="flexCheckDefault3"/>
                        Female
                      </label>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="single-widget category">
                  <h3 className="title">Kids</h3>
                  <ul className="categor-list">
                    <li
                      className=""
                      // onClick={(e) => getGender(e, 0, "unisex")}
                    >
                      <div className="form-check ms-1 cat-select cursor">
                     
                      <label className="form-check-label d-block cursor" for="flexCheckDefault4" >
                      <input className="form-check-input cursor" type="checkbox" checked={appContext.getProducts()?.gender?.map(res=>res.value).includes(3)} onChange={(e) => getGender(e, 3, "boy")} value="3" id="flexCheckDefault4"/>
                        Boy
                      </label>
                      </div>
             
                    </li>
                    <li
                      className=""
                      // onClick={(e) => getGender(e, 0, "unisex")}
                    >
                      <div className="form-check ms-1 cat-select cursor">
                     
                      <label className="form-check-label d-block cursor" for="flexCheckDefault5" >
                      <input className="form-check-input cursor" type="checkbox" checked={appContext.getProducts()?.gender?.map(res=>res.value).includes(4)} onChange={(e) => getGender(e, 4, "girl")} value="4" id="flexCheckDefault5"/>
                        Girl
                      </label>
                      </div>
             
                    </li>
                    <li
                      className=""
                      // onClick={(e) => getGender(e, 0, "unisex")}
                    >
                      <div className="form-check ms-1 cat-select cursor">
                     
                      <label className="form-check-label d-block cursor" for="flexCheckDefault6" >
                      <input className="form-check-input cursor" type="checkbox" checked={appContext.getProducts()?.gender?.map(res=>res.value).includes(5)} onChange={(e) => getGender(e, 5, "kids-unisex")} value="5" id="flexCheckDefault6"/>
                        Unisex
                      </label>
                      </div>
             
                    </li>
                    
                  </ul>
                </div>

                <div className="single-widget category">
                  <h3 className="title">Brands</h3>
                  <span className="search-input">
                    <span className="search-icon">
                    <AiOutlineSearch />
                    </span>
                  <input type="search" className="search-text " autoComplete="off"   name="keyword"
                  placeholder="Search brand" 
                 
                   onChange={e => searchBrand(e)} 
                  />
                  <span className="input-group-btn ">
                  
                  </span>
                </span>
                  {brands.length>0?<ul className="categor-list">
                  {(!viewMore.brand && brands.length>5)?brands.map((brand, i) => {
                      return (
                        <li key={i}
                        className=" "
                        //  onClick={() => brandFilter(brand)}
                         >
                            <div className="form-check ms-1 cat-select">
                        <label className="form-check-label d-block cursor" for={`brandCheck${i}`}>
                      <input className="form-check-input cursor" onChange={(e) => brandFilter(e, brand)} checked={appContext.getProducts().brand.map(el=>el.value).includes(brand._id)} type="checkbox"  id={`brandCheck${i}`}/>
                      {brand.name}
                    </label>
                        </div>
                           
                         
                        </li>
                      );
                    }):
                    brands.slice(0,5).map((brand, i) => {
                      return (
                        <li key={i}
                        className="">
                          
                          <div className="form-check ms-1 cat-select">
                        <label className="form-check-label d-block cursor" for={`brandCheck${i}`}>
                      <input className="form-check-input cursor" onChange={(e) => brandFilter(e, brand)} checked={appContext.getProducts().brand.map(el=>el.value).includes(brand._id)} type="checkbox"  id={`brandCheck${i}`}/>
                      {brand.name}
                    </label>
                        </div>
                         
                        </li>
                      );
                    })
                    }
                    {(!viewMore.brand && brands.length>5)&&<li onClick={e=>viewMoreField(e,!viewMore.brand,"brand")} className="text-center mt-3 cat-select">View Less</li>}
                    {(viewMore.brand && brands.length>5) && <li  onClick={e=>viewMoreField(e,!viewMore.brand,"brand")}  className="text-center mt- cat-select">View More</li>}

                  </ul>:brandLoading?  <div class="d-flex justify-content-center my-5">
                <div class="spinner-border text-warning" role="status">
                  <span class="sr-only"></span>
                </div> </div>:
                  <div className="no-items">No Brands</div> }
                
                </div>

                <div className="single-widget category">
                  <h3 className="title">Categories</h3>
                  
                 
                  <span className="search-input">
                    <span className="search-icon">
                    <AiOutlineSearch />
                    </span>
                  <input type="search" className="search-text " autoComplete="off"   name="keyword"
                  placeholder="Search category" 
                 
                   onChange={e => searchCategory(e)} 
                  />
                  <span className="input-group-btn ">
                  
                  </span>
                </span>
                  
                  {categoryList.length>0 ?<ul className="categor-list">
                    {(!viewMore.category && categoryList.length>5)?categoryList.map((res, index) => {
                      return (
                        <li
                        className="cat-select"
                         
                        key={index}
                      >

<div className="form-check ms-1 cat-select">
                        <label className="form-check-label d-block cursor" for={`catCheck${index}`}>
                      <input className="form-check-input cursor" onChange={(e) => getSubCategory(e, res.id, res.name)} checked={appContext.getProducts().category.value ===res._id} type="checkbox"  id={`catCheck${index}`}/>
                      {res.name}
                    </label>
                        </div>
                      </li>
                      );
                    }):
                    categoryList.slice(0,5).map((res, index) => {
                      return (
                        <li
                        className="cat-select"
                         
                        key={index}
                      >

<div className="form-check ms-1 cat-select">
                        <label className="form-check-label d-block cursor" for={`catCheck${index}`}>
                      <input className="form-check-input cursor" onChange={(e) => getSubCategory(e, res.id, res.name)} checked={appContext.getProducts().category.value ===res._id} type="checkbox"  id={`catCheck${index}`}/>
                      {res.name}
                    </label>
                        </div>
                      </li>
                      );
                    })}

                    {(!viewMore.category && categoryList.length>5)&&<li onClick={e=>viewMoreField(e,!viewMore.category,"category")} className="text-center mt-3 cat-select">View Less</li>}
                    {(viewMore.category && categoryList.length>5) && <li  onClick={e=>viewMoreField(e,!viewMore.category,"category")}  className="text-center mt- cat-select">View More</li>}
                  </ul>:categoryLoading?  <div class="d-flex justify-content-center my-5">
                <div class="spinner-border text-warning" role="status">
                  <span class="sr-only"></span>
                </div> </div>:
                  <div className="no-items">No Category</div> }
                </div>
                {appContext.getProducts().category.value  && (
                  <div className="single-widget category">
                    <h3 className="title">Subcategory</h3>
                    {((appContext.getProducts().category.value && subCategoryList.length>0) || subCategoryKeyword)  && <span className="search-input">
                    <span className="search-icon">
                    <AiOutlineSearch />
                    </span>
                  <input type="search" className="search-text " autoComplete="off"   name="keyword"
                  placeholder="Search subcategory" 
                  value={subCategoryKeyword}
                 
                   onChange={e => setSubCategoryKeyword(e.target.value)} 
                  />
                  <span className="input-group-btn ">
                  
                  </span>
                </span>}
                    {subCategoryList.length>0?<ul className="categor-list">
                      {(!viewMore.subCategory && subCategoryList.length>5)?subCategoryList.map((res, index) => {
                        return (
                          <li key={index}
                          className=""
                           >
                            <div className="form-check ms-1 cat-select" >
                          <label className="form-check-label d-block cursor" for={`subCategoryCheck${index}`}>
                        <input className="form-check-input cursor" onChange={(e) => getType(e, res._id, res.name)} checked={appContext.getProducts().subCategory.map(el=>el.value).includes(res._id)} type="checkbox"  id={`subCategoryCheck${index}`}/>
                        {res.name}
                      </label>
                          </div>
                          </li>
                        );
                      }):subCategoryList.slice(0,5).map((res, index) => {
                        return (
                          // <li
                          //   className="cat-select"
                          //   onClick={(e) => getType(e, res._id, res.name)}
                          //   key={index}
                          // >
                          //   {res.name}
                          // </li>
                          <li key={index}
                        className=""
                         >
                          <div className="form-check ms-1 cat-select" >
                        <label className="form-check-label d-block cursor" for={`subCategoryCheck${index}`}>
                      <input className="form-check-input cursor" onChange={(e) => getType(e, res._id, res.name)} checked={appContext.getProducts().subCategory.map(el=>el.value).includes(res._id)} type="checkbox"  id={`subCategoryCheck${index}`}/>
                      {res.name}
                    </label>
                        </div>
                        </li>
                        );
                      })}
                      {(!viewMore.subCategory && subCategoryList.length>5)&&<li onClick={e=>viewMoreField(e,!viewMore.subCategory,"subCategory")} className="text-center mt-3 cat-select">View Less</li>}
                    {(viewMore.subCategory && subCategoryList.length>5) && <li  onClick={e=>viewMoreField(e,!viewMore.subCategory,"subCategory")}  className="text-center mt- cat-select">View More</li>}

                    </ul>: <div className="no-items">No Subcategory</div> }
                  </div>
                )}
                {typeList.length > 0 && (
                  <div className="single-widget category">
                    <h3 className="title">Type</h3>
                    <ul className="categor-list">
                      {(!viewMore.type && typeList.length>5)?typeList.map((res, index) => {
                        return (
                          <li
                            className=""
                            key={index}
                          >
                            <div className="form-check ms-1 cat-select" >
                        <label className="form-check-label d-block cursor" for={`typeCheck${index}`}>
                      <input className="form-check-input cursor" onChange={(e) => getTypeFilter(e, res._id, res.name)} checked={appContext.getProducts().type.map(el=>el.value).includes(res._id)} type="checkbox"  id={`typeCheck${index}`}/>
                      {res.name}
                    </label>
                        </div>

                         </li>
                        );
                      }):typeList.slice(0,5).map((res, index) => {
                        return (
                          <li
                            className=""
                            // onClick={(e) => getTypeFilter(e, res._id, res.name)}
                            key={index}
                          >
                            <div className="form-check ms-1 cat-select" >
                        <label className="form-check-label d-block cursor" for={`typeCheck${index}`}>
                      <input className="form-check-input cursor" onChange={(e) => getTypeFilter(e, res._id, res.name)} checked={appContext.getProducts().type.map(el=>el.value).includes(res._id)} type="checkbox"  id={`typeCheck${index}`}/>
                      {res.name}
                    </label>
                        </div>

                         </li>
                        );
                      })}
                        {(!viewMore.type && typeList.length>5)&&<li onClick={e=>viewMoreField(e,!viewMore.type,"type")} className="text-center mt-3 cat-select">View Less</li>}
                    {(viewMore.type && typeList.length>5) && <li  onClick={e=>viewMoreField(e,!viewMore.type,"type")}  className="text-center mt- cat-select">View More</li>}

                    </ul>
                  </div>
                )}
                <div className="single-widget range">
                  <h3 className="title">Shop by Price</h3>

                  <div className="price-filter">
                    <div className="price-filter-inner">
                      {/* <div id="slider-range"></div>
                      <div className="price_slider_amount">
                        <div className="label-input">
                          <span>Range:</span>
                          <input
                            type="text"
                            id="amount"
                            name="price"
                            placeholder="Add Your Price"
                          />
                        </div>
                      </div> */}
                      {/* <h5>Range: [${value5[0]}, ${value5[1]}]</h5>

                    <Slider min={10} max={10000} step={1000} value={value5} onChange={(e) => setPriceRange(e.value)} range /> */}
                    </div>
                  </div>
                  <ul className="price-list">
                    {priceList.map((range, i) => {
                      return (
                        <li key={i} className="py-2">
                          {/* <Link onClick={() => setPriceRange(range)}>
                            {" "}
                            {range.name}
                          </Link> */}

<div className="form-check ms-1 cat-select" >
                        <label className="form-check-label d-block cursor" for={`priceCheck${i}`}>
                      <input className="form-check-input cursor" onChange={(e) => setPriceRange(e,range)} checked={appContext.getProducts().priceRange.value===range.value} type="checkbox"  id={`priceCheck${i}`}/>
                      {range.name}
                    </label>
                        </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="single-widget category">
                  <h3 className="title">Customer Ratings</h3>
                  <ul className="categor-list">
                    {ratingList.map((rate, i) => {
                      return (
                        <li key={i}>
                          {/* <Link
                            style={{ display: "flex" }}
                            onClick={() => ratingFilter(rate)}
                          >
                            <Rating
                              value={rate.value}
                              readOnly
                              stars={5}
                              cancel={false}
                              className="cursor"
                            />
                            <span className="ms-2"> & Up</span>
                          </Link> */}
                          <div className="form-check ms-1 cat-select" >
                        <label className="form-check-label d-block cursor" for={`ratingCheck${i}`}>
                      <input className="form-check-input cursor" onChange={(e) => ratingFilter(e,rate)} checked={appContext.getProducts().rating.value===rate.value} type="checkbox"  id={`ratingCheck${i}`}/>
                      {/* <Rating
                              value={rate.value}
                              readOnly
                              stars={5}
                              cancel={false}
                              className="cursor"
                            /> */}
                            {rate.value} <i class="fa fa-star" aria-hidden="true"></i> & Up
                            {/* <div className="rating-value">{rate.value}</div> */}
                            {/* <span className="ms-2"> & Up</span> */}
                    </label>
                        </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                

                
                <div className="single-widget">
                  <h3 className="title">Include out of stock</h3>
                  <ul className="categor-list">
                    <li className=" ">
                      <div className="form-check cat-select">
                      <input
                                            className="form-check-input"
                                            type="checkbox"
                                            name="primary"
                                            value={appContext.getProducts().outOfStock?.value}
                                            // value={addressObj.primary}
                                            id="outOfStockCheck"
                                            checked={appContext.getProducts().outOfStock ===-1}
                                            onChange={(e) => onOutOfStockChange(e)}
                                          />
                                          <label
                                          for="outOfStockCheck"
                                            className="form-check-label cursor d-block"  onChange={(e) => onOutOfStockChange(e)} 
                                          >
                                            Include out of stock
                                          </label>
                      </div>
                   
                    </li>
                  </ul>
                </div>
                {/* <!--/ End Single Widget --> */}
              </div>
            </div>
            <div className="col-lg-9 col-md-8 col-12">
              <h7>Showing {count} results</h7>
              <div className="row">
                <div className="col-12">
                  
                  {/* <!-- Shop Top --> */}
                  <div className="shop-top">
                    <div className="shop-shorter">
                      <div className="single-shorter">
                        <label className="me-2">Sort By :</label>
                        <select
                          className="sortselect"
                          onChange={(e) => {
                            onSort(e);
                          }}
                          value={appContext.getProducts().sort}
                        >
                          {sortByList.map((sortoption, i) => {
                            return (
                              <option key={i} value={sortoption.value}>
                                {sortoption.name}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                {productList.length > 0 ? (
                  productList.map((result, index) => {
                    return (
                      <div className="col-lg-3 col-md-6 col-6" key={index}>
                        <div className="single-product">
                          <div className="product-img">
                            <Link to={"/productDetails/" + result.id}>
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
                            </Link>
                            <div className="button-head">
                              {connected ? (
                                <div className="product-action">
                                  {!result.isWishlisted ? (
                                    <Link>
                                      <i
                                        className="fa-regular fa-heart"
                                        onClick={() => addToWishlist(result)}
                                      ></i>
                                      <span>Add to Wishlist</span>
                                    </Link>
                                  ) : (
                                    <Link>
                                      <i
                                        className="fa-solid fa-heart"
                                        onClick={() =>
                                          removeFromWishlist(result)
                                        }
                                      ></i>
                                      <span>Remove from Wishlist</span>
                                    </Link>
                                  )}
                                  <a></a>
                                </div>
                              ) : (
                                ""
                              )}
                              {result.availableStock > 0 ? (
                                <div className="product-action-2">
                                  {!result.isInCart ? (
                                    <Link onClick={() => addToCart(result)}>
                                      Add to cart
                                    </Link>
                                  ) : (
                                    <a href="/cart">Go to cart</a>
                                  )}
                                </div>
                              ) : (
                                ""
                              )}
                            </div>
                          </div>
                          <div className="product-content">
                            <h3 className="product-name">
                              <a onClick={() => productClick(result)} href=" ">
                                <span className="text-break">
                                  {result.productName}
                                </span>
                              </a>
                            </h3>
                            <div className="product-price">
                              <span className="fw-bold fs-5">${numToFixed(result.price)}</span>
                              {result.originalPrice !== result.price &&<span className="ps-3 fs-7"><s>${numToFixed(result.originalPrice)}</s></span>}
                              {Math.round(((result.originalPrice-result.price)/result.originalPrice)*100) >0 && <span className="success ps-3 fs-8">{Math.round(((result.originalPrice-result.price)/result.originalPrice)*100)===100 ? 99:Math.round(((result.originalPrice-result.price)/result.originalPrice)*100)}% off</span>} </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : loading ? <div class="d-flex justify-content-center my-5">
                <div class="spinner-border text-warning" role="status">
                  <span class="sr-only"></span>
                </div> </div>: (
                  <div className="text-center p-5">No Products Found!</div>
                )}
              </div>
              {totalPage > 1 ? (
                // <ReactPaginate
                //   breakLabel="..."
                //   nextLabel="next >"
                //   forcePage={appContext.getProducts().page-1}
                //   onPageChange={pageChange}
                //   marginPagesDisplayed={2}
                //   pageRangeDisplayed={1}
                //   pageCount={totalPage}
                //   previousLabel="< previous"
                //   renderOnZeroPageCount={null}
                //   breakClassName={"page-item"}
                //   breakLinkClassName={"page-link"}
                //   containerClassName={"pagination"}
                //   pageClassName={"page-item"}
                //   pageLinkClassName={"page-link"}
                //   previousClassName={"page-item"}
                //   previousLinkClassName={"page-link"}
                //   nextClassName={"page-item"}
                //   nextLinkClassName={"page-link"}
                //   activeClassName={"active"}
                // />
                <Paginations
                className="pagination-bar"
                currentPage={+appContext.getProducts().page}
                totalCount={+totalItems}
                pageSize={+appContext.getProducts().size}
                onPageChange={(page) => pageChange(+page)}
              />
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Products;
