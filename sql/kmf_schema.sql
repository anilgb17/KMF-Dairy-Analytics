-- ==============================================================================
-- DATABASE SCHEMA: Karnataka Milk Federation (KMF) Sales & Distribution
-- Target: PostgreSQL / MySQL / SQLite
-- ==============================================================================

DROP TABLE IF EXISTS kmf_sales;

CREATE TABLE kmf_sales (
    sale_id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    product VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    location VARCHAR(50) NOT NULL,
    distributor VARCHAR(150) NOT NULL,
    quantity_sold INT NOT NULL CHECK (quantity_sold > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
    revenue NUMERIC(12, 2) NOT NULL CHECK (revenue > 0),
    customer_type VARCHAR(50) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL
);

-- Performance Optimization Indexes
CREATE INDEX idx_kmf_sales_date ON kmf_sales(date);
CREATE INDEX idx_kmf_sales_product ON kmf_sales(product);
CREATE INDEX idx_kmf_sales_category ON kmf_sales(category);
CREATE INDEX idx_kmf_sales_location ON kmf_sales(location);
CREATE INDEX idx_kmf_sales_distributor ON kmf_sales(distributor);
CREATE INDEX idx_kmf_sales_customer ON kmf_sales(customer_type);
