"""
Streamlit app to view and explore chat histories from .mito/ai-chats folder.
"""

import streamlit as st
import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

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


def format_message_content(content: str) -> str:
    """Format message content for display."""
    # Try to parse as JSON if it looks like JSON
    if content.strip().startswith('{') or content.strip().startswith('['):
        try:
            parsed = json.loads(content)
            return json.dumps(parsed, indent=2)
        except:
            pass
    return content


def main():
    st.set_page_config(
        page_title="Chat History Viewer",
        page_icon="💬",
        layout="wide"
    )
    
    st.title("💬 Chat History Viewer")
    st.markdown("Browse and explore chat histories from `.mito/ai-chats` folder")
    
    # Get list of chat files
    chat_files = get_chat_files()
    
    if not chat_files:
        st.warning(f"No chat history files found in `{CHATS_DIR}`")
        st.info("Make sure the directory exists and contains JSON files.")
        return
    
    # Sidebar for file selection
    with st.sidebar:
        st.header("📁 Chat Files")
        st.caption(f"Found {len(chat_files)} chat history files")
        
        selected_file = st.selectbox(
            "Select a chat file:",
            options=chat_files,
            format_func=lambda x: x
        )
    
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
    st.header("📋 Chat Metadata")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Thread ID", chat_data.get("thread_id", "N/A"))
    
    with col2:
        creation_ts = chat_data.get("creation_ts", 0)
        st.metric("Created", format_timestamp(creation_ts))
    
    with col3:
        last_ts = chat_data.get("last_interaction_ts", 0)
        st.metric("Last Interaction", format_timestamp(last_ts))
    
    st.markdown(f"**Name:** {chat_data.get('name', 'N/A')}")
    st.markdown(f"**Version:** {chat_data.get('chat_history_version', 'N/A')}")
    
    st.divider()
    
    # Display AI Optimized History
    st.header("🤖 AI Optimized History")
    
    ai_history = chat_data.get("ai_optimized_history", [])
    
    if not ai_history:
        st.info("No AI optimized history found in this chat.")
    else:
        st.caption(f"Total messages: {len(ai_history)}")
        
        # Navigation controls
        col1, col2, col3 = st.columns([2, 1, 1])
        
        with col1:
            message_index = st.number_input(
                "Jump to message:",
                min_value=0,
                max_value=len(ai_history) - 1,
                value=0,
                step=1,
                help="Enter a message number to jump to that message"
            )
        
        with col2:
            messages_per_page = st.selectbox(
                "Messages per page:",
                options=[5, 10, 20, 50, 100],
                index=1,  # Default to 10
                help="How many messages to show at once"
            )
        
        with col3:
            show_all = st.checkbox("Show all", value=False, help="Show all messages at once")
        
        # Filter by role
        roles = set(msg.get("role", "unknown") for msg in ai_history)
        selected_roles = st.multiselect(
            "Filter by role:",
            options=sorted(roles),
            default=sorted(roles),
            help="Select which message roles to display"
        )
        
        # Calculate display range
        if show_all:
            start_idx = 0
            end_idx = len(ai_history)
        else:
            start_idx = message_index
            end_idx = min(message_index + messages_per_page, len(ai_history))
        
        # Display messages
        displayed_count = 0
        for idx, message in enumerate(ai_history):
            # Skip if before start or after end
            if idx < start_idx or idx >= end_idx:
                continue
            
            role = message.get("role", "unknown")
            
            # Skip if role is filtered out
            if role not in selected_roles:
                continue
            
            content = message.get("content", "")
            
            # Color code by role
            if role == "system":
                st.markdown("---")
                with st.expander(f"🔧 **System Message** (Message {idx + 1}/{len(ai_history)})", expanded=(idx == message_index)):
                    st.code(format_message_content(content), language="text")
            elif role == "user":
                st.markdown("---")
                with st.expander(f"👤 **User Message** (Message {idx + 1}/{len(ai_history)})", expanded=(idx == message_index)):
                    st.markdown("**Content:**")
                    # Try to display as code if it looks like JSON
                    if content.strip().startswith('{') or content.strip().startswith('['):
                        try:
                            parsed = json.loads(content)
                            st.json(parsed)
                        except:
                            st.code(content, language="text")
                    else:
                        st.markdown(content)
            elif role == "assistant":
                st.markdown("---")
                with st.expander(f"🤖 **Assistant Message** (Message {idx + 1}/{len(ai_history)})", expanded=(idx == message_index)):
                    st.markdown("**Content:**")
                    # Try to parse as JSON
                    if content.strip().startswith('{') or content.strip().startswith('['):
                        try:
                            parsed = json.loads(content)
                            st.json(parsed)
                        except:
                            st.code(content, language="text")
                    else:
                        st.markdown(content)
            
            displayed_count += 1
            
            # Stop if we've shown enough messages (unless show_all is True)
            if not show_all and displayed_count >= messages_per_page:
                if end_idx < len(ai_history):
                    st.info(f"Showing messages {start_idx + 1}-{end_idx} of {len(ai_history)}. Use navigation controls to see more.")
                break
    
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

