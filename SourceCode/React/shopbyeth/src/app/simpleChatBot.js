import React, { useMemo, useState } from 'react'
import { useEffect } from 'react';
import ChatBot ,{ Loading } from 'react-simple-chatbot';
import useAppContext from '../AppContext';


import { ThemeProvider } from 'styled-components';
import OrderBotDetails from './orderBotDetails';
import { useRef } from 'react';

const theme = {
  background: '#f5f8fb',
  fontFamily: 'Roboto,Arial,sans-serif',
  headerBgColor: '#F7941D',
  headerFontColor: '#fff',
  headerFontSize: '17px',
  botBubbleColor: '#282c34',
  botFontColor: '#fff',
  userBubbleColor: '#fff',
  userFontColor: '#4a4a4a',
  fontSize:'25px'
};


const SimpleChatBot = (props) => {
    const appContext = useAppContext()
    const base_url = process.env.REACT_APP_API_ENDPOINT;
    // const [orderList, setOrderList] = useState([])

    const [loaded, setLoaded] = useState(false)
    const [value, setValue] = useState("")
    const [selectedProductId, setSelectedProductId] = useState("")
    const [stepDetailsState, setStepDetailsState] = useState([])
    const [stepState, setStepState] = useState([])
    const [botOrderId, setBotOrderId] = useState("sss")
    const selectedId = useRef(null)

  useEffect(()=>{
    console.log(botOrderId);
  },[botOrderId])
    useEffect(()=>{
      console.log(value);
    },[value])
    const setVar =(e) =>{
      e.preventDefault()
      setValue("wwwwwwwwww")
  }
  function setOrderId (id) {
    console.log("works",id);
    setBotOrderId(id)
    selectedId.current =id
  }
 

    const noOrderTrigger = (value) =>{
      console.log(value);
      return '0'
    }
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
      orderstatus:"0,1,2,3,4"
    }
    let cancelParams = {
    createdate:-1,
    page:1,
    size:10,
    orderstatus:"0,1"
    }
    let refundParams = {
      createdate :-1,
      page:1,
      size:10,
      orderstatus:"7,8,9,10,11"
    }
    let AllOrderArray = []
    let cancelOrderArray = []
    let deliverOrderArray = []
    let refundOrderArray = []
    // let deliverOrderArray ,cancelOrderArray,AllOrderArray, refundOrderArray =[]
      await appContext.getAxios().get(base_url+"users/orders",{params:allParams}).then((res)=>{
    
        
    
        res.data.docs.forEach((order)=>{
            let productName = order.products.length > 1 ? order.products[0].productName +", ..." : order.products[0].productName
            AllOrderArray.push({
                value:order._id,
                label:productName,
                trigger:({value,steps})=>{
                  setLoaded(false)
                  setLoaded(true)
                  return 'orderDetails'
                }
            })
        })
        // trigger:  ({value,steps})=>{
        //   triggerFunc(value,steps)
        //   if (true) {
        //     return 'orderRelated'
        //   }
        //   else{
        //     return
        //   }
          
        // }
        
        
      
    })
  
    // await appContext.getAxios().get(base_url+"users/orders",{params:cancelParams}).then((res)=>{
    
        
    
    //   res.data.docs.forEach((order)=>{
    //       let productName = order.products.length > 1 ? order.products[0].productName +", ..." : order.products[0].productName
    //       cancelOrderArray.push({
    //           value:order._id,
    //           label:productName,
    //           trigger:"orderDetails"
    //       })
    //   })
    
      
      
    
    // })
    await appContext.getAxios().get(base_url+"users/orders",{params:deliverParams}).then((res)=>{
    
        
    
      res.data.docs.forEach((order)=>{
          let productName = order.products.length > 1 ? order.products[0].productName +", ..." : order.products[0].productName
          deliverOrderArray.push({
              value:order._id,
              label:productName,
              trigger:({value,steps})=>{
                setLoaded(false)
                setLoaded(true)
                return 'orderDetails'
              }
          })
      })
    
      
      
    
    })
    await appContext.getAxios().get(base_url+"users/orders",{params:refundParams}).then((res)=>{
    
        
    
      res.data.docs.forEach((order)=>{
          let productName = order.products.length > 1 ? order.products[0].productName +", ..." : order.products[0].productName
          refundOrderArray.push({
              value:order._id,
              label:productName,
              trigger:({value,steps})=>{
                setLoaded(false)
                console.log("good");
                setValue("good")
                setLoaded(true)
                return 'orderDetails'
              }
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
        message:"Please select an option",
        trigger: 'orders',
      },
      {
        id:'orders',
        options: [
          { value: 1, label: 'Order related', trigger:  ()=>{
            console.log(step[4].options);
            if (step[4].options.length>0) {
              return 'orderRelated'
            }
            else{
                 return 'noOrders'
            }
          }
          },
          { value: 2, label: 'Delivery related', trigger: ()=>{
            console.log(step);
            if (step[7].options.length>0) {
              return 'deliverOrder'
            }
            else{
              return 'noOrders'
            }
          } },
          // { value: 3, label: 'Cancel order', trigger: 'cancelOrder' },
          {value:4, label:'Refund status', trigger:()=>{
            console.log(step[7].options);
            if (step[7].options.length>0) {
              return 'refundOrder'
            }
            else{
                 return 'noOrders'
            }
          }}
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
        <OrderBotDetails setId={setOrderId} />
          // <div className='order-details-bot'>
          //   {!value ? <Loading/> :  "result" }
          //   {value && <div>value is {value}</div>}
          // </div>
          // <Checking/>
        ),
        trigger:'needHelp'
       
      },
      {
        id: 'noOrders',
        message: "Sorry You don't have any orders ",
        trigger:"2"
      },
      {
        id: 'needHelp',
        message: "still need help?",
        trigger:"needHelpOptions"
      },
      {
        id: 'needHelpOptions',
        options:[
          {value:1 , label:"Yes" , trigger :"optionMessage"},
          {value:0 , label:"No" , trigger :"2"}
        ]

      },
      {
        id:"thanks",
        message:"Thank you for your valuable time",
        end:true

      },
      {
        id:'optionMessage' ,
        message:"Please enter you query",
        trigger:"yesOption"
      },
      {
        id:"yesOption" , 
        user:true ,
        validator: (value) => {
          if ((value.length<3 || value.length>200)) {
            return 'Enter valid query';
          }
          return true;
        },
        trigger:(value,steps)=>{
          // sendResponse(value,steps)
          return "noOption"
        }
      },
      {
        id:"noOption" ,
        message:"Thank you for your query , Our team will getback to you",
          end:true
      }

    
      
    
    
    ]
    setStepState(step)
    setLoaded(true)
    
    
    
    
    }
    const getIndividualOrders = (order) =>{
      // console.log(order);
      const productList = []
      order.products.forEach((res)=>{
        let label = res.productName.length>20 ? res.productName.slice(0,20)+"..." : res.productName
        console.log(label);
        switch(res.orderStatus){
          case 0:
            productList.push({
              value:res._id,
              label:label,
              trigger:"help",
              metadata:{value:"waitingForPayment"}
            })      
            break;
            case 1:
              productList.push({
                value:res._id,
                label:label,
                trigger:"help",
                metadata:{value:"placed"}
              })      
              break;
              
          case 2:
            productList.push({
              value:res._id,
              label:label,
              trigger:"help",
              metadata:{value:"shipped"}
            })      
          break;
          case 3:
            productList.push({
              value:res._id,
              label:label,
              trigger:"help",
              metadata:{value:"outfordelivery"}
            })      
          break;
          case 4:
            productList.push({
              value:res._id,
              label:label,
              trigger:"help",
              metadata:{value:"delivered"}
            })      
          break;
          case 5:
            productList.push({
              value:res._id,
              label:label,
              trigger:"help",
              metadata:{value:"paymentFailed"}
            })      
          break;

          case 6:
            productList.push({
              value:res._id,
              label:label,
              trigger:"help",
              metadata:{value:"cancel"}
            })      
          break;
          case 7:
            productList.push({
              value:res._id,
              label:label,
              trigger:"help",
              metadata:{value:"refundInitiated"}
            })      
          break;
          case 8:
            productList.push({
              value:res._id,
              label:label,
              trigger:"help",
              metadata:{value:"refundCompleted"}
            })      
          break;
          case 9:
            productList.push({
              value:res._id,
              label:label,
              trigger:"help",
              metadata:{value:"refundFailed"}
            })      
          break;
          case 10:
            productList.push({
              value:res._id,
              label:label,
              trigger:"help",
              metadata:{value:"returnInitiated"}
            })      
          break;

          case 11:
            productList.push({
              value:res._id,
              label:label,
              trigger:"help",
              metadata:{value:"returnCompleted"}
            })      
          break;
          default :
            return ""
        }
        // productList.push({
        //   value:res._id,
        //   label:res.productName,
        //   trigger:()=>{
            
        //     return "help"
        //   }

        // })
      })
      const waitingForPaymentOptions = [
        {value:"payment-hash" ,label:"Payment Done ! Order not placed yet",trigger:"waiting-request"},
        {value:"queryOption",label:"other",trigger:"query-request"}
      ]
      const placedOptions = [
        {value:"not-shipped" ,label :"Not shipped yet?",trigger:"not-shipped-request"},
        {value:"queryOption",label:"other",trigger:"query-request"}
        
      ]
      const shippedOptions = [
        {value:"order-track",label:"Where's my order ?", trigger:"shipped-track-order"},
        {value:"queryOption",label:"other",trigger:"query-request"}
      ]
      const outForDeliveryOptions = [
        {value:"od-order-track",label:"Track my order", trigger:"od-track-order"},
        {value:"queryOption",label:"other",trigger:"query-request"}
      ]
      const deliveredOptions = [
        {value:"damage",label:"Damaged product" , trigger:"sorry-to-hear"},
        {value:"queryOption",label:"other",trigger:"query-request"}
      ]
      const paymentFailedOptions= [
        {value:"money-debited",label:"Money debited but order was not successful" ,trigger:"payment-hash-request"},
        {value:"queryOption",label:"other",trigger:"query-request"}
      ]
      const cancelOptions =[
        {value:"no-refund", label : "Didn't get refund",trigger:()=>{
          return "no-refund-request"
        }},
        {value:"queryOption",label:"other",trigger:"query-request"}   
      ]
      const refundInitiatedOptions =[
        {value:"whereIsRefund" ,label:"Where's my refund ?" , trigger:"refundProcessing"},
        {value:"queryOption",label:"other",trigger:"query-request"}   
      ]
      const refundCompletedOptions = [
        {value:"refundNotRecievedOption" , label :"Refund not recieved yet?" , trigger:"no-refund-request"},
        {value:"queryOption",label:"other",trigger:"query-request"}
      ]
      const refundFailedOptions = [
        {value:"refundFailed" , label:"Why my refund failed ?",trigger:"no-refund-request"},
        {value:"queryOption",label:"other",trigger:"query-request"}
      ]
      const returnInitiatedOptions = [
        {value:"returnInitiatedOption",label:"Pickup time ?" , trigger:"pickup-time"},
        {value:"queryOption",label:"other",trigger:"query-request"}
      ]
      const returnCompletedOptions=[
        {value:"returnCompletedOption",label:"Where's my refund ?" , trigger:"refundProcessing"},
        {value:"queryOption",label:"other",trigger:"query-request"}
      ]

      console.log(productList);
      const step =   [
        {
          id: '0',
          message: 'Thank you for being a valuable customer',
          trigger: (value,step)=>{
            // console.log(value);
            // console.log(step?.products);
            return "1"
          }
        }, {
          id: '1',
          message: "I'm here to help you",
          trigger: '2',
        },
        {
          id: '2',
          message:"Is this the product you need help with?",
          trigger: 'products',
        },
        {
          id: 'products',
         options:productList
        },
        {
          id:'waitingForPayment',
          options:waitingForPaymentOptions
        },
        {
          id:'placed',
          options:placedOptions
        },
        {
          id:'shipped',
          options:shippedOptions
        },
        {
          id:'outfordelivery',
          options:outForDeliveryOptions
        },
        {
          id:'delivered',
          options:deliveredOptions
        },
        {
          id:'paymentFailed',
          options:paymentFailedOptions
        },
        {
          id:'cancel',
          options:cancelOptions
        },
        {
          id:'refundInitiated',
          options:refundInitiatedOptions
        },
        {
          id:'refundCompleted',
          options:refundCompletedOptions
        },
        {
          id:'refundFailed',
          options:refundFailedOptions
        },
        {
          id:"returnInitiated",
          options:returnInitiatedOptions
        },
        {
          id:"returnCompleted",
          options:returnCompletedOptions
        }
        ,
        {
          id:"pickup-time",
          message:"Your package will be picked up within 1-2 days",
          trigger:"needHelp"
        },

        
        {
          id:"help",
          message:"How can I help you with?",
          trigger:(value,step)=>{
            // console.log(step);
            console.log(value.steps.products);
            // console.log(step.products);
            return value.steps.products.metadata.value
          }
        },
        {
          id:"query-request",
          message:"Please type your query",
          trigger:"query-reason"
        },
        {
          id:"payment-hash-request",
          message:"Sorry to hear that ! Please enter your payment hash",
          trigger:"payment-hash-entry"
        },
        {
          id:"payment-hash-entry",
          user:true ,
          validator: (value) => {
            console.log(value.slice(0,2));
            console.log(value.length);
            if ((value.slice(0,2) === "0x" && value.length === 66)) {
              return true;
              
            }
            return 'Enter valid payment hash';
          },
          trigger:(value,steps)=>{
            sendResponse(value,"paymentHash","")
            return "noOption"
          }
        },
        {
          id:"no-refund-request",
          message:"Sorry to hear that !" ,
          trigger:(value,steps)=>{
            console.log("Wwww");
            sendResponse(value,"","Didn't get refund .")
            return 'no-refund'
          }
        },{
          id:"waiting-request",
          message:"Sorry to hear that ! , Our team will get back to you" ,
          trigger:(value,steps)=>{
            console.log("Wwww");
            sendResponse(value,"","Order not placed")
            return 'needHelp'
          }
        },
        

        {
          id:"refundProcessing",
          message:"Your refund is in processing , You'll get refund within 1-2 days",
          trigger:"needHelp"
        },
        {
          id:"no-refund",
          message:" we will get back to you" ,
          trigger:"needHelp"
          
        },
        {
          id:"query-reason" , 
          user:true ,
          validator: (value) => {
            if ((value.length<3 || value.length>200)) {
              return 'Enter valid query';
            }
            return true;
          },
          trigger:(value,steps)=>{
            sendResponse(value,"","")
            return "noOption"
          }
        },
        {
          id:"noOption" ,
          message:"Thank you for your query , Our team will get back to you",
            end:true
        },
        {
          id:"sorry-to-hear",
          message:"Sorry to hear that . Please provide more details ",
          trigger:"query-reason"
        },
        {
          id:"not-shipped-request",
          message:"Item will be shipped shortly",
          trigger:"needHelp"
        },
        {
          id:"shipped-track-order",
          message:"Your order is yet to reach your nearest hub ",
          trigger:"needHelp"
        },
        {
          id:"od-track-order",
          message:"Your package is reached to your nearest hub and will be delivered today.",
          trigger:"needHelp"
        },
        {
          id: 'needHelp',
          message: "still need help?",
          trigger:"needHelpOptions"
        },
        {
          id: 'needHelpOptions',
          options:[
            {value:1 , label:"Yes" , trigger :"query-request"},
            {value:0 , label:"No" , trigger :"2"}
          ]
  
        },
        {
          id:"thanks",
          message:"Thank you for your valuable time",
          end:true
  
        },
        
      ]
      setStepDetailsState(step)
      setLoaded(true)
    }
    const sendResponse = async(value,paymentHash,query) =>{
      console.log("Swsdsd");
      console.log();
      console.log(value.steps.products.value);
      // console.log(steps);
      // console.log(botOrderId+"iddddd");
      // console.log(selectedId,"sdd");
      if (query) {
        let body = {
          response:query,
          orderId:props.orders._id,
          productId:value.steps.products.value
  
        }
        await appContext.getAxios().post(base_url+"users/me/addResponse",body).then((res)=>{
          console.log(res.data);
        })
      }
      else if (paymentHash) {
        let body = {
          response:"Payment is failed but my money is debited  payment hash is :- "+value.value,
          orderId:props.orders._id,
          productId:value.steps.products.value
  
        }
        await appContext.getAxios().post(base_url+"users/me/addResponse",body).then((res)=>{
          console.log(res.data);
        })
      }
      else{
        let body = {
          response:value.value,
          orderId:props.orders._id,
          productId:value.steps.products.value
  
        }
        await appContext.getAxios().post(base_url+"users/me/addResponse",body).then((res)=>{
          console.log(res.data);
        })
      }
     
      
     
    }
    
   
    useEffect(()=>{
      // getAllOrderDetails()
      if (props.orders._id) {
       console.log("wwwwaaa");
      getIndividualOrders(props.orders) 
      }
    },[props.orders])


     
    
  useEffect(()=>{
    console.log(stepState,"Wwwwwwwww");
  },[stepState])  
  return (
    <div className="ss">
      {loaded ?  <ThemeProvider theme={theme}><ChatBot className="simple-bot"  floating={true} opened={false} steps={stepDetailsState} /></ThemeProvider>:""}
    </div>
     
  )
}

export default SimpleChatBot
