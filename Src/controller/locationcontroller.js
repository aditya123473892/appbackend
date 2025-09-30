const Location = require("../models/LocationModel");

exports.getAllLocations = async (req, res) => {
    try {
        const locations = await Location.getAll();
        res.json(locations);
    } catch (err) {
        res.status(500).json({ message: "Error fetching locations", error: err });
    }
};