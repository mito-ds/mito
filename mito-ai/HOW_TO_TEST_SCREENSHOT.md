# 🧪 How to Test Screenshot Capture with Rectangle Selection

## 🎯 Two Ways to Test

You can test the canvas screenshot capture feature in two ways:

1. **Standalone HTML Demo** (easiest, no build required)
2. **JupyterLab Extension** (integrated into your extension)

---

## Method 1: Standalone HTML Demo (Quickest!)

### Step 1: Open the Demo File

The demo file is located at: `/workspace/mito-ai/screenshot-test-demo.html`

**Option A: Open in Browser**
```bash
# From your terminal
cd /workspace/mito-ai
open screenshot-test-demo.html  # macOS
# or
xdg-open screenshot-test-demo.html  # Linux
# or just drag the file into your browser
```

**Option B: Use a Local Server**
```bash
cd /workspace/mito-ai
python3 -m http.server 8000
# Then open: http://localhost:8000/screenshot-test-demo.html
```

### Step 2: Test the Screenshot Feature

1. Click **"Enable Selection Mode"**
2. **Click and drag** on the colored demo area to draw a rectangle
3. **Release** to capture that region
4. View the captured screenshot below with performance metrics
5. Click **"Download Screenshot"** to save it

### What You'll See

- ✅ **Duration**: How long the capture took (should be <500ms)
- ✅ **File Size**: Size of the captured PNG in KB
- ✅ **Dimensions**: Width × Height of the captured image
- ✅ **Performance**: Pass/Fail indicator for <500ms target
- 📸 **Screenshot Preview**: The actual captured image

### Expected Results

```
✅ Duration: 175-450ms
✅ File Size: 50-200KB (depending on region size)
✅ Performance: PASS (<500ms)
✅ Screenshot quality: Full color and style preservation
```

---

## Method 2: JupyterLab Extension Integration

### Step 1: Build the Extension

```bash
cd /workspace/mito-ai

# Install dependencies (if needed)
npm install

# Build the extension
npm run build

# Or for development mode
npm run build:lib
```

### Step 2: Install/Reload the Extension

**If JupyterLab is running:**
1. Refresh your browser (Cmd+R / Ctrl+R)
2. Or restart JupyterLab

**If JupyterLab is not installed:**
```bash
# Install the extension
pip install -e .

# Start JupyterLab
jupyter lab
```

### Step 3: Open the Screenshot Test UI

**Option A: Command Palette**
1. Press `Cmd+Shift+C` (Mac) or `Ctrl+Shift+C` (Windows/Linux)
2. Type "screenshot"
3. Select **"📸 Test Screenshot Capture"**

**Option B: Browser Console**
```javascript
// Open browser console (F12 or Cmd+Option+I)
// Type this command:
showScreenshotTestUI();
```

### Step 4: Capture a Screenshot

1. **Blue overlay appears** with instructions
2. **Click and drag** anywhere on the JupyterLab interface
3. **Release** to capture that region
4. **Screenshot is captured** and download link appears
5. **Press ESC** to exit at any time

### What You'll See

```
Console Output:
[Screenshot Test] UI activated. Click and drag to select a region, or press ESC to exit.
[Screenshot Test] Capturing region: 400x300 at (100, 150)
[Screenshot Test] ✅ SUCCESS
[Screenshot Test] Duration: 247.32ms
[Screenshot Test] Size: 156KB
[Screenshot Test] Performance: ✅ PASS (<500ms)
```

Plus:
- **Download link** appears in top-right corner
- **Success notification** at bottom-right
- **Screenshot automatically saved** (click download link)

---

## 🎮 Testing Tips

### Test Different Content Types

**In Standalone Demo:**
- Capture just the heading
- Capture one color box
- Capture all color boxes
- Capture the full demo area

**In JupyterLab:**
- Capture a code cell
- Capture cell output (plots, tables, text)
- Capture part of a large DataFrame
- Capture the entire notebook view

### Performance Testing

```javascript
// Run multiple captures and average the time
async function performanceTest(selector, iterations = 10) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await testCapture(selector);
    const duration = performance.now() - start;
    times.push(duration);
    console.log(`Test ${i+1}: ${duration.toFixed(2)}ms`);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`Average: ${avg.toFixed(2)}ms`);
  console.log(`Min: ${Math.min(...times).toFixed(2)}ms`);
  console.log(`Max: ${Math.max(...times).toFixed(2)}ms`);
}

// Run it
performanceTest('.jp-Cell', 5);
```

### Compare with html2canvas

If you still have the old implementation:

```javascript
// Test new canvas approach
const start1 = performance.now();
await testCapture('.jp-Cell-outputArea');
const newTime = performance.now() - start1;

// Test html2canvas approach (if available)
import { captureNode } from './lib/utils/nodeToPng.js';
const start2 = performance.now();
await captureNode(document.querySelector('.jp-Cell-outputArea'));
const oldTime = performance.now() - start2;

console.log(`New approach: ${newTime.toFixed(2)}ms`);
console.log(`Old approach: ${oldTime.toFixed(2)}ms`);
console.log(`Improvement: ${((oldTime - newTime) / oldTime * 100).toFixed(1)}%`);
```

---

## 🐛 Troubleshooting

### Issue: HTML demo doesn't open
**Solution**: Make sure you're opening the file in a modern browser (Chrome, Firefox, Safari, Edge). IE is not supported.

### Issue: "Cannot find module" error in JupyterLab
**Solution**: Make sure you've built the extension:
```bash
cd /workspace/mito-ai
npm run build
```
Then refresh JupyterLab.

### Issue: Command doesn't appear in palette
**Solution**: 
1. Check console for errors: `Cmd+Option+I` (Mac) or `F12` (Windows/Linux)
2. Make sure the extension is registered in `src/index.ts`
3. Rebuild and reload JupyterLab

### Issue: Screenshot is blank
**Solution**: 
- Wait a moment for content to fully render
- Try a different region
- Check console for errors

### Issue: Selection doesn't work
**Solution**:
- Make sure you clicked "Enable Selection Mode" (standalone demo)
- Make sure the overlay is visible (JupyterLab)
- Try clicking and dragging slowly
- Press ESC and try again

---

## ✅ Success Checklist

After testing, verify:

- [ ] Can activate screenshot mode (both methods)
- [ ] Can draw a rectangle selection
- [ ] Rectangle shows blue border and transparent fill
- [ ] Screenshot captures on mouse release
- [ ] Download link appears
- [ ] Screenshot quality is good (no missing colors/styles)
- [ ] Performance is <500ms consistently
- [ ] Console shows timing metrics
- [ ] Can capture different content types
- [ ] ESC key exits mode (JupyterLab)
- [ ] Reset button works (standalone demo)

---

## 📊 Expected Performance

| Content Type | Target | Typical |
|--------------|--------|---------|
| Simple text | <500ms | 150-250ms |
| HTML table | <500ms | 200-350ms |
| Matplotlib plot | <500ms | 250-450ms |
| Complex layout | <500ms | 300-500ms |

**All should be under 500ms!**

---

## 🎬 Quick Start Commands

**Standalone Demo:**
```bash
cd /workspace/mito-ai
open screenshot-test-demo.html
```

**JupyterLab Build:**
```bash
cd /workspace/mito-ai
npm run build
# Refresh browser
```

**JupyterLab Command:**
- Open Command Palette: `Cmd+Shift+C`
- Type: "screenshot"
- Select: "📸 Test Screenshot Capture"

**Browser Console Test:**
```javascript
showScreenshotTestUI();  // JupyterLab
quickTest('.demo-area');  // Standalone demo
```

---

## 📸 Screenshots of What to Expect

### Standalone Demo
- **Before**: Colorful demo area with instructions
- **During**: Blue rectangle overlay as you drag
- **After**: Screenshot preview + performance metrics

### JupyterLab
- **Before**: Normal JupyterLab interface
- **During**: Blue overlay with crosshair cursor
- **After**: Download link + success notification

---

## 🚀 Next Steps

Once you've verified it works:

1. **Integration**: Connect to Streamlit preview UI
2. **UI Polish**: Add description input modal
3. **Backend**: Wire up to AI editing endpoint
4. **Production**: Add error handling and telemetry

---

## 📞 Need Help?

**Check the documentation:**
- Quick reference: `SCREENSHOT_QUICK_REFERENCE.md`
- Full API docs: `src/utils/CANVAS_SCREENSHOT_README.md`
- Implementation details: `IMPLEMENTATION_SUMMARY.md`

**Console debugging:**
```javascript
// Enable verbose logging
PRINT_LOGS = true;

// Test manually
import { captureElement } from './utils/capture';
const el = document.querySelector('.jp-Cell');
const screenshot = await captureElement(el);
console.log('Screenshot captured:', screenshot.substring(0, 100));
```

---

**Happy testing! 🎉**
