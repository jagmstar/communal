import { defineConfig } from "vitest/config";
import { resolve } from "path";

// Two test projects (ticket #2, AC-1):
//   - "node": the pre-existing pure-function / API-route tests (*.test.ts) in a node env.
//   - "dom":  React component tests (*.test.tsx) rendered with @testing-library/react in jsdom.
//
// Both projects are scoped to src/**. The qa/** directories hold historical, point-in-time
// QA kill-test artifacts that are deliberately pinned to the behavior of specific past
// commits (some intentionally fail on later code, e.g. qa/ticket-1-rerun-killtests asserts
// the PARENT commit's buggy behavior). They are already excluded from tsc (tsconfig.json)
// and from CI (`vitest run src`); excluding them from default discovery keeps
// `npx vitest run` green (AC-5). Run them explicitly with `npx vitest run qa/<dir>` if needed.
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    globals: false,
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
