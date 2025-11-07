# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import zipfile
import logging
from mito_ai.app_deploy.app_deploy_utils import add_files_to_zip
from mito_ai.path_utils import AbsoluteNotebookDirPath

class TestAddFilesToZip:
    """Test cases for add_files_to_zip helper function"""

    def test_files_added_correctly(self, tmp_path):
        """Ensure individual files are added correctly to the zip"""
        # Create files
        f1 = tmp_path / "file1.txt"
        f1.write_text("file1 content")
        f2 = tmp_path / "file2.txt"
        f2.write_text("file2 content")

        zip_path = tmp_path / "test.zip"
        add_files_to_zip(str(zip_path), AbsoluteNotebookDirPath(str(tmp_path)), ["file1.txt", "file2.txt"], 'test-app-file-name.py')

        with zipfile.ZipFile(zip_path, "r") as zf:
            names = zf.namelist()
            assert "file1.txt" in names
            assert "file2.txt" in names
            assert len(names) == 2
            
    def test_renames_app_file(self, tmp_path):
        """Ensure individual files are added correctly to the zip"""
        # Create files
        f1 = tmp_path / "original-file-name.py"
        f1.write_text("file1 content")
        f2 = tmp_path / "file2.txt"
        f2.write_text("file2 content")

        zip_path = tmp_path / "test.zip"
        add_files_to_zip(str(zip_path), AbsoluteNotebookDirPath(str(tmp_path)), ["original-file-name.py", "file2.txt"], 'original-file-name.py')

        with zipfile.ZipFile(zip_path, "r") as zf:
            names = zf.namelist()
            assert "app.py" in names
            assert "file2.txt" in names
            assert len(names) == 2

    def test_directories_added_recursively(self, tmp_path):
        """Ensure directories are added recursively with correct relative paths"""
        nested = tmp_path / "folder"
        nested.mkdir()
        (nested / "nested1.txt").write_text("nested1 content")
        subfolder = nested / "sub"
        subfolder.mkdir()
        (subfolder / "nested2.txt").write_text("nested2 content")

        zip_path = tmp_path / "test.zip"
        add_files_to_zip(str(zip_path), AbsoluteNotebookDirPath(str(tmp_path)), ["folder"], 'test-app.py')

        with zipfile.ZipFile(zip_path, "r") as zf:
            names = zf.namelist()
            assert "folder/nested1.txt" in names
            assert "folder/sub/nested2.txt" in names

    def test_missing_files_skipped(self, tmp_path, caplog):
        """Ensure missing files do not break the function and warning is logged"""
        caplog.set_level(logging.WARNING)
        zip_path = tmp_path / "test.zip"
        add_files_to_zip(str(zip_path), AbsoluteNotebookDirPath(str(tmp_path)), ["does_not_exist.txt"], 'test-app.py', logger=logging.getLogger())

        # Zip should exist but be empty
        with zipfile.ZipFile(zip_path, "r") as zf:
            assert zf.namelist() == []

        # Check warning was logged
        assert any("Skipping missing file" in record.message for record in caplog.records)

    def test_arcname_paths_correct(self, tmp_path):
        """Ensure arcname paths inside zip preserve relative paths to base_path"""
        (tmp_path / "file.txt").write_text("content")
        folder = tmp_path / "folder"
        folder.mkdir()
        (folder / "nested.txt").write_text("nested content")

        zip_path = tmp_path / "test.zip"
        add_files_to_zip(str(zip_path), AbsoluteNotebookDirPath(str(tmp_path)), ["file.txt", "folder"], 'test-app.py')

        with zipfile.ZipFile(zip_path, "r") as zf:
            names = zf.namelist()
            assert "file.txt" in names
            assert "folder/nested.txt" in names
