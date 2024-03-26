
import React from 'react'
import Modal from "react-bootstrap/Modal";

const OrderCancelModal = props => {
 
 const close =(e)=>{
e.preventDefault();
props.close()

 }


  return (
    <div>
      <Modal
        show={props.show}
        size="md"
        aria-labelledby="contained-modal-title-vcenter"

        onHide={props.close}
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Cancel order
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="container">
            <form className="form" id="regForm">

              <div className="form-group mt-4 d-flex justify-content-center">
                <h4 className="my-3">
                  Do you want to cancel the order<span className="text-danger">*</span>
                </h4>

                {/* <button style={{  marginRight:'90px',marginTop:'20px', backgroundColor:'green'}} onClick={props.cancel}>Yes</button>
            <button style={{backgroundColor:'red'}} onClick={props.close} >No</button> */}
              </div>
              <div className="button-container py-4 d-flex justify-content-around">
                <div className="yes-button " >
                  <button className='btn' style={{backgroundColor:'green'}}  onClick={e => props.cancel(e)}>yes</button>

                </div>
                <div className="cancel-button">
                  <button className='btn' style={{backgroundColor:'red'}} onClick={e => close(e)}>No</button>
                </div>

              </div>




            </form>
          </div>
        </Modal.Body>

      </Modal>
    </div>
  )
}

export default OrderCancelModal
