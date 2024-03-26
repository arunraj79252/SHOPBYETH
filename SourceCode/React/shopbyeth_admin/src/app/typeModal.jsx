import Modal from "react-bootstrap/Modal";
import React from "react";
import { useState } from "react";
import useAppContext from "../AppContext";
import { useEffect } from "react";
import { AiFillDelete, AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import { MdModeEditOutline } from "react-icons/md";
import { toast } from "react-toastify";
import DeleteConfirmModal from "./deleteConfirmModal";

const TypeModal = (props) => {
  const appContext = useAppContext();
  const [inputShow, setInputShow] = useState(false);
  const [editSelected, setEditSelected] = useState("")
  const [typeName, setTypeName] = useState("")
  const baseURL = process.env.REACT_APP_API_ENDPOINT;
  const [type, setType] = useState("");
  const [typeList, setTypeList] = useState([]);
  const [confirmShow, setConfirmShow] = useState(false);
  const [error,setError] = useState("");
  const [typeError,setTypeError] = useState("");
  const [modalBody, setModalBody] = useState({
    title : "",
    body:"",
    id:""
  })
  const onInputChange = (e) => {
    e.preventDefault();
    if(e.target.value === ""){
      setError("Type name is required")
      console.log('error',error);
    }
    else if(e.target.value.length < 2){
      setError("Type name must contain at least 2 characters")
    }
    else if(e.target.value.length > 30){
      setError("Type name must not exceed 30 characters")
    }
    else{
      setError("")
    }
    setType(e.target.value);
  };

  useEffect(()=>{
    console.log(typeName,editSelected);
  },[typeName,editSelected])
  const submitHandle = async (e) => {
    e.preventDefault();
    let body = {
      type: type,
    };
    await appContext
      .getAxios()
      .post(baseURL + "admin/type/" + props.id, body)
      .then((res) => {
        getType();
        setType("")
      });
      setError("")
  };
  useEffect(() => {
    if (props.show ) {
      getType();
    }
  }, [props.id,props.show]);
  const getType = async () => {
    await appContext
      .getAxios()
      .get(baseURL + "public/type/" + props.id)
      .then((res) => {
        setTypeList(res.data);
      });
  };
  const typeNameHandler = (e) =>{
    e.preventDefault()
    if(e.target.value === ""){
      setTypeError("Type name is required")
      console.log('error',error);
    }
    else if(e.target.value.length < 2){
      setTypeError("Type name must contain at least 2 characters")
    }
    else if(e.target.value.length > 30){
      setTypeError("Type name must not exceed 30 characters")
    }
    else{
      setTypeError("")
    }
    setTypeName(e.target.value)

  }
  const typeEditSubmit = async(e,id) =>{
    e.preventDefault()

    let body = {
      "type" : typeName,
      "typeId":id
    }
    await appContext.getAxios().put(baseURL+"admin/type/"+props.id,body).then(()=>{
      getType()
      typeEditClose(e)
      toast.success("Type edited successfully")

    })
    setTypeError("")
  }
  const typeDelete =async(id) =>{
    
    let params = {
      "typeId":id,
      "id":props.id
    }
    await appContext.getAxios().delete(baseURL+"admin/type/",{params:params}).then(()=>{
      getType()
      toast.success("Type deleted successfully")
    })
    setConfirmShow(false)
  }
  const typeEditClose = (e) =>{
    e.preventDefault()
    setInputShow(false)
    setEditSelected("")
    setTypeError("")
  }
  const typeEditHandle = (e,id,name) =>{
    e.preventDefault()
    setEditSelected(id)
    setTypeName(name)
    setInputShow(true)
  }
  const close = () =>{
    props.close()
    setTypeList([])
    setInputShow(false)
    setError("")
    setType("")

  }
  const modalConfirmOpen = (e,id) =>{
    e.preventDefault()
    let body ={
      title:"Type delete",
      "body":"Do you want to delete the type?",
      id:id
    }
    setModalBody(body)
    setConfirmShow(true)

  }
  const modalClose = () =>{
    setConfirmShow(false)
  }
  return (
    <>
    <Modal
      show={props.show}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      onHide={close}
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">Add Type</Modal.Title>
      </Modal.Header>
      <Modal.Body>
      
        <form className="form" id="regForm">
          <div className="row">
            <div className="col-lg-1"></div>
            <div className="col-lg-10">
            <h4 className="type-heading">{props.name}</h4>
              <div className="form-group mt-4">
                <div className="row">
                  <label className="mb-2">
                    Type name<span className="text-danger">*</span>
                  </label>
                  <div className="col-lg-9">
                    <input
                      name="name"
                      type="text"
                      autoComplete="off"
                      placeholder=""
                      value={type}
                      className={`form-control ${error ? "is-invalid" : ""}`}
                      onChange={(e) => onInputChange(e)}
                    />
                    {error ? (
                        <div className="invalid-feedback ">{error}</div>
                      ) : (
                        ""
                      )}
                  </div>
                  <div className="col-lg-3">
                    <button
                      className={`button type-button ${
                        error && "disableButton"
                      }`}
                      disabled={error}
                      onClick={(e) => submitHandle(e)}
                    >
                      Submit
                    </button>
                  </div>
                  <table className="table mt-4 type-table">
                    <thead>
                      <tr className="type-row">
                        <th scope="col" className="id ">
                          id
                        </th>
                        <th scope="col" className="name ">
                          Name
                        </th>
                        <th className="action-one"> </th>
                        <th className="action-two"> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {!typeList.length > 0 ? (
                        <tr>
                          <td className="text-center" colSpan={4}>No Types</td>
                        </tr>
                      ) : (
                        
                        typeList.map((res, index) => {
                          return (
                            <tr key={index}>
                              <th className="type-id">{res._id}</th>
                              {inputShow && editSelected === res._id ? (
                                <td>
                                  <input
                                    type="text"
                                    value={typeName}
                                    className={`name-form form-control ${typeError ? "is-invalid" : ""}`}
                                    name=""
                                    id=""
                                    onChange={(e) => typeNameHandler(e)}
                                  />
                                  {typeError ? (
                            <div className="invalid-feedback ">{typeError}</div>
                          ) : (
                            ""
                          )}
                                </td>
                              ) : (
                                <td className="type-name">{res.name}</td>
                              )}
                              <td className="edit-action">
                                {inputShow && editSelected === res._id ? (
                                  <span>
                                    {!typeError && <AiOutlineCheck
                                      onClick={(e) =>
                                        typeEditSubmit(
                                          e,
                                          res._id,
                                        )
                                      }
                                      className="down-arrow"
                                    />}
                                    &nbsp;&nbsp;&nbsp;
                                    <AiOutlineClose
                                      onClick={(e) => typeEditClose(e)}
                                      className="down-arrow"
                                    />
                                  </span>
                                ) : (
                                  <span
                                    className="down-arrow"
                                    onClick={(e) =>
                                      typeEditHandle(
                                        e,
                                        res._id,
                                        res.name
                                      )
                                    }
                                  >
                                    <MdModeEditOutline />
                                  </span>
                                )}
                              </td>
                              <td>
                                {inputShow && editSelected === res._id ? (
                                  ""
                                ) : (
                                  <AiFillDelete
                                    className="down-arrow"
                                    onClick={(e) =>
                                      modalConfirmOpen(e, res._id)
                                    }
                                  />
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="col-lg-2"></div>
              <div className="login-button mt-4 mb-3">
                {/* <button className={`button ${!enableButton && 'disableButton'}`} disabled={!enableButton} onClick={e=>submitHandle(e)}>Submit</button> */}
              </div>
            </div>
            <div className="col-lg-1"></div>
          </div>
        </form>
      </Modal.Body>
    </Modal>
    <DeleteConfirmModal show={confirmShow} close={modalClose} body={modalBody} confirm={typeDelete}/>

    </>
  );
};

export default TypeModal;
