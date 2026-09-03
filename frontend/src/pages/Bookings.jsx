import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { money, formatDate, formatDuration } from '../utils/format';

function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination State
  const [period, setPeriod] = useState('all'); // all, day, week, month, year
  const [serviceFilter, setServiceFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        setBookings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching bookings:', err);
        setLoading(false);
      });

    fetch('/api/settings/services')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setServices(Array.isArray(data) ? data.map(s => s.name).sort() : []);
      })
      .catch(() => setServices([]));
  }, []);

  // Filter Logic
  const filteredBookings = useMemo(() => {
    let result = [...bookings];
    const now = new Date();
    
    // 1. Search Filter (Customer name, phone, service)
    if (search.trim()) {
      const q = search.toLowerCase().replace(/\s+/g, '');
      result = result.filter(b => {
        const name = (b.customer_name || '').toLowerCase().replace(/\s+/g, '');
        const phone = (b.customer_phone || '').toLowerCase().replace(/[\s\-+()]/g, '');
        const service = (b.service_type || '').toLowerCase().replace(/\s+/g, '');
        return name.includes(q) || phone.includes(q) || service.includes(q);
      });
    }

    // 2. Service Filter
    if (serviceFilter !== 'all') {
      result = result.filter(b => b.service_type === serviceFilter);
    }

    // 3. Period Filter (Today, This Week, This Month, This Year)
    if (period !== 'all') {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentDate = now.getDate();
      const currentWeekStart = new Date(now.setDate(now.getDate() - now.getDay())).setHours(0,0,0,0);

      result = result.filter(b => {
        const bDate = new Date(b.start_time);
        if (period === 'day') return bDate.getFullYear() === currentYear && bDate.getMonth() === currentMonth && bDate.getDate() === currentDate;
        if (period === 'year') return bDate.getFullYear() === currentYear;
        if (period === 'month') return bDate.getFullYear() === currentYear && bDate.getMonth() === currentMonth;
        if (period === 'week') return bDate.getTime() >= currentWeekStart && bDate.getTime() < currentWeekStart + 7 * 24 * 60 * 60 * 1000;
        return true;
      });
    }

    return result;
  }, [bookings, search, period, serviceFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [search, period, serviceFilter]);

  return (
    <>
      <PageHeader title="Bookings" sub="Manage appointments and payments" rightText="Admin" />
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        
        {/* Actions & Filters */}
        <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto flex-1 lg:justify-end">
          <input 
            type="text" 
            placeholder="Search name or phone..." 
            className="input-field !py-2 w-full md:w-48 lg:w-64 shrink-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2 w-full md:w-auto shrink-0">
            <select 
              className="input-field !py-2 appearance-none bg-white w-1/2 md:w-36 lg:w-40"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            >
              <option value="all">All Services</option>
              {services.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select 
              className="input-field !py-2 appearance-none bg-white w-1/2 md:w-36 lg:w-40"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="all">Any time</option>
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
        
        <button className="btn !py-2 shrink-0 w-full lg:w-auto" onClick={() => navigate('/new-booking')}>
          + New booking
        </button>
      </div>
      
      <div className="card-panel overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-[1.2fr_1.5fr_1.2fr_0.8fr_0.8fr_0.8fr_120px] items-center text-muted text-xs uppercase tracking-wider font-semibold py-3 px-5 border-b border-line bg-neutral-50">
          <div className="hidden lg:block">Time</div>
          <div>Customer</div>
          <div className="hidden lg:block">Service</div>
          <div className="hidden lg:block">Total</div>
          <div className="hidden lg:block">Paid</div>
          <div className="hidden lg:block">Due</div>
          <div className="text-right">Action</div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-muted">Loading bookings...</div>
        ) : paginatedBookings.length === 0 ? (
          <div className="p-8 text-center text-muted">No bookings found matching filters.</div>
        ) : (
          paginatedBookings.map((b) => {
            const total = parseFloat(b.agreed_price) || 0;
            const paid = parseFloat(b.paid_amount) || 0;
            const due = Math.max(0, total - paid);
            
            return (
              <div className="grid grid-cols-2 lg:grid-cols-[1.2fr_1.5fr_1.2fr_0.8fr_0.8fr_0.8fr_120px] items-center py-4 px-5 border-b border-line last:border-0 hover:bg-neutral-50 transition-colors" key={b.id}>
                
                {/* Date & Time */}
                <div className="text-sm hidden lg:block text-muted pr-2">
                  <div className="font-medium text-neutral-800">{formatDate(b.start_time, true)}</div>
                  {b.end_time && <div className="text-xs mt-0.5">{formatDuration(b.start_time, b.end_time)}</div>}
                </div>

                {/* Customer */}
                <div className="col-span-2 lg:col-span-1 mb-2 lg:mb-0">
                  <b className="text-text text-base">
                    <Link to={`/bookings/${b.id}`} className="hover:underline">{b.customer_name || 'Walk-in Customer'}</Link>
                  </b>
                  {b.customer_phone && <div className="text-muted text-sm">{b.customer_phone}</div>}
                  <div className="lg:hidden text-muted text-xs mt-1">
                    {formatDate(b.start_time, true)} 
                    {b.end_time && ` (${formatDuration(b.start_time, b.end_time)})`}
                  </div>
                </div>
                
                {/* Service */}
                <div className="text-sm hidden lg:block">
                  <div className="font-medium text-text">{b.service_type}</div>
                  <div className="text-muted text-xs mt-0.5">{b.package} × {b.quantity}</div>
                </div>
                
                {/* Total */}
                <div className="text-sm hidden lg:block font-medium">
                  {money(total)}
                </div>
                
                {/* Paid */}
                <div className="text-sm hidden lg:block font-medium text-green-700">
                  {money(paid)}
                </div>
                
                {/* Due */}
                <div className="text-sm hidden lg:block font-bold">
                  <span className={due > 0 ? "text-red-600" : "text-neutral-400"}>
                    {money(due)}
                  </span>
                </div>
                
                {/* Action */}
                <div className="text-right mt-2 lg:mt-0 flex justify-end gap-2">
                  <button className="btn-secondary !py-1.5 !px-3 !text-xs !bg-neutral-100 hover:!bg-neutral-200" onClick={() => navigate(`/bookings/${b.id}`)}>View</button>
                  {due > 0 && (
                    <button className="btn !py-1.5 !px-3 !text-xs" onClick={() => navigate(`/record-payment?booking=${b.id}`)}>+ Pay</button>
                  )}
                </div>
                
              </div>
            );
          })
        )}
        
        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="px-5 py-4 border-t border-line flex justify-between items-center bg-white">
            <div className="text-sm text-muted">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length}
            </div>
            <div className="flex gap-1">
              <button 
                className="px-3 py-1 text-sm border border-line rounded disabled:opacity-50 hover:bg-neutral-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >Prev</button>
              <button 
                className="px-3 py-1 text-sm border border-line rounded disabled:opacity-50 hover:bg-neutral-50"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Bookings;
