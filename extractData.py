import pandas as pd

df_city = pd.read_excel('data/FDI_processed.xlsm', sheet_name='City')

df_extracted = df_city.loc[1:].copy() 
df_extracted = df_extracted.rename(columns={
    'Unnamed: 1': 'Year',
    'Unnamed: 2': 'Province',
    'Unnamed: 11': 'FDI'
})

# Extract only the relevant columns
df_result = df_extracted[['Province', 'Year', 'FDI']]
df_result.to_csv('data/extracted_data.csv', index=False)
