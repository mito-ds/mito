/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import '../../../style/ConnectionForm.css';
import '../../../style/button.css';
import '../../../style/FilesSelector.css';

import { fileIcon, folderIcon, closeIcon } from '@jupyterlab/ui-components';

const FileIcon = fileIcon.react;
const FolderIcon = folderIcon.react;
const CloseIcon = closeIcon.react;

interface FileUploadPopupProps {
  filePath: string,
  appFileName: string,
  onClose: () => void;
  onSubmit: (items: string[]) => void;
}

export const FileUploadPopup: React.FC<FileUploadPopupProps> = ({
  filePath,
  appFileName,
  onClose,
  onSubmit
}) => {
  const [items, setItems] = useState<{ name: string; type: string }[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Figure out current notebook directory
  const getNotebookDir = (): string => {
    if (!filePath) return '';
    const parts = filePath.split('/');
    parts.pop(); // remove notebook filename
    return parts.join('/');
  };

  const alwaysSelected = ['requirements.txt', appFileName];
  useEffect(() => {
    const nbDir = getNotebookDir();
    const apiPath = nbDir ? `/api/contents/${nbDir}` : '/api/contents/';

    fetch(apiPath)
      .then(res => res.json())
      .then(data => {
        const entries: { name: string; type: string }[] = data.content.map((item: any) => ({
          name: item.name,
          type: item.type, // "file" or "directory"
        }))
          .sort((a: { name: string; type: string }, b: { name: string; type: string }) =>
            a.name.localeCompare(b.name)
          );
        setItems(entries);

        // Pre-select default files
        const defaultFiles = new Set<string>();
        entries.forEach(entry => {
          if (alwaysSelected.includes(entry.name)) {
            defaultFiles.add(entry.name);
          }
        });
        setSelectedItems(defaultFiles);

      })
      .catch(err => console.error('Error fetching files/dirs:', err));
  }, []);

  const handleCheckboxChange = (name: string): void => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) newSet.delete(name);
      else newSet.add(name);
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean): void => {
    if (checked) {
      // select all, nothing excluded
      setSelectedItems(new Set(items.map(i => i.name)));
    } else {
      // keep only alwaysSelected
      setSelectedItems(new Set(alwaysSelected));
    }
  };


  const handleSubmit = (): void => {
    const selectedPaths = Array.from(selectedItems);

    onSubmit(selectedPaths);
    onClose();
  };

  const allSelected = items.length > 0 && selectedItems.size === items.length;
  const partiallySelected = selectedItems.size > 0 && selectedItems.size < items.length;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Upload files Required for the App</h3>
          <button onClick={onClose} className="modal-close-button" title="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="modal-subheader">
          <p className="modal-subtext">
            Select the files and/or directories that are required to render the app. For example, if your app reads data from a csv file, you must select it here.
          </p>
        </div>

        <div className="modal-body">
          {items.length === 0 ? (
            <p>No items found.</p>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="files-selector-select-all">
                <label className="checkbox-label">
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
                className="file-list-scrollable">
                <ul className="file-list">
                  {items.map((item, index) => (
                    <li key={index}>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.name)}
                          onChange={() => handleCheckboxChange(item.name)}
                          disabled={alwaysSelected.includes(item.name)}
                          title={alwaysSelected.includes(item.name) ? "Required for deploying your app" : undefined}
                        />
                        {item.type === 'directory' ? <FolderIcon /> : <FileIcon />} {item.name}
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
            className="files-selector-submit-button"
            onClick={handleSubmit}
            disabled={selectedItems.size === 0}
          >
            Deploy App
          </button>
        </div>
      </div>
    </div>
  );
};
