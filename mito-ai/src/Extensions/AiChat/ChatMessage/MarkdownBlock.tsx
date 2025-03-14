import React, { useEffect, useState, useRef } from 'react';
import { IRenderMimeRegistry, MimeModel } from '@jupyterlab/rendermime';
import { createPortal } from 'react-dom';

// Citation button component
interface CitationProps {
  cellId: string;
  line: number;
  context?: string;
}

const Citation: React.FC<CitationProps> = ({ cellId, line, context }) => {
  const handleClick = () => {
    console.log({ type: "citation", cell_id: cellId, line, context });
    // You can add navigation logic here in the future
  };

  return (
    <span
      className="citation-button"
      onClick={handleClick}
      title={context || `Line ${line}`}
      style={{
        backgroundColor: '#f0f7ff',
        border: '1px solid #ccc',
        borderRadius: '12px',
        padding: '2px 8px',
        fontSize: '0.75em',
        cursor: 'pointer',
        margin: '0 2px',
        color: '#0366d6',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {line}
    </span>
  );
};

// Citation Portal component to render Citation into DOM
interface CitationPortalProps extends CitationProps {
  container: HTMLElement;
}

const CitationPortal: React.FC<CitationPortalProps> = ({ container, ...props }) => {
  return createPortal(<Citation {...props} />, container);
};

interface IMarkdownCodeProps {
  markdown: string;
  renderMimeRegistry: IRenderMimeRegistry;
}

const MarkdownBlock: React.FC<IMarkdownCodeProps> = ({ markdown, renderMimeRegistry }) => {
  const [processedMarkdown, setProcessedMarkdown] = useState<string>(markdown);
  const [citations, setCitations] = useState<Array<{id: string, data: any}>>([]);
  const [citationPortals, setCitationPortals] = useState<React.ReactElement[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // First phase: Extract citations and replace them with placeholders
  useEffect(() => {
    const extractCitations = (text: string) => {
      const citationRegex = /(\{\"type\"\:\s*\"citation\".*?\})/g;
      const newCitations: Array<{id: string, data: any}> = [];
      let counter = 0;
      
      // Replace each citation with a placeholder
      const processed = text.replace(citationRegex, (match) => {
        try {
          const citation = JSON.parse(match);
          const id = `citation-${counter++}`;
          newCitations.push({ id, data: citation });
          return `{{${id}}}`;
        } catch (e) {
          console.error("Failed to parse citation JSON:", e);
          return match;
        }
      });
      
      setCitations(newCitations);
      setProcessedMarkdown(processed);
    };
    
    extractCitations(markdown);
  }, [markdown]);

  // Second phase: Render markdown with placeholders
  useEffect(() => {
    const renderMarkdown = async (): Promise<void> => {
      if (!processedMarkdown) return;
      
      try {
        const model = new MimeModel({
          data: { ['text/markdown']: processedMarkdown },
        });

        const renderer = renderMimeRegistry.createRenderer('text/markdown');
        await renderer.renderModel(model);

        if (containerRef.current) {
          // Clear previous content
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(renderer.node.cloneNode(true));
          
          // Signal that markdown is ready for citation processing
          setIsProcessing(false);
        }
      } catch (error) {
        console.error("Error rendering markdown:", error);
        setIsProcessing(false);
      }
    };

    if (processedMarkdown) {
      setIsProcessing(true);
      void renderMarkdown();
    }
  }, [processedMarkdown, renderMimeRegistry]);
  
  // Third phase: Find placeholders and create React portals for citations
  useEffect(() => {
    if (isProcessing || !containerRef.current) return;
    
    const findAndReplacePlaceholders = () => {
      const newPortals: React.ReactElement[] = [];
      
      citations.forEach(citation => {
        const placeholder = `{{${citation.id}}}`;
        const textNodes: Text[] = [];
        
        // Find all text nodes that contain our placeholder
        const walker = document.createTreeWalker(
          containerRef.current!,
          NodeFilter.SHOW_TEXT
        );
        
        let textNode;
        while ((textNode = walker.nextNode() as Text)) {
          if (textNode.nodeValue?.includes(placeholder)) {
            textNodes.push(textNode);
          }
        }
        
        // Process found text nodes
        textNodes.forEach(node => {
          if (!node.nodeValue) return;
          
          const parts = node.nodeValue.split(placeholder);
          if (parts.length > 1) {
            const fragment = document.createDocumentFragment();
            
            parts.forEach((part, i) => {
              // Add the text part
              if (part) {
                fragment.appendChild(document.createTextNode(part));
              }
              
              // Add citation portal between parts (except after the last part)
              if (i < parts.length - 1) {
                const span = document.createElement('span');
                span.classList.add('citation-container');
                span.dataset.citationId = citation.id;
                fragment.appendChild(span);
                
                // Create React portal for this span
                newPortals.push(
                  <CitationPortal
                    key={citation.id + '-' + i}
                    container={span}
                    cellId={citation.data.cell_id}
                    line={citation.data.line}
                    context={citation.data.context}
                  />
                );
              }
            });
            
            // Replace the original text node with our fragment
            if (node.parentNode) {
              node.parentNode.replaceChild(fragment, node);
            }
          }
        });
      });
      
      setCitationPortals(newPortals);
    };
    
    findAndReplacePlaceholders();
  }, [isProcessing, citations]);

  return (
    <div ref={containerRef} className="markdown-block-with-citations">
      {citationPortals}
    </div>
  );
};

export default MarkdownBlock;