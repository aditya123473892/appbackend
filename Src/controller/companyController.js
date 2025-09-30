
const Company = require("../models/CompanyModel");

exports.getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.getAll();
        res.json(companies);
    } catch (err) {
        res.status(500).json({ message: "Error fetching companies", error: err });
    }
};
