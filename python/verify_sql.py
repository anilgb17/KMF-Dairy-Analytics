"""
Execute SQL Queries on SQLite database to verify correctness and export query results for interactive Web Runner
"""
import sqlite3
import pandas as pd
import json

def verify_and_export_sql_results():
    df = pd.read_csv("dataset/kmf_cleaned_dairy_sales.csv")
    conn = sqlite3.connect(":memory:")
    
    # Write to table
    df.to_sql("kmf_sales", conn, index=False, if_exists="replace")
    
    queries = [
        {
            "id": "q1",
            "title": "Total Revenue, Units Sold & Order Averages",
            "question": "What is total revenue, total quantity, and transaction count?",
            "sql": """SELECT 
    COUNT(*) AS total_transactions,
    SUM(Quantity_Sold) AS total_units_sold,
    SUM(Revenue) AS total_revenue_inr,
    ROUND(AVG(Revenue), 2) AS avg_transaction_value,
    ROUND(AVG(Quantity_Sold), 2) AS avg_units_per_order
FROM kmf_sales;"""
        },
        {
            "id": "q2",
            "title": "Highest Revenue Generating Products",
            "question": "Which dairy products generate the highest revenue?",
            "sql": """SELECT 
    Product,
    Category,
    Unit_Price,
    SUM(Quantity_Sold) AS total_quantity,
    SUM(Revenue) AS total_revenue,
    ROUND((SUM(Revenue) * 100.0 / (SELECT SUM(Revenue) FROM kmf_sales)), 2) AS revenue_share_pct
FROM kmf_sales
GROUP BY Product, Category, Unit_Price
ORDER BY total_revenue DESC;"""
        },
        {
            "id": "q3",
            "title": "Top Regional Markets by Sales Revenue",
            "question": "Which location has the highest sales revenue?",
            "sql": """SELECT 
    Location,
    COUNT(*) AS total_orders,
    SUM(Quantity_Sold) AS total_quantity,
    SUM(Revenue) AS total_revenue,
    ROUND((SUM(Revenue) * 100.0 / (SELECT SUM(Revenue) FROM kmf_sales)), 2) AS market_share_pct
FROM kmf_sales
GROUP BY Location
ORDER BY total_revenue DESC;"""
        },
        {
            "id": "q4",
            "title": "Monthly Sales & Seasonality Breakdown",
            "question": "What are monthly sales and revenue trends?",
            "sql": """SELECT 
    SUBSTR(Date, 4, 2) AS month_num,
    COUNT(*) AS transactions,
    SUM(Quantity_Sold) AS monthly_quantity,
    SUM(Revenue) AS monthly_revenue,
    ROUND(AVG(Revenue), 2) AS avg_order_value
FROM kmf_sales
GROUP BY month_num
ORDER BY month_num ASC;"""
        },
        {
            "id": "q5",
            "title": "Top Performing Regional Distributors",
            "question": "Who are the top distributors by throughput & revenue?",
            "sql": """SELECT 
    Distributor,
    Location,
    COUNT(*) AS dispatch_count,
    SUM(Quantity_Sold) AS total_units_distributed,
    SUM(Revenue) AS total_revenue_generated,
    ROUND(AVG(Revenue), 2) AS avg_dispatch_value
FROM kmf_sales
GROUP BY Distributor, Location
ORDER BY total_revenue_generated DESC;"""
        },
        {
            "id": "q6",
            "title": "Products with Low Sales Volume",
            "question": "Which products have relatively lower sales and revenue?",
            "sql": """SELECT 
    Product,
    Category,
    SUM(Quantity_Sold) AS total_quantity,
    SUM(Revenue) AS total_revenue,
    ROUND(AVG(Quantity_Sold), 1) AS avg_order_quantity
FROM kmf_sales
GROUP BY Product, Category
ORDER BY total_revenue ASC
LIMIT 5;"""
        },
        {
            "id": "q7",
            "title": "Average Quantity Sold by Category",
            "question": "What is the average quantity sold per transaction by category?",
            "sql": """SELECT 
    Category,
    COUNT(*) AS transaction_count,
    SUM(Quantity_Sold) AS total_quantity,
    ROUND(AVG(Quantity_Sold), 2) AS avg_quantity_sold,
    SUM(Revenue) AS category_revenue,
    ROUND((SUM(Revenue) * 100.0 / (SELECT SUM(Revenue) FROM kmf_sales)), 2) AS revenue_share_pct
FROM kmf_sales
GROUP BY Category
ORDER BY category_revenue DESC;"""
        },
        {
            "id": "q8",
            "title": "Customer Segment Revenue Contribution",
            "question": "How do customer segments (Wholesale, Retail, etc.) compare?",
            "sql": """SELECT 
    Customer_Type,
    COUNT(*) AS order_count,
    SUM(Quantity_Sold) AS total_units,
    SUM(Revenue) AS total_revenue,
    ROUND(AVG(Revenue), 2) AS avg_order_revenue,
    ROUND((SUM(Revenue) * 100.0 / (SELECT SUM(Revenue) FROM kmf_sales)), 2) AS revenue_pct
FROM kmf_sales
GROUP BY Customer_Type
ORDER BY total_revenue DESC;"""
        }
    ]
    
    sql_results = []
    month_names = {"01":"Jan", "02":"Feb", "03":"Mar", "04":"Apr", "05":"May", "06":"Jun", "07":"Jul", "08":"Aug", "09":"Sep", "10":"Oct", "11":"Nov", "12":"Dec"}
    
    for q in queries:
        res_df = pd.read_sql_query(q["sql"], conn)
        if "month_num" in res_df.columns:
            res_df["month_name"] = res_df["month_num"].map(month_names)
        
        sql_results.append({
            "id": q["id"],
            "title": q["title"],
            "question": q["question"],
            "sql": q["sql"].strip(),
            "columns": list(res_df.columns),
            "rows": res_df.to_dict(orient="records"),
            "row_count": len(res_df)
        })
        print(f"Verified Query {q['id']}: '{q['title']}' -> {len(res_df)} rows returned.")
        
    with open("dataset/sql_results.json", "w", encoding="utf-8") as f:
        json.dump(sql_results, f, indent=2)
    print("Saved verified query results to dataset/sql_results.json")

if __name__ == "__main__":
    verify_and_export_sql_results()
