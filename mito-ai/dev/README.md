# Mito AI Dev Scripts

### Generate AI Chats

A simple script that creates a bunch of fake Mito AI chat files so you can quickly generate a fully populated chat history.

## Usage

```bash
python dev/generate_mito_files.py
```

The script will create 30 JSON files in `~/.mito/ai-chats`, each containing a conversation about printing a different number (1-30).

To change the number of files, edit the last line of the script:
```python
main(30) 
```