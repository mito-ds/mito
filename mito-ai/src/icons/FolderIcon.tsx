/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// import React from "react";

// export const FolderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
//     <path d="M3 7h5l2 2h11v11H3z" />
//   </svg>
// );

import React from 'react';

const FolderIcon: React.FC = () => {
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
      <path d="M10 4H4a2 2 0 0 0-2 2v2h20V6a2 2 0 0 0-2-2h-8l-2-2zM22 10H2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8z"/>
  </svg>
  );
};

export default FolderIcon;
