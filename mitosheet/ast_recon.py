import ast
from copy import copy
from typing import Any, Dict, List, Literal, Tuple, TypedDict, Union

"""
I don't really want a dataframe recon type. I want a semanic list of operations
that describe what happened to the data, which we dynamically determine from the
code being executed

This... is an AST? It's not an in-order list. But I pretty much want to take as
AST and transform it into a linear list of operations that describe what happened
to the data. 

Let's start with something simple. We will assume that there is a "memory" dictonary
that maps variable names -> integers. Only integer values are allowed. 
Here's what we support
- Integer = -100 ... 0 ... 100
- Expr = Name | Name + {Expr} | Name - {Expr} | {Integer}
- Set {Name} {Expr}

Notably, 
- We will recon for invalid code (but it will not execute)
- Furthermore, we assume that all modifications are done with
  an explicit "assign" statement -- e.g. no inplace modifications

We have the following types:
("Create", {Name}, {Expr})
("Increment", {Name}, {Expr})
("Decrement", {Name}, {Expr})

Notably, this is _not_ static analysis. This is dynamic analysis. What we do is 
we execute each line of code, while trying to figure out what that line of code
is doing either through dynamic understanding of the changes in variables, or 
by a static understanding of the line of code.

This is... weird? It's like a really interesting middle-ground between static and
dynamic analysis, that is kinda like semantic code reasoning. Idk what it really
is, but I think it's kinda the best of all worlds. 
"""


string = """
import math
from typing import Any

def add_one(x):
    return x + 1

def add_two(x):
    return add_one(x) + 1

class TestClass():

    def __init__(self):
        self.internal = 0

    def increment(self, inc):
        self.internal += inc
        return self.internal

    def add_one(self, value):
        return add_one(value)

a = 1
b = 2
c = 3

a + b
b + c

x = \
    10 \
    + 10

a = a + 1
b = a + 2
c += 10
a -= 3

a = add_one(a)

for i in range(10):
    a += i

test_obj = TestClass()
test_obj.increment(10)
d = test_obj.increment(2)

a += test_obj.add_one(a)
"""
VariableName = str
VariableValue = int
VariableChange = int
CreateOperation = Tuple[Literal["Create"], VariableName, VariableValue]
IncrementOperation = Tuple[Literal["Increment"], VariableName, VariableChange]
DecrementOperation = Tuple[Literal["Decrement"], VariableName, VariableChange]
NoOpOperation = Tuple[Literal["NoOp"], VariableName]
Operations = Union[CreateOperation, IncrementOperation, DecrementOperation, NoOpOperation]

CoreMemory = Dict[VariableName, int]

# If there are other variables that we define, like:
# - Function definitions
# - ... Other non-int variables?
ExtraMemory = Dict[VariableName, Any]

class ReconType(TypedDict):
    type: Literal['recon']
    core_memory: CoreMemory
    extra_memory: ExtraMemory
    operations: List[Operations]

class ErrorType(TypedDict):
    type: Literal['error']
    error: Any
    line: str
    previous_recon: ReconType

ReconOrError = Union[ReconType, ErrorType]

def exec_and_get_new_recon(recon: ReconType, source: str) -> ReconType:

    memory = recon['core_memory']
    extra_memory = recon['extra_memory']
    operations = recon['operations']

    temp_new_memory = {
        **memory,
        **extra_memory
    }
    exec(source, {**extra_memory}, temp_new_memory)
    
    new_memory = {k: v for k, v in temp_new_memory.items() if isinstance(v, int)}
    new_extra_memory = {k: v for k, v in temp_new_memory.items() if k not in new_memory}


    new_operations = operations.copy()
    for variable_name in new_memory:
        if variable_name in memory:
            if memory[variable_name] > new_memory[variable_name]:
                new_operations.append(('Decrement', variable_name, memory[variable_name] - new_memory[variable_name]))
            elif memory[variable_name] < new_memory[variable_name]:
                new_operations.append(('Increment', variable_name, new_memory[variable_name] - memory[variable_name]))

        else:
            new_operations.append(('Create', variable_name, new_memory[variable_name]))

    return {
        'type': 'recon',
        'core_memory': new_memory,
        'extra_memory': new_extra_memory,
        'operations': new_operations
    }

def _handle_default_ast_node(recon: ReconType, source: str, ast_node: ast.AST) -> ReconType:
    relevant_source = ast.get_source_segment(source, ast_node)

    if relevant_source is None:
        return recon

    return exec_and_get_new_recon(
        recon, relevant_source
    )

DEFAULT_AST_NODE = [
    ast.Assign,
    ast.Expr,
    ast.AugAssign,
    ast.FunctionDef,
    ast.Import,
    ast.ImportFrom,
    ast.For,
    ast.ClassDef
]

def get_recon(source: str) -> ReconOrError:     

    parsed = ast.parse(source)
    recon: ReconType = {
        'type': 'recon',
        'core_memory': {},
        'extra_memory': {},
        'operations': []
    }

    for node in parsed.body:
        found = False
        for type in DEFAULT_AST_NODE:
            if isinstance(node, type):
                try:
                    recon = _handle_default_ast_node(recon, source, node)
                except Exception as e:
                    line = ast.get_source_segment(source, node)
                    error: ErrorType = {
                        'type': 'error',
                        'error': e,
                        'line': line or '',
                        'previous_recon': recon
                    }
                    return error


                found = True
                break

        if not found:
            raise ValueError(node)

    return recon


recon_or_error = get_recon(string)
if recon_or_error['type'] == 'error':
    error = recon_or_error
    try:
        exec(string)
        
    except Exception as e:
        assert e == error['error']
        exit(0)

    assert False, "Should have failed above in the exec"

else:
    recon = recon_or_error
    for operation in recon['operations']:
        print(operation)

    # Make sure it execed properly, by execing the whole string
    locals = {}
    # We need to have locals in both places, for some reason?
    exec(string, locals, locals)
    core_locals = {k: v for k, v in locals.items() if isinstance(v, int)}
    if core_locals != recon['core_memory']:
        print("Extra data in core memory", {k: v for k, v in recon['core_memory'].items() if k not in core_locals})
        print("Extra data in locals", {k: v for k, v in core_locals.items() if k not in recon['core_memory']})
    else:
        print("Execed correctly")


"""
Things that need to be fixed:

# For Loops

The loop variable, if it's the type of the core variables, ends up 
getting saved. While this is _true_ of Python scope, it's not really
what we want -- since those shouldn't become sheets
"""