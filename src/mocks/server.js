import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// MSW (v1) server for Jest/RTL tests (Node environment). Lifecycle-wired from
// src/setupTests.js so every test file gets network mocking for free.
export const server = setupServer(...handlers);
