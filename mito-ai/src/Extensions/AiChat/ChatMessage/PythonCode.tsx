import React, { useEffect, useState } from 'react';
import { IRenderMimeRegistry, MimeModel } from '@jupyterlab/rendermime';

import '../../../../style/PythonCode.css';

interface IPythonCodeProps {
  code: string;
  rendermime: IRenderMimeRegistry;
}

const PythonCode: React.FC<IPythonCodeProps> = ({ code, rendermime }) => {
  const [renderedContent, setRenderedContent] = useState<JSX.Element | null>(null);

  console.log('code', code);

  useEffect(() => {
    const renderMarkdown = async () => {
      const model = new MimeModel({
        data: { ['text/markdown']: code },
      });

      const renderer = rendermime.createRenderer('text/markdown');
      await renderer.renderModel(model);

      const node = renderer.node;
      setRenderedContent(<div ref={(el) => el && el.appendChild(node)} />);
    };

    renderMarkdown();
  }, [code, rendermime]);

  return (
    <div className='code-message-part-python-code'>
      {renderedContent || <div>No content</div>}
    </div>
  );
};

export default PythonCode;