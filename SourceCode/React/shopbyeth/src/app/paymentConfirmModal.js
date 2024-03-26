import React from 'react'
import Modal from "react-bootstrap/Modal";

const PaymentConfirmModal = (props) => {
  return (
    <Modal
    show={props.show}
    dialogClassName='confirm-modal'
    size="lg"
    centered
    aria-labelledby="contained-modal-title-vcenter"
    
  >

    <Modal.Body>
      <div className='container'>

          <div className="row">
           <div className="col-lg-1"></div>
           <div className="col-lg-10 pt-5">
            <h5 className='text-center'>Please confirm the metamask transaction to continue</h5>
            <div className="text-center ">
            <div className="spinner-border text-warning text-center my-3" role="status">
                    </div>
            </div>
            
           </div>
           <div className="col-lg-1"></div>

          </div>

      </div>
    </Modal.Body>

  </Modal>
  )
}

export default PaymentConfirmModal