import pandas as pd
import os

file_path = 'CLIENTES_FINAL.xlsm'

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    exit(1)

try:
    # Read the Excel file
    xls = pd.ExcelFile(file_path)
    
    print(f"Sheet names in {file_path}: {xls.sheet_names}")
    
    with open('analysis_final_sheets.txt', 'w', encoding='utf-8') as f:
         f.write(f"Sheets: {xls.sheet_names}\n")
         
         # Try to find the assignment sheet
         target_sheet = next((s for s in xls.sheet_names if 'ASIGN' in s.upper()), None)
         
         if target_sheet:
             f.write(f"\n--- Analyzing Target Sheet: {target_sheet} ---\n")
             # Load generic to find header
             df_raw = pd.read_excel(xls, sheet_name=target_sheet, header=None)
        
             # Find row with 'DNI'
             header_row_idx = None
             for idx, row in df_raw.iterrows():
                 if row.astype(str).str.contains('DNI', na=False).any():
                     header_row_idx = idx
                     break
             
             if header_row_idx is not None:
                 f.write(f"Header found at row index: {header_row_idx}\n")
                 df = pd.read_excel(xls, sheet_name=target_sheet, header=header_row_idx)
                 df.columns = df.columns.astype(str).str.strip()
                 f.write(f"Columns: {df.columns.tolist()}\n")
                 f.write(f"Row count: {len(df)}\n")
                 
                 # Basic stats
                 if 'DNI' in df.columns:
                     f.write(f"Valid DNI rows: {df['DNI'].count()}\n")
                     f.write(f"Unique DNI: {df['DNI'].nunique()}\n")
                 
                 if 'EMPRESA' in df.columns:
                    companies = df['EMPRESA'].unique()
                    f.write(f"Unique Companies ({len(companies)}):\n{companies}\n")

                 # Check for readings
                 standard_cols = ['Nro', 'EMPRESA', 'F. ENSAMBLE', 'DNI', 'APELLIDOS', 'NOMBRES', 'MES', 'AÑO', 'DOSIMETRO', 'DEVOLUCION', 'INFO QR']
                 potential_reading_cols = [c for c in df.columns if c not in standard_cols and 'Unnamed' not in c]
                 f.write(f"\nPotential Reading Columns: {potential_reading_cols}\n")
                 
                 for col in potential_reading_cols:
                     non_null_count = df[col].count()
                     f.write(f" - {col}: {non_null_count} non-null\n")
                     if non_null_count > 0:
                         f.write(f"   Sample: {df[col].dropna().unique()[:5]}\n")

                 f.write("\nFirst 10 rows:\n")
                 f.write(df.head(10).to_markdown(index=False, numalign="left", stralign="left"))
             else:
                 f.write("Could not find header row with 'DNI'. Dumping first 10 rows raw:\n")
                 f.write(df_raw.head(10).to_markdown(index=False, numalign="left", stralign="left"))
         else:
             f.write("No sheet found matching 'ASIGN'.\n")
             
    print("Analysis complete. Check analysis_final_sheets.txt")
except Exception as e:
    print(f"Error analyzing Excel file: {e}")
