# Introduction

Welcome to the documentation for [Nolita](https://nolita.ai)! Nolita is a framework for building web-enabled agentic applications and workflows.

## What do I need to use Nolita?

Before using Nolita you'll want to install [Node.js](https://nodejs.org), preferably version 20, and [Google Chrome](https://www.google.com/chrome/). If you want to work on the source code, you'll want [pnpm](https://github.com/pnpm/pnpm) too.

You don't need to install Nolita itself at all. You can run it directly with `npx` or import it into a Node.js project with `npm i nolita`. More information is available on the following pages on usage.

## How does it work?

Nolita drives a Puppeteer installation using a local instance of Chrome and parses the accessiblity tree, preprocessing ARIA nodes to add additional accessibility information when necessary.

At the core of the framework is a state machine between Puppeteer and your model that enforces action steps with [Zod](https://github.com/colinhacks/zod).

In sum: "you tell the AI to do something on the internet and it does it." 

In practice, Nolita allows for a large degree of granularity and extensibility, deploying agentic behaviour where necessary and stepping down into manual scripts or lower-level directives when you need to.

## What do we mean by 'agentic'?

We consider agentic software to be software that can make decisions about its behaviour. For example, while a state machine normally restricts its inputs and outputs according to its state, it cannot reason about future inputs to give itself or outputs it should next derive in order to accomplish a higher-level goal.

In contrast, agentic software possesses the ability to evaluate its environment, consider multiple potential actions, and choose the most appropriate one based on predefined goals or learning algorithms. This decision-making capability allows agentic software to adapt and respond to dynamic conditions in a more flexible and intelligent manner than state machines.

## How is Nolita different from [agentic framework]?

That being said, agents are an emerging art form. Agentic software based upon large language models to drive state machines are inherently probabilistic, and therefore not well-suited to production environments.

Nolita was written from the start to integrate with High Dimensional Research's [Collective Memory Index](https://hdr.is/memory). By working in concert, agentic actions are requested only for new and unfamiliar situations; if you imagine a webpage as a graph, then you can probably guess that most pages share structural similarities. We use a combination of accessibility tree preprocessing and graph comparison algorithms to then search for the most appropriate step in the browser state machine to execute, increasing the determinism and speed of the task, and leaving the agent to reason where it needs to.

## What can I do with Nolita?

As a few examples, you can use Nolita to

- gather structured data and chain it into other APIs, like sending an email or building an RSS feed;
- quickly pipe information from the internet into your shell scripts, even from behind a log-in screen;
- write and deploy Puppeteer scripts in natural language