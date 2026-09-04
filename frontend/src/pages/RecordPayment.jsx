import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { money } from '../utils/format';

function RecordPayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get('booking');
  
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({
    booking_id: bookingIdParam || '',
    amount: '',
    payment_method: 'Cash',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        // Filter out fully paid bookings so we only show those with a due amount (optional improvement)
        const dueBookings = data.filter(b => (parseFloat(b.agreed_price) - parseFloat(b.paid_amount)) > 0);
        setBookings(dueBookings);
        
        // Auto-select logic
        if (!formData.booking_id && dueBookings.length > 0) {
          setFormData(prev => ({ ...prev, booking_id: dueBookings[0].id }));
        }
      });
  }, []);
  
  // Update amount if booking changes to auto-fill remaining due
  useEffect(() => {
    if (formData.booking_id) {
      const selected = bookings.find(b => b.id === formData.booking_id);
      if (selected) {
        const due = parseFloat(selected.agreed_price) - parseFloat(selected.paid_amount);
        setFormData(prev => ({ ...prev, amount: due > 0 ? due : '' }));
      }
    }
  }, [formData.booking_id, bookings]);

  const handleCancel = (e) => {
    e.preventDefault();
    navigate('/payments');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        navigate('/bookings');
      } else {
        alert('Failed to save payment.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving payment.');
    }
  };

  return (
    <>
      <PageHeader title="Record payment" sub="Add income to a booking" />
      
      <div className="card-panel p-6 md:p-8 max-w-2xl">
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSave}>
          <div className="md:col-span-2">
            <label className="block text-muted text-sm font-medium mb-2">Booking (Showing only those with balance due)</label>
            <select name="booking_id" value={formData.booking_id} onChange={handleChange} className="input-field appearance-none bg-white" required>
              {bookings.length === 0 && <option value="">No bookings with due balance</option>}
              {bookings.map((b) => {
                const due = parseFloat(b.agreed_price) - parseFloat(b.paid_amount);
                return <option key={b.id} value={b.id}>{b.customer_name || 'Walk-in'} — {b.service_type} (Due: {money(due)})</option>
              })}
            </select>
          </div>
          <div>
            <label className="block text-muted text-sm font-medium mb-2">Amount</label>
            <input required type="number" name="amount" value={formData.amount} onChange={handleChange} className="input-field" placeholder="ETB 0" />
          </div>
          <div>
            <label className="block text-muted text-sm font-medium mb-2">Payment method</label>
            <select name="payment_method" value={formData.payment_method} onChange={handleChange} className="input-field appearance-none bg-white">
              <option value="Cash">Cash</option>
              <option value="Transfer">Transfer</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-muted text-sm font-medium mb-2">Date</label>
            <input required type="date" name="date" value={formData.date} onChange={handleChange} className="input-field" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-muted text-sm font-medium mb-2">Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} className="input-field min-h-[100px] resize-y" placeholder="Optional notes"></textarea>
          </div>
          <div className="md:col-span-2 flex gap-3 mt-2">
            <button type="submit" className="btn" disabled={bookings.length === 0}>Save payment</button>
            <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}

export default RecordPayment;
