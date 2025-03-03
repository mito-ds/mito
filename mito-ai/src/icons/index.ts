import { LabIcon } from '@jupyterlab/ui-components';
import LightbulbIcon from '../../src/icons/LightbulbIcon.svg';
import NucleusIcon from '../../src/icons/NucleusIcon.svg';
import OpenIndicatorIcon from '../../src/icons/OpenIndicatorIcon.svg';

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