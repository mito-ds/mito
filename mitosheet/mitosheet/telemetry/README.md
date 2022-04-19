# Telemetry in Mitosheet

We take privacy very seriously. 

As such, we never don't log any of your private data. We only collect telemetry information about button clicks, where Mito is loaded from, various Python configuration settings, and other general interactions with the app.

If you want to turn off telemetry, you can purchase a Pro account on our [plans page](https://trymito.io/plans). This will also get you access to a variety of other pro features like graph styling, generated code optimization, export formating, and many more coming soon!

## What information is logged?

We aim to be very transparent about the information we collect in our telemetry. You can see a complete enumeration of all the events we log in the `private_params_map.py` file in this folder. 

## How do you anonymize private?

In the `anonymization_utils.py` file in this folder, you can see our approach. At a high-level, it involves putting private data through a 1-way function, which means no one can see what the original data was.
