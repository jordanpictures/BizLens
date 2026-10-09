import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader";
import { money } from "../utils/format";

function RecordPayment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get("booking");

  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({
    booking_id: bookingIdParam || "",
    amount: "",
    payment_method: "Cash",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data) => {
        // Filter out fully paid bookings so we only show those with a due amount, but always include the selected booking
        const dueBookings = data.filter(
          (b) =>
            parseFloat(b.agreed_price) - parseFloat(b.paid_amount) > 0 ||
            b.id === bookingIdParam,
        );
        setBookings(dueBookings);

        // Auto-select logic
        if (!formData.booking_id && dueBookings.length > 0) {
          setFormData((prev) => ({ ...prev, booking_id: dueBookings[0].id }));
        }
      });
  }, [bookingIdParam]);

  // Update amount if booking changes to auto-fill remaining due
  useEffect(() => {
    if (formData.booking_id) {
      const selected = bookings.find((b) => b.id === formData.booking_id);
      if (selected) {
        const due =
          parseFloat(selected.agreed_price) - parseFloat(selected.paid_amount);
        setFormData((prev) => ({ ...prev, amount: due > 0 ? due : "" }));
      }
    }
  }, [formData.booking_id, bookings]);

  const handleCancel = (e) => {
    e.preventDefault();
    if (bookingIdParam) {
      navigate(`/bookings/${bookingIdParam}`);
    } else {
      navigate("/payments");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        if (bookingIdParam) {
          navigate(`/bookings/${bookingIdParam}`);
        } else {
          navigate("/bookings");
        }
      } else {
        alert("Failed to save payment.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving payment.");
    }
  };

  return (
    <>
      <PageHeader
        title={t("record_payment.title")}
        sub={t("record_payment.sub")}
      />

      <div className="card-panel p-6 md:p-8 max-w-2xl">
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          onSubmit={handleSave}
        >
          <div className="md:col-span-2">
            <label className="block text-muted text-sm font-medium mb-2">
              {t("record_payment.booking_label")}
            </label>
            <select
              name="booking_id"
              value={formData.booking_id}
              onChange={handleChange}
              disabled={Boolean(bookingIdParam)}
              className={`input-field appearance-none bg-white ${
                bookingIdParam
                  ? "bg-neutral-100 text-neutral-600 cursor-not-allowed opacity-80"
                  : ""
              }`}
              required
            >
              {bookings.length === 0 && (
                <option value="">{t("record_payment.no_due_bookings")}</option>
              )}
              {bookings.map((b) => {
                const due =
                  parseFloat(b.agreed_price) - parseFloat(b.paid_amount);
                return (
                  <option key={b.id} value={b.id}>
                    {b.customer_name || t("bookings.walk_in_customer")} —{" "}
                    {b.service_type} ({t("booking_details.balance_due")}:{" "}
                    {money(due)})
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-muted text-sm font-medium mb-2">
              {t("record_payment.amount_label")}
            </label>
            <input
              required
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="input-field"
              placeholder="ETB 0"
            />
          </div>
          <div>
            <label className="block text-muted text-sm font-medium mb-2">
              {t("record_payment.payment_method")}
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              className="input-field appearance-none bg-white"
            >
              <option value="Cash">{t("payments.cash")}</option>
              <option value="Transfer">{t("payments.transfer")}</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-muted text-sm font-medium mb-2">
              {t("record_payment.date_label")}
            </label>
            <input
              required
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-muted text-sm font-medium mb-2">
              {t("record_payment.notes_label")}
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input-field min-h-[100px] resize-y"
              placeholder={t("record_payment.notes_ph")}
            ></textarea>
          </div>
          <div className="md:col-span-2 flex gap-3 mt-2">
            <button
              type="submit"
              className="btn"
              disabled={bookings.length === 0}
            >
              {t("record_payment.save_btn")}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
            >
              {t("record_payment.cancel_btn")}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default RecordPayment;
