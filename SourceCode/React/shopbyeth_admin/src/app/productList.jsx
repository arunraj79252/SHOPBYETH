import React, { useEffect, useState } from "react";
import axios from "axios";
// import Pagination from '../pagination';
// import Pagination from 'react-bootstrap/Pagination';
import { useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
// import Collapse from "react-bootstrap/Collapse";
import useAppContext from "../AppContext";
import DeleteConfirmModal from "./deleteConfirmModal";

import { FaTrashRestoreAlt } from "react-icons/fa";


import {
  AiFillDelete,
  AiFillEye,
  AiOutlineSearch
} from "react-icons/ai";
import { toast } from "react-toastify";
import Paginations from "./pagination";

const ProductList = () => {
  const appContext = useAppContext();
  const path = process.env.REACT_APP_API_ENDPOINT;
  const [products, setProducts] = useState([]);
 
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);

  const [categoryList, setCategoryList] = useState([]);

  const [sort, setSort] = useState(0)

  const [keyword, setKeyword] = useState('')

  const [subCategoryList, setSubCategoryList] = useState([])
  const [typeList, setTypeList] = useState([])
  const [type, setType] = useState("")
  const [brandList, setBrandList] = useState([])
  const [brand, setBrand] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [confirmShow, setConfirmShow] = useState(false);
  const [confirmRevertShow, setConfirmRevertShow] = useState(false)
  const [modalBody, setModalBody] = useState({
    title : "",
    body:"",
    id:""
  })

  const [parameters,setParameters] = useState({
    page:1,
    size:20,
    keyword:"",
    gender:"",
    category:"",
    subCategory:"",
    brand:"",
    status:"",
    type:"",
    sort:0,
    
  })

  const navigate = useNavigate();

  const genderList = [
    { id: 0, name: "Unisex" },
    { id: 1, name: "Male" },
    { id: 2, name: "Female" },
    {id:3,name:"Boy"},
    {id:4,name:"Girl"},
    {id:5,name:"Kid-unisex"}
  ];

  const sortList = [
    { id: 0, name: "Newest" },
    { id: 1, name: "Oldest" },
    { id: 2, name: "Most Views" },
    { id: 3, name: "Least Views" },
    { id: 4, name: "Most Sales" },
    { id: 5, name: "Least Sales" },
  ];
  let active = 2;
  // let items = [];
  const getCategory = async () => {
    await axios.get(path + "public/category").then((res) => {
      console.log("category",res);
      setCategoryList(res.data.docs);
    });
  };
  useEffect(() => {
    // getProducts();
    getCategory()
    getBrand()
    console.log("new build");
  }, []);
  useEffect(() => {

    getProducts()
  }, [parameters])
  const getBrand = async () => {
    await appContext.getAxios().get(path + "public/brand").then((res) => {
      console.log("brand",res.data);
      setBrandList(res.data.docs)
    })
  }
  useEffect(() => {
    console.log(sort);
  }, [sort])
  useEffect(() => {
    if (parameters.category === '') {
      return
    }
    getSubCategory(parameters.category)
  }, [parameters.category])
  useEffect(() => {
    if (parameters.subCategory) {
      getType(parameters.subCategory)
    }

  }, [parameters.subCategory])

  const getType = async (id) => {
    await appContext.getAxios().get(path + "public/type/" + id).then((res) => {
      setTypeList(res.data)
      console.log("type",res.data);
    })
  }

  const getSubCategory = async (id) => {
    await axios.get(path + "public/category/" + id).then((res) => {
      console.log("sub",res.data);
      setSubCategoryList(res.data.docs)
    })
  }

  useEffect(() => { }, []);
  const addProduct = () => {
    navigate("/addproduct");
  };
  const pageChange = (number) => {
    // e.preventDefault()
    console.log(number.selected + 1);
    //setPage(number.selected + 1);
    setParameters({
      ...parameters,
      "page":number
    })
  };
  const getProducts = async () => {
    let params = {
      page: parameters.page, size: parameters.size, keyword: parameters.keyword
    }
    if (parameters.gender !== "") {
      params.gender = parameters.gender
      
      
    }
    else {
      delete params.gender
    }
    if (parameters.category !== "") {
      params.category =parameters.category
     
    }
    else {
      delete params.category
    }
    if (parameters.subCategory !== "") {
      params.subCategory = parameters.subCategory
      
    }
    else {
      delete params.subCategory
    }
    if (parameters.brand !== "") {
      params.brand = parameters.brand
      
    }
    if (parameters.status !== "") {
      params.deleted = parameters.status
      
    }
    if (parameters.type !== "") {
      params.typeId = parameters.type
    }

    switch (+parameters.sort) {
      case 0:
        delete params.views
        delete params.sales
        params.createdAt = -1
        break;
      case 1:
        delete params.views
        delete params.sales
        params.createdAt = 1
        break;
      case 2:
        delete params.createdAt
        delete params.sales
        params.views = -1
        break;
      case 3:
        delete params.createdAt
        delete params.sales
        params.views = 1
        break;
      case 4:
        delete params.createdAt
        delete params.views
        params.sales = -1
        break;
      case 5:
        delete params.createdAt
        delete params.views
        params.sales = 1
        break;


      default:
        break;
    }
    console.log(params);
    await appContext
      .getAxios()
      .get(path + "admin/products", { params: params })
      .then((res) => {
        console.log(res.data.docs);
        setProducts(res.data.docs);
        setLoading(false)
        console.log(res);
        let item = [];
        setTotalItems(res.data.totalDocs);
        // for (let number = 1; number <= res.data.totalPages; number++){
        //   item.push(
        //     <Pagination.Item key={number} active={number === page} onClick={e=>pageChange(e,number)}>
        //    {  number}
        //   </Pagination.Item>,
        //   )
        // }
        setItems(item);
        console.log(items);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const productDetails = (e, id) => {
    e.preventDefault();
    console.log(id);
    navigate("/products/" + id);
  };
  const modalConfirmOpen = (e,id,stock) =>{
    e.preventDefault()
    let body ={
      title:"Product delete",
      "body":"Do you want to delete product?",
      id:id
    }
    setModalBody(body)
    setConfirmShow(true)

  }
  const modalRevertConfirmOpen = (e,id) =>{
    e.preventDefault()
    let body ={
      title:"Product Restore",
      "body":"Do you want to restore product?",
      id:id
    }
    setModalBody(body)
    setConfirmRevertShow(true)
  }
  const productDelete = async (id) => {
    let params ={
      "id":id,
      deleted:1
    }
    
    await appContext.getAxios().patch(path + "admin/products/",{},{params:params}).then(() => {
      toast.success("Product Deleted")

      getProducts()
      setConfirmShow(false)
    })

  }
  const productUndoDelete = async(id) =>{
    let params ={
      "id":id,
      deleted:0
    }
    
    await appContext.getAxios().patch(path + "admin/products/",{},{params:params}).then(() => {
      toast.success("Product Restored")

      getProducts()
      setConfirmRevertShow(false)
    })

  }

  useEffect(() => {
    console.log(parameters);
  }, [parameters])
  const submitHandle = (e) => {
    e.preventDefault()
   console.log(keyword);
   setParameters({
    ...parameters,
    "keyword":keyword.trim(),
    "page":1
  })
    //getProducts()
  }
  const onInputChange = (e) =>{
    e.preventDefault();
    if(e.target.name==="gender"){
      console.log(e.target.value);
      setParameters({
        ...parameters,
        "gender":e.target.value,
        "page":1
      })
    }
    else if(e.target.name==="category"){
      setParameters({
        ...parameters,
        "category":e.target.value,
        "subCategory":"",
        "type":"",
        "page":1
      })
      setSubCategoryList([])
      setTypeList([])
    }
    else if(e.target.name==="sub-category"){
      setParameters({
        ...parameters,
        "subCategory":e.target.value,
        "type":"",
        "page":1
      })
      setTypeList([])
    }
    else if(e.target.name==="brand"){
      setParameters({
        ...parameters,
        "brand":e.target.value,
        "page":1
      })
    }
    else if(e.target.name==="status"){
      setParameters({
        ...parameters,
        "status":e.target.value,
        "page":1
      })
    }
    else if(e.target.name==="type"){
      setParameters({
        ...parameters,
        "type":e.target.value,
        "page":1
      })
    }
    else if(e.target.name==="sort"){
      setParameters({
        ...parameters,
        "sort":e.target.value,
        "page":1
      })
    }
    else if(e.target.name==="keyword"){
      setParameters({
        ...parameters,
        "keyword":e.target.value,
        "page":1
      })
    }
    
  }
  const modalClose = () =>{
    setConfirmShow(false)
  }
  const modalRevertClose = () =>{
    setConfirmRevertShow(false)
  }

  const clear =(e)=>{
    e.preventDefault()
    setParameters({
      page:1,
    size:20,
    keyword:"",
    gender:"",
    category:"",
    subCategory:"",
    brand:"",
    status:"",
    type:"",
    sort:0,
    })
    setKeyword("")
  }
  return (
    <div className="mt-5">
      <div className="container">
        <h2 className="mb-5">Products</h2>
        <div className="buttons mb-3">
          <button className="button" onClick={addProduct} style={{height:"60px"}}>
            Add Product
          </button>
        </div>
        {/* <button
        onClick={() => setOpen(!open)}
        aria-controls="example-collapse-text"
        aria-expanded={open}
      >
        click
      </button> */}
        {/* <div className="card">
        <div className="filter-name p-4">Filter</div>
        
      </div>
      <Collapse in={open}>
        <div id="example-collapse-text">
          Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus
          terry richardson ad squid. Nihil anim keffiyeh helvetica, craft beer
          labore wes anderson cred nesciunt sapiente ea proident.
        </div>
      </Collapse> */}

        <form >
          <div className="row">
            <div className="col-lg-3 col-12 product-list">
              <div className="form-group">
                <label className="mb-1"> Gender</label>
                <select className="form-select" aria-label="Gender" name="gender" value={parameters.gender} onChange={e => onInputChange(e)}>
                  <option value={""}>All</option>
                  {/* <option hidden selected>Gender</option>/ */}
                  {genderList.map((gend, index) => {
                    return <option key={index} value={gend.id}  >{gend.name}</option>;
                  })}
                </select>
              </div>
            </div>

            <div className="col-lg-3 col-12 product-list">
              <div className="form-group">
                <label className="mb-1"> Status</label>
                <select className="form-select" value={parameters.status} aria-label="sort" name="status" onChange={e => onInputChange(e)}>
                  {/* <option hidden selected>Gender</option>/ */}
                  <option value="">All</option>
                  <option value="1">Deleted</option>
                  <option value="0">Available</option>
                </select>
              </div>
            </div>
            <div className="col-lg-3 col-12 product-list">
              <div className="form-group">
                <label className="mb-1"> Sort</label>
                <select className="form-select" value={parameters.sort} aria-label="sort" name="sort" onChange={e => onInputChange(e)}>
                  {/* <option hidden selected>Gender</option>/ */}
                  {sortList.map((sort, index) => {
                    return <option key={index} value={sort.id}>{sort.name}</option>;
                  })}
                </select>
              </div>
            </div>
            <div className="col-lg-3 col-12 product-list">
              <div className="form-group">
                <label className="mb-1">Search</label>
                <span className="search-input">
                  <input type="text" className="search-text product-search"  name="keyword" value={keyword} onChange={e => setKeyword(e.target.value)} />
                  <span className="input-group-btn pl-1">
                    <button
                      className="btn btn-search ms-2"
                      style={{
                        backgroundColor: "#F7941D",
                        color: "white",
                      }}
                      onClick={e=>submitHandle(e)}
                      
                    >
                      <AiOutlineSearch />
                    </button>
                  </span>
                </span>
              </div>
            </div>
            <div className="col-lg-3 col-12 product-list">
              <div className="form-group">
                <label className="mb-1"> Brand</label>
                <select className="form-select" aria-label="subcategory" value={parameters.brand} name="brand" onChange={e => onInputChange(e)}>
                  <option value={""}>All</option>
                  {/* <option hidden selected>Gender</option>/ */}
                  {brandList.map((sub, index) => {
                    return <option key={index} value={sub._id}>{sub.name}</option>;
                  })}
                </select>
              </div>
            </div>
            <div className="col-lg-3 col-12 product-list">
              <div className="form-group">
                <label className="mb-1"> Category</label>
                <select className="form-select" aria-label="Category" value={parameters.category} name="category" onChange={e => onInputChange(e)}>
                  <option value={""}>All</option>
                  {/* <option hidden selected>Gender</option>/ */}
                  {categoryList.map((cat, index) => {
                    return <option key={index} value={cat.id}>{cat.name}</option>;
                  })}
                </select>
              </div>
            </div>
            <div className="col-lg-3 col-12 product-list">
              <div className="form-group">
                <label className="mb-1"> Sub category</label>
                <select className="form-select" aria-label="subcategory" disabled={subCategoryList.length === 0} value={parameters.subCategory} name="sub-category" onChange={e => onInputChange(e)}>
                  <option value={""}>All</option>
                  {/* <option hidden selected>Gender</option>/ */}
                  {subCategoryList.map((sub, index) => {
                    return <option key={index} value={sub._id}>{sub.name}</option>;
                  })}
                </select>
              </div>
            </div>
            <div className="col-lg-3 col-12 product-list">
              <div className="form-group">
                <label className="mb-1"> Type</label>
                <select className="form-select" aria-label="subcategory" disabled={typeList.length === 0} value={parameters.type} name="type" onChange={e => onInputChange(e)}>
                  <option value={""}>All</option>
                  {/* <option hidden selected>Gender</option>/ */}
                  {typeList.map((sub, index) => {
                    return <option key={index} value={sub._id}>{sub.name}</option>;
                  })}
                </select>
              </div>
            </div>
            <div className="buttons col-lg-12 mt-2">
            <button className="button" onClick={(e)=>clear(e)} style={{height:"60px"}}>
              Clear
            </button>
          </div>
          </div>
        </form>

        <table className="table mt-3 product-table">
          <thead>
            <tr className="product-row">

              <th scope="col" className="index">#</th>
              <th scope="col" className="name">Name</th>
              <th scope="col" className="category">Category</th>
              <th scope="col" className="price">Price</th>
              <th scope="col" className="stock">Stock</th>
              <th scope="col" className="views">Views</th>
              <th scope="col" className="sales">Sales</th>
              <th className="delete"></th>
              <th className="click"></th>
            </tr>
          </thead>
          <tbody className="">
            {products.length > 0 ?
              products.map((prod, index) => {
                return (
                  <tr key={index} className={`${prod.deleted === 1 && 'text-danger'}`}>
                    <th className="" scope="row">{(parameters.page-1)*20+index+1 }</th>
                    <td className="product-name">{prod.productName}</td>
                    <td className="product-category">{prod.category[0]?.name}</td>
                    <td className="product-price">{prod.price}</td>
                    <td className="product-stock">{prod.availableStock}</td>
                    <td className="product-viewcount">{prod.viewCount}</td>
                    <td className="product-salecount">{prod.saleCount}</td>
                    {prod.deleted === 1 ?<td className="down-arrow" onClick={e => modalRevertConfirmOpen(e, prod._id)}><FaTrashRestoreAlt/></td>:<td className="down-arrow" onClick={e => modalConfirmOpen(e, prod._id, prod.availableStock)}><AiFillDelete /></td>}
                    <td><AiFillEye onClick={(e) => productDetails(e, prod._id)} className="down-arrow"/></td>
                  </tr>
                );
              }) :
              loading ? <tr>
                <td colSpan={9}><div class="spinner-border text-warning mt-5" role="status">
                  <span class="sr-only"></span>
                </div> </td>
              </tr> :
                <tr><td colSpan={9}>No products found</td></tr>
            }
          </tbody>
        </table>
        {/* <Pagination>
  {items} */}
        {/* {page !==1 && <Pagination.First />}
      <Pagination.Prev />
      <Pagination.Ellipsis />

      <Pagination.Item>{10}</Pagination.Item>
      <Pagination.Item>{11}</Pagination.Item>
      <Pagination.Item active>{12}</Pagination.Item>
      <Pagination.Item>{13}</Pagination.Item>

      <Pagination.Ellipsis />
      <Pagination.Next />
      <Pagination.Last /> */}
        {/* </Pagination> */}
        {/* <Pagination totalItems={totalItems} paginate={pageChange} isSearch={false} /> */}
        <span className="mb-5 mt-2 d-flex justify-content-between align-items-start">
          {totalItems >0 &&<span className="product-total ps-3">
            {totalItems} products
          </span>}
   
         <span>
            {products.length > 0 && (
              <Paginations
                className="pagination-bar"
                currentPage={+parameters.page}
                totalCount={+totalItems}
                pageSize={+parameters.size}
                onPageChange={(page) => pageChange(+page)}
              />
            )}
          </span>
          </span>  
        
        
      </div>
      <DeleteConfirmModal show={confirmShow} close={modalClose} body={modalBody} confirm={productDelete}/>
      <DeleteConfirmModal show={confirmRevertShow} close={modalRevertClose} body={modalBody} confirm={productUndoDelete}/>
    </div>
  );
};

export default ProductList;
