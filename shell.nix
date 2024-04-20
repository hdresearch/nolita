{ pkgs ? import <nixpkgs> {
    config.allowUnfree = true;
} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs
    pkgs.google-chrome
  ];

  shellHook = ''
    export NODE_PATH="${pkgs.nodejs}/lib/node_modules"
    export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
    export CHROME_PATH=$(which google-chrome-stable)
  '';
}
