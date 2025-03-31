# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os

from metaprogramming.utils.code_utils import OPEN_BRACKET, CLOSE_BRACKET
from metaprogramming.utils.path_utils import get_downloads_folder, get_src_folder


SPLIT_ON = [
    'stroke-',
    'stop-'
]

def get_tsx_svg_with_props(svg_code: str) -> str:
    """Need to move stroke-width to strokeWidth, etc. Replacing svg with valid react props"""
    current_string = svg_code
    for split in SPLIT_ON:
        split_svg_code = current_string.split(split)
        final_string = ''
        for idx, s in enumerate(split_svg_code):
            if idx == 0:
                final_string += s
            else:
                cap_s = s[0].upper() + s[1:]
                final_string += f'{split[:-1]}{cap_s}'
        current_string = final_string

    return current_string
    

def get_icon_tsx_code(icon_name: str, svg_code: str) -> str:
    return f"""
// Copyright (c) Mito

import React from 'react';

const {icon_name}Icon = (): JSX.Element => {OPEN_BRACKET}
    return (
        {get_tsx_svg_with_props(svg_code)}
    )
{CLOSE_BRACKET}

export default {icon_name}Icon;"""


def create_new_icon(icon_name: str) -> None:
    """
    Gets the most recent file from the downloads folder,
    and adds it as an icon if it is an SVG file.
    """

    # Get the most recent file from the downloads folder
    downloads_folder = get_downloads_folder()
    most_recent_file = max([os.path.join(downloads_folder, x) for x in os.listdir(downloads_folder) if x.endswith('.svg')], key=os.path.getctime)
    most_recent_file_path = os.path.join(downloads_folder, most_recent_file)


    # Check if it is an SVG file
    if most_recent_file.endswith('.svg'):
        with open(most_recent_file_path) as f:
            svg_code = f.read()

        icon_path = get_src_folder() / 'components' / 'icons' / f'{icon_name}Icon.tsx'
        
        if os.path.exists(icon_path):
            print("Removing existing icon...")
            os.remove(icon_path)

        with open(icon_path, 'x') as f:
            f.write(get_icon_tsx_code(icon_name, svg_code))

        print(f"Wrote icon {icon_name}")

    else:
        print("Most recent file is not an SVG file.")

    # Remove the most recent file
    os.remove(most_recent_file_path)