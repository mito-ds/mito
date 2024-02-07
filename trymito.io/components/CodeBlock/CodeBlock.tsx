import React, { useEffect, useState } from 'react';
import Image from "next/image"

import codeBlockStyles from './CodeBlock.module.css'
import { classNames } from '../../utils/classNames';


const CodeBlock = (props:{
  code: string
  className?: string
}) => {

  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (copied) {
      setTimeout(() => {setCopied(false)}, 8000)
    }
  }, [copied])

  return (
    <div className={classNames(codeBlockStyles.container_div, props.className)} onClick={async () => {

      // Undefined on some mobile devices so we disable it as to not error
      if (navigator.clipboard === undefined) {
        return;
      }
      
      await navigator.clipboard.writeText(props.code);
      setCopied(true);
    }}>
      <pre className={codeBlockStyles.code_container} >
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
