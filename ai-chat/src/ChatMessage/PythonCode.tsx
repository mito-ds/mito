import React, { useEffect, useRef } from 'react';
import { IRenderMimeRegistry, MimeModel } from '@jupyterlab/rendermime';

interface IPythonCodeProps {
  code: string;
  rendermime: IRenderMimeRegistry;
}

const formatCode = (code: string) => {
  /* 
    To display code in markdown, we need to take input values like this:

    ```python x + 1```

    And turn them into this:

    ```python
    x + 1
    ```
  */

  const codeWithoutBackticks = code.split('```python')[1].split('```')[0].trim()

  // Note: We add a space after the code because for some unknown reason, the markdown 
  // renderer is cutting off the last character in the code block.
  return "```python\n" + codeWithoutBackticks + " " + "\n```"
}

const PythonCode: React.FC<IPythonCodeProps> = ({ code, rendermime }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  
  console.log(formatCode(code))

  useEffect(() => {
    if (containerRef.current) {
      const model =  new MimeModel({
        data: { ['text/markdown']: formatCode(code) },
      });

      const renderer = rendermime.createRenderer('text/markdown');
      
      renderer.renderModel(model)
      containerRef.current?.appendChild(renderer.node);
    }
  }, [code, rendermime]);

  return <div ref={containerRef}/>;
};

export default PythonCode;