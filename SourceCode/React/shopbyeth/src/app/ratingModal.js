import { Rating } from "primereact/rating";
import React, { useState } from "react";
import { useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { toast } from "react-toastify";
import useAppContext from "../AppContext";
import { FiUpload } from "react-icons/fi";
import {MdClear} from "react-icons/md";
import ProgressBar from "react-bootstrap/ProgressBar";


const RatingModal = (props) => {
  const appContext = useAppContext();
  const baseURL = process.env.REACT_APP_API_ENDPOINT;
  // const baseURL ="http://10.5.22.140:5000/api/"
  const aws_feedback_url ="https://locals3-shopbyeth.innovaturelabs.com/shopbyeth/feedbackImages/"
  const [enableButton, setEnableButton] = useState(false);
  const [feedback, setFeedback] = useState()
  const [contentLoading, setContentLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [rating, setRating] = useState({
    productId: props.id,
    rating: 5,
    review: "",
    reviewTitle: "",
    feedbackImages:[]
  });
  const [imageList, setImageList] = useState([])
  const [error, setError] = useState({
    review: "",
    reviewTitle: "",
  })
  useEffect(()=>{
    console.log(props);
    setImageList([])
    if (props.isRated) {
      console.log(props.isRated);  
      setContentLoading(true)
      myFeedback()
      
    }
    else{
      setRating({
        productId: props.id,
    rating: 5,
    review: "",
    reviewTitle: "",
    feedbackImages:[]
      })
    }
    
  },[props.show])
  useEffect(()=>{
    console.log(rating);
  },[rating])
  const myFeedback = async() =>{
    let path =baseURL+"users/products/myfeedback/"+props.id
    await appContext.getAxios().get(path).then((res)=>{
      console.log(res.data);
    })
    let feedback =props.feedback.find((res)=>{
     return res.userId === localStorage.getItem("accountAddress")
    })
    console.log(feedback);
    setFeedback(feedback)
    setContentLoading(false)
    setRating({
      ...rating,
      rating:feedback.rating,
      review:feedback.review,
      reviewTitle:feedback.reviewTitle
    })
    let newImageArray =[]
    if (feedback?.feedbackImages?.length>0) {
      feedback.feedbackImages.forEach((res)=>{
        newImageArray.push({
          uploadPath:res,
          preview:aws_feedback_url+feedback._id+"/"+res,
          status:100,
          completed:true
        })
      })
    }
    setImageList(newImageArray)

  }
  
  const submitHandle = async (e) => {
    
    e.preventDefault();
    setSubmitLoading(true)
    let flag=false
    let body=rating
    
    setEnableButton(flag)
    console.log(props.isRated);
    if (props.isRated) {
      let imageListArray = []
    imageList.forEach((res)=>{
     
        imageListArray.push(res.uploadPath)
        // body.feedbackImages.push(res.uploadPath)
     
    })
    body.feedbackImages = imageListArray
      await appContext.getAxios().put(baseURL+"users/products/feedback/"+props.id+"/"+feedback._id,body).then((res)=>{
        console.log(res.data);
        setSubmitLoading(false)
        toast.success("Review updated successfully");
        
        close()
        
      }).catch(()=>{
        setSubmitLoading(false)
        setEnableButton(true)
      })
    }
    else{
      let flag=false
      let body = rating
      imageList.forEach((res)=>{
        if (res.uploadPath) {
          body.feedbackImages.push(res.uploadPath)
        }
      })
      setEnableButton(flag)
      console.log(body);
       await appContext
      .getAxios()
      .patch(baseURL + "users/products/feedback", rating)
      .then(() => {
        toast.success("Review added");
        setSubmitLoading(false)
        close()
      }).catch(()=>{
        setEnableButton(true)
        setSubmitLoading(false)
      });
    }
   
    
    
    // props.close();
  };
  const close =() =>{
    setRating({
      productId: props.id,
      rating: 5,
      review: "",
      reviewTitle: "",
      feedbackImages:[]
    })
    setImageList([])
    setError({
      review: "",
      reviewTitle: "",
    })
    setEnableButton(true)
    props.close();
  }
  const onImageChange =async (e) =>{
    e.preventDefault()
    console.log(e.target.files);
    let imageObject = {
      preview:URL.createObjectURL(e.target.files[0]),
      status:0,
      completed:false,
      file:e.target.files[0]
    }
    e.target.value = ""
    
    
    setImageList((prevState)=>(
      [
        ...prevState,
        imageObject
      ]
    ))
    await onImageUpload(imageObject)

  }
  useEffect(()=>{
    // console.log(imageList.find(res=>res.completed ===false));
    console.log(imageList);
  },[imageList])
  const onImageUpload = async(imageObject) =>{
    const form = new FormData()
    form.append("uploadImage",imageObject.file)
    const config = {
      onUploadProgress: (progressEvent) => {
        console.log(
          Math.round((progressEvent.loaded * 100) / progressEvent.total)
        );
        let imageUpdatedObj = imageObject;
        imageUpdatedObj.status = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setImageList([...imageList, imageUpdatedObj]);
      },
    };
    let path = baseURL+"users/products/feedback/image"
    await appContext.getAxios2().post(path,form,config).then((res)=>{
      console.log(res.data);
      let imageCompletedObj = imageObject
      imageCompletedObj.status=101
      imageCompletedObj.completed =true
      imageCompletedObj.uploadPath = res.data.feedbackImage
      setImageList([...imageList, imageCompletedObj]);
    }).catch((error)=>{
      let imageFailObj = imageObject
      imageFailObj.status =-1
      setImageList([...imageList, imageFailObj]);
    })
  }
  
  useEffect(()=>{
    console.log(imageList);
  },[imageList])
  const rateChange = (e) => {
    e.preventDefault();
    setRating({
      ...rating,
      rating: e.value,
    });
  };
  const handleChange = async (e) => {
    e.preventDefault();
    setRating({
      ...rating,
      [e.target.name]: e.target.value,
    });
    validate(e.target.name,e.target.value)
   
    
  };
  const validate =(key,value) =>{

    if (key ==="reviewTitle") {
      if (value.length<1 || value.length>50 ) {
        setError({
          ...error,
          [key]:"Enter valid title"
        })
      }
      else{
        setError({
          ...error,
          [key]:""
        })
      }
    }
    else if(key ==="review"){
      if ( value.length>1000 ) {
        setError({
          ...error,
          [key]:"Enter valid Description"
        })
      }
      else{
        setError({
          ...error,
          [key]:""
        })
      }
    } 
    
  }
  const ratingValidate =async (rating) =>{
    return new Promise((resolve, reject) => {
      let flag = true
      if ( rating.review.length >1000 || rating.reviewTitle.length <1 || rating.reviewTitle.length >50) {
        
        flag= false
      }
      setEnableButton(flag)
      
    })
  }
  useEffect(()=>{
     ratingValidate(rating)
  },[rating])
  const removeImage = (e,index) =>{
    e.preventDefault()
    setImageList([
      ...imageList.slice(0,index),
      ...imageList.slice(index+1,imageList.length)
    ])
  }

  return (
    <Modal size="lg" show={props.show} onHide={close} backdrop="static" dialogClassName="add-rating-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          Rate this product
          <span className="d-flex">
            {" "}
            <Rating
              value={rating.rating}
              onChange={(e) => rateChange(e)}
              stars={5}
              cancel={false}
            />{" "}
            <span
              className={`ms-4 fs-6 ${rating.rating === 1 && "text-danger"}
              ${rating.rating === 2 && "text-warning"}
              ${
                (rating.rating === 3 ||
                  rating.rating === 4 ||
                  rating.rating === 5) &&
                "success"
              }
              `}
            >
              {rating.rating === 5 && "Excellent"}
              {rating.rating === 4 && "Very Good"}
              {rating.rating === 3 && "Good"}
              {rating.rating === 2 && "Poor"}
              {rating.rating === 1 && "Bad"}
            </span>
          </span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className={`container ${contentLoading && "loading-feedback-container"}`}>
          {!contentLoading ? <div className="row">
            <div className="col-1"></div>
            <div className="col-10">
              <div className="form-group mt-4 ">
                <label className="form-label">Title</label>
                <div class="input-group flex-wrap">
                <input
                  type="text"
                  className={`form-control ${error.reviewTitle ? 'is-invalid' : ''}`}
                  name="reviewTitle"
                  value={rating.reviewTitle}
                  onChange={(e) => handleChange(e)}
                  autoComplete="off"
                />
                <div className="invalid-feedback w-100">{error.reviewTitle}</div> 
                </div>
              </div>
              <div className="form-group mt-4">
                <label className="form-label">Description</label>
                <textarea
                  className={`form-control ${error.review ? 'is-invalid' :''}`}
                  id="exampleFormControlTextarea1"
                  rows="3"
                  name="review"
                  value={rating.review}
                  onChange={(e) => handleChange(e)}
                ></textarea>
               
               <div className="invalid-feedback">{error.review}</div>
               
                              
              </div>
              <div className="row my-2">
              {imageList&&
              imageList.map((res,index)=>{
                return(
                  <div className="image-preview " key={index}>
                    {(res.status ===-1 || res.completed) && <button className="image-remove-button" onClick={e=>removeImage(e,index)}><MdClear/></button>}
                    <img className="m-2" src={res.preview} alt="" width={80} height={80}/>
                    {res.status ===-1 &&<ProgressBar variant="danger" now={100}></ProgressBar>}
                    {res.status !==-1 &&  <ProgressBar variant="success" now={res.status}></ProgressBar>}

                  </div>
                )
              })}
              </div>
              <div className="image-container-upload mt-4">
                <div className="image-list">
                <div className="image-upload-button" >
                <label className={` image-label ${imageList.length ===3 && 'image-disable-label'} `}><FiUpload className="upload-icon"/>  <input
                      type="file"
                      accept="image/*"
                      onChange={e=>onImageChange(e)}
                    /></label>
                </div>
                
                </div>
               
              
              </div>
              

              <span className="mt-4 mb-4 d-flex">
                <button
                  type="button"
                  onClick={(e) => submitHandle(e)}
                  disabled={!enableButton || imageList.find(res=>res.completed ===false)}
                  className="btn feedback-button"
                >
                  {submitLoading? <div className="feedback-submit-spinner spinner-border text-warning" role="status">
                            <span className="sr-only"></span>
                          </div>:"Submit"}
                </button>
              </span>
            </div>

            <div className="col-1"></div>
          </div>: <div className="spinner-border text-warning " role="status">
                          <span className="sr-only"></span>
                        </div>}
          {/* <h4>Review</h4> */}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default RatingModal;
