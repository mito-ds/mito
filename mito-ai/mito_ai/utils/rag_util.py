#!/usr/bin/env python

import requests
from bs4 import BeautifulSoup
from googlesearch import search, SearchResult
from typing import List, Dict, Optional
from langchain_experimental.text_splitter import SemanticChunker
from langchain_huggingface import HuggingFaceEmbeddings

MAX_RESULTS = 4
TIMEOUT = 10
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
}

def search_web(query: str) -> list[str]:
    """Get top search results"""
    return [
        str(result.url) if isinstance(result, SearchResult) else str(result)
        for result in search(query, num_results=MAX_RESULTS)
    ]

def fetch_url(url: str) -> Optional[str]:
    """Retrieve webpage content"""
    try:
        response = requests.get(
            url, 
            headers=HEADERS, 
            timeout=TIMEOUT
        )
        response.raise_for_status()
        return response.text
    except requests.RequestException:
        return None

def chunk_content(texts: list[str]) -> list[str]:
    """Split content preserving semantic boundaries"""
    splitter = SemanticChunker(
        embeddings=HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        ),
    )
    return splitter.split_text("\n".join(texts))

def extract_key_info(html: str, url: str) -> str:
    """Parse HTML and extract key info using semantic chunking"""
    soup = BeautifulSoup(html, 'html.parser')
    
    # Remove common ads and tracking elements
    ad_selectors = [
        'div.ad-', 
        'div.ads',
        'div.promoted-answers',
        'aside',
        'div.s-sidebarwidget',
        'div.js-ad-dynamic'
    ]
    
    # Remove Stack Overflow-specific metadata
    so_specific = [
        'div.js-vote-count',        # Vote counts
        'div.answers-subheader',    # "X Answers" header
        'span.reputation-score',    # User reputation
        'div.user-info',            # User profile boxes
        'div.mb8',                  # "Related questions" etc
        'div.fc-black-350',         # Secondary metadata text
        'div.s-navigation',         # Top nav bar
        'div.js-post-menu',         # Post action menu
        'div.accepted-answer',      # Green checkmark (keep answer text)
        'div.js-voting-container',  # Voting arrows
        'time'                      # Timestamps
    ]

    # Remove social/share elements
    social = [
        'div.s-share', 
        'button.js-share-link',
        'div.s-social'
    ]

    # Combined removal list
    for selector in ['script', 'style', 'nav', 'footer', 'header', 
                    'form', 'img', 'button', 'iframe', 'svg', 'link'] + \
                    ad_selectors + so_specific + social:
        for element in soup.select(selector):
            element.decompose()

    # Remove inline vote counts without breaking structure
    for span in soup.select('span.js-vote-count'):
        span.unwrap()  # Remove but keep parent intact

    # Focus on core content containers
    main_content = []
    for container in soup.select('#question, div.answer'):
        # Clean headers and metadata within answers
        for sub_element in container.select('.js-post-menu, .user-info, .js-voting-container'):
            sub_element.decompose()
        main_content.append(container.get_text(separator='\n', strip=True))

    text = '\n\n'.join(main_content)
    
    # Fallback if no main content found
    if not text.strip():
        text = soup.get_text(separator='\n', strip=True)

    # Split into semantic chunks
    try:
        chunks = chunk_content([text])
    except Exception as e:
        print(f"Chunking error: {e}")
        chunks = [text[:5000]]  # Fallback

    return "\n".join(
        f"{chunk}" 
        for chunk in chunks
    ) if chunks else "No content extracted"

def find_solutions(error_message: str) -> str:
    """Main entry point"""
    try:
        # Step 1: Web search
        urls = search_web(error_message)
        print(f"Found URLs: {urls}")
        
        # Step 2: Scrape and parse
        results = []
        formatted_output = []
        for ind, url in enumerate(urls, start=1):
            content = fetch_url(url)
            if content:
                extracted = extract_key_info(content, url)
                if extracted:
                    formatted_output.append(f"<Context {ind}>\n{extracted}\n</Context{ind}>")
        return "\n".join(formatted_output) if formatted_output else ""
        
    except Exception as e:
        return ""
