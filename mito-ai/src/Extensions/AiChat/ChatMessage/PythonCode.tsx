import React, { useEffect, useState } from 'react';
import { IRenderMimeRegistry, MimeModel } from '@jupyterlab/rendermime';

import '../../../../style/PythonCode.css';
import { addMarkdownCodeFormatting } from '../../../utils/strings';

interface IPythonCodeProps {
  code: string;
  renderMimeRegistry: IRenderMimeRegistry;
}

const PythonCode: React.FC<IPythonCodeProps> = ({ code, renderMimeRegistry }) => {
  const [node, setNode] = useState<Node | null>(null)

  useEffect(() => {

    const model = new MimeModel({
      data: { ['text/markdown']: addMarkdownCodeFormatting(code, true) },
    });

    const renderer = renderMimeRegistry.createRenderer('text/markdown');
    
    const renderCode = async (): Promise<void> => {
      await renderer.renderModel(model);
      const node = renderer.node;
      setNode(node);
    };
    
    void renderCode();

    // Clean up function to remove the node when component unmounts or code changes
    return () => {
      if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    };
  }, [code, renderMimeRegistry]) // Add dependencies to useEffect

  if (node) {
    return <div className='code-block-python-code' ref={(el) => el && el.appendChild(node)} />
  } else {
    return <div className='code-block-python-code' />
  }
};

export default PythonCode;
