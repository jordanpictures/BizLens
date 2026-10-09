import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader";
import { AuthContext } from "../context/AuthContext";
import { formatDate, formatDuration } from "../utils/format";

function Tasks() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const isOwner = user?.role === "Owner";

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Update status directly from task card
  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === taskId ? { ...item, status: newStatus } : item,
          ),
        );
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating task status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Distinct assignees list for owner filter
  const allAssignees = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      (task.assignees || []).forEach((a) => {
        if (!map.has(a.id)) {
          map.set(a.id, a);
        }
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.username.localeCompare(b.username),
    );
  }, [tasks]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: tasks.length,
      pending: tasks.filter((task) => task.status === "Pending").length,
      in_progress: tasks.filter((task) => task.status === "In Progress").length,
      completed: tasks.filter((task) => task.status === "Completed").length,
    };
  }, [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (statusFilter !== "all" && task.status !== statusFilter) return false;

      // Assignee filter
      if (assigneeFilter !== "all") {
        const hasAssignee = (task.assignees || []).some(
          (a) => a.id === assigneeFilter,
        );
        if (!hasAssignee) return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(q);
        const matchesCustomer = task.customer_name?.toLowerCase().includes(q);
        const matchesService = task.service_type?.toLowerCase().includes(q);
        const matchesNotes = task.notes?.toLowerCase().includes(q);
        const matchesAssignee = (task.assignees || []).some((a) =>
          a.username.toLowerCase().includes(q),
        );
        if (
          !matchesTitle &&
          !matchesCustomer &&
          !matchesService &&
          !matchesNotes &&
          !matchesAssignee
        ) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, statusFilter, assigneeFilter, search]);

  const getStatusText = (status) => {
    switch (status) {
      case "In Progress":
        return t("status.in_progress");
      case "Completed":
        return t("status.completed");
      case "Cancelled":
        return t("status.cancelled");
      case "Pending":
      default:
        return t("status.pending");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "In Progress":
        return "bg-neutral-100 text-neutral-800 border-neutral-300";
      case "Completed":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Cancelled":
        return "bg-neutral-100 text-neutral-500 border-neutral-200";
      default:
        return "bg-amber-50 text-amber-800 border-amber-200";
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case "In Progress":
        return "bg-neutral-900";
      case "Completed":
        return "bg-emerald-500";
      case "Cancelled":
        return "bg-neutral-400";
      default:
        return "bg-amber-500";
    }
  };

  return (
    <>
      <PageHeader
        title={t("tasks.title")}
        sub={isOwner ? t("tasks.sub_owner") : t("tasks.sub_member")}
      />

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-line shadow-xs">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider">
            {t("tasks.total")}
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">
            {counts.all}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-line shadow-xs">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
            {t("tasks.to_do")}
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {counts.pending}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-line shadow-xs">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            {t("tasks.in_progress")}
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {counts.in_progress}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-line shadow-xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            {t("tasks.completed")}
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {counts.completed}
          </div>
        </div>
      </div>

      {/* Controls & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-line shadow-xs overflow-hidden mb-6">
        <div className="p-4 border-b border-line flex flex-wrap items-center justify-between gap-3 bg-neutral-50/50">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: "all", label: t("tasks.filter_all"), count: counts.all },
              {
                key: "Pending",
                label: t("status.pending"),
                count: counts.pending,
              },
              {
                key: "In Progress",
                label: t("status.in_progress"),
                count: counts.in_progress,
              },
              {
                key: "Completed",
                label: t("status.completed"),
                count: counts.completed,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.key
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Assignee Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isOwner && allAssignees.length > 0 && (
              <select
                className="input-field text-xs !py-1.5 !px-3 bg-white"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
              >
                <option value="all">{t("tasks.assignee_filter")}</option>
                {allAssignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.username} {a.position ? `(${a.position})` : ""}
                  </option>
                ))}
              </select>
            )}

            <input
              type="text"
              className="input-field text-xs !py-1.5 !px-3 min-w-[200px]"
              placeholder={t("tasks.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Task Cards Grid */}
        <div className="p-4 sm:p-6 bg-neutral-50/30">
          {loading ? (
            <div className="py-16 text-center text-muted">
              {t("common.loading")}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
              </div>
              <h4 className="text-base font-semibold text-neutral-800 m-0">
                {t("tasks.no_tasks")}
              </h4>
              <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                {isOwner
                  ? t("tasks.no_tasks_owner_sub")
                  : t("tasks.no_tasks_member_sub")}
              </p>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => navigate("/bookings")}
                  className="btn text-xs !py-1.5 !px-4 mt-4"
                >
                  {t("tasks.go_to_bookings")}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTasks.map((task) => {
                const assignees = task.assignees || [];
                const canShowCustomer =
                  isOwner || Boolean(task.show_customer_info);
                const displayTitle = canShowCustomer
                  ? task.customer_name?.trim() || t("tasks.walk_in")
                  : `${task.service_type} Task`;
                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl border border-neutral-200/90 hover:border-neutral-400/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] transition-all duration-200 p-5 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Row: Service Tag & Status / Priority */}
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-900"></span>
                          {task.service_type}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {task.priority && task.priority !== "Normal" && (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                task.priority === "Urgent"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {task.priority}
                            </span>
                          )}

                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                              task.status,
                            )}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${getStatusDot(
                                task.status,
                              )}`}
                            ></span>
                            {getStatusText(task.status)}
                          </span>
                        </div>
                      </div>

                      {/* Title & Customer Contact */}
                      <div className="mb-4">
                        <h4 className="text-base font-bold text-neutral-900 m-0 group-hover:text-neutral-700 transition-colors leading-snug">
                          <Link to={`/tasks/${task.id}`}>{displayTitle}</Link>
                        </h4>
                        {canShowCustomer && task.customer_phone && (
                          <a
                            href={`tel:${task.customer_phone}`}
                            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 font-medium transition-colors mt-1"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            <span>{task.customer_phone}</span>
                          </a>
                        )}
                      </div>

                      {/* Modular Meta Info Panel */}
                      <div className="bg-neutral-50/80 rounded-xl p-3 border border-neutral-200/60 space-y-2 mb-3.5">
                        {/* Schedule: Start Time & Duration (No End Time) */}
                        {task.start_time && (
                          <div className="flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-1.5 text-neutral-400 font-medium">
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                              <span className="text-[11px] uppercase tracking-wider font-semibold">
                                {t("tasks.schedule")}
                              </span>
                            </div>
                            <div className="font-semibold text-neutral-800 text-right">
                              <span>{formatDate(task.start_time, true)}</span>
                              {task.end_time && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-neutral-200/80 text-[10px] font-semibold text-neutral-800">
                                  {formatDuration(
                                    task.start_time,
                                    task.end_time,
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Due Date */}
                        {task.due_date && (
                          <div className="flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-1.5 text-neutral-400 font-medium">
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect
                                  x="3"
                                  y="4"
                                  width="18"
                                  height="18"
                                  rx="2"
                                  ry="2"
                                ></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                              </svg>
                              <span className="text-[11px] uppercase tracking-wider font-semibold">
                                {t("tasks.due_date")}
                              </span>
                            </div>
                            <span className="font-semibold text-neutral-800">
                              {formatDate(task.due_date)}
                            </span>
                          </div>
                        )}

                        {/* Package Info */}
                        {task.package && (
                          <div className="flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-1.5 text-neutral-400 font-medium">
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                                <polyline points="2 17 12 22 22 17"></polyline>
                                <polyline points="2 12 12 17 22 12"></polyline>
                              </svg>
                              <span className="text-[11px] uppercase tracking-wider font-semibold">
                                {t("tasks.package")}
                              </span>
                            </div>
                            <span className="font-medium text-neutral-800 truncate max-w-[150px]">
                              {task.package}
                              {task.quantity > 1 ? ` (×${task.quantity})` : ""}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Assignment Notes */}
                      {task.notes ? (
                        <div className="p-3 bg-neutral-50/70 rounded-xl border border-neutral-200/60 mb-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                            <span>{t("tasks.instructions")}</span>
                          </div>
                          <p className="line-clamp-2 m-0 text-xs text-neutral-700 leading-relaxed font-normal">
                            {task.notes}
                          </p>
                        </div>
                      ) : (
                        <div className="text-[11px] text-neutral-400 italic mb-2">
                          {t("tasks.no_instructions")}
                        </div>
                      )}
                    </div>

                    {/* Card Bottom: Team Member & Quick Status Changer & Details Link */}
                    <div className="mt-4 pt-3.5 border-t border-neutral-100">
                      <div className="flex items-center justify-between mb-3 gap-2">
                        {/* Assignee display - First letter label and username only */}
                        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                          {assignees.length > 0 ? (
                            assignees.map((a) => (
                              <div
                                key={a.id}
                                className="flex items-center gap-2 min-w-0"
                                title={a.username}
                              >
                                <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {a.username.charAt(0).toUpperCase()}
                                </span>
                                <span className="text-xs font-semibold text-neutral-900 truncate">
                                  {a.username}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                              <span className="w-6 h-6 rounded-full border border-dashed border-neutral-300 flex items-center justify-center text-[10px] text-neutral-400 shrink-0">
                                —
                              </span>
                              <span>{t("tasks.unassigned")}</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Status Selector with Custom Caret */}
                        <div className="relative shrink-0">
                          <select
                            disabled={updatingId === task.id}
                            className="appearance-none text-xs font-semibold bg-white border border-neutral-200 hover:border-neutral-400 rounded-lg pl-3 pr-7 py-1.5 text-neutral-800 cursor-pointer shadow-2xs transition-colors focus:outline-hidden"
                            value={task.status}
                            onChange={(e) =>
                              handleStatusChange(task.id, e.target.value)
                            }
                          >
                            <option value="Pending">
                              {t("status.pending")}
                            </option>
                            <option value="In Progress">
                              {t("status.in_progress")}
                            </option>
                            <option value="Completed">
                              {t("status.completed")}
                            </option>
                            <option value="Cancelled">
                              {t("status.cancelled")}
                            </option>
                          </select>
                          <svg
                            className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
                      </div>

                      {/* Full width Details Link */}
                      <Link
                        to={`/tasks/${task.id}`}
                        className="w-full py-2 px-3 text-center text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100/70 hover:bg-neutral-200/80 rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>{t("tasks.view_details")}</span>
                        <span className="text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all">
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Tasks;
