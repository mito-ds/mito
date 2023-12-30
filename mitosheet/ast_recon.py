"""
# Motivation
In this experiment, I was trying to figure out the Python AST to perform a better 
automate recon. The dream would be we could pass _any_ code a function that takes
1. The state of the dataframes in Mito
2. The metadata we're tracking about these dataframes
3. Some code to execute against these dataframes

And we'd get back the new dataframes, as well as the new metadata about these 
dataframes. 

Notably, we have to manually update this (e.g. for filtering dataframes) -- and
that is kinda annoying. 

Also, if we had this, it would open up more interesting code optimization 
opportunities. Once you have a map from code line => operations it performs
on both metadata and dataframes, you can start opimizing over the _lines_ of
the code (based on their operations) rather than on code chunks themselves.

I think this... would be better? It would bring our optimization down to a line
level, while also make our algorithm reason about smaller, more specific 
operations. I think this would be good...

On the other hand, this could be a massive rabbit hole, and I could just be
getting nerd-snipped. Not really sure yet, so glad I did this experiment.

# What happened here

Pretty much, I accidently just implemented per-line execution, with no reasoning
using the AST. I initially started with a funciton per AST node, but didn't know 
how to recurse effectively -- so I then just did per line execution without realizing
I was not doing the right thing. 

If I were to take another shot, I would want to try:
1.  Getting the AST nodes in _execution_ order, and seeing if we can just build a semantic
    understanding without needing to actually execute those nodes. This would, of course, 
    fail because like if statements -- you need to be dynamically executing to know the values
    of variables to figure out what changes have been made!
2.  Do some tree walk. If I get to a conditional anywhere, then somehow execute _until here_ 
    (potentially transforming the code with temp variables) until we figure out if it is
    gonna execute.  

    Pretty much, if you imagine an AST, it looks somethibng like this:

                      Module
                  /           \
              Assign            If
            /   \              /   \
        Name    AddOp     Cond     Body
                / \
               Val Val

    We can _statically_ build an understanding of Assign. We probably want to do something like
    executing every assign by itself, and then having a tool for function for reasoning about
    expressions like AddOpp part of the tree. This is easy (?) to do statically.

    The If statement needs to know the results of the previous assign, and then we can see if it 
    runs. If it does, we recurse into the body, and run this algoritm again. 

    For For loops -- things get even more challenging, since how do you know when it stops executing?
    I think we need to figure out a way to exec every _loop defintion_ and every _loop iteration_ 
    seperately, which is the challening part. Exec can't be left with a hanging loop (e.g. it is 
    not valid to do `exec('for i in range(10):')` -- it will error). And so instead we'd have to 
    do something insane like change the code to:
    ```
    for {var} in {range}:
        {cond}(var)
    ```
    Into some sort of code that does:
    ```
    tmp_range = {range}
    ```
    First, and then does
    ```
    {var} = next(tmp_range)
    {cond}(var)
    ```

    I think this would work. The hard part is doing the AST walk in the correct order, ya -- like
    you actually need to think about each node.


# The Main Struggle: The Type of Operations

The main question to answer is what should the type of the operations be. At first, I though let's
just make them a linear list of operations. So something like

```
a = 1
a = a + 10
b = a
```

Would become:
```
Create a 1
Set a  (a + 10)
Create b a
```

Or perhaps more semantically (kinda the whole point of this)
```
Create a 1
Increment a 10
Create b a
```

Ok, but then let's consider the following:
```
a = 1
b = 2
c = (a + 2) + math.pow(b, 2)
```

What should this convert to? 

I think the answer is that it should convert to whatever we _need_ to be able to update the
state metadata -- and nothing more? So it seems that we would need the following operations:

```
df_names => a rename operation. So we detect if there is a Assign that just has two names
            on either side
df_sources => if a new DF is created, do we still ask 
column_ids => if we rename columns (we already do this)
column_formulas => if we set a column (we need to manually save this)
column_filters => if we filter a column (we can use the AST to rebuild the filter... this seems silly)
```

# Reflections

I think this is a good dream, but I don't think it actually helps us much. There's very little state
we actually need to keep track of now that we have the execute_through_transpile. In other words, the 
ROI of this is not here IMO. 

I am, however, glad I explored this - because it's been ratting around in my head for a while. 

Here are some future things I'd like to explore:
1.  Per-line execution in the recon function (e.g. for AI) -- this could improve our results? 
2.  Changing CodeChunks to a more AST structure. On the other hand, I'm not sure this 
    makes any sense. 

"""


import ast
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

An expression should convert to a list of 
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
sa = add_one(a)

a = math.pow(a, 2)

test_obj = TestClass()
test_obj.increment(10)
d = test_obj.increment(2)

with open('file.txt', 'w+') as f:
    f.write("test")

new = 10
new = new * 10
"""


VariableName = str
VariableValue = Union[int, float]
VariableChange = Union[int, float]
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

    new_operations = []
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
        'operations': operations + new_operations
    }


DEFAULT_AST_NODES = [
    ast.Import,
    ast.ImportFrom,
    ast.FunctionDef,
    ast.ClassDef,
    ast.Expr,
    ast.With,
]

def _handle_default_ast_node(source: str, node: ast.AST, recon: ReconType) -> ReconType:
    relevant_source = ast.get_source_segment(source, node)
    
    if relevant_source is None:
        return recon
    
    return exec_and_get_new_recon(
        recon, relevant_source
    )


def _get_operations_from_expression_helper(source: str, node: ast.expr, recon: ReconType) -> List[Operations]:
    """
    NOTE: we assume that these expressions _do not_ modify anything in place, and as such
    are save to execute as many times as we want in isolated enviornments.
    """

    memory = recon['core_memory']
    extra_memory = recon['extra_memory']

    temp_new_memory = {
        **memory,
        **extra_memory
    }

    relevant_source = ast.get_source_segment(source, node)
    if relevant_source is None:
        return []

    exec(relevant_source, {**extra_memory}, temp_new_memory)

    print(relevant_source, node)

    return []

def _get_operations_from_expression(source: str, node: ast.expr, recon: ReconType) -> List[Operations]:
    """
    NOTE: we assume that these expressions _do not_ modify anything in place, and as such
    are save to execute as many times as we want in isolated enviornments.
    """

    if isinstance(node, ast.Constant):
        return []
    
    if 
    
    elif isinstance(node, ast.BinOp):
        left_operations = _get_operations_from_expression_helper(node.left)
        right_operations = _get_operations_from_expression_helper(node.right)
        pass

    elif isinstance(node, ast.Call):
        pass






    # If there is a field with nodes, it is executed in order? 
    # Otherwise, how do we know what is executed? Ok, let's make the call to NOT
    # support IF, WHILE, or FOR loops. So we literally just accept simple expressions
    # and not even the conditional ones for now. So just integers and boolean arthmetic

    pass


def _handle_assign(source: str, node: ast.Assign, recon: ReconType) -> ReconType:
    targets = node.targets
    assert len(targets) == 1 # For now, we throw errors with anything unexpected

    target = targets[0]
    value = node.value
    if isinstance(target, ast.Name):
        variable_name = target.id

        memory = recon['core_memory']
        if variable_name in memory:
            print("Modified", variable_name)
        else:
            print("Created", variable_name)

        operations = _get_operations_from_expression(source, value, recon)


        return _handle_default_ast_node(source, node, recon)



    else:
        raise ValueError('Target is not a name', node)


def get_recon_helper(source: str, node: ast.AST, recon: ReconType) -> ReconType:
    """
    Limitaitons:
    1.  No conditionals
    2.  No loops
    3.  Expressions do not modify anything. We only modify
        with assignment, which gives us the ability to execute
        any expression (and it's subexpressions) as many times
        as we want
    4.  Do not support AugAssign
    5.  Variables cannot be modified within a With (which otherwise are supported)
    6.  Expressions that are modifying a core variable will only reference that core
        variable (NOT TRUE IN MITO - E.G. VLOOKUP)
    7.  Expressions that are creating a new core variable can reference multiple 
        variables
    """

    if isinstance(node, ast.Module):
        # If it's a module, we just execute it's body in order
        for child in node.body:
            recon = get_recon_helper(source, child, recon)

    elif any(isinstance(node, type) for type in DEFAULT_AST_NODES):
        recon = _handle_default_ast_node(source, node, recon)
    
    elif isinstance(node, ast.Assign):
        recon = _handle_assign(source, node, recon)

    return recon

def get_recon(source: str) -> ReconOrError:     

    parsed = ast.parse(source)
    recon: ReconType = {
        'type': 'recon',
        'core_memory': {},
        'extra_memory': {},
        'operations': []
    }
    return get_recon_helper(source, parsed, recon)

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
Some other notes

# For Loops, If Statements, While statements

Notably, we do not "look inside" these currently. I made this call because we don't generate
any of these in our generated code.

This means that if you have some code like:
```
a = 1

for i in range(3):
    a += i
```

This will only register as two operations: 
- Create `a` with value `1`
- Increment `a` by `6`
"""