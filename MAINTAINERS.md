## Deploying the package

- Change the version in `package.json` using semantic versioning. Add the version to `CHANGELOG.md` describing the release.
- Add a commit titled, eg. `release: 1.0.0` for the version and notes.
- Push the commit to remote and then run `git tag [version number]`, following it with `git push origin --tags`.
- We don't currently continously deploy. Until we do, you can then run `pnpm run build`, `npm publish --dry-run` to ensure it looks correct and `npm publish`.
