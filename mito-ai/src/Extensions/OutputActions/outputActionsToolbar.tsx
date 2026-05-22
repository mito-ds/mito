/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import '../../../style/OutputActionsToolbar.css';

export const OUTPUT_ACTIONS_HOST_CLASS = 'mito-output-actions-host';
export const OUTPUT_ACTIONS_TOOLBAR_CLASS = 'mito-output-actions-toolbar';

export type OutputActionSlot = 'viewCode' | 'chartWizard' | 'comment';

const SLOT_ORDER: OutputActionSlot[] = ['viewCode', 'chartWizard', 'comment'];

const slotRoots = new WeakMap<HTMLElement, Map<OutputActionSlot, Root>>();

function slotClassName(slot: OutputActionSlot): string {
  return `mito-output-action-slot mito-output-action-slot-${slot}`;
}

function getSlotRoots(toolbar: HTMLElement): Map<OutputActionSlot, Root> {
  let roots = slotRoots.get(toolbar);
  if (!roots) {
    roots = new Map();
    slotRoots.set(toolbar, roots);
  }
  return roots;
}

function ensureSlotOrder(toolbar: HTMLElement): void {
  for (const slot of SLOT_ORDER) {
    const slotEl = toolbar.querySelector(`.mito-output-action-slot-${slot}`);
    if (slotEl) {
      toolbar.appendChild(slotEl);
    }
  }
}

export function getOrCreateOutputActionsToolbar(host: HTMLElement): HTMLElement {
  host.style.position = 'relative';
  host.classList.add(OUTPUT_ACTIONS_HOST_CLASS);

  let toolbar = host.querySelector(`.${OUTPUT_ACTIONS_TOOLBAR_CLASS}`) as HTMLElement | null;
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.className = OUTPUT_ACTIONS_TOOLBAR_CLASS;
    host.appendChild(toolbar);
  }
  return toolbar;
}

export function hasOutputActionSlot(host: HTMLElement, slot: OutputActionSlot): boolean {
  return !!host.querySelector(`.mito-output-action-slot-${slot}`);
}

export function mountOutputAction(
  host: HTMLElement,
  slot: OutputActionSlot,
  element: React.ReactElement
): Root {
  unmountOutputAction(host, slot);
  const toolbar = getOrCreateOutputActionsToolbar(host);

  const slotEl = document.createElement('div');
  slotEl.className = slotClassName(slot);
  toolbar.appendChild(slotEl);
  ensureSlotOrder(toolbar);

  const root = createRoot(slotEl);
  getSlotRoots(toolbar).set(slot, root);
  root.render(element);
  return root;
}

export function unmountOutputAction(host: HTMLElement, slot: OutputActionSlot): void {
  const toolbar = host.querySelector(`.${OUTPUT_ACTIONS_TOOLBAR_CLASS}`) as HTMLElement | null;
  if (!toolbar) {
    return;
  }

  const slotEl = toolbar.querySelector(`.mito-output-action-slot-${slot}`);
  if (!slotEl) {
    return;
  }

  const roots = slotRoots.get(toolbar);
  const existingRoot = roots?.get(slot);
  if (existingRoot) {
    existingRoot.unmount();
    roots?.delete(slot);
  }

  slotEl.remove();

  if (toolbar.childElementCount === 0) {
    toolbar.remove();
    host.classList.remove(OUTPUT_ACTIONS_HOST_CLASS);
  }
}
