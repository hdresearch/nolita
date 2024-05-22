# /app

The `/app` folder bootstraps a starter front-end application built on TypeScript and React with [Vite](https://vitejs.dev/) as its development server and build pipeline, and [Tailwind](https://tailwindcss.com/) as its CSS framework.

The sample application

- searches a query on the internet ("`where to get food in...`");
- returns each step of its navigation for your reference;
- and finally returns with typed data, as defined in the [/extensions](./extensions.md) folder.

## Removing the application

If you want to bootstrap a Nolita application without a front-end, you can remove the `app` folder and the remaining calls to its build process.

In `package.json`, amend the scripts to

```json
"scripts": {
    "server": "npx tsx ./server/index.ts",
    "start": "NODE_ENV=production npm run server"
  },
```

and in `/server/index.ts`, remove this remaining call to front-end code:

```ts
if (process.env.NODE_ENV === "production") {
   app.use("/", express.static(path.join(__dirname, "../app/dist")));
 }
```