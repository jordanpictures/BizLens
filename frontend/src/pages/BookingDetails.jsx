import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader";
import { money, formatDate, formatDuration } from "../utils/format";

const pad = (n) => n.toString().padStart(2, "0");

const toDateTimeLocal = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toDateInput = (dateStr) => {
  if (!dateStr) return "";
  if (
    typeof dateStr === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())
  ) {
    return dateStr.trim();
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function BookingDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Service Information State
  const [isEditingService, setIsEditingService] = useState(false);
  const [services, setServices] = useState([]);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [serviceForm, setServiceForm] = useState({
    service_type: "",
    package: [],
    quantity: 1,
    start_time: "",
    end_time: "",
    due_date: "",
    notes: "",
  });
  const [savingService, setSavingService] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [serviceSuccess, setServiceSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setBooking(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    fetch("/api/settings/services")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => setServices([]));

    fetch("/api/settings/packages")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAvailablePackages(Array.isArray(data) ? data : []))
      .catch(() => setAvailablePackages([]));
  }, [id]);

  const handleStartEdit = () => {
    if (!booking) return;
    const currentPackages = booking.package
      ? booking.package
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
      : [];

    setServiceForm({
      service_type: booking.service_type || "",
      package: currentPackages,
      quantity: booking.quantity || 1,
      start_time: toDateTimeLocal(booking.start_time),
      end_time: toDateTimeLocal(booking.end_time),
      due_date: toDateInput(booking.due_date),
      notes: booking.notes || "",
    });
    setServiceError("");
    setIsEditingService(true);
  };

  const handleCancelEdit = () => {
    setIsEditingService(false);
    setServiceError("");
  };

  const handleServiceChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "package") {
      setServiceForm((prev) => {
        const next = checked
          ? [...prev.package, value]
          : prev.package.filter((item) => item !== value);
        return { ...prev, package: next };
      });
    } else {
      setServiceForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveService = async (e) => {
    if (e) e.preventDefault();
    setSavingService(true);
    setServiceError("");
    try {
      const payload = {
        service_type: serviceForm.service_type,
        package: serviceForm.package.join(", "),
        quantity: parseInt(serviceForm.quantity, 10) || 1,
        start_time: serviceForm.start_time,
        end_time: serviceForm.end_time || null,
        due_date: serviceForm.due_date || null,
        notes: serviceForm.notes || null,
      };

      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update service information");
      }

      const updated = await res.json();
      setBooking((prev) => ({
        ...prev,
        ...updated,
      }));
      setIsEditingService(false);
      setServiceSuccess(true);
      setTimeout(() => setServiceSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setServiceError(err.message || "Failed to update service information");
    } finally {
      setSavingService(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-muted">
        Loading booking details...
      </div>
    );
  if (!booking)
    return (
      <div className="p-8 text-center text-red-600">Booking not found.</div>
    );

  const total = parseFloat(booking.agreed_price) || 0;
  const paid = parseFloat(booking.paid_amount) || 0;
  const due = Math.max(0, total - paid);

  return (
    <>
      <div className="mb-4">
        <Link
          to="/bookings"
          className="text-sm text-neutral-500 hover:text-text hover:underline flex items-center gap-1"
        >
          ← {t("booking_details.back")}
        </Link>
      </div>
      <PageHeader title={t("booking_details.title")} sub={`ID: ${booking.id}`} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Service Information Card */}
        <div className="card-panel p-6 col-span-1 md:col-span-2">
          <div className="flex justify-between items-center mb-4 border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold m-0">{t("booking_details.service_info")}</h3>
              {serviceSuccess && (
                <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  {t("booking_details.saved")}
                </span>
              )}
            </div>
            {!isEditingService ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors cursor-pointer"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                {t("booking_details.edit")}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={savingService}
                  className="px-3 py-1 text-xs font-medium rounded-lg border border-neutral-300 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {t("booking_details.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSaveService}
                  disabled={savingService}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingService ? t("booking_details.saving") : t("booking_details.save")}
                </button>
              </div>
            )}
          </div>

          {serviceError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {serviceError}
            </div>
          )}

          {!isEditingService ? (
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <div className="text-xs text-muted uppercase tracking-wider mb-1">
                  {t("booking_details.service_type")}
                </div>
                <div className="font-medium">{booking.service_type}</div>
              </div>
              <div>
                <div className="text-xs text-muted uppercase tracking-wider mb-1">
                  {t("booking_details.packages")}
                </div>
                <div className="font-medium">{booking.package || t("booking_details.none")}</div>
              </div>
              <div>
                <div className="text-xs text-muted uppercase tracking-wider mb-1">
                  {t("booking_details.start_time")}
                </div>
                <div className="font-medium">
                  {formatDate(booking.start_time, true)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted uppercase tracking-wider mb-1">
                  {t("booking_details.duration_end")}
                </div>
                <div className="font-medium">
                  {booking.end_time
                    ? `${formatDuration(booking.start_time, booking.end_time)} (${t("booking_details.ends")} ${formatDate(booking.end_time, true)})`
                    : t("booking_details.not_specified")}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted uppercase tracking-wider mb-1">
                  {t("booking_details.quantity")}
                </div>
                <div className="font-medium">{booking.quantity}</div>
              </div>
              <div>
                <div className="text-xs text-muted uppercase tracking-wider mb-1">
                  {t("booking_details.due_date")}
                </div>
                <div className="font-medium text-text">
                  {booking.due_date
                    ? formatDate(booking.due_date)
                    : t("booking_details.not_specified")}
                </div>
              </div>
              <div className="col-span-2 mt-2">
                <div className="text-xs text-muted uppercase tracking-wider mb-1">
                  {t("booking_details.notes")}
                </div>
                <div className="text-sm bg-neutral-50 p-3 rounded-lg border border-neutral-100 min-h-[60px]">
                  {booking.notes || (
                    <span className="text-neutral-400 italic">
                      {t("booking_details.no_notes")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveService} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wider mb-1 font-medium">
                    {t("booking_details.service_type")} *
                  </label>
                  <select
                    name="service_type"
                    value={serviceForm.service_type}
                    onChange={handleServiceChange}
                    required
                    className="input-field appearance-none bg-white text-sm"
                  >
                    {serviceForm.service_type &&
                      !services.some(
                        (s) => s.name === serviceForm.service_type,
                      ) && (
                        <option value={serviceForm.service_type}>
                          {serviceForm.service_type}
                        </option>
                      )}
                    {services.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    {services.length === 0 && !serviceForm.service_type && (
                      <option value="">{t("settings.no_services")}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-muted uppercase tracking-wider mb-1 font-medium">
                    {t("booking_details.quantity")} *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    required
                    value={serviceForm.quantity}
                    onChange={handleServiceChange}
                    className="input-field text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-muted uppercase tracking-wider mb-1.5 font-medium">
                    {t("booking_details.packages")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availablePackages.map((pkg) => {
                      const isChecked = serviceForm.package.includes(pkg.name);
                      return (
                        <label
                          key={pkg.id}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-neutral-900 text-white border-neutral-900"
                              : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            name="package"
                            value={pkg.name}
                            checked={isChecked}
                            onChange={handleServiceChange}
                            className="hidden"
                          />
                          <span>{pkg.name}</span>
                        </label>
                      );
                    })}
                    {availablePackages.length === 0 && (
                      <span className="text-xs text-muted">
                        {t("settings.no_packages")}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted uppercase tracking-wider mb-1 font-medium">
                    {t("booking_details.start_time")} *
                  </label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    required
                    value={serviceForm.start_time}
                    onChange={handleServiceChange}
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted uppercase tracking-wider mb-1 font-medium">
                    {t("booking_details.duration_end")}
                  </label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    value={serviceForm.end_time}
                    onChange={handleServiceChange}
                    className="input-field text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-muted uppercase tracking-wider mb-1 font-medium">
                    {t("booking_details.due_date")}
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={serviceForm.due_date}
                    onChange={handleServiceChange}
                    className="input-field text-sm max-w-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-muted uppercase tracking-wider mb-1 font-medium">
                    {t("booking_details.notes")}
                  </label>
                  <textarea
                    name="notes"
                    rows="3"
                    value={serviceForm.notes}
                    onChange={handleServiceChange}
                    placeholder="Add notes or special requirements..."
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-line mt-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={savingService}
                  className="btn bg-white border border-line text-text hover:bg-neutral-50 text-sm"
                >
                  {t("booking_details.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="btn text-sm"
                >
                  {savingService ? t("booking_details.saving_changes") : t("booking_details.save_changes")}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Customer & Financials Card */}
        <div className="card-panel p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-4 border-b border-line pb-3">
            {t("booking_details.customer_financials")}
          </h3>
          <div className="mb-6">
            <div className="text-xs text-muted uppercase tracking-wider mb-1">
              {t("booking_details.customer")}
            </div>
            <div className="font-semibold text-lg">
              {booking.customer_name || t("bookings.walk_in_customer")}
            </div>
            {booking.customer_phone && (
              <div className="text-sm text-muted">{booking.customer_phone}</div>
            )}
          </div>

          <div className="flex-1"></div>

          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted text-sm">{t("booking_details.total_agreed")}</span>
              <span className="font-medium">{money(total)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted text-sm">{t("booking_details.total_paid")}</span>
              <span className="font-medium text-green-700">{money(paid)}</span>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-200">
              <span className="font-semibold text-sm">{t("booking_details.balance_due")}</span>
              <span
                className={`font-bold ${due > 0 ? "text-red-600" : "text-neutral-500"}`}
              >
                {money(due)}
              </span>
            </div>
          </div>

          {due > 0 && (
            <button
              className="btn mt-4 w-full"
              onClick={() => navigate(`/record-payment?booking=${booking.id}`)}
            >
              {t("booking_details.record_payment")}
            </button>
          )}
        </div>
      </div>

      <div className="card-panel overflow-hidden">
        <div className="px-6 py-5 border-b border-line flex justify-between items-center bg-white">
          <h3 className="text-lg font-semibold m-0">{t("booking_details.payment_history")}</h3>
        </div>

        {booking.payments && booking.payments.length > 0 ? (
          <div className="divide-y divide-line">
            <div className="grid grid-cols-[1fr_1fr_1fr_2fr] items-center text-muted text-xs uppercase tracking-wider font-semibold py-3 px-6 bg-neutral-50">
              <div>{t("booking_details.col_date")}</div>
              <div>{t("booking_details.col_amount")}</div>
              <div>{t("booking_details.col_method")}</div>
              <div>{t("booking_details.col_notes")}</div>
            </div>
            {booking.payments.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_1fr_1fr_2fr] items-center py-4 px-6 hover:bg-neutral-50 transition-colors text-sm"
              >
                <div className="text-muted">{formatDate(p.date)}</div>
                <div className="font-semibold text-green-700">
                  {money(parseFloat(p.amount))}
                </div>
                <div>
                  <span className="inline-block bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full text-xs font-medium">
                    {p.payment_method}
                  </span>
                </div>
                <div className="text-muted truncate">{p.notes || "-"}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted">
            {t("booking_details.no_payments")}
          </div>
        )}
      </div>
    </>
  );
}

export default BookingDetails;
