import React, { useState, useEffect } from 'react'
import useAppContext from '../AppContext';
import { Link, useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import Paginations from './pagination';
import ChatBot from 'react-simple-chatbot';
import SimpleChatBot from './simpleChatBot';

const OrderList = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [products, setProducts] = useState([]);
  const aws_url = process.env.REACT_APP_AWS_ENDPOINT;
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const appContext = useAppContext()
  const path = process.env.REACT_APP_API_ENDPOINT;
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0)
  const [orderList, setOrderList] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [value, setValue] = useState("")
  // const orderStatus = steps.order.value
  useEffect(() => {
    getOrders()
  }, [totalPages, page]);
  const [stepState, setStepState] = useState([])
 
const getAllOrderDetails =async () =>{
  let allParams = {
    createdate:-1,
    page:1,
    size:10,
    
}
let deliverParams = {
  createdate:-1,
  page:1,
  size:10,
  orderstat:2
}
let cancelParams = {
createdate:-1,
page:1,
size:10,
orderstat:1
}
let refundParams = {
  createdate :-1,
  page:1,
  size:10,
  orderStat:10
}
// let AllOrderArray = []
// let cancelOrderArray = []
let deliverOrderArray ,cancelOrderArray,AllOrderArray, refundOrderArray =[]
  await appContext.getAxios().get(path+"users/orders",{params:allParams}).then((res)=>{

    

    res.data.docs.forEach((order)=>{
        let productName = order.products.length > 1 ? order.products[0].productName +", ..." : order.products[0].productName
        AllOrderArray.push({
            value:order._id,
            label:productName,
            trigger:"orderDetails"
        })
    })

    
    
  
})
await appContext.getAxios().get(path+"users/orders",{params:cancelParams}).then((res)=>{

    

  res.data.docs.forEach((order)=>{
      let productName = order.products.length > 1 ? order.products[0].productName +", ..." : order.products[0].productName
      cancelOrderArray.push({
          value:order._id,
          label:productName,
          trigger:"orderDetails"
      })
  })

  
  

})
await appContext.getAxios().get(path+"users/orders",{params:deliverParams}).then((res)=>{

    

  res.data.docs.forEach((order)=>{
      let productName = order.products.length > 1 ? order.products[0].productName +", ..." : order.products[0].productName
      deliverOrderArray.push({
          value:order._id,
          label:productName,
          trigger:"cancelOrder"
      })
  })

  
  

})
await appContext.getAxios().get(path+"users/orders",{params:refundParams}).then((res)=>{

    

  res.data.docs.forEach((order)=>{
      let productName = order.products.length > 1 ? order.products[0].productName +", ..." : order.products[0].productName
      refundOrderArray.push({
          value:order._id,
          label:productName,
          trigger:"refundOrder"
      })
  })

  
  

})

const step =   [
  {
    id: '0',
    message: 'Thank you for being a valuable customer',
    trigger: '1',
  },
  {
    id: '1',
    message: "I'm here to help you",
    trigger: '2',
  },
  {
    id: '2',
    component: (
      <div> Please select an option </div>
    ),
    trigger: 'orders',
  },
  {
    id:'orders',
    options: [
      { value: 1, label: 'Order related', trigger:  'orderRelated'
      },
      { value: 2, label: 'Delivery related', trigger: 'deliverOrder' },
      { value: 3, label: 'Cancel order', trigger: 'cancelOrder' },
      {value:4, label:'Refund related', trigger:'refundOrder'}
    ],
  },

  {
    id:'orderRelated',
    options: AllOrderArray,
  },
  {
    id:'cancelOrder',
    options:cancelOrderArray
  },
  {
    id:'deliverOrder',
    options:deliverOrderArray
  },
  {
    id:'refundOrder',
    options:refundOrderArray
  },
  {
    id: 'orderDetails',
    component: (
      <div>order details</div>
    ),
   
  },

  


]
setStepState(step)
setLoaded(true)




}
useEffect(()=>{
  getAllOrderDetails()
},[])
useEffect(()=>{
  console.log(stepState);
},[stepState])
useEffect(()=>{
  console.log(loaded);
},[loaded])
  

  const getStatusName = (status) => {
    let statusName;
    try {
      switch (status) {
        case 0:
          statusName = "Waiting for payment confirmation";
          break;
        case 1:
          statusName = "Placed";
          break;
        case 2:
          statusName = "Shipped ";
          break;
        case 3:
          statusName = "Out for delivery";
          break;
        case 4:
          statusName = "Delivered";
          break;
        case 5:
          statusName = "Payment failed";
          break;
        case 6:
          statusName = "Cancelled";
          break;
        case 7:
          statusName = "Refund initiated";
          break;
        case 8:
          statusName = "Refund completed";
          break;
        case 9:
          statusName = "Refund failed";
          break;
          case 10:
            statusName = "Return initiated";
            break;
            case 11:
              statusName = "Return completed";
              break;
        default:
          statusName = "";
      }
      return statusName;
    } catch (error) {
      console.log(error);
    }
  }
  const pageChange = (number) => {
    //e.preventDefault()
    console.log(number.selected + 1);
    setPage(number)
  }
  const getOrders = async () => {
    await appContext.getAxios().get(path + "users/orders", { params: { createdate: -1, page: page, size: 10 } }).then((res) => {

      console.log(res.data);
      setAllOrders(res.data.docs);
      setProducts(allOrders.products);
      setLoading(false)
      setTotalPages(res.data.totalPages)
      setTotalItems(res.data.totalDocs)
    window.scrollTo(0, 0);


    }).catch((err) => {
      console.log(err);
    })
  }

  const orderDetails = (e, id) => {
    e.preventDefault()

    navigate("/orderdetails/" + id)

  };
  const settingWidth = (status) => {
    var width = 0;
    if (status === 0) {

      width = 10;
    }
    else if (status === 1) {

      width = 15
    }
    else if (status === 2) {

      width = 25
    }
    else if (status === 3) {

      width = 50
    }
    else if (status === 4) {

      width = 80
    }
    else if (status === 5) {

      width = 100
    }
    console.log('width', width);
    return width;

  }

  return (
    <div class="body-container " >
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
                    <Link to="/orders">Orders</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <h2 className="mb-5 text-center" style={{ marginTop: '2rem' }}>My Orders</h2>
      {allOrders.length > 0 ?
        <div class=" mb-4" style={{ paddingBottom: '0rem' }}>

          {

            allOrders.map((orders, index) => {
              const date = orders.createdAt
              console.log(date);
              return (
                <section key={index} class="h-100 gradient-custom" >
                  <div class="container  " >
                    <div class="row d-flex justify-content-center align-items-center h-100">
                      <div class="col-lg-8 col-xl-8 r">
                        <div  >
                          <div >
                            <div class="card shadow-0 border mb-4">
                              < div class="card-body check" onClick={e => orderDetails(e, orders._id)}>
                                <div class="row">
                                  <div class="col-3  ">
                                    <img src={aws_url + orders.products[0]._id + "/" + orders.products[0].coverImage}
                                      class="img-fluid" style={{objectFit:"cover",width:'-webkit-fill-available'}} alt="Phone" />
                                    {orders.products.length > 1 ? <h5 class="nocheck ms-3" >+{orders.products.length - 1} more</h5> : ""}
                                  </div>
                                  <div class="col-3 text-center d-flex justify-content-center align-items-center">
                                    {orders.products.length > 1 ? <h7 class=" mb-0 check orderName">{orders.products[0].productName},...</h7> : <h7 class=" mb-0 check orderName">{orders.products[0].productName}</h7>}
                                  </div>
                                  <div class="col-3 text-center d-flex justify-content-center align-items-center">
                                    <h7 class=" mb-0 check">Placed on:{orders.createdAt.split("T")[0]}</h7>
                                  </div>
                                  <div class="col-3 text-center d-flex justify-content-center align-items-center">
                                    <h7 class=" mb-0 check">${(orders.total-orders.discount).toFixed(5)}</h7>
                                  </div>

                                  

                                </div>


                              </div>







                            </div>



                            <div>

                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>

                </section>)
            })
          }
        </div> : loading ? <div class="d-flex justify-content-center">
          <div class="spinner-border text-warning" role="status">
            <span class="sr-only"></span>
          </div>
        </div> : <div className="text-center p-5">No Orders Found!</div>}
      {allOrders.length > 0 && totalPages > 1 ?
        // <ReactPaginate
        //   breakLabel="..."
        //   nextLabel="next >"
        //   onPageChange={pageChange}
        //   marginPagesDisplayed={2}
        //   pageRangeDisplayed={1}
        //   pageCount={totalPages}
        //   previousLabel="< previous"
        //   renderOnZeroPageCount={null}

        //   breakClassName={'page-item'}
        //   breakLinkClassName={'page-link'}
        //   containerClassName={'pagination'}
        //   pageClassName={'page-item'}
        //   pageLinkClassName={'page-link'}
        //   previousClassName={'page-item'}
        //   previousLinkClassName={'page-link'}
        //   nextClassName={'page-item'}
        //   nextLinkClassName={'page-link'}
        //   activeClassName={'active'}
        // />
        <Paginations
                className="pagination-bar"
                currentPage={page}
                totalCount={+totalItems}
                pageSize={10}
                onPageChange={(page) => pageChange(+page)}
              />
         : ""}
         <div>
        {/* <SimpleChatBot step = {stepState} loaded = {loaded}/> */}
  </div>
    </div >

  )
}

export default OrderList