# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import re
import requests
from typing import Optional, Dict, Any
from urllib.parse import urlparse, parse_qs
import logging

logger = logging.getLogger(__name__)

class GoogleDriveService:
    """Service for fetching content from Google Drive URLs"""
    
    @staticmethod
    def extract_file_id(url: str) -> Optional[str]:
        """Extract file ID from Google Drive URL"""
        patterns = [
            r'/d/([a-zA-Z0-9-_]+)',  # Standard Google Drive URL
            r'id=([a-zA-Z0-9-_]+)',  # URL with id parameter
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return None
    
    @staticmethod
    def get_file_type(url: str) -> Optional[str]:
        """Determine if URL is a Google Docs URL"""
        if '/document/' in url:
            return 'document'
        return None
    
    @staticmethod
    def get_export_url(file_id: str) -> str:
        """Generate export URL for Google Docs file"""
        return f"https://docs.google.com/document/d/{file_id}/export?format=txt"
    
    @staticmethod
    def fetch_content(url: str) -> Dict[str, Any]:
        """
        Fetch content from Google Docs URL
        
        Args:
            url: Google Docs URL
            
        Returns:
            Dict containing content, file_type, and metadata
        """
        try:
            # Extract file ID and type
            file_id = GoogleDriveService.extract_file_id(url)
            if not file_id:
                raise ValueError("Invalid Google Docs URL: Could not extract file ID")
            
            file_type = GoogleDriveService.get_file_type(url)
            if not file_type:
                raise ValueError("Unsupported file type. Only Google Docs are supported")
            
            # Generate export URL
            export_url = GoogleDriveService.get_export_url(file_id)
            
            # Fetch content
            response = requests.get(export_url, timeout=30)
            response.raise_for_status()
            
            content = response.text
            
            return {
                'content': content,
                'file_type': file_type,
                'file_id': file_id,
                'success': True,
                'error': None
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch Google Docs content: {e}")
            return {
                'content': None,
                'file_type': None,
                'file_id': None,
                'success': False,
                'error': f"Failed to fetch content: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Error processing Google Docs URL: {e}")
            return {
                'content': None,
                'file_type': None,
                'file_id': None,
                'success': False,
                'error': f"Error processing URL: {str(e)}"
            }
    
    @staticmethod
    def is_valid_google_docs_url(url: str) -> bool:
        """Check if URL is a valid Google Docs URL"""
        if not url:
            return False
        
        # Check if it's a Google Docs URL
        if not url.startswith('https://docs.google.com/document/'):
            return False
        
        # Check if it contains a file ID
        file_id = GoogleDriveService.extract_file_id(url)
        return file_id is not None
