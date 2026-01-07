# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Streamlit app to view and explore chat histories from .mito/ai-chats folder.
"""

import streamlit as st
import json
import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

# Try to import tiktoken for accurate token counting
# If not available, attempt to install it automatically
try:
    import tiktoken
    TIKTOKEN_AVAILABLE = True
except ImportError:
    TIKTOKEN_AVAILABLE = False
    # Attempt to install tiktoken automatically
    try:
        print("Installing tiktoken...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "tiktoken>=0.5.0", "--quiet"])
        print("tiktoken installed successfully")
        import tiktoken
        TIKTOKEN_AVAILABLE = True
    except (subprocess.CalledProcessError, ImportError):
        # Installation failed or import still fails - will use fallback estimation
        TIKTOKEN_AVAILABLE = False

# Get the chat history directory
HOME_FOLDER = os.path.expanduser("~")
MITO_FOLDER = os.path.join(HOME_FOLDER, ".mito")
CHATS_DIR = os.path.join(MITO_FOLDER, "ai-chats")


def get_chat_files() -> List[str]:
    """Get all JSON files from the ai-chats directory."""
    if not os.path.exists(CHATS_DIR):
        return []
    
    try:
        files = [f for f in os.listdir(CHATS_DIR) if f.endswith('.json')]
        return sorted(files, reverse=True)  # Most recent first
    except Exception:
        return []


def get_most_recent_chat_file() -> str:
    """Get the filename of the most recently edited chat file based on last_interaction_ts."""
    chat_files = get_chat_files()
    
    if not chat_files:
        return None
    
    most_recent_file = None
    most_recent_ts = 0
    
    for filename in chat_files:
        try:
            chat_data = load_chat_file(filename)
            last_ts = chat_data.get("last_interaction_ts", 0)
            
            # Use file modification time as fallback if last_interaction_ts is missing
            if last_ts == 0:
                filepath = os.path.join(CHATS_DIR, filename)
                last_ts = os.path.getmtime(filepath)
            
            if last_ts > most_recent_ts:
                most_recent_ts = last_ts
                most_recent_file = filename
        except Exception:
            # If we can't load the file, skip it
            continue
    
    return most_recent_file


def load_chat_file(filename: str) -> Dict[str, Any]:
    """Load a chat history JSON file."""
    filepath = os.path.join(CHATS_DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def format_timestamp(ts: float) -> str:
    """Format a timestamp to a readable date string."""
    try:
        dt = datetime.fromtimestamp(ts)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except:
        return str(ts)


def format_message_content(content: Any) -> str:
    """Format message content for display."""
    # Handle different content types
    if isinstance(content, (dict, list)):
        return json.dumps(content, indent=2)
    elif isinstance(content, str):
        # Try to parse as JSON if it looks like JSON
        if content.strip().startswith('{') or content.strip().startswith('['):
            try:
                parsed = json.loads(content)
                return json.dumps(parsed, indent=2)
            except:
                pass
        return content
    else:
        return str(content)


def display_message_content(content: Any):
    """Display message content in the appropriate format."""
    # Handle different content types
    if isinstance(content, (dict, list)):
        st.json(content)
    elif isinstance(content, str):
        # Try to display as JSON if it looks like JSON
        if content.strip().startswith('{') or content.strip().startswith('['):
            try:
                parsed = json.loads(content)
                st.json(parsed)
            except:
                st.code(content, language="text")
        else:
            st.markdown(content)
    else:
        st.code(str(content), language="text")


def is_json_object(content: Any) -> bool:
    """Check if content is or can be parsed as a JSON object (dict or list)."""
    if isinstance(content, (dict, list)):
        return True
    elif isinstance(content, str):
        stripped = content.strip()
        if stripped.startswith('{') or stripped.startswith('['):
            try:
                parsed = json.loads(content)
                return isinstance(parsed, (dict, list))
            except:
                return False
    return False


def display_user_message_content(content: Any):
    """Display user message content: JSON objects as JSON, everything else as code."""
    if is_json_object(content):
        # If it's a JSON object, display as JSON
        if isinstance(content, (dict, list)):
            st.json(content)
        else:
            # Parse and display as JSON
            try:
                parsed = json.loads(content)
                st.json(parsed)
            except:
                st.code(content, language="text")
    else:
        # If it's not JSON, display as code
        if isinstance(content, str):
            st.code(content, language="text")
        else:
            st.code(str(content), language="text")


def count_tokens_in_content(content: Any) -> int:
    """Count tokens in message content."""
    if TIKTOKEN_AVAILABLE:
        try:
            encoding = tiktoken.get_encoding("cl100k_base")  # Used by GPT-4 and GPT-3.5-turbo
            # Convert content to string for token counting
            if isinstance(content, (dict, list)):
                content_str = json.dumps(content)
            elif isinstance(content, str):
                content_str = content
            else:
                content_str = str(content)
            return len(encoding.encode(content_str))
        except Exception:
            # Fallback to character-based estimation
            pass
    
    # Fallback: rough estimation (1 token ≈ 3 characters)
    if isinstance(content, (dict, list)):
        content_str = json.dumps(content)
    elif isinstance(content, str):
        content_str = content
    else:
        content_str = str(content)
    return int(len(content_str) / 3)


def count_tokens_in_message(message: Dict[str, Any]) -> int:
    """Count tokens in a single message."""
    content = message.get("content", "")
    return count_tokens_in_content(content)


def count_total_tokens_in_history(messages: List[Dict[str, Any]]) -> int:
    """Count total tokens in a message history."""
    total = 0
    for message in messages:
        total += count_tokens_in_message(message)
    return total


def main():
    st.set_page_config(
        page_title="Chat History Viewer",
        page_icon="💬",
        layout="wide"
    )
    
    st.title("💬 Chat History Viewer")
    
    # Get list of chat files
    chat_files = get_chat_files()
    most_recent = get_most_recent_chat_file()
    
    if not chat_files:
        st.warning(f"No chat history files found in `{CHATS_DIR}`")
        st.info("Make sure the directory exists and contains JSON files.")
        return
    
    # Get the most recently edited file (only on first load or if not set)
    if 'file_selector' not in st.session_state:
        st.session_state.file_selector = most_recent if most_recent else chat_files[0]
    
    # Find the index of the selected file in the chat_files list
    default_index = 0
    if st.session_state.file_selector and st.session_state.file_selector in chat_files:
        default_index = chat_files.index(st.session_state.file_selector)
    
    # Sidebar for file selection
    with st.sidebar:
        selected_file = st.selectbox(
            "Select a chat file:",
            options=chat_files,
            index=default_index,
            format_func=lambda x: x,
            key="file_selector"
        )
        
        if selected_file == most_recent:
            st.success("✅ This is the most recently modified chat")
    
    if not selected_file:
        st.info("Please select a chat file from the sidebar.")
        return
    
    # Load the selected chat file
    try:
        chat_data = load_chat_file(selected_file)
    except Exception as e:
        st.error(f"Error loading file: {e}")
        return
    
    # Display metadata
    thread_id = chat_data.get("thread_id", "N/A")
    creation_ts = chat_data.get("creation_ts", 0)
    last_ts = chat_data.get("last_interaction_ts", 0)
    name = chat_data.get("name", "N/A")
    version = chat_data.get("chat_history_version", "N/A")
    
    metadata_text = f"""
**Thread ID:** {thread_id} 

**Created:** {format_timestamp(creation_ts)}

**Last Interaction:** {format_timestamp(last_ts)}

**Name:** {name}

**Version:** {version}
"""
    st.info(metadata_text)
    
    st.divider()
    
    # Display AI Optimized History
    st.header("🤖 AI Optimized History")
    
    ai_history = chat_data.get("ai_optimized_history", [])
    
    if not ai_history:
        st.info("No AI optimized history found in this chat.")
    else:
        # Calculate total tokens for the AI Optimized History
        total_tokens = count_total_tokens_in_history(ai_history)
        token_info = f"**Total Tokens:** {total_tokens:,}"
        if not TIKTOKEN_AVAILABLE:
            token_info += " (estimated - install tiktoken for accurate counts)"
        st.info(token_info)
        
        # Display all messages
        for idx, message in enumerate(ai_history):
            role = message.get("role", "unknown")
            content = message.get("content", "")
            message_tokens = count_tokens_in_message(message)
            
            # Color code by role
            if role == "system":
                st.markdown("---")
                with st.expander(f"🔧 **System Message** (Message {idx + 1}/{len(ai_history)}) - {message_tokens:,} tokens", expanded=False):
                    st.code(format_message_content(content), language="text")
            elif role == "user":
                st.markdown("---")
                with st.expander(f"👤 **User Message** (Message {idx + 1}/{len(ai_history)}) - {message_tokens:,} tokens", expanded=False):
                    st.markdown("**Content:**")
                    display_user_message_content(content)
            elif role == "assistant":
                st.markdown("---")
                with st.expander(f"🤖 **Assistant Message** (Message {idx + 1}/{len(ai_history)}) - {message_tokens:,} tokens", expanded=False):
                    st.markdown("**Content:**")
                    display_message_content(content)
    
    st.divider()
    
    # Raw JSON viewer
    st.header("🔍 Raw JSON Data")
    
    with st.expander("View Full JSON", expanded=False):
        st.json(chat_data)
    
    # Display history comparison
    if "display_history" in chat_data:
        st.divider()
        st.header("📺 Display History")
        st.caption("This is the display-optimized version of the history")
        
        display_history = chat_data.get("display_history", [])
        st.info(f"Display history contains {len(display_history)} messages")
        
        with st.expander("View Display History", expanded=False):
            st.json(display_history)


if __name__ == "__main__":
    main()

