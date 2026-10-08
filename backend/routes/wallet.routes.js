const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const { requireOwner } = require("../middleware/auth.middleware");

// Personal wallet & withdrawal requests
router.get("/my-wallet", walletController.getMyWallet);
router.post("/withdraw", walletController.requestWithdrawal);
router.get("/transactions", walletController.getTransactions);

// Task specific rewards
router.get("/tasks/:task_id/rewards", walletController.getTaskRewards);

// Owner-only endpoints
router.get("/overview", requireOwner, walletController.getWalletOverview);
router.post("/reward", requireOwner, walletController.rewardMember);
router.post(
  "/requests/:id/approve",
  requireOwner,
  walletController.approveWithdrawal,
);
router.post(
  "/requests/:id/reject",
  requireOwner,
  walletController.rejectWithdrawal,
);

module.exports = router;
