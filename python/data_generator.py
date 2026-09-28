"""
KMF Dairy Sales Data Generator
Generates a realistic, statistically sound synthetic dataset modeled after
Karnataka Milk Federation (KMF) Nandini dairy product sales across Karnataka.

Schema:
- Date: DD-MM-YYYY format (2024 calendar year)
- Product: Authentic KMF Nandini product names
- Category: Milk, Fresh Dairy, Ghee & Butter, Sweets, Beverages, Frozen
- Location: 10 key Karnataka cities/districts
- Distributor: Authorized regional distributors
- Quantity_Sold: Units/Packets sold in transaction
- Unit_Price: Price in INR (₹)
- Revenue: Quantity_Sold * Unit_Price (INR ₹)
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random
import os

# Seed for perfect reproducibility
np.random.seed(42)
random.seed(42)

# Product catalog with category, typical base unit price (INR), base daily volume range
PRODUCTS = [
    # Milk Category (High volume, daily essential)
    {"name": "Nandini Toned Milk (1L)", "category": "Milk", "price": 42, "qty_range": (350, 950), "city_bias": "all"},
    {"name": "Nandini Homogenised Cow Milk (1L)", "category": "Milk", "price": 46, "qty_range": (250, 700), "city_bias": "all"},
    {"name": "Nandini Special Milk (1L)", "category": "Milk", "price": 48, "qty_range": (180, 520), "city_bias": "all"},
    {"name": "Nandini Shubham Milk (1L)", "category": "Milk", "price": 50, "qty_range": (120, 380), "city_bias": "urban"},
    {"name": "Nandini Samrudhi Milk (1L)", "category": "Milk", "price": 54, "qty_range": (90, 260), "city_bias": "urban"},

    # Fresh Dairy Category (High daily volume, perishable)
    {"name": "Nandini Curd (500g)", "category": "Fresh Dairy", "price": 26, "qty_range": (200, 600), "city_bias": "all"},
    {"name": "Nandini Fresh Paneer (200g)", "category": "Fresh Dairy", "price": 95, "qty_range": (60, 240), "city_bias": "urban"},
    {"name": "Nandini Set Curd (400g)", "category": "Fresh Dairy", "price": 40, "qty_range": (50, 180), "city_bias": "urban"},

    # Beverages Category (High summer surge)
    {"name": "Nandini Spiced Buttermilk (200ml)", "category": "Beverages", "price": 12, "qty_range": (300, 900), "city_bias": "hot"},
    {"name": "Nandini Sweet Lassi (200ml)", "category": "Beverages", "price": 20, "qty_range": (150, 480), "city_bias": "all"},
    {"name": "Nandini Flavoured Milk Badam (200ml)", "category": "Beverages", "price": 35, "qty_range": (80, 280), "city_bias": "all"},

    # Ghee & Butter Category (High value, high margin, festival surges)
    {"name": "Nandini Pure Ghee (1L)", "category": "Ghee & Butter", "price": 610, "qty_range": (20, 95), "city_bias": "all"},
    {"name": "Nandini Pure Ghee (500ml)", "category": "Ghee & Butter", "price": 315, "qty_range": (35, 140), "city_bias": "all"},
    {"name": "Nandini Salted Butter (500g)", "category": "Ghee & Butter", "price": 275, "qty_range": (25, 110), "city_bias": "urban"},
    {"name": "Nandini Unsalted Butter (500g)", "category": "Ghee & Butter", "price": 280, "qty_range": (15, 80), "city_bias": "urban"},

    # Sweets Category (High margin, festive demand spikes)
    {"name": "Nandini Mysore Pak (250g)", "category": "Sweets", "price": 160, "qty_range": (30, 120), "city_bias": "mysuru_urban"},
    {"name": "Nandini Milk Peda (250g)", "category": "Sweets", "price": 140, "qty_range": (35, 130), "city_bias": "all"},
    {"name": "Nandini Gulab Jamun (1kg)", "category": "Sweets", "price": 260, "qty_range": (15, 75), "city_bias": "all"},

    # Frozen Category
    {"name": "Nandini Kulfi (50ml)", "category": "Frozen", "price": 25, "qty_range": (70, 260), "city_bias": "hot"},
    {"name": "Nandini Cassata Ice Cream (150ml)", "category": "Frozen", "price": 55, "qty_range": (40, 160), "city_bias": "urban"}
]

# Locations with relative weight / market share and assigned primary distributors
LOCATIONS_DISTRIBUTORS = [
    {"location": "Bengaluru", "distributor": "Apex Dairy Supplies Bengaluru", "weight": 0.38, "type": "urban"},
    {"location": "Mysuru", "distributor": "Chamundi Agencies Mysuru", "weight": 0.14, "type": "mysuru_urban"},
    {"location": "Hubballi", "distributor": "Kittur Distributors Hubballi", "weight": 0.11, "type": "hot"},
    {"location": "Mangaluru", "distributor": "Coastal Cool Logistics Mangaluru", "weight": 0.09, "type": "coastal"},
    {"location": "Belagavi", "distributor": "North Karnataka Milk Center Belagavi", "weight": 0.07, "type": "regular"},
    {"location": "Kalaburagi", "distributor": "Kalyana Karnataka Foods Kalaburagi", "weight": 0.06, "type": "hot"},
    {"location": "Davanagere", "distributor": "Central Karnataka Traders Davanagere", "weight": 0.05, "type": "regular"},
    {"location": "Shivamogga", "distributor": "Malnad Dairy Network Shivamogga", "weight": 0.04, "type": "regular"},
    {"location": "Ballari", "distributor": "Tungabhadra Dairy Logistics Ballari", "weight": 0.035, "type": "hot"},
    {"location": "Tumakuru", "distributor": "Siddaganga Milk Express Tumakuru", "weight": 0.025, "type": "urban"}
]

CUSTOMER_TYPES = [
    {"type": "Retail", "weight": 0.45},
    {"type": "Supermarket", "weight": 0.22},
    {"type": "Wholesale", "weight": 0.15},
    {"type": "Hotel / Restaurant", "weight": 0.12},
    {"type": "Institution", "weight": 0.06}
]

PAYMENT_MODES = [
    {"mode": "UPI", "weight": 0.48},
    {"mode": "Net Banking", "weight": 0.20},
    {"mode": "Cash", "weight": 0.16},
    {"mode": "Credit Card", "weight": 0.09},
    {"mode": "Distributor Credit", "weight": 0.07}
]

def generate_kmf_sales_dataset(num_records=5000):
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2024, 12, 31)
    days_range = (end_date - start_date).days + 1

    records = []

    loc_weights = [item["weight"] for item in LOCATIONS_DISTRIBUTORS]
    cust_types = [c["type"] for c in CUSTOMER_TYPES]
    cust_weights = [c["weight"] for c in CUSTOMER_TYPES]
    pay_modes = [p["mode"] for p in PAYMENT_MODES]
    pay_weights = [p["weight"] for p in PAYMENT_MODES]

    for i in range(num_records):
        day_offset = random.randint(0, days_range - 1)
        record_date = start_date + timedelta(days=day_offset)
        month = record_date.month
        weekday = record_date.weekday()
        is_weekend = weekday >= 5

        loc_info = random.choices(LOCATIONS_DISTRIBUTORS, weights=loc_weights, k=1)[0]
        location = loc_info["location"]
        distributor = loc_info["distributor"]

        product = random.choice(PRODUCTS)
        min_q, max_q = product["qty_range"]
        base_qty = random.randint(min_q, max_q)

        multiplier = 1.0
        if location == "Bengaluru":
            multiplier *= 1.35
        elif location == "Mysuru":
            multiplier *= 1.15

        if month in [3, 4, 5]:
            if product["category"] in ["Beverages", "Frozen"] or "Curd" in product["name"]:
                multiplier *= 1.55
            elif location in ["Kalaburagi", "Ballari", "Hubballi"]:
                multiplier *= 1.25

        if month in [8, 9, 10, 11]:
            if product["category"] in ["Ghee & Butter", "Sweets"]:
                multiplier *= 1.70
                if location == "Mysuru" and month == 10:
                    multiplier *= 1.50

        if is_weekend:
            if product["name"] in ["Nandini Fresh Paneer (200g)", "Nandini Cassata Ice Cream (150ml)"] or product["category"] == "Sweets":
                multiplier *= 1.30

        cust_type = random.choices(cust_types, weights=cust_weights, k=1)[0]
        if cust_type in ["Wholesale", "Institution"]:
            multiplier *= 1.8
        elif cust_type == "Hotel / Restaurant":
            multiplier *= 1.4

        noise = np.random.normal(1.0, 0.06)
        final_qty = max(5, int(base_qty * multiplier * noise))

        unit_price = product["price"]
        revenue = final_qty * unit_price

        pay_mode = random.choices(pay_modes, weights=pay_weights, k=1)[0]

        records.append({
            "Date": record_date.strftime("%d-%m-%Y"),
            "_sort_date": record_date,
            "Product": product["name"],
            "Category": product["category"],
            "Location": location,
            "Distributor": distributor,
            "Quantity_Sold": final_qty,
            "Unit_Price": unit_price,
            "Revenue": revenue,
            "Customer_Type": cust_type,
            "Payment_Mode": pay_mode
        })

    records.sort(key=lambda x: x["_sort_date"])
    for r in records:
        del r["_sort_date"]

    df = pd.DataFrame(records)
    return df

def create_raw_messy_dataset(clean_df):
    """
    Creates a realistic raw dataset with real-world flaws:
    - 18 duplicate rows
    - 32 missing values in non-critical columns
    - Inconsistent product names / casing
    - Inconsistent location casing / whitespace
    - 5 invalid prices or negative values
    """
    raw_df = clean_df.copy()

    # 1. Add 18 duplicate rows
    duplicate_indices = np.random.choice(len(raw_df), size=18, replace=False)
    duplicates = raw_df.iloc[duplicate_indices].copy()
    raw_df = pd.concat([raw_df, duplicates], ignore_index=True)

    # 2. Add 32 missing values (NaN) in Payment_Mode and Customer_Type
    nan_indices_pay = np.random.choice(len(raw_df), size=18, replace=False)
    nan_indices_cust = np.random.choice(len(raw_df), size=14, replace=False)
    raw_df.loc[nan_indices_pay, "Payment_Mode"] = np.nan
    raw_df.loc[nan_indices_cust, "Customer_Type"] = np.nan

    # 3. Add 5 invalid/negative prices
    invalid_price_idx = np.random.choice(len(raw_df), size=5, replace=False)
    for idx in invalid_price_idx:
        raw_df.loc[idx, "Unit_Price"] = -1 * abs(raw_df.loc[idx, "Unit_Price"])

    # 4. Inconsistent product strings (casing/whitespace)
    inconsistent_prod_idx = np.random.choice(len(raw_df), size=25, replace=False)
    for idx in inconsistent_prod_idx:
        val = raw_df.loc[idx, "Product"]
        raw_df.loc[idx, "Product"] = f"  {val.lower()}  " if random.random() > 0.5 else val.upper()

    # 5. Inconsistent location names
    inconsistent_loc_idx = np.random.choice(len(raw_df), size=20, replace=False)
    for idx in inconsistent_loc_idx:
        loc = raw_df.loc[idx, "Location"]
        raw_df.loc[idx, "Location"] = f"{loc.lower()} "

    return raw_df

if __name__ == "__main__":
    os.makedirs("dataset", exist_ok=True)
    
    clean_df = generate_kmf_sales_dataset(num_records=4982)
    raw_df = create_raw_messy_dataset(clean_df)

    clean_path = "dataset/kmf_cleaned_dairy_sales.csv"
    raw_path = "dataset/kmf_raw_dairy_sales.csv"

    clean_df.to_csv(clean_path, index=False)
    raw_df.to_csv(raw_path, index=False)

    print(f"Clean dataset saved: {clean_path} ({len(clean_df)} rows)")
    print(f"Raw dataset saved: {raw_path} ({len(raw_df)} rows)")
    print("Total Revenue Clean: Rs.", f"{clean_df['Revenue'].sum():,}")
    print("Total Quantity Clean:", f"{clean_df['Quantity_Sold'].sum():,}")
