import React from 'react';

import prismStlyes from '../../styles/prism.module.css';
import codeBlockStyles from './CodeBlock.module.css'
import { classNames } from '../../utils/classNames';


const CodeBlock = (props:{code: string}) => {
  // Apply syntax highlighting to the provided code

  return (
    <pre className={codeBlockStyles.container}>
        <code className={classNames(prismStlyes.codeBlock, "language-python")}>{props.code}</code>
    </pre>
  );
};

export default CodeBlock;
