import * as chromePaths from "chrome-paths";
import PuppeteerExtra from "puppeteer-extra";
import puppeteer, {
  Browser as PuppeteerBrowser,
  KnownDevices,
} from "puppeteer";
import { BROWSER_LAUNCH_ARGS } from "./browserDefaults";

export const getChromePath = (): string | undefined => {
  let chromePath;
  if (process.env.CHROME_PATH) {
    chromePath = process.env.CHROME_PATH;
  } else {
    chromePath = chromePaths.chrome;
  }
  return chromePath;
};

export const browserContext = async (
  headless: boolean,
  browserWSEndpoint?: string,
  browserLaunchArgs: string[] = BROWSER_LAUNCH_ARGS
) => {
  let browser: PuppeteerBrowser;
  if (browserWSEndpoint) {
    browser = await puppeteer.connect({
      browserWSEndpoint,
    });
  } else {
    browser = await PuppeteerExtra.launch({
      headless: headless,
      executablePath: getChromePath(),
      args: browserLaunchArgs,
    });
  }
  return browser;
};

export const randomDevice = (deviceName?: string) => {
  if (deviceName) {
    const device = (
      Object.keys(KnownDevices) as Array<keyof typeof KnownDevices>
    ).find((device) => device.toLowerCase() === deviceName.toLowerCase());
    if (device) {
      return KnownDevices[device];
    }
  }
  // these guys are expensive + new-ish
  const selectedDevices: string[] = [
    "iPhone 13 Pro Max",
    "iPhone 13 Pro Max landscape",
    "iPhone 13 Pro",
    "iPhone 13 Pro landscape",
    "iPhone 13",
    "iPhone 13 landscape",
    "iPhone 13 Mini",
    "iPhone 13 Mini landscape",
    "iPhone 12 Pro Max",
    "iPhone 12 Pro Max landscape",
    "iPhone 12 Pro",
    "iPhone 12 Pro landscape",
    "iPhone 12",
    "iPhone 12 landscape",
    "iPhone 12 Mini",
    "Galaxy S21 Ultra",
    "Galaxy S21 Ultra landscape",
    "Galaxy S21+",
    "Galaxy S21+ landscape",
    "Galaxy S21",
    "Galaxy S21 landscape",
    "Pixel 5",
    "Pixel 5 landscape",
    "Galaxy Note 20 Ultra",
    "Galaxy Note 20 Ultra landscape",
  ];
  const randomIndex = Math.floor(Math.random() * selectedDevices.length);
  const device = selectedDevices[randomIndex];

  return KnownDevices[device as keyof typeof KnownDevices];
};
