import React, { useState } from "react";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import useAppContext from "../AppContext";
import ListGroup from "react-bootstrap/ListGroup";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { VscGraph } from "react-icons/vsc";
const UserDetails = () => {
  const appContext = useAppContext();
  const [user, setUser] = useState({});
  const baseURL = process.env.REACT_APP_API_ENDPOINT;
  const params = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    getUserDetails();
  }, []);
  const getUserDetails = async () => {
    await appContext
      .getAxios()
      .get(baseURL + "admin/users/" + params.id)
      .then((res) => {
        console.log(res.data);
        setUser(res.data);
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
  const blockOrUnblockUser = async (e, status) => {
    e.preventDefault();
    let params = {
      userId: user._id,
      status: status,
    };
    await appContext
      .getAxios()
      .patch(baseURL + "admin/users",{}, { params: params })
      .then((res) => {
        console.log(res.data);
        getUserDetails()
        toast.success(res.data.message);
      });
  };
  const userRewards = (e) => {
    e.preventDefault();
    const id = params.id
    navigate("/rewards/" + id);
  };
  return (
    <div className="mt-5">
      <div className="container">
        <h2 className="mb-5">User Details</h2>

        <div className="row">
          <div className="col-lg-2"></div>
          <div className="col-lg-8 col-12">
            <div className="shadow">
              <ListGroup variant="flush" className="text-start">
                <ListGroup.Item className="py-4">
                  <div className="row">
                    <div className="col-6 " style={{ fontWeight: "bold" }}>
                      <div className="name text-start">Id</div>
                    </div>
                    <div className="col-6">
                      <div className="coins ">{user._id}</div>
                    </div>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="py-4">
                  <div className="row">
                    <div className="col-6" style={{ fontWeight: "bold" }}>
                      <div className="name ">Joined at</div>
                    </div>
                    <div className="col-6">
                      <div className="coins ">
                        {new Date(user.createdAt).toDateString().slice(4)}
                      </div>
                    </div>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="py-4">
                  <div className="row">
                    <div className="col-6" style={{ fontWeight: "bold" }}>
                      <div className="name wrap">Name</div>
                    </div>
                    <div className="col-6">
                      <div className="coins wrap">{user.name}</div>
                    </div>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="py-4">
                  <div className="row">
                    <div className="col-6" style={{ fontWeight: "bold" }}>
                      <div className="name ">Email</div>
                    </div>
                    <div className="col-6">
                      <div className="coins wrap">{user.email}</div>
                    </div>
                  </div>
                </ListGroup.Item>
                
                <ListGroup.Item className="py-4">
                  <div className="row">
                    <div className="col-6" style={{ fontWeight: "bold" }}>
                      <div className="name ">Coin Balance</div>
                    </div>
                    <div className="col-5">
                      <div className="row">
                        <div className="coins col-6">{numToFixed(user.coinBalance)}
                        <VscGraph onClick={(e)=> userRewards(e)} className="col-6 down-arrow" title="Reward history"/></div>
                      
                    </div>
                    </div>
                      
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="py-4">
                  <div className="row">
                    <div className="col-6" style={{ fontWeight: "bold" }}>
                      <div className="name ">Action</div>
                    </div>
                    <div className="col-6">
                      <div className="coins ">
                        {user.status === 1 ? (
                          <button
                            className="button block-button"
                            onClick={(e) => blockOrUnblockUser(e, 0)}
                            style={{height:"60px"}}
                          >
                            Block
                          </button>
                        ) : (
                          <button
                            className="button block-button"
                            onClick={(e) => blockOrUnblockUser(e, 1)}
                            style={{height:"60px"}}
                          >
                            Unblock
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </div>
          </div>
          <div className="col-lg-2"></div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
