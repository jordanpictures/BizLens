import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Bookings from './pages/Bookings';
import BookingDetails from './pages/BookingDetails';
import NewBooking from './pages/NewBooking';
import Payments from './pages/Payments';
import RecordPayment from './pages/RecordPayment';
import Expenses from './pages/Expenses';
import AddExpense from './pages/AddExpense';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';

// Helper to protect Owner-only routes
function OwnerRoute({ children }) {
  const { user } = useContext(AuthContext);
  if (user?.role !== 'Owner') return <Navigate to="/" replace />;
  return children;
}

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  if (!user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="bookings/:id" element={<BookingDetails />} />
          <Route path="new-booking" element={<NewBooking />} />
          <Route path="payments" element={<Payments />} />
          <Route path="record-payment" element={<RecordPayment />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="add-expense" element={<AddExpense />} />
          <Route path="reports" element={<Reports />} />
          
          {/* Owner Only Routes */}
          <Route path="settings" element={<OwnerRoute><Settings /></OwnerRoute>} />
          <Route path="users" element={<OwnerRoute><Users /></OwnerRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
