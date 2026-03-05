import pandas as pd
import os

# Configuration
input_file = 'CLIENTES.xlsm'
output_file = 'migration_preview.xlsx'
sheet_name = 'ASIGNACIÓN'

def generate_preview():
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return

    print("Loading Excel file...")
    # Load generic to find header
    xls = pd.ExcelFile(input_file)
    df_raw = pd.read_excel(xls, sheet_name=sheet_name, header=None)
    
    # Find header row
    header_row_idx = None
    for idx, row in df_raw.iterrows():
        if row.astype(str).str.contains('DNI', na=False).any():
            header_row_idx = idx
            break
            
    if header_row_idx is None:
        print("Could not find header row.")
        return

    # Reload with correct header
    df = pd.read_excel(xls, sheet_name=sheet_name, header=header_row_idx)
    df.columns = df.columns.astype(str).str.strip()
    
    # Filter valid rows
    df_clean = df[df['DNI'].notna()].copy()
    
    # --- 1. Companies ---
    # Extract unique companies
    if 'EMPRESA' in df_clean.columns:
        companies_df = df_clean[['EMPRESA']].drop_duplicates()
        companies_df.columns = ['Company_Name']
        companies_df['RUC_Placeholder'] = '' # To be filled by user?
        companies_df['Address_Placeholder'] = ''
        companies_df = companies_df.sort_values('Company_Name')
    else:
        companies_df = pd.DataFrame(columns=['Company_Name', 'Error'])
        
    # --- 2. Workers ---
    # Extract unique workers
    worker_cols = ['DNI', 'NOMBRES', 'APELLIDOS', 'EMPRESA']
    existing_cols = [c for c in worker_cols if c in df_clean.columns]
    workers_df = df_clean[existing_cols].drop_duplicates(subset=['DNI'])
    workers_df = workers_df.sort_values('APELLIDOS')
    
    # --- 3. Assignments & Readings ---
    # Map columns
    # 'Columna2' seems to be Hp10, 'Columna1' seems to be Hp007
    # 'SI' column? Not sure what it is. 
    
    assignment_cols = ['DNI', 'NOMBRES', 'APELLIDOS', 'EMPRESA', 'MES', 'AÑO', 'DOSIMETRO']
    reading_cols = []
    
    if 'Columna2' in df_clean.columns:
        df_clean.rename(columns={'Columna2': 'Hp10'}, inplace=True)
        readings_exist = True
    else:
        df_clean['Hp10'] = None
        
    if 'Columna1' in df_clean.columns:
        df_clean.rename(columns={'Columna1': 'Hp007'}, inplace=True)
        readings_exist = True
    else:
        df_clean['Hp007'] = None
        
    final_cols = ['DNI', 'EMPRESA', 'MES', 'AÑO', 'DOSIMETRO', 'Hp10', 'Hp007']
    assignments_df = df_clean[[c for c in final_cols if c in df_clean.columns]]
    
    # Clean Data
    # Convert Year/Month to consistent format
    # assignments_df['AÑO'] = assignments_df['AÑO'].fillna(0).astype(int)
    
    print(f"Generating {output_file}...")
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        companies_df.to_excel(writer, sheet_name='Companies_To_Create', index=False)
        workers_df.to_excel(writer, sheet_name='Workers_To_Create', index=False)
        assignments_df.to_excel(writer, sheet_name='Assignments_Readings', index=False)
        
    print("Done.")

if __name__ == "__main__":
    generate_preview()
