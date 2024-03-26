import React ,{useState,useEffect}from 'react'
import useAppContext from "../AppContext";
import { useParams } from 'react-router-dom';
import ListGroup from "react-bootstrap/ListGroup";
import { BsCoin } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
const Rewards = () => {
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const appContext = useAppContext();
  const [rewards, setRewards] = useState([]);
  const [loading,setLoading] = useState(true)
  const params = useParams();
  const [balance,setBalance] = useState(0);
  const navigate = useNavigate();
  const [productNamesArray, setProductNamesArray] = useState([]);
  useEffect(() => {
    getRewards();
    console.log("balance",balance);
  }, []);
  const getRewards = async () => {
    const id = params.id
    await appContext
      .getAxios()
      .get(base_url + "admin/rewardCoinHistory",{params: {userId:id}})
      .then((res) => {
        let array = res.data.slice(0, -1);
        console.log("array",array);
        console.log(res.data);
        setRewards(array);
        setLoading(false);
        setBalance(res.data[res.data.length - 1].userCoinBalance);
        console.log("balance",balance);
        
      });
  };

  const numToFixed =(num)=>{
    if ((num+"").split(".").length===1 ) {

      return num
    }
    else{
     let stringNum = (num+"").split(".")
     return stringNum[0]+"."+stringNum[1].slice(0,6)
    }

  }
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
  return (
    <div className=" mb-5">
     
      
      <div >
        <div className='container' >
        <h2 className="mb-5 mt-5">Rewards history</h2>
          <div className="row">
            <div className="col-lg-2"></div>
            <div className="col-lg-8">
              <div className="shadow shopping-cart">
                <h3 className="py-4 px-3">
                  Coin Balance <BsCoin className="coin-icon" />{" "}
                  <span className="points">{numToFixed(balance)}</span>
                </h3>
                
                <div className="container-fluid py-4 px-3">
                  <ListGroup variant="flush">
                    <ListGroup.Item
                      className="reward-item d-flex"
                      style={{ fontWeight: "bold" }}
                    >
                      {/* <div className="name">Recent Coin Activity</div>
                      <div className="coins">Coins Spend</div>
                      <div className="coins">Coins Earned</div> */}
                      <div className="col-8 d-flex">
                        <div className="name ">Recent Coin Activity</div>
                      </div>
                      <div className="col-4">
                        <div className="coins text-center ">Transactions</div>
                      </div>
                    </ListGroup.Item>
                    {rewards.length > 0 ? (
                      rewards.map((res, index) => {
                        return (
                          <ListGroup.Item
                            className="reward-list reward-item d-flex allign-items-center"
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
                              <div className="reward-name d-flex align-items-start check">
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
  )
}

export default Rewards
