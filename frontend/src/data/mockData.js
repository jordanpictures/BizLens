export const bookings = [
  {
    name: "Sara Mohammed",
    service: "Graduation",
    pkg: "Video + Photo",
    qty: 2,
    date: "Aug 30, 10:30 AM",
    price: 3000,
    status: "Confirmed",
  },
  {
    name: "Ahmed Ali",
    service: "Studio",
    pkg: "Photo",
    qty: 1,
    date: "Aug 30, 2:00 PM",
    price: 1500,
    status: "Pending",
  },
  {
    name: "Hana Tesfaye",
    service: "Babyshower",
    pkg: "3x4",
    qty: 4,
    date: "Aug 31, 11:00 AM",
    price: 800,
    status: "Confirmed",
  },
  {
    name: "Dawit Bekele",
    service: "Studio",
    pkg: "Laminet",
    qty: 1,
    date: "Sep 01, 9:00 AM",
    price: 500,
    status: "Completed",
  },
];

export const payments = [
  {
    name: "Sara Mohammed",
    booking: "Graduation · Video",
    method: "Cash",
    date: "Aug 29",
    amount: 2000,
  },
  {
    name: "Ahmed Ali",
    booking: "Studio · Photo",
    method: "Transfer",
    date: "Aug 28",
    amount: 1500,
  },
  {
    name: "Hana Tesfaye",
    booking: "Babyshower · 3x4",
    method: "Cash",
    date: "Aug 27",
    amount: 800,
  },
  {
    name: "Dawit Bekele",
    booking: "Studio · Laminet",
    method: "Cash",
    date: "Aug 26",
    amount: 500,
  },
];

export const expenses = [
  { reason: "Camera repair", date: "Aug 29", amount: 2500 },
  { reason: "Printing paper", date: "Aug 27", amount: 1200 },
  { reason: "Electricity", date: "Aug 25", amount: 1500 },
  { reason: "Transportation", date: "Aug 23", amount: 1000 },
];
