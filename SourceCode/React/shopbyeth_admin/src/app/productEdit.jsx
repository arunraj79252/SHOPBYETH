import axios from "axios";
import React, { useEffect, useState } from "react";

import { IoMdAddCircle } from "react-icons/io";
import CropImageModal from "./cropImageModal";
import Card from "react-bootstrap/Card";
import { AiFillCheckCircle, AiFillDelete } from "react-icons/ai";
import ProgressBar from "react-bootstrap/ProgressBar";
import { MdCancel } from "react-icons/md";
import useAppContext from "../AppContext";
import { toast } from "react-toastify";
import {  useParams } from "react-router-dom";
import AddBrandModal from "./addBrandModal";
import AddCategoryModal from "./addCategoryModal";

const ProductEdit = () => {

  const baseURL = process.env.REACT_APP_API_ENDPOINT;
  const imageUrl= process.env.REACT_APP_AWS_ENDPOINT;
  
  const [categoryList, setCategoryList] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false)
  let params = useParams()
  let productId = params.id
  const [subCategoryList, setSubCategoryList] = useState([]);
  const [brandList, setBrandList] = useState([]);
  const [show, setShow] = useState(false);
  const [specList, setSpecList] = useState([{key:"",value:""}]);
  const [croppedFile, setCroppedFile] = useState([]);
  
  const appContext = useAppContext();

  
  const genderList = appContext.gender();
  
  const [typeList, setTypeList] = useState([]);



  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const [product, setProduct] = useState({
    productName: "",
    description: "",
    categoryId: "",
    subCategoryId: "-1",
    brandId: "-1",
    typeId: "",
    price: "",
    originalPrice: "",
    gender: "-1",
    availableStock: "",
    coverImage: "",
    productImages: [],
    specifications: {},
    
  });
  const [categoryShow,setCategoryShow] = useState(false)
  const [brandShow,setBrandShow] = useState(false)
  const [error, setError] = useState({
    productName: "",
    description: "",
    categoryId: "",
    subCategoryId: "",
    brandId: "",
    price: "",
    gender: "",
    availableStock: "",
    image: "",
    dialColor: "",
    dialShape: "",
    strapColor: "",
    strapMaterial: "",
  });
  const getProduct =async()=>{
    await appContext.getAxios().get(baseURL+"admin/products/"+productId).then((res)=>{
      console.log(res.data);
      setProduct(res.data)
      getSubCategory(res.data.categoryId)
      getType(res.data.subCategoryId)
      let productData = res.data.productImages
      let productImages= []
      let coverImage = res.data.coverImage
      let spec = []
      for (var key in res.data.specifications) {
        var item = res.data.specifications[key];
        spec.push({'key':key,'value':item})
    }
    console.log(spec);
    setSpecList(spec)
      productData.forEach((res,index)=>{
        if (res === coverImage) {
          productImages.push({
            completed:true,
            coverImage:true,
            id:index,
            uploadPath:res,
            preview:imageUrl+productId+"/"+res,
            status:100
            
  
          })
        }
        else{
          productImages.push({
            completed:true,
            coverImage:false,
            id:index,
            uploadPath:res,
            preview:imageUrl+productId+"/"+res,
            status:100,
            
  
          })
        }
        
      })
      setCroppedFile(productImages)

    })
  }
  const getType = async(id) =>{
    if (id) {
    await appContext.getAxios().get(baseURL+"public/type/"+id).then((res)=>{
        setTypeList(res.data)
      })  
    }
    
  }
 
  
  useEffect(()=>{
    getProduct()
  },[])
  const specChangeHandler = (e, id) => {
    if (e.target.name.length>30 || e.target.value.length>30) {
      toast.error("Maximum length exceeded")
      return
    }
    e.preventDefault();

    setSpecList((specList) => [
      ...specList.slice(0, id),
      { ...specList[id], [e.target.name]: e.target.value },
      ...specList.slice(id + 1),
    ]);
  };
  const specDeleteHandler = (e, id) => {
    e.preventDefault();
    setSpecList((specList) => [
      ...specList.slice(0, id),
      ...specList.slice(id + 1),
    ]);
  };
  const specAdd = (e) => {
    e.preventDefault();
    setSpecList([
      ...specList,
      {
        key: "",
        value: "",
      },
    ]);
  };
  const submitHandle = async (e) => {
    e.preventDefault();

    let flag=await productValidate();
    console.log(flag);
    if(flag ===0){
      return
    }


    let productBody = product;
    
    let index = croppedFile.findIndex((res) => res.coverImage === true);
    console.log(croppedFile[index].uploadPath);
    let coverImage = croppedFile[index].uploadPath;
    productBody.coverImage = croppedFile[index].uploadPath;
    console.log(productBody);
    // productImages = croppedFile.map(res=>)
    let productImages = [];
    croppedFile.forEach((res) => {
      productImages.push(res.uploadPath);
    });
    console.log(productImages);
    productBody.productImages = productImages;
    console.log(productBody);
    // setProduct(productBody)
    let spec={}
    specList.forEach((res)=>{
      let key =res.key
      let value =res.value
      spec[key]= value
    })
    let specData={
      ...product,
      coverImage: coverImage,
      price:+product.price,
      originalPrice:+product.originalPrice,
      productImages: productImages,
      specifications:spec
    }
    console.log(specData);
    productBody.price =+productBody.price
    productBody.originalPrice =+productBody.originalPrice
    productBody.gender =+productBody.gender
    productBody.availableStock = +productBody.availableStock
    setProduct({
      ...product,
      coverImage: coverImage,
      price:+product.price,
      originalPrice:+product.originalPrice,
      productImages: productImages,
      specifications:spec
    });
    productBody.specifications= spec
    setSubmitLoading(true)
    await appContext
      .getAxios()
      .put(baseURL + "admin/products/"+productId, productBody)
      .then((res) => {
        console.log(res);
        toast.success("Product is updated")
        // navigate("/products")
        setSubmitLoading(false)
      })
      .catch((error) => {
        console.log(error);
        setSubmitLoading(false)
      });
  };
  useEffect(()=>{
    console.log(croppedFile);
  },[croppedFile])
  const productValidate = () => {
    return new Promise((resolve, reject) => {
      const numberRegex = new RegExp("^[0-9]*$");
      const priceRegex =new RegExp("^[+]?([0-9]*[.])?[0-9]+$")
      let flag = 1;

      if (product.productName === "") {
        setError((prevState)=>({
          ...prevState,
          productName: "Product name is required",
        }));
        flag = 0;
      }else if (product.productName.length <2 || product.productName.length >300) {
        setError((prevState)=>({
          ...prevState,
          productName: "Invalid product name",
        }));
        flag =0
      } 
       else{
        setError({
          ...error,
          productName: "",
        });
      }

      if (product.description === "") {
        setError((prevState) => ({
          ...prevState,
          description: "Description is required",
        }));
        flag = 0;
      } else if (product.description.length <2 || product.description.length > 5000) {
        setError((prevState) => ({
          ...prevState,
          description: "Invalid description",
        }));
        flag = 0;
      } else  {
        setError((prevState) => ({
          ...prevState,
          description: "",
        }));
      }
      if (!product.price ) {
        setError((prevState) => ({
          ...prevState,
          price: "Price is required",
        }));
        flag = 0;
      } else if (!priceRegex.test(product.price) || ((""+product.price).split(".")[1]?.length>3))  {
        setError((prevState) => ({
          ...prevState,
          price: "Enter valid price",
        }));
        flag = 0;
      }
      else if (+product.price > 100000000) {
        setError((prevState) => ({
          ...prevState,
          price: "Maximum 99999999.999 allowed",
        }));
        flag = 0;
      }
      
      else if (product.price <= 0) {
        setError({
          ...error,
          price: "Price should be greater than zero",
        });
        flag = 0
      } else if (+product.price> +product.originalPrice) {
        setError((prevState) => ({
          ...prevState,
          price: "Price is greater than MRP",
        }));
        flag= 0
      }
     
       else  {
        setError((prevState) => ({
          ...prevState,
          price: "",
        }));
      }
      console.log((""+product.originalPrice).split("."));
      if (product.originalPrice === "") {
        setError((prevState) => ({
          ...prevState,
          originalPrice: "MRP is required",
        }));
        flag = 0;
       
      } else if (!priceRegex.test(product.originalPrice ) || (""+product.originalPrice).split(".")[1]?.length>3) {
        setError((prevState) => ({
          ...prevState,
          originalPrice: "Enter valid MRP",
        }));
        flag =0
      }
      else if (product.originalPrice <= 0) {
        setError({
          ...error,
          price: "MRP should be greater than zero",
        });
        flag = 0
      }

      else if (+product.originalPrice > 100000000) {
        setError((prevState) => ({
          ...prevState,
          originalPrice: "Maximum 99999999.999 allowed",
        }));
        flag = 0;
      }
      
        else  {
        setError((prevState) => ({
          ...prevState,
          originalPrice: "",
        }));
      }

      if (product.availableStock === "") {
        setError((prevState) => ({
          ...prevState,
          availableStock: "Stock is required",
        }));
        flag = 0;
      } else if (!numberRegex.test(product.availableStock)) {
        setError((prevState) => ({
          ...prevState,
          availableStock: "Invalid Stock",
        }));
        flag = 0;
      } else {
        setError((prevState) => ({
          ...prevState,
          availableStock: "",
        }));
      }
      if (product.brandId === "" || product.brandId === "-1") {
        setError((prevState) => ({
          ...prevState,
          brandId: "Brand is required",
        }));
        flag = 0;
      } else {
        setError((prevState) => ({
          ...prevState,
          brandId: "",
        }));
      }

      if (product.categoryId === "" || product.categoryId === "-1") {
        setError((prevState) => ({
          ...prevState,
          categoryId: "Category is required",
        }));
        flag = 0;
      } else {
        setError((prevState) => ({
          ...prevState,
          categoryId: "",
        }));
      }
      if (product.subCategoryId === "" || product.subCategoryId === "-1") {
        setError((prevState) => ({
          ...prevState,
          subCategoryId: "Sub category is required",
        }));
        flag = 0;
      } else {
        setError((prevState) => ({
          ...prevState,
          subCategoryId: "",
        }));
      }
      if (product.gender === "" || product.gender === "-1") {
        setError((prevState) => ({
          ...prevState,
          gender: "Gender is required",
        }));
        flag = 0;
      } else {
        setError((prevState) => ({
          ...prevState,
          gender: "",
        }));
      }
      if (product.typeId === "" || product.typeId === "-1") {
        setError((prevState) => ({
          ...prevState,
          typeId: "Type is required",
        }));
        flag = 0;
      } else {
        setError((prevState) => ({
          ...prevState,
          typeId: "",
        }));
      }
      if (+product.price > +product.originalPrice) {
        setError((prevState) => ({
          ...prevState,
          price: "Price is greater than MRP",
        }));
      }

      if (croppedFile.length < 3) {
        setError((prevState) => ({
          ...prevState,
          image: "Upload atleast 3 images",
        }));
        flag = 0;
      }
      else if (croppedFile.length>6){
        setError((prevState) => ({
          ...prevState,
          image: "Maximum uploadable image is 6",
        }));
        flag = 0;
      }
      let cover = croppedFile.find((res)=>{
        return res.coverImage ===true
      })
      if (cover === undefined) {
        setError((prevState) => ({
          ...prevState,
          image: "Select one cover image",
        }));
        flag = 0;
      }
      let status= croppedFile.find((res)=>{
        return res.status ===-1
      })
      if (status !== undefined) {
        setError((prevState) => ({
          ...prevState,
          image: "Delete all failed images",
        }));
        flag = 0;
      }
      
      if (specList.length < 3) {
        setError((prevState) => ({
          ...prevState,
          specification: "Minumum 3 spec is required",
        }));
        flag = 0;
      }
      else if (specList.length>10){
        setError((prevState) => ({
          ...prevState,
          specification: "Maximum 10 spec is allowed",
        }));
        flag = 0;
      }
      else if (specList[specList.length-1].key ==="" || specList[specList.length-1].value ==="") {
        setError((prevState) => ({
          ...prevState,
          specification: "Fill all spec fields",
        }));
        flag =0
      }
       else {
        setError((prevState) => ({
          ...prevState,
          specification: "",
        }));
      }
      let specKeyArray =[]
      specList.forEach(res=>specKeyArray.push(res.key))
    // console.log(new Set(specKeyArray).size);
      if (new Set(specKeyArray).size !== specKeyArray.length) {
      setError({
        ...error,
        specification:"Please enter different keys"
      })
      flag=0
    }
      resolve(flag);
    });
  };
  useEffect(() => {
    console.log(error);
  }, [error]);

  const onInputChange = (e) => {
    e.preventDefault();
    if (e.target.name === "categoryId") {
      getSubCategory(e.target.value);
      setProduct({ ...product, [e.target.name]: e.target.value,
      subCategoryId:"-1",
      typeId:'-1'
      });
      validate(e)
      return
    }
    else if (e.target.name ==="subCategoryId") {
      getType(e.target.value)
      setProduct({
        ...product,
        [e.target.name]: e.target.value,
        typeId: "-1",
      });
      validate(e)
      return;
    }

    setProduct({ ...product, [e.target.name]: e.target.value });
    validate(e);
  };
  const validate = (e) => {
    const priceRegex =new RegExp("^[+]?([0-9]*[.])?[0-9]+$")
 
    if (e.target.name === "productName") {
      if (e.target.value === "") {
        setError({
          ...error,
          [e.target.name]: "Product name is required",
        });
      }
      else if(e.target.value.length < 2 || e.target.value.length > 300){
        setError({
          ...error,
          [e.target.name]: "Invalid product name",
        });
      }
       else {
        setError({
          ...error,
          [e.target.name]: "",
        });
      }
    } else if (e.target.name === "description") {
      if (e.target.value === "") {
        setError({
          ...error,
          [e.target.name]: "Description is required",
        });
      } 
      else if(e.target.value.length < 2 || e.target.value.length > 5000){
        setError({
          ...error,
          [e.target.name]: "Invalid description",
        });
      }
       else {
        setError({
          ...error,
          [e.target.name]: "",
        });
      }
    } else if (e.target.name === "availableStock") {
      let regex = new RegExp("^[0-9]*$");

      if (e.target.value === "") {
        if (e.target.name === "availableStock") {
          setError({
            ...error,
            [e.target.name]: "Stock is required",
          });
        }
      } else if (!regex.test(e.target.value)) {
        setError({
          ...error,
          [e.target.name]: "Only number is allowed",
        });
      } else {
        setError({
          ...error,
          [e.target.name]: "",
        });
      }
    
    } else if (
      e.target.name === "brandId" ||
      e.target.name === "subCategoryId" ||
      e.target.name === "categoryId" ||
      e.target.name === "gender" ||
      e.target.name === "typeId"
    ) {
      if (e.target.value !== "" || e.target.value !== "-1") {
        setError({
          ...error,
          [e.target.name]: "",
        });
      }
    }
    
    else if (e.target.name ==="price") {
      if (e.target.value === "") {
        setError({
          ...error,
          [e.target.name]: "Price is required",
        });
      }
      else if(!priceRegex.test(e.target.value)){
        setError({
          ...error,
          [e.target.name]: "Enter valid price",
        });
      }
      
      else if (e.target.value <=0) {
        setError({
          ...error,
          [e.target.name]: "Price should be greater than zero",
        });
      }
      else if (error.price.length === 25 && +product.originalPrice < +e.target.value) {
        
          setError({
            ...error,
            price:"Price is greater than MRP"
          })
        
      }
      else if (e.target.value.split(".")[1]?.length>3) {
        setError({
          ...error,
          price:"Enter valid price"
        })
      }
      else if (+e.target.value > 100000000) {
        setError({
          ...error,
          price:"Maximum 99999999.999 allowed"
        
        })
      }
      else{
        setError({
          ...error,
          [e.target.name]: "",
        });
      }
      
    }
    else if (e.target.name === "originalPrice") {
      if (e.target.value === "") {
        setError({
          ...error,
          [e.target.name]: "MRP is required",
        });
      }
      else if(!priceRegex.test(e.target.value)){
        setError({
          ...error,
          [e.target.name]: "Enter valid MRP",
        });
      }
      
      else if (e.target.value <=0) {
        setError({
          ...error,
          [e.target.name]: "MRP should be greater than zero",
        });
      }
      else if (e.target.value.split(".")[1]?.length>3) {
        setError({
          ...error,
          [e.target.name]:"Enter valid MRP"
        })
      }
      else if (+e.target.value > 100000000) {
        setError({
          ...error,
          [e.target.name]:"Maximum 99999999.999 allowed"
        
        })
      }
      
      else{
        setError({
          ...error,
          [e.target.name]: "",
        });
      }
     
    }
  };
  useEffect(() => {
    getCategory();
    getBrand()
    console.log(appContext.gender());
  }, []);
  const getBrand = async () =>{
    await axios.get(baseURL+"public/brand").then((res)=>{
      console.log(res.data);
      setBrandList(res.data.docs)
    })
  }
  useEffect(() => {
    // debugger;

    if (error.price.length === 25) {
      console.log(product.originalPrice,product.price,"Sss");
      if (+product.originalPrice >= +product.price) {
        console.log("works");
        setError({
          ...error,
          price:""
        })
      }
    }
  }, [product]);

  const setCroppedData = async (file, preview) => {
    let imageSize = file.size/1024/1024
    if (imageSize>10) {
      toast.error("Maximum image size is 10 mb")
      return;
    }
    // console.log(file, preview);
    const form = new FormData();
    // console.log(file);
    form.append("uploadImage", file);
    // console.log(form.get("uploadImage"));
    let len = croppedFile.length;
    let date = new window.Date().toISOString();
    // console.log(date);

    let crop = [];
    if (len !== 0) {
      crop = {
        coverImage: false,
        id: "image" + date,
        file: file,
        preview: preview,
        status: 0,
        uploadPath: "",
        completed:false
      };
      await imageUpload(form, crop);
    } else {
      crop = {
        coverImage: true,
        id: "image" + date,
        file: file,
        preview: preview,
        status: 0,
        uploadPath: "",
        completed:false
      };
      await imageUpload(form, crop);
      setCroppedFile([...croppedFile, crop]);
     
    }
  };



  const imageUpload = async (file, crop) => {
    
    const config = {
      onUploadProgress: (progressEvent) => {
        console.log(
          Math.round((progressEvent.loaded * 100) / progressEvent.total)
        );
        let statusCrop = crop;
        statusCrop.status = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setCroppedFile([...croppedFile, statusCrop]);
      },
    };

    let path = baseURL + "admin/products/image";

    await appContext
      .getAxios2()
      .post(path, file, config)
      .then((res) => {
        console.log(res, "res");
        let uploadComplete = crop;
        uploadComplete.status = 100;
        uploadComplete.completed = true
        uploadComplete.uploadPath = res.data.productImage;
        setCroppedFile([...croppedFile, uploadComplete]);
      })
      .catch((error) => {
        let statusCrop =crop
        statusCrop.status =-1
        setCroppedFile([...croppedFile, statusCrop]);
        console.error(error);
      });

    
  };
 

  const [image, setImage] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const onImageSelect = (e) => {
    e.preventDefault();
    setImage([e.target.files]);
    // console.log(e.target.files);
    setTimeout(() => {
      e.target.value=""
    }, 1000);
  };
  const getCategory = async () => {
    await axios.get(base_url + "public/category").then((res) => {
      // console.log(res);
      setCategoryList(res.data.docs);
    });
  };
  const getSubCategory = async (id) => {
    if (id) {
      await axios.get(base_url + "public/category/" + id).then((res) => {
        // console.log(res.data[0].subCategories);
        setSubCategoryList(res.data.docs);
      });  
    }
    
  };

  useEffect(() => {
    if (image.length < 1) {
      return;
    }
    // console.log(image);
    const newImageUrls = [];
    // console.log(typeof image[0]);
    for (const iterator of image[0]) {
      newImageUrls.push(window.URL.createObjectURL(iterator));
    }

    // image.forEach(img=>{newImageUrls.push(window.URL.createObjectURL(new Blob(img)))})
    // console.log(newImageUrls);
    setImageUrls([newImageUrls]);
    setShow(true);
  }, [image]);
  const close = () => {
    // console.log("works");
    setShow(false);
  };
  useEffect(() => {
    if (error.image && croppedFile.length >2 && croppedFile[croppedFile.length-1].status === 100) {
      setError((prevState)=>({
        ...prevState,
        image:""
      }))
    }
  }, [croppedFile]);

  useEffect(() => {
    console.log(imageUrls);
  }, [imageUrls]);

  useEffect(()=>{

    if (error.specification === "Please enter different keys") {
      let specKeyArray =[]
      specList.forEach(res=>specKeyArray.push(res.key))
    if (new Set(specKeyArray).size === specKeyArray.length) {
      setError({
        ...error,
        specification:""
      })
    }
    }
    

  },[specList])
  const deleteImage = (e, id) => {
    e.preventDefault();

    let objIndex = croppedFile.findIndex((res) => res.id === id);
    if (croppedFile[objIndex].coverImage && croppedFile[objIndex].status !==-1 ) {
      toast.error("Please change cover image");
    } else {
      setCroppedFile([
        ...croppedFile.slice(0, objIndex),
        ...croppedFile.splice(objIndex + 1, croppedFile.length),
      ]);
    }

    // setCroppedFile([...croppedFile.slice()])
    // let myarray = croppedFile
    // myarray[objIndex].status+=10
    // console.log(myarray);
    // debugger
    // setCroppedFile(myarray)
  };
  const onSpecChangeHandler = (e) => {
    e.preventDefault();
      if (e.target.value !== "" || e.target.value !== "-1") {
        setError({
          ...error,
          [e.target.name]: "",
        });
      }
    

    setProduct((prevState) => ({
      ...prevState,
      specifications: {
        ...prevState.specifications,
        [e.target.name]: e.target.value,
      },
    }));
  };
  const coverChange = (e, id) => {
    e.preventDefault();
    console.log(id);
    let crop = croppedFile.map((res) => {
      if (res.id === id) {
        res.coverImage = true;
      } else {
        res.coverImage = false;
      }
      return res;
    });
    setCroppedFile(crop);
  };
  const categoryOpen = (e) =>{
    e.preventDefault()
    setCategoryShow(true)
  }
  const brandOpen =(e) =>{
    e.preventDefault()
    setBrandShow(true)
  }
  const categoryClose =()=>{
    setCategoryShow(false)
    getCategory()
  }
  const brandClose = () =>{
    setBrandShow(false)
    getBrand()
  }
  
  return (
    <div className="container mb-5 pb-5">
      <h2 className="mb-5 mt-5">Edit Products</h2>
      <div className="card ">
        <div className="row">
          <div className="col-2"></div>
          <div className="col-8">
            <form className="form" id="regForm">
              <div className="row">
                <div className="form-group mt-4">
                  <label className="mb-2">
                    Product name<span className="text-danger">*</span>
                  </label>
                  <input
                    name="productName"
                    type="text"
                    autoComplete="off"
                    value={product.productName}
                    placeholder=""
                    className={`form-control ${
                      error.productName ? "is-invalid" : ""
                    }`}
                    onChange={(e) => onInputChange(e)}
                  />

                  <div className="invalid-feedback my-1">
                    {error.productName}
                  </div>
                </div>

                <div className="form-group mt-4">
                  <label className="mb-2">
                    Description<span className="text-danger">*</span>
                  </label>
                  <textarea
                    className={`form-control ${
                      error.description ? "is-invalid" : ""
                    }`}
                    rows={3}
                    cols={4}
                    placeholder=""
                    name="description"
                    onChange={(e) => onInputChange(e)}
                    value={product.description}
                  />
                  {error.description ? (
                    <div className="invalid-feedback ">{error.description}</div>
                  ) : (
                    ""
                  )}
                </div>
                <div className="col-lg-3 col-12">
                  <div className="form-group mt-4">
                    <span className="label-button mb-3">
                      <label>
                        Brand
                        <span className="text-danger">*</span>
                      </label>
                      <span className="">
                        <button
                          className="btn add-button"
                          onClick={(e) => brandOpen(e)}
                          type="button"
                        >
                          <IoMdAddCircle />
                        </button>
                      </span>
                    </span>
                    <select
                      className={`form-select ${
                        error.brandId ? "is-invalid" : ""
                      }`}
                      id="exampleFormControlSelect1"
                      name="brandId"
                      value={product.brandId}
                      onChange={(e) => onInputChange(e)}
                    >
                      <option hidden value="-1"></option>
                      {brandList.map((brand, index) => {
                        return (
                          <option key={index} value={brand._id}>
                            {brand.name}
                          </option>
                        );
                      })}
                    </select>
                    {error.brandId ? (
                      <div className="invalid-feedback ">{error.brandId}</div>
                    ) : (
                      ""
                    )}
                  </div>
                </div>

                <div className="col-lg-3 col-12">
                  <div className="form-group mt-4">
                    <span className="label-button mb-3">
                      <label>
                        Category
                        <span className="text-danger">*</span>
                      </label>
                      <span className="">
                        <button
                          type="button"
                          className="btn add-button"
                          onClick={(e) => categoryOpen(e)}
                        >
                          <IoMdAddCircle />
                        </button>
                      </span>
                    </span>

                    <select
                      className={`form-select ${
                        error.categoryId ? "is-invalid" : ""
                      }`}
                      id=""
                      onChange={(e) => onInputChange(e)}
                      name="categoryId"
                      value={product.categoryId}
                    >
                      <option value={"-1"} hidden></option>
                      <option hidden selected></option>
                      {categoryList.map((cat, index) => {
                        return (
                          <option key={index} value={cat.id}>
                            {cat.name}
                          </option>
                        );
                      })}
                    </select>
                    {error.categoryId ? (
                      <div className="invalid-feedback ">
                        {error.categoryId}
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
                <div className="col-lg-3 col-12">
                  <div className="form-group mt-4">
                    <span className="label-button mb-3">
                      <label>
                        Sub category
                        <span className="text-danger">*</span>
                      </label>
                      <span className=""></span>
                    </span>
                    <select
                      className={`form-select ${
                        error.subCategoryId ? "is-invalid" : ""
                      }`}
                      id="exampleFormControlSelect1"
                      onChange={(e) => onInputChange(e)}
                      name="subCategoryId"
                      value={product.subCategoryId}
                      
                    >
                      <option value={"-1"} hidden></option>
                      {subCategoryList.length > 0 ? (
                        subCategoryList.map((sub, index) => {
                          return (
                            <option key={index} value={sub._id}>
                              {sub.name}
                            </option>
                          );
                        })
                      ) : (
                        <option disabled>No subcategories</option>
                      )}
                    </select>
                    {error.subCategoryId ? (
                      <div className="invalid-feedback ">
                        {error.subCategoryId}
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
                <div className="col-lg-3 col-12">
                  <div className="form-group mt-4">
                    <label className="mb-3">
                      Type<span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${
                        error.typeId ? "is-invalid" : ""
                      }`}
                      id="exampleFormControlSelect1"
                      onChange={(e) => onInputChange(e)}
                      value={product.typeId}
                      name="typeId"
                    >
                     
                      <option value={"-1"} hidden></option>
                      {typeList ? typeList.map((res, index) => {
                        return (
                          <option key={index} value={res._id}>
                            {res.name}
                          </option>
                        );
                      }):
                      <option disabled>No Types</option>
                      }
                    </select>
                    {error.typeId ? (
                      <div className="invalid-feedback ">{error.typeId}</div>
                    ) : (
                      ""
                    )}

                  </div>
                </div>
                <div className="col-lg-3 col-12">
                  <div className="form-group mt-4">
                    <label className="mb-2">
                      Gender<span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${
                        error.gender ? "is-invalid" : ""
                      }`}
                      id="exampleFormControlSelect1"
                      onChange={(e) => onInputChange(e)}
                      value={product.gender}
                      name="gender"
                    >
                     
                      <option value={"-1"} hidden></option>
                      {genderList.map((res, index) => {
                        return (
                          <option key={index} value={res.id}>
                            {res.name}
                          </option>
                        );
                      })}
                    </select>
                    {error.gender ? (
                      <div className="invalid-feedback ">{error.gender}</div>
                    ) : (
                      ""
                    )}

                  </div>
                </div>
                <div className="col-lg-3 col-12">
                  <div className="form-group mt-4">
                    <label className="mb-2">
                      Price<span className="text-danger">*</span>
                    </label>
                    <input
                      name="price"
                      type="text"
                      autoComplete="off"
                      value={product.price}
                      placeholder=""
                      className={`form-control ${
                        error.price ? "is-invalid" : ""
                      }`}
                      onChange={(e) => onInputChange(e)}
                    />
                    {error.price ? (
                      <div className="invalid-feedback ">{error.price}</div>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
                <div className="col-lg-3 col-12">
                  <div className="form-group mt-4">
                    <label className="mb-2">
                      MRP<span className="text-danger">*</span>
                    </label>
                    <input
                      name="originalPrice"
                      type="text"
                      autoComplete="off"
                      value={product.originalPrice}
                      placeholder=""
                      className={`form-control ${
                        error.originalPrice ? "is-invalid" : ""
                      }`}
                      onChange={(e) => onInputChange(e)}
                    />
                    {error.originalPrice ? (
                      <div className="invalid-feedback ">
                        {error.originalPrice}
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
                <div className="col-lg-3 col-12">
                  <div className="form-group mt-4">
                    <label className="mb-2">
                      Stock<span className="text-danger">*</span>
                    </label>
                    <input
                      name="availableStock"
                      type="text"
                      autoComplete="off"
                      value={product.availableStock}
                      placeholder=""
                      className={`form-control ${
                        error.availableStock ? "is-invalid" : ""
                      }`}
                      onChange={(e) => onInputChange(e)}
                    />
                    {error.availableStock ? (
                      <div className="invalid-feedback ">
                        {error.availableStock}
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
                <h5 className="py-4">Specifications</h5>
                <div className="row">
                 
                  <div className="col-lg-5">
                    <label className="form-label">Key</label>
                  </div>
                  <div className="col-lg-5">
                    <label className="form-label">Value</label>
                  </div>
                  <div className="col-lg-2"></div>
                  {specList.map((res, index) => {
                    return (
                      <React.Fragment key={index}>
                        <div className="col-lg-5 my-1 col-6">
                          <input
                            type="text"
                            className={`form-control ${
                              error.specification ? "is-invalid" : ""
                            }`}
                            name="key"
                            value={res.key}
                            onChange={(e) => specChangeHandler(e, index)}
                          />
                        </div>
                        <div className="col-lg-5 my-1 col-6">
                          <input
                            type="text"
                            className={`form-control ${
                              error.specification ? "is-invalid" : ""
                            }`}
                            name="value"
                            value={res.value}
                            onChange={(e) => specChangeHandler(e, index)}
                          />
                        </div>
                        <div className="col-lg-2 col-12 delete-spec">
                         {specList.length !==1 && <button
                            type="button"
                            className="btn add-button "
                            onClick={(e) => specDeleteHandler(e, index)}
                          >
                            <AiFillDelete />
                          </button>}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="col-12 my-3">
                {error.specification ? (
                      <div className="text-danger error ">
                        {error.specification}
                      </div>
                    ) : (
                      ""
                    )}
                 <button
                    className={`btn ${specList[specList.length - 1]?.key === "" ||
                    specList[specList.length - 1]?.value === ""?"disable-add-button":"add-button"} `}
                    type="button"
                    onClick={(e) => specAdd(e)}
                  >
                    <IoMdAddCircle />
                  </button>
                </div>
                <div className="col-lg-12">
                  <div className="form-group mt-4">
                    <label className="form-label">
                      Images<span className="text-danger">*</span>
                    </label>
                    <input
                      className={`form-control ${
                        error.image ? "is-invalid" : ""
                      }`}
                      type="file"
                      accept="image/*"
                      id="formFileMultiple"
                      onChange={onImageSelect}
                    />
                    <div className="invalid-feedback ">{error.image}</div>
                  </div>
                </div>
                <div className="col-lg-12">
                  <div className="row p-2">
                    {croppedFile.map((crop, index) => (
                      <div className="col-lg-3 col-12" key={index}>
                        <Card className="p-2">
                          <Card.Img variant="top" src={crop.preview} />
                         
                        </Card>
                        {crop.status === 100 ? (
                          <ProgressBar variant="success" now={100} />
                        ) : crop.status === -1?(
                          <ProgressBar variant="danger" now={100} />
                        ):<ProgressBar animated now={crop.status} />}
                        <div className="button-container">
                          {crop.status!==-1 && <button
                            className="btn delete-button"
                            type="button"
                            onClick={(e) => coverChange(e, crop.id)}
                          >
                            {crop.coverImage ? (
                              <AiFillCheckCircle />
                            ) : (
                              <MdCancel />
                            )}
                          </button>}
                          {(crop.completed === true || crop.status===-1) && (
                            <button
                            type="button"
                              className="btn delete-button"
                              onClick={(e) => deleteImage(e, crop.id)}
                            >
                              <AiFillDelete />
                            </button>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
                <div className="login-button col-lg-2 mt-4 mb-3">
                  <button
                  type="button"
                    className={`button submit-button`}
                    disabled={submitLoading}
                    onClick={(e) => submitHandle(e)}
                  >
                    {submitLoading?<div className="submit-spinner spinner-border text-warning" role="status">
                      <span className="sr-only"></span>
                    </div>:"Submit"}
                  </button>
                </div>
              </div>
            </form>
          </div>
          <div className="col-2"></div>
        </div>
      </div>
      <CropImageModal
        show={show}
        image={imageUrls[0]}
        setCroppedData={setCroppedData}
        close={close}
      />
      <AddBrandModal show={brandShow} close={brandClose} />
      <AddCategoryModal show={categoryShow} close={categoryClose} />
    </div>
  )
}

export default ProductEdit