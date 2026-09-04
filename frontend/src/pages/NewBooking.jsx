import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";

function NewBooking() {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);

  const formatForInput = (d) => {
    const pad = (n) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const now = new Date();
  const defaultStart = formatForInput(now);
  const defaultEnd = formatForInput(new Date(now.getTime() + 5 * 60000));

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    service_type: "",
    package: [], // array to support multiple
    quantity: 1,
    start_time: defaultStart,
    end_time: defaultEnd,
    agreed_price: "",
    amount_paid: "",
    payment_method: "Cash",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/settings/services")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setServices(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setFormData((prev) => ({ ...prev, service_type: data[0].name }));
        }
      })
      .catch(() => setServices([]));

    fetch("/api/settings/packages")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPackages(Array.isArray(data) ? data : []))
      .catch(() => setPackages([]));
  }, []);

  const handleCancel = (e) => {
    e.preventDefault();
    navigate("/bookings");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => {
        const newPackages = checked
          ? [...prev.package, value]
          : prev.package.filter((p) => p !== value);
        return { ...prev, package: newPackages };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        navigate("/bookings");
      } else {
        alert("Failed to create booking.");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating booking.");
    }
  };

  return (
    <>
      <PageHeader
        title="New booking"
        sub="Create a booking"
       
      />

      <div className="card-panel p-6 md:p-8 max-w-4xl">
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          onSubmit={handleCreate}
        >
          <div>
            <label className="block text-muted text-sm font-medium mb-2">
              Customer name (Optional)
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              className="input-field"
              placeholder="Walk-in customer"
            />
          </div>
          <div>
            <label className="block text-muted text-sm font-medium mb-2">
              Phone (Optional)
            </label>
            <input
              type="tel"
              name="customer_phone"
              value={formData.customer_phone}
              onChange={handleChange}
              className="input-field"
              placeholder="+251 ..."
            />
          </div>
          <div>
            <label className="block text-muted text-sm font-medium mb-2">
              Service type
            </label>
            <select
              name="service_type"
              value={formData.service_type}
              onChange={handleChange}
              className="input-field appearance-none bg-white"
            >
              {services.length === 0 && (
                <option value="">No services configured</option>
              )}
              {services.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-muted text-sm font-medium mb-2">
              Package(s)
            </label>
            <div className="flex flex-wrap gap-3">
              {packages.map((pkg) => (
                <label
                  key={pkg.id}
                  className="flex items-center gap-2 border border-line rounded-lg px-4 py-2.5 bg-white cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    name="package"
                    value={pkg.name}
                    checked={formData.package.includes(pkg.name)}
                    onChange={handleChange}
                    className="w-4 h-4 accent-neutral-900 rounded"
                  />
                  <span className="text-sm">{pkg.name}</span>
                </label>
              ))}
              {packages.length === 0 && (
                <span className="text-sm text-muted">
                  No packages configured. Add them in Settings.
                </span>
              )}
            </div>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-muted text-sm font-medium mb-2">
                Start time
              </label>
              <input
                required
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-muted text-sm font-medium mb-2">
                End time
              </label>
              <input
                required
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-muted text-sm font-medium mb-2">
                Quantity
              </label>
              <input
                required
                type="number"
                name="quantity"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                className="input-field"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-muted text-sm font-medium mb-2">
                Agreed price (Total)
              </label>
              <input
                required
                type="number"
                name="agreed_price"
                value={formData.agreed_price}
                onChange={handleChange}
                className="input-field"
                placeholder="ETB 0"
              />
            </div>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-muted text-sm font-medium mb-2">
                Amount paid (Optional)
              </label>
              <input
                type="number"
                name="amount_paid"
                value={formData.amount_paid}
                onChange={handleChange}
                className="input-field"
                placeholder="ETB 0"
              />
            </div>
            <div>
              <label className="block text-muted text-sm font-medium mb-2">
                Payment method
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="input-field appearance-none bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="Transfer">Transfer</option>
              </select>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-muted text-sm font-medium mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input-field min-h-[100px] resize-y"
              placeholder="Optional notes"
            ></textarea>
          </div>
          <div className="md:col-span-2 flex gap-3 mt-2">
            <button type="submit" className="btn">
              Create booking
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default NewBooking;
