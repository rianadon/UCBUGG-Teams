# UCBUGG Team Selection

A website for generating possible team assignments for the [http://ucbugg.com](UCBUGG) 3D Animation class at UC Berkeley.

It's built with [Svelte](https://svelte.dev/) and [Bulma](https://bulma.io/). Svelte has a concise tutorial on [their website](https://svelte.dev/tutorial/basics), and Bulma's website serves as a great reference of all the components.

Relevant files in this repository are:
- `index.html`: The page's top-level HTML, which includes icons and other metadata.
- `src/App.svelte`: The main component that handles parsing CSV files.
- `src/lib/Team.svelte`: The component that displays all students and their team preferences.
- `src/lib/Optimizer.svelte`: The component that handles configuring optimization parameters.
- `src/lib/AssignmentTable.svelte`: A component that shows an assignment of teams and the students in each team.
- `src/lib/optimize.ts`: Contains functions for running the optimizer and parsing results.
- `src/lib/util.ts`: Small functions used across the codebase.

To get started developing, install [Node.js](https://nodejs.org/en/), clone the repository, then run:
- `npm install` (installs dependencies)
- `npm run dev` (will build the website and refresh automatically when you change files)

The remainder of this README is contains relevant sections from the Svelte + TS + Vite template.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

**Why is HMR not preserving my local component state?**

HMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/rixo/svelte-hmr#svelte-hmr).

If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

```ts
// store.ts
// An extremely simple external store
import { writable } from 'svelte/store'
export default writable(0)
```
