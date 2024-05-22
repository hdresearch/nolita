# Inventory

The Inventory class constructs keys and values to mask outside the prompt itself, ie. when using collective memory or subsequent tasks.

```ts
const ourInventory = {
    "inventory": [
        { 
            "value": "student",
            "name": "Username",
            "type": "string" 
        },
        { 
            "value": "Password123",
            "name": "Password",
            "type": "string"
        }
    ]
}

const inventory = new Inventory(ourInventory || []);
```

## How does it work?

The inventory class keeps both a copy of the array of inventory items and a set of masked items that `replaceMask` substitutes with the real value only when performing an action (that is, after the agent has processed the page content and objective state).

When processing the Aria tree, the browser also censors the exposed inventory item as part of the processing step.

We do this to hide personal information from both the LLM and from any telemetry performed from the browse session.

## Methods

### `toString()`

Takes the masked inventory values, makes them into `key: value` strings and concatenates them together.

### `replaceMask()`

Finding all our masked inventory values, replaces them with the actual values.

### `censor()`

Finding all our inventory values, replaces them with masked inventory values.