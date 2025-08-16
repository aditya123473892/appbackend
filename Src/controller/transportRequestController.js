const TransportRequest = require("../models/TransportRequestModel");
const { pool, sql } = require("../config/dbconfig");

// Improved createRequest function with better time handling
exports.createRequest = async (req, res) => {
  try {
    const {
      consignee,
      consigner,
      vehicle_type,
      vehicle_size,
      pickup_location,
      stuffing_location,
      delivery_location,
      commodity,
      cargo_type,
      cargo_weight,
      service_type,
      service_prices,
      containers_20ft,
      containers_40ft,
      total_containers,
      expected_pickup_date,
      expected_pickup_time,
      expected_delivery_date,
      expected_delivery_time,
      requested_price,
      no_of_vehicles,
      status,
      vehicle_status,
      SHIPA_NO, // Added new field
    } = req.body;

    // Validate required date and time fields
    if (!expected_pickup_date || !expected_pickup_time) {
      return res.status(400).json({
        success: false,
        message: "Expected pickup date and time are required",
      });
    }

    if (!expected_delivery_date || !expected_delivery_time) {
      return res.status(400).json({
        success: false,
        message: "Expected delivery date and time are required",
      });
    }

    // Validate SHIPA_NO if required
    if (!SHIPA_NO || SHIPA_NO.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "SHIPA_NO is required",
      });
    }

    // Format time to HH:MM for nvarchar(5)
    const formatTimeForSQL = (timeString, fieldName) => {
      if (
        !timeString ||
        typeof timeString !== "string" ||
        timeString.trim() === ""
      ) {
        throw new Error(`Invalid ${fieldName} format. Expected HH:MM`);
      }

      const cleanTime = timeString.trim();

      // Accept HH:MM
      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(cleanTime)) {
        return cleanTime;
      }

      // Accept HH:MM:SS or HH:MM:SS.nnnnnnn and extract HH:MM
      if (
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?(\.\d{1,7})?$/.test(
          cleanTime
        )
      ) {
        return cleanTime.split(":").slice(0, 2).join(":");
      }

      throw new Error(`Invalid ${fieldName} format. Expected HH:MM`);
    };

    let formattedPickupTime, formattedDeliveryTime;

    try {
      formattedPickupTime = formatTimeForSQL(
        expected_pickup_time,
        "pickup time"
      );
      formattedDeliveryTime = formatTimeForSQL(
        expected_delivery_time,
        "delivery time"
      );
    } catch (timeError) {
      return res.status(400).json({
        success: false,
        message: timeError.message,
      });
    }

    // Parse service_type and service_prices if strings
    let parsedServiceType = service_type || ["Transport"];
    let parsedServicePrices = service_prices || {};

    if (typeof service_type === "string") {
      try {
        parsedServiceType = JSON.parse(service_type);
      } catch (error) {
        console.error("Error parsing service_type:", error);
        parsedServiceType = ["Transport"];
      }
    }

    if (typeof service_prices === "string") {
      try {
        parsedServicePrices = JSON.parse(service_prices);
      } catch (error) {
        console.error("Error parsing service_prices:", error);
      }
    }

    // Validate and convert dates
    const pickupDate = new Date(expected_pickup_date);
    const deliveryDate = new Date(expected_delivery_date);

    if (isNaN(pickupDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid pickup date format",
      });
    }

    if (isNaN(deliveryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery date format",
      });
    }

    const result = await pool
      .request()
      .input("customer_id", sql.Int, req.user.id)
      .input("vehicle_type", sql.NVarChar, vehicle_type)
      .input("vehicle_size", sql.NVarChar, vehicle_size)
      .input("consignee", sql.NVarChar, consignee)
      .input("consigner", sql.NVarChar, consigner)
      .input("containers_20ft", sql.Int, containers_20ft || 0)
      .input("containers_40ft", sql.Int, containers_40ft || 0)
      .input("total_containers", sql.Int, total_containers || 0)
      .input("pickup_location", sql.NVarChar, pickup_location)
      .input("stuffing_location", sql.NVarChar, stuffing_location)
      .input("delivery_location", sql.NVarChar, delivery_location)
      .input("commodity", sql.NVarChar, commodity)
      .input("cargo_type", sql.NVarChar, cargo_type)
      .input("cargo_weight", sql.Decimal(10, 2), cargo_weight)
      .input(
        "service_type",
        sql.NVarChar(sql.MAX),
        JSON.stringify(parsedServiceType)
      )
      .input(
        "service_prices",
        sql.NVarChar(sql.MAX),
        JSON.stringify(parsedServicePrices)
      )
      .input("expected_pickup_date", sql.Date, pickupDate)
      .input("expected_pickup_time", sql.NVarChar(5), formattedPickupTime)
      .input("expected_delivery_date", sql.Date, deliveryDate)
      .input("expected_delivery_time", sql.NVarChar(5), formattedDeliveryTime)
      .input("requested_price", sql.Decimal(10, 2), requested_price)
      .input("no_of_vehicles", sql.Int, no_of_vehicles || 1)
      .input("status", sql.NVarChar, status || "Pending")
      .input("vehicle_status", sql.NVarChar, vehicle_status || "Empty")
      .input("SHIPA_NO", sql.NVarChar, SHIPA_NO) // Added new field
      .query(`
        INSERT INTO transport_requests (
          customer_id, vehicle_type, vehicle_size, consignee, consigner,
          containers_20ft, containers_40ft, total_containers,
          pickup_location, stuffing_location, delivery_location,
          commodity, cargo_type, cargo_weight, service_type,
          service_prices, expected_pickup_date, expected_pickup_time,
          expected_delivery_date, expected_delivery_time,
          requested_price, status, no_of_vehicles, vehicle_status, SHIPA_NO, created_at
        )
        OUTPUT INSERTED.*
        VALUES (
          @customer_id, @vehicle_type, @vehicle_size, @consignee, @consigner,
          @containers_20ft, @containers_40ft, @total_containers,
          @pickup_location, @stuffing_location, @delivery_location,
          @commodity, @cargo_type, @cargo_weight, @service_type,
          @service_prices, @expected_pickup_date, @expected_pickup_time,
          @expected_delivery_date, @expected_delivery_time,
          @requested_price, @status, @no_of_vehicles, @vehicle_status, @SHIPA_NO, GETDATE()
        )
      `);

    return res.status(201).json({
      success: true,
      message: "Transport request created successfully",
      request: result.recordset[0],
    });
  } catch (error) {
    console.error("Create request error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating transport request",
      error: error.message,
    });
  }
};

const formatTimeForClient = (timeString) => {
  if (!timeString) return null;

  if (typeof timeString === "string" && timeString.includes(":")) {
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    }
  }

  return timeString;
};

exports.getMyRequests = async (req, res) => {
  try {
    const result = await pool
      .request()
      .input("customer_id", sql.Int, req.user.id)
      .query(
        "SELECT * FROM transport_requests WHERE customer_id = @customer_id ORDER BY created_at DESC"
      );

    const formattedRequests = result.recordset.map((request) => ({
      ...request,
      expected_pickup_time: formatTimeForClient(request.expected_pickup_time),
      expected_delivery_time: formatTimeForClient(
        request.expected_delivery_time
      ),
    }));

    return res.json({
      success: true,
      requests: formattedRequests,
    });
  } catch (error) {
    console.error("Get requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching requests",
      error: error.message,
    });
  }
};

exports.updateRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const {
      consignee,
      consigner,
      vehicle_type,
      vehicle_size,
      pickup_location,
      stuffing_location,
      delivery_location,
      commodity,
      cargo_type,
      cargo_weight,
      service_type,
      service_prices,
      containers_20ft,
      containers_40ft,
      total_containers,
      expected_pickup_date,
      expected_pickup_time,
      expected_delivery_date,
      expected_delivery_time,
      requested_price,
      no_of_vehicles,
      status,
      vehicle_status,
      SHIPA_NO, // Added new field
    } = req.body;

    // Parse service_type and service_prices if strings
    let parsedServiceType = service_type;
    let parsedServicePrices = service_prices || {};

    if (typeof service_type === "string") {
      try {
        parsedServiceType = JSON.parse(service_type);
      } catch (error) {
        console.error("Error parsing service_type:", error);
        parsedServiceType = ["Transport"];
      }
    }

    if (typeof service_prices === "string") {
      try {
        parsedServicePrices = JSON.parse(service_prices);
      } catch (error) {
        console.error("Error parsing service_prices:", error);
      }
    }

    // Validate and convert dates if provided
    let pickupDate = expected_pickup_date;
    let deliveryDate = expected_delivery_date;

    if (expected_pickup_date) {
      pickupDate = new Date(expected_pickup_date);
      if (isNaN(pickupDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid pickup date format",
        });
      }
    }

    if (expected_delivery_date) {
      deliveryDate = new Date(expected_delivery_date);
      if (isNaN(deliveryDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid delivery date format",
        });
      }
    }

    // Format time to HH:MM for nvarchar(5)
    const formatTimeForSQL = (timeString, fieldName) => {
      if (
        !timeString ||
        typeof timeString !== "string" ||
        timeString.trim() === ""
      ) {
        return null; // Allow null for nullable fields
      }

      const cleanTime = timeString.trim();

      // Accept HH:MM
      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(cleanTime)) {
        return cleanTime;
      }

      // Accept HH:MM:SS or HH:MM:SS.nnnnnnn and extract HH:MM
      if (
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?(\.\d{1,7})?$/.test(
          cleanTime
        )
      ) {
        return cleanTime.split(":").slice(0, 2).join(":");
      }

      throw new Error(`Invalid ${fieldName} format. Expected HH:MM`);
    };

    let formattedPickupTime = null;
    let formattedDeliveryTime = null;

    try {
      if (expected_pickup_time) {
        formattedPickupTime = formatTimeForSQL(
          expected_pickup_time,
          "pickup time"
        );
      }
      if (expected_delivery_time) {
        formattedDeliveryTime = formatTimeForSQL(
          expected_delivery_time,
          "delivery time"
        );
      }
    } catch (timeError) {
      return res.status(400).json({
        success: false,
        message: timeError.message,
      });
    }

    const result = await pool
      .request()
      .input("id", sql.Int, requestId)
      .input("consignee", sql.NVarChar, consignee)
      .input("consigner", sql.NVarChar, consigner)
      .input("vehicle_type", sql.NVarChar, vehicle_type)
      .input("vehicle_size", sql.NVarChar, vehicle_size)
      .input("pickup_location", sql.NVarChar, pickup_location)
      .input("stuffing_location", sql.NVarChar, stuffing_location)
      .input("delivery_location", sql.NVarChar, delivery_location)
      .input("commodity", sql.NVarChar, commodity)
      .input("cargo_type", sql.NVarChar, cargo_type)
      .input("cargo_weight", sql.Decimal(10, 2), cargo_weight)
      .input(
        "service_type",
        sql.NVarChar(sql.MAX),
        JSON.stringify(parsedServiceType)
      )
      .input(
        "service_prices",
        sql.NVarChar(sql.MAX),
        JSON.stringify(parsedServicePrices)
      )
      .input("containers_20ft", sql.Int, containers_20ft || 0)
      .input("containers_40ft", sql.Int, containers_40ft || 0)
      .input("total_containers", sql.Int, total_containers || 0)
      .input("expected_pickup_date", sql.Date, pickupDate)
      .input("expected_pickup_time", sql.NVarChar(5), formattedPickupTime)
      .input("expected_delivery_date", sql.Date, deliveryDate)
      .input("expected_delivery_time", sql.NVarChar(5), formattedDeliveryTime)
      .input("requested_price", sql.Decimal(10, 2), requested_price)
      .input("no_of_vehicles", sql.Int, no_of_vehicles || 1)
      .input("status", sql.NVarChar, status)
      .input("vehicle_status", sql.NVarChar, vehicle_status)
      .input("SHIPA_NO", sql.NVarChar, SHIPA_NO) // Added new field
      .query(`
        UPDATE transport_requests 
        SET consignee = @consignee,
            consigner = @consigner,
            vehicle_type = @vehicle_type,
            vehicle_size = @vehicle_size,
            pickup_location = @pickup_location,
            stuffing_location = @stuffing_location,
            delivery_location = @delivery_location,
            commodity = @commodity,
            cargo_type = @cargo_type,
            cargo_weight = @cargo_weight,
            service_type = @service_type,
            service_prices = @service_prices,
            containers_20ft = @containers_20ft,
            containers_40ft = @containers_40ft,
            total_containers = @total_containers,
            expected_pickup_date = @expected_pickup_date,
            expected_pickup_time = @expected_pickup_time,
            expected_delivery_date = @expected_delivery_date,
            expected_delivery_time = @expected_delivery_time,
            requested_price = @requested_price,
            status = @status,
            no_of_vehicles = @no_of_vehicles,
            vehicle_status = @vehicle_status,
            SHIPA_NO = @SHIPA_NO,
            updated_at = GETDATE()
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: "Transport request updated successfully",
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      success: false,
      message: `Failed to update transport request: ${error.message}`,
    });
  }
};

exports.getCustomerRequests = async (req, res) => {
  try {
    const requests = await TransportRequest.getCustomerRequests(req.user.id);
    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get customer requests error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching transport requests",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await TransportRequest.getAllRequests();
    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get all requests error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching transport requests",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, adminComment } = req.body;

    // Validate status
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'rejected'",
      });
    }

    // Validate admin comment
    if (!adminComment || adminComment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Admin comment is required",
      });
    }

    const updatedRequest = await TransportRequest.updateStatus(
      requestId,
      status,
      adminComment
    );

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: "Transport request not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Request ${status} successfully`,
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update request status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
