import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader";
import { money } from "../utils/format";

function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("Receptionist");
  const [newPosition, setNewPosition] = useState("");
  const [newSalary, setNewSalary] = useState("");

  // Edit form state
  const [editingId, setEditingId] = useState(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("Receptionist");
  const [editPosition, setEditPosition] = useState("");
  const [editSalary, setEditSalary] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/settings/users");
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newUsername || !newPassword)
      return alert("Username and Password required");
    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
          position: newPosition.trim() || null,
          salary: newSalary !== "" ? parseFloat(newSalary) : null,
        }),
      });
      if (res.ok) {
        setNewUsername("");
        setNewPassword("");
        setNewRole("Receptionist");
        setNewPosition("");
        setNewSalary("");
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create user");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditUsername(u.username);
    setEditRole(u.role);
    setEditPosition(u.position || "");
    setEditSalary(u.salary !== null && u.salary !== undefined ? u.salary : "");
    setEditPassword(""); // leave blank unless changing
  };

  const handleUpdate = async () => {
    if (!editUsername) return alert("Username required");
    try {
      const res = await fetch(`/api/settings/users/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editUsername,
          password: editPassword,
          role: editRole,
          position: editPosition.trim() || null,
          salary: editSalary !== "" ? parseFloat(editSalary) : null,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update user");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/settings/users/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (id, is_active) => {
    const action = is_active ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${action} this account?`)) return;
    try {
      const res = await fetch(`/api/settings/users/${id}/toggle-active`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || `Failed to ${action} account`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return <div className="p-8 text-center text-muted">{t("users.loading")}</div>;

  return (
    <>
      <PageHeader title={t("users.title")} sub={t("users.sub")} />

      <div className="card-panel p-6 mb-8">
        <h3 className="font-semibold text-lg mb-4">{t("users.add_title")}</h3>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            className="input-field flex-1 min-w-[140px]"
            placeholder={t("users.username_ph")}
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <input
            type="password"
            className="input-field flex-1 min-w-[140px]"
            placeholder={t("users.password_ph")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <select
            className="input-field appearance-none bg-white min-w-[140px]"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          >
            <option value="Receptionist">{t("role.receptionist")}</option>
            <option value="Team Member">{t("role.team_member")}</option>
            <option value="Owner">{t("role.owner")}</option>
          </select>
          <input
            type="text"
            className="input-field flex-1 min-w-[140px]"
            placeholder={t("users.position_ph")}
            value={newPosition}
            onChange={(e) => setNewPosition(e.target.value)}
          />
          <input
            type="number"
            step="any"
            className="input-field w-[130px]"
            placeholder={t("users.salary_ph")}
            value={newSalary}
            onChange={(e) => setNewSalary(e.target.value)}
          />
          <button className="btn" onClick={handleCreate}>
            {t("users.create_btn")}
          </button>
        </div>
      </div>

      <div className="card-panel overflow-hidden">
        <div className="px-6 py-5 border-b border-line bg-white">
          <h3 className="text-lg font-semibold m-0">{t("users.active_title")}</h3>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px] divide-y divide-line">
            <div className="grid grid-cols-[1.2fr_1fr_1.2fr_1fr_200px] text-xs uppercase tracking-wider text-muted font-semibold py-3 px-6 bg-neutral-50">
              <div>{t("users.col_username")}</div>
              <div>{t("users.col_role")}</div>
              <div>{t("users.col_position")}</div>
              <div>{t("users.col_salary")}</div>
              <div className="text-right">{t("users.col_action")}</div>
            </div>

            {users.map((u) => (
              <div
                key={u.id}
                className="py-4 px-6 hover:bg-neutral-50 transition-colors"
              >
                {editingId === u.id ? (
                  // Edit Mode
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      className="input-field flex-1 !py-1 min-w-[120px]"
                      placeholder={t("users.username_ph")}
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                    />
                    <input
                      type="password"
                      className="input-field flex-1 !py-1 min-w-[130px]"
                      placeholder={t("users.new_password_ph")}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                    />
                    <select
                      className="input-field !py-1 appearance-none bg-white min-w-[130px]"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                    >
                      <option value="Receptionist">{t("role.receptionist")}</option>
                      <option value="Team Member">{t("role.team_member")}</option>
                      <option value="Owner">{t("role.owner")}</option>
                    </select>
                    <input
                      type="text"
                      className="input-field flex-1 !py-1 min-w-[120px]"
                      placeholder={t("users.position_ph")}
                      value={editPosition}
                      onChange={(e) => setEditPosition(e.target.value)}
                    />
                    <input
                      type="number"
                      step="any"
                      className="input-field !py-1 w-[120px]"
                      placeholder={t("users.salary_ph")}
                      value={editSalary}
                      onChange={(e) => setEditSalary(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button className="btn !py-1" onClick={handleUpdate}>
                        {t("users.save")}
                      </button>
                      <button
                        className="btn-secondary !py-1"
                        onClick={() => setEditingId(null)}
                      >
                        {t("users.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="grid grid-cols-[1.2fr_1fr_1.2fr_1fr_200px] items-center">
                    <div className="text-sm font-medium">
                      {u.username}
                      {!u.is_active && (
                        <span className="ml-2 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          {t("users.deactivated_badge")}
                        </span>
                      )}
                    </div>
                    <div>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.role === "Owner"
                            ? "bg-neutral-800 text-white"
                            : u.role === "Team Member"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {u.role === "Owner"
                          ? t("role.owner")
                          : u.role === "Team Member"
                            ? t("role.team_member")
                            : t("role.receptionist")}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-600">
                      {u.position || "—"}
                    </div>
                    <div className="text-sm font-medium text-neutral-800">
                      {u.salary != null && !isNaN(parseFloat(u.salary))
                        ? money(parseFloat(u.salary))
                        : "—"}
                    </div>
                    <div className="text-right flex justify-end gap-3">
                      <button
                        className="text-neutral-500 hover:text-neutral-900 text-sm font-medium transition-colors"
                        onClick={() => startEdit(u)}
                      >
                        {t("users.edit")}
                      </button>
                      <button
                        className={`${
                          u.is_active
                            ? "text-amber-600 hover:text-amber-800"
                            : "text-green-600 hover:text-green-800"
                        } text-sm font-medium transition-colors`}
                        onClick={() => handleToggleActive(u.id, !u.is_active)}
                      >
                        {u.is_active ? t("users.deactivate") : t("users.activate")}
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                        onClick={() => handleDelete(u.id)}
                      >
                        {t("users.remove")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {users.length === 0 && (
              <div className="py-6 text-muted text-sm text-center">
                {t("users.no_users")}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Users;
