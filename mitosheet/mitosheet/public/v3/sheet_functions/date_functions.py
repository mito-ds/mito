#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Contains all functions that can be used in a sheet that operate on dates.

NOTE: This file is alphabetical order!
"""
from datetime import datetime
from distutils.version import LooseVersion
from typing import Optional

import pandas as pd

from mitosheet.public.v3.errors import handle_sheet_function_errors
from mitosheet.public.v3.types.decorators import cast_values_in_arg_to_type
from mitosheet.public.v3.types.sheet_function_types import IntFunctionReturnType, DatetimeRestrictedInputType, DatetimeFunctionReturnType


# Inspired by: https://stackoverflow.com/questions/69345845/why-does-dateoffset-rollback-not-work-the-way-i-expect-it-to-with-days-hours
# Given a datetime and a frequency (ie: business month begin), sets the 
# the timestamp back to the frequency unless its already there!
def to_start(t: pd.Timestamp, freq: pd.DateOffset) -> pd.Timestamp:
    try:
        return t.floor(freq) # fixed frequencies should just floor the date/time
    except ValueError: # if freq is variable, we fall into here...
        return freq.rollback(t.floor("D"))

def to_end(t: pd.Timestamp, freq: pd.DateOffset) -> pd.Timestamp:
    try:
        return t.ceil(freq) # fixed frequencies should just ceil the date/time
    except ValueError: # if freq is variable, we fall into here...
        return freq.rollforward(t.ceil("D"))


@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def DATEVALUE(arg: DatetimeRestrictedInputType) -> DatetimeFunctionReturnType:
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
    return arg


@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def DAY(arg: DatetimeRestrictedInputType) -> IntFunctionReturnType:
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
    if isinstance(arg, datetime) or isinstance(arg, pd.Timestamp):
        return arg.day
    
    return arg.dt.day
    

@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def ENDOFBUSINESSMONTH(arg: DatetimeRestrictedInputType) -> DatetimeFunctionReturnType:
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
    if isinstance(arg, pd.Timestamp):
        return to_end(arg, pd.tseries.offsets.BMonthEnd(n=0))
    if isinstance(arg, datetime):
        return to_end(pd.Timestamp(arg), pd.tseries.offsets.BMonthEnd(n=0))
    
    return arg.apply(lambda t: to_end(t, pd.tseries.offsets.BMonthEnd(n=0)))



@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def ENDOFMONTH(arg: DatetimeRestrictedInputType) -> DatetimeFunctionReturnType:
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
    if isinstance(arg, pd.Timestamp):
        return to_end(arg, pd.tseries.offsets.MonthEnd(n=0))
    if isinstance(arg, datetime):
        return to_end(pd.Timestamp(arg), pd.tseries.offsets.MonthEnd(n=0))
    
    return arg.apply(lambda t: to_end(t, pd.tseries.offsets.MonthEnd(n=0)))


@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def HOUR(arg: DatetimeRestrictedInputType) -> IntFunctionReturnType:
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
    if isinstance(arg, datetime) or isinstance(arg, pd.Timestamp):
        return arg.hour
    
    return arg.dt.hour


@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def MINUTE(arg: DatetimeRestrictedInputType) -> IntFunctionReturnType:
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
    if isinstance(arg, datetime) or isinstance(arg, pd.Timestamp):
        return arg.minute
    
    return arg.dt.minute


@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def MONTH(arg: DatetimeRestrictedInputType) -> IntFunctionReturnType:
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
    if isinstance(arg, datetime) or isinstance(arg, pd.Timestamp):
        return arg.month
    
    return arg.dt.month


@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def QUARTER(arg: DatetimeRestrictedInputType) -> IntFunctionReturnType:
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
    if isinstance(arg, datetime):
        return pd.Timestamp(arg).quarter
    elif isinstance(arg, pd.Timestamp):
        return arg.quarter
    
    return arg.dt.quarter


@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def STARTOFBUSINESSMONTH(arg: DatetimeRestrictedInputType) -> DatetimeFunctionReturnType:
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
    if isinstance(arg, pd.Timestamp):
        return to_start(arg, pd.tseries.offsets.BMonthBegin(n=1))
    elif isinstance(arg, datetime):
        return to_start(pd.Timestamp(arg), pd.tseries.offsets.BMonthBegin(n=1))
    
    return arg.apply(lambda t: to_start(t, pd.tseries.offsets.BMonthBegin(n=1)))
    

@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def STARTOFMONTH(arg: DatetimeRestrictedInputType) -> DatetimeFunctionReturnType:
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
    if isinstance(arg, pd.Timestamp):
        return to_start(arg, pd.tseries.offsets.MonthBegin(n=1))
    elif isinstance(arg, datetime):
        return to_start(pd.Timestamp(arg), pd.tseries.offsets.MonthBegin(n=1))
    
    return arg.apply(lambda t: to_start(t, pd.tseries.offsets.MonthBegin(n=1)))



@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def STRIPTIMETOMINUTES(arg: DatetimeRestrictedInputType) -> DatetimeFunctionReturnType:
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
    if isinstance(arg, pd.Timestamp):
        return arg.floor('Min')
    elif isinstance(arg, datetime):
        return pd.Timestamp(arg).floor('Min')
    
    return arg.dt.floor('Min')


@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def STRIPTIMETOHOURS(arg: DatetimeRestrictedInputType) -> DatetimeFunctionReturnType:
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
    if isinstance(arg, pd.Timestamp):
        return arg.floor('H')
    elif isinstance(arg, datetime):
        return pd.Timestamp(arg).floor('H')
    
    return arg.dt.floor('H')


@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def STRIPTIMETODAYS(arg: DatetimeRestrictedInputType) -> DatetimeFunctionReturnType:
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
    if isinstance(arg, pd.Timestamp):
        return arg.floor('D')
    elif isinstance(arg, datetime):
        return pd.Timestamp(arg).floor('D')
    
    return arg.dt.floor('D')


@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def STRIPTIMETOMONTHS(arg: DatetimeRestrictedInputType) -> DatetimeFunctionReturnType:
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
    if isinstance(arg, pd.Timestamp):
        return arg.floor('D') - pd.tseries.offsets.MonthBegin()
    elif isinstance(arg, datetime):
        return pd.Timestamp(arg).floor('D') - pd.tseries.offsets.MonthBegin()
    
    return arg.dt.floor('D') - pd.tseries.offsets.MonthBegin()



@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def STRIPTIMETOYEARS(arg: DatetimeRestrictedInputType) -> DatetimeFunctionReturnType:
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
    if isinstance(arg, pd.Timestamp):
        return arg.floor('D') - pd.tseries.offsets.YearBegin()
    elif isinstance(arg, datetime):
        return pd.Timestamp(arg).floor('D') - pd.tseries.offsets.YearBegin()
    
    return arg.dt.floor('D') - pd.tseries.offsets.YearBegin()


@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def SECOND(arg: DatetimeRestrictedInputType) -> IntFunctionReturnType:
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
    if isinstance(arg, datetime):
        return pd.Timestamp(arg).second
    elif isinstance(arg, pd.Timestamp):
        return arg.second

    return arg.dt.second


@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def WEEK(arg: DatetimeRestrictedInputType) -> IntFunctionReturnType:
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
    if isinstance(arg, datetime):
        return pd.Timestamp(arg).week
    elif isinstance(arg, pd.Timestamp):
        return arg.week

    # Handle if we're on pandas version < 1.1, where isocalendar() is not available
    if LooseVersion(pd.__version__) < LooseVersion('1.1'):
        return arg.dt.week
    
    return arg.dt.isocalendar().week


@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def WEEKDAY(arg: DatetimeRestrictedInputType) -> IntFunctionReturnType:
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
    if isinstance(arg, datetime):
        return pd.Timestamp(arg).weekday() + 1
    elif isinstance(arg, pd.Timestamp):
        return arg.weekday() + 1

    return arg.dt.weekday + 1


@cast_values_in_arg_to_type('arg', 'datetime')
@handle_sheet_function_errors
def YEAR(arg: DatetimeRestrictedInputType) -> IntFunctionReturnType:
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
    if isinstance(arg, datetime):
        return pd.Timestamp(arg).year
    elif isinstance(arg, pd.Timestamp):
        return arg.year

    return arg.dt.year


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