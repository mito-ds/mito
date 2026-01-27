## Virtual Environment
- ALWAYS activate the virtual environment before running any Python commands: `cd mito-ai && source venv/bin/activate`
- For other components: check for venv directories and activate appropriately

## Engineering practices

We're a startup. You're probably used to writing enterprise code -- code that tries to handle every possible edge case and has fallbacks for everything. That's not how we do things around here: our number one rule is to keep things simple. We handle ONLY the most important cases.

We try to only add new functionality that is small (that is, simple and few lines of code) or absolutely necessary. If a change is not small or absolutely necessary, don't make it.

**Backwards-compatibility**: Since our app runs locally on a user's machine, we think about backwards compatibility very differently than enterprise code.
- For things like updating the environment variables structure, we don't need to worry about backwards compatibility because if the enterprise opts in to upgrading, they can update the enviornment variables at the same time. 
- For things like adding new tool options, we don't need to worry about backwards compatibility because only users on the newest version of the tool are going to have access to the new options.
- For things like changing how we read in old chat histories, we DO need to worry about backwards compatibility because the chat histories live on the user's machine, so we don't have a way to migrate them to the new format without adding that migration step into the tool.