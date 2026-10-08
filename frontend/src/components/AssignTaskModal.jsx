import { useState, useEffect, useRef } from "react";

function AssignTaskModal({ booking, isOpen, onClose, onSaved }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [notes, setNotes] = useState("You are assigned");
  const [priority, setPriority] = useState("Normal");
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !booking) return;

    // Pre-populate with current assignment data or default message
    const existingIds = (booking.assignees || []).map((a) => a.id);
    setSelectedIds(existingIds);
    setNotes(booking.task_notes || "You are assigned");
    setPriority(booking.task_priority || booking.priority || "Normal");
    setShowCustomerInfo(
      Boolean(
        booking.task_show_customer_info ?? booking.show_customer_info ?? false,
      ),
    );
    setSearchQuery("");
    setDropdownOpen(false);

    // Fetch team members
    setLoadingMembers(true);
    fetch("/api/tasks/team-members")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setTeamMembers(data);
        setLoadingMembers(false);
      })
      .catch((err) => {
        console.error("Failed to fetch team members:", err);
        setLoadingMembers(false);
      });
  }, [isOpen, booking]);

  // Click outside listener for the dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  if (!isOpen || !booking) return null;

  const filteredMembers = teamMembers.filter((m) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      m.username.toLowerCase().includes(query) ||
      (m.position && m.position.toLowerCase().includes(query)) ||
      m.role.toLowerCase().includes(query)
    );
  });

  const toggleMember = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const removeMember = (id, e) => {
    e.stopPropagation();
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      return alert("Please select at least one team member to assign.");
    }
    setSaving(true);
    try {
      const res = await fetch("/api/tasks/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          user_ids: selectedIds,
          notes: notes.trim(),
          priority,
          show_customer_info: showCustomerInfo,
        }),
      });

      if (res.ok) {
        const updatedTask = await res.json();
        onSaved && onSaved(updatedTask);
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to assign task");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving assignment");
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    if (!booking.task_id) return;
    if (!confirm("Are you sure you want to unassign this task?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${booking.task_id}/unassign`, {
        method: "DELETE",
      });

      if (res.ok) {
        onSaved && onSaved(null, true);
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to unassign task");
      }
    } catch (err) {
      console.error(err);
      alert("Error unassigning task");
    } finally {
      setSaving(false);
    }
  };

  const selectedObjects = teamMembers.filter((m) => selectedIds.includes(m.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-line flex items-center justify-between bg-neutral-50/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-900"></span>
              <h3 className="text-lg font-bold text-neutral-900 m-0">
                Assign Order / Task
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {booking.service_type} · {booking.customer_name || "Walk-in"}
              {booking.due_date && ` · Due ${booking.due_date}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Team Members Multi-Select */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Assign Team Member(s) *
            </label>

            {/* Selected Chips container & Dropdown trigger */}
            <div
              onClick={() => setDropdownOpen(true)}
              className="min-h-[44px] p-2 bg-white border border-line rounded-xl cursor-pointer hover:border-neutral-400 transition-colors flex flex-wrap items-center gap-1.5"
            >
              {selectedObjects.length === 0 ? (
                <span className="text-sm text-neutral-400 px-2 py-0.5">
                  Click to select team members...
                </span>
              ) : (
                selectedObjects.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-xs bg-neutral-900"
                  >
                    <span>{m.username}</span>
                    {m.position && (
                      <span className="opacity-80 text-[10px]">
                        ({m.position})
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => removeMember(m.id, e)}
                      className="hover:opacity-75 focus:outline-hidden ml-0.5 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden">
                {/* Search box */}
                <div className="p-2 border-b border-line bg-neutral-50/70">
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-line rounded-lg focus:outline-hidden focus:border-neutral-800"
                    placeholder="Search by name or position..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Member list */}
                <div className="max-h-52 overflow-y-auto py-1">
                  {loadingMembers ? (
                    <div className="p-4 text-center text-xs text-neutral-400">
                      Loading team members...
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-neutral-400">
                      No team members found
                    </div>
                  ) : (
                    filteredMembers.map((m) => {
                      const isSelected = selectedIds.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => toggleMember(m.id)}
                          className={`px-3 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-neutral-100 text-neutral-900 font-semibold"
                              : "hover:bg-neutral-50 text-neutral-800"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 bg-neutral-800">
                              {m.username.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <div className="text-sm font-medium">
                                {m.username}
                              </div>
                              <div className="text-xs text-neutral-500">
                                {m.position || m.role}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-neutral-900 font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Customer Info Option Checkbox */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showCustomerInfo}
                onChange={(e) => setShowCustomerInfo(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-neutral-900 block">
                  Show customer info (name and phone number)
                </span>
                <span className="text-[11px] text-neutral-500 block mt-0.5">
                  When checked, assigned team members can see client name and
                  phone number. If unchecked, client info is hidden from them.
                </span>
              </div>
            </label>
          </div>

          {/* Note Section */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Assignment Notes / Instructions
            </label>
            <textarea
              rows={3}
              className="w-full p-3 text-sm bg-white border border-line rounded-xl focus:outline-hidden focus:border-neutral-800 transition-colors"
              placeholder="You are assigned"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Priority
            </label>
            <div className="flex gap-2">
              {["Normal", "High", "Urgent"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    priority === p
                      ? p === "Urgent"
                        ? "bg-red-50 border-red-500 text-red-700"
                        : p === "High"
                          ? "bg-amber-50 border-amber-500 text-amber-700"
                          : "bg-neutral-900 border-neutral-900 text-white"
                      : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-line bg-neutral-50/70 flex items-center justify-between">
          <div>
            {booking.task_id && (
              <button
                type="button"
                onClick={handleUnassign}
                disabled={saving}
                className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Unassign Task
              </button>
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-line bg-white hover:bg-neutral-50 text-neutral-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Assignment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignTaskModal;
