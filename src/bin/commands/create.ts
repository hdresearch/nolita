import { GluegunToolbox } from "gluegun";
import { simpleGit } from "simple-git";

module.exports = {
  name: "create",
  run: async (toolbox: GluegunToolbox) => {
    const { filesystem, prompt } = toolbox;

    const name = await prompt
      .ask({
        type: "input",
        name: "name",
        message: "What do you want to name this project?",
      })
      .then((answers) => answers.name);

    // Ensure the folder doesn't already exist
    if (filesystem.exists(name)) {
      return toolbox.print.error(`Folder ${name} already exists`);
    }

    // validate the name to ensure it's npm compatible
    if (!/^[a-z0-9-@]+$/.test(name)) {
      return toolbox.print.error(
        "Invalid folder name. Use @, lowercase, and dashes only."
      );
    }
    await simpleGit({
      baseDir: process.cwd(),
      binary: "git",
      maxConcurrentProcesses: 6,
    }).clone("git@github.com:hdresearch/create.git", name);
    filesystem.remove(`${name}/.git`);
  },
};
