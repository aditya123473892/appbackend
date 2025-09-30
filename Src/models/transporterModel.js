const { pool, sql } = require("../config/dbconfig");

class Transporter {
    static async getAll() {
        try {
            const result = await pool.request().query("SELECT * FROM dbo.transporters");
            return result.recordset;
        } catch (err) {
            console.error("Error in Transporter.getAll: ", err);
            throw err;
        }
    }
}

module.exports = Transporter;