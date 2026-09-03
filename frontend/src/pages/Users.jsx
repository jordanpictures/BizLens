import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("Receptionist");

  // Edit form state
  const [editingId, setEditingId] = useState(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("Receptionist");

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
        }),
      });
      if (res.ok) {
        setNewUsername("");
        setNewPassword("");
        setNewRole("Receptionist");
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
    return <div className="p-8 text-center text-muted">Loading users...</div>;

  return (
    <>
      <PageHeader title="Users" sub="Manage system access and roles" />

      <div className="card-panel p-6 mb-8">
        <h3 className="font-semibold text-lg mb-4">Add New User</h3>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            className="input-field flex-1 min-w-[150px]"
            placeholder="Username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <input
            type="password"
            className="input-field flex-1 min-w-[150px]"
            placeholder="Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <select
            className="input-field appearance-none bg-white min-w-[140px]"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          >
            <option value="Receptionist">Receptionist</option>
            <option value="Owner">Owner</option>
          </select>
          <button className="btn" onClick={handleCreate}>
            Create User
          </button>
        </div>
      </div>

      <div className="card-panel overflow-hidden">
        <div className="px-6 py-5 border-b border-line bg-white">
          <h3 className="text-lg font-semibold m-0">Active Users</h3>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px] divide-y divide-line">
            <div className="grid grid-cols-[1fr_1fr_200px] text-xs uppercase tracking-wider text-muted font-semibold py-3 px-6 bg-neutral-50">
              <div>Username</div>
              <div>Role</div>
              <div className="text-right">Action</div>
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
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                    />
                    <input
                      type="password"
                      className="input-field flex-1 !py-1 min-w-[150px]"
                      placeholder="New Password (or leave blank)"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                    />
                    <select
                      className="input-field !py-1 appearance-none bg-white min-w-[120px]"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                    >
                      <option value="Receptionist">Receptionist</option>
                      <option value="Owner">Owner</option>
                    </select>
                    <div className="flex gap-2">
                      <button className="btn !py-1" onClick={handleUpdate}>
                        Save
                      </button>
                      <button
                        className="btn-secondary !py-1"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="grid grid-cols-[1fr_1fr_200px] items-center">
                    <div className="text-sm font-medium">
                      {u.username}
                      {!u.is_active && (
                        <span className="ml-2 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          Deactivated
                        </span>
                      )}
                    </div>
                    <div>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${u.role === "Owner" ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-700"}`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <div className="text-right flex justify-end gap-3">
                      <button
                        className="text-neutral-500 hover:text-neutral-900 text-sm font-medium transition-colors"
                        onClick={() => startEdit(u)}
                      >
                        Edit
                      </button>
                      <button
                        className={`${u.is_active ? "text-amber-600 hover:text-amber-800" : "text-green-600 hover:text-green-800"} text-sm font-medium transition-colors`}
                        onClick={() => handleToggleActive(u.id, !u.is_active)}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                        onClick={() => handleDelete(u.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {users.length === 0 && (
              <div className="py-6 text-muted text-sm text-center">
                No users found.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Users;
