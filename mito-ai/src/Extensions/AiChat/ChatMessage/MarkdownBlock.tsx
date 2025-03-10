import React, { useEffect, useState } from 'react';
import { IRenderMimeRegistry, MimeModel } from '@jupyterlab/rendermime';


interface IMarkdownCodeProps {
    markdown: string;
    renderMimeRegistry: IRenderMimeRegistry;
}

const MarkdownBlock: React.FC<IMarkdownCodeProps> = ({ markdown, renderMimeRegistry }) => {
    const [renderedContent, setRenderedContent] = useState<JSX.Element | null>(null);


    useEffect(() => {
        const renderMarkdown = async (): Promise<void> => {
            const model = new MimeModel({
                data: { ['text/markdown']: markdown },
            });

            const renderer = renderMimeRegistry.createRenderer('text/markdown');
            await renderer.renderModel(model);

            const node = renderer.node;
            setRenderedContent(<div ref={(el) => el && el.appendChild(node)} />);
        };

        void renderMarkdown();
    }, [markdown, renderMimeRegistry]);

    return (
        <div>{renderedContent || <div></div>} </div>
    );
};

export default MarkdownBlock;
