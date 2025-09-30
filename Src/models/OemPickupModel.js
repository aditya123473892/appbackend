
const { pool, sql } = require("../config/dbconfig");

class OemPickup {
  static async create(pickupData) {
    const { 
        company_id,
        origin_terminal_id,
        destination_terminal_id,
        transporter_id,
        truck_number,
        driver_name,
        pickup_datetime,
        dispatch_datetime,
        vin_details,
        remarks,
        created_by
    } = pickupData;

    try {
      const request = pool.request();

      // Add all parameters to the request
      request.input('company_id', sql.VarChar, company_id);
      request.input('origin_terminal_id', sql.VarChar, origin_terminal_id);
      request.input('destination_terminal_id', sql.VarChar, destination_terminal_id);
      request.input('transporter_id', sql.VarChar, transporter_id);
      request.input('truck_number', sql.VarChar, truck_number);
      request.input('driver_name', sql.VarChar, driver_name);
      request.input('pickup_datetime', sql.DateTime, pickup_datetime);
      request.input('vin_details', sql.Text, vin_details);
      request.input('created_by', sql.VarChar, created_by);

      // Optional fields
      if (dispatch_datetime) {
        request.input('dispatch_datetime', sql.DateTime, dispatch_datetime);
      } else {
        request.input('dispatch_datetime', sql.DateTime, null);
      }

      if (remarks) {
        request.input('remarks', sql.Text, remarks);
      } else {
        request.input('remarks', sql.Text, null);
      }

      const query = `
        INSERT INTO dbo.oem_pickups (
            company_id, origin_terminal_id, destination_terminal_id, transporter_id, 
            truck_number, driver_name, pickup_datetime, dispatch_datetime, 
            vin_details, remarks, created_by
        ) 
        VALUES (
            @company_id, @origin_terminal_id, @destination_terminal_id, @transporter_id, 
            @truck_number, @driver_name, @pickup_datetime, @dispatch_datetime, 
            @vin_details, @remarks, @created_by
        );
        SELECT SCOPE_IDENTITY() AS pickup_id;
      `;

      const result = await request.query(query);
      return result.recordset[0];

    } catch (err) {
      console.error("Error in OemPickup.create: ", err);
      throw err;
    }
  }

  static async getOemPickupsForArrival() {
    try {
      const result = await pool.request().query(`
        SELECT
            op.pickup_id,
            op.truck_number,
            op.vin_details,
            op.pickup_datetime,
            c.company_name AS plant_name,
            l.location_name AS origin_terminal_name
        FROM dbo.oem_pickups op
        LEFT JOIN dbo.companies c ON op.company_id = c.company_id
        LEFT JOIN dbo.locations l ON op.origin_terminal_id = l.location_id
        WHERE op.dispatch_datetime IS NULL
      `);
      return result.recordset;
    } catch (err) {
      console.error("Error in OemPickup.getOemPickupsForArrival: ", err);
      throw err;
    }
  }

  static async updateArrivalDetails(pickupId, arrivalDateTime) {
    try {
      const request = pool.request();
      request.input('pickup_id', sql.Int, pickupId);
      request.input('dispatch_datetime', sql.DateTime, arrivalDateTime);

      const result = await request.query(`
        UPDATE dbo.oem_pickups
        SET dispatch_datetime = @dispatch_datetime
        WHERE pickup_id = @pickup_id
      `);
      return result;
    } catch (err) {
      console.error("Error in OemPickup.updateArrivalDetails: ", err);
      throw err;
    }
  }
}

module.exports = OemPickup;
