# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.utils.provider_utils import get_model_provider


def test_copilot_prefix_maps_to_copilot() -> None:
    assert get_model_provider("copilot/gpt-4.1") == "copilot"


def test_abacus_prefix_still_works() -> None:
    assert get_model_provider("abacus/foo") == "abacus"
