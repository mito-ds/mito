/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { LabIcon } from '@jupyterlab/ui-components';
import LightbulbIcon from '../../src/icons/LightbulbIcon.svg';
import NucleusIcon from '../../src/icons/NucleusIcon.svg';
import OpenIndicatorIcon from '../../src/icons/OpenIndicatorIcon.svg';
import AppBuilderExcludeCellIcon from '../../src/icons/AppBuilderExcludeCellIcon.svg';
import AppBuilderIncludeCellIcon from '../../src/icons/AppBuilderIncludeCellIcon.svg';

export const lightBulbLabIcon = new LabIcon({
  name: 'lightbulb-icon',
  svgstr: LightbulbIcon
});

export const NucleusLabIcon = new LabIcon({
  name: 'nucleus-icon',
  svgstr: NucleusIcon
});

export const OpenIndicatorLabIcon = new LabIcon({
  name: 'open-indicator-icon',
  svgstr: OpenIndicatorIcon
});

export const AppBuilderExcludeCellLabIcon = new LabIcon({
  name: 'app-builder-exclude-cell-icon',
  svgstr: AppBuilderExcludeCellIcon
});

export const AppBuilderIncludeCellLabIcon = new LabIcon({
  name: 'app-builder-include-cell-icon',
  svgstr: AppBuilderIncludeCellIcon
});
