import ast
from copy import deepcopy
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

def add_one(x):
    return x + 1

def add_two(x):
    return x + 2

a = 1
b = 2
c = 3

a + b
b + c

a = a + 1
b = a + 2
c += 10
a -= 3

a = add_one(a)
"""
VariableName = str
Expression = str
VariableValue = int
VariableChange = int
CreateOperation = Tuple[Literal["Create"], VariableName, Expression, VariableValue]
IncrementOperation = Tuple[Literal["Increment"], VariableName, Expression, VariableChange]
DecrementOperation = Tuple[Literal["Decrement"], VariableName, Expression, VariableChange]
NoOpOperation = Tuple[Literal["NoOp"], VariableName, Expression]
Operations = Union[CreateOperation, IncrementOperation, DecrementOperation, NoOpOperation]

CoreMemory = Dict[VariableName, int]

# If there are other variables that we define, like:
# - Function definitions
# - ... Other non-int variables?
ExtraMemory = Dict[VariableName, Any]

class ReconType(TypedDict):
    core_memory: CoreMemory
    extra_memory: ExtraMemory
    operations: List[Operations]

def exec_and_get_new_memories(memory: CoreMemory, extra_memory: ExtraMemory, source: str) -> Tuple[CoreMemory, ExtraMemory]:
    temp_new_memory = {
        **memory,
        **extra_memory
    }
    exec(source, {}, temp_new_memory)
    
    new_memory = {k: v for k, v in temp_new_memory.items() if isinstance(v, int)}
    new_extra_memory = {k: v for k, v in temp_new_memory.items() if k not in new_memory}

    return new_memory, new_extra_memory

def __assign_helper(recon: ReconType, source: str, assign_node: ast.AST, target_node: ast.Name, value_node: ast.AST) -> ReconType:
    relevant_source = ast.get_source_segment(source, assign_node)
    variable_name = target_node.id
    expression = ast.get_source_segment(source, value_node)

    if relevant_source is None or expression is None:
        return recon
    
    memory = recon['core_memory']
    extra_memory = recon['extra_memory']
    operations = recon['operations']
    
    new_memory, new_extra_memory = exec_and_get_new_memories(
        deepcopy(memory),
        deepcopy(extra_memory),
        relevant_source
    )

    new_operations = operations.copy()
    if variable_name in memory:
        
        if memory[variable_name] > new_memory[variable_name]:
            new_operations.append(('Decrement', variable_name, expression, memory[variable_name] - new_memory[variable_name]))
        elif memory[variable_name] < new_memory[variable_name]:
            new_operations.append(('Increment', variable_name, expression, new_memory[variable_name] - memory[variable_name]))
        else:
            new_operations.append(('NoOp', variable_name, expression))

    else:
        new_operations.append(('Create', variable_name, expression, new_memory[variable_name]))

    return {
        'core_memory': new_memory,
        'extra_memory': new_extra_memory,
        'operations': new_operations
    }
    

def _handle_assign(recon: ReconType, source: str, ast_node: ast.Assign) -> ReconType:
    assign_source = ast.get_source_segment(source, ast_node)
    
    targets = ast_node.targets
    value_node = ast_node.value

    assert len(targets) == 1

    for target_node in targets:
        if isinstance(target_node, ast.Name):
            return __assign_helper(recon, source, ast_node, target_node, value_node)
        
    raise Exception("Not able to handle this one")

def _handle_expr(recon: ReconType, source: str, ast_node: ast.Expr) -> ReconType:
    relevant_source = ast.get_source_segment(source, ast_node)
    
    # Because integers cannot be modified without an assign, we don't worry about 
    # the expr case here

    return recon

def _handle_augassign(recon: ReconType, source: str, ast_node: ast.AugAssign) -> ReconType:
    relevant_source = ast.get_source_segment(source, ast_node)

    target = ast_node.target
    value = ast_node.value

    if not isinstance(target, ast.Name):
        return recon
    
    return __assign_helper(recon, source, ast_node, target, value)

def _handle_functiondef(recon: ReconType, source: str, ast_node: ast.FunctionDef) -> ReconType:
    relevant_source = ast.get_source_segment(source, ast_node)

    if relevant_source is None:
        return recon

    core_memory, extra_memory =  exec_and_get_new_memories(
        deepcopy(recon['core_memory']),
        deepcopy(recon['extra_memory']),
        relevant_source
    )

    return {
        'core_memory': core_memory,
        'extra_memory': extra_memory,
        'operations': recon['operations']
    }


def get_recon(source: str) -> ReconType:     

    parsed = ast.parse(source)
    recon: ReconType = {
        'core_memory': {},
        'extra_memory': {},
        'operations': []
    }

    for node in parsed.body:
        if isinstance(node, ast.Assign):
            recon = _handle_assign(recon, source, node)
        elif isinstance(node, ast.Expr):
            recon = _handle_expr(recon, source, node)
        elif isinstance(node, ast.AugAssign):
            recon = _handle_augassign(recon, source, node)
        elif isinstance(node, ast.FunctionDef):
            recon = _handle_functiondef(recon, source, node)
            # Function definitions do not modify any variables, so we 
            # can just ignore them. 
            # TODO: bug if the function name is the variable name already defined
            # but ... don't do that

            # TODO: we need to handle cleaning up local variables who have a scope inside
            # of a function. Perhaps we can have an "Enter Function" and "Leave Function"
            # operation?
            pass
        else:
            raise ValueError(node)

    return recon

    


recon = get_recon(string)
print(recon)

# Make sure it execed properly
locals = {}
exec(string, {}, locals)

core_locals = {k: v for k, v in locals.items() if isinstance(v, int)}


if core_locals != recon['core_memory']:
    print("Extra data in core memory", {k: v for k, v in recon['core_memory'].items() if k not in core_locals})
    print("Extra data in locals", {k: v for k, v in core_locals.items() if k not in recon['core_memory']})
else:
    print("Execed correctly")
