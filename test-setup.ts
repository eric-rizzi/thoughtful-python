import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock the 'scrollIntoView' function for the JSDOM environment
// This is necessary for any component that uses refs to scroll to elements
Element.prototype.scrollIntoView = vi.fn();
