import moment from 'moment';
import { Rating } from 'primereact/rating';
import React from 'react'
import { useState } from 'react';
import { useEffect } from 'react';

import Modal from 'react-bootstrap/Modal';
import ReactImageGallery from 'react-image-gallery';
import useAppContext from '../AppContext';

const ReviewDetailModal = (props) => {
    const base_url = process.env.REACT_APP_API_ENDPOINT;
    const [feedback, setFeedback] = useState()
    const appContext = useAppContext()
    const userId = localStorage.getItem("accountAddress");
    const [images, setImages] = useState(null)
    const [viewMore, setViewMore] = useState(false)
    const aws_feedback_url ="https://locals3-shopbyeth.innovaturelabs.com/shopbyeth/feedbackImages/"
    useEffect(()=>{
      console.log(props);
    },[props.show])
    useEffect(()=>{
        console.log(props.feedback);
        if (props.feedback) {
          let images = props.feedback?.feedbackImages.map((obj) => {
            let name = {
              original: aws_feedback_url + props.feedback._id + "/" + obj,
              thumbnail: aws_feedback_url + props.feedback._id + "/" + obj,
              originalHeight: "390px",
            };
            return name;
          });
          console.log(images);
          setImages(images);
            setFeedback(props.feedback)
        }
    },[props.feedback])
    const close= () =>{
      setViewMore(false)  
      props.close()
        
    }
    const setMore =(e,flag)=>{
      e.preventDefault()
      setViewMore(flag)
    }
    const deleteReview = async (e, id) => {
        e.preventDefault();
        // await appContext
        //   .getAxios()
        //   .delete(base_url + "users/products/feedback/" + params.id + "/" + id)
        //   .then(() => {
        //     toast.success("Review deleted successfully");
        //     getProductDetails();
        //   });
      };
    return (
    <Modal onHide={close}
zl    dialogClassName="modal-image-detail"
    {...props}
    size="xl"
    aria-labelledby="contained-modal-title-vcenter"
    show={props.show}
    centered
  >
    <Modal.Header closeButton>
      <Modal.Title id="contained-modal-title-vcenter">
        Review details
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <div className="container">
      <div className="row">
            <div className="col-8 feedback-image py-2">
           {images && <ReactImageGallery 
                  items={images}
                  showPlayButton={false}
                  showFullscreenButton={false}
                  showNav={false}
                  slideOnThumbnailOver={true}
                  originalClass="feedback-gallery"
                  
               
                >
                  {" "}
                </ReactImageGallery>}
            </div>
            <div className="col-4 ">
                <div className="shadow feedback-view-desc">
                <ul className="list-group list-group-flush">
                    
                <li className="list-group-item py-4" >
                      <div>
                        <div className="d-flex justify-content-between pb-1 ">
                          <span className=" mt-1 fw-bold">
                            {feedback?.reviewTitle}
                          </span>
                          <span>
                            
                          </span>
                        </div>

                        <div className="pb-1">
                          <Rating
                            value={feedback?.rating}
                            readOnly
                            stars={5}
                            cancel={false}
                          />
                        </div>
                        {feedback?.review.length<70&&<div className="rating-desc modal-rating-desc">{feedback?.review.split("\n").map((res, i) => {
                          return (
                            <span key={i}>
                              {res}
                              <br />
                            </span>
                          )
                        })}</div>}
                        {(feedback?.review.length>70&&viewMore)&&<div className="rating-desc modal-rating-desc">{feedback?.review.split("\n").map((res, i) => {
                          return (
                            <span key={i}>
                              {res}
                              <br />
                            </span>
                          )
                        })}
                        <span className="fw-bolder view-button " onClick={e=>setMore(e,false)}>View less</span>
                        </div>}
                        {(feedback?.review.length>70&&!viewMore)&&<div className="rating-desc modal-rating-desc">{feedback?.review.slice(0,70).split("\n").map((res, i) => {
                          return (
                            <span  key={i}>
                              {res}
                              <br />
                            </span>
                          )
                        })}
                          <span className="fw-bolder view-button" onClick={e=>setMore(e,true)}>View more</span>
                        </div>}                          
                        <div className="reviewdate py-2 d-flex">
                          <i className="fa-solid fa-circle-user reviewuser pe-2"></i>
                          <span className="pe-2">{props?.username}</span>
                          {moment(feedback?.date).format("D MMMM YYYY")}
                        </div>
                      </div>
                    </li>
                    </ul>
                </div>
           
            </div>
        </div>
      </div>

      
      
    </Modal.Body>

  </Modal>
  )
}

export default ReviewDetailModal