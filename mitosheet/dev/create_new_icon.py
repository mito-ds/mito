
OPEN_BRACKET = '{'
CLOSE_BRACKET = '}'

def get_tsx_svg_with_props(svg_code: str) -> str:
    """Need to move stroke-width to strokeWidth"""
    split_svg_code = svg_code.split('stroke-')
    final_string = ''
    for idx, s in enumerate(split_svg_code):
        if idx == 0:
            final_string += s
        else:
            cap_s = s[0].upper() + s[1:]
            final_string += f'stroke{cap_s}'
    return final_string
    

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


def main() -> None:
    """
    Gets the most recent file from the downloads folder,
    and adds it as an icon if it is an SVG file.
    """

    import os
    import tempfile

    # Get the most recent file from the downloads folder
    downloads_folder = os.path.join(os.path.expanduser('~'), 'Downloads')
    most_recent_file = max([os.path.join(downloads_folder, x) for x in os.listdir(downloads_folder) if x.endswith('.svg')], key=os.path.getctime)
    most_recent_file_path = os.path.join(downloads_folder, most_recent_file)


    # Check if it is an SVG file
    if most_recent_file.endswith('.svg'):
        icon_name = input('What would you like to name the icon? [UpArrow, DownArrow]')
        with open(most_recent_file_path) as f:
            svg_code = f.read()

        with open(f'src/components/icons/{icon_name}Icon.tsx', 'x') as f:
            f.write(get_icon_tsx_code(icon_name, svg_code))

        print(f"Wrote icon {icon_name}")

    else:
        print("Most recent file is not an SVG file.")

    # Remove the most recent file
    os.remove(most_recent_file_path)
    

if __name__ == "__main__":
    main()
