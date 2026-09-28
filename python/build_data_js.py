"""
Generate dashboard/data.js containing all cleaned data, EDA aggregates,
SQL queries and results, and cleaning audit data for the Web App.
"""
import pandas as pd
import json
import os

def build_dashboard_data():
    os.makedirs("dashboard", exist_ok=True)
    
    # 1. Load Clean Data
    clean_csv_path = "dataset/kmf_cleaned_dairy_sales.csv"
    raw_csv_path = "dataset/kmf_raw_dairy_sales.csv"
    
    df_clean = pd.read_csv(clean_csv_path)
    df_raw = pd.read_csv(raw_csv_path)
    
    # 2. Load Cleaning Report
    with open("dataset/cleaning_report.json", "r", encoding="utf-8") as f:
        cleaning_report = json.load(f)
        
    # 3. Load EDA Summary
    with open("dataset/eda_summary.json", "r", encoding="utf-8") as f:
        eda_summary = json.load(f)
        
    # 4. Load SQL Results
    with open("dataset/sql_results.json", "r", encoding="utf-8") as f:
        sql_results = json.load(f)
        
    # 5. Prepare compact records for client-side filtering
    # Dates are DD-MM-YYYY
    records_clean = df_clean.to_dict(orient="records")
    
    # Raw records sample for preview
    records_raw_sample = df_raw.head(100).to_dict(orient="records")
    
    # Build complete data object
    data_bundle = {
        "metadata": {
            "project_name": "KMF Dairy Sales & Distribution Analytics",
            "subtitle": "Dairy Sales & Distribution Analytics Dashboard",
            "author": "Anil Govind Badiger",
            "qualification": "Computer Science & Engineering Graduate",
            "dataset_note": "This project uses a synthetic/academic dataset modeled around a dairy sales and distribution scenario. It does not represent confidential KMF data.",
            "time_period": "01-Jan-2024 to 31-Dec-2024",
            "currency": "INR",
            "currency_symbol": "₹"
        },
        "cleaning_report": cleaning_report,
        "eda_summary": eda_summary,
        "sql_results": sql_results,
        "raw_preview": records_raw_sample,
        "raw_stats": {
            "total_rows": len(df_raw),
            "missing_values": int(df_raw.isna().sum().sum()),
            "duplicate_rows": int(df_raw.duplicated().sum()),
            "invalid_prices": int((df_raw["Unit_Price"] <= 0).sum()),
            "unique_products": int(df_raw["Product"].nunique()),
            "unique_locations": int(df_raw["Location"].nunique())
        },
        "all_records": records_clean
    }
    
    output_js_path = "dashboard/data.js"
    with open(output_js_path, "w", encoding="utf-8") as f:
        f.write("// KMF Dairy Analytics Data Store - Auto-generated\n")
        f.write("window.KMF_DATA = ")
        json.dump(data_bundle, f, ensure_ascii=False, indent=None)
        f.write(";\n")
        
    print(f"Generated {output_js_path} successfully ({os.path.getsize(output_js_path) / 1024:.1f} KB).")

if __name__ == "__main__":
    build_dashboard_data()
