from typing import Dict, Union


class GraphParameter:
    """
    The Graph Parameter class is helpful in constructing parameters to be used in the transpiled code. 
    """
    def __init__(self, parameter_key: str, parameter_value: Union[str, Dict], parameter_format_as_string: bool):
        self.parameter_key = parameter_key
        self.parameter_value = parameter_value
        self.parameter_format_as_string = parameter_format_as_string

    def create_parameter_chord(self) -> str:
        """
        Returns the Graph Parameter as the parameter chord used in the transpiled code. 
        """
        if self.parameter_format_as_string:
            return f'{self.parameter_key}=\'{self.parameter_value}\''
        else:
            return f'{self.parameter_key}={self.parameter_value}'