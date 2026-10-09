import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader";
import { money, formatDate, downloadCSV } from "../utils/format";

function Payments() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [methodFilter, setMethodFilter] = useState("all"); // 'all', 'Cash', 'Transfer'

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

  const dateFilteredPayments = payments.filter((p) => {
    if (!startDate && !endDate) return true;
    const pDate = new Date(p.date).setHours(0, 0, 0, 0);
    const sDate = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
    const eDate = endDate ? new Date(endDate).setHours(0, 0, 0, 0) : Infinity;
    return pDate >= sDate && pDate < eDate;
  });

  const filteredPayments = dateFilteredPayments.filter((p) => {
    if (methodFilter === "all") return true;
    return p.payment_method?.toLowerCase() === methodFilter.toLowerCase();
  });

  const totalIncome = dateFilteredPayments.reduce(
    (a, x) => a + parseFloat(x.amount),
    0,
  );
  const cashTotal = dateFilteredPayments
    .filter((p) => p.payment_method === "Cash")
    .reduce((a, x) => a + parseFloat(x.amount), 0);
  const transferTotal = dateFilteredPayments
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
      `Payments_Export_${methodFilter !== "all" ? methodFilter + "_" : ""}${startDate || "All"}_to_${endDate || "All"}.csv`,
      headers,
      data,
    );
  };

  const getMethodBtnClass = (m) =>
    `px-3 py-1.5 rounded-lg text-sm transition-all cursor-pointer ${
      methodFilter === m
        ? "bg-white text-text shadow-sm ring-1 ring-neutral-200 font-medium"
        : "text-neutral-500 hover:text-text"
    }`;

  return (
    <>
      <PageHeader title={t("payments.title")} sub={t("payments.sub")} />

      {loading ? (
        <div className="p-8 text-center text-muted">{t("payments.loading")}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div
              className={`card-panel p-5 cursor-pointer transition-all ${
                methodFilter === "all"
                  ? "ring-2 ring-neutral-900 bg-neutral-50/50"
                  : "hover:border-neutral-400"
              }`}
              onClick={() => setMethodFilter("all")}
              title="Click to view all payments"
            >
              <div className="text-muted text-sm mb-3">{t("payments.total_income")}</div>
              <div className="text-3xl font-bold tracking-tight">
                {money(totalIncome)}
              </div>
            </div>
            <div
              className={`card-panel p-5 cursor-pointer transition-all ${
                methodFilter === "Cash"
                  ? "ring-2 ring-neutral-900 bg-neutral-50/50"
                  : "hover:border-neutral-400"
              }`}
              onClick={() => setMethodFilter("Cash")}
              title="Click to filter by Cash payments"
            >
              <div className="text-muted text-sm mb-3">{t("payments.cash")}</div>
              <div className="text-3xl font-bold tracking-tight">
                {money(cashTotal)}
              </div>
            </div>
            <div
              className={`card-panel p-5 cursor-pointer transition-all ${
                methodFilter === "Transfer"
                  ? "ring-2 ring-neutral-900 bg-neutral-50/50"
                  : "hover:border-neutral-400"
              }`}
              onClick={() => setMethodFilter("Transfer")}
              title="Click to filter by Transfer payments"
            >
              <div className="text-muted text-sm mb-3">{t("payments.transfer")}</div>
              <div className="text-3xl font-bold tracking-tight">
                {money(transferTotal)}
              </div>
            </div>
            <div className="card-panel p-5">
              <div className="text-muted text-sm mb-3">
                {methodFilter !== "all"
                  ? methodFilter === "Cash"
                    ? t("payments.cash_payments")
                    : t("payments.transfer_payments")
                  : t("payments.total_payments")}
              </div>
              <div className="text-3xl font-bold tracking-tight">
                {filteredPayments.length}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  className="input-field !py-2 flex-1 sm:w-40"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  title="From Date"
                />
                <span className="text-muted self-center">-</span>
                <input
                  type="date"
                  className="input-field !py-2 flex-1 sm:w-40"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  title="Up to Date (Excluded)"
                />
              </div>

              {/* Payment Method Filter Pills */}
              <div className="flex gap-1 bg-neutral-100 rounded-xl p-1">
                <button
                  type="button"
                  className={getMethodBtnClass("all")}
                  onClick={() => setMethodFilter("all")}
                >
                  {t("payments.filter_all")}
                </button>
                <button
                  type="button"
                  className={getMethodBtnClass("Cash")}
                  onClick={() => setMethodFilter("Cash")}
                >
                  {t("payments.cash")}
                </button>
                <button
                  type="button"
                  className={getMethodBtnClass("Transfer")}
                  onClick={() => setMethodFilter("Transfer")}
                >
                  {t("payments.transfer")}
                </button>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button className="btn-secondary" onClick={handleExport}>
                {t("payments.export_csv")}
              </button>
            </div>
          </div>

          <div className="card-panel overflow-hidden">
            <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr] md:grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr] items-center text-muted text-xs uppercase tracking-wider font-semibold py-3 px-5 border-b border-line bg-neutral-50">
              <div>{t("payments.col_customer")}</div>
              <div>{t("payments.col_service")}</div>
              <div className="hidden md:block">{t("payments.col_method")}</div>
              <div>{t("payments.col_date")}</div>
              <div className="text-right">{t("payments.col_amount")}</div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="p-8 text-center text-muted">
                {t("payments.no_payments")}
              </div>
            ) : (
              filteredPayments.map((x) => (
                <div
                  className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr] md:grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr] items-center py-4 px-5 border-b border-line last:border-0 hover:bg-neutral-50 transition-colors text-sm"
                  key={x.id}
                >
                  <div>
                    <b className="text-base text-text">
                      {x.name || t("bookings.walk_in_customer")}
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
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        x.payment_method === "Cash"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
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
