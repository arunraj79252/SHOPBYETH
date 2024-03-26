import React, { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAppContext from "../AppContext";
import { BsCoin } from "react-icons/bs";
import { SiLitecoin } from "react-icons/si";
import ListGroup from "react-bootstrap/ListGroup";

const MyRewards = () => {
  const appContext = useAppContext();
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const [rewards, setRewards] = useState([]);
  const [productNamesArray, setProductNamesArray] = useState([]);
  const [loading,setLoading] = useState(true)
  useEffect(() => {
    getRewards();
  }, []);
  const numToFixed =(num)=>{
    if ((num+"").split(".").length===1 ) {

      return num
    }
    else{
     let stringNum = (num+"").split(".")
     return stringNum[0]+"."+stringNum[1].slice(0,6)
    }

  }
  const navigate = useNavigate();
  const getRewards = async () => {
    await appContext
      .getAxios()
      .get(base_url + "users/me/rewardCoinHistory")
      .then((res) => {
        console.log(new Date(res.data[0].createdAt).toDateString());
        let array = res.data.slice(0, -1);
        console.log(array);
        console.log(res.data);
        setRewards(array);
        setLoading(false);
        setBalance(res.data[res.data.length - 1].userCoinBalance);
      });
  };
  useEffect(() => {
    console.log(rewards);
    let productNames = [];
    rewards.forEach((res, key) => {
      res.products.forEach((res, index) => {
        let i = productNames[key];

        if (i === undefined) {
          productNames.push(res.productName);
        } else {
          productNames[key] = productNames[key] + " , " + res.productName;
        }
      });
    });
    console.log(productNames);
    setProductNamesArray(productNames);
  }, [rewards]);
  const goToOrderDetails = (e, id) => {
    e.preventDefault();
    navigate("/orderdetails/"+id);
  };
  const [balance, setBalance] = useState(0);
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
                    <Link to="/rewards">Rewards</Link>
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
              <div className="shadow shopping-cart">
                <h3 className="py-4 px-3">
                  Coin Balance <BsCoin className="coin-icon" />{" "}
                  <span className="points">{ numToFixed(balance)}</span>
                </h3>
                <div className="container-fluid " style={{ height: "370px" }}>
                  <img
                    src={require("./images/redeem.png")}
                    className=""
                    alt=""
                    style={{ width: "100%" }}
                  />
                </div>
                <div className="container-fluid py-4 px-3">
                  <ListGroup variant="flush">
                    <ListGroup.Item
                      className="reward-item"
                      style={{ fontWeight: "bold" }}
                    >
                      {/* <div className="name">Recent Coin Activity</div>
                      <div className="coins">Coins Spend</div>
                      <div className="coins">Coins Earned</div> */}
                      <div className="col-8">
                        <div className="name ">Recent Coin Activity</div>
                      </div>
                      <div className="col-4">
                        <div className="coins text-center">Transactions</div>
                      </div>
                    </ListGroup.Item>
                    {rewards.length > 0 ? (
                      rewards.map((res, index) => {
                        return (
                          <ListGroup.Item
                            className="reward-list list-hover-change reward-item"
                            key={index}
                            onClick={(e) => goToOrderDetails(e, res.orderId)}
                          >
                            {/* <div className="reward-name">\
                              <span style={{fontWeight:"bold"}}>{res.orderId}</span>
                              <span style={{color:"#878787"}}>Credited On {new Date(res.createdAt).toDateString().slice(4)}</span>
                              
                            </div>
                            <div className="reward-points">
                            <div className="text-danger"> -{res.rewardCoinsUsed}</div>
                              <div className="reward-points-earned">  {res.rewardCoinsEarned}</div>
                              
                            </div> */}
                            <div className="col-8">
                              <div className="reward-name">
                                <span
                                  className="prod-name"
                                  style={{ fontWeight: "bold" }}
                                >
                                  {productNamesArray[index]}
                                </span>
                                <span style={{ color: "#878787" }}>
                                  {res.rewardCoinsEarned && `Credited On
                                 
                                 ${new Date(res.createdAt)
                                   .toDateString()
                                   .slice(4)}`}
                                   {res.rewardCoinsUsed && `Debited On
                                 
                                 ${new Date(res.createdAt)
                                   .toDateString()
                                   .slice(4)}`}
                                  
                                </span>
                              </div>
                            </div>
                            <div className="col-4 text-center">
                              <div>
                                {res.rewardCoinsEarned && (
                                  <span className="success">
                                    + {numToFixed(res.rewardCoinsEarned)}
                                  </span>
                                )}
                                {res.rewardCoinsUsed && (
                                  <span className="text-danger">
                                    - {numToFixed(res.rewardCoinsUsed)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </ListGroup.Item>
                        );
                      })
                    ) : loading ?<div class="d-flex justify-content-center my-5 ">
                    <div class="spinner-border text-warning" role="status">
                      <span class="sr-only"></span>
                    </div> </div>:(
                      <ListGroup.Item className="no-reward-list">
                        No transactions
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
  );
};

export default MyRewards;
