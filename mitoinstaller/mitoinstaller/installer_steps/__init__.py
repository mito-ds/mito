# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mitoinstaller.installer_steps.installer_step_utils import run_installer_steps

from mitoinstaller.installer_steps.initial_installer_steps import INITIAL_INSTALLER_STEPS
from mitoinstaller.installer_steps.mitosheet_installer_steps import MITOSHEET_INSTALLER_STEPS
from mitoinstaller.installer_steps.final_installer_steps import FINAL_INSTALLER_STEPS


ALL_INSTALLER_STEPS = INITIAL_INSTALLER_STEPS + MITOSHEET_INSTALLER_STEPS + FINAL_INSTALLER_STEPS