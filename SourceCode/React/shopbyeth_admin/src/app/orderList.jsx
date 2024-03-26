import React, { useState, useEffect } from 'react'
import axios from "axios";
import useAppContext from '../AppContext';
import { useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { toast } from "react-toastify";
import getStatusName from './orderStatus';
import {
  AiOutlineSearch,AiFillEye
} from "react-icons/ai";
import Paginations from './pagination';
const OrderList = () => {
  const [username, setUserName] = useState("");
  const [orderId, setOrderId] = useState()
  const [allOrders, setAllOrders] = useState([]);
  const [totalPages, setTotalPages] = useState();
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [date, setDate] = useState(-1);
  const [keyword, setKeyWord] = useState("")
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const appContext = useAppContext()
  const path = process.env.REACT_APP_API_ENDPOINT;
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0)
  const [parameters,setParameters]=useState({
    date:-1,
    page:1,
    size:20,
    payment:"",
    status:"",
    keyword:""
  })
  const onInputChange = (e) =>{
    e.preventDefault();
    if(e.target.name === "date"){
      setParameters({
        ...parameters,
        "date":e.target.value,
        "page":1
      })
    }
    else if(e.target.name === "payment"){
      setParameters({
        ...parameters,
        "payment":e.target.value,
        "page":1
      })
    }
   else if(e.target.name === "status"){
      setParameters({
        ...parameters,
        "status":e.target.value,
        "page":1
      })
    }
    else if(e.target.name === "keyword"){
      setParameters({
        ...parameters,
        "keyword":e.target.value,
        "page":1
      })
    }
  }
  useEffect(() => {
    getOrders()
  }, [parameters])
  const pageChange = (number) => {

    setPage(number.selected + 1);
    setParameters({
      ...parameters,
      "page":number
    })
  }
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
  const paymentStatus = [
    {id: 0, name:"Waiting"},
    { id: 1, name: "Initiated" },
    { id: 2, name: "Success" },
    {id:3,name:"Failed"}
    
  ]
  const sortList = [
    { id: -1, name: "Newest" },
    { id: 1, name: "Oldest" }
  ]

  const getOrders = async () => {
    let params = { createdate: parameters.date, page: parameters.page, size: parameters.size }
    if (parameters.payment !== "") {
      params.paystat = parameters.payment
    }
    else {
      delete params.paystat
    }
    if (parameters.status !== "") {
      params.orderstat = parameters.status
    }
    else {
      delete params.orderstat
    }
    if (parameters.keyword !== "") {
      params.keyword = parameters.keyword
    }
    else {
      delete params.keyword
    }
    console.log("keywrd", parameters.keyword);
    await appContext.getAxios().get(path + "admin/orders", { params: params }).then((res) => {


      console.log(res.data.docs);
      setAllOrders(res.data.docs);
      console.log('orders',res.data.docs);
      setLoading(false)
      setTotalPages(res.data.totalPages)
      setTotalItems(res.data.totalDocs)


    }).catch((err) => {
      console.log(err);
    })


  }

  const orderDetails = (e, id) => {
    e.preventDefault()
    navigate("/orderdetails/" + id)


  }
  const submitHandle = (e) => {
    e.preventDefault()
    setParameters({
      ...parameters,
      "keyword":keyword.trim(),
      "page":1
    })
    
  }
  const clear =(e)=>{
    e.preventDefault()
    setParameters({
    date:-1,
    page:1,
    size:20,
    payment:"",
    status:"",
    keyword:""
    })
    setKeyWord("")
  }

  return (
    <div className='mt-5'>

      <div className="container">
        <h2 className="mb-5">Orders</h2>


        <form >
          <div className="row d-flex justify-content-between" style={{ paddingBottom: '2rem' }} >

            <div className="col-lg-3 col-12 product-list">
              <div className="form-group">
                <label className="mb-1"> Payment status</label>
                <select className="form-select" aria-label="Category" value={parameters.payment} name="payment" onChange={e => onInputChange(e)}>
                  <option value={""}>All</option>
                  {paymentStatus.map((cat, index) => {
                    return <option key={index} value={cat.id}>{cat.name}</option>;
                  })}
                </select>
              </div>
            </div>
            {/* <div className="col-lg-2 col-12 product-list">
              <div className="form-group">
                <label className="mb-1"> Order status</label>
                <select className="form-select" aria-label="subcategory" value={parameters.status} name="status" onChange={e => onInputChange(e)}>
                  <option value={""} >All</option>

                  {orderStatus.map((sub, index) => {
                    return <option key={index} value={sub.id}>{sub.name}</option>;
                  })}
                </select>
              </div>
            </div> */}
            <div className="col-lg-3 col-12 product-list">
              <div className="form-group">
                <label className="mb-1"> Sort</label>
                <select className="form-select" aria-label="sort" value={parameters.date} name="date" onChange={e => onInputChange(e)}>
                  {sortList.map((sort, index) => {
                    return <option key={index} value={sort.id}>{sort.name}</option>;
                  })}
                </select>
              </div>
            </div>
            <div className="col-lg-3 col-12 product-list">
              <div className="form-group">
                <label className="mb-1">Search</label>
                <span className="search-input">
                  <input type="text" className=" search-text"
                    value={keyword}
                    onChange={(e) => setKeyWord(e.target.value)} />
                  <span className="input-group-btn pl-1">
                    <button
                      className="btn btn-search ms-2"
                      style={{
                        backgroundColor: "#F7941D",
                        color: "white",
                      }}
                      onClick={e=>submitHandle(e)}
                    >
                      <AiOutlineSearch />
                    </button>
                  </span>
                </span>
              </div>
              
            </div>
            <div className="buttons col-lg-2 ">
            <button className="button mt-2" onClick={(e)=>clear(e)} style={{height:"60px"}}>
              Clear
            </button>
          </div>
          </div>
        </form>

        <table className="table orders-table">
          <thead>
            <tr className='orders-row'>
              <th scope="col">#</th>
              <th scope="col" className='order-id'>OrderId</th>
              <th scope="col" className='name'>Name</th>
              <th scope="col" className='date'>Ordered date</th>
              <th scope="col" className='status'>Payment status</th>
              {/* <th scope="col" className='order-status'>Order status</th> */}
              <th scope="col" className='amount'>Total amount</th>
              <th className='action'></th>
            </tr>
          </thead>
          <>
            <tbody>
              

              {allOrders?.length > 0 ?
                allOrders.map((order, index) => {


                  const date = order.createdAt.split("T")


                  return (<tr key={index} >
                    <th scope="row"  >{(parameters.page-1)*20+index+1 }</th>
                    <td >{order._id}</td>
                    <td className='orders-name'>{order.userName}</td>

                    <td  >{date[0]}</td>
                    {order.paymentStatus === 2 ? <td  >success</td> : order.paymentStatus===0 ? <td  >Waiting</td> : order.paymentStatus===1 ?  <td  >Initiated</td> : <td  >Failed</td>}
                    {/* <td  >{getStatusName(order.orderStatus)}

                    </td> */}
                    <td className='order-total'>${order.total.toFixed(5)}</td>
                    <th><td><AiFillEye onClick={e => orderDetails(e, order._id)} className="down-arrow" /></td></th>

                  </tr>)

                }) :
                loading ? <tr>
                  <td colSpan={6}><div class="spinner-border text-warning mt-5" role="status">
                    <span class="sr-only"></span>
                  </div> </td>
                </tr> :
                  <tr><td colSpan={6}>No orders</td></tr>

              }


            </tbody>
          </>
        </table>
        <span className="mb-5 mt-2 d-flex justify-content-between align-items-start">
          {totalItems >0 &&<span className="product-total ps-3">
            {totalItems} Orders 
          </span>}
          <span>
          {allOrders.length > 0 && totalPages > 1 ?
          <Paginations
          className="pagination-bar"
          currentPage={+parameters.page}
          totalCount={+totalItems}
          pageSize={+parameters.size}
          onPageChange={(page) => pageChange(+page)}
        />: ""}
          </span>
        </span>
        
      </div>
    </div>
  )
}

export default OrderList