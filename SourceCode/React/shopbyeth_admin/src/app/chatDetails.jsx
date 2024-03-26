import React, { useState } from "react";
import { useRef } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import useAppContext from "../AppContext";
import OrderBotDetails from './orderBotDetails';
const ChatDetails = (props) => {
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const [chat, setChat ] = useState({})
  const appContext = useAppContext()
  const [replyText, setReplyText] = useState("")
  const [enableButton, setEnableButton] = useState(false)
  const [loading, setLoading] = useState(true)
  // const [replied, setReplied] = useState(true)

  const [orderLoaded, setOrderLoaded] = useState(0)
  const orderDetailRef = useRef();
  const month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  useEffect(()=>{
    // console.log(props);
    // setChat(props.chat)
    if (props.chat?._id) {
      setLoading(true)
      getChatDetails(props.chat._id)
      setReplyText("")  
    }
    
    // console.log(props.chat);
  },[props.chat])
  useEffect(()=>{
    if (orderLoaded) {
      scrollUp()
    }
  },[orderLoaded])
  const getChatDetails = async(id) =>{
    await appContext.getAxios().get(base_url+"admin/viewResponseDetails/"+id).then((res)=>{
      console.log(res.data);
      setChat(res.data[0])
      setLoading(false)
    })
  }
  const replyChange=(e)=>{
    e.preventDefault()
    setReplyText(e.target.value)
  }
  const scrollUp = () =>{
    console.log(orderDetailRef.current);
    orderDetailRef?.current?.scrollIntoView({behavior: "smooth", block: "end", inline: "end"})
  }
  const mailSubmit=async(e)=>{
    // console.log("works");
    e.preventDefault()
        let body={
      adminResponse:replyText
    }
    setEnableButton(true)
      await appContext.getAxios().patch(base_url+"admin/reply/"+props.chat._id,body).then((res)=>{
        console.log(res.data);
        setReplyText("")
        getChatDetails(props.chat._id)
        // setChat({
        //   ...chat,
        //   adminResponse:replyText
        // })
        
        setEnableButton(false)

        props.chatRead(props.chat._id,replyText)
      }).catch(()=>{
        setEnableButton(false)
      })
      
    
  }
  const getDetailDateFormat = (date) =>{
    const event = new Date(date)
    const options= { month: 'short', day: 'numeric',hour:'numeric',minute:'2-digit' }
    console.log(event.toLocaleTimeString(undefined,options).split(",").join(" "));

    return event.toLocaleTimeString(undefined,options)?.split(",")?.join(" ")

  }
  function setOrderLoading (flag) {
    setOrderLoaded(flag)
  }


  useEffect(()=>{

  },[replyText])
  return (
<>  
    
        {!loading?<div className="msger-chat">

          {
            chat.message.map((res,index)=>{
              if (res.userType === 0 ) {
                return(
                  <div className="msg left-msg" key={index}>
            <div>
              <img
                src={require("./images/images.jpg")}
                style={{ width: "50px", height: "50px" }}
                alt=""
                width="32"
                height="32"
                className="rounded-circle me-2"
              />
            </div>

            <div className="msg-bubble" style={{ background: "aliceblue" }}>
              <div className="msg-info">
                <div className="msg-info-name"><Link className="link-chat" target="_blank"  to={"/user/"+chat.userId}>{chat.userName}</Link></div>
                <div className="msg-info-time">{getDetailDateFormat(res.addedDate)}</div>
              </div>

              <div className="msg-text text-start">
               {res.response}
              </div>
            </div>
          </div>
                )
              }
              else{
                return(
                  <div className="msg right-msg" key={index}>
            <div>
              <img
                src={require("./images/images.jpg")}
                style={{ width: "50px", height: "50px" }}
                alt=""
                width="32"
                height="32"
                className="rounded-circle me-2"
              />
            </div>

            <div className="msg-bubble" style={{ background: "white", color:'black' }}>
              <div className="msg-info">
                <div className="msg-info-name">Admin</div>
                <div className="msg-info-time">{getDetailDateFormat(res.addedDate)}</div>
              </div>

              <div className="msg-text">
                {res.response.split("\n").map((res,index)=>{
                  return(
                    <div key={index} className="text-break msg-text">{res}</div>
                  )
                })}
              </div>
            </div>
          </div>
                )
              }
            })
          }
          
          <div className="msg left-msg" >
            <div>
              {/* <button>click me</button> */}
              <img
                src={require("./images/images.jpg")}
                style={{ width: "50px", height: "50px" }}
                alt=""
                width="32"
                height="32"
                className="rounded-circle me-2"
              />
            </div>

            <div className="msg-bubble" style={{ background: "aliceblue" }}>
              {/* <div class="msg-info">
                <div className="msg-info-name">{chat.userName}</div>
                <div class="msg-info-time">{new Date(chat.createdAt).toLocaleDateString()}</div>
              </div> */}

              <div className="msg-text text-start"  >
              <OrderBotDetails id={chat.orderId} productId={chat.productId} setLoad={setOrderLoading}/>
              </div>
            </div>
          </div>
          <div className="checking" ref={orderDetailRef}></div>
          

        </div>:<div className="d-flex  justify-content-center my-5 msger-chat">
                    <div className="spinner-border text-warning" role="status">
                      <span className="sr-only"></span>
                    </div> </div>}
                    
      <div className="chat-reply">
      <form className="msger-inputarea">
          <textarea
          style={{resize:'none'}}
            className="form-control"
            id="exampleFormControlTextarea1"
            rows="3"
            value={replyText}
            onChange={e=>replyChange(e)}
          ></textarea>
          
          <button type="button" disabled={replyText.length<3 || replyText.length>200 || enableButton || orderLoaded ===0 } onClick={e=>mailSubmit(e)} className={`msger-send-btn ${(replyText.length<3 || replyText.length>200 || orderLoaded ===0) && 'disable-chat-button'  }`}>
           {enableButton ?<div className="submit-spinner spinner-border text-warning" role="status">
                      <span className="sr-only"></span>
                    </div> :"Send"}
          </button>
        </form>
      </div>
        </>

  );
};

export default ChatDetails;
