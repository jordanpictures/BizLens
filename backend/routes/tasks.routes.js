const express = require("express");
const router = express.Router();
const tasksController = require("../controllers/tasks.controller");
const { requireOwner } = require("../middleware/auth.middleware");

// List tasks & team members
router.get("/", tasksController.getTasks);
router.get("/team-members", tasksController.getTeamMembers);
router.get("/:id", tasksController.getTaskById);

// Owner-only assignment & unassignment
router.post("/assign", requireOwner, tasksController.assignTask);
router.delete("/:id/unassign", requireOwner, tasksController.unassignTask);

// Status update & comments (Available to assigned team members and owners)
router.patch("/:id/status", tasksController.updateTaskStatus);
router.post("/:id/comments", tasksController.addComment);

module.exports = router;
