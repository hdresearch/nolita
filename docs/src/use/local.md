# Using local models

Nolita can take both `local` and `ollama` providers for autonomous tasks. However, at present functionality is quite limited; we mark usage of local models as experimental, but available. We encourage you to experiment with your own workflows and see where delegating to local models makes sense.

## Using Ollama

Ollama is supported as a provider and will connect to the default Ollama port when used. When you set `ollama` as a provider, the `model` name you provide to one that Ollama recognizes. For more information on available models for Ollama, see [its documentation](https://ollama.com/library).

## Using local model files

We use `node-llama-cpp` under the hood to run a model file. For information on `node-llama-cpp` and getting a model file for use, see [its documentation](https://withcatai.github.io/node-llama-cpp/guide/#getting-a-model-file).

Once a model file is downloaded, Nolita accepts the **full path to the file** as a model name when using a `local` provider.

You can set this, as usual, using `npx nolita auth`.

## Usage and limitations

Smaller models (7B and below) are far less capable of holding enough context to navigate the web alone. They can, however, still process data well. In our current usage, we find that [`page.get()`](/reference/classes/Page.html#get) calls function consistently. Other calls, like autonomous browsing and navigation, can stumble on navigating the Nolita state machine. It is not uncommon to see errors about `incorrect JSON` from our generators.

You may, however, find better results with bigger local models; what models you can experiment with is a limitation of hardware.