import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader";
import AssignTaskModal from "../components/AssignTaskModal";
import RewardModal from "../components/RewardModal";
import { AuthContext } from "../context/AuthContext";
import { formatDate, formatDuration, money } from "../utils/format";

function TaskDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [rewards, setRewards] = useState([]);

  const isOwner = user?.role === "Owner";

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${id}`);
      if (!res.ok) {
        if (res.status === 403)
          throw new Error("You do not have permission to view this task");
        throw new Error("Task not found");
      }
      const data = await res.json();
      setTask(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRewards = async () => {
    try {
      const res = await fetch(`/api/wallet/tasks/${id}/rewards`);
      if (res.ok) {
        const data = await res.json();
        setRewards(data);
      }
    } catch (err) {
      console.error("Error fetching rewards:", err);
    }
  };

  useEffect(() => {
    fetchTask();
    fetchRewards();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/tasks/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTask((prev) => ({
          ...prev,
          status: updated.status,
          updated_at: updated.updated_at,
        }));

        // If marked Completed and user is owner, prompt to optionally reward team
        if (newStatus === "Completed" && isOwner) {
          setTimeout(() => {
            if (
              window.confirm(
                "Task marked as Completed! Would you like to add a reward for the team members now?",
              )
            ) {
              setRewardModalOpen(true);
            }
          }, 300);
        }
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/tasks/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: newComment.trim() }),
      });
      if (res.ok) {
        const added = await res.json();
        setTask((prev) => ({
          ...prev,
          comments: [...(prev.comments || []), added],
        }));
        setNewComment("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to post comment");
      }
    } catch (err) {
      console.error(err);
      alert("Error posting comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Cancelled":
        return "bg-neutral-100 text-neutral-500 border-neutral-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-muted">{t("common.loading")}</div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-12 text-center">
        <h3 className="text-lg font-bold text-red-600 mb-2">Error</h3>
        <p className="text-sm text-neutral-600 mb-4">
          {error || "Task not found"}
        </p>
        <Link to="/tasks" className="btn text-sm">
          ← {t("task_details.back")}
        </Link>
      </div>
    );
  }

  const canShowCustomerInfo = isOwner || task.show_customer_info;

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

  return (
    <>
      <div className="mb-4">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          ← {t("task_details.back")}
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-neutral-100 text-neutral-800">
              {task.service_type}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                task.status,
              )}`}
            >
              {getStatusText(task.status)}
            </span>
            {task.priority && task.priority !== "Normal" && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  task.priority === "Urgent"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {task.priority} {t("common.priority")}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 m-0">
            {canShowCustomerInfo && task.customer_name
              ? `${task.service_type} - ${task.customer_name}`
              : `${task.service_type} Task`}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Created by {task.created_by_username || "Owner"} · Last updated{" "}
            {formatDate(task.updated_at, true)}
          </p>
        </div>

        {/* Status Actions */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-line shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 px-2">
            {t("common.status")}:
          </span>
          {["Pending", "In Progress", "Completed"].map((st) => (
            <button
              key={st}
              type="button"
              disabled={updatingStatus}
              onClick={() => handleStatusChange(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                task.status === st
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {st === "Pending"
                ? t("status.pending")
                : st === "In Progress"
                  ? t("status.in_progress")
                  : t("status.completed")}
            </button>
          ))}
          {isOwner && (
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="ml-2 px-3 py-1 text-xs font-semibold rounded-lg border border-line hover:bg-neutral-50 text-neutral-700 transition-colors cursor-pointer"
            >
              {t("task_details.edit_assignment")}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2 columns: Instructions & Service Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment Instructions Note Card */}
          <div className="bg-white rounded-2xl border border-line p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-neutral-900 m-0">
                {t("task_details.instructions_title")}
              </h3>
              {task.created_by_username && (
                <span className="text-xs text-neutral-400">
                  {t("task_details.assigned_by")} {task.created_by_username}
                </span>
              )}
            </div>

            {task.notes ? (
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/70 text-sm font-mono text-neutral-800 whitespace-pre-line leading-relaxed">
                {task.notes}
              </div>
            ) : (
              <p className="text-sm text-neutral-400 italic">
                {t("tasks.no_instructions")}
              </p>
            )}
          </div>

          {/* Service Information Card - Matching Individual Booking */}
          <div className="bg-white rounded-2xl border border-line p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-line pb-3">
              <h3 className="text-base font-bold text-neutral-900 m-0">
                {t("task_details.service_info")}
              </h3>
              {isOwner && (
                <Link
                  to={`/bookings/${task.booking_id}`}
                  className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:underline"
                >
                  {t("task_details.view_booking")} →
                </Link>
              )}
            </div>

            {/* Customer Details (If Visible) */}
            {canShowCustomerInfo && task.customer_name && (
              <div className="mb-4 pb-4 border-b border-line flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-muted uppercase tracking-wider mb-1">
                    {t("task_details.customer")}
                  </div>
                  <div className="font-bold text-neutral-900 text-base">
                    {task.customer_name}
                  </div>
                  {task.customer_phone && (
                    <a
                      href={`tel:${task.customer_phone}`}
                      className="text-xs text-neutral-600 hover:text-neutral-900 hover:underline inline-block mt-0.5"
                    >
                      Tel: {task.customer_phone}
                    </a>
                  )}
                </div>
                {isOwner && (
                  <span
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-md border ${
                      task.show_customer_info
                        ? "bg-neutral-100 text-neutral-800 border-neutral-300"
                        : "bg-neutral-50 text-neutral-500 border-neutral-200"
                    }`}
                  >
                    {task.show_customer_info
                      ? "Customer info visible to team"
                      : "Customer info hidden from team"}
                  </span>
                )}
              </div>
            )}

            {/* Service Details Grid - Exactly as in Individual Booking */}
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <div className="text-xs text-muted uppercase tracking-wider mb-1">
                  {t("task_details.service_type")}
                </div>
                <div className="font-medium">{task.service_type}</div>
              </div>

              <div>
                <div className="text-xs text-muted uppercase tracking-wider mb-1">
                  {t("tasks.package")}
                </div>
                <div className="font-medium">{task.package || "None"}</div>
              </div>

              <div>
                <div className="text-xs text-muted uppercase tracking-wider mb-1">
                  {t("task_details.start_time")}
                </div>
                <div className="font-medium">
                  {task.start_time
                    ? formatDate(task.start_time, true)
                    : "Not specified"}
                </div>
              </div>

              <div>
                <div className="text-xs text-muted uppercase tracking-wider mb-1">
                  {t("task_details.duration")}
                </div>
                <div className="font-medium">
                  {task.end_time
                    ? `${formatDuration(task.start_time, task.end_time)} (Ends ${formatDate(task.end_time, true)})`
                    : "Not specified"}
                </div>
              </div>

              <div>
                <div className="text-xs text-muted uppercase tracking-wider mb-1">
                  {t("task_details.quantity")}
                </div>
                <div className="font-medium">{task.quantity || 1}</div>
              </div>

              <div>
                <div className="text-xs text-muted uppercase tracking-wider mb-1">
                  {t("tasks.due_date")}
                </div>
                <div className="font-medium text-text">
                  {task.due_date ? formatDate(task.due_date) : "Not specified"}
                </div>
              </div>

              <div className="col-span-2 mt-2">
                <div className="text-xs text-muted uppercase tracking-wider mb-1">
                  {t("task_details.booking_notes")}
                </div>
                <div className="text-sm bg-neutral-50 p-3 rounded-lg border border-neutral-100 min-h-[60px]">
                  {task.booking_notes || (
                    <span className="text-neutral-400 italic">
                      No notes provided.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Updates & Comments */}
          <div className="bg-white rounded-2xl border border-line p-6 shadow-xs">
            <h3 className="text-base font-bold text-neutral-900 mb-4 m-0">
              {t("task_details.activity_title")}
            </h3>

            {/* Comments List */}
            <div className="space-y-3 mb-5 max-h-72 overflow-y-auto">
              {!task.comments || task.comments.length === 0 ? (
                <p className="text-xs text-neutral-400 italic">
                  {t("task_details.no_activity")}
                </p>
              ) : (
                task.comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 bg-neutral-50/70 rounded-xl border border-neutral-200/60"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center bg-neutral-800">
                          {c.username.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-neutral-800">
                          {c.username}
                        </span>
                        {c.position && (
                          <span className="text-[10px] text-neutral-500">
                            ({c.position})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        {formatDate(c.created_at, true)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700 whitespace-pre-wrap m-0 pl-7">
                      {c.comment}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                className="input-field text-xs flex-1"
                placeholder={t("task_details.post_placeholder")}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="btn text-xs !py-2 !px-4 disabled:opacity-50 cursor-pointer"
              >
                {submittingComment ? "Posting..." : t("task_details.post_update")}
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Assigned Team Members & Meta */}
        <div className="space-y-6">
          {/* Assigned Team Members Card */}
          <div className="bg-white rounded-2xl border border-line p-6 shadow-xs">
            <h3 className="text-base font-bold text-neutral-900 mb-4 m-0">
              {t("task_details.assigned_team")}
            </h3>

            <div className="space-y-3">
              {!task.assignees || task.assignees.length === 0 ? (
                <p className="text-xs text-neutral-400 italic">
                  {t("task_details.no_assignees")}
                </p>
              ) : (
                task.assignees.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 bg-neutral-800">
                        {a.username.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">
                          {a.username}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {a.position || a.role}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800">
                      Assigned
                    </span>
                  </div>
                ))
              )}
            </div>

            {isOwner && (
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="w-full mt-4 py-2 text-xs font-semibold rounded-xl border border-line bg-white hover:bg-neutral-50 text-neutral-800 transition-colors cursor-pointer"
              >
                {t("task_details.manage_assignees")}
              </button>
            )}
          </div>

          {/* Task Rewards Card */}
          <div className="bg-white rounded-2xl border border-line p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-neutral-900 m-0">
                {t("task_details.rewards_title")}
              </h3>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setRewardModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs"
                >
                  {t("task_details.add_reward")}
                </button>
              )}
            </div>

            {rewards.length === 0 ? (
              <p className="text-xs text-neutral-400 italic m-0">
                {t("task_details.no_rewards")}
              </p>
            ) : (
              <div className="space-y-2">
                {rewards.map((rw) => (
                  <div
                    key={rw.id}
                    className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                        <span>{rw.member_username}</span>
                        <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {rw.type === "Reward" ? t("wallet.type_reward") : rw.type}
                        </span>
                      </div>
                      {rw.notes && (
                        <div className="text-[11px] text-neutral-500 truncate max-w-[170px]">
                          {rw.notes}
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-emerald-700 text-right">
                      + {money(parseFloat(rw.amount))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reassign / Edit Assignment Modal */}
      {isOwner && (
        <AssignTaskModal
          booking={{
            id: task.booking_id,
            customer_name: task.customer_name,
            service_type: task.service_type,
            due_date: task.due_date,
            task_id: task.id,
            task_notes: task.notes,
            task_priority: task.priority,
            task_show_customer_info: task.show_customer_info,
            assignees: task.assignees,
          }}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSaved={fetchTask}
        />
      )}

      {/* Reward Per Diem & Tips Modal */}
      {isOwner && (
        <RewardModal
          isOpen={rewardModalOpen}
          onClose={() => setRewardModalOpen(false)}
          onSuccess={() => {
            fetchRewards();
            fetchTask();
          }}
          preselectedTaskId={task.id}
          defaultTaskTitle={`${task.service_type} - ${task.customer_name || "Task"}`}
        />
      )}
    </>
  );
}

export default TaskDetails;
