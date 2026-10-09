import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader";
import { money, formatDate, downloadCSV } from "../utils/format";

function Expenses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetch("/api/expenses")
      .then((res) => res.json())
      .then((data) => {
        setExpenses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching expenses:", err);
        setLoading(false);
      });
  }, []);

  const filteredExpenses = expenses.filter((p) => {
    if (!startDate && !endDate) return true;
    const pDate = new Date(p.date).setHours(0, 0, 0, 0);
    const sDate = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
    const eDate = endDate ? new Date(endDate).setHours(0, 0, 0, 0) : Infinity;
    return pDate >= sDate && pDate < eDate;
  });

  const totalExpenses = filteredExpenses.reduce(
    (a, x) => a + parseFloat(x.amount),
    0,
  );

  const handleExport = () => {
    const headers = ['Reason', 'Date', 'Amount (ETB)'];
    const data = filteredExpenses.map(p => [
      p.reason,
      formatDate(p.date),
      parseFloat(p.amount).toFixed(2)
    ]);
    downloadCSV(`Expenses_Export_${startDate || 'All'}_to_${endDate || 'All'}.csv`, headers, data);
  };

  return (
    <>
      <PageHeader title={t("expenses.title")} sub={t("expenses.sub")} />

      {loading ? (
        <div className="p-8 text-center text-muted">{t("expenses.loading")}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card-panel p-5">
              <div className="text-muted text-sm mb-3">{t("expenses.total_expenses")}</div>
              <div className="text-3xl font-bold tracking-tight text-red-600">
                {money(totalExpenses)}
              </div>
            </div>
            <div className="card-panel p-5">
              <div className="text-muted text-sm mb-3">{t("expenses.entries")}</div>
              <div className="text-3xl font-bold tracking-tight">
                {filteredExpenses.length}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4 max-w-4xl">
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
                {t("expenses.export_csv")}
              </button>
              <button className="btn" onClick={() => navigate("/add-expense")}>
                {t("expenses.add_expense_btn")}
              </button>
            </div>
          </div>

          <div className="card-panel overflow-hidden max-w-4xl">
            <div className="grid grid-cols-[2fr_1fr_1fr] items-center text-muted text-xs uppercase tracking-wider font-semibold py-3 px-5 border-b border-line bg-neutral-50">
              <div>{t("expenses.col_reason")}</div>
              <div>{t("expenses.col_date")}</div>
              <div className="text-right">{t("expenses.col_amount")}</div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="p-8 text-center text-muted">
                {t("expenses.no_expenses")}
              </div>
            ) : (
              filteredExpenses.map((x) => (
                <div
                  className="grid grid-cols-[2fr_1fr_1fr] items-center py-4 px-5 border-b border-line last:border-0 hover:bg-neutral-50 transition-colors text-sm"
                  key={x.id}
                >
                  <div>
                    <b className="text-base text-text">{x.reason}</b>
                  </div>
                  <div className="text-muted">{formatDate(x.date)}</div>
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

export default Expenses;
