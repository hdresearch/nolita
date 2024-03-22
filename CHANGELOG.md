# Changelog

## 0.3.0

- Added the ability to serve the browser automation framework as a server. For example, by running `npm run server` you can then incorporate tasks from other codebases by running requests against your local machine. Documentation is located at `/doc` when the server is started.
- Refactored to accomodate model agnosticism wherever the browser is exposed (`npx`, server, module). Please note that due to upstream dependencies, Anthropic models newer than Claude 2.1 currently do not work correctly. Theoretically, any provider can be written and incorporated by specifying a `CustomProvider`, but this requires importing `@hdr/browser` as a module. You can find more [in code](https://github.com/hdresearch/hdr-browser/blob/438a500a8e9abd85bf3a7dc2f4975796fbac4030/src/agent/config.ts) until we provide further documentation.

## 0.2.1

- Fixed an issue where inventories were not always passed to agents.

## 0.2.0

- Added the ability to incorporate "inventories," pieces of personal data you'd like agents to have access to for completing tasks.

## 0.1.0

- Initial release.