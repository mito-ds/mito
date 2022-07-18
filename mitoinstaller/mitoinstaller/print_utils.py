


import time
import os

def clear_terminal():
    os.system('cls' if os.name == 'nt' else 'clear')

def clear_and_print(message: str):
    clear_terminal()
    print(message)

first_message = 'This\nis\na\ntest'
second_message = 'New\nis\na\ntest\nwith\nmultiple\nlines'


clear_and_print(first_message)
time.sleep(5)
clear_and_print(second_message)
time.sleep(5)
clear_and_print(first_message)
