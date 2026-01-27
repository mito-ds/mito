# Validate Feature Command

When invoked, automatically validate a feature or change by launching the appropriate app (JupyterLab or trymito.io), testing baseline functionality, and fixing issues until the feature works correctly.

## App Detection

Automatically determine which app to validate based on:
- Files in `mito-ai/` → Validate in JupyterLab
- Files in `trymito.io/` → Validate in trymito.io website
- User specification or plan context if provided

## Execution Steps

### 0. Setting up Environment

Make sure that the code passes linting first. Check the typescript terminal that is running for errors. You must resolve those first to ensure you are testing the most up to date version of the code.

### 1. Determine Target App and Check Status

**For JupyterLab:**
- Verify JupyterLab is running on port 8888
- Navigate to: `http://localhost:8888/lab?token=dev-token-for-cursor-testing-12345`

**For trymito.io:**
- Verify Next.js dev server is running on port 3000
- If not running, provide instructions: `cd trymito.io && npm run dev`
- Navigate to: `http://localhost:3000`

### 2. Navigate and Load

Use browser to navigate to the appropriate URL. Wait 3-5 seconds for full page load, then take a snapshot to understand current state.

### 3. Identify Feature to Test

Use the conversation history to identify the feature to test. Your goal is to validate the feature that was just created or changed.

### 4. Test the Feature

Interact with the feature using browser tools and test baseline functionality to ensure no regressions.

### 5. Check for Issues

After each interaction:
- **Browser console**: Use `browser_console_messages` to check for JavaScript/TypeScript errors
- **Network requests**: Use `browser_network_requests` to verify API calls succeed
- **UI state**: Take snapshots to verify elements render correctly
- **Functionality**: Verify feature works as intended

### 6. Fix Issues Found

Fix the issues you found if they are related to the feature you are testing. Document any additional issues you found that are not related to the feature you are testing.

### 7. Rebuild and Re-test

After making code changes and before testing again:

1. **For Frontend Changes** (TypeScript/React/CSS/JavaScript):
   - Wait a few seconds for the build to complete (check the TypeScript terminal)
   - **Refresh the browser** to load the updated code
   - Retest the feature

2. **For Backend Changes** (Python/server code):
   - **Shut down the server** (stop the running process)
   - **Relaunch the server** to load the updated backend code
   - Navigate to the app URL again
   - Wait 3-5 seconds for full page load
   - Take a new snapshot
   - Re-test the feature

### 8. Iterate Until Complete

Repeat steps 4-7 until the feature works correctly.
