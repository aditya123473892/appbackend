const express = require("express");
const router = express.Router();
const transporterController = require("../controller/transportercontroller");

router.get("/", transporterController.getAllTransporters);

module.exports = router;
