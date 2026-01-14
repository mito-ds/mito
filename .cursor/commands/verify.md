# Verify Feature Command

When invoked, automatically test and fix the feature that you just created using the Browser tool to access JupyterLab. Continue correcting and verifying the feature until it works. 

## Execution Steps

### 0. Setting up Environment

Make sure that the code passes linting first. Check the typescript terminal that is running for errors. You must resolve those first to ensure you are testing the most up to date version of the code.

### 1. Check JupyterLab Status

First, verify JupyterLab is running on port 8888. Navigate to:
```
http://localhost:8888/lab?token=dev-token-for-cursor-testing-12345
```

### 2. Navigate and Load

Use browser to navigate to JupyterLab URL above. Wait 3-5 seconds for full page load, then take a snapshot to understand current state.

### 3. Identify Feature to Test

Use the conversation history to identify the feature to test. Your goal is to QA the new feature that was just created.

### 4. Test the Feature

Interact with the feature using browser tools:

### 5. Check for Issues

After each interaction:
- **Browser console**: Use `browser_console_messages` to check for JavaScript/TypeScript errors
- **Network requests**: Use `browser_network_requests` to verify API calls succeed
- **UI state**: Take snapshots to verify elements render correctly
- **Functionality**: Verify feature works as intended

### 6. Fix Issues Found

- Fix the issues you found if if they are related to the feature you are testing
- Document any additional issues you found that are not related to the feature you are testing

### 7. Rebuild and Re-test

After making fixes:

1. **Setup Environment**: 
   - For frontend changes: Wait a few seconds for rebuild to complete
   - For backend changes: Restart and relaunch the server 

2. **Refresh browser**: 
   - Take new snapshot
   - Re-test the feature
   - Verify fix worked

### 8. Iterate Until Complete

Repeat steps 4-7 until the feature works correctly.