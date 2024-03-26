import { useEffect, useState } from 'react';
import { Loading } from 'react-simple-chatbot';
import useAppContext from '../AppContext';
import ListGroup from 'react-bootstrap/ListGroup';

const OrderBotDetails  =(props) => {
  const appContext = useAppContext()
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const aws_url = process.env.REACT_APP_AWS_ENDPOINT;
  const [orderDetails, setOrderDetails] = useState()
  const getOrderStatus = (id) =>{
    const status =[
    { id: 0, name: "Waiting for payment" },
    { id: 1, name: "Placed" },
    { id: 2, name: "Shipped" },
    { id: 3, name: "Out for delivery" },
    { id: 4, name: "Delivered" },
    { id: 5, name: "Payment failed" },
    { id: 6, name: "Cancelled" },
    { id: 7, name: "Refund initiated" },
    { id: 8, name: "Refund completed" },
    { id: 9, name: "Refund failed" },
    { id: 10, name: "Return initiated" },
    { id: 11, name: "Return completed" }
    ]
    return status.find((res)=>res.id === id).name
  }
  const getPaymentStatus = (id) =>{
    const status = [
      {id: 0, name:"Waiting for payment"},
      { id: 1, name: "Initiated" },
      { id: 2, name: "Success" },
      { id: 3, name: "Failed" }
    ]
    return status.find((res)=>res.id === id).name
  }
  useEffect(()=>{
    if (props.previousStep.value) {
      
      getBotOrderDetails(props.previousStep.value)
    }
  },[props.previousStep.value])
  useEffect(()=>{
    console.log(orderDetails);
  },[orderDetails])
  const getBotOrderDetails =async(id) =>{
    await appContext.getAxios().get(base_url+"users/orders/"+id).then((res)=>{
      props.setId(id)
      console.log(res.data[0]);
      setOrderDetails(res.data[0])
    })
  }
  return(<div>{orderDetails?<div className="bot-container"><h5 style={{color:'#F7941D'}}>Order Details</h5>
  <div className="bot-products">
   
    <div className="status py-2 fw-bold">
     <span className='fw-bold'>Order Status: </span>  {getOrderStatus(orderDetails.orderStatus)}
    </div>
    {orderDetails?.products.map((res,index)=>{
     return <div key={index} className="row product-bot-list">
      <div className="col-4">
      <img src={aws_url + res._id + "/" + res.coverImage}
                                className="thumb-image-bot" height={200} width={200}  alt="Phone" />
      </div>
      <div className="col-4 bot-prod-name">
        {res.productName.length >20 ? res.productName.slice(0,20)+"....":res.productName}
      </div>
      <div className="col-4 d-flex ">
        <span className='fw-bold'>Qty: {res.productQuantity}</span>
        <span className='fw-bold'>Price: ${res.amount}</span>
        
        
      </div>
     </div>
    })}
    <div className="px-2">
      <div className="row">
      <ListGroup variant="flush">
      <ListGroup.Item><span className='bot-spec'><span>Ethereum used </span><span>{Number(orderDetails.totalEthereumPaid).toFixed(10)}</span></span></ListGroup.Item>
      <ListGroup.Item><span className='bot-spec'><span>Payment status </span><span>{getPaymentStatus(orderDetails.paymentStatus)}</span></span></ListGroup.Item>
      <ListGroup.Item><span className='bot-spec'><span>Total</span><span>{orderDetails.total.toFixed(5)}</span></span></ListGroup.Item>

    </ListGroup>
      </div>
    </div>
  </div>
 </div>:<Loading/>}
  </div>)
}
export default OrderBotDetails