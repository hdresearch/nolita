# /server

The `/server` folder holds all back-end logic for the application. 

We spin up all applicable classes in the Nolita framework, take the additions from the [`/extensions`](./extensions.html) folder, and finally user input from the front-end [application](./app.html) and pass an objective to the agent to perform on a local, sandboxed Chrome instance.

This section of the application is best-suited for including any additional API calls you need -- whether sending emails based upon the response from the agent, recording user objectives in your own database, or pre-processing input before incorporating the agent browse session.