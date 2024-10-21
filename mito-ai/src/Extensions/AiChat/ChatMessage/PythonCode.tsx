import React, { useEffect, useState } from 'react';
import { IRenderMimeRegistry, MimeModel } from '@jupyterlab/rendermime';

import '../../../../style/PythonCode.css';
// import { addMarkdownCodeFormatting } from '../../../utils/strings';

interface IPythonCodeProps {
  code: string;
  rendermime: IRenderMimeRegistry;
}

const PythonCode: React.FC<IPythonCodeProps> = ({ code, rendermime }) => {
  const [node, setNode] = useState<Node | null>(null)

  // const newCode = '<span style="background-color: red;" ```python world ``` </span>'

  useEffect(() => {
    const deletedLines = [0, 1, 2];

    const newCode = 'print("hello world")\n# This is a comment\nprint("foobar")'

    const wrappedCode = `
\`\`\`python
${newCode}
\`\`\`
      `;
    
    const model = new MimeModel({
      data: { ['text/markdown']: wrappedCode},
    });
  
    const renderer = rendermime.createRenderer('text/markdown');
    renderer.renderModel(model)

    // After rendering, add the background to specific lines
    const codeElement = renderer.node.querySelector('pre');
    if (codeElement) {
      const codeLines = codeElement.innerHTML.split('\n');
      const highlightedCode = codeLines.map((line, index) => {
        if (deletedLines.includes(index + 1)) {
          return `<span class="deleted-line">${line}</span>`;
        }
        return line;
      }).join('\n');
      codeElement.innerHTML = highlightedCode;
    }


    const node = renderer.node
    setNode(node)
  }, [code, rendermime]) // Add dependencies to useEffect

  if (node) {
    return <div className='code-message-part-python-code' ref={(el) => el && el.appendChild(node)} />
  } else {
    return <div className='code-message-part-python-code' />
  }
};

export default PythonCode;
