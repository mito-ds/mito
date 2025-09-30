# Canvas Screenshot - Quick Reference Card

## 🚀 Quick Start

### Import
```typescript
import { captureElement, captureCellWithMetrics } from './utils/capture';
```

### Basic Usage
```typescript
// Capture full element
const element = document.querySelector('.jp-Cell');
const screenshot = await captureElement(element);

// Capture region
const screenshot = await captureElement(element, { 
  x: 50, y: 50, width: 300, height: 200 
});

// Get metrics
const { dataUrl, duration, sizeKB } = await captureCellWithMetrics(element);
```

## 📋 Common Selectors

```typescript
// JupyterLab selectors
'.jp-Cell'                           // Full cell
'.jp-Cell-outputArea'                // Cell output only
'.jp-Cell[data-cell-index="0"]'      // Specific cell by index
'.jp-OutputArea-output'              // Output content

// Streamlit preview selectors  
'.streamlit-preview-container'       // Full preview
'iframe.streamlit-app'               // Preview iframe
```

## 🧪 Browser Console Tests

```javascript
// Quick test (no build required) - paste into console:
async function quickTest(selector) {
  const el = document.querySelector(selector);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = el.offsetWidth;
  canvas.height = el.offsetHeight;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${el.offsetWidth}" height="${el.offsetHeight}">
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml">${el.outerHTML}</div>
    </foreignObject></svg>`;
  const blob = new Blob([svg], {type: 'image/svg+xml'});
  const url = URL.createObjectURL(blob);
  const img = new Image();
  return new Promise((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL();
      console.log('✓ Captured:', Math.round(dataUrl.length/1024) + 'KB');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'screenshot.png';
      a.click();
      resolve(dataUrl);
    };
    img.src = url;
  });
}

// Use it:
quickTest('.jp-Cell');
```

## ⚡ Performance Targets

| Cell Type | Target | Typical |
|-----------|--------|---------|
| Text | <500ms | 150-200ms |
| Table | <500ms | 200-350ms |
| Plot | <500ms | 250-450ms |

## 🐛 Common Issues

### Blank Screenshot
```typescript
// Wait for content to load
await new Promise(resolve => setTimeout(resolve, 100));
const screenshot = await captureElement(element);
```

### Missing Styles
```typescript
// Styles are auto-inlined, but check for:
// - External @import CSS
// - Cross-origin resources
// - Dynamic CSS variables
```

### Too Slow
```typescript
// Use selection to capture smaller region
const screenshot = await captureElement(element, {
  x: 0, y: 0, width: 500, height: 400
});
```

## 📦 Files

- **Implementation**: `src/utils/capture.ts`
- **Tests**: `src/tests/utils/capture.test.ts`
- **Docs**: `src/utils/CANVAS_SCREENSHOT_README.md`
- **Integration**: `src/utils/streamlitScreenshotIntegration.example.ts`
- **Testing Guide**: `CANVAS_SCREENSHOT_TESTING_GUIDE.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`

## 🔗 Streamlit Integration Example

```typescript
import { captureElement } from './utils/capture';

// User selects region
const selection = { x: 50, y: 50, width: 400, height: 300 };

// Capture
const screenshot = await captureElement(previewElement, selection);

// Send to AI
const editRequest = {
  screenshot,
  description: "Make the header blue",
  currentCode: appCode
};

await sendToAI(editRequest);
```

## 📊 Success Criteria

- ✅ Capture cell outputs
- ✅ <500ms performance
- ✅ Style preservation
- ✅ Region selection
- ✅ Performance logging

## 🔄 Migration from html2canvas

```typescript
// Old (html2canvas)
import { captureNode } from './utils/nodeToPng';
const base64 = await captureNode(element);

// New (canvas)
import { captureElement } from './utils/capture';
const dataUrl = await captureElement(element);
const base64 = dataUrl.split(',')[1]; // Remove data:image/png;base64, prefix
```

## 🎯 Next Steps

1. Test in JupyterLab: Use `quickTest()` in console
2. Integrate with Streamlit preview UI
3. Add selection rectangle overlay
4. Connect to AI backend
5. Add telemetry for monitoring

## 💡 Tips

- **Always wait** for content to render before capturing
- **Use selection** for better performance on large elements
- **Check console** for timing metrics
- **Test across browsers** (Chrome, Firefox, Safari)
- **Handle errors** gracefully with try/catch

---

For complete documentation, see `IMPLEMENTATION_SUMMARY.md`
