# Public Interfaces

Public interfaces are what are exposed to users. With Mito, we do our _very best_ to never break any code generates by Mito, which requires maintaining all old public interfaces we've ever supported. While there's a minor maintaince burden, we aim to make upgrading as easy as possible.

## When to upgrade the public interface

Any change that might make a users anlaysis perform differently requires versioning the public interface. Examples include:

1. If you remove a sheet function.
2. You change a sheet functions behavior so it performs differently in common scenarios.
3. You change how we cast types

Some example of things that do not require an upgrade:
1. You add a new sheet function.
2. You extend type casting to support more types than previous.

These don't require upgrading as they don't break or change previous analyses.


## How to upgrade the public interace

1. Add a new folder (e.g. `v3`)
2. Fix up all the steps so they support the new version of the public interface (and make sure to upgrade them to take this as a parameter in the step upgrader)
3. Add code-gen on the frontend so that the new import statement are from the new public interface
