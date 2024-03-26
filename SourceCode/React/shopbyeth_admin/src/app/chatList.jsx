import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ListGroup from "react-bootstrap/ListGroup";

import useAppContext from "../AppContext";
import ChatDetails from "./chatDetails";
import Paginations from "./pagination";
import { AiOutlineFilter, AiOutlineSearch } from "react-icons/ai";
const ChatList = () => {
  const navigate = useNavigate();
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const appContext = useAppContext();
  const [chatDetails, setChatDetails] = useState({});
  const [totalItems, setTotalItems] = useState(0);

  // const [chatKeyword, setChatKeyword] = useState("")

  const [chatList, setChatList] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [initial, setInitial] = useState(true);
  const [parameters, setParameters] = useState({
    page: 1,
    size: 10,
    updatedate: -1,
    keyword: "",
    replyStatus:"-1"
  });

  useEffect(()=>{
    console.log(chatList);
    // console.log(;
  },[chatList])
  useEffect(() => {
    //
    if (initial) {
      getChatList();
    } else {
      const timer = setTimeout(() => {
        getChatList();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [parameters]);
  useEffect(() => {
    if (!chatDetails?._id && chatList) {
      setChatDetails(chatList[0]);
    }
  }, [chatList]);
  const searchChat = (e) => {
    e.preventDefault();
    console.log(e.target.value);
    setParameters((previousValue) => ({
      ...previousValue,
      page: 1,
      keyword: e.target.value,
    }));
  };
  const changeStatus= (e) =>{
    e.preventDefault()
    setParameters((previousValue) => ({
      ...previousValue,
      page: 1,
      replyStatus:e.target.value,
    }));
  }
  const getChatList = async () => {
    let params = parameters
    // debugger;
    if (params.replyStatus ==="-1") {
      delete params.replyStatus
    }
    await appContext
      .getAxios()
      .get(base_url + "admin/viewResponse", { params: parameters })
      .then((res) => {
        console.log(res.data);
        setTotalItems(res.data.totalDocs);
        setChatList(res.data.docs);
        if (initial && res.data.docs.length) {
          setSelectedId(res.data.docs[0]._id);
          setInitial(false);
        }
      });
  };
  const chatUnreadToRead = (id,response) =>{
    console.log(id);
    console.log(response);
    // console.log(new Date());

    let newChat = chatList
    // console.log(new Date());
    newChat.map((res)=>{

      if (res._id ===id) {
        res.message =[...res.message,
        {response:response,
        addedDate:new Date().toISOString(),
        userType:1
        }
        ]
        res.replyStatus =1
      }
      return res
    })
    console.log(newChat);
    setChatList([...newChat])

  } 
  const pageChange = (number) => {
    console.log(number.selected + 1);

    setParameters({
      ...parameters,
      page: number,
    });
  };
  const goToUser = (e, id) => {
    e.preventDefault();
  };
  const gotoChat = (e, index) => {
    e.preventDefault();
    setSelectedId(chatList[index]._id);
    console.log(chatList[index]);
    setChatDetails(chatList[index]);
  };
  const getMonthYear = (date) => {
    const event = new Date(date)
    const options= { month: 'long', day: 'numeric'}
    // console.log(event.toLocaleDateString(undefined,options));
    // console.log(new Date(date.toLocaleDateString()));
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
    // console.log(date.local);
    // let splitDate = date.split("/");
    return event.toLocaleDateString(undefined,options)
    // console.log("" + splitDate[0] + " " + month[+(splitDate[1] - 1)]);
    // return "" + splitDate[0] + " " + month[+(splitDate[1] - 1)];
  };

  return (
    <div>
      <div className="body-container ">
        <h2 className="mb-5 text-center" style={{ marginTop: "2rem" }}>
          Chats
        </h2>
        {
          <div className=" mb-4" style={{ paddingBottom: "0rem" }}>
            <div>
              <div className="container  ">
                <div className="row">
                  <div className="col-xl-4 col-lg-5 col-6">
                    <div className="card">
                      <div className="card-body chat-list-body">
                        <div className="status-search">
                        <span className="search-chat-input">
                          <span className="search-icon">
                            <AiOutlineSearch />
                          </span>
                          <input
                            type="search"
                            className="search-chat-text "
                            value={parameters.keyword}
                            autoComplete="off"
                            name="keyword"
                            placeholder="Search chat"
                            onChange={(e) => searchChat(e)}
                            //  onChange={e => searchBrand(e)}
                          />
                          <span className="input-group-btn "></span>
                        </span>
                        <div className="status-dropdown">
                          <select
                            className="form-select"
                            aria-label="Default select example"
                            value={parameters.replyStatus}
                            onChange={e=>changeStatus(e)}

                          >
                            <option value={-1}>All</option>
                            <option value={0}>Not replied</option>
                            <option value={1}>Replied</option>
                          </select>
 
                          {/* <AiOutlineFilter className="fiter-icon"/> */}
                        </div>
                        </div>
                       
                        {chatList.length > 0 ? (
                          <ListGroup variant="flush" className="chat-list">
                            {chatList.map((res, index) => {
                              return (
                                <ListGroup.Item
                                  key={index}
                                  className={`py-4 chat-list-item ${
                                    selectedId === res._id && "active-chat-item"
                                  }`}
                                  onClick={(e) => gotoChat(e, index)}
                                >
                                  <div className="row">
                                    <div className="col-2 d-flex align-items-center justify-content-center">
                                      <img
                                        src={require("./images/images.jpg")}
                                        style={{
                                          width: "25px",
                                          height: "25px",
                                        }}
                                        alt=""
                                        width="32"
                                        height="32"
                                        className="rounded-circle me-2"
                                      />
                                    </div>
                                    <div className="col-7 text-start">
                                      <div className="chat-name-response">
                                        <div className="chat-user-name fw-bold">
                                          {res.userName}
                                        </div>
                                        <div className="chat-resp">
                                          {res.message[res.message.length-1].response}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-3 chat-date-unread fw-bold">
                                      {getMonthYear(
                                       
                                          res.message[res.message.length-1].addedDate
                                        
                                      )}
                                      {!res.replyStatus && (
                                        <div className="not-replied">&nbsp;</div>
                                      )}
                                    </div>
                                  </div>
                                </ListGroup.Item>
                              );
                            })}
                          </ListGroup>
                        ) : (
                          !initial && (
                            <div className="no-item py-4">No Results</div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-8 col-lg-7 col-6">
                    <div className="card">
                      <div className="card-body chat-details-body chat-list-body">
                        
                          <ChatDetails
                            // getChatList={getChatList}
                            chatRead={chatUnreadToRead}
                            chat={chatDetails}
                          />
                                              </div>
                    </div>
                  </div>
                </div>
                <div className="chat-pagination d-flex mt-2">
                  {chatList.length > 0 && (
                    <Paginations
                      className="pagination-bar"
                      currentPage={+parameters.page}
                      totalCount={+totalItems}
                      pageSize={+parameters.size}
                      onPageChange={(page) => pageChange(+page)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  );
};

export default ChatList;
