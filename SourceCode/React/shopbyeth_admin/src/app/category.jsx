import axios from "axios";
import React, { useEffect, useState } from "react";
import useAppContext from "../AppContext";
import AddCategoryModal from "./addCategoryModal";

import { BsCheckLg } from "react-icons/bs";
import { toast } from "react-toastify";

import Paginations from "./pagination";
import {
  AiOutlineDown,
  AiOutlineUp,
  AiOutlineClose,
  AiOutlineCheck,
  AiFillDelete,
  AiFillEye
} from "react-icons/ai";
import {
  AiOutlineSearch
} from "react-icons/ai";
import {  } from "react-icons/io";
import Collapse from "react-bootstrap/esm/Collapse";
import Card from "react-bootstrap/Card";
import { MdModeEditOutline } from "react-icons/md";
import SubCategoryList from "./subCategoryList";
import AddSubCategoryModal from "./addSubCategoryModal";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "./deleteConfirmModal";

const Category = () => {
  const [category, setCategory] = useState([]);
  const [categoryName,setCategoryName] = useState('')
  const [inputShow, setInputShow] = useState(false);
  const appContext = useAppContext();
  const baseURL = process.env.REACT_APP_API_ENDPOINT;
  const [show, setShow] = useState(false);
  const [editShow, setEditShow] = useState(true);
  const [categoryDetail, setCategoryDetail] = useState([]);
  const [selectedId, setSelectedId] = useState();
  const [editSelected, setEditSelected] = useState("");
  const [showSubCategory,setShowSubCategory] = useState(false)
  const navigate = useNavigate()
  const [selectedCategoryId,setSelectedCategoryId] = useState()
  const [loading, setLoading] = useState(true)
  const [confirmShow, setConfirmShow] = useState(false);
  const [error,setError] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [totalPage, setTotalPage] = useState(1);
  const [keyword, setKeyWord] = useState("")
  const [modalBody, setModalBody] = useState({
    title : "",
    body:"",
    id:""
  })
  const [parameters,setParameters] = useState({
    page:1,
    size:20,
    createdAt:-1,
    keyword:"",
    key:1
  })
  const sortList = [
    { id: -1, name: "Newest" },
    { id: 1, name: "Oldest" }
  ]

  useEffect(() => {
    getCategory();
  }, [parameters]);
  useEffect(() => {
    console.log(categoryDetail);
  
    
  }, [categoryDetail])
  

  useEffect(() => {
    console.log(category);
  }, [category]);
  const addCategory = () => {
    setShow(true);
  };
  const categoryClose = () => {
    setShow(false);
    getCategory()
  };
  const subCategoryOpen = (e, id,name) => {
    e.preventDefault();
    navigate("subcategory/"+id,{state:{name:name}})

  };
  const subCategoryClose = (e) =>{
    e.preventDefault()
    setEditShow(true)
  }
  const categeryEditHandle = (e, id,name) => {
    e.preventDefault();
    console.log(id, !inputShow);
    setInputShow(true);
    setEditSelected(id);
    setCategoryName(name)
  };
  const categoryEditClose =(e) =>{
    e.preventDefault()
    setInputShow(false)
    setEditSelected("")
    setError("")
  }
  const categoryNameHandler =(e) =>{
    e.preventDefault()
    if(e.target.value === ""){
      setError("Category name is required")
      console.log('error',error);
    }
    else if(e.target.value.length < 2){
      setError("Category name must contain at least 2 characters")
    }
    else if(e.target.value.length > 30){
      setError("Category name must not exceed 30 characters")
    }
    else{
      setError("")
    }
    setCategoryName(e.target.value)
  }
  useEffect(()=>{
    console.log(categoryName);
  },[categoryName])
  const categoryEditSubmit = async(e,id)=>{
    e.preventDefault()
    let body = {
      "name":categoryName
    }
    await appContext.getAxios().put(baseURL+"admin/category/"+id,body).then(()=>{
      toast.success("Category updated")
      getCategory()
      setInputShow(false)
    })
    setError("")
  } 
  const categoryDelete = async(id) =>{
    console.log('id:',id);

    await appContext.getAxios().delete(baseURL+"admin/category/"+id).then(()=>{
      toast.success("Category deleted")
      getCategory()
    })
    setConfirmShow(false)
  }
  const categoryDetails = (e, id) => {
    e.preventDefault();
    console.log(category);
    let categoryDetail = category.filter((cat) => {
      return cat.id === id;
    });
    setCategoryDetail(categoryDetail[0]);
    setEditShow(true);
  };
  const categoryEdit = (e) => {
    e.preventDefault();
  };
  const getCategory = async () => {
    await axios.get(baseURL + "public/category",{params:parameters}).then((res) => {
      console.log(res);
      setCategory(res.data.docs);
      setTotalItems(res.data.totalDocs)
      setTotalPage(res.data.totalPages)
      setLoading(false)
    });
  };
  const addSubCategoryClose =(e)=>{
    e.preventDefault()
    showSubCategory(false)
  }
  const addSubCategoryOpen = (e)=>{
    e.preventDefault()
    showSubCategory(true)
  }
  const modalClose = () =>{
    setConfirmShow(false)
  }
  const modalConfirmOpen = (e,id) =>{
    e.preventDefault()
    let body ={
      title:"Category delete",
      "body":"Do you want to delete the category?",
      id:id
    }
    setModalBody(body)
    setConfirmShow(true)

  }
  const pageChange = (number) => {
    // e.preventDefault()
    console.log(number.selected + 1);
    //setPage(number.selected + 1);
    setParameters({
      ...parameters,
      "page":number
    })
  };
  const onInputChange = (e) =>{
    e.preventDefault()
    if(e.target.name === "date"){
      setParameters({
        ...parameters,
        "createdAt":e.target.value,
        "page":1
      })
    }
  }
  const submitHandle = (e) => {
    e.preventDefault()
    console.log(keyword);
    setParameters({
      ...parameters,
      "keyword":keyword.trim(),
      "page":1
    })
    
  }
  const clear =(e) =>{
    e.preventDefault();
    setParameters({
      page:1,
    size:20,
    createdAt:-1,
    keyword:"",
    key:1
    })
    setKeyWord("")
  }
  return (
    <>
      <div className="mt-5">
        <div className="container">
          <h2 className="mb-5">Category</h2>
          <div className="buttons mb-3">
            <button className="button" onClick={addCategory} style={{height:"60px"}}>
              Add Category
            </button>
          </div>
          <form >
          <div className="row" style={{ paddingBottom: '2rem' }} >

          
           
            <div className="col-lg-4 col-12 product-list">
              <div className="form-group">
                <label className="mb-1"> Sort</label>
                <select className="form-select" aria-label="sort" value={parameters.createdAt} name="date" onChange={e => onInputChange(e)}>
                {sortList.map((sort, index) => {
                    return <option key={index} value={sort.id}>{sort.name}</option>;
                  })}
                </select>
              </div>
            </div>
            <div className="col-lg-4 col-12 product-list">
              <div className="form-group">
                <label className="mb-1">Search</label>
                <span className="search-input">
                  <input type="text" className=" search-text"
                  value={keyword}
                    onChange={(e) => setKeyWord(e.target.value)}
                     />
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
            <div className="buttons col-lg-4 ">
            <button className="button mt-2" onClick={(e)=>clear(e)} style={{height:"60px"}}>
              Clear
            </button>
          </div>
          </div>
        </form>

          <table className="table category-table">
            <thead>
              <tr className="category-row">
              
                <th scope="col" className="id">
                  id
                </th>
                <th scope="col" className="name">
                  Name
                </th>
                <th className="action-one"> </th>
                <th className="action-two"> </th>
                <th scope="col" className="action-three">
                </th>
              </tr>
            </thead>
            <tbody>
              {category.length>0?
              category.map((cat, index) => {
                return (
                  <React.Fragment key={index}>
                    <tr>
                      
                      <th scope="row">{cat.id}</th>
                      {inputShow && editSelected === cat.id ? (
                        <td>
                          <input
                            type="text"
                            value={categoryName}
                            className={`name-form form-control ${error ? "is-invalid" : ""}`}
                            name=""
                            id=""
                            onChange={e=>categoryNameHandler(e)}
                          />{error ? (
                            <div className="invalid-feedback ">{error}</div>
                          ) : (
                            ""
                          )}
                        </td>
                      ) : (
                        <td className="category-name">{cat.name} </td>
                      )}
                      <td className="edit-action">
                        {inputShow && editSelected === cat.id ? (
                          <span>{!error && <AiOutlineCheck onClick={e=>categoryEditSubmit(e,cat.id)} className="down-arrow"/>}&nbsp;&nbsp;&nbsp;<AiOutlineClose onClick={e=>categoryEditClose(e)} className="down-arrow"/></span>
                        ) : (
                          <span
                            className="down-arrow"
                            onClick={(e) => categeryEditHandle(e, cat.id,cat.name)}
                          >
                            <MdModeEditOutline />
                          </span>
                        )}
                      </td>
                      <td className="edit-action">{inputShow && editSelected === cat.id?'':<AiFillDelete className="down-arrow" onClick={e=>modalConfirmOpen(e,cat.id)}/>}</td>

                      <td><span
                          
                         
                        >
                         <AiFillEye className="down-arrow" onClick={(e) =>subCategoryOpen(e, cat.id,cat.name)}/>
                        </span></td>
                    </tr>
                    {!editShow && selectedId === cat.id && (
                      <tr>
                        <td colSpan={5}>
                          <Collapse in={!editShow && selectedId === cat.id}>
                            <div className="card">
                              <SubCategoryList categoryDetail={categoryDetail} getCategory={getCategory}/>
                            </div>
                          </Collapse>
                        </td>
                        
                      </tr>
                    )}
                  </React.Fragment>
                );
              }):
              loading ? <tr>
                  <td colSpan={7}><div class="spinner-border text-warning mt-5" role="status">
                    <span class="sr-only"></span>
                  </div> </td>
                </tr> :
                  <tr><td colSpan={7}>No category found </td></tr>}
            </tbody>
          </table>
          <span>
            {category.length > 0 && (
              <Paginations
                className="pagination-bar"
                currentPage={+parameters.page}
                totalCount={+totalItems}
                pageSize={+parameters.size}
                onPageChange={(page) => pageChange(+page)}
              />
            )}
          </span>
        </div>
      </div>
      <AddCategoryModal show={show} close={categoryClose} />
      <DeleteConfirmModal show={confirmShow} close={modalClose} body={modalBody} confirm={categoryDelete}/>
    </>
  );
};

export default Category;
