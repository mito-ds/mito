/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import {
  findCodeCellIndexForWidgetModelId,
  findNotebookCellIndexContainingDomNode
} from '../../Extensions/NotebookViewMode/documentReactiveOrigin';

const widgetViewData = (modelId: string) => ({
  output_type: 'display_data' as const,
  data: {
    'application/vnd.jupyter.widget-view+json': {
      model_id: modelId,
      version_major: 2,
      version_minor: 0
    }
  },
  metadata: {}
});

describe('documentReactiveOrigin', () => {
  describe('findCodeCellIndexForWidgetModelId', () => {
    it('returns null when no code cell references the model id', () => {
      const notebook = {
        widgets: [
          {
            model: { type: 'code', outputs: { toJSON: () => [] } }
          }
        ]
      };
      expect(findCodeCellIndexForWidgetModelId(notebook as never, 'missing')).toBeNull();
    });

    it('returns the code cell index that contains a matching widget view output', () => {
      const notebook = {
        widgets: [
          { model: { type: 'markdown' } },
          {
            model: {
              type: 'code',
              outputs: {
                toJSON: () => [widgetViewData('model-uuid-1')]
              }
            }
          },
          {
            model: {
              type: 'code',
              outputs: {
                toJSON: () => [widgetViewData('other')]
              }
            }
          }
        ]
      };
      expect(
        findCodeCellIndexForWidgetModelId(notebook as never, 'model-uuid-1')
      ).toBe(1);
    });
  });

  describe('findNotebookCellIndexContainingDomNode', () => {
    it('returns null for null target', () => {
      const notebook = { widgets: [] };
      expect(findNotebookCellIndexContainingDomNode(notebook as never, null)).toBeNull();
    });

    it('returns the index of the cell whose node contains the target', () => {
      const inner = document.createElement('span');
      const cell0 = { node: document.createElement('div') };
      const cell1 = { node: document.createElement('div') };
      cell1.node.appendChild(inner);
      const notebook = { widgets: [cell0, cell1] };
      expect(findNotebookCellIndexContainingDomNode(notebook as never, inner)).toBe(1);
    });
  });
});
