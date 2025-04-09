import * as splitIOPackage from "@splitsoftware/splitio-react";
import type SplitIO from "@splitsoftware/splitio-react/types";
import { cleanup, renderHook } from "@testing-library/react";
import React, { PropsWithChildren } from "react";
import { MemoryRouter } from "react-router-dom";

import { useAlleTreatmentOverrides } from "../useAlleTreatmentOverrides";
import {
  TreatmentsWithConfig,
  TreatmentsWithConfigFromArrayType,
} from "../types";
import { useAlleTreatments } from "./index";

const testKeys = {
  test_key_1: "test_key_1",
  test_key_2: "test_key_2",
} as const;

const splitNames = [testKeys.test_key_1, testKeys.test_key_2];
type SplitNames = typeof splitNames;

const rawTreatments: TreatmentsWithConfigFromArrayType<SplitNames> = {
  test_key_1: {
    config: null,
    treatment: "off",
  },
  test_key_2: {
    config: null,
    treatment: "off",
  },
};

jest.mock("../useAlleTreatmentOverrides");

const mockUseAlleTreatmentOverrides =
  useAlleTreatmentOverrides as jest.MockedFunction<
    typeof useAlleTreatmentOverrides
  >;

const mockGetAlleTreatmentsWithOverrides = jest.fn<
  TreatmentsWithConfig,
  [TreatmentsWithConfig]
>();

describe("useAlleTreatments", () => {
  mockUseAlleTreatmentOverrides.mockReturnValue({
    treatmentAttributeOverrides: {},
    getAlleTreatmentsWithOverrides: mockGetAlleTreatmentsWithOverrides,
  });
  let mockUseSplitTreatments: jest.SpyInstance<
    SplitIO.ISplitTreatmentsChildProps,
    [SplitIO.IUseSplitTreatmentsOptions]
  >;

  beforeEach(() => {
    mockUseSplitTreatments = jest.spyOn(splitIOPackage, "useSplitTreatments");
    mockUseSplitTreatments.mockReturnValue({
      treatments: {},
      factory: undefined,
      client: undefined,
      isReady: true,
      isReadyFromCache: true,
      isTimedout: false,
      hasTimedout: false,
      isDestroyed: false,
      lastUpdate: 1,
    });
    mockUseSplitTreatments.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("should render", () => {
    const wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <MemoryRouter>{children}</MemoryRouter>;
    };
    renderHook(() => useAlleTreatments({ splitNames: [] }), { wrapper });
  });

  it("should call use split overrides with correct params", () => {
    const wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <MemoryRouter>{children}</MemoryRouter>;
    };
    renderHook(
      () => useAlleTreatments({ enableOverrides: false, splitNames: [] }),
      { wrapper }
    );
    expect(mockUseAlleTreatmentOverrides).toHaveBeenCalledWith({
      enableOverrides: false,
    });
  });

  it("should call split with correct params", () => {
    const split_key = "split_key";
    const attr_key_1 = "attr_key_1";
    const attr_value_1 = "attr_value_1";
    const attr_key_2 = "attr_key_2";
    const attr_value_2 = "attr_value_2";

    mockUseAlleTreatmentOverrides.mockReturnValueOnce({
      treatmentAttributeOverrides: { [attr_key_1]: "attr_value_1" },
      getAlleTreatmentsWithOverrides: mockGetAlleTreatmentsWithOverrides,
    });

    const wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <MemoryRouter>{children}</MemoryRouter>;
    };
    renderHook(
      () =>
        useAlleTreatments({
          enableOverrides: true,
          attributes: { [attr_key_2]: attr_value_2 },
          key: split_key,
          splitNames,
        }),
      { wrapper }
    );

    expect(mockUseSplitTreatments).toBeCalledTimes(1);
    expect(mockUseSplitTreatments).toHaveBeenCalledWith({
      names: splitNames,
      attributes: {
        [attr_key_1]: attr_value_1,
        [attr_key_2]: attr_value_2,
      },
      splitKey: split_key,
    });
  });

  it("should call get treatments with overrides with correct params", () => {
    mockUseSplitTreatments.mockReturnValueOnce({
      treatments: rawTreatments,
      factory: undefined,
      client: undefined,
      isReady: true,
      isReadyFromCache: true,
      isTimedout: false,
      hasTimedout: false,
      isDestroyed: false,
      lastUpdate: 1,
    });

    const wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <MemoryRouter>{children}</MemoryRouter>;
    };
    renderHook(
      () =>
        useAlleTreatments({
          enableOverrides: false,
          splitNames: [],
        }),
      { wrapper }
    );
    expect(mockGetAlleTreatmentsWithOverrides).toHaveBeenCalledWith(
      rawTreatments
    );
  });
});
