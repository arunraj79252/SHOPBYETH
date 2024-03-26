import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { MdModeEditOutline } from "react-icons/md";
import useAppContext from "../AppContext";
import { AiOutlineClose, AiOutlineCheck, AiFillDelete, AiFillEye } from "react-icons/ai";
import { IoMdAddCircle } from "react-icons/io";
import AddSubCategoryModal from "./addSubCategoryModal";
import { toast } from "react-toastify";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TypeModal from "./typeModal";
import DeleteConfirmModal from "./deleteConfirmModal";
const SubCategoryList = () => {
  const appContext = useAppContext();
  const baseURL = process.env.REACT_APP_API_ENDPOINT;
  const [categoryName, setCategoryName] = useState();
  const [subCategory, setSubCategory] = useState([]);
  const [inputShow, setInputShow] = useState(false);
  const [editSelected, setEditSelected] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [selectedCategoryId,setSelectedCategoryId] = useState()
  const [showSubCategory,setShowSubCategory] = useState(false)
  const [typeId,setTypeId] = useState('')
  const [typeName, setTypeName] = useState("")
  const [typeShow,setTypeShow] = useState(false)
  const params = useParams()
  let categoryId= params.id
  const navigate = useNavigate;
  const [error,setError] = useState("");
  const [loading, setLoading] = useState(true)
  const [confirmShow, setConfirmShow] = useState(false);
  const location = useLocation()
  const [modalBody, setModalBody] = useState({
    title : "",
    body:"",
    id:""
  })
  useEffect(() => {
    getSubCategory()
    console.log(location);
    setCategoryName(location?.state?.name)

  }, []);
  const getSubCategory =async()=>{
    await axios.get(baseURL+"public/category/"+categoryId).then((res)=>{
        console.log(res.data);
        setSubCategory(res.data.docs)
        setLoading(false)
    })
  }

  const addSubCategory = (e) => {
    e.preventDefault();
    setShowSubCategory(true)
  };
  const addSubCategoryClose = () =>{
    setShowSubCategory(false)
    getSubCategory()
    

  }
  const subCategoryEditSubmit = async(e, id ,categoryId) => {
    e.preventDefault();
    let body = {
    "categoryId":params.id,
      "name": subCategoryName,
    };
    await appContext.getAxios().put(baseURL+"admin/category/subcategory/"+id,body).then(()=>{
      toast.success("sub category Updated")
      setInputShow(false)
      getSubCategory()
    })
    setError("")
  };
  const subCategoryEditClose = (e) => {
    e.preventDefault();
    setInputShow(false);
    setEditSelected("");
    setError("")
  };
  const subCategeryEditHandle = (e, id, name) => {
    e.preventDefault();
    console.log(id, !inputShow);
    setInputShow(true);
    setEditSelected(id);
    setSubCategoryName(name);
  };
  const subCategoryDelete = async(id) => {
    
    await appContext.getAxios().delete(baseURL+"admin/category/subcategory/"+id).then(()=>{
        toast.success("Sub category deleted")
        getSubCategory()
    })
    setConfirmShow(false)
  };
  const subCategoryNameHandler = (e) =>{
    e.preventDefault()
    if(e.target.value === ""){
      setError("Subcategory name is required")
      console.log('error',error);
    }
    else if(e.target.value.length < 2){
      setError("Subcategory name must contain at least 2 characters")
    }
    else if(e.target.value.length > 30){
      setError("Subategory name must not exceed 30 characters")
    }
    else{
      setError("")
    }
    setSubCategoryName(e.target.value)
  }
  const typeOpen = (e,id,name) =>{
    e.preventDefault()
    setTypeShow(true)
    setTypeId(id)
    setTypeName(name)

  }
  const typeClose = () =>{
    setTypeShow(false)
  }
  const modalConfirmOpen = (e,id) =>{
    e.preventDefault()
    let body ={
      title:"Subcategory delete",
      "body":"Do you want to delete the subcategory?",
      id:id
    }
    setModalBody(body)
    setConfirmShow(true)

  }
  const modalClose = () =>{
    setConfirmShow(false)
  }
  return (
    <div className="mt-5">
      <div className="container">
        <div className="row">
          <div className="col-1"></div>
          <div className="col-10">
          <h4 className="mb-5 text-start name-break" >{categoryName} 
          {/* <button className="btn add-button" onClick={(e) => addSubCategory(e)} data-toggle="tooltip" data-placement="top" title="Add Sub category" >
                          <IoMdAddCircle />
                        </button> */}
                        </h4>
        {/* <div className="buttons mb-3">
          <button className="button" onClick={(e) => addSubCategory(e)}>
            add SubCategory
          </button>
        </div> */}
        <div className="row">
          <div className="col-lg-8"></div>
          <div className="col-lg-4">
          <div className="buttons mb-3">
            <button className="button" onClick={addSubCategory} style={{height:"60px"}}>
              add subcategory
            </button>
            </div>
          </div>
        </div>
        <div className="table-container">
          <table className="table subcategory-table">
            <thead>
              <tr>
                
                <th scope="col" className="id">
                  id
                </th>
                <th scope="col" className="name">
                  Name
                </th>
                <th className="action-one"> </th>
                <th className="action-two"> </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {subCategory.length > 0 ? (
                subCategory.map((sub, index) => {
                  return (
                    <tr key={index}>
                      <th className="sub-id">{sub._id}</th>
                      {inputShow && editSelected === sub._id ?
                      <td>
                      <input
                        type="text"
                        value={subCategoryName}
                        className={`name-form form-control ${error ? "is-invalid" : ""}`}
                        name=""
                        id=""
                        onChange={e=>subCategoryNameHandler(e)}
                      />
                      {error ? (
                            <div className="invalid-feedback ">{error}</div>
                          ) : (
                            ""
                          )}
                    </td>:
                      <td className="sub-name">{sub.name}</td>}
                      <td className="edit-action">
                        {inputShow && editSelected === sub._id ? (
                          <span>
                            {!error && <AiOutlineCheck
                              onClick={(e) => subCategoryEditSubmit(e, sub._id,sub.categoryId)}
                              className="down-arrow"
                            />}
                            &nbsp;&nbsp;&nbsp;
                            <AiOutlineClose
                              onClick={(e) => subCategoryEditClose(e)}
                              className="down-arrow"
                            />
                          </span>
                        ) : (
                          <span
                            className="down-arrow"
                            onClick={(e) =>
                              subCategeryEditHandle(e, sub._id, sub.name)
                            }
                          >
                            <MdModeEditOutline />
                          </span>
                        )}
                      </td>
                      <td>
                        {inputShow && editSelected === sub._id ? (
                          ""
                        ) : (
                          <AiFillDelete
                            className="down-arrow"
                            onClick={(e) => modalConfirmOpen(e, sub._id)}
                          />
                        )}
                      </td>
                      <th><AiFillEye className="down-arrow" onClick={e =>typeOpen(e,sub._id,sub.name)}/></th>

                    </tr>
                  );
                })
              ) : loading ? <tr>
              <td colSpan={4}> 
              <div class="spinner-border text-warning mt-5" role="status">
                    <span class="sr-only"></span>
                  </div></td>
            </tr>:(
                <tr>
                  <td colSpan={4}> No Sub Category</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          </div>
          <div className="col-1"></div>
        </div>
        
      </div>
      <AddSubCategoryModal id={params.id} show={showSubCategory} close={addSubCategoryClose}/>
      <TypeModal id={typeId} show={typeShow} close={typeClose} name={typeName}/>
      <DeleteConfirmModal show={confirmShow} close={modalClose} body={modalBody} confirm={subCategoryDelete}/>
    </div>
  );
};

export default SubCategoryList;
