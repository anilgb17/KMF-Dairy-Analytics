# Power BI Dashboard Implementation Guide
## Project: KMF Dairy Sales & Distribution Analytics
**Author:** Anil Govind Badiger  
**Target:** Microsoft Power BI Desktop & Service  

---

### 1. Data Ingestion & Star Schema Modeling
1. Load `dataset/kmf_cleaned_dairy_sales.csv` using Power Query.
2. Verify Data Types:
   - `Date`: Date (DD-MM-YYYY)
   - `Product`, `Category`, `Location`, `Distributor`, `Customer_Type`, `Payment_Mode`: Text
   - `Quantity_Sold`: Whole Number
   - `Unit_Price`: Fixed Decimal Currency (₹)
   - `Revenue`: Fixed Decimal Currency (₹)
3. Generate a dedicated Date Dimension Table using DAX:
   ```dax
   DateTable = 
   ADDCOLUMNS(
       CALENDAR(DATE(2024,1,1), DATE(2024,12,31)),
       "Year", YEAR([Date]),
       "MonthNum", MONTH([Date]),
       "MonthName", FORMAT([Date], "MMM"),
       "Quarter", "Q" & FORMAT([Date], "Q"),
       "DayOfWeek", FORMAT([Date], "DDD")
   )
   ```
4. Create 1-to-many relationship: `DateTable[Date] (1) -> kmf_sales[Date] (*)`

---

### 2. Dashboard Layout Architecture
- **Canvas Dimensions:** 16:9 (1920 x 1080 px)
- **Color Theme:** Nandini Blue (`#0284C7`), Royal Navy (`#0C1827`), Dairy Gold (`#F59E0B`), Profit Green (`#10B981`)
- **Card Visuals:**
  1. Card 1: `Total Revenue` (formatted as `₹11.12 Cr`)
  2. Card 2: `Total Quantity Sold` (`1.74M Units`)
  3. Card 3: `Average Order Value` (`₹22,318`)
  4. Card 4: `Total Transactions` (`4,982`)
- **Slicers:**
  - Date Range / Month Name Slider
  - Category Dropdown
  - District Location Tile Slicer
  - Customer Segment Slicer
- **Charts:**
  - Line & Clustered Column Chart: Monthly Revenue & 3M Moving Average
  - Clustered Bar Chart: Top 10 Products by Revenue
  - Map / Treemap Visual: Regional Sales by Karnataka District
  - Donut Chart: Customer Segment Revenue Share
