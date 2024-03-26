import React, { useEffect } from 'react'
import Modal from "react-bootstrap/Modal";
import useAppContext from "../AppContext";
import { toast } from "react-toastify";
import { useState } from 'react';

const AddSubCategoryModal = (props) => {
   
  const appContext = useAppContext()
  const baseURL = process.env.REACT_APP_API_ENDPOINT
  const [enableButton,setEnableButton] = useState(false);
  const [error,setError] = useState("");
  const [subCategory,setSubCategory] = useState({"name":''})
  const onInputChange= (e) =>{
    e.preventDefault()
    if(e.target.value === ""){
      setError("Subcategory name is required")
      setEnableButton(false)
    }
    else if(e.target.value.length < 2){
      setError("Subcategory name must contain at least 2 characters")
      setEnableButton(false)

    }
    else if(e.target.value.length > 30){
      setError("Subcategory name must not exceed 30 characters")
      setEnableButton(false)
      
    }
    else{
      setError("")
      setEnableButton(true)
    }
    setSubCategory({"name":e.target.value})
  }
  useEffect(() => {
  
    
  }, [subCategory])
  
  const submitHandle = async(e)=>{
    e.preventDefault()
    let body ={
      "categoryId":props.id,
      "name":subCategory.name
    }
    await appContext.getAxios().post(baseURL+"admin/category/subcategory",body).then(()=>{
      toast.success("sub Category created")
      props.close()
    })
    setError("")
  }
  const close = () =>{
    setError("");
    setEnableButton(false)
    props.close();
  }
  return (
    <Modal
      show={props.show}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      onHide={close}
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Add Sub category
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form className="form" id="regForm">
          <div className="row">
            <div className="col-lg-1"></div>
            <div className="col-lg-10">
            <div className="form-group mt-4">
              <label className="mb-2">
                Sub category name<span className="text-danger">*</span>
              </label>
              <input
                name="name"
                type="text"
                autoComplete="off"
                placeholder=""
                className={`form-control ${error ? "is-invalid" : ""}`}
                onChange={(e) => onInputChange(e)}
              />
              {error ? (
                        <div className="invalid-feedback ">{error}</div>
                      ) : (
                        ""
                      )}
            </div>
            <div className="login-button mt-4 mb-3">
                  <button className={`button ${!enableButton && 'disableButton'}`} disabled={!enableButton} onClick={e=>submitHandle(e)}>Submit</button>
                </div>
            </div>
            <div className="col-lg-1"></div>
            
          </div>
         
        </form>
      </Modal.Body>

    </Modal>
  );
}

export default AddSubCategoryModal