#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

from typing import List

from mitosheet.code_chunks.code_chunk import CodeChunk


def generate_read_csv_code(file_name: str, df_name: str, delimeter: str, encoding: str) -> str:
    """
    Helper function for generating minimal read_csv code 
    depending on the delimeter and the encoding of a file
    """
    if encoding != 'default' and delimeter != ',':
        # If there is a non comma delimieter and an encoding, we use both.
        # NOTE: we add a r in front of the string so that it is a raw string
        # and file slashes are not interpreted as a unicode sequence
        return f'{df_name} = pd.read_csv(r\'{file_name}\', sep=\'{delimeter}\', encoding=\'{encoding}\')'
    elif encoding != 'default':
        # If there is a comma delimieter and an encoding, we set the encoding
        return f'{df_name} = pd.read_csv(r\'{file_name}\', encoding=\'{encoding}\')'
    elif delimeter != ',':
        # If there is a delimeter for this file, we use it
        return f'{df_name} = pd.read_csv(r\'{file_name}\', sep=\'{delimeter}\')'
    else:
        # We don't add or encoding if they are the Default.
        return f'{df_name} = pd.read_csv(r\'{file_name}\')'


class SimpleImportCodeChunk(CodeChunk):

    def get_display_name(self) -> str:
        return 'Imported'
    
    def get_description_comment(self) -> str:
        file_names = self.get_param('file_names')
        return f'Imported {", ".join(file_names)}'

    def get_code(self) -> List[str]:
        file_names = self.get_param('file_names')
        file_delimeters = self.get_execution_data('file_delimeters')
        file_encodings = self.get_execution_data('file_encodings')

        code = ['import pandas as pd']

        index = 0
        for file_name, df_name in zip(file_names, self.post_state.df_names[len(self.post_state.df_names) - len(file_names):]):

            delimeter = file_delimeters[index]
            encoding = file_encodings[index]

            code.append(
                generate_read_csv_code(file_name, df_name, delimeter, encoding)
            )
            
            index += 1

        return code
