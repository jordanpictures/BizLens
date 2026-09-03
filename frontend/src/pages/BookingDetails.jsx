import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { money, formatDate, formatDuration } from '../utils/format';

function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bookings/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setBooking(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-8 text-center text-muted">Loading booking details...</div>;
  if (!booking) return <div className="p-8 text-center text-red-600">Booking not found.</div>;

  const total = parseFloat(booking.agreed_price) || 0;
  const paid = parseFloat(booking.paid_amount) || 0;
  const due = Math.max(0, total - paid);

  return (
    <>
      <div className="mb-4">
        <Link to="/bookings" className="text-sm text-neutral-500 hover:text-text hover:underline flex items-center gap-1">
          ← Back to Bookings
        </Link>
      </div>
      <PageHeader title="Booking Details" sub={`ID: ${booking.id}`} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card-panel p-6 col-span-1 md:col-span-2">
          <h3 className="text-lg font-semibold mb-4 border-b border-line pb-3">Service Information</h3>
          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-1">Service Type</div>
              <div className="font-medium">{booking.service_type}</div>
            </div>
            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-1">Package(s)</div>
              <div className="font-medium">{booking.package || 'None'}</div>
            </div>
            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-1">Start Time</div>
              <div className="font-medium">{formatDate(booking.start_time, true)}</div>
            </div>
            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-1">Duration / End Time</div>
              <div className="font-medium">
                {booking.end_time ? (
                  `${formatDuration(booking.start_time, booking.end_time)} (Ends ${formatDate(booking.end_time, true)})`
                ) : (
                  'Not specified'
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-1">Quantity</div>
              <div className="font-medium">{booking.quantity}</div>
            </div>
            <div className="col-span-2 mt-2">
              <div className="text-xs text-muted uppercase tracking-wider mb-1">Notes</div>
              <div className="text-sm bg-neutral-50 p-3 rounded-lg border border-neutral-100 min-h-[60px]">
                {booking.notes || <span className="text-neutral-400 italic">No notes provided.</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="card-panel p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-4 border-b border-line pb-3">Customer & Financials</h3>
          <div className="mb-6">
            <div className="text-xs text-muted uppercase tracking-wider mb-1">Customer</div>
            <div className="font-semibold text-lg">{booking.customer_name || 'Walk-in Customer'}</div>
            {booking.customer_phone && <div className="text-sm text-muted">{booking.customer_phone}</div>}
          </div>
          
          <div className="flex-1"></div>
          
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted text-sm">Total Agreed</span>
              <span className="font-medium">{money(total)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted text-sm">Total Paid</span>
              <span className="font-medium text-green-700">{money(paid)}</span>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-200">
              <span className="font-semibold text-sm">Balance Due</span>
              <span className={`font-bold ${due > 0 ? 'text-red-600' : 'text-neutral-500'}`}>{money(due)}</span>
            </div>
          </div>
          
          {due > 0 && (
            <button className="btn mt-4 w-full" onClick={() => navigate(`/record-payment?booking=${booking.id}`)}>
              Record Payment
            </button>
          )}
        </div>
      </div>

      <div className="card-panel overflow-hidden">
        <div className="px-6 py-5 border-b border-line flex justify-between items-center bg-white">
          <h3 className="text-lg font-semibold m-0">Payment History</h3>
        </div>
        
        {booking.payments && booking.payments.length > 0 ? (
          <div className="divide-y divide-line">
            <div className="grid grid-cols-[1fr_1fr_1fr_2fr] items-center text-muted text-xs uppercase tracking-wider font-semibold py-3 px-6 bg-neutral-50">
              <div>Date</div>
              <div>Amount</div>
              <div>Method</div>
              <div>Notes</div>
            </div>
            {booking.payments.map(p => (
              <div key={p.id} className="grid grid-cols-[1fr_1fr_1fr_2fr] items-center py-4 px-6 hover:bg-neutral-50 transition-colors text-sm">
                <div className="text-muted">{formatDate(p.date)}</div>
                <div className="font-semibold text-green-700">{money(parseFloat(p.amount))}</div>
                <div><span className="inline-block bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full text-xs font-medium">{p.payment_method}</span></div>
                <div className="text-muted truncate">{p.notes || '-'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted">No payments recorded for this booking yet.</div>
        )}
      </div>
    </>
  );
}

export default BookingDetails;
