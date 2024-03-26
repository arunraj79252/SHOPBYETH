
import Modal from "react-bootstrap/Modal";
import React, { useEffect } from "react";
import { useState } from "react";
const OrderCancelModal = props => {
    const cancelOrder=()=>{
        console.log(props.id);
    }
    useEffect(()=>{
        console.log(props.id);
        // let a=appContext.isLoggedIn()
        
        
        
      },[])
  return (
    <div>
       <Modal 
    show={props.show}
    size="md"
    aria-labelledby="contained-modal-title-vcenter"
    centered
    onHide={props.close}
  >
    <Modal.Header closeButton>
      <Modal.Title id="contained-modal-title-vcenter">
        Cancel order
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <form className="form" id="regForm">
        <div className="row">
          <div className="col-lg-1"></div>
          <div className="col-lg-10">
          <div className="form-group mt-4">
            <h4 className="mb-2">
              Do you want to cancel the order<span className="text-danger">*</span>
            </h4>
            <button style={{  marginRight:'90px',marginTop:'20px', backgroundColor:'green'}} onClick={cancelOrder}>Yes</button>
            <button style={{backgroundColor:'red'}}>No</button>
          </div>
          
          </div>
          <div className="col-lg-1"></div>
          
        </div>
       
      </form>
    </Modal.Body>

  </Modal>
    </div>
  )
}

export default OrderCancelModal
