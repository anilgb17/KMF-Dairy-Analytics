"""
KMF Dairy Sales - Exploratory Data Analysis & Analytics Aggregator
Author: Anil Govind Badiger
Description:
Computes comprehensive sales analytics, revenue trends, category breakdowns,
location metrics, distributor performance, and SQL verification metrics.
Exports analytics JSON for the interactive web dashboard.
"""

import pandas as pd
import numpy as np
import json
import os

def run_eda(csv_path="dataset/kmf_cleaned_dairy_sales.csv"):
    df = pd.read_csv(csv_path)
    df["Date"] = pd.to_datetime(df["Date"], format="%d-%m-%Y")
    df["Month_Name"] = df["Date"].dt.strftime("%b")
    df["Month_Num"] = df["Date"].dt.month
    df["Year"] = df["Date"].dt.year
    df["Quarter"] = "Q" + df["Date"].dt.quarter.astype(str)

    # 1. High-Level Overall KPIs
    total_revenue = int(df["Revenue"].sum())
    total_quantity = int(df["Quantity_Sold"].sum())
    total_transactions = int(len(df))
    avg_order_value = round(float(df["Revenue"].mean()), 2)
    avg_quantity = round(float(df["Quantity_Sold"].mean()), 2)
    unique_products = int(df["Product"].nunique())
    unique_locations = int(df["Location"].nunique())
    unique_distributors = int(df["Distributor"].nunique())
    unique_categories = int(df["Category"].nunique())

    # 2. Monthly Trend (Chronological)
    month_order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_grp = df.groupby(["Month_Num", "Month_Name"]).agg(
        revenue=("Revenue", "sum"),
        quantity=("Quantity_Sold", "sum"),
        transactions=("Date", "count")
    ).reset_index().sort_values("Month_Num")

    monthly_data = []
    for _, row in monthly_grp.iterrows():
        monthly_data.append({
            "month": row["Month_Name"],
            "month_num": int(row["Month_Num"]),
            "revenue": int(row["revenue"]),
            "quantity": int(row["quantity"]),
            "transactions": int(row["transactions"])
        })

    # Peak Month
    peak_month_row = monthly_grp.loc[monthly_grp["revenue"].idxmax()]
    lowest_month_row = monthly_grp.loc[monthly_grp["revenue"].idxmin()]
    peak_month = {"month": peak_month_row["Month_Name"], "revenue": int(peak_month_row["revenue"])}
    lowest_month = {"month": lowest_month_row["Month_Name"], "revenue": int(lowest_month_row["revenue"])}

    # 3. Product Performance Analysis
    prod_grp = df.groupby(["Product", "Category"]).agg(
        revenue=("Revenue", "sum"),
        quantity=("Quantity_Sold", "sum"),
        unit_price=("Unit_Price", "first"),
        transactions=("Date", "count")
    ).reset_index()
    prod_grp["revenue_share_pct"] = round((prod_grp["revenue"] / total_revenue) * 100, 2)
    prod_grp["quantity_share_pct"] = round((prod_grp["quantity"] / total_quantity) * 100, 2)
    prod_grp = prod_grp.sort_values(by="revenue", ascending=False).reset_index(drop=True)

    products_list = []
    for rank, row in prod_grp.iterrows():
        products_list.append({
            "rank": rank + 1,
            "product": row["Product"],
            "category": row["Category"],
            "unit_price": int(row["unit_price"]),
            "quantity": int(row["quantity"]),
            "revenue": int(row["revenue"]),
            "transactions": int(row["transactions"]),
            "revenue_share_pct": float(row["revenue_share_pct"]),
            "quantity_share_pct": float(row["quantity_share_pct"])
        })

    top_revenue_prod = products_list[0]
    top_qty_prod = sorted(products_list, key=lambda x: x["quantity"], reverse=True)[0]
    
    # Low volume high revenue (e.g. Pure Ghee)
    # High volume low revenue (e.g. Buttermilk / Curd / Toned milk)
    high_qty_low_rev = max(products_list, key=lambda x: (x["quantity_share_pct"] - x["revenue_share_pct"]))
    low_qty_high_rev = max(products_list, key=lambda x: (x["revenue_share_pct"] - x["quantity_share_pct"]))

    # 4. Category Performance
    cat_grp = df.groupby("Category").agg(
        revenue=("Revenue", "sum"),
        quantity=("Quantity_Sold", "sum"),
        transactions=("Date", "count")
    ).reset_index().sort_values(by="revenue", ascending=False)
    cat_grp["revenue_share_pct"] = round((cat_grp["revenue"] / total_revenue) * 100, 2)

    categories_list = []
    for _, row in cat_grp.iterrows():
        categories_list.append({
            "category": row["Category"],
            "revenue": int(row["revenue"]),
            "quantity": int(row["quantity"]),
            "transactions": int(row["transactions"]),
            "revenue_share_pct": float(row["revenue_share_pct"])
        })

    # 5. Location / Regional Analysis
    loc_grp = df.groupby("Location").agg(
        revenue=("Revenue", "sum"),
        quantity=("Quantity_Sold", "sum"),
        transactions=("Date", "count")
    ).reset_index()
    loc_grp["revenue_share_pct"] = round((loc_grp["revenue"] / total_revenue) * 100, 2)
    loc_grp = loc_grp.sort_values(by="revenue", ascending=False).reset_index(drop=True)

    locations_list = []
    for rank, row in loc_grp.iterrows():
        locations_list.append({
            "rank": rank + 1,
            "location": row["Location"],
            "revenue": int(row["revenue"]),
            "quantity": int(row["quantity"]),
            "transactions": int(row["transactions"]),
            "revenue_share_pct": float(row["revenue_share_pct"])
        })

    top_location = locations_list[0]
    
    # Location by Monthly Matrix
    loc_monthly = df.pivot_table(index="Location", columns="Month_Name", values="Revenue", aggfunc="sum", fill_value=0)
    # Reindex columns
    loc_monthly = loc_monthly.reindex(columns=month_order)
    loc_monthly_dict = loc_monthly.to_dict(orient="index")

    # 6. Distributor Analysis
    dist_grp = df.groupby(["Distributor", "Location"]).agg(
        revenue=("Revenue", "sum"),
        quantity=("Quantity_Sold", "sum"),
        transactions=("Date", "count")
    ).reset_index()
    dist_grp["revenue_share_pct"] = round((dist_grp["revenue"] / total_revenue) * 100, 2)
    dist_grp["avg_transaction_revenue"] = round(dist_grp["revenue"] / dist_grp["transactions"], 2)
    dist_grp = dist_grp.sort_values(by="revenue", ascending=False).reset_index(drop=True)

    distributors_list = []
    for rank, row in dist_grp.iterrows():
        distributors_list.append({
            "rank": rank + 1,
            "distributor": row["Distributor"],
            "location": row["Location"],
            "revenue": int(row["revenue"]),
            "quantity": int(row["quantity"]),
            "transactions": int(row["transactions"]),
            "revenue_share_pct": float(row["revenue_share_pct"]),
            "avg_transaction_revenue": float(row["avg_transaction_revenue"])
        })

    top_distributor = distributors_list[0]

    # 7. Customer Type Analysis
    cust_grp = df.groupby("Customer_Type").agg(
        revenue=("Revenue", "sum"),
        quantity=("Quantity_Sold", "sum"),
        transactions=("Date", "count")
    ).reset_index()
    cust_grp["revenue_share_pct"] = round((cust_grp["revenue"] / total_revenue) * 100, 2)
    cust_grp["avg_basket_size"] = round(cust_grp["quantity"] / cust_grp["transactions"], 1)
    cust_grp["avg_transaction_val"] = round(cust_grp["revenue"] / cust_grp["transactions"], 2)
    cust_grp = cust_grp.sort_values(by="revenue", ascending=False).reset_index(drop=True)

    customer_types_list = []
    for _, row in cust_grp.iterrows():
        customer_types_list.append({
            "customer_type": row["Customer_Type"],
            "revenue": int(row["revenue"]),
            "quantity": int(row["quantity"]),
            "transactions": int(row["transactions"]),
            "revenue_share_pct": float(row["revenue_share_pct"]),
            "avg_basket_size": float(row["avg_basket_size"]),
            "avg_transaction_val": float(row["avg_transaction_val"])
        })

    # 8. Payment Mode Analysis
    pay_grp = df.groupby("Payment_Mode").agg(
        revenue=("Revenue", "sum"),
        transactions=("Date", "count")
    ).reset_index().sort_values(by="revenue", ascending=False)
    pay_grp["share_pct"] = round((pay_grp["revenue"] / total_revenue) * 100, 2)
    
    payments_list = []
    for _, row in pay_grp.iterrows():
        payments_list.append({
            "payment_mode": row["Payment_Mode"],
            "revenue": int(row["revenue"]),
            "transactions": int(row["transactions"]),
            "share_pct": float(row["share_pct"])
        })

    # 9. Quantity vs Revenue Scatter Data (Sample of 300 points for smooth charting)
    scatter_sample = df.sample(n=min(300, len(df)), random_state=42)[["Quantity_Sold", "Revenue", "Product", "Category"]].to_dict(orient="records")

    eda_summary = {
        "kpis": {
            "total_revenue": total_revenue,
            "total_revenue_formatted": f"Rs. {total_revenue / 10000000:.2f} Cr (Rs. {total_revenue:,})",
            "total_quantity": total_quantity,
            "total_quantity_formatted": f"{total_quantity:,} units",
            "total_transactions": total_transactions,
            "avg_order_value": avg_order_value,
            "avg_quantity": avg_quantity,
            "unique_products": unique_products,
            "unique_locations": unique_locations,
            "unique_distributors": unique_distributors,
            "unique_categories": unique_categories,
            "peak_month": peak_month,
            "lowest_month": lowest_month,
            "top_product_revenue": top_revenue_prod["product"],
            "top_product_quantity": top_qty_prod["product"],
            "top_location": top_location["location"],
            "top_distributor": top_distributor["distributor"]
        },
        "monthly_data": monthly_data,
        "products": products_list,
        "categories": categories_list,
        "locations": locations_list,
        "location_monthly": loc_monthly_dict,
        "distributors": distributors_list,
        "customer_types": customer_types_list,
        "payments": payments_list,
        "scatter_sample": scatter_sample,
        "special_insights": {
            "high_qty_low_rev": high_qty_low_rev,
            "low_qty_high_rev": low_qty_high_rev
        }
    }

    os.makedirs("dataset", exist_ok=True)
    with open("dataset/eda_summary.json", "w", encoding="utf-8") as f:
        json.dump(eda_summary, f, indent=2)

    print("=" * 60)
    print("KMF DAIRY SALES - EDA COMPLETE")
    print("=" * 60)
    print(f"Total Revenue: Rs. {total_revenue:,} ({total_revenue / 10000000:.2f} Cr)")
    print(f"Total Quantity: {total_quantity:,} units")
    print(f"Top Product by Revenue: {top_revenue_prod['product']} (Rs. {top_revenue_prod['revenue']:,})")
    print(f"Top Product by Volume: {top_qty_prod['product']} ({top_qty_prod['quantity']:,} units)")
    print(f"Top Location: {top_location['location']} (Rs. {top_location['revenue']:,} - {top_location['revenue_share_pct']}%)")
    print(f"Top Distributor: {top_distributor['distributor']} (Rs. {top_distributor['revenue']:,})")
    print(f"Peak Month: {peak_month['month']} (Rs. {peak_month['revenue']:,})")
    print("Saved eda_summary.json successfully.")
    print("=" * 60)

    return eda_summary

if __name__ == "__main__":
    run_eda()
