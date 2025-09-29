/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// file-upload-popup.tsx

import React, { useEffect, useState } from 'react';
// import { FaFile, FaFolder } from 'react-icons/fa';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';


import '../../../style/ConnectionForm.css';
import '../../../style/button.css';
import '../../../style/FilesSelector.css';

interface FileUploadPopupProps {
  filePath: string,
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (items: string[]) => void;
}

export const FileUploadPopup: React.FC<FileUploadPopupProps> = ({
  filePath,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [items, setItems] = useState<{ name: string; type: string }[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Figure out current notebook directory
  const getNotebookDir = () => {
    if (!filePath) return '';
    const parts = filePath.split('/');
    parts.pop(); // remove notebook filename
    return parts.join('/');
  };

  useEffect(() => {
    if (isOpen) {
      const nbDir = getNotebookDir();
      const apiPath = nbDir ? `/api/contents/${nbDir}` : '/api/contents/';

      fetch(apiPath)
        .then(res => res.json())
        .then(data => {
          const entries = data.content.map((item: any) => ({
            name: item.name,
            type: item.type, // "file" or "directory"
          }));
          setItems(entries);
          setSelectedItems(new Set()); // reset selection
        })
        .catch(err => console.error('Error fetching files/dirs:', err));
    }
  }, [isOpen]);

  const handleCheckboxChange = (name: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) newSet.delete(name);
      else newSet.add(name);
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedItems(new Set(items.map(i => i.name)));
    else setSelectedItems(new Set());
  };

  const handleSubmit = () => {
    onSubmit(Array.from(selectedItems));
    onClose();
  };

  if (!isOpen) return null;

  const allSelected = items.length > 0 && selectedItems.size === items.length;
  const partiallySelected = selectedItems.size > 0 && selectedItems.size < items.length;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Select Files or Directories</h3>
          <button onClick={onClose} className="modal-close-button" title="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {items.length === 0 ? (
            <p>No items found.</p>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="select-all">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => {
                      if (el) el.indeterminate = partiallySelected;
                    }}
                    onChange={e => handleSelectAll(e.target.checked)}
                  />
                  Select All
                </label>
              </div>

              {/* Scrollable file list */}
              <div
                className="file-list-scrollable"
                style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '8px' }}
              >
                <ul className="file-list">
                  {items.map((item, index) => (
                    <li key={index}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.name)}
                          onChange={() => handleCheckboxChange(item.name)}
                        />
                        {item.type === 'directory' ? <FolderIcon /> : <DescriptionIcon />} {item.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={selectedItems.size === 0}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
};


// interface FileUploadPopupProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSubmit: (files: FileList) => void;
// }
//
// export const FileUploadPopup: React.FC<FileUploadPopupProps> = ({
//   isOpen,
//   onClose,
//   onSubmit
// }) => {
//   const [selectedFiles, setSelectedFiles] = React.useState<FileList | null>(null);
//
//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setSelectedFiles(event.target.files);
//   };
//
//   const handleSubmit = () => {
//     if (selectedFiles) {
//       onSubmit(selectedFiles);
//       onClose(); // close modal after submit
//     }
//   };
//
//   if (!isOpen) return null;
//
//   return (
//     <div className="modal-overlay">
//       <div className="modal-content">
//         <div className="modal-header">
//           <h3>Select Files to Upload</h3>
//           <button
//             onClick={onClose}
//             className="modal-close-button"
//             title="Close"
//           >
//             ×
//           </button>
//         </div>
//
//         <div className="modal-body">
//           <input
//             type="file"
//             multiple
//             onChange={handleFileChange}
//             className="file-input"
//           />
//
//           {selectedFiles && (
//             <ul className="file-list">
//               {Array.from(selectedFiles).map((file, index) => (
//                 <li key={index}>{file.name}</li>
//               ))}
//             </ul>
//           )}
//         </div>
//
//         <div className="modal-footer">
//           <button
//             className="submit-button"
//             onClick={handleSubmit}
//             disabled={!selectedFiles}
//           >
//             Upload
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };
