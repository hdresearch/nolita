# /extensions

The extensions folder is intended for additions to the core agentic stack:

- [inventories](../reference/inventory.html), i.e. personal data outside the prompt context;
- [custom types](./types.md), for specifying structured responses for the workflow

If you need to derive external information to pipe into either, it is also best done in this folder.

You could, for example, gather user session data to then derive which custom type to pass to the agent browser for the session. You could also, in addition, import user data from a database for use as an inventory while keeping all user data outside the prompt context itself.

For more information on inventories and how they work, see [Inventory](../reference/inventory.html).