


import time


def clear_line(n=1):
    LINE_UP = '\033[1A'
    LINE_CLEAR = '\x1b[2K'
    for i in range(n):
        print(LINE_UP, end=LINE_CLEAR)

def print_and_overwrite(message: str, previous_message: str = None):
    if previous_message is not None:
        clear_line(n=previous_message.count('\n') + 1)
    print(message)

class OverwritePrinter:
    def __init__(self):
        self.previous_message = None

    def print(self, message: str):
        print_and_overwrite(message, previous_message=self.previous_message)
        self.previous_message = message


first_message = 'This\nis\na\ntest'
second_message = 'New\nis\na\ntest\nwith\nmultiple\nlines'


printer = OverwritePrinter()
printer.print(first_message)
time.sleep(5)
printer.print(second_message)
time.sleep(5)
printer.print(first_message)
