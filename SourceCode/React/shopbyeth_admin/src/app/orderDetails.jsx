import React, { useState, useEffect } from 'react'
import axios from "axios";
import useAppContext from '../AppContext';
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Modal from 'react-modal';
import { toast } from "react-toastify";
import StatusConfirmModal from './statusConfirmModal';
import getStatusName from './orderStatus';


const OrderDetails = () => {
  const params = useParams();
  const [show, setShow] = useState(false);
  const [orders, setOrders] = useState([]);
  const [modalStatus, setModalStatus] = useState();
  const [modalId, setModalId] = useState()
  const [products, setProducts] = useState([]);
  const [width, setWidth] = useState(0);
  const [address, setAddres] = useState([]);
  const [status, setstatus] = useState(null);
  const appContext = useAppContext();
  const [modalBody, setModalBody] = useState({
    title: "Change Status",
    body: "Do you want to change the status?"

  })
  const aws_url = process.env.REACT_APP_AWS_ENDPOINT;
  const path = process.env.REACT_APP_API_ENDPOINT;
  //const id = 641667293234204
  const location = useLocation();
  //const id = location.state.id;
  const id = params.id;
  const navigate = useNavigate();
  const orderStatus = [
    { id: 0, name: "Waiting for payment" },
    { id: 1, name: "Placed" },
    { id: 2, name: "Shipped" },
    { id: 3, name: "Out for delivery" },
    { id: 4, name: "Delivered" },
    { id: 5, name: "Payment failed" },
    { id: 6, name: "Cancelled" },
    { id: 10, name: "Return initiated" },
    { id: 11, name: "Return completed" },
    { id: 7, name: "Refund initiated" },
    { id: 8, name: "Refund completed" },
    { id: 9, name: "Refund failed" },
    
  ]
  useEffect(() => {
    getOrders();
    // setStatus();
    if (id === null) {
      navigate("/home")
    }
  }, [])
  useEffect(() => {
    // setStatus();
  }, [orders])
  const getOrders = async () => {
    await appContext.getAxios().get(path + `admin/orders/${id}`).then((res) => {


      console.log("res.data",res.data[0].deliveryAddress);
      setOrders(res.data[0]);
      setProducts(res.data[0].products)
      setAddres(res.data[0].deliveryAddress)
      setstatus(res.data[0].orderStatus)
      console.log('products', res.data[0].products);
      console.log('orders', orders);
      // setStatus();


    }).catch((err) => {
      console.log(err);
    })
  }

  const setStatus = (products) => {
    console.log("prdcs",products);
    if (products.orderStatus === 0) {
      
      return 10
    }
    else if (products.orderStatus === 1) {
      
      return 15
    }
    else if (products.orderStatus === 2) {
     
      return 37
    }
    else if (products.orderStatus === 3) {
      
      return 65
    }
    else if (products.orderStatus === 4) {
      
      return 100
    }

  }
  const [productId,setProductId] = useState()
  const changeStatus = async (val, product) => {
    console.log(typeof(val));
    setProductId(product._id)
    const modalstatus=parseInt(val)
    
    setModalStatus(parseInt(val));
    setModalId(id);
    const stat=product.orderStatus
    console.log(modalstatus,stat);
    if( modalstatus < (stat)){
      console.log("flow error");
      setModalBody(
        {

          title: "Change Status",
          body: "The status you selected will affect the order delivery flow, do you want to continue?",


        }
      )
    }
    if (stat === 0) {
      setModalBody(
        {

          title: "Change Status",
          body: "Payment for this order has not been confimed yet. Do you still want to change status?",


        }
      )
    }
    if (stat === 5) {
      setModalBody(
        {

          title: "Change Status",
          body: "Payment for this order has failed. Do you still want to change status?",


        }
      )
    }
    setShow(true)


  }
  const statusOrder = async (e) => {
    e.preventDefault()
    modalClose()
    await appContext.getAxios().patch(path + "admin/orders/status", {}, { params: { orderId: modalId, status: modalStatus, productId:productId } }).then((res) => {

      console.log(res);
      toast.success("Status changed")
      getOrders()
      modalClose()

    }).catch((err) => {
      console.log(err);

      // toast.("status change failed")
      modalClose();
    })
    setModalBody({
      title: "Change Status",
      body: "Do you want to change the status?"

    })
    modalClose();
    
  }
  function openModal() {
    setShow(true);
  }
  const modalClose = () => {
    setShow(false);
    setModalBody({
      title: "Change Status",
      body: "Do you want to change the status?"

    })

  };
  const productClick =(e,id) =>{
    e.preventDefault()
    navigate("/products/"+id)
  }

  return (
    <>
      <section class="h-100 gradient-custom">
        {orders.length === 0 ? <div class="spinner-border m-5" role="status">
          <span class="sr-only"></span>
        </div> :
          <div class="container py-5 h-100">
            <h2 className="mb-5">Order Details</h2>
            <div class="row d-flex justify-content-center align-items-center h-100">
              <div class="col-lg-10 col-xl-8">
                <div class="card" >
                  {/* <div class="card-header py-4 " style={{ backgroundColor: 'white' }}>
                    <div className='row'>
                      <h5 class="px-0 mx-0 col-lg-4" >change status :</h5>
                      <div class="justify-content-center align-items-center mb-0 col-lg-8" >
                        <select className="form-select justify-content-center align-items-center" aria-label="subcategory" value={status} onChange={e => changeStatus(e.target.value, orders._id)}>
                          {orderStatus.map((sub, index) => {
                            
                              return <option key={index} value={sub.id}>{sub.name}</option>;
                            // }
                          })}
                        </select>
                      </div>
                    </div>
                  </div> */}
                  <div class="card-body p-4">

                    <div class="card shadow-0 border mb-4">
                      {
                        products.map((prod, index) => {
                          const total = prod.productQuantity * prod.amount
                          return (
                            <div class="card-body">
                              <div className='row mb-3'>
                      <h5 class="px-0 mx-0 col-lg-4" >change status :</h5>
                      <div class="justify-content-center align-items-center mb-0 col-lg-8" >
                        <select className="form-select justify-content-center align-items-center" aria-label="subcategory" value={prod.orderStatus} onChange={e => changeStatus(e.target.value, prod)}>
                          {/* <option value={""}>{getStatusName(status)}</option> */}
                          {orderStatus.map((sub, index) => {
                            
                              return <option key={index} value={sub.id}>{sub.name}</option>;
                            // }
                          })}
                        </select>
                      </div>
                    </div>
                   
                              <div class="row prod-hover" style={{cursor:'pointer'}} onClick={e =>productClick(e,prod._id)}>

                                <div class="col-md-2">
                                  <img src={aws_url + prod._id + "/" + prod.coverImage}
                                    class="img-fluid" alt="Phone" />
                                </div>
                                <div class="col-4 text-center d-flex justify-content-center align-items-center">
                                    { <h7 class=" mb-0  orderName">{prod.productName}</h7> }
                                  </div>
                                {/* <div class="col-md-2 text-center d-flex justify-content-center align-items-center">
                                  <p class="text-muted mb-0">{prod.productName}</p>
                                </div> */}
                                <div class="col-md-2 text-center d-flex justify-content-center align-items-center">
                                  <p class="text-muted mb-0">Price :{prod.amount}</p>
                                </div>

                                <div class="col-md-2 text-center d-flex justify-content-center align-items-center">
                                  <p class="text-muted mb-0 small">Qty: {prod.productQuantity}</p>
                                </div>
                                <div class="col-md-2 text-center d-flex justify-content-center align-items-center">
                                  <p class="text-muted mb-0 small">Total : {total.toFixed(5)}</p>
                                </div>

                              </div>
                              {(() => {
                        if (prod.orderStatus === 0) {
                          return (
                            <div class="row d-flex align-items-center">
                              <h2 className="text-center" style={{ color: 'black' }}>Waiting for payment</h2>
                            </div>
                          )
                        }
                        else if (prod.orderStatus in [1, 2, 3, 4, 5]) {
                          
                          return (
                            <div class="row d-flex align-items-center px-2 py-2">



                              <div class="col-md-2">
                                <h2 class="text-muted mb-0 small">Track Order</h2>
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
                          )
                        }

                        else if (prod.orderStatus === 5) {
                          return (
                            <div class="row d-flex align-items-center">
                              <h2 style={{ color: 'red' }}>Payment failed</h2>
                            </div>
                          )
                        }
                        else if (prod.orderStatus === 6) {
                          return (
                            <div class="row d-flex align-items-center">
                              <h2 style={{ color: 'red' }}>Order Cancelled</h2>
                            </div>
                          )
                        }
                        else if (prod.orderStatus === 7) {
                          return (
                            <div class="row d-flex align-items-center">
                              <h2 style={{ color: 'green' }}>Refund initiated</h2>
                            </div>
                          )
                        }
                        else if (prod.orderStatus === 8) {
                          return (
                            <div class="row d-flex align-items-center">
                              <h2 style={{ color: 'green' }}>Refund completed</h2>
                            </div>
                          )
                        }
                        else if (prod.orderStatus == 9) {
                          return (
                            <div class="row d-flex align-items-center">
                              <h2 style={{ color: 'red' }}>Refund failed</h2>
                            </div>
                          )
                        }
                        else if (prod.orderStatus === 10) {
                          return (
                            <div class="row d-flex align-items-center">
                              <h2 style={{ color: 'green' }}>Return initiated</h2>
                            </div>
                          )
                        }
                        else if (prod.orderStatus === 11) {
                          return (
                            <div class="row d-flex align-items-center">
                              <h2 style={{ color: 'green' }}>Return completed</h2>
                            </div>
                          )
                        }

                      })()}
                              <hr class="mb-4" style={{ backgroundColor: '#e0e0e0' }} />

                            </div>
                            )

                        })
                      }

                      
                    </div>



                    <div>

                      {Number(orders.totalEthereumPaid) > 0 && <div class='row'>
                        <div class="col-lg-8 fw-bold"></div>
                        <div class='col-lg-2 fw-bold'>Ethereum Used:</div>
                        <div class='col-lg-2 text-start'>{Number(orders.totalEthereumPaid).toFixed(10)}</div>
                      </div>}
                      <div class='row'>
                        <div class="col-lg-8 fw-bold"></div>
                        <div class='col-lg-2 fw-bold '>Order total:</div>
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
                    </div>
                    <div class="row border rounded p-1 my-3">
                     
                            <div class="col-md ">
                              <div class="d-flex flex-column align-items left ">
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
          </div>}
      </section>
      <StatusConfirmModal show={show} close={modalClose} yes={statusOrder} body={modalBody} />
    </>
  )
}

export default OrderDetails