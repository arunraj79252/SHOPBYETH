import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import useAppContext from '../AppContext'
import Modal from "react-bootstrap/Modal";

const AddBrandModal = props => {
    const appContext = useAppContext()
    const baseURL = process.env.REACT_APP_API_ENDPOINT
    const [enableButton,setEnableButton] = useState(false)
    const [brand,setBrand] = useState({"name":''})
    const [error,setError] = useState("")
    const onInputChange= (e) =>{  
      e.preventDefault()
      if(e.target.value === ""){
        setError("Brand name is required")
        console.log('error',error);
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
        setEnableButton(true)
      }
      setBrand({"name":e.target.value})
    }
    useEffect(() => {
      
      
    console.log(enableButton);
      
    }, [brand])
    
    const submitHandle = async(e)=>{
      e.preventDefault()
      await appContext.getAxios().post(baseURL+"admin/brand",brand).then((res)=>{
        toast.success("Brand created")
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
        Add Brand
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <form className="form" id="regForm">
        <div className="row">
          <div className="col-lg-1"></div>
          <div className="col-lg-10">
          <div className="form-group mt-4">
            <label className="mb-2">
              Brand name<span className="text-danger">*</span>
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
  )
}



export default AddBrandModal