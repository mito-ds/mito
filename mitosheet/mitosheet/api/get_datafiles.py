import os
from pathlib import Path


def get_filenames_with_suffix(*suffixes):
    """
    Returns all the file names in the current folder that end with the given
    suffix, sorted from most-recently created to the oldest.
    """
    # We sort them by creation time, to get the most recent files, as the user
    # is more likely to want these
    filenames = sorted(Path('.').iterdir(), key=os.path.getmtime)
    filenames.reverse()
    return [str(filename) for filename in filenames if filename.suffix in suffixes]


def get_datafiles(event):
    """
    Handles a `datafiles` api call, and returns all the csv files
    in the current folder.
    """
    csv_files = get_filenames_with_suffix(
        '.csv', 
        '.tsv',
        '.tab',
    )
    # TODO: also get the XLSX files, when we can import them
    return csv_files