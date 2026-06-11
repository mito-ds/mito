# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import tempfile
import unittest
from unittest.mock import patch

from mito_ai_core.verified_reports import utils as vr_utils


class TestVerifiedReportsUtils(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.mkdtemp()
        self.reports_patcher = patch.object(vr_utils, "VERIFIED_REPORTS_DIR_PATH", self.temp_dir)
        self.reports_patcher.start()

    def tearDown(self) -> None:
        self.reports_patcher.stop()
        for filename in os.listdir(self.temp_dir):
            os.remove(os.path.join(self.temp_dir, filename))
        os.rmdir(self.temp_dir)

    def test_add_and_read_snippet(self) -> None:
        snippet = vr_utils.add_snippet(
            "retention-report",
            "df['retention'] = ...",
            "Always cohort by quarter",
            "Uses quarterly cohorts",
            description="Retention calculations",
        )
        self.assertIn("id", snippet)
        report = vr_utils.get_verified_report("retention-report")
        assert report is not None
        self.assertEqual(len(report["snippets"]), 1)
        self.assertEqual(report["snippets"][0]["comment"], "Always cohort by quarter")

        result = vr_utils.read_verified_report("retention-report")
        self.assertTrue(result.success)
        assert result.output is not None
        self.assertIn("retention-report", result.output)
        self.assertIn("Always cohort by quarter", result.output)

    def test_delete_snippet(self) -> None:
        snippet = vr_utils.add_snippet("test-report", "x = 1", "comment", "context")
        deleted = vr_utils.delete_snippet("test-report", snippet["id"])
        self.assertTrue(deleted)
        report = vr_utils.get_verified_report("test-report")
        assert report is not None
        self.assertEqual(len(report["snippets"]), 0)


if __name__ == "__main__":
    unittest.main()
