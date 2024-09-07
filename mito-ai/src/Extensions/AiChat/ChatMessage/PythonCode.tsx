import React, { useEffect, useState } from 'react';
import { IRenderMimeRegistry, MimeModel } from '@jupyterlab/rendermime';
import { addMarkdownCodeFormatting } from '../../../utils/strings';

import '../../../../style/PythonCode.css';

interface IPythonCodeProps {
  code: string;
  rendermime: IRenderMimeRegistry;
}

const PythonCode: React.FC<IPythonCodeProps> = ({ code, rendermime }) => {

  const [node, setNode] = useState<Node | null>(null)

  useEffect(() => {
    const model =  new MimeModel({
      data: { ['text/markdown']: addMarkdownCodeFormatting(code) },
    });
  
    const renderer = rendermime.createRenderer('text/markdown');
    
    renderer.renderModel(model)
    const node = renderer.node
    setNode(node)
  }, [])


  if (node) {
    return <div className='code-message-part-python-code' ref={(el) => el && el.appendChild(node)} />
  } else {
    return <div className='code-message-part-python-code' />
  }
};

export default PythonCode;