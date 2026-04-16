# Claude Desktop: MCP client learnings

Notes for designing and operating local MCP servers (especially file-heavy and Python-executor flows) against **Claude Desktop**.

## Elicitation

Anthropic’s MCP docs that describe **elicitation** target **Claude Code** (CLI), not **Claude Desktop**. Desktop’s client often **does not advertise** `elicitation` in `initialize`, and **`elicitation/create`** can return **`Method not found`** (`-32601`) — the handler is not implemented in that host. Interactive `ask_user`-style flows need a client that implements elicitation (e.g. VS Code with MCP), not Desktop alone, until Desktop adds support.

## Chat file uploads vs local paths

When a user drags a CSV (or any file) into Claude Desktop, content goes to Anthropic’s backend and is injected as **text in the model context**. There is **no predictable local path** (e.g. `/mnt/transactions.csv`) the MCP server can open. The server runs as a **local child process** and has **no handle to uploaded bytes**. Paths like `/mnt/...` exist in **sandboxed** environments (e.g. Claude Code Execution, Cowork’s VM) — **not** in ordinary Desktop chat.

## How Desktop spawns MCP servers

Claude Desktop reads **`claude_desktop_config.json` at launch**, spawns each configured server as a **child process**, and uses **JSON-RPC 2.0 over stdio**: `initialize` → `tools/list` → `tools/call`. Arguments after the package name become **`sys.argv`** in the server (how the reference filesystem server gets allowed directories). **Stdout is protocol-only**; **logging goes to stderr** (e.g. macOS: `~/Library/Logs/Claude/mcp-server-*.log`). **Config changes need a full app restart**, not only closing the window.

## MCP “roots” and uploads

**Roots** advertise workspace boundaries in the protocol, but in Claude Desktop they come from your **configured allowlist**, **not** from chat uploads. There is **no built-in** way to auto-expose a dragged-in file to a local MCP server.

## Getting files to the server (practical paths)

1. User supplies a **path** the server reads under an allowed directory.
2. Ship a **dedicated workspace** directory and ask users to drop files there (often the cleanest for finance/insurance-style workflows; sensible defaults: `~/Desktop`, `~/Downloads`, `~/Documents`, `~/MitoWorkspace`).
3. Pass **small file contents as a string** tool argument.
4. **Cowork**: uploads may land on disk, but host↔VM path translation can be **broken** for host-side MCP servers — treat as environment-specific.

## “Analyze this CSV” mental model

The **model** sees CSV text from the upload in context, then calls your tool with a **filename**. Your server looks under **allowed directories** for a match, uses it if unambiguous, or returns an error asking for a **path**. After validation, an IPython kernel can `pd.read_csv(path)` directly — you may not need separate `read_file` tools if the kernel is the executor.

## Permissions reality

The MCP server runs as the user and **inherits OS permissions** (it can read what the user can read). An **allowlist is voluntary**: enforced by **your code**, not by Claude Desktop or the OS. **Without** containment, an eager model can incidentally read SSH keys, `.env`, cookies, cloud credentials — not necessarily from malice. For enterprise (banks, insurers), explicit containment is the difference between a defensible design and a failed security review.

## Path validation

Use **`realpath` / `Path.resolve()`** (and containment checks **after** resolution). **String prefix** checks are unsafe (`..`, symlinks). **Writes**: validate the **parent** when the target file does not exist yet. Apply the same containment rules to reads and writes.

## Defense in depth (inside the allowlist)

- **Containment**: resolved path must stay under resolved allowlist roots.
- **Path denylist**: e.g. `.ssh`, `.aws`, `.gnupg`, Keychains; patterns like `*.pem`, `.env*`, `id_rsa*`; deny obvious system locations (`/etc`, `~/Library/Keychains`, etc.).
- **Content sniffing** (optional): reject lines that look like PEM headers, `aws_access_key_id`, etc.

Run checks **after** `realpath`. Denylists **backstop** a tight allowlist — they do not replace a permissive allowlist.

## Python / IPython kernel caveat

If the kernel runs **arbitrary model code**, validation only on **named tools** is insufficient: the model can call `open()` or `pandas.read_csv()` directly. **Two layers**: validate paths in every tool that accepts a path, and **monkey-patch** `builtins.open`, `pathlib.Path.open`, and `pandas.read_csv` in the kernel namespace to route through the same validator.

## UX

Desktop may show **per-tool approval**; users often **habituate to Allow** — security cannot rely on that alone. **Pre-populate** allowlist defaults on install. Consider a runtime **`add_allowed_directory`** tool with a clear approval step. **Log every denial with a reason** for audit (enterprise) and debugging.

