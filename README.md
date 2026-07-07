# Running the React Project in `/web`

Follow these steps to run the React project located in the `/web` directory:

## Prerequisites

- Node.js (v18 or later recommended)
- npm (comes with Node.js) or yarn

## 1. Install Dependencies

Open a terminal and navigate to the `/web` directory:

```
cd codebase/deploy/front-end/web
```

Install the required packages:

Using npm:
```
npm install
```

Or using yarn:
```
yarn install
```

## 2. Start the Development Server

Using npm:

```
npm start
```

Or using yarn:

```
yarn start
```

This will start the development server. By default, the app will be available at [http://localhost:3000](http://localhost:3000).

## 3. Build for Production

To create an optimized production build:

Using npm:

```
npm run build
```

Or using yarn:

```
yarn build
```

The production-ready files will be in the `build/` directory.

## 4. Additional Tips

- To install a new package: `npm install <package>` or `yarn add <package>`
- To run tests: `npm test` or `yarn test`
- If you encounter issues, delete `node_modules` and `package-lock.json` (or `yarn.lock`), then reinstall dependencies.

---
