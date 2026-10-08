import { useState, useEffect, useMemo, useRef, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import AssignTaskModal from "../components/AssignTaskModal";
import { AuthContext } from "../context/AuthContext";
import { money, formatDate, formatDuration } from "../utils/format";
import "./Bookings.css";

const TINTS = [
  "#2F5BEA",
  "#0B7A43",
  "#B54708",
  "#7A3FD1",
  "#C01048",
  "#088AB2",
];
const tintOf = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TINTS[Math.abs(hash) % TINTS.length];
};

const Icons = {
  Person: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4"></circle>
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"></path>
    </svg>
  ),
  Eye: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  UserPlus: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="4"></circle>
      <path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7"></path>
      <path d="M19 8v6M16 11h6"></path>
    </svg>
  ),
  Plus: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14"></path>
    </svg>
  ),
};

const parseDueTime = (rawDate) => {
  if (!rawDate) return null;
  let y, m, d;
  if (
    typeof rawDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())
  ) {
    const parts = rawDate.trim().split("-").map(Number);
    y = parts[0];
    m = parts[1];
    d = parts[2];
  } else {
    const dObj = new Date(rawDate);
    if (isNaN(dObj.getTime())) return null;
    y = dObj.getFullYear();
    m = dObj.getMonth() + 1;
    d = dObj.getDate();
  }
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
};

function Bookings() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assign Task Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBookingForAssign, setSelectedBookingForAssign] =
    useState(null);

  // Filters & Pagination State
  const [period, setPeriod] = useState("all"); // Default: All Time
  const [balanceTab, setBalanceTab] = useState("all"); // 'all' or 'open'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedServices, setSelectedServices] = useState([]); // Default: [] = All Services
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const serviceDropdownRef = useRef(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchBookings = () => {
    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data) => {
        setBookings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching bookings:", err);
        setLoading(false);
      });
  };

  const handleAssignClick = (b) => {
    if (user?.role !== "Owner") {
      if (b.task_id) {
        navigate(`/tasks/${b.task_id}`);
      } else {
        alert("Only owners can assign tasks to team members.");
      }
      return;
    }
    setSelectedBookingForAssign(b);
    setAssignModalOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        serviceDropdownRef.current &&
        !serviceDropdownRef.current.contains(event.target)
      ) {
        setServiceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAllSelected =
    services.length > 0 && selectedServices.length === services.length;

  const toggleAllServices = () => {
    setCurrentPage(1);
    if (isAllSelected) {
      setSelectedServices([]);
    } else {
      setSelectedServices([...services]);
    }
  };

  const toggleService = (serviceName) => {
    setCurrentPage(1);
    setSelectedServices((prev) => {
      if (prev.includes(serviceName)) {
        return prev.filter((s) => s !== serviceName);
      } else {
        return [...prev, serviceName];
      }
    });
  };

  const getServiceLabel = () => {
    if (
      isAllSelected ||
      (services.length === 0 && selectedServices.length === 0)
    ) {
      return "All Services";
    }
    if (selectedServices.length === 0) {
      return "No Services Selected";
    }
    if (selectedServices.length === 1) {
      return selectedServices[0];
    }
    return `${selectedServices.length} Services Selected`;
  };

  useEffect(() => {
    fetchBookings();

    fetch("/api/settings/services")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const names = Array.isArray(data) ? data.map((s) => s.name).sort() : [];
        setServices(names);
        setSelectedServices(names); // Default: all services checked
      })
      .catch(() => {
        setServices([]);
        setSelectedServices([]);
      });
  }, []);

  const getBtnClass = (p) =>
    `px-4 py-1.5 rounded-lg text-sm transition-all cursor-pointer ${
      period === p
        ? "bg-white text-text shadow-sm ring-1 ring-neutral-200 font-medium"
        : "text-neutral-500 hover:text-text"
    }`;

  // Helper for overdue / due status
  const getDueStatus = (dueDateStr, balance) => {
    if (!dueDateStr) return null;
    const dueTime = parseDueTime(dueDateStr);
    if (dueTime === null) return null;

    const now = new Date();
    const todayTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    ).getTime();
    const diffDays = Math.round((dueTime - todayTime) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        text: `Overdue · ${daysAgo} day${daysAgo > 1 ? "s" : ""}`,
        badgeClass: balance > 0 ? "red" : "green",
      };
    } else if (diffDays === 0) {
      return { text: "Due today", badgeClass: "amber" };
    } else if (diffDays === 1) {
      return { text: "Due tomorrow", badgeClass: "green" };
    } else {
      return {
        text: `In ${diffDays} days`,
        badgeClass: "green",
      };
    }
  };

  // Base Filter Logic (Search, Service, Due Date)
  const dateAndSearchFiltered = useMemo(() => {
    let result = [...bookings];
    const now = new Date();

    // 1. Search Filter (Customer name, phone, service)
    if (search.trim()) {
      const q = search.toLowerCase().replace(/\s+/g, "");
      result = result.filter((b) => {
        const name = (b.customer_name || "").toLowerCase().replace(/\s+/g, "");
        const phone = (b.customer_phone || "")
          .toLowerCase()
          .replace(/[\s\-+()]/g, "");
        const service = (b.service_type || "")
          .toLowerCase()
          .replace(/\s+/g, "");
        return name.includes(q) || phone.includes(q) || service.includes(q);
      });
    }

    // 2. Service Filter (Multi-select, default: all services)
    if (services.length > 0 && !isAllSelected) {
      result = result.filter((b) => selectedServices.includes(b.service_type));
    }

    // 3. Due Date Period Filter (Today, This Week, This Month, All Time, Custom)
    if (period !== "all") {
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      ).getTime();
      const startOfTomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        0,
      ).getTime();

      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - dayOfWeek,
        0,
        0,
        0,
        0,
      ).getTime();
      const endOfWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - dayOfWeek + 7,
        0,
        0,
        0,
        0,
      ).getTime();

      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
        0,
      ).getTime();
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1,
        0,
        0,
        0,
        0,
      ).getTime();

      const sCustom = startDate
        ? (() => {
            const [y, m, d] = startDate.split("-").map(Number);
            return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
          })()
        : 0;
      const eCustom = endDate
        ? (() => {
            const [y, m, d] = endDate.split("-").map(Number);
            return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
          })()
        : Infinity;

      result = result.filter((b) => {
        const rawDate = b.due_date;
        if (!rawDate) return false;
        const dueTime = parseDueTime(rawDate);
        if (dueTime === null) return false;

        if (period === "today")
          return dueTime >= startOfToday && dueTime < startOfTomorrow;
        if (period === "week")
          return dueTime >= startOfWeek && dueTime < endOfWeek;
        if (period === "month")
          return dueTime >= startOfMonth && dueTime < endOfMonth;
        if (period === "overdue") {
          const total = parseFloat(b.agreed_price) || 0;
          const paid = parseFloat(b.paid_amount) || 0;
          return dueTime < startOfToday && total - paid > 0;
        }
        if (period === "custom") return dueTime >= sCustom && dueTime < eCustom;
        return true;
      });
    }

    return result;
  }, [
    bookings,
    search,
    period,
    selectedServices,
    services,
    isAllSelected,
    startDate,
    endDate,
  ]);

  // Tab counts
  const openBalanceCount = useMemo(() => {
    return dateAndSearchFiltered.filter((b) => {
      const total = parseFloat(b.agreed_price) || 0;
      const paid = parseFloat(b.paid_amount) || 0;
      return total - paid > 0;
    }).length;
  }, [dateAndSearchFiltered]);

  const overdueCount = useMemo(() => {
    const now = new Date();
    const todayTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    ).getTime();
    return dateAndSearchFiltered.filter((b) => {
      const total = parseFloat(b.agreed_price) || 0;
      const paid = parseFloat(b.paid_amount) || 0;
      if (total - paid <= 0) return false;
      const rawDate = b.due_date;
      if (!rawDate) return false;
      const dueTime = parseDueTime(rawDate);
      if (dueTime === null) return false;
      return dueTime < todayTime;
    }).length;
  }, [dateAndSearchFiltered]);

  // Final Filtered list after balance tab is applied
  const finalBookings = useMemo(() => {
    const now = new Date();
    const todayTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    ).getTime();

    if (balanceTab === "open") {
      return dateAndSearchFiltered.filter((b) => {
        const total = parseFloat(b.agreed_price) || 0;
        const paid = parseFloat(b.paid_amount) || 0;
        return total - paid > 0;
      });
    }
    if (balanceTab === "overdue") {
      return dateAndSearchFiltered.filter((b) => {
        const total = parseFloat(b.agreed_price) || 0;
        const paid = parseFloat(b.paid_amount) || 0;
        if (total - paid <= 0) return false;
        const rawDate = b.due_date;
        if (!rawDate) return false;
        const dueTime = parseDueTime(rawDate);
        if (dueTime === null) return false;
        return dueTime < todayTime;
      });
    }
    return dateAndSearchFiltered;
  }, [dateAndSearchFiltered, balanceTab]);

  // Pagination Logic
  const totalPages = Math.ceil(finalBookings.length / itemsPerPage);
  const paginatedBookings = finalBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, period, selectedServices, startDate, endDate, balanceTab]);

  return (
    <>
      <PageHeader title="Bookings" sub="Manage appointments and payments" />

      <div className="flex flex-col gap-4 mb-6">
        {/* Top Controls: Due Date Filters and New Booking Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider shrink-0">
              Due Date:
            </span>
            <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 overflow-x-auto w-full md:w-auto">
              <button
                className={getBtnClass("all")}
                onClick={() => setPeriod("all")}
              >
                All Time
              </button>
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
                className={getBtnClass("overdue")}
                onClick={() => setPeriod("overdue")}
              >
                Overdue
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

          <button
            className="btn !py-2 shrink-0 w-full md:w-auto"
            onClick={() => navigate("/new-booking")}
          >
            + New booking
          </button>
        </div>

        {/* Secondary Controls: Search and Service Filter */}
        <div className="flex flex-col md:flex-row gap-3 w-full md:justify-between items-center">
          <input
            type="text"
            placeholder="Search name or phone..."
            className="input-field !py-2 w-full md:w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {/* Multi-Select Service Dropdown */}
          <div className="relative w-full md:w-56" ref={serviceDropdownRef}>
            <button
              type="button"
              onClick={() => setServiceDropdownOpen((prev) => !prev)}
              className="input-field !py-2 bg-white w-full flex items-center justify-between text-left text-sm cursor-pointer border border-line rounded-lg px-3 hover:border-neutral-400 transition-colors"
              aria-haspopup="listbox"
              aria-expanded={serviceDropdownOpen}
            >
              <span className="truncate font-medium text-neutral-800">
                {getServiceLabel()}
              </span>
              <span className="flex items-center gap-1.5 ml-2 text-neutral-400 shrink-0">
                {!isAllSelected && selectedServices.length > 0 && (
                  <span className="bg-neutral-900 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                    {selectedServices.length}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${serviceDropdownOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </button>

            {serviceDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-full md:w-64 bg-white rounded-xl shadow-xl border border-neutral-200 py-1.5 z-40 max-h-72 overflow-y-auto">
                {/* "All Services" Option */}
                <button
                  type="button"
                  onClick={toggleAllServices}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    readOnly
                    className="w-4 h-4 accent-neutral-900 rounded cursor-pointer pointer-events-none"
                  />
                  <span
                    className={`flex-1 truncate ${isAllSelected ? "font-semibold text-neutral-900" : "text-neutral-700"}`}
                  >
                    All Services
                  </span>
                </button>

                <div className="border-t border-neutral-100 my-1"></div>

                {services.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-neutral-400 italic">
                    No services available
                  </div>
                ) : (
                  services.map((s) => {
                    const isSelected = selectedServices.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleService(s)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-neutral-50 transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-4 h-4 accent-neutral-900 rounded cursor-pointer pointer-events-none"
                        />
                        <span
                          className={`flex-1 truncate ${isSelected ? "font-semibold text-neutral-900" : "text-neutral-700"}`}
                        >
                          {s}
                        </span>
                      </button>
                    );
                  })
                )}

                {services.length > 0 && (
                  <>
                    <div className="border-t border-neutral-100 my-1"></div>
                    <div className="px-3 py-1 flex justify-between items-center">
                      <span className="text-[11px] text-muted">
                        {selectedServices.length} of {services.length} selected
                      </span>
                      <button
                        type="button"
                        onClick={toggleAllServices}
                        className="text-[11px] font-semibold text-neutral-900 hover:underline cursor-pointer"
                      >
                        {isAllSelected ? "Unselect All" : "Select All"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="booking-card">
        {/* Toolbar with tabs & counts */}
        <div className="booking-toolbar">
          <div className="booking-tabs">
            <button
              type="button"
              className={`booking-tab ${balanceTab === "all" ? "active" : ""}`}
              onClick={() => setBalanceTab("all")}
            >
              <span>All</span>
              <span className="count">{dateAndSearchFiltered.length}</span>
            </button>
            <button
              type="button"
              className={`booking-tab ${balanceTab === "open" ? "active" : ""}`}
              onClick={() => setBalanceTab("open")}
            >
              <span>Open balance</span>
              <span className="count">{openBalanceCount}</span>
            </button>
            <button
              type="button"
              className={`booking-tab ${balanceTab === "overdue" ? "active" : ""}`}
              onClick={() => setBalanceTab("overdue")}
            >
              <span>Overdue</span>
              <span className="count">{overdueCount}</span>
            </button>
          </div>
          <div className="booking-shown">
            Showing{" "}
            {finalBookings.length === 0
              ? 0
              : (currentPage - 1) * itemsPerPage + 1}{" "}
            to {Math.min(currentPage * itemsPerPage, finalBookings.length)} of{" "}
            {finalBookings.length} bookings
          </div>
        </div>

        {/* Scrollable table container */}
        <div className="booking-scroll">
          <div className="booking-inner">
            {/* Table Header */}
            <div className="booking-cols booking-thead">
              <div>Order time</div>
              <div>Customer</div>
              <div>Service</div>
              <div>Due Date</div>
              <div>Payment</div>
              <div className="booking-right">Due Balance</div>
              <div className="booking-right">Actions</div>
            </div>

            {/* Table Rows */}
            {loading ? (
              <div className="p-8 text-center text-muted">
                Loading bookings...
              </div>
            ) : paginatedBookings.length === 0 ? (
              <div className="p-8 text-center text-muted">
                No bookings found matching filters.
              </div>
            ) : (
              <div className="booking-rows">
                {paginatedBookings.map((b) => {
                  const total = parseFloat(b.agreed_price) || 0;
                  const paid = parseFloat(b.paid_amount) || 0;
                  const balance = Math.max(0, total - paid);
                  const pct =
                    total > 0
                      ? Math.min(100, Math.round((paid / total) * 100))
                      : 100;
                  const isWalkIn =
                    !b.customer_name ||
                    b.customer_name.toLowerCase().includes("walk-in");
                  const dueInfo = b.due_date
                    ? getDueStatus(b.due_date, balance)
                    : null;

                  // Package chips
                  const packages = b.package
                    ? b.package
                        .split(",")
                        .map((p) => p.trim())
                        .filter(Boolean)
                    : [];

                  // Time and duration
                  const timeFormatted = b.start_time
                    ? new Date(b.start_time).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "";
                  const durFormatted = b.end_time
                    ? formatDuration(b.start_time, b.end_time)
                    : "";

                  return (
                    <div className="booking-cols booking-row" key={b.id}>
                      {/* 1. Order Time */}
                      <div
                        className="booking-stack booking-g3 c-time"
                        data-label="Order time"
                      >
                        <div className="booking-t14 booking-strong">
                          {formatDate(b.start_time)}
                        </div>
                        <div className="booking-t125 booking-muted">
                          {timeFormatted}
                          {durFormatted ? ` · ${durFormatted}` : ""}
                        </div>
                      </div>

                      {/* 2. Customer */}
                      <div className="booking-customer c-cust">
                        <div className="booking-avatar">
                          {isWalkIn ? (
                            <Icons.Person />
                          ) : (
                            <span>
                              {b.customer_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div
                          className="booking-stack booking-g2"
                          style={{ minWidth: 0 }}
                        >
                          <div className="booking-t145 booking-strong truncate">
                            <Link
                              to={`/bookings/${b.id}`}
                              className="hover:underline text-text"
                            >
                              {b.customer_name || "Walk-in Customer"}
                            </Link>
                          </div>
                          {b.customer_phone && (
                            <div className="booking-t125 booking-muted truncate">
                              {b.customer_phone}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. Service */}
                      <div
                        className="booking-stack booking-g6 c-serv"
                        data-label="Service"
                        style={{ minWidth: 0 }}
                      >
                        <div className="booking-t14 booking-strong truncate">
                          {b.service_type}
                        </div>
                        <div className="booking-chips">
                          {packages.map((pkg, idx) => (
                            <span className="booking-chip" key={idx}>
                              {pkg}
                            </span>
                          ))}
                          <span className="booking-t12 booking-muted">
                            × {b.quantity}
                          </span>
                        </div>
                      </div>

                      {/* 4. Due Date */}
                      <div
                        className="booking-stack booking-g5 c-due"
                        data-label="Due Date"
                        style={{ alignItems: "flex-start" }}
                      >
                        {b.due_date ? (
                          <>
                            <div className="booking-t14 font-medium text-neutral-800">
                              {formatDate(b.due_date)}
                            </div>
                            {dueInfo && (
                              <span
                                className={`booking-badge ${dueInfo.badgeClass}`}
                              >
                                <i></i>
                                {dueInfo.text}
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="booking-t14 text-neutral-400 font-normal">
                            —
                          </div>
                        )}
                      </div>

                      {/* 5. Payment Progress */}
                      <div
                        className="booking-pay-cell c-pay"
                        data-label="Payment"
                      >
                        <div className="booking-pay-top">
                          <span className="booking-paid">{money(paid)}</span>
                          <span className="booking-t12 booking-muted">
                            {pct}%
                          </span>
                        </div>
                        <div className="booking-bar">
                          <div style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="booking-t12 booking-muted">
                          of {money(total)}
                        </div>
                      </div>

                      {/* 6. Balance */}
                      <div
                        className="booking-balance c-bal"
                        data-label="Due Balance"
                      >
                        <div
                          className={`booking-t145 booking-strong ${balance > 0 ? "booking-bal-open" : "booking-bal-zero"}`}
                        >
                          {money(balance)}
                        </div>
                        {balance > 0 ? (
                          <span className="booking-badge amber">
                            <i></i>
                            {paid > 0 ? "Partial" : "Unpaid"}
                          </span>
                        ) : (
                          <span className="booking-badge green">
                            <i></i>Paid
                          </span>
                        )}
                      </div>

                      {/* 7. Actions */}
                      {(() => {
                        const hasAssignees =
                          Array.isArray(b.assignees) && b.assignees.length > 0;
                        const firstAssignee = hasAssignees
                          ? b.assignees[0]
                          : null;
                        const assignLabel = hasAssignees
                          ? b.assignees.length > 1
                            ? `${firstAssignee.username} +${b.assignees.length - 1}`
                            : firstAssignee.username
                          : "Assign";
                        const assignBg = hasAssignees
                          ? tintOf(firstAssignee.username)
                          : undefined;

                        return (
                          <div className="booking-actions c-act">
                            <button
                              type="button"
                              className="booking-icon-btn"
                              aria-label="View booking"
                              title="View"
                              onClick={() => navigate(`/bookings/${b.id}`)}
                            >
                              <Icons.Eye />
                            </button>

                            <button
                              type="button"
                              className={`booking-assign-btn ${hasAssignees ? "assigned" : ""}`}
                              style={
                                hasAssignees
                                  ? { backgroundColor: assignBg }
                                  : {}
                              }
                              aria-label={
                                hasAssignees
                                  ? `Assigned to ${b.assignees.map((a) => a.username).join(", ")}`
                                  : "Assign order"
                              }
                              title={
                                hasAssignees
                                  ? `Assigned to ${b.assignees.map((a) => a.username).join(", ")}. Click to edit`
                                  : "Assign order"
                              }
                              onClick={() => handleAssignClick(b)}
                            >
                              {!hasAssignees && <Icons.UserPlus />}
                              <span className="booking-assign-label">
                                {assignLabel}
                              </span>
                            </button>

                            {balance > 0 && (
                              <button
                                type="button"
                                className="booking-pay-btn"
                                aria-label="Add payment"
                                onClick={() =>
                                  navigate(`/record-payment?booking=${b.id}`)
                                }
                              >
                                <Icons.Plus />
                                <span>Add Pay</span>
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="px-5 py-4 border-t border-line flex justify-between items-center bg-white">
            <div className="text-sm text-muted">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, finalBookings.length)} of{" "}
              {finalBookings.length}
            </div>
            <div className="flex gap-1">
              <button
                className="px-3 py-1 text-sm border border-line rounded disabled:opacity-50 hover:bg-neutral-50 cursor-pointer"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Prev
              </button>
              <button
                className="px-3 py-1 text-sm border border-line rounded disabled:opacity-50 hover:bg-neutral-50 cursor-pointer"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AssignTaskModal
        booking={selectedBookingForAssign}
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onSaved={fetchBookings}
      />
    </>
  );
}

export default Bookings;
