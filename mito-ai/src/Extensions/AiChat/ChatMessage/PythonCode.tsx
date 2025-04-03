/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useRef } from 'react';
import { IRenderMimeRegistry, MimeModel } from '@jupyterlab/rendermime';
import { addMarkdownCodeFormatting } from '../../../utils/strings';
import '../../../../style/PythonCode.css';

interface IPythonCodeProps {
  code: string;
  renderMimeRegistry: IRenderMimeRegistry;
}

const PythonCode: React.FC<IPythonCodeProps> = ({ code, renderMimeRegistry }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create renderer only once
    if (!rendererRef.current) {
      rendererRef.current = renderMimeRegistry.createRenderer('text/markdown');
    }

    const model = new MimeModel({
      data: { ['text/markdown']: addMarkdownCodeFormatting(code, true) },
    });

    const renderCode = async (): Promise<void> => {
      await rendererRef.current.renderModel(model);
      
      // Clear previous content
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      
      // Append new content
      container.appendChild(rendererRef.current.node);
    };

    void renderCode();

    // Clean up function
    return () => {
      if (rendererRef.current?.node && rendererRef.current.node.parentNode) {
        rendererRef.current.node.parentNode.removeChild(rendererRef.current.node);
      }
    };
  }, [code, renderMimeRegistry]);

  return <div className='code-block-python-code' ref={containerRef} />;
};

export default PythonCode;
