# Claude Desktop: MCP client learnings

Notes for designing and operating local MCP servers (especially file-heavy and Python-executor flows) against **Claude Desktop**.

## Elicitation

Anthropic’s MCP docs that describe **elicitation** target **Claude Code** (CLI), not **Claude Desktop**. Desktop’s client often **does not advertise** `elicitation` in `initialize`, and **`elicitation/create`** can return **`Method not found`** (`-32601`) — the handler is not implemented in that host. Interactive `ask_user`-style flows need a client that implements elicitation (e.g. VS Code with MCP), not Desktop alone, until Desktop adds support.

## Uploaded Files / File System Access

### Debugging Session Summary

#### The Setup

We're building an MCP server (Mito AI) that runs an IPython kernel and exposes a `run_data_analyst` tool. Goal: let users drop a CSV into Claude Desktop chat, and have the tool analyze it via pandas in the kernel. Everything was implemented correctly, but hit a wall when reading the actual file.

#### What We Investigated and Learned

1. **Can MCP servers see files dragged into Claude Desktop chat?**
   - **Investigation:** Checked MCP protocol docs, Claude Desktop behavior, and the GitHub issue tracker for how uploaded-file metadata flows to MCP tools.
   - **Outcome:** No. Chat uploads go to Anthropic's backend and get injected as text into the model's context. There is no local path like `/mnt/transactions.csv` on the user's machine that your MCP server can open. The `/mnt/...` paths that exist in Claude's Code Execution sandbox or in Cowork's VM are on different machines entirely - they don't reach the host where your MCP runs. The model sees the file contents but your server has no handle to the bytes.

2. **Does MCP's "roots" concept solve this?**
   - **Investigation:** Reviewed the MCP roots spec and how Claude Desktop populates them.
   - **Outcome:** No. Roots in Claude Desktop come from your configured allowlist (via `claude_desktop_config.json` args or `.mcpb` manifest), not from chat uploads. There's no mechanism to auto-expose a dragged-in file to a local MCP server.

3. **Could we use elicitation (ask_user_question-style flows) to prompt for a path?**
   - **Investigation:** Considered having the server call back to the client to ask the user for a path when one wasn't provided.
   - **Outcome:** Elicitation isn't reliable in Claude Desktop. The MCP docs that cover `elicitation/create` target Claude Code (CLI). Desktop's client often doesn't advertise elicitation in its initialize response, and calling the method can return `Method not found` (`-32601`). Interactive prompt flows need a client that implements elicitation (Claude Code, VS Code's MCP support); until Desktop adds it, you can't rely on server-initiated user prompts.

4. **What's the right architecture given these constraints?**
   - **Outcome:** The model has the CSV contents from the upload; the user needs to supply a path for your server to operate on real bytes. Your tool description should explicitly require absolute paths in a `file_paths` argument, and you should validate server-side (returning a descriptive error as the tool result when the path is missing, non-absolute, or non-existent) so the model can self-correct. You don't need `read_file`/`read_multiple_files` tools because your IPython kernel is the executor.

5. **Is there a tool description size limit?**
   - **Outcome:** No hard protocol limit, but practical ceilings matter. Aim for 50-200 words for tool descriptions, 10-30 per parameter. Past ~500 words you start losing the model's attention on critical instructions and taxing the shared context window. Split detail between the tool description (when to use, critical rule) and parameter descriptions (exact format, examples).

6. **Workaround the model tried in testing: "copy the file to /home/claude/data/."**
   - **Investigation:** Saw in a screenshot that when the model couldn't reach the uploaded CSV, it decided to `cp /mnt/user-data/uploads/transactions.csv /home/claude/data/` and retry.
   - **Outcome:** This revealed we were testing in the wrong environment. Those paths exist in Claude's own Code Execution sandbox (a VM on Anthropic's infrastructure), not on the user's laptop. The model conflated its sandbox filesystem with the user's filesystem - a plausible-sounding workaround that doesn't cross the VM boundary. This means you can't actually test Mito MCP end-to-end from inside claude.ai; you need Claude Desktop on a real laptop with a real file on real disk.

7. **Once a real absolute path was supplied, pandas threw `PermissionError [Errno 1] Operation not permitted`.**
   - **Investigation:** Distinguished this from a normal POSIX permissions error (which would be `errno 13` / `Permission denied`). `Errno 1` is distinctive - it means macOS's TCC (Transparency, Consent, and Control) framework intercepted the syscall. TCC gates access to `~/Downloads`, `~/Documents`, `~/Desktop`, iCloud, etc., behind per-app user consent, and grants are attributed to the "responsible process" in the spawn chain.
   - **Outcome:** The MCP's process tree was `Claude.app -> Python.app -> venv/bin/python`. TCC was attributing the read attempt to `Python.app` (Homebrew's `.app` bundle), which had not been granted Downloads access.

8. **Inspecting the TCC state in System Settings.**
   - **Investigation:** Opened Privacy & Security -> Files & Folders and Full Disk Access.
   - **Outcome:** Found two Python entries - "Python" (rocket icon, i.e. `Python.app`) with only Documents Folder listed and toggled off, and a stale "`python3.13`" with a question-mark icon pointing at a binary path that no longer existed. No Downloads toggle appeared under either because TCC only surfaces per-folder toggles after an app has triggered a prompt for that folder, and Downloads access had never been prompted for Python.

9. **Granting Full Disk Access to `Python.app`.**
   - **Investigation:** Added `/opt/homebrew/Cellar/python@3.13/3.13.7/Frameworks/Python.framework/Versions/3.13/Resources/Python.app` to Full Disk Access via System Settings (`Cmd+Shift+G` in the file picker to reach `/opt`, which is hidden by default). Removed the stale `python3.13` entry. Fully quit and restarted Claude Desktop.
   - **Outcome:** Still failed with the same `errno 1`. Same venv python, same ppid chain, same error.

#### Where We Are Now

`Python.app` has Full Disk Access and the read still fails. Remaining hypotheses:

- The venv python isn't inheriting TCC from `Python.app`. Venv pythons are often symlinks or copies of the Homebrew binary, and TCC may treat them as their own identity rather than following to `Python.app`. **Fix:** add the venv's actual python binary to Full Disk Access directly.
- Claude Desktop is the responsible process, not `Python.app`. Recent macOS versions sometimes attribute child processes to the top-level GUI app rather than following the exec chain. **Fix:** grant `Claude.app` Full Disk Access.
- TCC state is corrupted. Not uncommon after multiple grants/denies. **Fix:** run `tccutil reset SystemPolicyAllFiles` and re-grant.