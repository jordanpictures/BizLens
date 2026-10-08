import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Bookings from "./pages/Bookings";
import BookingDetails from "./pages/BookingDetails";
import NewBooking from "./pages/NewBooking";
import Payments from "./pages/Payments";
import RecordPayment from "./pages/RecordPayment";
import Expenses from "./pages/Expenses";
import AddExpense from "./pages/AddExpense";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Tasks from "./pages/Tasks";
import TaskDetails from "./pages/TaskDetails";
import Wallet from "./pages/Wallet";

// Helper to protect Owner-only routes
function OwnerRoute({ children }) {
  const { user } = useContext(AuthContext);
  if (user?.role !== "Owner") return <Navigate to="/" replace />;
  return children;
}

// Helper to prevent Team Members from viewing non-task pages
function NonTeamMemberRoute({ children }) {
  const { user } = useContext(AuthContext);
  if (user?.role === "Team Member") return <Navigate to="/tasks" replace />;
  return children;
}

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  if (!user) {
    return <Login />;
  }

  const isTeamMember = user?.role === "Team Member";

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={
              isTeamMember ? <Navigate to="/tasks" replace /> : <Overview />
            }
          />
          <Route
            path="bookings"
            element={
              <NonTeamMemberRoute>
                <Bookings />
              </NonTeamMemberRoute>
            }
          />
          <Route
            path="bookings/:id"
            element={
              <NonTeamMemberRoute>
                <BookingDetails />
              </NonTeamMemberRoute>
            }
          />
          <Route
            path="new-booking"
            element={
              <NonTeamMemberRoute>
                <NewBooking />
              </NonTeamMemberRoute>
            }
          />
          <Route
            path="payments"
            element={
              <NonTeamMemberRoute>
                <Payments />
              </NonTeamMemberRoute>
            }
          />
          <Route
            path="record-payment"
            element={
              <NonTeamMemberRoute>
                <RecordPayment />
              </NonTeamMemberRoute>
            }
          />
          <Route
            path="expenses"
            element={
              <NonTeamMemberRoute>
                <Expenses />
              </NonTeamMemberRoute>
            }
          />
          <Route
            path="add-expense"
            element={
              <NonTeamMemberRoute>
                <AddExpense />
              </NonTeamMemberRoute>
            }
          />
          <Route
            path="reports"
            element={
              <NonTeamMemberRoute>
                <Reports />
              </NonTeamMemberRoute>
            }
          />

          {/* Tasks & Wallet Routes (Accessible to Team Members, Owners, and Receptionists) */}
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/:id" element={<TaskDetails />} />
          <Route path="wallet" element={<Wallet />} />

          {/* Owner Only Routes */}
          <Route
            path="settings"
            element={
              <OwnerRoute>
                <Settings />
              </OwnerRoute>
            }
          />
          <Route
            path="users"
            element={
              <OwnerRoute>
                <Users />
              </OwnerRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route
            path="*"
            element={<Navigate to={isTeamMember ? "/tasks" : "/"} replace />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
