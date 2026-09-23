import moment from "moment";

export const dateNowWithMinutes = () => {
  return moment().subtract(3, "hours").format("DD-MM-YYYY HH:mm");
};

export const dateNow = () => {
  return moment().subtract(3, "hours").format("DD-MM-YYYY");
};
