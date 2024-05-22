# /agent

The /agent folder of a Nolita project concerns itself with setting up a chat completion API and passing it to the [Agent class](../reference/agent.html).

## Supported models

Please be aware that due to current dependency constraints, we only support Anthropic's claude-2.1 or earlier. All OpenAI text-mode models are supported.

While we currently predominantly support OpenAI and (some) Anthropic models, you can also write your own chat completion API for any model. For more information, see the [Agent reference document](../reference/agent.html).