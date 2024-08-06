# Changelog

## 2.1.3

- Fixes an issue with dependency resolution leading to crashes on 2.1.2 and 2.1.1, which were unpublished.
- Fixes an issue where setting the agent model with `npx nolita auth` was setting the wrong value.
- Fixes an issue where class declarations were not properly being exported.

## 2.1.2

- Re-push.

## 2.1.1

- Updates our example files.
- Cleans up packages to remove security vulnerability.
- Fixes an issue where inventory was not always provided when using Page.browse().
- Fixes an issue with the Anthropic API where consecutive user messages would cause a crash.

## 2.1.0

- Adds a `followRoute` method to the `Page` API which allows for deterministic execution of previous runs.
- Adds `replay` and `record` flags to `npx nolita` for retaining session IDs and replaying them from the index later.
- Our chat completion API has been completely rewritten, and we now support Claude 3.5. This also opens the door for local models in future updates.
- `npx nolita auth` is now the global key storage command for Nolita tasks and projects. If not specified when using any Nolita API, runner or server, Nolita will look for its model and HDR keys and fall back to them. This greatly simplifies what information needs to be passed to Nolita, as you only authenticate once.
  - For example, `npx nolita serve` payloads no longer need a `model_config` or any HDR configuration.
  - Additionally, `npx nolita create` projects can simply omit the calls to environment variables and fall back to Nolita's default keys.
- Fixed an issue where pre-installed Chrome on Linux machines would prevent running Nolita, due to an incorrect PATH check.
- Fixed an issue where users without a GitHub account could not run `npx nolita create`.

## 2.0.1

- Adds `npx nolita auth` for securing API keys to the memory index.
- Adds `npx nolita help` for an overview of commands.

## 2.0.0

- **Breaking: Browser is now instantiated with `Browser.launch()`, not `.create()`.**
- Added `Page` class for granular, natural language navigation API per "tab" of a Browser session.
  - For an example, see our updated [findEmail](https://github.com/hdresearch/nolita/blob/1f57cc8f5b112faaf62cab488f88b047825bddfa/examples/findEmail.ts#L26-L41) example code.
- Added a general `Nolita` class for an equivalent API of our general `npx nolita` task runner in Node scripts, without needing to wrangle classes. For granular usage, you should still create Browser sessions and drill down into Page navigation.
- The Nolita server has been expanded to work in sessions and Pages. The new flow involves creating a browser session, then creating a page within that session, then navigating, providing objectives, or step-by-step natural language navigation. High-level documentation pending on such functionality, but API schema documentation is available at `localhost:3000/doc` when you run `npx nolita serve`.
- Added documentation strings and automated documentation export across the codebase.

## 1.2.3

- Removed a console.log in the `npx` default runner.

## 1.2.2

- Redeploy due to missing dependency.

## 1.2.1

- Improves finding routes before sessions.
- Adds collective memory configuration to the server endpoint.
- Note: While there are no interface changes in this package itself, the collective memory endpoint itself has interface changes that necessitate using this version. Please update if you are using 1.2.0 or below. When in doubt, `npx nolita@latest`.

## 1.2.0

- Agents can now search for routes before starting a free browsing session
- Memory API is now much more stable
- Added comments to ./examples/shopping.ts for how to set memory
- Fixed an issue where the ARIA tree was being badly truncated

## 1.1.0

- Incorporates the ability to pass in HDR keys for using collective memory.

## 1.0.1

- Fixes an error during the `create` process.

## 1.0.0

- `@hdr/browser` is now `nolita`!
- Introduced several breaking changes to the type system in the underlying engine -- specifically in the structure of responses. All are streamlined, but you may see different structure coming back from the output.
- We now have several commands you can run:
  - `nolita` works the same as before, running a quick session in-terminal to solve a task. It's been rewritten to be cleaner and more friendly.
  - `nolita serve` lets you run a server for running objectives in a sandboxed local Chrome instance. `--port` will let you set a custom port. Documentation is provided.
  - `nolita create` lets you bootstrap a full-stack agentic application in one command.

## 0.3.1

- Added collective memory retention of browsing sessions.

## 0.3.0

- Added the ability to serve the browser automation framework as a server. For example, by running `npm run server` you can then incorporate tasks from other codebases by running requests against your local machine. Documentation is located at `/doc` when the server is started.
- Refactored to accomodate model agnosticism wherever the browser is exposed (`npx`, server, module). Please note that due to upstream dependencies, Anthropic models newer than Claude 2.1 currently do not work correctly. Theoretically, any provider can be written and incorporated by specifying a `CustomProvider`, but this requires importing `@hdr/browser` as a module. You can find more [in code](https://github.com/hdresearch/hdr-browser/blob/438a500a8e9abd85bf3a7dc2f4975796fbac4030/src/agent/config.ts) until we provide further documentation.

## 0.2.1

- Fixed an issue where inventories were not always passed to agents.

## 0.2.0

- Added the ability to incorporate "inventories," pieces of personal data you'd like agents to have access to for completing tasks.

## 0.1.0

- Initial release.
