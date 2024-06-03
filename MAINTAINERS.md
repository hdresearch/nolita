## Branches

We maintain two branches for Nolita:

- `main`, which reflects a stable release;
- `dev`, which is a bleeding-edge branch for upcoming releases.

Occasionally, with longer-lasting work like a major API change, we might maintain `dev` and `main` separately for a moment, as `main` will still require bug fixes and patches. `dev` should always contain the `main` tree.

When creating a PR, if in doubt, target `dev`.

If it's meant to be an urgent bug fix on `main`, target `main`, then after merging and releasing (see 'Deploying the package' below), 

```sh
git pull main
git checkout dev
git merge main
git push
```

`dev` is continually deployed as `nolita@alpha`. `main` gets tagged and deployed by hand.

## Preparing documentation changes

Documentation is deployed with [mdBook](https://github.com/rust-lang/mdBook). You can preview your changes by [installing it](https://rust-lang.github.io/mdBook/guide/installation.html) and running

```sh
cd docs
mdbook serve --open
```

Documentation should reflect the interfaces and methods of the branch it is on, not future or legacy changes.

## Deploying the npm package

- Change the version in `package.json` using semantic versioning. Add the version to `CHANGELOG.md` describing the release.
- Add a commit titled, eg. `release: 1.0.0` for the version and notes.
- Push the commit to remote and then run `git tag [version number]`, following it with `git push origin --tags`.
- We don't currently continously deploy. Until we do, you can then run `pnpm run build`, `npm publish --dry-run` to ensure it looks correct and `npm publish`.
