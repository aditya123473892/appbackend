
const { pool, sql } = require("../config/dbconfig");

class Company {
    static async getAll() {
        try {
            const result = await pool.request().query("SELECT * FROM dbo.companies");
            return result.recordset;
        } catch (err) {
            console.error("Error in Company.getAll: ", err);
            throw err;
        }
    }
}

module.exports = Company;
