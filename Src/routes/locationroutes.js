const express = require("express");
const router = express.Router();
const locationController = require("../controller/locationcontroller");

router.get("/", locationController.getAllLocations);

module.exports = router;
