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
