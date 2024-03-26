import React, { useEffect } from "react";
import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import useAppContext from "../AppContext";
import { toast } from "react-toastify";


const AddCategoryModal = (props) => {
  const appContext = useAppContext()
  const baseURL = process.env.REACT_APP_API_ENDPOINT
  const [enableButton,setEnableButton] = useState(false)
  const [category,setCategory] = useState({"name":''})
  const [error, setError] = useState("")
  const onInputChange= (e) =>{
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
      setEnableButton(false)
    }
    else{
      setError("")
    }
    setCategory({"name":e.target.value})
  }
  useEffect(() => {
    let flag = true
    if(category.name.length<2){
      flag = false
    }
    else if (category.name.length>30) {
      flag = false
    }
    setEnableButton(flag)
   
    
  }, [category])
  // useEffect(()=>{
  //   setError("")
  // })
  
  const submitHandle = async(e)=>{
    e.preventDefault()
    await appContext.getAxios().post(baseURL+"admin/category",category).then((res)=>{
      toast.success("Category created")
      close()
    })
  }
  const close = () => {
    setError("");
    setEnableButton(false)
    props.close()
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
          Add Category
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form className="form" id="regForm">
          <div className="row">
            <div className="col-lg-1"></div>
            <div className="col-lg-10">
            <div className="form-group mt-4">
              <label className="mb-2">
                Category name<span className="text-danger">*</span>
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
                  <button className={`button ${!enableButton && 'disableButton'}`} disabled={!enableButton} onClick={e=>submitHandle(e)} style={{height:"60px"}}>Submit</button>
                </div>
            </div>
            <div className="col-lg-1"></div>
            
          </div>
         
        </form>
      </Modal.Body>

    </Modal>
  );
};

export default AddCategoryModal;
