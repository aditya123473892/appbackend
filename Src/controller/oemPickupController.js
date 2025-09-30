
const OemPickup = require("../models/OemPickupModel");

exports.createOemPickup = async (req, res) => {
    try {
        const pickupData = {
            company_id: req.body.PlantId,
            origin_terminal_id: req.body.OrgnTerminal,
            destination_terminal_id: req.body.DestTerminal,
            transporter_id: req.body.VendorId,
            truck_number: req.body.TruckNo,
            driver_name: req.body.DriverName,
            pickup_datetime: new Date(req.body.PickupDate.split('-').reverse().join('-')),
            dispatch_datetime: req.body.DisptachDate ? new Date(req.body.DisptachDate.split('-').reverse().join('-')) : null,
            vin_details: req.body.VinData,
            remarks: req.body.Remarks,
            created_by: req.body.CreatedBy
        };

        if (!pickupData.company_id || !pickupData.truck_number || !pickupData.vin_details) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const result = await OemPickup.create(pickupData);
        res.status(201).json({ message: "OEM Pickup created successfully", pickup_id: result.pickup_id });

    } catch (err) {
        console.error("Error in createOemPickup: ", err);
        res.status(500).json({ message: "Error creating OEM Pickup", error: err.message });
    }
};

exports.getOemPickupsForArrival = async (req, res) => {
    try {
        const pickups = await OemPickup.getOemPickupsForArrival();
        res.json(pickups);
    } catch (err) {
        console.error("Error in getOemPickupsForArrival: ", err);
        res.status(500).json({ message: "Error fetching OEM pickups for arrival", error: err.message });
    }
};

exports.updateOemPickupArrival = async (req, res) => {
    try {
        const { id } = req.params;
        const { arrival_datetime } = req.body;

        if (!arrival_datetime) {
            return res.status(400).json({ message: "Arrival datetime is required." });
        }

        const result = await OemPickup.updateArrivalDetails(id, new Date(arrival_datetime));

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "OEM Pickup not found or no changes made." });
        }

        res.json({ message: "OEM Pickup arrival updated successfully" });

    } catch (err) {
        console.error("Error in updateOemPickupArrival: ", err);
        res.status(500).json({ message: "Error updating OEM Pickup arrival", error: err.message });
    }
};
