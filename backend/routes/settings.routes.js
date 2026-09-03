const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settings.controller");

router.get("/services", settingsController.getServices);
router.post("/services", settingsController.createService);
router.delete("/services/:id", settingsController.deleteService);

router.get("/packages", settingsController.getPackages);
router.post("/packages", settingsController.createPackage);
router.delete("/packages/:id", settingsController.deletePackage);

router.get("/users", settingsController.getUsers);
router.post("/users", settingsController.createUser);
router.put("/users/:id", settingsController.updateUser);
router.put("/users/:id/toggle-active", settingsController.toggleActive);
router.delete("/users/:id", settingsController.deleteUser);

module.exports = router;
