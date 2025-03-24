import pandas as pd
import json
import os
import numpy as np

papi_file = 'data/PAPI-2015-2023(eng).xlsm'

print(f"Loading PAPI data from {papi_file}...")
xl = pd.ExcelFile(papi_file)
sheet_names = xl.sheet_names
print(f"Found {len(sheet_names)} sheets in the Excel file: {sheet_names}")

process_sheets = [sheet for sheet in sheet_names if sheet.lower().endswith('process')]
print(f"Found {len(process_sheets)} process sheets: {process_sheets}")

papi_dimensions_by_year = {
    "2015": [
        "Dimension 1: Participation",
        "Dimension 2: Transparency of Local Decision-making",
        "Dimension 3: Vertical Accountability",
        "Dimension 4: Control of Corruption in the Public Sector",
        "Dimension 5: Public Administrative Procedures",
        "Dimension 6: Public Service Delivery"
    ],
    "2016": [
        "Dimension 1: Participation",
        "Dimension 2: Transparency of Local Decision-making",
        "Dimension 3: Vertical Accountability",
        "Dimension 4: Control of Corruption in the Public Sector",
        "Dimension 5: Public Administrative Procedures",
        "Dimension 6: Public Service Delivery"
    ],
    "2017": [
        "Dimension 1: Participation",
        "Dimension 2: Transparency of Local Decision-making",
        "Dimension 3: Vertical Accountability",
        "Dimension 4: Control of Corruption in the Public Sector",
        "Dimension 5: Public Administrative Procedures",
        "Dimension 6: Public Service Delivery"
    ],
    "2018": [
        "Dimension 1: Participation",
        "Dimension 2: Transparency of Local Decision-making",
        "Dimension 3: Vertical Accountability",
        "Dimension 4: Control of Corruption in the Public Sector",
        "Dimension 5: Public Administrative Procedures",
        "Dimension 6: Public Service Delivery",
        "Dimension 7: Environmental Governance",
        "Dimension 8: E-Governance"
    ],
    "2019": [
        "Dimension 1: Participation",
        "Dimension 2: Transparency of Local Decision-making",
        "Dimension 3: Vertical Accountability",
        "Dimension 4: Control of Corruption in the Public Sector",
        "Dimension 5: Public Administrative Procedures",
        "Dimension 6: Public Service Delivery",
        "Dimension 7: Environmental Governance",
        "Dimension 8: E-Governance"
    ],
    "2020": [
        "Dimension 1: Participation",
        "Dimension 2: Transparency of Local Decision-making",
        "Dimension 3: Vertical Accountability",
        "Dimension 4: Control of Corruption in the Public Sector",
        "Dimension 5: Public Administrative Procedures",
        "Dimension 6: Public Service Delivery",
        "Dimension 7: Environmental Governance",
        "Dimension 8: E-Governance"
    ],
    "2021": [
        "Dimension 1: Participation",
        "Dimension 2: Transparency of Local Decision-making",
        "Dimension 3: Vertical Accountability",
        "Dimension 4: Control of Corruption in the Public Sector",
        "Dimension 5: Public Administrative Procedures",
        "Dimension 6: Public Service Delivery",
        "Dimension 7: Environmental Governance",
        "Dimension 8: E-Governance"
    ],
    "2022": [
        "Dimension 1: Participation",
        "Dimension 2: Transparency of Local Decision-making",
        "Dimension 3: Vertical Accountability",
        "Dimension 4: Control of Corruption in the Public Sector",
        "Dimension 5: Public Administrative Procedures",
        "Dimension 6: Public Service Delivery",
        "Dimension 7: Environmental Governance",
        "Dimension 8: E-Governance"
    ],
    "2023": [
        "Dimension 1: Participation",
        "Dimension 2: Transparency of Local Decision-making",
        "Dimension 3: Vertical Accountability",
        "Dimension 4: Control of Corruption in the Public Sector",
        "Dimension 5: Public Administrative Procedures",
        "Dimension 6: Public Service Delivery",
        "Dimension 7: Environmental Governance",
        "Dimension 8: E-Governance"
    ]
}

for sheet_name in process_sheets:
    try:
        year = ''.join(filter(str.isdigit, sheet_name))
        if not year or len(year) != 4:
            print(f"Could not extract year from sheet name: {sheet_name}, skipping...")
            continue
        
        papi_dimensions = papi_dimensions_by_year.get(year, [])
        if not papi_dimensions:
            print(f"No dimensions defined for year {year}, skipping...")
            continue
        
        output_file = f'data/papi_{year}.json'
        if os.path.exists(output_file):
            print(f"File {output_file} already exists, skipping...")
            continue
        
        print(f"Processing sheet {sheet_name} for year {year}...")
        
        df = pd.read_excel(papi_file, sheet_name=sheet_name, header=None)
        
        province_row = None
        for idx, row in df.iterrows():
            for col_idx, cell in enumerate(row):
                if isinstance(cell, str) and cell.strip() == "Province":
                    province_row = idx
                    province_col = col_idx
                    break
            if province_row is not None:
                break
        
        if province_row is None:
            print(f"Could not find 'Province' in sheet {sheet_name}, skipping...")
            continue
        
        print(f"Found 'Province' at row {province_row}, column {province_col}")
        header_row = df.iloc[province_row]
        
        new_headers = {}
        for i, header in enumerate(header_row):
            if pd.notna(header) and isinstance(header, str):
                new_headers[i] = header
        
        data_rows = df.iloc[province_row+1:].copy()
        
        columns_to_keep = list(new_headers.keys())
        data_df = data_rows[columns_to_keep].copy()
        
        column_mapping = {i: new_headers[i] for i in columns_to_keep}
        data_df = data_df.rename(columns=column_mapping)
        
        dimension_groups = {}
        for col in data_df.columns:
            if not isinstance(col, str):
                continue
                
            if any(dim.lower() == col.lower() for dim in papi_dimensions):
                continue
                
            for i in range(1, 9):
                prefix = f"{i}."
                if col.startswith(prefix):
                    dim = next((d for d in papi_dimensions if d.startswith(f"Dimension {i}:")), None)
                    if dim:
                        if dim not in dimension_groups:
                            dimension_groups[dim] = []
                        dimension_groups[dim].append(col)
                        break
        
        print(f"Found dimension groups: {dimension_groups}")
        
        data = []
        for idx, row in data_df.iterrows():
            if pd.isna(row['Province']) or not isinstance(row['Province'], str):
                continue
            
            if any(keyword in str(row['Province']).upper() for keyword in ['RANGE', 'ITEM', 'ATTRIBUTE']):
                continue
            
            entry = {
                'Province': row['Province'],
                'Year': year
            }
            
            for std_dim in papi_dimensions:
                if std_dim in data_df.columns and not pd.isna(row[std_dim]):
                    value = row[std_dim]
                    if isinstance(value, (int, float)):
                        entry[std_dim] = float(value)
                    elif isinstance(value, str) and value.strip():
                        numeric_value = ''.join(c for c in value if c.isdigit() or c == '.')
                        if numeric_value:
                            entry[std_dim] = float(numeric_value)
                        else:
                            entry[std_dim] = None
                    else:
                        entry[std_dim] = None
                elif std_dim in dimension_groups:
                    sub_values = []
                    for sub_dim in dimension_groups[std_dim]:
                        if not pd.isna(row[sub_dim]):
                            value = row[sub_dim]
                            if isinstance(value, (int, float)):
                                sub_values.append(float(value))
                            elif isinstance(value, str) and value.strip():
                                numeric_value = ''.join(c for c in value if c.isdigit() or c == '.')
                                if numeric_value:
                                    sub_values.append(float(numeric_value))
                    
                    if sub_values:
                        entry[std_dim] = sum(sub_values)
                    else:
                        entry[std_dim] = None
                else:
                    entry[std_dim] = None
            
            data.append(entry)
        
        if data:
            with open(output_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            print(f"Saved {len(data)} entries to {output_file}")
        else:
            print(f"No data extracted from sheet {sheet_name}")
        
    except Exception as e:
        print(f"Error processing sheet {sheet_name}: {e}")

print("PAPI data extraction complete!")
