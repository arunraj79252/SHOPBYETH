import axios from "axios";
import React, { useState } from "react";
import { useEffect } from "react";
import { AiFillDelete, AiOutlineCheck, AiOutlineClose,AiOutlineSearch } from "react-icons/ai";
import { MdModeEditOutline } from "react-icons/md";
import { toast } from "react-toastify";
import useAppContext from "../AppContext";
import AddBrandModal from "./addBrandModal";
import DeleteConfirmModal from "./deleteConfirmModal";
import Paginations from "./pagination";
const BrandList = () => {
    const appContext = useAppContext()
  const baseURL = process.env.REACT_APP_API_ENDPOINT;
  const [brandList, setBrandList] = useState([]);
  const [inputShow, setInputShow] = useState(false);
  const [editSelected, setEditSelected] = useState("");
  const [brandName,setBrandName] = useState("")
  const [show,setShow] = useState(false);
  const [loading, setLoading] = useState(true)
  const [confirmShow, setConfirmShow] = useState(false);
  const [error,setError] = useState("");
  const [enableButton,setEnableButton] = useState(true);
  const [modalBody, setModalBody] = useState({
    title : "",
    body:"",
    id:""
  })
  const [keyword, setKeyWord] = useState("")
  const [parameters,setParameters] = useState({
    page:1,
    size:20,
    createdAt:-1,
    keyword:"",
    key:1
  })
  const [totalItems, setTotalItems] = useState(0);
  const [totalPage, setTotalPage] = useState(1);
  const addBrand = () => {
    setShow(true)
  };
  const getBrand = async () => {
    await axios.get(baseURL + "public/brand",{params:parameters}).then((res) => {
      console.log(res.data);
      setBrandList(res.data.docs);
      setTotalItems(res.data.totalDocs)
      setTotalPage(res.data.totalPages)
      setLoading(false)
    });
  };
  const brandClose= ()=>{
    console.log("www");
    setShow(false)
    getBrand()
  }
  const brandEditClose = (e) =>{
    e.preventDefault()
    setInputShow(false)
    setError("")
  } 
  const sortList = [
    { id: -1, name: "Newest" },
    { id: 1, name: "Oldest" }
  ]
  const brandEditHandle = (e,id,name)=>{
    console.log(id,name);
    setBrandName(name)
    setEditSelected(id)
    setInputShow(true)
    e.preventDefault()
  }
  useEffect(() => {
    getBrand();
  }, [parameters]);
  useEffect(() => {
    
    console.log("error",error);
  }, [brandName]);
  const brandDelete = async (id) =>{
    
    await appContext.getAxios().delete(baseURL+"admin/brand/"+id).then(()=>{
        toast.success("Brand is deleted")
        getBrand()
    })
    setConfirmShow(false)
  }
  const brandNameHandler = (e) =>{
    e.preventDefault()
    if(e.target.value === ""){
      setError("Brand name is required")
      setEnableButton(false)
    }
    else if(e.target.value.length < 2){
      setError("Brand name must contain at least 2 characters")
      setEnableButton(false)

    }
    else if(e.target.value.length > 30){
      setError("Brand name must not exceed 30 characters")
      setEnableButton(false)
      
    }
    else{
      setError("")
    }
    setBrandName(e.target.value)
    
  }
  
  const brandEditSubmit = async(e, id) => {
    e.preventDefault()
    let body ={
        "name":brandName
    }
    await appContext.getAxios().put(baseURL+"admin/brand/"+id,body).then(()=>{
        toast.success("Brand is edited")
        getBrand()
        setInputShow(false)
    })
    setError("")
  };
  const modalConfirmOpen = (e,id) =>{
    e.preventDefault()
    let body ={
      title:"Brand delete",
      "body":"Do you want to delete the brand?",
      id:id
    }
    setModalBody(body)
    setConfirmShow(true)

  }
  const modalClose = () =>{
    setConfirmShow(false)
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
  const submitHandle = (e) => {
    e.preventDefault()
    console.log(keyword);
    setParameters({
      ...parameters,
      "keyword":keyword.trim(),
      "page":1
    })
    
  }
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
          <h2 className="mb-5">Brands</h2>
          <div className="buttons mb-3">
            <button className="button" onClick={addBrand} style={{height:"60px"}}>
              Add Brand
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
          <table className="table brand-table">
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
              </tr>
            </thead>
            <tbody>
              {brandList.length>0?
              brandList.map((res, index) => {
                return (
                  <tr key={index}>
                    <th scope="row">{res._id}</th>
                    {inputShow && editSelected === res._id ? (
                        <td>
                          <input
                            type="text"
                            value={brandName}
                            className={`name-form form-control ${error ? "is-invalid" : ""}`}
                            name=""
                            id=""
                            onChange={e=>brandNameHandler(e)}
                          />
                          {error ? (
                        <div className="invalid-feedback ">{error}</div>
                      ) : (
                        ""
                      )}
                        </td>
                      ) : (
                        <td className="brand-name">{res.name} </td>
                      )}
                    <td className="edit-action">
                      {inputShow && editSelected === res._id ? (
                        <span>
                          
                          {!error &&<AiOutlineCheck 
                            onClick={(e) => brandEditSubmit(e, res._id)}
                            className="down-arrow"
                          />}
                         
                          
                          &nbsp;&nbsp;&nbsp;
                          <AiOutlineClose
                            onClick={(e) => brandEditClose(e)}
                            className="down-arrow"
                          />
                        </span>
                      ) : (
                        <span
                          className="down-arrow"
                          onClick={(e) =>
                            brandEditHandle(e, res._id, res.name)
                          }
                        >
                          <MdModeEditOutline />
                        </span>
                      )}
                    </td>
                  
                    <td>{inputShow && editSelected === res._id?'':<AiFillDelete className="down-arrow" onClick={e=>modalConfirmOpen(e,res._id)}/>}</td>
                    
                  </tr>
                );
              }):
              loading ? <tr>
                  <td colSpan={4}><div class="spinner-border text-warning mt-5" role="status">
                    <span class="sr-only"></span>
                  </div> </td>
                </tr> :
                  <tr><td colSpan={4}>No brand found</td></tr>
              }
            </tbody>
          </table>
          <span>
            {brandList.length > 0 && (
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
      <AddBrandModal show={show} close={brandClose}/>
      <DeleteConfirmModal show={confirmShow} close={modalClose} body={modalBody} confirm={brandDelete}/>
    </>
  );
};

export default BrandList;
