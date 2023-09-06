# Function to encode a date into a license string
import base64
import datetime


def encode_date_to_license(date: datetime.date) -> str:
    date_str = date.strftime("%Y-%m-%d")
    encoded_date = base64.b64encode(date_str.encode()).decode()
    license_key = f"LICENSE-{encoded_date}-MITO-ENTERPRISE"
    return license_key

# Function to decode a license string back into a date
def decode_license_to_date(license_key: str) -> datetime.date:
    encoded_date = license_key.split("-")[1]    
    decoded_date_str = base64.b64decode(encoded_date).decode()    
    decoded_date = datetime.datetime.strptime(decoded_date_str, "%Y-%m-%d").date()
    return decoded_date