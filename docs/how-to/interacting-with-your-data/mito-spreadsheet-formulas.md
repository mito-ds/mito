---
description: >-
  This documentation lists all of the spreadsheet formulas that you can call
  within a Mito spreadsheet
---

# Formula Reference

{% hint style="info" %}
Missing a formula? [Let us know](mailto:aarondr77@gmail.com?subject=Missing%20Functionality) if your workflow requires formulas that Mito does not yet support. We prioritize adding functionality for active Mito users!
{% endhint %}



## ABS

Returns the absolute value of the passed number or series.

### Examples

* ABS(-1.3)
* ABS(A)

### Syntax

ABS(value)

#### Syntax Elements

* **value**: The value or series to take the absolute value of.

## AND

Returns True if all of the provided arguments are True, and False if any of the provided arguments are False.

### Examples

* AND(True, False)
* AND(Nums > 100, Nums < 200)
* AND(Pay > 10, Pay < 20, Status == 'active')

### Syntax

AND(boolean\_condition1, \[boolean\_condition2, ...])

#### Syntax Elements

* **boolean\_condition1**: An expression or series that returns True or False values. See IF documentation for a list of conditons.
* **boolean\_condition2 ... \[OPTIONAL]**: An expression or series that returns True or False values. See IF documentation for a list of conditons.

## AVG

Returns the numerical mean value of the passed numbers and series.

### Examples

* AVG(1, 2)
* AVG(A, B)
* AVG(A, 2)

### Syntax

AVG(value1, \[value2, ...])

#### Syntax Elements

* **value1**: The first number or series to consider when calculating the average.
* **value2, ... \[OPTIONAL]**: Additional numbers or series to consider when calculating the average.

## BOOL

Converts the passed arguments to boolean values, either True or False. For numberic values, 0 converts to False while all other values convert to True.

### Examples

* BOOL(Amount\_Payed)
* AND(BOOL(Amount\_Payed), Is\_Paying)

### Syntax

BOOL(series)

#### Syntax Elements

* **series**: An series to convert to boolean values, either True or False.

## CLEAN

Returns the text with the non-printable ASCII characters removed.

### Examples

* CLEAN('ABC ')

### Syntax

CLEAN(string)

#### Syntax Elements

* **string**: The string or series whose non-printable characters are to be removed.

## CONCAT

Returns the passed strings and series appended together.

### Examples

* CONCAT('Bite', 'the bullet')
* CONCAT(A, B)

### Syntax

CONCAT(string1, \[string2, ...])

#### Syntax Elements

* **string1**: The first string or series.
* **string2, ... \[OPTIONAL]**: Additional strings or series to append in sequence.

## CORR

Computes the correlation between two series, excluding missing values.

### Examples

* \=CORR(A, B)
* \=CORR(B, A)

### Syntax

CORR(series\_one, series\_two)

#### Syntax Elements

* **series\_one**: The number series to convert to calculate the correlation.
* **series\_two**: The number series to convert to calculate the correlation.

## DATEVALUE

Converts a given string to a date series.

### Examples

* DATEVALUE(date\_column)
* DATEVALUE('2012-12-22')

### Syntax

DATEVALUE(date\_string)

#### Syntax Elements

* **date\_string**: The date string to turn into a date object.

## DAY

Returns the day of the month that a specific date falls on, as a number.

### Examples

* DAY(date\_column)
* DAY('2012-12-22')

### Syntax

DAY(date)

#### Syntax Elements

* **date**: The date or date series to get the day of.

## ENDOFBUSINESSMONTH

Given a date, returns the end of the buisness month. E.g. the last weekday.

### Examples

* ENDOFBUSINESSMONTH(date\_column)
* ENDOFBUSINESSMONTH('2012-12-22')

### Syntax

ENDOFBUSINESSMONTH(date)

#### Syntax Elements

* **date**: The date or date series to get the end of the business month of.

## ENDOFMONTH

Given a date, returns the end of the month, as a date. E.g. input of 12-22-1997 will return 12-31-1997.

### Examples

* ENDOFMONTH(date\_column)
* ENDOFMONTH('2012-12-22')

### Syntax

ENDOFMONTH(date)

#### Syntax Elements

* **date**: The date or date series to get the last day of the month of.

## EXP

Returns e, the base of the natural logarithm, raised to the power of passed series.

### Examples

* \=EXP(data)
* \=EXP(A)

### Syntax

EXP(series)

#### Syntax Elements

* **series**: The series to raise e to.

## FILLNAN

Replaces the NaN values in the series with the replacement value.

### Examples

* FILLNAN(A, 10)
* FILLNAN(A, 'replacement')

### Syntax

FILLNAN(series, replacement)

#### Syntax Elements

* **series**: The series to replace the NaN values in.
* **replacement**: A string, number, or date to replace the NaNs with.

## FIND

Returns the position at which a string is first found within text, case-sensitive. Returns 0 if not found.

### Examples

* FIND(A, 'Jack')
* FIND('Ben has a friend Jack', 'Jack')

### Syntax

FIND(text\_to\_search, search\_for)

#### Syntax Elements

* **text\_to\_search**: The text or series to search for the first occurrence of search\_for.
* **search\_for**: The string to look for within text\_to\_search.

## HOUR

Returns the hour component of a specific date, as a number.

### Examples

* HOUR(date\_column)
* HOUR('2012-12-22 09:45:00')

### Syntax

HOUR(date)

#### Syntax Elements

* **date**: The date or date series to get the hour of.

## IF

Returns one value if the condition is True. Returns the other value if the conditon is False.

### Examples

* IF(Status == 'success', 1, 0)
* IF(Nums > 100, 100, Nums)
* IF(AND(Grade >= .6, Status == 'active'), 'pass', 'fail')

### Syntax

IF(boolean\_condition, value\_if\_true, value\_if\_false)

#### Syntax Elements

* **boolean\_condition**: An expression or series that returns True or False values. Valid conditions for comparison include ==, !=, >, <, >=, <=.
* **value\_if\_true**: The value the function returns if condition is True.
* **value\_if\_false**: The value the function returns if condition is False.

## KURT

Computes the unbiased kurtosis, a measure of tailedness, of a series, excluding missing values.

### Examples

* \=KURT(A)
* \=KURT(A \* B)

### Syntax

KURT(series)

#### Syntax Elements

* **series**: The series to calculate the unbiased kurtosis of.

## LEFT

Returns a substring from the beginning of a specified string.

### Examples

* LEFT(A, 2)
* LEFT('The first character!')

### Syntax

LEFT(string, \[number\_of\_characters])

#### Syntax Elements

* **string**: The string or series from which the left portion will be returned.
* **number\_of\_characters \[OPTIONAL, 1 by default]**: The number of characters to return from the start of string.

## LEN

Returns the length of a string.

### Examples

* LEN(A)
* LEN('This is 21 characters')

### Syntax

LEN(string)

#### Syntax Elements

* **string**: The string or series whose length will be returned.

## LOWER

Converts a given string to lowercase.

### Examples

* \=LOWER('ABC')
* \=LOWER(A)
* \=LOWER('Nate Rush')

### Syntax

LOWER(string)

#### Syntax Elements

* **string**: The string or series to convert to lowercase.

## MAX

Returns the maximum value among the passed arguments.

### Examples

* MAX(10, 11)
* MAX(Old\_Data, New\_Data)

### Syntax

MAX(value1, \[value2, ...])

#### Syntax Elements

* **value1**: The first number or column to consider for the maximum value.
* **value2, ... \[OPTIONAL]**: Additional numbers or columns to compute the maximum value from.

## MID

Returns a segment of a string.

### Examples

* MID(A, 2, 2)
* MID('Some middle characters!', 3, 4)

### Syntax

MID(string, starting\_at, extract\_length)

#### Syntax Elements

* **string**: The string or series to extract the segment from.
* **starting\_at**: The index from the left of string from which to begin extracting.
* **extract\_length**: The length of the segment to extract.

## MIN

Returns the minimum value among the passed arguments.

### Examples

* MIN(10, 11)
* MIN(Old\_Data, New\_Data)

### Syntax

MIN(value1, \[value2, ...])

#### Syntax Elements

* **value1**: The first number or column to consider for the minumum value.
* **value2, ... \[OPTIONAL]**: Additional numbers or columns to compute the minumum value from.

## MINUTE

Returns the minute component of a specific date, as a number.

### Examples

* MINUTE(date\_column)
* MINUTE('2012-12-22 09:45:00')

### Syntax

MINUTE(date)

#### Syntax Elements

* **date**: The date or date series to get the minute of.

## MONTH

Returns the month that a specific date falls in, as a number.

### Examples

* MONTH(date\_column)
* MONTH('2012-12-22')

### Syntax

MONTH(date)

#### Syntax Elements

* **date**: The date or date series to get the month of.

## MULTIPLY

Returns the product of two numbers.

### Examples

* MULTIPLY(2,3)
* MULTIPLY(A,3)

### Syntax

MULTIPLY(factor1, \[factor2, ...])

#### Syntax Elements

* **factor1**: The first number to multiply.
* **factor2, ... \[OPTIONAL]**: Additional numbers or series to multiply.

## OR

Returns True if any of the provided arguments are True, and False if all of the provided arguments are False.

### Examples

* OR(True, False)
* OR(Status == 'success', Status == 'pass', Status == 'passed')

### Syntax

OR(boolean\_condition1, \[boolean\_condition2, ...])

#### Syntax Elements

* **boolean\_condition1**: An expression or series that returns True or False values. See IF documentation for a list of conditons.
* **boolean\_condition2 ... \[OPTIONAL]**: An expression or series that returns True or False values. See IF documentation for a list of conditons.

## POWER

The POWER function can be used to raise a number to a given power.

### Examples

* POWER(4, 1/2)
* POWER(Dose, 2)

### Syntax

POWER(value, exponent)

#### Syntax Elements

* **value**: Number to raise to a power.
* **exponent**: The number to raise value to.

## PROPER

Capitalizes the first letter of each word in a specified string.

### Examples

* \=PROPER('nate nush')
* \=PROPER(A)

### Syntax

PROPER(string)

#### Syntax Elements

* **string**: The value or series to convert to convert to proper case.

## QUARTER

Returns the quarter (1-4) that a specific date falls in, as a number.

### Examples

* QUARTER(date\_column)
* QUARTER('2012-12-22')

### Syntax

QUARTER(date)

#### Syntax Elements

* **date**: The date or date series to get the quarter of.

## RIGHT

Returns a substring from the beginning of a specified string.

### Examples

* RIGHT(A, 2)
* RIGHT('The last character!')

### Syntax

RIGHT(string, \[number\_of\_characters])

#### Syntax Elements

* **string**: The string or series from which the right portion will be returned.
* **number\_of\_characters \[OPTIONAL, 1 by default]**: The number of characters to return from the end of string.

## ROUND

Rounds a number to a given number of decimals.

### Examples

* ROUND(1.3)
* ROUND(A, 2)

### Syntax

ROUND(value, \[decimals])

#### Syntax Elements

* **value**: The value or series to round.
* **decimals**: The number of decimals to round to. Default is 0.

## SECOND

Returns the seconds component of a specific date, as a number.

### Examples

* SECOND(date\_column)
* SECOND('2012-12-22 09:23:05')

### Syntax

SECOND(date)

#### Syntax Elements

* **date**: The date or date series to get the seconds of.

## SKEW

Computes the skew of a series, excluding missing values.

### Examples

* \=SKEW(A)
* \=SKEW(A \* B)

### Syntax

SKEW(series)

#### Syntax Elements

* **series**: The series to calculate the skew of.

## STARTOFBUSINESSMONTH

Given a date, returns the most recent start of the business month, as a state. E.g. the first weekday.

### Examples

* STARTOFBUSINESSMONTH(date\_column)
* STARTOFBUSINESSMONTH('2012-12-22 09:23:05')

### Syntax

STARTOFBUSINESSMONTH(date)

#### Syntax Elements

* **date**: The date or date series to get the most recent beginning of month business day of.

## STARTOFMONTH

Given a date, returns the start of the month, as a date. E.g. input of 12-22-1997 will return 12-1-1997.

### Examples

* STARTOFMONTH(date\_column)
* STARTOFMONTH('2012-12-22 09:23:05')

### Syntax

STARTOFMONTH(date)

#### Syntax Elements

* **date**: The date or date series to get the first day of the month of.

## STDEV

Computes the standard deviation of a series, excluding missing values.

### Examples

* \=STDEV(A)
* \=STDEV(A \* B)

### Syntax

STDEV(series)

#### Syntax Elements

* **series**: The series to calculate the standard deviation of.

## STRIPTIMETODAYS

Returns the date with a seconds, minutes, and hours component of 00:00:00.

### Examples

* STRIPTIMETODAYS(date\_column)
* STRIPTIMETODAYS('2012-12-22 09:23:05')

### Syntax

STRIPTIMETODAYS(date)

#### Syntax Elements

* **date**: The date or date series to reset the seconds, minutes, and hours component of.

## STRIPTIMETOHOURS

Returns the date with a seconds and minutes component of 00:00.

### Examples

* STRIPTIMETOHOURS(date\_column)
* STRIPTIMETOHOURS('2012-12-22 09:23:05')

### Syntax

STRIPTIMETOHOURS(date)

#### Syntax Elements

* **date**: The date or date series to reset the seconds and minutes component of.

## STRIPTIMETOMINUTES

Returns the date with a seconds component of 00.

### Examples

* STRIPTIMETOMINUTES(date\_column)
* STRIPTIMETOMINUTES('2012-12-22 09:23:05')

### Syntax

STRIPTIMETOMINUTES(date)

#### Syntax Elements

* **date**: The date or date series to reset the seconds component of.

## STRIPTIMETOMONTHS

Returns the date adjusted to the start of the month.

### Examples

* STRIPTIMETOMONTHS(date\_column)
* STRIPTIMETOMONTHS('2012-12-22 09:23:05')

### Syntax

STRIPTIMETOMONTHS(date)

#### Syntax Elements

* **date**: The date or date series to reset the seconds, minutes, hours, and days of.

## STRIPTIMETOYEARS

Returns the date adjusted to the start of the year.

### Examples

* STRIPTIMETOYEARS(date\_column)
* STRIPTIMETOYEARS('2012-12-22 09:23:05')

### Syntax

STRIPTIMETOYEARS(date)

#### Syntax Elements

* **date**: The date or date series to reset the seconds, minutes, hours, days, and month components of.

## SUBSTITUTE

Replaces existing text with new text in a string.

### Examples

* SUBSTITUTE('Better great than never', 'great', 'late')
* SUBSTITUTE(A, 'dog', 'cat')

### Syntax

SUBSTITUTE(text\_to\_search, search\_for, replace\_with, \[count])

#### Syntax Elements

* **text\_to\_search**: The text within which to search and replace.
* **search\_for**: The string to search for within text\_to\_search.
* **replace\_with**: The string that will replace search\_for.
* **count**: The number of times to perform the substitute. Default is all.

## SUM

Returns the sum of the given numbers and series.

### Examples

* SUM(10, 11)
* SUM(A, B, D, F)
* SUM(A, B, D, F)

### Syntax

SUM(value1, \[value2, ...])

#### Syntax Elements

* **value1**: The first number or column to add together.
* **value2, ... \[OPTIONAL]**: Additional numbers or columns to sum.

## TEXT

Turns the passed series into a string.

### Examples

* \=TEXT(Product\_Number)
* \=TEXT(Start\_Date)

### Syntax

TEXT(series)

#### Syntax Elements

* **series**: The series to convert to a string.

## TRIM

Returns a string with the leading and trailing whitespace removed.

### Examples

* \=TRIM(' ABC')
* \=TRIM(' ABC ')
* \=TRIM(A)

### Syntax

TRIM(string)

#### Syntax Elements

* **string**: The value or series to remove the leading and trailing whitespace from.

## TYPE

Returns the type of each element of the passed series. Return values are 'number', 'str', 'bool', 'datetime', 'object', or 'NaN'.

### Examples

* TYPE(Nums\_and\_Strings)
* IF(TYPE(Account\_Numbers) != 'NaN', Account\_Numbers, 0)

### Syntax

TYPE(series)

#### Syntax Elements

* **series**: The series to get the type of each element of.

## UPPER

Converts a given string to uppercase.

### Examples

* \=UPPER('abc')
* \=UPPER(A)
* \=UPPER('Nate Rush')

### Syntax

UPPER(string)

#### Syntax Elements

* **string**: The string or series to convert to uppercase.

## VALUE

Converts a string series to a number series. Any values that fail to convert will return an NaN.

### Examples

* \=VALUE(A)
* \=VALUE('123')

### Syntax

VALUE(string)

#### Syntax Elements

* **string**: The string or series to convert to a number.

## VAR

Computes the variance of a series, excluding missing values.

### Examples

* \=VAR(A)
* \=VAR(A - B)

### Syntax

VAR(series)

#### Syntax Elements

* **series**: The series to calculate the variance of.

## WEEK

Returns the week (1-52) of a specific date, as a number.

### Examples

* WEEK(date\_column)
* WEEK('2012-12-22 09:23:05')

### Syntax

WEEK(date)

#### Syntax Elements

* **date**: The date or date series to get the week of.

## WEEKDAY

Returns the day of the week that a specific date falls on. 1-7 corresponds to Monday-Sunday.

### Examples

* WEEKDAY(date\_column)
* WEEKDAY('2012-12-22')

### Syntax

WEEKDAY(date)

#### Syntax Elements

* **date**: The date or date series to get the weekday of.

## YEAR

Returns the day of the year that a specific date falls in, as a number.

### Examples

* YEAR(date\_column)
* YEAR('2012-12-22')

### Syntax

YEAR(date)

#### Syntax Elements

* **date**: The date or date series to get the month of.



{% hint style="info" %}
Missing a formula? [Let us know](mailto:aarondr77@gmail.com?subject=Missing%20Functionality) if your workflow requires formulas that Mito does not yet support. We prioritize adding functionality for active Mito users!
{% endhint %}

