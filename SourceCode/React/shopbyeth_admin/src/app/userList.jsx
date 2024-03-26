import React, { useEffect, useState } from "react";
import { AiFillEye, AiOutlineSearch } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import useAppContext from "../AppContext";
import Paginations from "./pagination";

const UserList = () => {
  const appContext = useAppContext();
  const baseURL = process.env.REACT_APP_API_ENDPOINT;
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [userList, setUserList] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPage, setTotalPage] = useState(0);
  const [parameters, setParameters] = useState({
    page: 1,
    size: 20,
    sort: 0,
    status: -1,
    keyword: "",
  });
  const submitHandle = (e) => {
    e.preventDefault();
    setParameters({
      ...parameters,
      keyword: keyword.trim(),
      page: 1,
    });
  };
  useEffect(() => {
    getUser();
  }, [parameters]);

  const sortList = [
    { id: 0, name: "Newest" },
    { id: 1, name: "Oldest" },
    { id: 2, name: "Name Desc" },
    { id: 3, name: "Name Asc" },
  ];

  const statusList = [
    { id:-1, name: "All"},
    { id: 0, name: "Inactive" },
    { id: 1, name: "Active" },
  ];
  const getUser = async () => {
    let params = {
      page: parameters.page,
      keyword: parameters.keyword,
      size: parameters.size,
    };
    debugger;
    if (+parameters.status !== -1) {
      params.status = parameters.status;
      console.log(parameters.status);
      
    }
    else if(+parameters.status === -1){
      delete params.status
      console.log(parameters.status);
    }
    switch (+parameters.sort) {
      case 0:
        params.createdAt = -1;
        break;
      case 1:
        params.createdAt = 1;
        break;
      case 2:
        params.name = -1;
        break;
      case 3:
        params.name = 1;
        break;
      default:
        break;
    }
    await appContext
      .getAxios()
      .get(baseURL + "admin/users", { params: params })
      .then((res) => {
        console.log(res.data);
        setTotalPage(res.data.totalPages);
        setUserList(res.data.docs);
        console.log("usrlst", res.data.docs);
        setTotalItems(res.data.totalDocs);
        setLoading(false);
      });
  };
  useEffect(() => {
    console.log(totalPage);
  }, [totalPage]);
  const pageChange = (number) => {
    // e.preventDefault()
    console.log(number.selected + 1);
    setParameters({
      ...parameters,
      page: number,
    });
  };
  const userDetails = (e, id) => {
    e.preventDefault();
    navigate("/user/" + id);
  };
  const onInputChange = (e) => {
    e.preventDefault();
    if (e.target.name === "status" && e.target.value!==null) {
      setParameters({
        ...parameters,
        status: e.target.value,
        page: 1,
      });
    }
    if (e.target.name === "sort") {
      setParameters({
        ...parameters,
        sort: e.target.value,
        page: 1,
      });
    }
  };
  const clear = (e) => {
    e.preventDefault();
    setParameters({
      page: 1,
      size: 20,
      sort: 0,
      status: -1,
      keyword: "",
    });
    setKeyword("");
  };
  return (
    <div className="mt-5">
      <div className="container">
        <h2 className="mb-5">Users</h2>
        <form>
          <div className="row">
            <div className="col-lg-3 col-12 product-list">
              <div className="form-group">
                <label className="mb-1"> Status</label>
                
                <select
                  className="form-select"
                  aria-label="Status"
                  value={parameters.status}
                  name="status"
                  onChange={(e) => onInputChange(e)}
                >
                  
                  {statusList.map((res, index) => {
                    return (
                      <option key={index} value={+res.id}>
                        {res.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="col-lg-3 col-12 product-list">
              <div className="form-group">
                <label className="mb-1"> Sort</label>
                <select
                  className="form-select"
                  aria-label="Sort"
                  value={parameters.sort}
                  name="sort"
                  onChange={(e) => onInputChange(e)}
                >
                  {sortList.map((res, index) => {
                    return (
                      <option key={index} value={res.id}>
                        {res.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="col-lg-4 col-12 product-list">
              <div className="form-group">
                <label className="mb-1"> Search</label>
                <span className="search-input">
                  <input
                    type="text"
                    className=" search-text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                  <span className="input-group-btn pl-1">
                    <button
                      className="btn btn-search ms-2"
                      style={{
                        backgroundColor: "#F7941D",
                        color: "white",
                      }}
                      onClick={(e) => submitHandle(e)}
                    >
                      <AiOutlineSearch />
                    </button>
                  </span>
                </span>
              </div>
            </div>
            <div className="buttons col-lg-2 col-12">
              <button className="button mt-2" onClick={(e) => clear(e)} style={{height:"60px"}}>
                Clear
              </button>
            </div>
          </div>
        </form>
        <table className="table user-table mt-3">
          <thead>
            <tr className="user-row">
              <th className="index">#</th>
              <th className="name" scope="col">
                Name
              </th>

              <th className="email" scope="col">
                Email
              </th>
              <th className="status" scope="col">
                Status
              </th>
              <th className="action">Action</th>
            </tr>
          </thead>
          <tbody>
            {userList.length > 0 ? (
              userList.map((res, index) => {
                return (
                  <tr key={index} className="user-row">
                    <th className="user-index">{(parameters.page-1)*20+index+1 }</th>
                    <td className="user-name">{res.name}</td>

                    <td className="user-email">{res.email}</td>
                    <td className="user-status">{res.status ===1 ? 'Active' : 'Inactive'  }</td>
                    <th>
                      <td className="user-action pl-10">
                        <AiFillEye
                          onClick={(e) => userDetails(e, res._id)}
                          className="down-arrow"
                        />
                      </td>
                    </th>
                  </tr>
                );
              })
            ) : loading ? (
              <tr>
                <td colSpan={6}>
                  <div class="spinner-border text-warning mt-5" role="status">
                    <span class="sr-only"></span>
                  </div>{" "}
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={6}>No user found </td>
              </tr>
            )}
          </tbody>
        </table>
        <span className="mb-5 mt-2 d-flex justify-content-between align-items-start">
          {totalItems > 0 && (
            <span className="product-total ps-3">{totalItems} Users</span>
          )}
          {/* <span>{userList.length > 0 && (
          <ReactPaginate
            breakLabel="..."
            nextLabel="next >"
            onPageChange={pageChange}
            forcePage={parameters.page-1}
            marginPagesDisplayed={2}
            pageRangeDisplayed={1}
            pageCount={totalPage}
            previousLabel="< previous"
            renderOnZeroPageCount={null}
            breakClassName={"page-item"}
            breakLinkClassName={"page-link"}
            containerClassName={"pagination"}
            pageClassName={"page-item"}
            pageLinkClassName={"page-link"}
            previousClassName={"page-item"}
            previousLinkClassName={"page-link"}
            nextClassName={"page-item"}
            nextLinkClassName={"page-link"}
            activeClassName={"active"}
          />
        )}</span> */}
          <span>
            {userList.length > 0 && (
              <Paginations
                className="pagination-bar"
                currentPage={+parameters.page}
                totalCount={+totalItems}
                pageSize={+parameters.size}
                onPageChange={(page) => pageChange(+page)}
              />
            )}
          </span>
        </span>
      </div>
    </div>
  );
};

export default UserList;
