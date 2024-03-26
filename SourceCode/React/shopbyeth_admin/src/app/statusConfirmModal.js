import React from 'react'
import Modal from "react-bootstrap/Modal";
import useAppContext from "../AppContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
const StatusConfirmModal = (props) => {
  const appContext = useAppContext()
  const path = process.env.REACT_APP_API_ENDPOINT;
  const navigate = useNavigate();
  console.log(props.status);

  const close = (e) => {
    e.preventDefault();
    props.close()

  }
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
                      {props.body.body}<span className="text-danger">*</span>
                    </h4>
                    <div className="button-container py-4 d-flex justify-content-around">
                      <button style={{ backgroundColor: 'green' }} onClick={e => props.yes(e)}>Yes</button>
                      <button style={{ backgroundColor: 'red' }} onClick={e => close(e)} >No</button>
                    </div>
                  </div>

                </div>


              </div>

            </form>
          </div>
        </Modal.Body>

      </Modal>
    </div>
  )
}

export default StatusConfirmModal
