import pandas as pd
import os

file_path = 'CLIENTES_FINAL.xlsm'

try:
    xls = pd.ExcelFile(file_path)
    target_sheet = next((s for s in xls.sheet_names if 'ASIGN' in s.upper()), None)

    if target_sheet:
        # Find header
        df_raw = pd.read_excel(xls, sheet_name=target_sheet, header=None)
        header_row_idx = None
        for idx, row in df_raw.iterrows():
            if row.astype(str).str.contains('DNI', na=False).any():
                header_row_idx = idx
                break
        
        if header_row_idx is not None:
            df = pd.read_excel(xls, sheet_name=target_sheet, header=header_row_idx)
            df.columns = df.columns.astype(str).str.strip()
            
            # Filter missing DNI
            missing_dni = df[df['DNI'].isna()]
            
            print(f"Total rows without DNI: {len(missing_dni)}")
            
            if not missing_dni.empty:
                print("\nSample of rows without DNI (First 10):")
                # Show relevant columns to check if there is data
                cols_to_show = [c for c in ['EMPRESA', 'APELLIDOS', 'NOMBRES', 'DOSIMETRO'] if c in df.columns]
                print(missing_dni[cols_to_show].head(10).to_markdown(index=False))
                
                # Check if they are completely empty
                print("\nAre these rows completely empty?")
                print(missing_dni.dropna(how='all').head(5).to_markdown(index=False))
        else:
            print("Header not found")
    else:
        print("Sheet not found")

except Exception as e:
    print(f"Error: {e}")
