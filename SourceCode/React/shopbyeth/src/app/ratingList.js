import axios from "axios";
import moment from "moment";
import { Rating } from "primereact/rating";
import React, { useEffect, useState } from "react";
import ProgressBar from "react-bootstrap/esm/ProgressBar";
import { IoMdStar } from "react-icons/io";
import { Link, useLocation, useParams } from "react-router-dom";

import { toast } from "react-toastify";
import useAppContext from "../AppContext";
import Paginations from "./pagination";
import RatingModal from "./ratingModal";
import ReviewDetailModal from "./reviewDetailModal";

const RatingList = () => {
  const appContext = useAppContext();
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const aws_url = process.env.REACT_APP_AWS_ENDPOINT;
  const [showRatingImage, setShowRatingImage] = useState(false)
  const [feedbackSelected, setFeedbackSelected] = useState()
  const [selectedUserName, setSelectedUserName] = useState()
  const aws_feedback_url ="https://locals3-shopbyeth.innovaturelabs.com/shopbyeth/feedbackImages/"
  const params = useParams()
  const [productObj, setProductObj] = useState({});
  const [maxRating, setMaxRating] = useState(1);
  const [ratingShow, setRatingShow] = useState(false);
  const [hasRated, setHasRated] = useState(false)
  const userId = localStorage.getItem("accountAddress")
  const [myFeedback, setMyFeedback] = useState([])
  const [loading,setLoading] = useState(true)
  const [feedbackList, setFeedbackList] = useState([])
  const [viewMore, setViewMore] = useState([])
  const [feedbackParams, setFeedbackParams] = useState({
    page:1,
    size:5,
    sort:0
  })
  useEffect(() => {
    console.log(feedbackParams);
    getProductDetails()
    getFeedback()
  }, [feedbackParams]);
 
  const rateProduct = () => {
    setRatingShow(true);
  };
  const ratingClose = () => {
    setRatingShow(false);
    getProductDetails();
    getFeedback()
  };
  const ratingImageClose = () =>{
    setShowRatingImage(false)
  }
  const getProductDetails = () => {
    if (appContext.isLoggedIn() && appContext.getStatus() ===1) {
      getUserProductDetails();
    } else {
      getPublicProductDetails();
    }
  };
  const getFeedback = async() => {
    let FeedbackParams = {
      page:feedbackParams.page,
      size:feedbackParams.size
    }
    switch(+feedbackParams.sort){
      case 0:
        FeedbackParams.date =-1
        break;
      case 1:
        FeedbackParams.date =1
        break;
      case 2:
        FeedbackParams.rating = -1
        break
      case 3:
        FeedbackParams.rating =1
        break;
      default:
        FeedbackParams.date =-1
        break
      }
      
    let path = base_url + "public/products/feedback/"+params.id
    await appContext.getAxios().get(path,{params:FeedbackParams}).then((res)=>{
      console.log(res.data);
      setFeedbackList(res.data)
      // console.log(res.data.pagination.docsInpage);
      setViewMore(new Array(res.data.pagination.docsInPage).fill(false))
    })
  }

  const getPublicProductDetails = async () => {
    try {
      console.log("productid", params.id);
      let path = base_url + "public/products/" + params.id;
      await axios.get(path).then((response) => {
        let resp = response.data;
        setProductObj(resp);
        setLoading(false);
        setMaxRating(
          Math.max(
            resp.fiveStar,
            resp.fourStar,
            resp.threeStar,
            resp.twoStar,
            resp.oneStar
          )
        );
        console.log(resp);
  
      });
    } catch (error) {}
  };

  const getUserProductDetails = async () => {
    try {
      console.log("productid", params.id);
      let path = base_url + "users/products/" + params.id;
      await appContext
        .getAxios()
        .get(path)
        .then((response) => {
          let resp = response.data;
          setProductObj(resp);
          setLoading(false)
          setMaxRating(
            Math.max(
              resp.fiveStar,
              resp.fourStar,
              resp.threeStar,
              resp.twoStar,
              resp.oneStar
            )
          );
         setHasRated(resp.hasRated)
         setMyFeedback(resp.feedback)
        });
    } catch (error) {}
  };
  const deleteReview =async(e,id) =>{
    e.preventDefault()
    await appContext.getAxios().delete(base_url+"users/products/feedback/"+params.id+"/"+id).then(()=>{
      toast.success("Review deleted successfully")
      getProductDetails()
      getFeedback()
    }).catch((error)=>{
      console.log(error);
    })
  }
  const onFeedbackFilterChange = (key,value) =>{
    if (key === 'sort') {
      setFeedbackParams({...feedbackParams,
        [key]:value,
        page:1
      })
    }
    else{
      setFeedbackParams({...feedbackParams,
        [key]:value
      })
    }
    
  }
  const openRatingImage = (e,res,name)=>{
    e.preventDefault()
    setShowRatingImage(true)
    setFeedbackSelected(res)
    setSelectedUserName(name)
  }
  const setMore =(e,index,flag)  =>{
    e.preventDefault()
    let viewArray = viewMore
    viewArray[index] =flag
    // console.log(viewArray); 
    setViewMore([...viewArray])
  }



  return (
    <div className="container body-container ">
      <div className="col-12 mb-5">
            <div className="breadcrumbs breadcrumbs-details">
              <div className="bread-inner">
                <ul className="bread-list">
                  <li>
                    <Link to={"/"}>
                      Home<i className="fa-solid fa-arrow-right"></i>
                    </Link>
                  </li>
                  <li className="active">
                    <Link to={"/products"}>
                      Products <i className="fa-solid fa-arrow-right"></i>
                    </Link>
                  </li>
                  <li className="active">
                    <Link to={"/productDetails/"+params.id} className="text-break">{productObj?.productName?.length<20 ?productObj?.productName: productObj?.productName?.slice(0,21)+" ......"}</Link><i className="fa-solid fa-arrow-right"></i>
                  </li>
                  <li className="active">
                    Review
                  </li>
                </ul>
              </div>
            </div>
          </div>
      <div className="container-fluid shadow mb-4 review mt-5">
        <ul className="list-group list-group-flush">
          <li className="list-group-item py-4">
            <div className="d-flex justify-content-between">
              <span>
                <h3 className="py-2 pb-4">Customer Reviews</h3>
              </span>
              <span>
                <div className="form-group">
                <select
              name="sort"
              id="sort"
              className="sort-select"
              value={feedbackParams.sort}
              onChange={(e) => onFeedbackFilterChange("sort",e.target.value)}
            >
              <option value={0}>Newest</option>
              <option value={1}>
                Oldest
              </option>
              <option value={2}>
                Positive First
              </option>
              <option value={3}>Negative First</option>
            </select>
                </div>
             
              </span>
              <span>
                {appContext.isLoggedIn() && appContext.getStatus() ===1 && productObj?.hasBought  && !productObj?.hasRated &&(
                  <button className="btn" onClick={rateProduct}>
                    Rate Product
                  </button>
                )}

{appContext.isLoggedIn() && appContext.getStatus() ===1 && productObj?.hasBought  && productObj?.hasRated &&(
                  <button className="btn" onClick={rateProduct}>
                    Edit Review
                  </button>
                )}
              </span>
            </div>
          </li>
          {productObj?.feedback?.length > 0 && (
            <li className="list-group-item py-4">
              <div className="row d-flex align-items-center">
                <div className="col-lg-1 col-md-2 col-6">
                  <div className="ratings">
                    <span className="rating-count pb-3">
                      {productObj.averageRating.toFixed(1)} 
                    </span>
                    <span className="caption">
                      {productObj.feedback.length} Ratings
                    </span>
                  </div>
                </div>
                <div className="col-lg-2 col-md-4 col-6">
                  <span className="rating-list">
                    <span className="me-1 d-flex align-items-center">
                      5 <IoMdStar />
                    </span>
                    <ProgressBar
                      className="my-1 rating-progress"
                      variant="success"
                      now={(productObj.fiveStar / maxRating) * 100}
                    />{" "}
                    <span className="ms-1 caption">{productObj.fiveStar}</span>
                  </span>
                  <span className="rating-list">
                    <span className="me-1 d-flex align-items-center">
                      4 <IoMdStar />
                    </span>
                    <ProgressBar
                      className="my-1 rating-progress"
                      variant="success"
                      now={(productObj.fourStar / maxRating) * 100}
                    />{" "}
                    <span className="ms-1 caption">{productObj.fourStar}</span>
                  </span>
                  <span className="rating-list">
                    <span className="me-1 d-flex align-items-center">
                      3 <IoMdStar />
                    </span>
                    <ProgressBar
                      className="my-1 rating-progress"
                      variant="success"
                      now={(productObj.threeStar / maxRating) * 100}
                    />{" "}
                    <span className="ms-1 caption">{productObj.threeStar}</span>
                  </span>
                  <span className="rating-list">
                    <span className="me-1 d-flex align-items-center">
                      2 <IoMdStar />
                    </span>
                    <ProgressBar
                      className="my-1 rating-progress"
                      variant="danger"
                      now={(productObj.twoStar / maxRating) * 100}
                    />{" "}
                    <span className="ms-1 caption">{productObj.twoStar}</span>
                  </span>
                  <span className="rating-list">
                    <span className="me-1 d-flex align-items-center">
                      1 <IoMdStar />
                    </span>
                    <ProgressBar
                      className="my-1 rating-progress"
                      variant="danger"
                      now={(productObj.oneStar / maxRating) * 100}
                    />{" "}
                    <span className="ms-1 caption">{productObj.oneStar}</span>
                  </span>
                </div>
                <div className="col-lg-9 col-md-6 col-12 d-flex justify-content-center py-2"></div>
              </div>
            </li>
          )}
          {feedbackList?.docs?.length > 0 ? (
            feedbackList?.docs?.map((obj, i) => {
              return (
                <li className="list-group-item py-4" key={i}>
                  <div>
                  <div className="d-flex justify-content-between pb-1 ">
                      <span className=" mt-1 fw-bold">{obj.feedback.reviewTitle}</span>
                      <span >{userId === obj.feedback.userId &&<button className="review-delete-button" onClick={e=>(deleteReview(e,obj.feedback._id))}> <i className="fa-solid fa-trash-can"></i></button>}</span>
                      </div>
                    <div className="pb-1">
                      <Rating
                        value={obj.feedback.rating}
                        readOnly
                        stars={5}
                        cancel={false}
                      />
                    </div>
                    {/* <div className="rating-desc">{obj.feedback.review.split("\n").map((res,i)=>{
                          return(
                            <>
                            {res}
                            <br/>
                            </>
                          )
                        })}</div> */}
                        {obj.feedback?.review.length<150&&<div className="rating-desc ">{obj.feedback?.review.split("\n").map((res, i) => {
                          return (
                            <span key={i}>
                              {res}
                              <br />
                            </span>
                          )
                        })}</div>}
                        {(obj.feedback?.review.length>150&&viewMore[i])&&<div className="rating-desc ">{obj.feedback?.review.split("\n").map((res, i) => {
                          return (
                            <span key={i}>
                              {res}
                              <br />
                            </span>
                          )
                        })}
                        <span className="fw-bolder view-button " onClick={e=>setMore(e,i,false)}>View less</span>
                        </div>}
                        {(obj.feedback?.review.length>150&&!viewMore[i])&&<div className="rating-desc ">{obj.feedback?.review.slice(0,150).split("\n").map((res, i) => {
                          return (
                            <span  key={i}>
                              {res}
                              <br />
                            </span>
                          )
                        })}
                          <span className="fw-bolder view-button" onClick={e=>setMore(e,i,true)}>View more</span>
                        </div>}
                      <div className="rating-image-list d-flex">
                        {obj.feedback?.feedbackImages?.map((res,index)=>{
                          return(<div className="image-feedback-view p-2" key={index} onClick={e=>openRatingImage(e,obj.feedback,obj.user[0].name)}>
                            <img src={aws_feedback_url+obj.feedback._id+"/"+res} height="62" width="62" alt="" />
                          </div>)
                        })}
                      </div>
                    <div className="reviewdate pb-2 d-flex">
                      <i className="fa-solid fa-circle-user reviewuser pe-2"></i>
                      <span className="pe-2">{obj.user[0].name}</span>
                      {moment(obj.date).format("D MMMM YYYY")}
                    </div>
                  </div>
                </li>
              );
            })
          ) : loading ? (<div class="d-flex justify-content-center py-4">
          <div class="spinner-border text-warning " role="status">
            <span class="sr-only"></span>
          </div>
        </div>):(
            <li className="list-group-item py-4">
              <div>No Ratings Yet. Be the first to Review this product</div>
            </li>
          )}
        </ul>
        
      </div>
      <div className="mb-4">
      {feedbackList.pagination?.totalPages > 1 ? (
               
               <Paginations
               className="pagination-bar"
               currentPage={feedbackParams.page}
               totalCount={+feedbackList.pagination.totalDocs}
               pageSize={+feedbackParams.size}
               onPageChange={(page) =>onFeedbackFilterChange("page",page)}
             />
             ) : (
               ""
             )}
      </div>
      <ReviewDetailModal
      show={showRatingImage}
      feedback={feedbackSelected}
      close = {ratingImageClose}
      username = {selectedUserName}
      />
      <RatingModal feedback={productObj?.feedback}  isRated={hasRated} show={ratingShow} close={ratingClose} id={params.id} />
    </div>
  );
};

export default RatingList;
