import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { money } from "../utils/format";

function WithdrawModal({ isOpen, onClose, onSuccess, availableBalance = 0 }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Telebirr");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setAmount("");
    setPaymentMethod("Telebirr");
    setNotes("");
    setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePreset = (fraction) => {
    const val = Math.floor(availableBalance * fraction);
    setAmount(val > 0 ? String(val) : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (parsedAmount > availableBalance) {
      setError(
        `Amount exceeds your available balance (${money(availableBalance)})`,
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          payment_method: paymentMethod,
          notes: notes.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit withdrawal request");
      }

      const data = await res.json();
      onSuccess && onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-line shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-5 border-b border-line flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 m-0">
              {t("withdraw_modal.title")}
            </h3>
            <p className="text-xs text-neutral-500 m-0 mt-0.5">
              {t("withdraw_modal.available")}{" "}
              <span className="font-bold text-neutral-900">
                {money(availableBalance)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                {t("withdraw_modal.amount_label")}
              </label>
              <div className="flex gap-1">
                {[0.25, 0.5, 1].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => handlePreset(f)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                  >
                    {f === 1 ? t("common.all") : `${f * 100}%`}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              step="any"
              min="1"
              max={availableBalance}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2.5 text-base font-bold bg-white border border-line rounded-xl focus:outline-hidden focus:border-neutral-900 transition-colors"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              {t("withdraw_modal.method_label")}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2.5 text-sm bg-white border border-line rounded-xl focus:outline-hidden focus:border-neutral-900 transition-colors"
              required
            >
              <option value="Telebirr">Telebirr</option>
              <option value="CBE">CBE (Commercial Bank of Ethiopia)</option>
              <option value="Cash">Cash in hand</option>
              <option value="Bank of Abyssinia">Bank of Abyssinia</option>
              <option value="Awash Bank">Awash Bank</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Account Details / Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              {t("withdraw_modal.instructions_label")}
            </label>
            <textarea
              rows={2}
              placeholder={t("withdraw_modal.instructions_placeholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 text-sm bg-white border border-line rounded-xl focus:outline-hidden focus:border-neutral-900 transition-colors"
            />
          </div>

          <div className="text-[11px] text-neutral-500 leading-relaxed bg-neutral-50 p-3 rounded-xl border border-line">
            {t("withdraw_modal.notice")}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary flex-1 py-2 text-xs cursor-pointer"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                !amount ||
                parseFloat(amount) <= 0 ||
                parseFloat(amount) > availableBalance
              }
              className="btn flex-1 py-2 text-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? t("withdraw_modal.submitting") : t("withdraw_modal.submit_btn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WithdrawModal;
