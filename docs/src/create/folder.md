# The folder structure

The default [Nolita project](https://github.com/hdresearch/create) uses the following folders to delineate each layer of an agentic application:

- [`/agent`](./agent.html) includes the creation of a chat completion API, which is then passed to the Nolita [Agent](../reference/agent.html) class for integration with the browser state machine.
- [`/app`](./app.html) includes all front-end code for the application.
- [`/extensions`](./extensions.html) includes the integration of [inventories](../reference/inventory.html) as well as defining [custom types](./types.md) for your responses from the agent.
- [`/server`](./server.html) includes all back-end code for running the browse loop.

## Inspiration

While working with other agentic companies, our research found the following separation of roles, which inspired the structure of the Nolita project.

### LLM

- What model is used on the 'bottom layer' of the stack?
- Do you allow users to swap out underlying models?
- System prompt is included here.

### Agentic logic

- What is the agent’s prompt on top of the underlying system prompt?
- What’s the structure of the event loop we place an LLM in?
- Does it self-iterate and improve? Is it set?
- Is it a formal state machine, or is it entirely prompt driven?

### Toolchain

- How do we define what actions the LLM can perform?
- Is the toolchain defined as part of prompt manipulation, or is it formally constrained (as in, proceeding along a graph of possible actions)?
    - By going entirely prompt-driven, one can fall into “phantom actions” (reporting an action is undertaken, as opposed to making it such that saying an action is the same thing as the action itself.)
    - Let me expound a little here: there’s a situation where by simply saying “I’ll invite this person” is itself part of a command to the toolchain, as opposed to a separate report to an observer. When writing entirely prompt-driven applications, one can hallucinate the structure of the action.
- Do we write an underlying API to formalise all commands without directly hitting external APIs?

### Event loop manipulation

- Does the agent then “double check its work” before proceeding to presentation layer?
- Do we GOTO 1 so to speak, if it performs incorrectly?

### Presentation

- How transparent is the stack to the user?
- Is the agent abstracted as a “product” (with an agent’s artificial monologue puppeteering a conventional software stack), or anthropomorphized in its own right?
- Is the user configuring tasks, agents, events? 
