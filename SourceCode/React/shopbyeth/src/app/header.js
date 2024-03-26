import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import useAppContext from "../AppContext";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";
import { onMessageListener, requestForToken, sendNotificationToken } from "./firebase";

import { IoNotificationsOutline } from "react-icons/io5";
import { toast } from "react-toastify";

function Header() {
    const navigate = useNavigate();
    const appContext = useAppContext();
    const base_url = process.env.REACT_APP_API_ENDPOINT;
    const web3 = new Web3(window.ethereum);
    const [wishCount, setWishCount] = useState(0);
    const [cartCount, setCartCount] = useState(+localStorage.getItem("cartCount"));
    const [connected,setConnected] = useState(localStorage.getItem("connected"));
    const [loginStatus,setLoginStatus] = useState(+localStorage.getItem("status"))
    const [keyword, setKeyWord] = useState("");
    const [pathName, setPathName] = useState('')
    const location = useLocation()
    const [downStatus, setDownStatus] = useState(0)
    // const [notificationCount, setNotificationCount] = useState(0)


    const localStorageCartList = JSON.parse(localStorage.getItem("cartList"));
    useEffect(() => {
        if (connected && loginStatus === 1) {
            getCount();
        }
        else {
            setCartCount(+localStorage.getItem("cartCount"));
        }
    }, [appContext.getCount(), appContext.getlocalCartCount(), +localStorage.getItem("cartCount")]);

    useEffect(()=>{
        // requestPermission()
        if (appContext.isLoggedIn() && appContext.getStatus() ===1) {
         
        requestForToken(appContext.getAxios())   
        }
        
    },[])
    useEffect(()=>{

        if (appContext.prevent()) {
            
            window.onbeforeunload = () => {return "ssss" };
      
          // Unmount the window.onbeforeunload event
           return () => { window.onbeforeunload = null };
      }
    },[appContext.prevent()])

    useEffect(() => {
        if (window.ethereum) {
          window.ethereum.on("accountsChanged", accountChanged);
          window.ethereum.on('chainChanged', (data) => {
            localStorage.setItem("ChainId", data);
            if(data!=="0x5"){
              toast.error("You've been logged out due to change in network")
              logout();
            }
          })
           window.ethereum.request({method: 'eth_chainId',}).then((res) => {
            localStorage.setItem("ChainId", res);
          })
      
        }
      }, []);

      const accountChanged = async (accounts) => {
        let address = localStorage.getItem("accountAddress")
        if (accounts[0] === undefined) {
          localStorage.clear();
          setConnected(false)
        } else if (address !== null && accounts[0] !== address) {
            setConnected(false)
          localStorage.clear();
          await sendNotificationToken("",appContext.getAxios())
         
          localStorage.setItem("accountAddress", accounts[0]);
          loginApi(accounts[0]);
          navigate("/")
          
        }
      };

    useEffect(() => {
        setCartCount(+localStorage.getItem("cartCount"));
        setPathName(location.pathname);
    }, [appContext.localcartcount]);

    const mouseOver = () =>{
        setDownStatus(1)
    }
    const mouseOut = () =>{
        setDownStatus(0)
    }
    onMessageListener().then(()=>{
        appContext.getNotification()
    })

    const login = async () => {
        try {
            console.log(location);
            if (window.ethereum) {
                await window.ethereum.request({ method: "eth_requestAccounts" }).then((res) => {
                    localStorage.setItem("accountAddress", res[0]);
                    console.log("accountAddress", res[0])
                    loginApi(res[0]);
                }).catch((err)=>{
                    console.log(err.code);
                    if (err.code === -32002) {
                        toast.error("Login is already requested! Please open metamask to continue")
                    }
                    console.log(err);
                });
                window.web3 = new Web3(window.ethereum);
                await window.ethereum.enable;
            } else {
                alert("Please install metamask extension!!");
                window.open("https://metamask.io/download/", "_blank");
            }
        } catch (error) {
            console.error(error);
        }
    }
    const changeNetwork = async () => {
        try {
            if (window.ethereum) {
          await  window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x5' }],
          });
          login();
        }
        else {
            alert("Please install metamask extension!!");
            window.open("https://metamask.io/download/", "_blank");
        }

        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x5',
                    chainName: 'Goerli Test Network',
                    rpcUrls: ['https://goerli.infura.io/v3/']
                  },
                ],
              });
              login();
            } catch (addError) {
              console.error("Error",addError);
            }
          }
        }
      }


    const loginApi = async (address) => {
        try {
            const path = base_url + "auth";
            const body = {
                publicAddress: address,
            };

            await axios.post(path, body).then((response) => {
                if (response !== undefined) {
                    handleSignMessage(response.data.publicAddress, response.data.nonce);
                }
            });
        } catch (error) {
            console.error(error);
        }
    };
    const handleSignMessage = (publicAddress, nonce) => {
        return new Promise((resolve, reject) =>
            web3.eth.personal.sign(
                web3.utils.fromUtf8(`${nonce}`),
                publicAddress,
                (err, signature) => {
                    if (err) {
                        localStorage.removeItem("accountAddress");
                        return reject(err);
                    }
                    sendSignature(publicAddress, signature);
                    return resolve({ publicAddress, signature });
                }
            )
        );
    };

    const sendSignature = async (address, signature) => {
        try {
            appContext.sendSignature(address, signature).then(async (result) => {
                if (result.status === true) {
                    
                    if (localStorageCartList) {
                        addToCart();
                    } else
                    window.ethereum.request({ method: 'eth_chainId', }).then((res) => {
                        localStorage.setItem("ChainId", res);
                    })
                    let respData = result.info.data;
                    localStorage.setItem("name", respData.name);
                    if (respData.status === 0) {
                        localStorage.setItem("name", respData.publicAddress);
                        setConnected(true)
                        appContext.setName(respData.publicAddress)
                        localStorage.setItem("pathName",location.pathname)
                        navigate("/register");
                    }
                    else {
                        setConnected(true)
                        setLoginStatus(1)
                        getCount();
                        await requestForToken(appContext.getAxios())
                        // window.location.reload()     
                        

                    }
                }
            });
        } catch (error) {
            console.error(error);
        }
    };
    const getCount = async () => {
        try {
            console.log("swwwww");
            let path = base_url + "users/counts";
            await appContext.getAxios().get(path).then((response) => {
                let resp = response.data;
                setCartCount(resp.cartCount);
                appContext.setWishListCount(resp.wishlistCount)
                localStorage.setItem("cartCount", resp.cartCount)
                appContext.getNotification()
            });
            
        } catch (error) { }
    };
    // const getNotificationCount = async () =>{
    //     await appContext.getAxios().get(base_url+"users/me/notificationCount/0",{}).then((res)=>{
    //         setNotificationCount(res.data.count)
    //     })

    // }
    const search = async (e) => {
        try {
            e.preventDefault()
               
            console.log("location",location);
            if(location.pathname==="/products"){
                appContext.setProducts("keyword",appContext.getSearchKeyword())
            }
            else{
                appContext.resetSetProducts("keyword",appContext.getSearchKeyword())
            }
            // appContext.setProducts("keyword",keyword)
            console.log(keyword);
            if(appContext.getSearchKeyword() !==""){
            navigate("/products")}
        } catch (error) { }
    };

    const logout = async () => {
        try {
            
            await sendNotificationToken("",appContext.getAxios())
            localStorage.clear();
            
            // appContext.setUsername("")
            
                window.location = "/";
          

        } catch (error) {
            console.error(error);
        }
    };

    const goToProfile = () => {
        navigate("/profile")
    }
    const goToRewards = () => {
        navigate("/rewards")
    }
    const addToCart = async () => {
        try {
            let path = base_url + "users/me/addToCart";
            let productsObj = [];
            for (let obj of localStorageCartList) {
                productsObj.push({ productId: obj.id, productQuantity: obj.quantity ? obj.quantity : 1 })
            }
            let body = {
                products: productsObj
            }
            await appContext.getAxios().post(path, body).then((response) => {
                console.log(response);
                getCount();
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <header className="header shop">
            {/* Topbar */}
            {/* <div className="topbar">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-4 col-md-12 col-12">
                            <div className="top-left">
                                <ul className="list-main">
                                    <li><i className="fa-solid fa-phone"></i> +060 (800) 801-582</li>
                                    <li><i className="fa-solid fa-envelope"></i> support@shophub.com</li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-lg-8 col-md-12 col-12">
                            <div className="right-content">
                                <ul className="list-main">
                                    <li><i className="ti-location-pin"></i> Store location</li>
                                    <li><i className="ti-alarm-clock"></i> <a href="  ">Daily deal</a></li>
                                    <li><i className="ti-user"></i> <a href="  ">My account</a></li>
                                    <li><i className="ti-power-off"></i><Link onClick={login}>Login</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}
            {/* End Topbar  */}
            {/* <div className="middle-inner">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-2 col-md-2 col-12">
                            <div className="logo">
                                <a href="index.html"><img src="images/logo.png" alt="logo" /></a>
                            </div>
                            
                            <div className="mobile-nav">
                                <input name="search" placeholder="Search Products Here....." type="search" value={keyword} onChange={(e) => setKeyWord(e.target.value)} ></input>
                               

                            </div>
                        </div>
                        <div className="col-lg-8 col-md-7 col-12">
                            <div className="search-bar-top">
                                <div className="search-bar">
                                    <input name="search" placeholder="Search Products Here....." type="search" value={keyword} onChange={(e) => setKeyWord(e.target.value)}/>
                                    <button className="btnn" onClick={search}><i className="fa-solid fa-magnifying-glass"></i></button>

                                </div>
                            </div>
                        </div>
                        <div className="col-lg-2 col-md-3 col-12">
                            <div className="right-bar">
                                {connected && loginStatus === 1 ?
                                    <div className="sinlge-bar">
                                        <a href="/wishlist" className="single-icon"><i className="fa-regular fa-heart"></i><span className="total-count">{wishCount}</span></a>
                                    </div> : ""}
                                <div className="sinlge-bar">
                                    <a href="/register" className="single-icon"><i className="fa-solid fa-circle-user"></i></a>
                                </div>
                                <div className="sinlge-bar shopping">
                                    <a href="/cart" className="single-icon"><i className="fa-solid fa-cart-shopping"></i> <span className="total-count">{cartCount}</span></a>
                                    
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}
            {/* Header Inner */}
            <div className="header-inner">
                <div className="container">
                    <div className="cat-nav-head">
                        <div className="row">
                            <div className="col-lg-12 col-12">
                                <div className="menu-area">
                                    {/* Main Menu  */}
                                    <nav className="navbar navbar-expand-lg">
                                        <div className="navbar-collapse">
                                            <div className="nav-inner">
                                                <div className="logo">
                                                    <Link to="/">
                                                        {/* <img src="images/logo.png" alt="logo" /> */}
                                                        <span style={{ color: "#F7941D", fontWeight: "bolder", fontSize: "larger" }}>SHOP BY ETH</span>
                                                    </Link>
                                                </div>
                                                <ul className="nav main-menu menu navbar-nav">
                                                    {/* <li className={`${pathName === "/" && `active`}`}><a href="/">Home</a></li>
                                                    <li className={`${pathName === "/products" && `active`}`}><a href="/products">Product</a></li> */}
                                                    {/* {loginStatus === 1 ? <li className={`${pathName === "/orders" && `active`}`}><a href="/orders">Orders</a></li> : ""} */}
                                                </ul>

                                            </div>
                                            <div className="col-lg-10 col-md-6 col-sm-6 col-12 fullview">
                                            <form onSubmit={(e) => search(e)} >
                                                <div className="search-bar-top">
                                                    <div className="search-bar">
                                                        <input autoComplete="off" name="search" placeholder="Search Products Here....." type="search" value={appContext.getSearchKeyword()} onChange={(e) => appContext.setSearchKeyword(e.target.value)} />
                                                        <button className="btnn" onClick={(e) => search(e)}><i className="fa-solid fa-magnifying-glass"></i></button>

                                                    </div>
                                                </div>
                                            </form>
                                            </div>
                                        </div>
                                        <div className="right-bar">
                                                {connected && loginStatus === 1 ?
                                                    <>
                                                    <div className="sinlge-bar">
                                                        <Link to="/notifications" className="single-icon"><IoNotificationsOutline/>{appContext.getNotificationCount() >0 &&<span className="total-count">{ appContext.getNotificationCount()}</span>}</Link>
                                                    </div>
                                                    <div className="sinlge-bar">
                                                        <Link to="/wishlist" className="single-icon"><i className="fa-regular fa-heart"></i>{localStorage.getItem("wishCount") >0 &&<span className="total-count">{ localStorage.getItem("wishCount")}</span>}</Link>
                                                    </div>
                                                    
                                                    </>
                                                    : ""}
                                                    
                                                <div className="sinlge-bar shopping" onMouseOver={mouseOver} onMouseLeave={mouseOut}>
                                                    {connected ? <><span className="single-icon drop-down-menu" ><i className="fa-solid fa-circle-user"></i><span className="username fullview">{appContext.getName()}{"  "}{downStatus===0?<BsChevronDown/>:<BsChevronUp/>}</span></span><div className="shopping-item">

                                                        <ul className="shopping-list" >
                                                           {appContext.getStatus() ===1 && <li>
                                                                <h4><Link to="/profile" >My Profile</Link></h4>
                                                            </li>}
                                                            {appContext.getStatus() ===1 && <li>
                                                                <h4><Link to="/rewards"  >My Rewards</Link></h4>
                                                            </li>}
                                                            {appContext.getStatus() ===1 && <li>
                                                                <h4><Link to="/orders"  >My Orders</Link></h4>
                                                            </li>}
                                                            {appContext.getStatus() ===0 && <li>
                                                                <h4><Link to="/register"  >Register</Link></h4>
                                                            </li>}
                                                            <li>

                                                                <h4><Link onClick={logout}>Logout</Link></h4>

                                                            </li>
                                                        </ul>
                                                    </div></> : <Link onClick={changeNetwork}>Login</Link>}
                                                </div>
                                                <div className="sinlge-bar shopping">
                                                    <Link to="/cart" className="single-icon"><i className="fa-solid fa-cart-shopping"></i> {cartCount >0 &&<span className="total-count">{cartCount}</span>}</Link>

                                                </div>
                                            </div>
                                    </nav>
                                    {/* End Main Menu  */}
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-12">
                                <form onSubmit={(e) => search(e)} >
                                    <div className="search-bar-top">
                                        <div className="search-mobile-bar mobile">
                                            <input name="search" autoComplete="off" placeholder="Search Products Here....." type="search" value={keyword} onChange={(e) => appContext.setSearchKeyword(e.target.value)} />
                                            <button className="btnn" onClick={(e) => search(e)}><i className="fa-solid fa-magnifying-glass"></i></button>

                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* End Header Inner  */}
        </header>
    );
}

export default Header;
