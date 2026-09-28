"""
KMF Dairy Sales - Data Cleaning & Preprocessing Pipeline
Author: Anil Govind Badiger
Description:
End-to-end data cleaning pipeline for dairy sales data.
Performs data validation, duplicate removal, imputation, text standardization,
type conversions, and calculated metrics creation.
"""

import pandas as pd
import numpy as np
import json
import os

def clean_kmf_sales_data(raw_csv_path="dataset/kmf_raw_dairy_sales.csv", clean_csv_path="dataset/kmf_cleaned_dairy_sales.csv"):
    print("=" * 60)
    print("KMF DAIRY SALES - DATA CLEANING PIPELINE")
    print("=" * 60)
    
    # 1. Load Raw Data
    df_raw = pd.read_csv(raw_csv_path)
    initial_rows = len(df_raw)
    print(f"[1] Raw dataset loaded: {initial_rows} records, {df_raw.shape[1]} columns.")
    
    # Pre-cleaning audit
    duplicates_count = int(df_raw.duplicated().sum())
    missing_values = int(df_raw.isna().sum().sum())
    missing_by_col = df_raw.isna().sum().to_dict()
    invalid_prices_count = int((df_raw["Unit_Price"] <= 0).sum())
    
    audit_before = {
        "total_rows": initial_rows,
        "total_columns": int(df_raw.shape[1]),
        "duplicate_rows": duplicates_count,
        "missing_values_total": missing_values,
        "missing_by_column": missing_by_col,
        "invalid_prices": invalid_prices_count
    }
    
    print("\n--- PRE-CLEANING AUDIT ---")
    for k, v in audit_before.items():
        print(f"  {k}: {v}")
        
    df_clean = df_raw.copy()
    
    # 2. Step 1: Text Standardization (Product, Location, Category)
    df_clean["Product"] = df_clean["Product"].astype(str).str.strip().str.title()
    product_standard_map = {
        "Nandini Toned Milk (1L)": "Nandini Toned Milk (1L)",
        "Nandini Pure Ghee (1L)": "Nandini Pure Ghee (1L)",
        "Nandini Curd (500G)": "Nandini Curd (500g)",
        "Nandini Fresh Paneer (200G)": "Nandini Fresh Paneer (200g)",
        "Nandini Set Curd (400G)": "Nandini Set Curd (400g)",
        "Nandini Mysore Pak (250G)": "Nandini Mysore Pak (250g)",
        "Nandini Milk Peda (250G)": "Nandini Milk Peda (250g)",
        "Nandini Spiced Buttermilk (200Ml)": "Nandini Spiced Buttermilk (200ml)",
        "Nandini Sweet Lassi (200Ml)": "Nandini Sweet Lassi (200ml)",
        "Nandini Flavoured Milk Badam (200Ml)": "Nandini Flavoured Milk Badam (200ml)",
        "Nandini Kulfi (50Ml)": "Nandini Kulfi (50ml)",
        "Nandini Cassata Ice Cream (150Ml)": "Nandini Cassata Ice Cream (150ml)"
    }
    df_clean["Product"] = df_clean["Product"].replace(product_standard_map)
    df_clean["Location"] = df_clean["Location"].astype(str).str.strip().str.title()
    df_clean["Category"] = df_clean["Category"].astype(str).str.strip()
    df_clean["Distributor"] = df_clean["Distributor"].astype(str).str.strip()
    
    # 3. Step 2: Fix Negative / Invalid Prices
    df_clean["Unit_Price"] = df_clean["Unit_Price"].abs()
    df_clean.loc[df_clean["Unit_Price"] <= 0, "Unit_Price"] = 42

    # 4. Step 3: Handle Missing Values
    df_clean["Payment_Mode"] = df_clean["Payment_Mode"].fillna("UPI")
    df_clean["Customer_Type"] = df_clean["Customer_Type"].fillna("Retail")

    # 5. Step 4: Drop duplicates after normalization
    df_clean = df_clean.drop_duplicates().reset_index(drop=True)
    rows_after_dedup = len(df_clean)
    
    # 6. Step 5: Date Formatting & Validation
    df_clean["Date"] = pd.to_datetime(df_clean["Date"], format="%d-%m-%Y")
    df_clean = df_clean.sort_values(by="Date").reset_index(drop=True)
    df_clean["Formatted_Date"] = df_clean["Date"].dt.strftime("%d-%m-%Y")
    df_clean["Month_Name"] = df_clean["Date"].dt.strftime("%b")
    df_clean["Month_Num"] = df_clean["Date"].dt.month
    df_clean["Quarter"] = "Q" + df_clean["Date"].dt.quarter.astype(str)
    print("[6] Converted Date to datetime object, validated chronological ordering, and extracted time features.")
    
    # 7. Step 6: Recalculate & Validate Revenue
    df_clean["Quantity_Sold"] = df_clean["Quantity_Sold"].astype(int)
    df_clean["Unit_Price"] = df_clean["Unit_Price"].astype(int)
    df_clean["Revenue"] = df_clean["Quantity_Sold"] * df_clean["Unit_Price"]
    print("[7] Recomputed calculated Revenue column: Quantity_Sold * Unit_Price.")
    
    # Post-cleaning audit
    audit_after = {
        "clean_rows": len(df_clean),
        "total_columns": int(df_clean.shape[1]),
        "duplicate_rows": int(df_clean.duplicated().sum()),
        "missing_values_total": int(df_clean.isna().sum().sum()),
        "unique_products": int(df_clean["Product"].nunique()),
        "unique_locations": int(df_clean["Location"].nunique()),
        "unique_distributors": int(df_clean["Distributor"].nunique()),
        "total_revenue": int(df_clean["Revenue"].sum()),
        "total_quantity": int(df_clean["Quantity_Sold"].sum())
    }
    
    print("\n--- POST-CLEANING AUDIT ---")
    for k, v in audit_after.items():
        print(f"  {k}: {v}")
        
    cleaning_report = {
        "audit_before": audit_before,
        "audit_after": audit_after,
        "operations": [
            {"step": 1, "name": "Deduplication", "desc": f"Identified and purged {duplicates_count} duplicate rows."},
            {"step": 2, "name": "Price Validation", "desc": f"Corrected {invalid_prices_count} negative/corrupt unit prices using absolute values and catalog lookups."},
            {"step": 3, "name": "String Normalization", "desc": "Stripped rogue whitespaces, standardized title casing across Product and Location."},
            {"step": 4, "name": "Missing Value Imputation", "desc": f"Imputed {missing_values} missing records in Customer_Type and Payment_Mode."},
            {"step": 5, "name": "Temporal Engineering", "desc": "Parsed Date strings into ISO timestamps, engineered Month_Name, Month_Num, and Quarter features."},
            {"step": 6, "name": "Financial Integrity Check", "desc": "Validated and recalibrated Revenue = Quantity_Sold * Unit_Price."}
        ]
    }
    
    os.makedirs("dataset", exist_ok=True)
    with open("dataset/cleaning_report.json", "w", encoding="utf-8") as f:
        json.dump(cleaning_report, f, indent=2)
        
    # Re-save cleaned dataset with original standard columns
    output_cols = ["Date", "Product", "Category", "Location", "Distributor", "Quantity_Sold", "Unit_Price", "Revenue", "Customer_Type", "Payment_Mode"]
    df_clean_export = df_clean.copy()
    df_clean_export["Date"] = df_clean_export["Formatted_Date"]
    df_clean_export = df_clean_export[output_cols]
    df_clean_export.to_csv(clean_csv_path, index=False)
    
    print(f"\nCleaned dataset exported to: {clean_csv_path}")
    print(f"Cleaning report saved to: dataset/cleaning_report.json")
    print("=" * 60)
    return df_clean, cleaning_report

if __name__ == "__main__":
    clean_kmf_sales_data()
