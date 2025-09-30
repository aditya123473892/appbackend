const express = require("express");
const router = express.Router();
const companyController = require("../controller/companyController");

router.get("/", companyController.getAllCompanies);

module.exports = router;
