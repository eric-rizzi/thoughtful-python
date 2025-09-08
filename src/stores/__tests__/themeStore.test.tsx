import { act } from "@testing-library/react";
import { useThemeStore } from "../themeStore";

describe("themeStore", () => {
  // Reset the store to its initial state before each test to ensure isolation
  beforeEach(() => {
    act(() => {
      useThemeStore.setState({ theme: "light" });
    });
  });

  it("should initialize with the 'light' theme by default", () => {
    // Get the initial state from the store
    const { theme } = useThemeStore.getState();
    // Assert that the initial theme is 'light'
    expect(theme).toBe("light");
  });

  it("should update the theme when the setTheme action is called", () => {
    // ACT: Call the setTheme action to change the theme to 'dark'
    act(() => {
      useThemeStore.getState().setTheme("dark");
    });

    // ASSERT: Check that the state has been updated
    expect(useThemeStore.getState().theme).toBe("dark");

    // ACT AGAIN: Change the theme to 'system'
    act(() => {
      useThemeStore.getState().setTheme("system");
    });

    // ASSERT AGAIN: Check the new state
    expect(useThemeStore.getState().theme).toBe("system");
  });
});
