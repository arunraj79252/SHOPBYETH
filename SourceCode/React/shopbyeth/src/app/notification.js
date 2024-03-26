import React,{useEffect, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import useAppContext from "../AppContext";
import ListGroup from "react-bootstrap/ListGroup";
import logo from "../app/images/favicon.ico"

const Notification = () => {
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const appContext = useAppContext();
  const [notificationList, setNotificationList] = useState([])
  const [hoverId, setHoverId] = useState("")
  const navigate = useNavigate();
  const [loading,setLoading] = useState(true)
  useEffect(() => {
    getNotification();
  }, []);
  const getNotification = async() => {
    await appContext.getAxios().get(base_url+"users/me/notification").then((res)=>{
      console.log(res.data);
      setNotificationList(res.data.data)
      setLoading(false)
    })
  };
  const goToNotifications = async(e,id,link) =>{
    e.preventDefault()
    
    await appContext.getAxios().patch(base_url+"users/me/notification/"+id).then((res)=>{
      console.log(res.data);
      appContext.getNotification()
      navigate(link)
    })

    

  }
  const onMouseOver = (e,id)=>{
    e.preventDefault()
    setHoverId(id)
  }
  const mouseOut = (e) =>{
    e.preventDefault()
    setHoverId("")
  }
  useEffect(()=>{
    console.log(notificationList);
  },[notificationList])

  return (
    <div className="body-container">
      <div className="breadcrumbs">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="bread-inner">
                <ul className="bread-list">
                  <li>
                    <Link to="/">
                      Home<i className="fa-solid fa-arrow-right"></i>
                    </Link>
                  </li>
                  <li className="active">
                    <Link to="/notifications">Notification</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className=" section">
        <div className="container">
          <div className="row">
            <div className="col-lg-2"></div>
            <div className="col-lg-8">
              <div className="shadow">
                <h3 className="py-4 px-3">
                 All Notifications
                </h3>
                {/* <div className="container-fluid " style={{ height: "370px" }}>
                  <img
                    src={require("./images/redeem.png")}
                    className=""
                    alt=""
                    style={{ width: "100%" }}
                  />
                </div> */}
                <div className="container-fluid py-4 px-3">
                  <ListGroup variant="flush">
                    {/* <ListGroup.Item style={{ fontWeight: "bold" }}>
                      <div className="col-8">
                        <div className="name " >Recent Coin Activity</div>
                      </div>
                      <div className="col-2">
                        <div className="coins text-center">Coins Spend</div>
                      </div>
                      <div className="col-2">
                        <div className="coins text-center">Coins Earned</div>
                      </div>
                    </ListGroup.Item> */}
                    {notificationList.length > 0 ? (
                      notificationList.map((res, index) => {
                        return (
                          <ListGroup.Item
                            className={`reward-list d-flex align-items-center ${res.status ===0?"notification-unread":""}`} 
                            onMouseOver={e=>{onMouseOver(e,res._id)}}
                            onMouseLeave= {e=>{mouseOut(e)}}
                            key={index}
                            onClick={(e) => goToNotifications(e, res._id,res.click_action)}
                          >
                            <div className="col-1 img-rounded img-responsive">
                              <img className="" src={logo} alt="logo" />
                            </div>
                            <div className="col-8">
                              <div className="reward-name">
                                <span className="prod-name" style={{ fontWeight: "bold" }}>
                                 {res.body}
                                </span>
                                <span style={{ color: "#878787" }}>
                                 
                                  {new Date(res.createdAt)
                                    .toDateString()
                                    .slice(4)}
                                </span>
                              </div>
                            </div>
                            <div className="col-3 text-center more-details">
                              {res._id === hoverId && "More Details >"}
                            </div>
                          </ListGroup.Item>
                        );
                      })
                    ) : loading ? <div class="d-flex justify-content-center">
                    <div class="spinner-border text-warning" role="status">
                      <span class="sr-only"></span>
                    </div>
                  </div>:(
                      <ListGroup.Item className="no-reward-list">
                        No Notification
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </div>
              </div>
            </div>
            <div className="col-lg-2"></div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default Notification;
