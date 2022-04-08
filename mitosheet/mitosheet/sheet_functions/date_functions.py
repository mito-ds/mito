#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains all functions that can be used in a sheet that operate on
datetime objects.

All functions describe their behavior with a function documentation object
in the function docstring. Function documentation objects are described
in more detail in docs/README.md.

NOTE: This file is alphabetical order!
"""
import pandas as pd

from mitosheet.sheet_functions.types.decorators import convert_arg_to_series_type, filter_nans, handle_sheet_function_errors

# Inspired by: https://stackoverflow.com/questions/69345845/why-does-dateoffset-rollback-not-work-the-way-i-expect-it-to-with-days-hours
# Given a datetime and a frequency (ie: business month begin), sets the 
# the timestamp back to the frequency unless its already there!
def to_start(t: pd.Timestamp, freq: pd.DateOffset) -> pd.Timestamp:
    try:
        return t.floor(freq) # fixed frequencies should just floor the date/time
    except ValueError: # if freq is variable, we fall into here...
        return freq.rollback(t.floor("D"))


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def DATEVALUE(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "DATEVALUE",
        "description": "Converts a given string to a date series.",
        "search_terms": ["datevalue", "date value", "date", "string to date", "datetime", "dtype", "convert"],
        "examples": [
            "DATEVALUE(date_column)",
            "DATEVALUE('2012-12-22')"
        ],
        "syntax": "DATEVALUE(date_string)",
        "syntax_elements": [{
                "element": "date_string",
                "description": "The date string to turn into a date object."
            }
        ]
    }
    """
    return datetime_series


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def DAY(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "DAY",
        "description": "Returns the day of the month that a specific date falls on, as a number.",
        "search_terms": ["day", "date"],
        "examples": [
            "DAY(date_column)",
            "DAY('2012-12-22')"
        ],
        "syntax": "DAY(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to get the day of."
            }
        ]
    }
    """
    return datetime_series.dt.day
    

@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def ENDOFBUSINESSMONTH(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "ENDOFBUSINESSMONTH",
        "description": "Given a date, returns the end of the buisness month. E.g. the last weekday.",
        "search_terms": ["business", "month", "eom", "eobm", "date", "workday", "end"],
        "examples": [
            "ENDOFBUSINESSMONTH(date_column)",
            "ENDOFBUSINESSMONTH('2012-12-22')"
        ],
        "syntax": "ENDOFBUSINESSMONTH(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to get the end of the business month of."
            }
        ]
    }
    """
    return (datetime_series + pd.tseries.offsets.BusinessMonthEnd(n=0)).dt.floor('D')


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def ENDOFMONTH(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "ENDOFMONTH",
        "description": "Given a date, returns the end of the month, as a date. E.g. input of 12-22-1997 will return 12-31-1997.",
        "search_terms": ["month", "eom", "date", "workday", "end", "eomonth"],
        "examples": [
            "ENDOFMONTH(date_column)",
            "ENDOFMONTH('2012-12-22')"
        ],
        "syntax": "ENDOFMONTH(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to get the last day of the month of."
            }
        ]
    }
    """
    return (datetime_series + pd.tseries.offsets.MonthEnd(n=0)).dt.floor('D')


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def HOUR(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "HOUR",
        "description": "Returns the hour component of a specific date, as a number.",
        "search_terms": ["hour", "hr"],
        "examples": [
            "HOUR(date_column)",
            "HOUR('2012-12-22 09:45:00')"
        ],
        "syntax": "HOUR(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to get the hour of."
            }
        ]
    }
    """
    return datetime_series.dt.hour


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def MINUTE(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "MINUTE",
        "description": "Returns the minute component of a specific date, as a number.",
        "search_terms": ["minute", "min"],
        "examples": [
            "MINUTE(date_column)",
            "MINUTE('2012-12-22 09:45:00')"
        ],
        "syntax": "MINUTE(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to get the minute of."
            }
        ]
    }
    """
    return datetime_series.dt.minute


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def MONTH(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "MONTH",
        "description": "Returns the month that a specific date falls in, as a number.",
        "search_terms": ["month", "date"],
        "examples": [
            "MONTH(date_column)",
            "MONTH('2012-12-22')"
        ],
        "syntax": "MONTH(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to get the month of."
            }
        ]
    }
    """
    return datetime_series.dt.month


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def QUARTER(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "QUARTER",
        "description": "Returns the quarter (1-4) that a specific date falls in, as a number.",
        "search_terms": ["quarter"],
        "examples": [
            "QUARTER(date_column)",
            "QUARTER('2012-12-22')"
        ],
        "syntax": "QUARTER(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to get the quarter of."
            }
        ]
    }
    """
    return datetime_series.dt.quarter


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def STARTOFBUSINESSMONTH(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "STARTOFBUSINESSMONTH",
        "description": "Given a date, returns the most recent start of the business month, as a state. E.g. the first weekday.",
        "search_terms": ["business", "month", "SOM", "SOBM", "date", "start"],
        "examples": [
            "STARTOFBUSINESSMONTH(date_column)",
            "STARTOFBUSINESSMONTH('2012-12-22 09:23:05')"
        ],
        "syntax": "STARTOFBUSINESSMONTH(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to get the most recent beginning of month business day of."
            }
        ]
    }
    """
    return datetime_series.apply(lambda t: to_start(t, pd.tseries.offsets.BMonthBegin(n=1)))


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def STARTOFMONTH(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "STARTOFMONTH",
        "description": "Given a date, returns the start of the month, as a date. E.g. input of 12-22-1997 will return 12-1-1997.",
        "search_terms": ["month", "SOM", "date", "start"],
        "examples": [
            "STARTOFMONTH(date_column)",
            "STARTOFMONTH('2012-12-22 09:23:05')"
        ],
        "syntax": "STARTOFMONTH(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to get the first day of the month of."
            }
        ]
    }
    """
    return datetime_series.apply(lambda t: to_start(t, pd.tseries.offsets.MonthBegin(n=1)))



@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def STRIPTIMETOMINUTES(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "STRIPTIMETOMINUTES",
        "description": "Returns the date with a seconds component of 00.",
        "search_terms": ["time", "date", "minutes", "strip"],
        "examples": [
            "STRIPTIMETOMINUTES(date_column)",
            "STRIPTIMETOMINUTES('2012-12-22 09:23:05')"
        ],
        "syntax": "STRIPTIMETOMINUTES(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to reset the seconds component of."
            }
        ]
    }
    """
    return datetime_series.dt.floor('Min')


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def STRIPTIMETOHOURS(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "STRIPTIMETOHOURS",
        "description": "Returns the date with a seconds and minutes component of 00:00.",
        "search_terms": ["time", "date", "hours", "strip"],
        "examples": [
            "STRIPTIMETOHOURS(date_column)",
            "STRIPTIMETOHOURS('2012-12-22 09:23:05')"
        ],
        "syntax": "STRIPTIMETOHOURS(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to reset the seconds and minutes component of."
            }
        ]
    }
    """
    return datetime_series.dt.floor('H')



@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def STRIPTIMETODAYS(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "STRIPTIMETODAYS",
        "description": "Returns the date with a seconds, minutes, and hours component of 00:00:00.",
        "search_terms": ["time", "date", "days", "strip"],
        "examples": [
            "STRIPTIMETODAYS(date_column)",
            "STRIPTIMETODAYS('2012-12-22 09:23:05')"
        ],
        "syntax": "STRIPTIMETODAYS(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to reset the seconds, minutes, and hours component of."
            }
        ]
    }
    """
    return datetime_series.dt.floor('D')


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def STRIPTIMETOMONTHS(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "STRIPTIMETOMONTHS",
        "description": "Returns the date adjusted to the start of the month.",
        "search_terms": ["time", "date", "months", "strip"],
        "examples": [
            "STRIPTIMETOMONTHS(date_column)",
            "STRIPTIMETOMONTHS('2012-12-22 09:23:05')"
        ],
        "syntax": "STRIPTIMETOMONTHS(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to reset the seconds, minutes, hours, and days of."
            }
        ]
    }
    """
    return datetime_series.dt.floor('D') - pd.tseries.offsets.MonthBegin()



@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def STRIPTIMETOYEARS(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "STRIPTIMETOYEARS",
        "description": "Returns the date adjusted to the start of the year.",
        "search_terms": ["time", "date", "years", "strip"],
        "examples": [
            "STRIPTIMETOYEARS(date_column)",
            "STRIPTIMETOYEARS('2012-12-22 09:23:05')"
        ],
        "syntax": "STRIPTIMETOYEARS(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to reset the seconds, minutes, hours, days, and month components of."
            }
        ]
    }
    """
    return datetime_series.dt.floor('D') - pd.tseries.offsets.YearBegin()


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def SECOND(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "SECOND",
        "description": "Returns the seconds component of a specific date, as a number.",
        "search_terms": ["second", "sec"],
        "examples": [
            "SECOND(date_column)",
            "SECOND('2012-12-22 09:23:05')"
        ],
        "syntax": "SECOND(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to get the seconds of."
            }
        ]
    }
    """
    return datetime_series.dt.second


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def WEEK(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "WEEK",
        "description": "Returns the week (1-52) of a specific date, as a number.",
        "search_terms": ["week", "1", "52"],
        "examples": [
            "WEEK(date_column)",
            "WEEK('2012-12-22 09:23:05')"
        ],
        "syntax": "WEEK(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to get the week of."
            }
        ]
    }
    """
    return datetime_series.dt.week


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def WEEKDAY(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "WEEKDAY",
        "description": "Returns the day of the week that a specific date falls on. 1-7 corresponds to Monday-Sunday.",
        "search_terms": ["weekday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        "examples": [
            "WEEKDAY(date_column)",
            "WEEKDAY('2012-12-22')"
        ],
        "syntax": "WEEKDAY(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to get the weekday of."
            }
        ]
    }
    """
    return datetime_series.dt.weekday + 1


@handle_sheet_function_errors
@filter_nans
@convert_arg_to_series_type(
    0,
    'datetime',
    'error',
    'error'
)
def YEAR(datetime_series: pd.Series) -> pd.Series:
    """
    {
        "function": "YEAR",
        "description": "Returns the day of the year that a specific date falls in, as a number.",
        "search_terms": ["year", "date"],
        "examples": [
            "YEAR(date_column)",
            "YEAR('2012-12-22')"
        ],
        "syntax": "YEAR(date)",
        "syntax_elements": [{
                "element": "date",
                "description": "The date or date series to get the month of."
            }
        ]
    }
    """
    return datetime_series.dt.year


DATE_FUNCTIONS = {
    'DATEVALUE': DATEVALUE,
    'DAY': DAY,
    'ENDOFBUSINESSMONTH': ENDOFBUSINESSMONTH,
    'ENDOFMONTH': ENDOFMONTH,
    'HOUR': HOUR,
    'MONTH': MONTH,
    'MINUTE': MINUTE,
    'QUARTER': QUARTER,
    'SECOND': SECOND,
    'STARTOFBUSINESSMONTH': STARTOFBUSINESSMONTH, 
    'STARTOFMONTH': STARTOFMONTH, 
    'STRIPTIMETOMINUTES': STRIPTIMETOMINUTES, 
    'STRIPTIMETOHOURS': STRIPTIMETOHOURS,
    'STRIPTIMETODAYS': STRIPTIMETODAYS,
    'STRIPTIMETOMONTHS': STRIPTIMETOMONTHS,
    'STRIPTIMETOYEARS': STRIPTIMETOYEARS,
    'WEEK': WEEK,
    'WEEKDAY': WEEKDAY,
    'YEAR': YEAR,
}