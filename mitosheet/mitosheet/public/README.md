# Public Interfaces

Public interfaces are what are exposed to users. With Mito, we do our _very best_ to never break any code generates by Mito, which requires maintaining all old public interfaces we've ever supported. While there's a minor maintaince burden, we aim to make upgrading as easy as possible.

Thus, if you want to add a new public interface (e.g. changing sheet functions in a backwards incompatible way):
1. Add a new folder (e.g. `v3`)
2. Fix up all the steps so they support the new version of the public interface
3. Add code-gen on the frontend so that the new import statement are from the new public interface
