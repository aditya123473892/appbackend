const Transporter = require("../models/transporterModel");

exports.getAllTransporters = async (req, res) => {
  try {
    const transporters = await Transporter.getAll();
    res.json(transporters);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching transporters", error: err });
  }
};
