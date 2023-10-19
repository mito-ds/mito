import React, { useEffect, useState } from 'react';
import Image from "next/image"

import codeBlockStyles from './CodeBlock.module.css'
import { classNames } from '../../utils/classNames';


const CodeBlock = (props:{code: string}) => {

  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (copied) {
      setTimeout(() => {setCopied(false)}, 3000)
    }
  }, [copied])

  return (
    <div className={codeBlockStyles.container} >
      <pre className={codeBlockStyles.code_container} onClick={async () => {
      await navigator.clipboard.writeText(props.code);
      setCopied(true);
      }}>
        <code className={classNames("language-python")}>{props.code}</code>
      </pre>
      <div className={codeBlockStyles.clipboard_container}>
        {!copied && <div className={codeBlockStyles.copy_text}>Copy!</div>}
        {copied && <div className={codeBlockStyles.copy_text}>Copied!</div>}
        <Image src={'/excel-to-python/copy_icon.svg'} alt='Clipboard' width={23} height={23} />
      </div>
    </div>
  );
};

export default CodeBlock;
