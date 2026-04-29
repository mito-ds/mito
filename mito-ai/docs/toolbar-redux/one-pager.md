# Notebook Toolbar Modes — Functional One Pager

## Purpose
Define the functional button requirements for each notebook toolbar mode, without prescribing visual design, placement, or styling.

## Scope
This covers toolbar controls for:
- `Notebook` mode
- `Document` mode
- `App` mode

## Mode/Button Matrix

| Mode | Required Buttons / Controls | Functional Purpose |
|---|---|---|
| `Notebook` | **Mode Switcher** (`Notebook`, `Document`, `App`) | Lets users move between viewing/interaction modes. |
| `Notebook` | **Run Active Cell** | Executes the currently selected cell. |
| `Notebook` | **Run Menu: Run Current Cell** | Executes active cell (alternative entry via menu). |
| `Notebook` | **Run Menu: Run All Cells** | Executes notebook cells top-to-bottom. |
| `Notebook` | **Run Menu: Restart and Run All** | Restarts kernel, then runs all cells from a clean state. |
| `Notebook` | **Run Menu: Restart Kernel** | Clears runtime state by restarting kernel. |
| `Notebook` | **Run Menu: Stop / Interrupt Kernel** | Interrupts currently running execution. |
| `Notebook` | **Run Menu: Clear All Outputs** | Removes all rendered outputs from notebook cells. |
| `Notebook` | **Standard Notebook Toolbar Controls** (native) | Preserves normal notebook editing/runtime operations available from the host notebook environment. |
| `Document` | **Mode Switcher** (`Notebook`, `Document`, `App`) | Allows transitioning out of read-focused document view. |
| `App` | **Mode Switcher** (`Notebook`, `Document`, `App`) | Allows transitioning between app preview and notebook/document workflows. |
| `App` | **Edit app code** | Opens generated app source for direct code-level edits. |
| `App` | **Edit App** | Opens app-update flow for modifying the generated app behavior/content. |
| `App` | **Recreate App** | Regenerates app from current notebook state. |
| `App` | **Deploy App** *(conditional)* | Deploys/publishes app when deploy capability is enabled. |

## Global Functional Requirements

- Mode switcher is always available in toolbar context, across all modes.
- Notebook mode is execution-centric (cell run and kernel lifecycle controls).
- Document mode is minimal (mode switching only).
- App mode is app-management-centric (edit/update/recreate/deploy actions plus mode switching).

## Conditional Availability Rules

- Deploy App is conditional and only appears when deployment/beta capability is enabled.
- Some execution controls are context-dependent on active notebook/kernel state (for example, interrupt/restart relevance).
