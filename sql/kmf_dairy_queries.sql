-- ==============================================================================
-- PROJECT: Karnataka Milk Federation (KMF) Dairy Sales & Distribution Analytics
-- AUTHOR: Anil Govind Badiger (Computer Science & Engineering)
-- PURPOSE: SQL Business Intelligence & Analytical Queries
-- DATABASE ENGINE: PostgreSQL / MySQL / SQLite compatible
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DATABASE SCHEMA & DDL SETUP
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS kmf_sales (
    sale_id SERIAL PRIMARY KEY,
    sale_date DATE NOT NULL,
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

-- Indexing for optimized analytical aggregations
CREATE INDEX idx_kmf_date ON kmf_sales(sale_date);
CREATE INDEX idx_kmf_product ON kmf_sales(product);
CREATE INDEX idx_kmf_location ON kmf_sales(location);
CREATE INDEX idx_kmf_category ON kmf_sales(category);

-- ==============================================================================
-- 2. CORE BUSINESS QUESTIONS & ANALYTICAL SQL QUERIES
-- ==============================================================================

-- QUESTION 1: What is the overall total revenue, total quantity, and transaction count?
-- Objective: Establish high-level operational benchmarks for the federation.
SELECT 
    COUNT(*) AS total_transactions,
    SUM(quantity_sold) AS total_units_sold,
    SUM(revenue) AS total_revenue_inr,
    ROUND(AVG(revenue), 2) AS avg_transaction_value,
    ROUND(AVG(quantity_sold), 2) AS avg_units_per_order
FROM kmf_sales;


-- QUESTION 2: Which dairy products generate the highest revenue?
-- Objective: Rank products by financial contribution to identify high-value SKU drivers.
SELECT 
    product,
    category,
    unit_price,
    SUM(quantity_sold) AS total_quantity,
    SUM(revenue) AS total_revenue,
    ROUND((SUM(revenue) * 100.0 / (SELECT SUM(revenue) FROM kmf_sales)), 2) AS revenue_share_pct
FROM kmf_sales
GROUP BY product, category, unit_price
ORDER BY total_revenue DESC;


-- QUESTION 3: Which regional market (Location) records the highest sales revenue?
-- Objective: Evaluate geographic distribution and identify prime consumption hubs across Karnataka.
SELECT 
    location,
    COUNT(*) AS total_orders,
    SUM(quantity_sold) AS total_quantity,
    SUM(revenue) AS total_revenue,
    ROUND((SUM(revenue) * 100.0 / (SELECT SUM(revenue) FROM kmf_sales)), 2) AS market_share_pct
FROM kmf_sales
GROUP BY location
ORDER BY total_revenue DESC;


-- QUESTION 4: What are the monthly sales and revenue trends across the calendar year?
-- Objective: Discover seasonality patterns, festive spikes, and baseline dairy demand.
SELECT 
    EXTRACT(MONTH FROM sale_date) AS month_number,
    TO_CHAR(sale_date, 'Mon') AS month_name,
    COUNT(*) AS transactions,
    SUM(quantity_sold) AS monthly_quantity,
    SUM(revenue) AS monthly_revenue,
    ROUND(AVG(revenue), 2) AS avg_order_value
FROM kmf_sales
GROUP BY EXTRACT(MONTH FROM sale_date), TO_CHAR(sale_date, 'Mon')
ORDER BY month_number ASC;


-- QUESTION 5: Who are the top-performing distributors by volume and revenue throughput?
-- Objective: Measure channel partner performance and distribution network efficacy.
SELECT 
    distributor,
    location,
    COUNT(*) AS dispatch_count,
    SUM(quantity_sold) AS total_units_distributed,
    SUM(revenue) AS total_revenue_generated,
    ROUND(AVG(revenue), 2) AS avg_dispatch_value
FROM kmf_sales
GROUP BY distributor, location
ORDER BY total_revenue_generated DESC;


-- QUESTION 6: Which products have relatively lower sales volume and revenue?
-- Objective: Identify niche, underperforming, or inventory-risk product lines for strategic review.
SELECT 
    product,
    category,
    SUM(quantity_sold) AS total_quantity,
    SUM(revenue) AS total_revenue,
    ROUND(AVG(quantity_sold), 1) AS avg_order_quantity
FROM kmf_sales
GROUP BY product, category
ORDER BY total_revenue ASC
LIMIT 5;


-- QUESTION 7: What is the average quantity sold per transaction by product category?
-- Objective: Understand basket sizes and packaging demand across different dairy categories.
SELECT 
    category,
    COUNT(*) AS transaction_count,
    SUM(quantity_sold) AS total_quantity,
    ROUND(AVG(quantity_sold), 2) AS avg_quantity_sold,
    SUM(revenue) AS category_revenue,
    ROUND((SUM(revenue) * 100.0 / (SELECT SUM(revenue) FROM kmf_sales)), 2) AS revenue_share_pct
FROM kmf_sales
GROUP BY category
ORDER BY category_revenue DESC;


-- ==============================================================================
-- 3. ADVANCED ANALYTICAL SQL (Window Functions, CTEs, & Channel Analytics)
-- ==============================================================================

-- QUERY 8: Cumulative Running Total Revenue and 3-Month Moving Average
WITH monthly_sales AS (
    SELECT 
        EXTRACT(MONTH FROM sale_date) AS m_num,
        TO_CHAR(sale_date, 'Mon') AS m_name,
        SUM(revenue) AS monthly_rev
    FROM kmf_sales
    GROUP BY EXTRACT(MONTH FROM sale_date), TO_CHAR(sale_date, 'Mon')
)
SELECT 
    m_num,
    m_name,
    monthly_rev,
    SUM(monthly_rev) OVER (ORDER BY m_num ASC) AS cumulative_revenue,
    ROUND(AVG(monthly_rev) OVER (ORDER BY m_num ASC ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg_3m
FROM monthly_sales
ORDER BY m_num;


-- QUERY 9: Top-Ranked Product in Each Dairy Category (Window Function DENSE_RANK)
WITH ranked_products AS (
    SELECT 
        category,
        product,
        SUM(revenue) AS product_revenue,
        SUM(quantity_sold) AS product_qty,
        DENSE_RANK() OVER (PARTITION BY category ORDER BY SUM(revenue) DESC) AS rank_in_category
    FROM kmf_sales
    GROUP BY category, product
)
SELECT 
    category,
    product,
    product_revenue,
    product_qty,
    rank_in_category
FROM ranked_products
WHERE rank_in_category = 1
ORDER BY product_revenue DESC;


-- QUERY 10: Customer Channel Profiling (Wholesale vs Retail vs Institutions)
SELECT 
    customer_type,
    COUNT(*) AS order_count,
    SUM(quantity_sold) AS total_units,
    SUM(revenue) AS total_revenue,
    ROUND(AVG(revenue), 2) AS avg_order_revenue,
    ROUND((SUM(revenue) * 100.0 / (SELECT SUM(revenue) FROM kmf_sales)), 2) AS revenue_pct
FROM kmf_sales
GROUP BY customer_type
ORDER BY total_revenue DESC;
