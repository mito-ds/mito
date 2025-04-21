# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from googlesearch import search, SearchResult
from typing import  Optional
from trafilatura import fetch_url, extract
from keybert import KeyBERT
from mito_ai.logger import get_logger

MAX_RESULTS = 4
TIMEOUT = 2
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
}

logger = get_logger()

def formulate_query_from_chat(chat_input: str) -> str:
    """Extract important information from the chat and formulate the search query"""
    logger.debug("Formulating search query")
    if len(chat_input)<=100:
        return chat_input

    kw_model = KeyBERT('distilbert-base-nli-mean-tokens')
    kw_list = kw_model.extract_keywords(chat_input, top_n=10)
    keywords = [kw[0] for kw in kw_list]

    return " ".join(keywords)


def search_web(query: str) -> list[str]:
    """Get top search results"""
    return [
        str(result.url) if isinstance(result, SearchResult) else str(result)
        for result in search(query, num_results=MAX_RESULTS)
    ]


def fetch_url_content(url: str) -> Optional[str]:
    """Retrieve main webpage content"""
    downloaded_content = fetch_url(url)
    if downloaded_content is None:
        return None
    result = extract(
        filecontent=downloaded_content,
        url=url,
        include_formatting=False,
        include_tables=False
    )
    return result


def find_solutions(query: str) -> str:
    """Main entry point for RAG"""
    logger.debug("Starting RAG")
    try:
        # Web search
        urls = search_web(query)
        logger.debug(f"urls: {urls}")

        # Extracting data from webpages
        formatted_output = []
        count = 1
        for url in urls:
            content = fetch_url_content(url)
            if content:
                formatted_output.append(f"<Context {count}>\n{content}\n</Context {count}>")
                count+=1
        logger.debug("RAG completed")
        return "\n".join(formatted_output) if formatted_output else ""

    except Exception as e:
        return ""
