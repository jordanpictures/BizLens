import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { money, formatDate, downloadCSV } from "../utils/format";

function Payments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetch("/api/payments")
      .then((res) => res.json())
      .then((data) => {
        setPayments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching payments:", err);
        setLoading(false);
      });
  }, []);

  const filteredPayments = payments.filter((p) => {
    if (!startDate && !endDate) return true;
    const pDate = new Date(p.date).setHours(0, 0, 0, 0);
    const sDate = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
    const eDate = endDate ? new Date(endDate).setHours(0, 0, 0, 0) : Infinity;
    return pDate >= sDate && pDate < eDate;
  });

  const totalIncome = filteredPayments.reduce(
    (a, x) => a + parseFloat(x.amount),
    0,
  );
  const cashTotal = filteredPayments
    .filter((p) => p.payment_method === "Cash")
    .reduce((a, x) => a + parseFloat(x.amount), 0);
  const transferTotal = filteredPayments
    .filter((p) => p.payment_method === "Transfer")
    .reduce((a, x) => a + parseFloat(x.amount), 0);

  const handleExport = () => {
    const headers = [
      "Customer",
      "Service",
      "Method",
      "Date",
      "Amount (ETB)",
      "Booking ID",
    ];
    const data = filteredPayments.map((p) => [
      p.name || "Walk-in Customer",
      p.service_name || "N/A",
      p.payment_method,
      formatDate(p.date),
      parseFloat(p.amount).toFixed(2),
      p.booking_id || "",
    ]);
    downloadCSV(
      `Payments_Export_${startDate || "All"}_to_${endDate || "All"}.csv`,
      headers,
      data,
    );
  };

  return (
    <>
      <PageHeader
        title="Payments"
        sub="Income received from bookings"
       
      />

      {loading ? (
        <div className="p-8 text-center text-muted">Loading payments...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card-panel p-5">
              <div className="text-muted text-sm mb-3">Total income</div>
              <div className="text-3xl font-bold tracking-tight">
                {money(totalIncome)}
              </div>
            </div>
            <div className="card-panel p-5">
              <div className="text-muted text-sm mb-3">Cash</div>
              <div className="text-3xl font-bold tracking-tight">
                {money(cashTotal)}
              </div>
            </div>
            <div className="card-panel p-5">
              <div className="text-muted text-sm mb-3">Transfer</div>
              <div className="text-3xl font-bold tracking-tight">
                {money(transferTotal)}
              </div>
            </div>
            <div className="card-panel p-5">
              <div className="text-muted text-sm mb-3">Payments</div>
              <div className="text-3xl font-bold tracking-tight">
                {payments.length}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="date"
                className="input-field !py-2 flex-1 md:w-40"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="From Date"
              />
              <span className="text-muted self-center">-</span>
              <input
                type="date"
                className="input-field !py-2 flex-1 md:w-40"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="Up to Date (Excluded)"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="btn-secondary" onClick={handleExport}>
                Export CSV
              </button>
              <button
                className="btn"
                onClick={() => navigate("/record-payment")}
              >
                + Record payment
              </button>
            </div>
          </div>

          <div className="card-panel overflow-hidden">
            <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr] md:grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr] items-center text-muted text-xs uppercase tracking-wider font-semibold py-3 px-5 border-b border-line bg-neutral-50">
              <div>Customer</div>
              <div>Service</div>
              <div className="hidden md:block">Method</div>
              <div>Date</div>
              <div className="text-right">Amount</div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="p-8 text-center text-muted">
                No payments found.
              </div>
            ) : (
              filteredPayments.map((x) => (
                <div
                  className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr] md:grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr] items-center py-4 px-5 border-b border-line last:border-0 hover:bg-neutral-50 transition-colors text-sm"
                  key={x.id}
                >
                  <div>
                    <b className="text-base text-text">
                      {x.name || "Walk-in Customer"}
                    </b>
                  </div>
                  <div className="text-muted">
                    <Link
                      to={`/bookings/${x.booking_id}`}
                      className="hover:underline text-text font-medium"
                    >
                      {x.booking}
                    </Link>
                  </div>
                  <div className="hidden md:block">
                    <span className="inline-block bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      {x.payment_method}
                    </span>
                  </div>
                  <div>{formatDate(x.date)}</div>
                  <div className="text-right font-semibold text-base">
                    {money(parseFloat(x.amount))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}

export default Payments;
