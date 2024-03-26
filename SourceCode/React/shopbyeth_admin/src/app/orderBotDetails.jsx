import { useEffect, useState } from 'react';
import useAppContext from '../AppContext';
import ListGroup from 'react-bootstrap/ListGroup';
import { Link } from 'react-router-dom';

const OrderBotDetails  =(props) => {
  const appContext = useAppContext()
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const aws_url = process.env.REACT_APP_AWS_ENDPOINT;
  const [orderDetails, setOrderDetails] = useState()
  const getOrderStatus = (id) =>{
    console.log("ss",id);
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
    if (props.id) {
      props.setLoad(0)
      getBotOrderDetails(props.id)
    }
  },[props.id])
  useEffect(()=>{
    // console.log(orderDetails);
  },[orderDetails])
  const getBotOrderDetails =async(id) =>{
    await appContext.getAxios().get(base_url+"admin/orders/"+id).then((res)=>{
      // console.log(res.data[0]);
      let details =res.data[0]
      props.setLoad(1)
      console.log(props.productId);
      console.log(details.products.filter((res)=>""+res._id === ""+props.productId));
      setOrderDetails({...res.data[0],"products":details.products.filter((res)=>""+res._id === ""+props.productId)})
    })
  }
  return(<div>{orderDetails?<div className="bot-container"><h5 style={{color:'#F7941D'}}>Order Details</h5>
  <div className="bot-products">
   
    <div className="chat-order-status py-2 fw-bold">
     <span className='fw-bold'>Order Status: </span>  {getOrderStatus(orderDetails.products.find((res)=>+res._id === +props.productId ).orderStatus)}</div>
     <div className="chat-order-status py-2 fw-bold">
     <span className='fw-bold'>Order Id: </span> <Link target="_blank" className='link-chat' to={"/orderdetails/"+orderDetails._id}>{orderDetails._id}</Link>
     
    </div>
    <div className="chat-order-status py-2 fw-bold">
    <span className='fw-bold'>Product Id: </span> <Link target="_blank" className='link-chat' to={"/products/"+props.productId}>{props.productId}</Link> 
    </div> 
    {orderDetails?.products.map((res,index)=>{
     return <div key={index} className="row d-flex align-items-center">
      <div className="col-lg-4 col-12">
      <img src={aws_url + res._id + "/" + res.coverImage}
                                className="img-fluid" alt="Phone" />
      </div>
      <div className="col-lg-3 cpl-12 bot-prod-name text-break">
        {res.productName.length >20 ? res.productName.slice(0,20)+"....":res.productName}
      </div>
      <div className="col-lg-5 col-12 flex-column d-flex ">
        <span className='fw-bold text-break bot-spacing'><span>Qty:</span><span>{res.productQuantity}</span> </span>
        <span className='fw-bold text-break bot-spacing'><span>Price:</span>${res.amount}<span></span></span>
        
        
      </div>
     </div>
    })}
    {
      orderDetails.products.filter((res)=>{
        return res._id === props.productId
      }).map((res)=>{
        return console.log("res"+res);
        })
    }
    <div className="px-2">
      <div className="row">
      <ListGroup variant="flush">
      <ListGroup.Item className='chat-list-item-spec'><span className='bot-spec'><span>Ethereum used </span><span>{Number(orderDetails.totalEthereumPaid).toFixed(10)}</span></span></ListGroup.Item>
      <ListGroup.Item className='chat-list-item-spec'><span className='bot-spec'><span>Payment status </span><span>{getPaymentStatus(orderDetails.paymentStatus)}</span></span></ListGroup.Item>
      <ListGroup.Item className='chat-list-item-spec'><span className='bot-spec'><span>Total</span><span>{orderDetails.total.toFixed(5)}</span></span></ListGroup.Item>

    </ListGroup>
      </div>
    </div>
  </div>
 </div>:
 <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
 }
  </div>)
}
export default OrderBotDetails