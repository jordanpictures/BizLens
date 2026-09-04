import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import { money, formatDate, downloadCSV } from "../utils/format";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Reports() {
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let url = `/api/reports?period=${period}`;
    if (period === "custom" && startDate && endDate) {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    } else if (period === "custom") {
      setLoading(false);
      return;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setReports(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching reports:", err);
        setLoading(false);
      });
  }, [period, startDate, endDate]);

  const getBtnClass = (p) =>
    `px-4 py-1.5 rounded-lg text-sm transition-all cursor-pointer ${period === p ? "bg-white text-text shadow-sm ring-1 ring-neutral-200 font-medium" : "text-neutral-500 hover:text-text"}`;

  const handleExport = () => {
    if (!reports) return;
    const headers = ["Metric", "Value", "Change vs Previous (%)"];
    const data = [
      [
        "Revenue",
        parseFloat(reports.revenue).toFixed(2),
        reports.changes?.revenue || 0,
      ],
      [
        "Expenses",
        parseFloat(reports.expenses).toFixed(2),
        reports.changes?.expenses || 0,
      ],
      [
        "Net Profit",
        parseFloat(reports.profit).toFixed(2),
        reports.changes?.profit || 0,
      ],
      ["Total Bookings", reports.bookings, reports.changes?.bookings || 0],
      ["Completed Bookings", reports.completed, "-"],
    ];
    downloadCSV(`Reports_Export_${period}.csv`, headers, data);
  };

  const renderChange = (percent) => {
    if (period === "all" || percent === 0)
      return (
        <div className="text-neutral-400 text-xs mt-2 font-medium">
          No change
        </div>
      );
    const isPositive = percent > 0;
    return (
      <div
        className={`${isPositive ? "text-green-700" : "text-red-600"} text-xs mt-2 font-medium`}
      >
        {isPositive ? "↑" : "↓"} {Math.abs(percent)}% vs previous
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Reports"
        sub="Track your performance"
       
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 overflow-x-auto w-full md:w-auto">
            <button
              className={getBtnClass("today")}
              onClick={() => setPeriod("today")}
            >
              Today
            </button>
            <button
              className={getBtnClass("week")}
              onClick={() => setPeriod("week")}
            >
              This Week
            </button>
            <button
              className={getBtnClass("month")}
              onClick={() => setPeriod("month")}
            >
              This Month
            </button>
            <button
              className={getBtnClass("all")}
              onClick={() => setPeriod("all")}
            >
              All Time
            </button>
            <button
              className={getBtnClass("custom")}
              onClick={() => setPeriod("custom")}
            >
              Custom
            </button>
          </div>

          {period === "custom" && (
            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
              <input
                type="date"
                className="input-field !py-1.5 flex-1 md:w-36 text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="From Date"
              />
              <span className="text-muted self-center">-</span>
              <input
                type="date"
                className="input-field !py-1.5 flex-1 md:w-36 text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="Up to Date (Excluded)"
              />
            </div>
          )}
        </div>

        <div className="text-muted text-sm hidden md:flex items-center gap-3">
          {period === "custom" && startDate && endDate
            ? `${formatDate(startDate)} - ${formatDate(endDate)}`
            : formatDate(new Date())}
          <button
            className="btn-secondary !py-1 !text-xs"
            onClick={handleExport}
            disabled={!reports}
          >
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted">Loading reports...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card-panel p-5">
              <div className="text-muted text-sm mb-3">Revenue</div>
              <div className="text-3xl font-bold tracking-tight">
                {money(reports?.revenue || 0)}
              </div>
              {renderChange(reports?.changes?.revenue)}
            </div>
            <div className="card-panel p-5">
              <div className="text-muted text-sm mb-3">Expenses</div>
              <div className="text-3xl font-bold tracking-tight">
                {money(reports?.expenses || 0)}
              </div>
              {renderChange(reports?.changes?.expenses)}
            </div>
            <div className="card-panel p-5">
              <div className="text-muted text-sm mb-3">Net profit</div>
              <div className="text-3xl font-bold tracking-tight">
                {money(reports?.profit || 0)}
              </div>
              {renderChange(reports?.changes?.profit)}
            </div>
            <div className="card-panel p-5">
              <div className="text-muted text-sm mb-3">Bookings</div>
              <div className="text-3xl font-bold tracking-tight">
                {reports?.bookings || 0}
              </div>
              <div className="text-muted text-xs mt-2">
                {reports?.completed || 0} completed
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5">
            <div className="card-panel p-6">
              <h3 className="font-semibold text-lg mb-6">
                Revenue vs Expenses
              </h3>
              <div className="h-[300px] w-full">
                {reports?.timeline?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={reports.timeline}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorRev"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorExp"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#ef4444"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#ef4444"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e5e5e5"
                      />
                      <XAxis
                        dataKey="time"
                        tickFormatter={(t) => formatDate(t)}
                        tick={{ fontSize: 12, fill: "#737373" }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        tickFormatter={(v) => `ETB ${v}`}
                        tick={{ fontSize: 12, fill: "#737373" }}
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                      />
                      <Tooltip
                        labelFormatter={(t) => formatDate(t)}
                        formatter={(val) => [money(val)]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e5e5",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        name="Revenue"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRev)"
                      />
                      <Area
                        type="monotone"
                        name="Expenses"
                        dataKey="expenses"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorExp)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted">
                    No data available for this period.
                  </div>
                )}
              </div>
            </div>

            <div className="card-panel p-6">
              <h3 className="font-semibold text-lg mb-6">Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-line">
                  <span className="text-muted text-sm">Gross Revenue</span>
                  <span className="font-semibold">
                    {money(reports?.revenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-line">
                  <span className="text-muted text-sm">Total Expenses</span>
                  <span className="font-semibold text-red-600">
                    -{money(reports?.expenses || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-line">
                  <span className="text-muted text-sm">Net Profit</span>
                  <span className="font-bold text-green-700">
                    {money(reports?.profit || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted text-sm">Profit Margin</span>
                  <span className="font-semibold text-neutral-800">
                    {reports?.revenue > 0
                      ? Math.round((reports.profit / reports.revenue) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Reports;
