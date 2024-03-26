const getStatusName = (status) => {
  let statusName;
  try {
    switch (status) {
      case 0:
        statusName = "Waiting for payment";
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
export default getStatusName;