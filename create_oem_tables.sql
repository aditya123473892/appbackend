
-- Create Companies (Plants) Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='companies' and xtype='U')
CREATE TABLE companies (
    company_id VARCHAR(50) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL
);
GO

-- Create Locations (Terminals) Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='locations' and xtype='U')
CREATE TABLE locations (
    location_id VARCHAR(50) PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL
);
GO

-- Create Transporters (Vendors) Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='transporters' and xtype='U')
CREATE TABLE transporters (
    transporter_id VARCHAR(50) PRIMARY KEY,
    transporter_name VARCHAR(255) NOT NULL
);
GO

-- Create OEM Pickups Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='oem_pickups' and xtype='U')
CREATE TABLE oem_pickups (
    pickup_id INT PRIMARY KEY IDENTITY(1,1),
    company_id VARCHAR(50) FOREIGN KEY REFERENCES companies(company_id),
    origin_terminal_id VARCHAR(50) FOREIGN KEY REFERENCES locations(location_id),
    destination_terminal_id VARCHAR(50) FOREIGN KEY REFERENCES locations(location_id),
    transporter_id VARCHAR(50) FOREIGN KEY REFERENCES transporters(transporter_id),
    truck_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    pickup_datetime DATETIME NOT NULL,
    dispatch_datetime DATETIME,
    vin_details TEXT NOT NULL,
    remarks TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Insert some dummy data for testing

-- Dummy Companies
IF NOT EXISTS (SELECT 1 FROM companies WHERE company_id = 'P001')
    INSERT INTO companies (company_id, company_name) VALUES ('P001', 'Alpha Motors');
IF NOT EXISTS (SELECT 1 FROM companies WHERE company_id = 'P002')
    INSERT INTO companies (company_id, company_name) VALUES ('P002', 'Beta Automotive');
GO

-- Dummy Locations
IF NOT EXISTS (SELECT 1 FROM locations WHERE location_id = 'T001')
    INSERT INTO locations (location_id, location_name) VALUES ('T001', 'North Yard');
IF NOT EXISTS (SELECT 1 FROM locations WHERE location_id = 'T002')
    INSERT INTO locations (location_id, location_name) VALUES ('T002', 'South Yard');
GO

-- Dummy Transporters
IF NOT EXISTS (SELECT 1 FROM transporters WHERE transporter_id = 'V001')
    INSERT INTO transporters (transporter_id, transporter_name) VALUES ('V001', 'Speedy Logistics');
IF NOT EXISTS (SELECT 1 FROM transporters WHERE transporter_id = 'V002')
    INSERT INTO transporters (transporter_id, transporter_name) VALUES ('V002', 'Reliable Transport');
GO

