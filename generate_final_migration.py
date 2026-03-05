import pandas as pd
import os
import numpy as np

file_path = 'CLIENTES_FINAL.xlsm'
output_file = 'migration_preview_final.xlsx'

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    exit(1)

try:
    print(f"Reading {file_path}...")
    xls = pd.ExcelFile(file_path)
    
    # Find ASIGNACIÓN sheet
    target_sheet = next((s for s in xls.sheet_names if 'ASIGN' in s.upper()), None)
    if not target_sheet:
        print("Sheet 'ASIGNACIÓN' not found")
        exit(1)

    print(f"Processing sheet: {target_sheet}")
    
    # Find Header
    df_raw = pd.read_excel(xls, sheet_name=target_sheet, header=None)
    header_row_idx = None
    for idx, row in df_raw.iterrows():
        if row.astype(str).str.contains('DNI', na=False).any():
            header_row_idx = idx
            break
            
    if header_row_idx is None:
        print("Header with 'DNI' not found")
        exit(1)

    # Load Data
    df = pd.read_excel(xls, sheet_name=target_sheet, header=header_row_idx)
    # Clean column names
    df.columns = df.columns.astype(str).str.strip().str.replace('\n', ' ')

    print(f"Initial rows: {len(df)}")
    
    # --- REPAIR RULES ---
    
    # 1. Missing Company
    print("Repairing Companies...")
    if 'EMPRESA' in df.columns:
        missing_company_count = df['EMPRESA'].isna().sum()
        df['EMPRESA'] = df['EMPRESA'].fillna('Empresa NO Registrada')
        print(f" -> Filled {missing_company_count} missing companies.")
    
    # 2. Missing DNI
    print("Repairing DNIs...")
    if 'DNI' in df.columns and 'APELLIDOS' in df.columns and 'NOMBRES' in df.columns:
        # Step 1: Propagate DNI
        # Create a mapping of Name -> DNI from rows that HAVE DNI
        valid_dnis = df.dropna(subset=['DNI'])
        name_dni_map = valid_dnis.set_index(['APELLIDOS', 'NOMBRES'])['DNI'].to_dict()
        
        def fill_dni(row):
            if pd.isna(row['DNI']):
                key = (row['APELLIDOS'], row['NOMBRES'])
                if key in name_dni_map:
                    return name_dni_map[key]
            return row['DNI']
            
        df['DNI'] = df.apply(fill_dni, axis=1)
        
        # Step 2: Generate Fake DNI for remaining
        missing_dni_mask = df['DNI'].isna()
        missing_count = missing_dni_mask.sum()
        print(f" -> {missing_count} rows still missing DNI after propagation.")
        
        if missing_count > 0:
            # Get unique workers without DNI
            users_without_dni = df[missing_dni_mask][['APELLIDOS', 'NOMBRES']].drop_duplicates()
            
            # Generate IDs: 9000001#, 9000002#, etc.
            start_id = 9000001
            fake_map = {}
            for idx, user_row in users_without_dni.iterrows():
                key = (user_row['APELLIDOS'], user_row['NOMBRES'])
                fake_id = f"{start_id + len(fake_map)}#" 
                fake_map[key] = fake_id
                
            # Apply fake IDs
            def apply_fake_dni(row):
                if pd.isna(row['DNI']):
                    key = (row['APELLIDOS'], row['NOMBRES'])
                    return fake_map.get(key, row['DNI'])
                return row['DNI']
                
            df['DNI'] = df.apply(apply_fake_dni, axis=1)
            print(f" -> Generated fake DNIs for {len(fake_map)} unique workers.")

    # --- DATA PREPARATION ---
    
    # Identify Reading Columns
    # The user confirmed: 'HP(10) (Final)' and 'HP(0.07) (Final)' are the best ones.
    # Note: Column names might have spaces or newlines, handled by .replace('\n', ' ') earlier.
    
    col_hp10 = next((c for c in df.columns if 'HP(10)' in c and 'Lectura' in c), None)
    col_hp007 = next((c for c in df.columns if 'HP(0.07)' in c and 'Lectura' in c), None)
    
    print(f"Reading Columns Identified: Hp10='{col_hp10}', Hp007='{col_hp007}'")

    # Filter columns for output
    final_cols = ['EMPRESA', 'DNI', 'APELLIDOS', 'NOMBRES', 'MES', 'AÑO', 'DOSIMETRO']
    if col_hp10: final_cols.append(col_hp10)
    if col_hp007: final_cols.append(col_hp007)
    
    assignments_df = df[final_cols].copy()
    
    # Rename columns for clarity
    rename_map = {}
    if col_hp10: rename_map[col_hp10] = 'Hp10'
    if col_hp007: rename_map[col_hp007] = 'Hp0.07'
    
    assignments_df.rename(columns=rename_map, inplace=True)
    
    # Workers Sheet
    workers_df = df[['DNI', 'APELLIDOS', 'NOMBRES', 'EMPRESA']].drop_duplicates(subset=['DNI'])
    
    # Companies Sheet
    companies_df = df[['EMPRESA']].drop_duplicates()
    
    # --- WRITE EXCEL ---
    print(f"Writing to {output_file}...")
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        companies_df.to_excel(writer, sheet_name='Companies_To_Create', index=False)
        workers_df.to_excel(writer, sheet_name='Workers_To_Create', index=False)
        assignments_df.to_excel(writer, sheet_name='Assignments_Readings', index=False)
        
    print("Migration Preview Generated Successfully.")
    print(f" - Companies: {len(companies_df)}")
    print(f" - Workers: {len(workers_df)}")
    print(f" - Assignments: {len(assignments_df)}")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
