const express = require("express");
const router = express.Router();
const oemPickupController = require("../controller/oemPickupController");

router.post("/", oemPickupController.createOemPickup);
router.get("/arrivals", oemPickupController.getOemPickupsForArrival);
router.put("/:id/arrival", oemPickupController.updateOemPickupArrival);

module.exports = router;
