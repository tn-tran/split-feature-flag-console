import React from "react";
import { render } from "@testing-library/react";
import { SplitProvider } from "./SplitProvider";

describe("SplitProvider", () => {
  it("renders children within SplitFactory", () => {
    const { getByText } = render(
      <SplitProvider>
        <div>Test Child</div>
      </SplitProvider>
    );

    expect(getByText("Test Child")).toBeInTheDocument();
  });
});
