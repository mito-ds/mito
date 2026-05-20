/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { flushSync } from 'react-dom';
import {
  hasOutputActionSlot,
  mountOutputAction,
} from '../../Extensions/OutputActions/outputActionsToolbar';

describe('outputActionsToolbar', () => {
  it('mounts a slot on the host', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    flushSync(() => {
      mountOutputAction(host, 'viewCode', <button type="button">View code</button>);
    });

    expect(hasOutputActionSlot(host, 'viewCode')).toBe(true);
    host.remove();
  });
});
