import React, { useEffect, useState } from 'react';
import { IRenderMimeRegistry, MimeModel } from '@jupyterlab/rendermime';


interface IMarkdownCodeProps {
    markdown: string;
    rendermime: IRenderMimeRegistry;
}

const MarkdownBlock: React.FC<IMarkdownCodeProps> = ({ markdown, rendermime }) => {
    const [renderedContent, setRenderedContent] = useState<JSX.Element | null>(null);


    useEffect(() => {
        const renderMarkdown = async () => {
            const model = new MimeModel({
                data: { ['text/markdown']: markdown },
            });

            const renderer = rendermime.createRenderer('text/markdown');
            await renderer.renderModel(model);

            const node = renderer.node;
            setRenderedContent(<div ref={(el) => el && el.appendChild(node)} />);
        };

        renderMarkdown();
    }, [markdown, rendermime]);

    return (
        <div>{renderedContent || <div></div>} </div>
    );
};

export default MarkdownBlock;
