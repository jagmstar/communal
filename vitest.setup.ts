// Vitest setup for the jsdom (component) test project.
// Registers @testing-library/jest-dom matchers (toBeInTheDocument, toBeDisabled, …)
// and ensures the DOM is cleaned up between tests.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
