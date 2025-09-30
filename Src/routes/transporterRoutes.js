const express = require("express");
const router = express.Router();
const transporterController = require("../controller/transporterController");

router.get("/", transporterController.getAllTransporters);

module.exports = router;
