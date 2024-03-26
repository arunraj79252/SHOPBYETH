import React, { useState } from "react";
import { useEffect } from "react";
import Card from "react-bootstrap/Card";
import { useNavigate } from "react-router-dom";
import useAppContext from "../AppContext";
import DatePicker from "react-datepicker";
import { Bar, Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";

Chart.register(zoomPlugin);

const Dashboard = () => {
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const imageUrl = process.env.REACT_APP_AWS_ENDPOINT;
  const currentyear = new Date();
  const appContext = useAppContext();
  const navigate = useNavigate();
  const [statCount, setStatCount] = useState();
  const [trendingList, setTrendingList] = useState([]);
  const [popularList, setPopularList] = useState([]);
  const [saleYear, setSaleYear] = useState(new Date());
  const [userYear, setUserYear] = useState(new Date());
  const [saleDate, setSaleDate] = useState("2022-11-18");
  const [lineXValues, setLineXValues] = useState([]);
  const [lineYValues, setLineYValues] = useState([]);
  const minYear = new Date("01/01/2021");
  const [saleFilter, setSaleFilter] = useState(0);
  const [barXValues, setBarXValues] = useState([]);
  const [barYValues, setBarYValues] = useState([]);
  const yearArray = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  useEffect(() => {
    getCounts();
    // getSaleDetailsMonthly();
    // getSaleDetailsWeakily();
  }, []);
  useEffect(() => {
    getUserDetailsMonthly();
  }, [userYear]);
  const saleData = {};
  const usersData = {
    labels: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    datasets: [
      {
        label: "Users",
        data: lineXValues,
        backgroundColor: ["#eec695"],
        borderColor: ["#F7941D"],
        borderWidth: 1,
        pointBackgroundColor: "#F7941D",
        fill: true,
        lineTension: 0.3,
      },
    ],
  };

  // useEffect(()=>{
  //   if (saleFilter === 0 || 1) {
  //     getSaleDetailsMonthly()
  //   }
  //   else{

  //   }
  // },[saleFilter])

  useEffect(() => {
    getSaleDetailsMonthly();
  }, [saleYear, saleFilter]);

  useEffect(() => {
    console.log(lineXValues);
  }, [lineXValues]);
  const salesData = {
    labels: barYValues,
    datasets: [
      {
        label: "Sales",
        data: barXValues,
        backgroundColor: ["#eec695"],
        borderColor: ["#F7941D"],
        borderWidth: 1,
        pointBackgroundColor: "#F7941D",
        fill: true,
        lineTension: 0.3,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          color: "#858796", // not 'fontColor:' anymore
          // fontSize: 18,
          min: 0,
          max: 100,
        },
      },
      y: {
        ticks: {
          color: "#858796",
          suggestedMin: 0,
          suggestedMax: 10,
          beginAtZero: true,
        },
        min: 0,
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#858796",
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
          threshold: "4",
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: "x",
        },
        limits: {
          x: { minRange: 1 },
        },
      },
    },
  };
  const getCounts = async () => {
    await appContext
      .getAxios()
      .get(base_url + "admin/statistics")
      .then((res) => {
        // console.log(res.data);
        setStatCount(res.data);
      });
    await appContext
      .getAxios()
      .get(base_url + "admin/statistics/products/viewCount")
      .then((res) => {
        // console.log(res.data);
        setPopularList(res.data);
      });
    await appContext
      .getAxios()
      .get(base_url + "admin/statistics/products/saleCount")
      .then((res) => {
        // console.log(res.data);
        setTrendingList(res.data);
      });
  };
  const getSaleDetailsMonthly = async () => {
    let params = {
      year: saleYear.getFullYear(),
    };
    if (saleFilter === 1) {
      params.month = saleYear.getMonth() + 1;
    }
    const data = [];
    await appContext
      .getAxios()
      .get(base_url + "admin/statistics/sales", { params: params })
      .then((res) => {
        // debugger;
        if (saleFilter === 0) {
          setBarYValues(yearArray);
          const saleMonthValue = new Array(12).fill(0);
          res.data.forEach((res) => {
            saleMonthValue[res._id.month - 1] = res.totalCounts;
          });
          console.log(saleMonthValue);
          setBarXValues(saleMonthValue);
        } else if (saleFilter === 1) {
          let days = new Date(
            saleYear.getFullYear(),
            saleYear.getMonth() + 1,
            0
          ).getDate();
          console.log(days);
          const saleMonthYValues =  Array.from({length: days}, (_, i) => (i + 1).toString())
          const saleMonthXValues = new Array(days).fill(0)
          res.data.forEach((res) => {
            saleMonthXValues[res._id.day - 1] = res.totalCounts;
          });
          setBarXValues(saleMonthXValues)
          setBarYValues(saleMonthYValues)
 


        } else {

        }
        // console.log(res.data);
      });
  };
  // const getSaleDetailsWeakily = async () => {
  //   let params = {
  //     yea: saleYear,
  //   };
  //   await appContext
  //     .getAxios()
  //     .get(base_url + "admin/statistics/sales/daily", { params: params })
  //     .then((res) => {});
  // };
  const handleSaleFilter = (e) => {
    setSaleFilter(+e.target.value);
  };
  const getUserDetailsMonthly = async () => {
    let params = {
      year: userYear.getFullYear(),
    };
    await appContext
      .getAxios()
      .get(base_url + "admin/statistics/user", { params: params })
      .then((res) => {
        console.log(res.data);
        const userMonthsValue = new Array(12).fill(0);
        // saleMonthsValue.fill(0,0,11)
        res.data.forEach((res) => {
          userMonthsValue[res.month - 1] = res.numberOfUsers;
        });
        setLineXValues(userMonthsValue);
      });
  };

  const productDetails = (e, id) => {
    e.preventDefault();
    navigate("/products/" + id);
  };
  const handleChange = (date) => {
    setUserYear(date);
  };
  const handleSaleChange = (date) => {
    setSaleYear(date);
  };
  return (
    <div className="container mb-4 mt-4 pt-4">
      <div className="row">
        <div className="col-lg-4 col-12">
          <Card className="overview-item overview-item--c1">
            <Card.Body className="text-center">
              <Card.Title>Total Users</Card.Title>
              <Card.Text className="h2">{statCount?.usersCount}</Card.Text>
            </Card.Body>
          </Card>
        </div>
        <div className="col-lg-4 col-12">
          <Card className="overview-item overview-item--c2">
            <Card.Body className="text-center">
              <Card.Title>Total Orders</Card.Title>
              <Card.Text className="h2">{statCount?.ordersCount}</Card.Text>
            </Card.Body>
          </Card>
        </div>
        <div className="col-lg-4 col-12">
          <Card className="overview-item overview-item--c3">
            <Card.Body className="text-center">
              <Card.Title>Total Products</Card.Title>
              <Card.Text className="h2">{statCount?.productsCount}</Card.Text>
            </Card.Body>
          </Card>
        </div>
      </div>
      <div className="row my-5">
        <div className="col-lg-6 col-12">
          <Card className="shadow">
            <Card.Body>
              <Card.Title>
                {" "}
                <h3 className="py-4">Trending Products</h3>{" "}
              </Card.Title>
              <Card.Text>
                <table className="table popular-table">
                  <thead>
                    <tr>
                      <th scope="col">Position</th>
                      <th scope="col"></th>
                      <th scope="col">Product</th>

                      <th scope="col">Hits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popularList.map((pop, index) => {
                      return (
                        <tr
                          key={index}
                          style={{ verticalAlign: "middle" }}
                          className="down-arrow"
                          onClick={(e) => productDetails(e, pop._id)}
                        >
                          <td>{index + 1} </td>
                          <td>
                            <img
                              src={imageUrl + pop._id + "/" + pop.coverImage}
                              className="rounded"
                              height="70"
                              width="80"
                              alt=""
                            />
                          </td>
                          <td className="dashboard-name">{pop.productName}</td>
                          <td>{pop.viewCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card.Text>
            </Card.Body>
          </Card>
        </div>
        <div className="col-lg-6 col-12 ">
          <Card className="shadow">
            <Card.Body>
              <Card.Title>
                <h3 className="py-4">Popular Products</h3>
              </Card.Title>
              <Card.Text>
                <table className="table trending-table">
                  <thead>
                    <tr>
                      <th scope="col">Position</th>
                      <th scope="col"></th>
                      <th scope="col">Product</th>

                      <th scope="col">Hits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendingList.map((trend, index) => {
                      return (
                        <tr
                          key={index}
                          className="down-arrow"
                          onClick={(e) => productDetails(e, trend._id)}
                          style={{ verticalAlign: "middle" }}
                        >
                          <td>{index + 1} </td>
                          <td>
                            <img
                              src={imageUrl + trend._id + "/" + trend.coverImage}
                              className="rounded"
                              height="70"
                              width="80"
                              alt=""
                            />
                          </td>
                          <td className="dashboard-name">{trend.productName}</td>
                          <td>{trend.saleCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card.Text>
            </Card.Body>
          </Card>
        </div>
      </div>
      <div className="row my-5">
        <div className="col-lg-6 col-12">
          <Card className="shadow">
            <Card.Body>
              <Card.Title className="mb-5">
                <div className="row">
                  <div className="col-5 graph-title">
                    <span>Sales</span>
                  </div>
                  <div className="col-3">
                    <div className="years">
                      {saleFilter === 0 && (
                        <DatePicker
                          selected={saleYear}
                          dateFormat="yyyy"
                          onChange={(date) => handleSaleChange(date)}
                          showYearPicker
                          minDate={minYear}
                          maxDate={currentyear}
                          yearItemNumber="10"
                        />
                      )}
                      {saleFilter === 1 && (
                        <DatePicker
                          selected={saleYear}
                          minDate={minYear}
                          maxDate={currentyear}
                          onChange={(date) => handleSaleChange(date)}
                          dateFormat="MMM yyyy"
                          showMonthYearPicker
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-4">
                    <select
                      className="form-select"
                      value={saleFilter}
                      onChange={(e) => handleSaleFilter(e)}
                    >
                      <option value="0">Yearly</option>
                      <option value="1">Monthly</option>
                      {/* <option value="2">Weekly</option> */}
                    </select>
                  </div>
                </div>
              </Card.Title>
              <Card.Text>
                <Bar
                  data={salesData}
                  options={options}
                  height={400}
                  width={"400px"}
                />
              </Card.Text>
            </Card.Body>
          </Card>
        </div>
        <div className="col-lg-6 col-12">
          <Card className="shadow">
            <Card.Body>
              <Card.Title className="mb-5">
                <div className="row">
                  <div className="col-5 graph-title">
                    <span>Users Registered</span>
                  </div>
                  <div className="col-4"></div>
                  <div className="col-3">
                    <div className="yearselec">
                      <DatePicker
                        selected={userYear}
                        dateFormat="yyyy"
                        onChange={(date) => handleChange(date)}
                        showYearPicker
                        minDate={minYear}
                        maxDate={currentyear}
                        yearItemNumber="10"
                      />
                    </div>
                  </div>
                </div>
              </Card.Title>
              <Card.Text>
                <Line
                  data={usersData}
                  options={options}
                  height={400}
                  width={"400px"}
                />
              </Card.Text>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
