import urllib.request
import zipfile
import os
import shutil

url = "https://opengameart.org/sites/default/files/kenney_pirate-kit_2.1.zip"
zip_path = "pirate.zip"
extract_path = "public/models/pirate_kit"

print("Downloading Kenney Pirate Kit...")
urllib.request.urlretrieve(url, zip_path)

print("Extracting...")
os.makedirs(extract_path, exist_ok=True)
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(extract_path)

print("Cleaning up...")
os.remove(zip_path)
print("Done!")
