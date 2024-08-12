import fs from 'fs';
import path from 'path';
import { input } from '@inquirer/prompts';
import { simpleGit } from 'simple-git';
import { execSync } from 'child_process';

export const command = 'create';
export const desc = 'Create a new project';

export const handler = async () => {
  const name = await input({
    message: 'Enter the name of your project',
    validate: (input: string) => {
      if (!input) {
        return 'Project name is required';
      }
      return true
    }
  });

  // Ensure the folder doesn't already exist
  if (fs.existsSync(name)) {
    console.error(`Folder ${name} already exists`);
    return;
  }

  // validate the name to ensure it's npm compatible
  if (!/^[a-z0-9-@]+$/.test(name)) {
    console.error('Invalid folder name. Use @, lowercase, and dashes only.');
    return;
  }

  const git = simpleGit({
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
  });

  try {
    await git.clone('https://github.com/hdresearch/create.git', name);
    fs.rmSync(`${name}/.git`, { recursive: true, force: true });
    fs.unlinkSync(`${name}/LICENSE`);
    fs.renameSync(
      `${name}/extensions/.inventory.example`,
      `${name}/extensions/.inventory`
    );
    
    console.log(`Created ${name} project`);
    
    execSync(`cd ${name} && npm install`, { stdio: 'inherit' });
    
    await git.cwd(path.join(process.cwd(), name)).init();
    await git.add('.');
    await git.commit('Initial commit');
    
    console.log(`Your project is ready! Get started in the ${name} directory.`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
};