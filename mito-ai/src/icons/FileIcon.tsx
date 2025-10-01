/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// import React from "react";
//
// export const FileIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     width="20"
//     height="20"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     viewBox="0 0 24 24"
//     {...props}
//   >
//     <path d="M14 2H6a2 2 0 0 0-2 2v16
//              a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
//     <path d="M14 2v6h6" />
//   </svg>
// );


import React from 'react';

const FileIcon: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16
               a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
};

export default FileIcon;
