import { useState, useEffect } from "react";

function RewardModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedTaskId = null,
  preselectedUserId = null,
  defaultTaskTitle = "",
}) {
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [userId, setUserId] = useState(preselectedUserId || "");
  const [taskId, setTaskId] = useState(preselectedTaskId || "");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setUserId(preselectedUserId || "");
    setTaskId(preselectedTaskId || "");
    setAmount("");
    setNotes("");

    // Fetch team members
    fetch("/api/tasks/team-members")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setMembers(data);
        if (!preselectedUserId && data.length > 0) {
          setUserId(data[0].id);
        }
      })
      .catch((err) => console.error("Failed to load members:", err));

    // Fetch recent tasks if not preselected
    if (!preselectedTaskId) {
      fetch("/api/tasks")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setTasks(data))
        .catch((err) => console.error("Failed to load tasks:", err));
    }
  }, [isOpen, preselectedTaskId, preselectedUserId]);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError("Please select a team member");
      return;
    }
    if (parsedAmount <= 0) {
      setError("Please enter a valid reward amount greater than 0");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/wallet/reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          task_id: taskId || null,
          amount: parsedAmount,
          notes: notes.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reward team member");
      }

      const data = await res.json();
      onSuccess && onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-line shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 m-0">
              Reward Team Member
            </h3>
            <p className="text-xs text-neutral-500 m-0 mt-0.5">
              Add a reward or allowance to team member wallet balance
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Member Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Team Member *
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full p-2.5 text-sm bg-white border border-line rounded-xl focus:outline-hidden focus:border-neutral-900 transition-colors"
              required
            >
              <option value="">Select team member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.username} {m.position ? `(${m.position})` : `(${m.role})`}
                </option>
              ))}
            </select>
          </div>

          {/* Task Reference (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Associated Task (Optional)
            </label>
            {preselectedTaskId ? (
              <div className="p-2.5 bg-neutral-50 rounded-xl border border-line text-xs font-medium text-neutral-800">
                {defaultTaskTitle || "Current Task"}
              </div>
            ) : (
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full p-2.5 text-sm bg-white border border-line rounded-xl focus:outline-hidden focus:border-neutral-900 transition-colors"
              >
                <option value="">General / None</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.customer_name
                      ? `${t.service_type} - ${t.customer_name}`
                      : `${t.service_type} Task`}{" "}
                    ({t.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Reward Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Reward Amount (ETB) *
            </label>
            <input
              type="number"
              step="any"
              min="1"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2.5 text-base font-bold bg-white border border-line rounded-xl focus:outline-hidden focus:border-neutral-900 transition-colors"
              required
            />
          </div>

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Note / Nature of Reward
            </label>
            <input
              type="text"
              placeholder="e.g. Shoot allowance, Client tip, Performance bonus"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 text-sm bg-white border border-line rounded-xl focus:outline-hidden focus:border-neutral-900 transition-colors"
            />
          </div>

          {/* Total Preview */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-line flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
              Total Added to Balance:
            </span>
            <span className="text-base font-bold text-neutral-900">
              ETB{" "}
              {parsedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary flex-1 py-2 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || parsedAmount <= 0}
              className="btn flex-1 py-2 text-xs disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Rewarding..." : "Confirm & Reward"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RewardModal;
