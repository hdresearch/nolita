import fs from "fs";
import os from "os";
import path from "path";

const loadConfigFile = (filePath: string): any => {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      return {};
    }
  };
  
export const nolitarc = () => {
    try {
        const homeConfig = loadConfigFile(path.resolve(os.homedir(), ".nolitarc"));
        return homeConfig;
    }
    catch {
        return {};
    }
}