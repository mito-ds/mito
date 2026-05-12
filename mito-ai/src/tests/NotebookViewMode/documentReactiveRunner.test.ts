/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

jest.mock('../../utils/notebook', () => ({
  runAllCellsStrictlyBelow: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../Extensions/NotebookViewMode/documentReactiveOrigin', () => ({
  ...jest.requireActual('../../Extensions/NotebookViewMode/documentReactiveOrigin'),
  findNotebookCellIndexContainingDomNode: jest.fn(),
  findCodeCellIndexForWidgetModelId: jest.fn()
}));

import { Signal } from '@lumino/signaling';
import type { Kernel } from '@jupyterlab/services';
import type { NotebookPanel } from '@jupyterlab/notebook';
import { DocumentReactiveRunner } from '../../Extensions/NotebookViewMode/documentReactiveRunner';
import * as documentReactiveOrigin from '../../Extensions/NotebookViewMode/documentReactiveOrigin';
import { runAllCellsStrictlyBelow } from '../../utils/notebook';

class FakeKernel {
  readonly anyMessage = new Signal<FakeKernel, Kernel.IAnyMessageArgs>(this);
}

const findDom = documentReactiveOrigin.findNotebookCellIndexContainingDomNode as jest.MockedFunction<
  typeof documentReactiveOrigin.findNotebookCellIndexContainingDomNode
>;
const findComm = documentReactiveOrigin.findCodeCellIndexForWidgetModelId as jest.MockedFunction<
  typeof documentReactiveOrigin.findCodeCellIndexForWidgetModelId
>;

function makeTraitUpdateCommArgs(commId: string): Kernel.IAnyMessageArgs {
  return {
    direction: 'send',
    msg: {
      channel: 'shell',
      header: { msg_type: 'comm_msg' },
      content: {
        comm_id: commId,
        data: { method: 'update', state: { value: 1 } }
      }
    }
  } as unknown as Kernel.IAnyMessageArgs;
}

function createNotebookPanel(kernel: FakeKernel): NotebookPanel {
  const root = document.createElement('div');
  const outputArea = document.createElement('div');
  outputArea.className = 'jp-OutputArea';
  const input = document.createElement('input');
  outputArea.appendChild(input);
  root.appendChild(outputArea);

  const panelStub = {
    content: {
      node: root,
      widgets: [{}, {}, {}, {}, {}]
    },
    context: {
      sessionContext: {
        session: { kernel },
        kernelChanged: { connect: jest.fn(), disconnect: jest.fn() }
      }
    },
    disposed: {
      connect: jest.fn(),
      disconnect: jest.fn()
    }
  };
  return panelStub as unknown as NotebookPanel;
}

describe('DocumentReactiveRunner', () => {
  let kernel: FakeKernel;
  let panel: NotebookPanel;
  let isDocumentMode: jest.Mock<boolean, []>;

  beforeEach(() => {
    jest.useFakeTimers();
    kernel = new FakeKernel();
    panel = createNotebookPanel(kernel);
    isDocumentMode = jest.fn().mockReturnValue(true);
    (runAllCellsStrictlyBelow as jest.Mock).mockClear();
    (runAllCellsStrictlyBelow as jest.Mock).mockResolvedValue(undefined);
    findDom.mockReset();
    findComm.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not run after dispose during debounce', async () => {
    findDom.mockReturnValue(1);
    const runner = new DocumentReactiveRunner(panel, isDocumentMode);
    runner.attach();

    const input = panel.content.node.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    runner.dispose();
    jest.advanceTimersByTime(400);
    await Promise.resolve();

    expect(runAllCellsStrictlyBelow).not.toHaveBeenCalled();
  });

  it('does not flush when mode flips to Notebook before debounce elapses', async () => {
    findDom.mockReturnValue(0);
    const runner = new DocumentReactiveRunner(panel, isDocumentMode);
    runner.attach();

    const input = panel.content.node.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    isDocumentMode.mockReturnValue(false);
    jest.advanceTimersByTime(400);
    await Promise.resolve();

    expect(runAllCellsStrictlyBelow).not.toHaveBeenCalled();
  });

  it('coalesces an interaction during _reactiveRunInProgress into a second debounced run', async () => {
    let finishFirst: (() => void) | undefined;
    (runAllCellsStrictlyBelow as jest.Mock).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishFirst = resolve;
        })
    );

    findComm.mockReturnValue(0);
    const runner = new DocumentReactiveRunner(panel, isDocumentMode);
    runner.attach();

    kernel.anyMessage.emit(makeTraitUpdateCommArgs('w1'));
    jest.advanceTimersByTime(400);
    await Promise.resolve();

    expect(runAllCellsStrictlyBelow).toHaveBeenCalledTimes(1);
    expect(runAllCellsStrictlyBelow).toHaveBeenLastCalledWith(
      panel.content,
      0,
      panel.context.sessionContext
    );

    findComm.mockReturnValue(2);
    kernel.anyMessage.emit(makeTraitUpdateCommArgs('w2'));

    finishFirst!();
    await Promise.resolve();
    await Promise.resolve();

    jest.advanceTimersByTime(400);
    await Promise.resolve();

    expect(runAllCellsStrictlyBelow).toHaveBeenCalledTimes(2);
    expect(runAllCellsStrictlyBelow).toHaveBeenLastCalledWith(
      panel.content,
      2,
      panel.context.sessionContext
    );
  });

  it('uses the last origin when rapid DOM events target A then B within the debounce window', async () => {
    findDom.mockReturnValueOnce(0).mockReturnValueOnce(3);
    const runner = new DocumentReactiveRunner(panel, isDocumentMode);
    runner.attach();

    const input = panel.content.node.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));

    jest.advanceTimersByTime(400);
    await Promise.resolve();

    expect(runAllCellsStrictlyBelow).toHaveBeenCalledTimes(1);
    expect(runAllCellsStrictlyBelow).toHaveBeenCalledWith(
      panel.content,
      3,
      panel.context.sessionContext
    );
  });

  it('does not schedule post-run refresh when Document mode ends before finally runs', async () => {
    let finishFirst: (() => void) | undefined;
    (runAllCellsStrictlyBelow as jest.Mock).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishFirst = resolve;
        })
    );

    findComm.mockReturnValue(0);
    const runner = new DocumentReactiveRunner(panel, isDocumentMode);
    runner.attach();

    kernel.anyMessage.emit(makeTraitUpdateCommArgs('w1'));
    jest.advanceTimersByTime(400);
    await Promise.resolve();

    findComm.mockReturnValue(3);
    kernel.anyMessage.emit(makeTraitUpdateCommArgs('w2'));

    isDocumentMode.mockReturnValue(false);
    finishFirst!();
    await Promise.resolve();
    await Promise.resolve();

    jest.advanceTimersByTime(400);
    await Promise.resolve();

    expect(runAllCellsStrictlyBelow).toHaveBeenCalledTimes(1);
  });
});
