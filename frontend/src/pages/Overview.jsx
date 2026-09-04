import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { money, formatDate } from "../utils/format";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Overview() {
  const [bookings, setBookings] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/bookings").then((res) => res.json()),
      fetch("/api/reports?period=month").then((res) => res.json()),
    ])
      .then(([bookingsData, reportsData]) => {
        setBookings(bookingsData);
        setReports(reportsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching overview data:", err);
        setLoading(false);
      });
  }, []);

  const renderChange = (percent) => {
    if (!percent)
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
        {isPositive ? "↑" : "↓"} {Math.abs(percent)}% vs last month
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Overview"
        sub={formatDate(new Date())}
       
      />

      {loading ? (
        <div className="p-8 text-center text-muted">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card-panel p-5">
              <div className="text-muted text-sm mb-3">Month bookings</div>
              <div className="text-3xl font-bold tracking-tight">
                {reports?.bookings || 0}
              </div>
              {renderChange(reports?.changes?.bookings)}
            </div>
            <div className="card-panel p-5">
              <div className="text-muted text-sm mb-3">Month Income</div>
              <div className="text-3xl font-bold tracking-tight">
                {money(reports?.revenue || 0)}
              </div>
              {renderChange(reports?.changes?.revenue)}
            </div>
            <div className="card-panel p-5">
              <div className="text-muted text-sm mb-3">Month Expenses</div>
              <div className="text-3xl font-bold tracking-tight">
                {money(reports?.expenses || 0)}
              </div>
              {renderChange(reports?.changes?.expenses)}
            </div>
            <div className="card-panel p-5">
              <div className="text-muted text-sm mb-3">Month Net profit</div>
              <div className="text-3xl font-bold tracking-tight">
                {money(reports?.profit || 0)}
              </div>
              {renderChange(reports?.changes?.profit)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
            <div className="card-panel p-6">
              <div className="font-semibold text-base mb-5">
                Income Trend (This Month)
              </div>
              <div className="h-56 mb-2 w-full">
                {reports?.timeline?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={reports.timeline}
                      margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorRevOverview"
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
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e5e5e5"
                      />
                      <XAxis
                        dataKey="time"
                        tickFormatter={(t) => formatDate(t)}
                        tick={{ fontSize: 11, fill: "#737373" }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        tickFormatter={(v) => `ETB ${v}`}
                        tick={{ fontSize: 11, fill: "#737373" }}
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                      />
                      <Tooltip
                        labelFormatter={(t) => formatDate(t)}
                        formatter={(val) => [money(val), "Revenue"]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e5e5",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevOverview)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted">
                    No data available for this month.
                  </div>
                )}
              </div>
            </div>

            <div className="card-panel p-6">
              <div className="font-semibold text-base mb-4">
                Recent Bookings
              </div>
              <div className="flex flex-col">
                {bookings.length === 0 ? (
                  <div className="text-muted text-sm">No recent bookings.</div>
                ) : (
                  bookings.slice(0, 5).map((b) => (
                    <div
                      className="flex justify-between py-4 border-b border-neutral-100 last:border-0"
                      key={b.id}
                    >
                      <div>
                        <b className="text-base text-text">
                          <Link
                            to={`/bookings/${b.id}`}
                            className="hover:underline"
                          >
                            {b.customer_name || "Walk-in Customer"}
                          </Link>
                        </b>
                        <div className="text-muted text-sm mt-1">
                          {b.service_type} · {b.package} × {b.quantity}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm">
                          {formatDate(b.start_time, true)}
                        </span>
                        <br />
                        <span className="text-muted text-sm">
                          {money(parseFloat(b.agreed_price))} agreed
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Overview;
