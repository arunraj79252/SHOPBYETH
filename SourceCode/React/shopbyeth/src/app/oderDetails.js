import React, { useState, useEffect } from 'react'
import { toast } from "react-toastify";
import axios from "axios";
import useAppContext from '../AppContext';
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import Modal from 'react-modal';
import OrderCancelModal from './orderCancelModal';
import Card from 'react-bootstrap/Card';

import ReturnConfirmModal from './returnConfirmModal';
import {
  makePayment,
  getCoinBalance,
  getEthereumBalance,
} from "./blockchain-util";
import PaymentConfirmModal from './paymentConfirmModal';
import SimpleChatBot from './simpleChatBot';
const customStyles = {
  content: {
    top: '20%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-60%, -50%)',
  },
};


const OrderDetails = () => {
  const params = useParams()
  const [paymentModal, setPaymentModal] = useState(false)
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [show, setShow] = useState(false);
  const [rtn, setReturn] = useState(false)
  const [ratingEnable, setRatingEnable] = useState(false)
  const [width, setWidth] = useState(0);
  const [address, setAddres] = useState([]);
  const [cancelDelay, setCancelDelay] = useState(false)
  const appContext = useAppContext()
  const aws_url = process.env.REACT_APP_AWS_ENDPOINT;
  const path = process.env.REACT_APP_API_ENDPOINT;
  const [dateFlag, setDateFlag] = useState(true);
  const location = useLocation();
  const id = params.id;
  const [productId,setProductId] = useState()
  const [loading, setLoading] = useState(true);
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const [payableAmount, setPayableAmount] = useState(0.0);
  const [date, setDate] = useState()
  const d = new Date().toISOString();
  const navigate = useNavigate();
  useEffect(() => {
    getOrders();
   



    if (id === null) {
      navigate("/home")
    }
  }, [])

  


  let subtitle;
  const [modalIsOpen, setIsOpen] = React.useState(false);

  function openModal(e,id) {
    setProductId(id)
    setShow(true);
  }
  function openReturn(e,id) {
    setProductId(id)
    setReturn(true);
    
  }
  const rateProduct = (e, id) => {
    e.preventDefault()
    console.log(id);
    navigate("/ratingdetails/" + id)
  }



  function closeModal() {

    setShow(false);
  }
  function closeReturnModal() {

    setReturn(false);
  }
  const setFlag = (date) =>{
    const d = new Date().toISOString();
    setDateFlag(d < date)
    if(d<date){
      return true
    }
    else{
      return false
    }
  }
  const getOrders = async () => {
    await appContext.getAxios().get(path + `users/orders/${id}`).then((res) => {


      console.log("res.data",res.data[0].deliveryAddress);
      
      setOrders(res.data[0]);
     
      
      
      setLoading(true);
      setProducts(res.data[0].products)
      setAddres(res.data[0].deliveryAddress)
      console.log("addreeee",res.data[0].deliveryAddress);
      console.log('products', res.data[0].products);
      console.log('orders', res.data[0]);
      console.log("date :", res.data[0].returnDate);
      const d = new Date().toISOString();
      console.log(d);
      // console.log(d < res.data[0].returnDate);
      // setDateFlag(d < res.data[0].returnDate)
      setPayableAmount(res.data[0].total)
      getEthPrice(res.data[0].total)
      setDate(res.data[0].createdAt.split("T"))
      let isDelivered = res.data[0].statusLog.find((res) => res.orderStatus === 4)
      if (isDelivered) {
        setRatingEnable(true)
      }
    }).catch((err) => {
      console.log(err);
    })
  }
  const returnOrder = async (e) => {
    e.preventDefault()
    closeReturnModal();
    let params = {productId:productId}
    await appContext.getAxios().patch(path + `users/orders/returnStatus/${id}`,{},{params:params}).then((res) => {
      console.log(res);
      getOrders();
    }).catch((err) => {
      console.log(err);
      closeReturnModal()
    })
  }
  const cancelOrder = async (e) => {
    e.preventDefault()
    closeModal();
    setCancelDelay(true)
    let params = {productId:productId}
    console.log("cancel order");
    await appContext.getAxios().patch(path + `users/me/cancelOrder/${id}`,{},{params:params}).then((res) => {

      // closeModal();
      console.log(res);
      setCancelDelay(false)
      getOrders();
      toast.success("Order cancelled successfully");
      closeModal();
      setShow(false);


    }).catch((err) => {
      console.log(err);
      setCancelDelay(false)
      closeModal()
    })
  }
  const setStatus = (product) => {
    console.log("prdc",product);
    if (product.orderStatus === 0) {
      return 10
    }
    else if (product.orderStatus === 1) {
     return 13
    }
    else if (product.orderStatus === 2) {
      return 38
    }
    else if (product.orderStatus === 3) {
      return 65
    }
    else if (product.orderStatus === 4) {
      return 100
    }

  }
  const success = (e) => {
    console.log(e);
  }

  const productClick = (product) => {
    if (product.deleted === 0) {
      navigate("/productDetails/" + product._id);
    }
    else {
      toast.error("Product is not found")
    }
  };
  const [ethPrice, setethPrice] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [coinsUsed, setCoinsUsed] = useState(false);
  const [totalCoinsUsed, settotalCoinsUsed] = useState(0);
  const [selectedIndex, setselectedIndex] = useState(0);
  const [selectAddress, setselectAddress] = useState();
  const [addressBook, setAddressBook] = useState([]);
  const [addNew, setaddNew] = useState(false);
  const getAdrsList = async () => {
    try {
      let path = base_url + "users/me/address";
      await appContext
        .getAxios()
        .get(path)
        .then((response) => {
          let resp = response.data;
          if (resp) {
            setAddressBook(resp[0].address);
            console.log(resp[0]);
            console.log(resp[0].address);
            let index = resp[0].address.findIndex((res) =>
              res.primary === 1)
            console.log(index);
            setselectedIndex(index)
            setselectAddress(resp[0].address[index]);

          }
          if (resp[0].address.length === 0) {
            setaddNew(true);
          }
        });
    } catch (error) { }
  };
  const getEthPrice = async (price) => {
    console.log(price);
    try {
      let path = "https://api.coinconvert.net/convert/usd/eth?amount=" + price;
      await axios.get(path).then((response) => {
        let resp = response.data;
        if (resp) {
          let data = resp.ETH.toFixed(6);
          console.log("data", data);
          localStorage.setItem("ETHPrice", data);
          setethPrice(data);
        }
      });
    } catch (error) { }
  };

  const checkout = async (orderId) => {
    console.log("idd", orderId);
    setCheckoutLoading(true)
    console.log("....", payableAmount);
    // getEthPrice(payableAmount);
    try {
      let discount = orders.discount > 0 ? orders.discount : 0;
      console.log("dscnt", discount);

      let balance = await getEthereumBalance();
      let cBal = balance / Math.pow(10, 18);

      //console.log("balance", address[0]._id);
      if (+ethPrice <= cBal) {
        appContext.setPrevent(true)
        setPaymentModal(true)
        var txnHash = await makePayment(ethPrice, discount, orderId);
        appContext.setPrevent(false)
        setPaymentModal(false)
        console.log("hash", txnHash);
        if (txnHash !== -1) {
          let body = {
            orderId: orderId,
            paymentTxHash: txnHash,
          };



          let path = base_url + "users/me/completeOrder"
          await appContext
            .getAxios()
            .patch(path, body)
            .then((response) => {

              console.log(response);
              // toast.success("Order Placed Successfully!");
              localStorage.removeItem("buyNowProduct");
              setCheckoutLoading(false)
              getOrders();
              setStatus();
              // getAdrsList();


            });
        }
        else {
          setCheckoutLoading(false)
        }


      } else {
        setCheckoutLoading(false)
        toast.warn("Insufficient Balance");
      }
    } catch (error) {
      console.log("works");
      setCheckoutLoading(false)
      console.error(error);
    }
  };

  const refund = async (e) => {
    await appContext.getAxios().patch(path + `users/me/cancelOrder/${id}`).then((res) => {

      // closeModal();
      console.log(res);

      getOrders();

      closeModal();
      setShow(false);
      toast.success("Refund request initiated")

    }).catch((err) => {
      console.log(err);
      closeModal()
    })

  }

  return (
    <div className='body-container'>
      <div className="breadcrumbs breadcrumbs-details">
        <div className="bread-inner ml-10 bread">
          <ul className="bread-list">
            <li>
              <Link to={"/"}>
                Home<i className="fa-solid fa-arrow-right"></i>
              </Link>
            </li>
            <li className="active">
              <Link to={"/orders"}>
                Orders
              </Link>
            </li>

          </ul>
        </div>
      </div>
      <section class="h-100 gradient-custom">
        {products.length > 0 ?
          <div class="container py-5 h-100">
            <div class="row d-flex justify-content-center align-items-center h-100">
              <div class="col-lg-10 col-xl-8">
                <div class="card shadow-0 border mb-4" >
                  <div class="card-header px-4 py-5 d-flex justify-content-between" >
                    <h5 class="text-muted mb-0">Thank you for your order</h5>
                    <h5>Order placed: {date[0]}</h5>
                  </div>
                  <div class="card-body shadow-0 p-4">

                    <div class="card shadow-0 border mb-4">
                      {
                        products.map((prod, index) => {
                          
                          const total = (prod.productQuantity * prod.amount).toFixed(5)
                          return (
                            <div class="card-body" key={index}>
                              <div className="row cursor-style check" onClick={() => productClick(prod)}>

                                <div class="col-md-3" style={{ position: "relative" }}>

                                  <img style={{ width: '-webkit-fill-available' }} src={aws_url + prod._id + "/" + prod.coverImage}
                                    className={`image-fluid ${(prod.deleted === 1) &&
                                      "outofstockimg"
                                      }`} onLoad={e => success(e)} alt="Phone" />
                                  {prod.deleted === 1 && (
                                    <div className="centered">Unavailable</div>
                                  )}

                                </div>
                                <div class="col-3 text-center d-flex justify-content-center align-items-center">
                                  <h7 class=" mb-0 check orderName">{prod.productName}</h7>
                                </div>
                               

                                <div class="col-md-2 text-center d-flex justify-content-center align-items-center">
                                  <p className="text-muted mb-0 check" >Price :{prod.amount}</p>
                                </div>

                                <div class="col-md-2 text-center d-flex justify-content-center align-items-center">
                                  <p className="text-muted mb-0 small check">Qty: {prod.productQuantity}</p>
                                </div>
                                <div class="col-md-2 text-center d-flex justify-content-center align-items-center">
                                  <p className="text-muted mb-0 small check">Total : {total}</p>
                                </div>

                              </div>
                              {( prod.statusLog.find((res) => res.orderStatus === 4) && prod.deleted === 0) && <div className="col-md-12 d-flex justify-content-center py-4">
                                <button className='btn' onClick={e => rateProduct(e, prod._id,)}>Rate Product</button>
                              </div>}
                              {(() => {
                                if (prod.orderStatus === 0) {
                                  console.log("order status", orders.orderStatus);
                                  return (
                                    <>
                                      <div class="row d-flex align-items-center px-2 py-3 mt-3">



                                        <div class="col-md-2">
                                          <h2 class="text-muted mb-0 small pl-2">Track Order</h2>
                                        </div>
                                        <div class="col-md-10">
                                          <div class="progress" style={{ height: '6px', borderRadius: '16px', marginBottom: '2.25rem' }}>
                                            <div class="progress-bar" role="progressbar"
                                              aria-valuenow="25"
                                              aria-valuemin="0" aria-valuemax="100" style={{ width: `${setStatus(prod)}%`, borderRadius: '16px', backgroundColor: '#a8729a' }}></div>
                                          </div>
                                          <div class="d-flex justify-content-around mb-1">
                                            <p class="text-muted mt-1 mb-0 small ms-xl-5">Placed</p>

                                            <p class="text-muted mt-1 mb-0 small ms-xl-5">Shipped</p>
                                            <p class="text-muted mt-1 mb-0 small ms-xl-5">Out for delivery</p>
                                            <p class="text-muted mt-1 mb-0 small ms-xl-5">Delivered</p>
                                          </div>

                                        </div>

                                      </div>
                                      {prod.orderStatus === 0 ? <h4 className="text-center p-5"  >Waiting for Payment confirmation</h4> : <h4 className="text-center p-5" style={{ color: 'green' }} >Your order is on the way</h4>}


                                    </>
                                  )
                                }

                                else if (prod.orderStatus === 1 || prod.orderStatus === 2) {

                                  return (
                                    <>
                                      <div class="row d-flex align-items-center px-2 py-3 mt-3">



                                        <div class="col-md-2">
                                          <h2 class="text-muted mb-0 small pl-2">Track Order</h2>
                                        </div>
                                        <div class="col-md-10">
                                          <div class="progress" style={{ height: '6px', borderRadius: '16px', marginBottom: '2.25rem' }}>
                                            <div class="progress-bar" role="progressbar"
                                              aria-valuenow="25"
                                              aria-valuemin="0" aria-valuemax="100" style={{ width: `${setStatus(prod)}%`, borderRadius: '16px', backgroundColor: '#F7941D ' }}></div>
                                          </div>
                                          <div class="d-flex justify-content-around mb-1">
                                            <p class="text-muted mt-1 mb-0 small ms-xl-5">Placed</p>
                                            <p class="text-muted mt-1 mb-0 small ms-xl-5">Shipped</p>
                                            <p class="text-muted mt-1 mb-0 small ms-xl-5">Out for delivery</p>
                                            <p class="text-muted mt-1 mb-0 small ms-xl-5">Delivered</p>
                                          </div>

                                        </div>
                                      </div>
                                      <div className='d-flex justify-content-center'>
                                        <button className='btn mt-3' style={{width:"200px"}} disabled={cancelDelay}  onClick={e =>openModal(e,prod._id)}>{cancelDelay ? <div className="spinner-border  cancel-spinner text-warning" role="status">
                            <span className="sr-only"></span>
                          </div>:"Cancel product"}</button>
                                      </div>



                                    </>
                                  )
                                }
                                else if (prod.orderStatus === 4 || prod.orderStatus === 3) {
                                  console.log("order status", orders.orderStatus);
                                  return (
                                    <>
                                      <div class="row d-flex align-items-center py-3 px-2">



                                        <div class="col-md-2">
                                          <h2 class="text-muted mb-0 small pl-2">Track Order</h2>
                                        </div>
                                        <div class="col-md-10">
                                          <div class="progress" style={{ height: '6px', borderRadius: '16px', marginBottom: '2.25rem' }}>
                                            <div class="progress-bar" role="progressbar"
                                              aria-valuenow="25"
                                              aria-valuemin="0" aria-valuemax="100" style={{ width: `${setStatus(prod)}%`, borderRadius: '16px', backgroundColor: '#F7941D ' }}></div>
                                          </div>
                                          <div class="d-flex justify-content-around mb-1">
                                            <p class="text-muted mt-1 mb-0 small ms-xl-5">Placed</p>
                                            <p class="text-muted mt-1 mb-0 small ms-xl-5">Shipped</p>
                                            <p class="text-muted mt-1 mb-0 small ms-xl-5">Out for delivery</p>
                                            <p class="text-muted mt-1 mb-0 small ms-xl-5">Delivered</p>
                                          </div>

                                        </div>
                                      </div>
                                      <div className='d-flex justify-content-center'>
                                      {(d<prod.returnDate) && <button className='btn mt-3'  onClick={e =>openReturn(e,prod._id)}>Return product</button>}
                                      </div>



                                    </>
                                  )
                                }

                                else if (prod.orderStatus === 5) {
                                  return (

                                    <div class="row d-flex align-items-center">
                                      {checkoutLoading ? <h2 className="text-center " > <div class="spinner-border text-warning  text-center ml-30" role="status">
                                        <span class="sr-only text-center "></span>

                                      </div></h2> :
                                        <h3 className="text-center p-3" style={{ color: 'red' }}> Payment failed </h3>}

                                    </div>
                                  )
                                }
                                else if (prod.orderStatus === 6) {
                                  return (
                                    <div class="row d-flex align-items-center">
                                      <h3 className="text-center p-3" style={{ color: 'red' }}>Order Cancelled</h3>
                                    </div>
                                  )
                                }
                                else if (prod.orderStatus === 7) {
                                  return (
                                    <div class="row d-flex align-items-center">
                                      <h3 className="text-center p-3" style={{ color: 'green' }}>Refund initiated</h3>
                                    </div>
                                  )
                                }
                                else if (prod.orderStatus === 8) {
                                  return (
                                    <div class="row d-flex align-items-center">
                                      <h3 className="text-center p-3" style={{ color: 'green' }}>Refund completed</h3>
                                    </div>
                                  )
                                }
                                else if (prod.orderStatus === 9) {
                                  return (
                                    <>
                                      <div class="row d-flex align-items-center">
                                        <h3 className="text-center p-3" style={{ color: 'red' }}>Refund failed
                                        </h3>

                                      </div>
                                    </>
                                  )
                                }
                                else if (prod.orderStatus === 10) {
                                  return (
                                    <>
                                      <div class="row d-flex align-items-center">
                                        <h3 className="text-center p-3" style={{ color: 'red' }}>Return initiated</h3>
                                      </div>

                                    </>
                                  )
                                }
                                else if (prod.orderStatus === 11) {
                                  return (
                                    <>
                                      <div class="row d-flex align-items-center">
                                        <h3 className="text-center p-3" style={{ color: 'red' }}>Return completed</h3>
                                      </div>

                                    </>
                                  )
                                }

                              })()}
                              <hr class="mb-4" style={{ backgroundColor: '#e0e0e0' }} />

                            </div>)

                        })
                      }

                    
                    </div>

                    {Number(orders.totalEthereumPaid) > 0 && <div class='row'>
                      <div class="col-lg-8 fw-bold"></div>
                      <div class='col-lg-2 fw-bold'>Ethereum Used:</div>
                      <div class='col-lg-2 text-start'>{Number(orders.totalEthereumPaid).toFixed(10)}</div>
                    </div>}
                    <div class='row'>
                      <div class="col-lg-8 fw-bold"></div>
                      <div class='col-lg-2 fw-bold'>Order total:</div>
                      <div class='col-lg-2 text-start'>${orders.total.toFixed(5)}</div>
                    </div>
                    <div class='row'>
                      <div class="col-lg-8 fw-bold"></div>
                      <div class='col-lg-2 fw-bold'>Discount:</div>
                      <div class='col-lg-2 text-start'>${orders.discount}</div>
                    </div>
                    <div class='row'>
                      <div class="col-lg-8 fw-bold"></div>
                      <div class='col-lg-2 fw-bold'>Delivery charges:</div>
                      <div class='col-lg-2 text-start'>Free</div>
                    </div>
                    {orders.coinsEarned > 0 && orders.rewardStatus !== 0 ? <div class='row'>
                      <div class="col-lg-8 fw-bold"></div>
                      <div class='col-lg-2 fw-bold'>Rewards:</div>
                      <div class='col-lg-2 text-start'>{orders.coinsEarned}</div>
                    </div> : ""}
                    {orders.coinsEarned > 0 ? <div class='row'>
                      <div class="col-lg-8"></div>
                      <div class='col-lg-2'></div>
                      {orders.rewardStatus === 1 ? <div class='col-lg-2'>(pending)</div> : orders.rewardStatus === 2 ? <div class='col-lg-2'>(earned)</div> : orders.rewardStatus === 3 ? <div class='col-lg-2'>(failed)</div> : ""}
                    </div> : ""}
                    {/* <div class="row border rounded p-1 my-3">
                     
                            <div class="col-md ">
                              <div class="d-flex flex-column align-items start ">
                                <b>Shipping Address:</b>
                                <p class="text-justify pt-2">{orders.deliveryAddress.address}</p>
                                <p class="text-justify">{orders.deliveryAddress.city},{orders.deliveryAddress.locality}</p>
                                <p class="text-justify">{orders.deliveryAddress.state}</p>
                                <p class="text-justify">pin:{orders.deliveryAddress.pincode}</p>
                              </div>
                            </div>
                         

                    </div> */}
                    <div class="row border rounded p-1 my-3">
                     
                            <div class="col-md ">
                              <div class="d-flex flex-column align-items start ">
                                <b>Shipping Address:</b>
                                <p class="text-justify pt-2">{address.address}</p>
                                <p class="text-justify">{address.city},{address.locality}</p>
                                <p class="text-justify">{address.state}</p>
                                <p class="text-justify">pin:{address.pincode}</p>
                              </div>
                            </div>
                         

                    </div>

                  </div>
                  <div class="card-footer border-0 px-4 py-5"
                    style={{ backgroundColor: '#333', borderRadius: '10px' }}>
                    <h5 class="d-flex align-items-center justify-content-end text-white text-uppercase mb-0">Total
                      paid: <span class="h2 mb-0 ms-2">${((orders.total) - (orders.discount)).toFixed(5)}</span></h5>
                  </div>
                </div>
              </div>
            </div>
          </div> :""
          // loading ? <div class="d-flex justify-content-center my-5">
          //   <div class="spinner-border text-warning" role="status">
          //     <span class="sr-only"></span>
          //   </div> </div> : <div className="text-center p-5">No Orders Found!</div>
            }
      </section>
      <OrderCancelModal show={show} close={closeModal} id={id} prodId={productId} cancel={cancelOrder} />
      <ReturnConfirmModal show={rtn} close={closeReturnModal} return={returnOrder} />
      <PaymentConfirmModal show={paymentModal} />
      <SimpleChatBot orders={orders} />
    </div>
  )
}

export default OrderDetails