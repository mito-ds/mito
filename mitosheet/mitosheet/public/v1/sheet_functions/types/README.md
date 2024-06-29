# Mito Sheet Function Types

Handling different datatypes is a fundamental source of complexity for all spreadsheet applications. The Mito approach to types is a work in progress, but in general, we want our types to be flexible - as to not require too much work from users. 

Furthermore, we want our approach to types to be scalable, so that adding new sheet function is easy for the Mito team. We note that will probably end up being about 10 types in Mito, and about 300 sheet functions. So we'd prefer to handle the type complexity not in the sheet functions, but rather through some other abtraction!

## Converting to a Type

For a `series_type`, there must be a file called `to_<series_type>`, that exports a function with the same name. This function should be able to take _any_ data as input, and perform the following:
1. If a conversion is possible, return the conversion.
2. If no conversion is possible, throw an error? (TODO)

NOTE: a key part of this conversion is that it must work elementwise, in cases where that is necessary. For example, if a string series is being converted to a number series, then if a single element cannot be cast, it should be able to handle this specially. 

Moreover, this function should have the following interface
```
def to_<series_type>(
        unknown_object,
        on_uncastable_arg_element # Union[Literal['error'], Tuple[Literal['default'], any]]=('default', np.nan)
    ):
```
Which will clarify how to handle uncastable elements. Finially, this function should be added to `conversion_function.py`, so that sheet functions can use it (through their decorators).