import { useState, useEffect, useContext, useMemo } from "react";
import PageHeader from "../components/PageHeader";
import RewardModal from "../components/RewardModal";
import WithdrawModal from "../components/WithdrawModal";
import { AuthContext } from "../context/AuthContext";
import { money, formatDate } from "../utils/format";

function Wallet() {
  const { user } = useContext(AuthContext);
  const isOwner = user?.role === "Owner";

  const [loading, setLoading] = useState(true);
  const [personalData, setPersonalData] = useState({
    balance: {
      available_balance: 0,
      total_earned: 0,
      total_withdrawn: 0,
      pending_withdrawals: 0,
    },
    transactions: [],
    withdrawal_requests: [],
  });
  const [overviewData, setOverviewData] = useState({
    summary: {
      total_paid_out: 0,
      total_pending_amount: 0,
      pending_requests_count: 0,
      total_rewards_awarded: 0,
    },
    pending_requests: [],
    team_wallets: [],
  });

  // Modals state
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [selectedRewardUserId, setSelectedRewardUserId] = useState(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // Approve / Reject state
  const [processingId, setProcessingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      // Fetch personal wallet
      const resPersonal = await fetch("/api/wallet/my-wallet");
      if (resPersonal.ok) {
        const data = await resPersonal.json();
        setPersonalData(data);
      }

      // If owner, fetch company overview
      if (isOwner) {
        const resOverview = await fetch("/api/wallet/overview");
        if (resOverview.ok) {
          const data = await resOverview.json();
          setOverviewData(data);
        }
      }
    } catch (err) {
      console.error("Failed to load wallet data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isOwner]);

  const handleApprove = async (id) => {
    if (
      !window.confirm(
        "Confirm payout approval? This marks the money as sent/given to the requester.",
      )
    ) {
      return;
    }
    setProcessingId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/wallet/requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Paid in full" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to approve request");
      }
      fetchData();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt(
      "Please enter the reason for rejecting this withdrawal request:",
    );
    if (reason === null) return;

    setProcessingId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/wallet/requests/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || "Declined by owner" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reject request");
      }
      fetchData();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered transactions
  const displayedTransactions = useMemo(() => {
    const list = personalData.transactions || [];
    return list.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesType = t.type?.toLowerCase().includes(q);
        const matchesNote = t.notes?.toLowerCase().includes(q);
        const matchesTask = t.task_title?.toLowerCase().includes(q);
        const matchesCustomer = t.customer_name?.toLowerCase().includes(q);
        const matchesCreator = t.created_by_username?.toLowerCase().includes(q);
        return (
          matchesType ||
          matchesNote ||
          matchesTask ||
          matchesCustomer ||
          matchesCreator
        );
      }
      return true;
    });
  }, [personalData.transactions, typeFilter, search]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Pending":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-200";
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "Reward":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Withdrawal":
        return "bg-neutral-100 text-neutral-800 border-neutral-200";
      default:
        return "bg-neutral-50 text-neutral-700 border-neutral-200";
    }
  };

  return (
    <>
      <PageHeader
        title="Wallet"
        sub={
          isOwner
            ? "Manage team payouts, rewards, and withdrawal requests"
            : "Your balance, rewards, and withdrawal requests"
        }
      />

      {/* Action Bar on new line */}
      <div className="flex items-center justify-end mb-6">
        {isOwner ? (
          <button
            type="button"
            onClick={() => {
              setSelectedRewardUserId(null);
              setRewardModalOpen(true);
            }}
            className="btn text-xs !py-2 !px-4 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Reward Member</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={personalData.balance.available_balance <= 0}
            onClick={() => setWithdrawModalOpen(true)}
            className="btn text-xs !py-2 !px-4 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
            <span>Request Withdrawal</span>
          </button>
        )}
      </div>

      {actionError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-600 hover:text-red-900 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      {isOwner ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-line p-5 shadow-xs">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">
              Total Paid Out
            </div>
            <div className="text-2xl font-bold text-neutral-900 tracking-tight">
              {money(overviewData.summary.total_paid_out)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Completed team withdrawals
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-line p-5 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wider text-muted font-semibold">
                Pending Requests
              </span>
              {overviewData.summary.pending_requests_count > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {overviewData.summary.pending_requests_count} new
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-amber-700 tracking-tight">
              {money(overviewData.summary.total_pending_amount)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Awaiting owner review
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-line p-5 shadow-xs">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">
              Total Rewards Awarded
            </div>
            <div className="text-2xl font-bold text-neutral-900 tracking-tight">
              {money(overviewData.summary.total_rewards_awarded)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Total allowances & rewards given
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-neutral-900 p-5 shadow-xs">
            <div className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">
              Available Balance
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              {money(personalData.balance.available_balance)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 font-medium">
              Ready for withdrawal
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-line p-5 shadow-xs">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">
              Total Rewards Earned
            </div>
            <div className="text-2xl font-bold text-neutral-900 tracking-tight">
              {money(personalData.balance.total_earned)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Earned from tasks & allowances
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-line p-5 shadow-xs">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">
              Total Paid Out
            </div>
            <div className="text-2xl font-bold text-neutral-900 tracking-tight">
              {money(personalData.balance.total_withdrawn)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Successfully received
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-line p-5 shadow-xs">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-1">
              Pending Payouts
            </div>
            <div className="text-2xl font-bold text-amber-700 tracking-tight">
              {money(personalData.balance.pending_withdrawals)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              In review by owner
            </div>
          </div>
        </div>
      )}

      {/* Owner: Pending Withdrawal Requests Section */}
      {isOwner && overviewData.pending_requests.length > 0 && (
        <div className="mb-8 bg-amber-50/50 rounded-2xl border border-amber-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h3 className="text-base font-bold text-neutral-900 m-0">
                Pending Withdrawal Requests (
                {overviewData.pending_requests.length})
              </h3>
            </div>
            <span className="text-xs font-semibold text-amber-800">
              Review and approve payouts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overviewData.pending_requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {req.username?.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-neutral-900">
                          {req.username}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {req.position || req.role}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      Pending
                    </span>
                  </div>

                  <div className="mb-3 space-y-1.5 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Amount:</span>
                      <span className="font-bold text-neutral-900 text-sm">
                        {money(parseFloat(req.amount))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Method:</span>
                      <span className="font-semibold text-neutral-800">
                        {req.payment_method || "Cash"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Requested:</span>
                      <span className="text-neutral-700">
                        {formatDate(req.created_at, true)}
                      </span>
                    </div>
                    {req.notes && (
                      <div className="pt-1 border-t border-neutral-200/60 text-neutral-700 font-mono text-[11px] break-all">
                        {req.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    disabled={processingId === req.id}
                    onClick={() => handleReject(req.id)}
                    className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={processingId === req.id}
                    onClick={() => handleApprove(req.id)}
                    className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {processingId === req.id
                      ? "Processing..."
                      : "Approve Payout"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Owner: Team Members Wallets Table */}
      {isOwner && (
        <div className="bg-white rounded-2xl border border-line p-6 shadow-xs mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900 m-0">
                Team Members Wallets
              </h3>
              <p className="text-xs text-muted m-0 mt-0.5">
                Overview of balances, earned rewards, and withdrawal requests
                per member
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="pb-3 font-semibold">Team Member</th>
                  <th className="pb-3 font-semibold">Total Rewards</th>
                  <th className="pb-3 font-semibold">Withdrawn</th>
                  <th className="pb-3 font-semibold">Pending</th>
                  <th className="pb-3 font-semibold text-right">
                    Available Balance
                  </th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {overviewData.team_wallets.map((tm) => (
                  <tr
                    key={tm.user_id}
                    className="hover:bg-neutral-50/70 transition-colors"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {tm.username?.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <div className="font-bold text-neutral-900">
                            {tm.username}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-medium">
                            {tm.position || tm.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-semibold text-neutral-800">
                      {money(tm.total_earned)}
                    </td>
                    <td className="py-3 text-neutral-600 font-medium">
                      {money(tm.total_withdrawn)}
                    </td>
                    <td className="py-3">
                      {tm.pending_withdrawals > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {money(tm.pending_withdrawals)}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-sm font-extrabold text-neutral-900">
                        {money(tm.available_balance)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRewardUserId(tm.user_id);
                          setRewardModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-line bg-white hover:bg-neutral-100 text-neutral-800 transition-colors cursor-pointer"
                      >
                        Reward
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Member: My Withdrawal Requests */}
      {!isOwner && personalData.withdrawal_requests.length > 0 && (
        <div className="bg-white rounded-2xl border border-line p-6 shadow-xs mb-8">
          <h3 className="text-base font-bold text-neutral-900 mb-3 m-0">
            My Withdrawal Requests
          </h3>
          <div className="space-y-2.5">
            {personalData.withdrawal_requests.map((r) => (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-neutral-50 border border-line gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900 text-sm">
                      {money(parseFloat(r.amount))}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(r.status)}`}
                    >
                      {r.status}
                    </span>
                    <span className="text-neutral-500">
                      via {r.payment_method || "Cash"}
                    </span>
                  </div>
                  <div className="text-neutral-500 text-[11px] mt-0.5">
                    Requested on {formatDate(r.created_at, true)}
                    {r.notes && (
                      <span className="text-neutral-700 ml-2">· {r.notes}</span>
                    )}
                  </div>
                </div>

                {r.reviewed_at && (
                  <div className="text-[11px] text-neutral-500 sm:text-right">
                    Reviewed by {r.reviewed_by_username || "Owner"} on{" "}
                    {formatDate(r.reviewed_at, true)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions History Ledger */}
      <div className="bg-white rounded-2xl border border-line p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-neutral-900 m-0">
              {isOwner ? "All Transactions Ledger" : "Transaction History"}
            </h3>
            <p className="text-xs text-muted m-0 mt-0.5">
              Complete chronological record of all rewards and withdrawal
              payouts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter buttons */}
            <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
              {["all", "Reward", "Withdrawal"].map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setTypeFilter(tp)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    typeFilter === tp
                      ? "bg-white text-neutral-900 shadow-2xs"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  {tp === "all" ? "All" : tp}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search notes, task..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-line bg-white focus:outline-hidden focus:border-neutral-800 transition-colors"
            />
          </div>
        </div>

        {/* Transactions Table */}
        {displayedTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400 italic">
            No transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Description / Notes</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {displayedTransactions.map((tx) => {
                  const isCredit = tx.direction === "CREDIT";
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      <td className="py-3 text-neutral-600 whitespace-nowrap">
                        {formatDate(tx.created_at, true)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getTypeBadge(tx.type)}`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 max-w-xs">
                        <div className="font-medium text-neutral-800 truncate">
                          {tx.notes ||
                            (tx.type === "Withdrawal"
                              ? `Payout request via ${tx.payment_method}`
                              : "Reward")}
                        </div>
                        {tx.task_title && (
                          <div className="text-[10px] text-neutral-400 truncate">
                            Task: {tx.task_title}
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(tx.status)}`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <span
                          className={`text-sm font-bold ${
                            isCredit
                              ? "text-emerald-700"
                              : tx.status === "Approved"
                                ? "text-neutral-900"
                                : "text-amber-700"
                          }`}
                        >
                          {isCredit
                            ? `+ ${money(parseFloat(tx.amount))}`
                            : `- ${money(parseFloat(tx.amount))}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <RewardModal
        isOpen={rewardModalOpen}
        onClose={() => setRewardModalOpen(false)}
        onSuccess={fetchData}
        preselectedUserId={selectedRewardUserId}
      />

      <WithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        onSuccess={fetchData}
        availableBalance={personalData.balance.available_balance}
      />
    </>
  );
}

export default Wallet;
