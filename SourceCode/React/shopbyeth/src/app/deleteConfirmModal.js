import React from 'react'
import Modal from "react-bootstrap/Modal";

const DeleteConfirmModal = (props) => {
    const close = (e) =>{
        e.preventDefault()
        props.close()
    }
    const confirm= (e) =>{
        e.preventDefault()
        props.confirm(props.body.id)
    }
  return (
    <Modal
        show={props.show}
        size="md"
        aria-labelledby="contained-modal-title-vcenter"
        onHide={props.close}
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            {props.body.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className='container'>
            <form className="form" id="regForm">
              <div className="row">
                <div className="col-lg-1"></div>
                <div className="col-lg-10">
                  <div className="form-group mt-4">
                    <h4 className="mb-2">
                      {props.body.body}<span className="text-danger"></span>
                    </h4>
                    <div className="button-container py-4 d-flex justify-content-around">
                      <button className='btn' style={{ backgroundColor: 'green' }} onClick={e => confirm(e)}>Yes</button>
                      <button className='btn' style={{ backgroundColor: 'red' }} onClick={e => close(e)} >No</button>
                    </div>
                  </div>

                </div>


              </div>

            </form>
          </div>
        </Modal.Body>

      </Modal>
  )
}

export default DeleteConfirmModal