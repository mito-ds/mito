# Some Thoughts on Plugins

## Plugins Without Params

If a plugin had no params (aka, took a specific sheet, did something to it, and returned), then the plugin architecture would be very simple. In fact, I have already implemented it in the code here.

Things get complex whe we have params that users need to be able to specify in the frontend. Depending on what sort of params we allow, things can get very complex indeed.

## Design Principals

For users who are writing Plugins, they will likely be reasonably adept in Pandas, and total noobs to Mito. As such, our goal is to expose an interface to these users that:
1. Only relies on their pandas knowledge
2. Does not require them to understand the internals of Mito in a complex way 

Doing this might require limiting what sorts of things are possible through plugins. Some frontend interfaces are very complex, and we might have to force users to make some simplifications

## What params are most common

What params are most common to specify? There are a few:
1. sheet_index: choosing a dataframe
2. column_id: selecting a specific column
3. column_ids: selection a bunch of a columns
4. string select: selecting from a list of possible options (e.g. what way to fill NaN)
5. input: input a string (or number) and set it to the backend

## Relationships that are hard to express in params

### Conditionally Displayed Parameters

Think of the FillNAN interface. We wanted to users to be able to select the "fill with specific value" and then to have that reveal a new input where they can put in the value. 

This is a complex relationship. It says - show IF this specific value is selected. Bamboolib does this currently, but we are going to ignore this for v1 of the params. 

Instead, we will allow users to express static params that are from the list of the 5 input types above. This is the syntax for it currently.

### Linked Parameters

There is another version of this problem, though - that is somewhat similar. Where do the column ids pull from? Aka, what if there are two sheet indexes, and you have one column id pulling from one and one from the other.

## Limiting the Plugins

Ok, so here's a plan for how to get around the above complexity with linked parameters:
1. Every plugin for v1 is only operating on a single dataframe.
2. Every column id select is only operating on that single dataframe


What we would be able to express with this interface:

#### Works Mostly The Same
ChangeColumnDtypeStepPerformer - Yes.
FillNaStepPerformer - Yes.
DeleteColumnStepPerformer - Yes.
RenameColumnStepPerformer - Yes.
DataframeDeleteStepPerformer - Yes.
DataframeDuplicateStepPerformer - Yes.
DataframeRenameStepPerformer - Yes.
DropDuplicatesStepPerformer - Yes.
DeleteRowStepPerformer - Yes.
PromoteRowToHeaderStepPerformer - Yes.
TransposeStepPerformer - Yes.
MeltStepPerformer - Yes.

#### Yes, but Much Worse
AddColumnStepPerformer - Yes.
ReorderColumnStepPerformer - Yes? By index. Would be terrible.
SortStepPerformer - Yes. Select would be a bit weird.
SetCellValueStepPerformer - Yes. Would be kinda weird.
SetColumnFormulaStepPerformer - Yes. Not the best interface
SplitTextToColumnsStepPerformer - Yes (without a preview). So No.

#### Partially Possible
FilterStepPerformer - Yes. But would also be terrible.
MergeStepPerformer - old version, yes.

#### Not Possible
PivotStepPerformer - No
ChangeColumnFormatStepPerformer - Yes. But don't have access to this metadata, so No.
ConcatStepPerformer - no.
SimpleImportStepPerformer - No. Missing access to data from the file system
ExcelImportStepPerformer - No. Missing access to data from the file system.
GraphStepPerformer - No
GraphDeleteStepPerformer - No
GraphDuplicateStepPerformer - No
GraphRenameStepPerformer - No


## What does Bamboolib Do?

See their examples here: https://github.com/tkrabel/bamboolib/tree/master/plugins

Pretty much, they expose LoaderPlugin, TransformationPlugin, and allow you to override methods.

Within these components, they let you use ipywidgets (and some select wrappers they have) to define specific HMTL elements. This allows you to



## Syntax for Params, V1, attempt 1

If we wanted to use some JSON syntax (this could allow us to keep things very constrained), then here's an idea of how this syntax could look:

```
{
    'parameter_specification_version': 1,
    'parameters': [
        {
            'param_name': 'sheet_index',
            'type': 'DataframeSelect',
            'display_name': 'Dataframe',
            'description': 'Dataframe to FillNaN values in.'
        },
        {
            'param_name': 'column_headers',
            'type': 'ColumnMultiSelect',
            'display_name': 'Columns to fill in',
            'description': 'Dataframe to FillNaN values in.'
        }
        ...
    ]
}
```

This is indeed extremly constrained (far more constrained than Bamboolib). It would be possible to express the these step performers listed above, but not all of them, and not in the nicest ways.

We should make some components (that we can use in places) for these things. So note that this isn't just the easiest thing in the world.

### How to go from this JSON -> a Frontend

It would be fairly easy to take this JSON, load it up into AnalysisData, and send it to the frontend. Then, we just loop over the params, and turn them into elements. There's nothing particularly complex about this.

## Syntax for Params, V1, attempt 2

We follow bamboolib's example and instead provide Python classes that allow you to build the plugins. I'm less sure how this would work, but you imagine returning a list of params... so imagine something like:

```
def get_inputs() -> List[MitoHTMLInputs]:
    return {
        'sheet_index': Select(options=range(self.dfs)),
        'column_header': Select(options=[]) # TODO: how do we reference the sheet index we want to pull from
    }
```

So again, we run into this issue of expressing results of the select. So, I think we should think about the params as the following:
1. Python statements that run in order.
2. Each of these Python statements returns a specific result (with a specific, known name?)
3. You can use the results of these params in later steps. Once all of them are "set" (there is a default for all of them), then you can click "execute."

This is a process to write. I am going to pause here.

### How to 





## Versioning Plugins

We are going to version plugins aggressively. We want a stable public interface that we can then switch out, as this will make it possible to introduce a new










## Plugins with Params: why things get complex

