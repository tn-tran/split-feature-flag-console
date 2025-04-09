import * as splitIOPackage from "@splitsoftware/splitio-react";
import { cleanup, renderHook } from "@testing-library/react";
import React, { PropsWithChildren, useContext } from "react";
import { MemoryRouter } from "react-router-dom";

import { useAlleTreatmentOverrides } from "../useAlleTreatmentOverrides";
import {
  TreatmentsWithConfig,
  TreatmentsWithConfigFromArrayType,
} from "../types";
import { useGetAlleTreatmentsWithConfig } from "./index";
import { SplitContext } from "@splitsoftware/splitio-react";
jest.mock("../useAlleTreatmentOverrides");

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

const mockUseAlleTreatmentOverrides =
  useAlleTreatmentOverrides as jest.MockedFunction<
    typeof useAlleTreatmentOverrides
  >;

const mockGetAlleTreatmentsWithOverrides = jest.fn<
  TreatmentsWithConfig,
  [TreatmentsWithConfig]
>();

const mockGetTreatmentsWithConfig = jest.fn<TreatmentsWithConfig, any>();

const mockClient = {
  getTreatmentsWithConfig: mockGetTreatmentsWithConfig,
};

// describe("useGetAlleTreatmentsWithConfig", () => {
//   mockUseAlleTreatmentOverrides.mockReturnValue({
//     treatmentAttributeOverrides: {},
//     getAlleTreatmentsWithOverrides: mockGetAlleTreatmentsWithOverrides,
//   });

//   afterEach(() => {
//     cleanup();
//   });

//   it("should render", () => {
//     const wrapper = ({ children }: PropsWithChildren<{}>) => {
//       return <MemoryRouter>{children}</MemoryRouter>;
//     };
//     renderHook(() => useGetAlleTreatmentsWithConfig(), { wrapper });
//   });

//   it("should call use split overrides with correct params", () => {
//     const wrapper = ({ children }: PropsWithChildren<{}>) => {
//       return <MemoryRouter>{children}</MemoryRouter>;
//     };
//     renderHook(
//       () => useGetAlleTreatmentsWithConfig({ enableOverrides: false }),
//       { wrapper }
//     );
//     expect(mockUseAlleTreatmentOverrides).toHaveBeenCalledWith({
//       enableOverrides: false,
//     });
//   });

//   it("should not call split if no client exists", () => {
//     const splitContext = useContext(SplitContext);

//     const wrapper = ({ children }: PropsWithChildren<{}>) => {
//       return (
//         <SplitContext.Provider value={{ client: null }}>
//           {/* <MemoryRouter>{children}</MemoryRouter> */}
//         </SplitContext.Provider>
//       );
//     };
//     const { result } = renderHook(() => useGetAlleTreatmentsWithConfig(), {
//       wrapper,
//     });
//     result.current.getAlleTreatmentsWithConfig({
//       splitNames: [],
//     });

//     expect(mockGetTreatmentsWithConfig).toHaveBeenCalledTimes(0);
//   });

//   it("should call split with correct params", () => {
//     const SplitContext = splitIOPackage.SplitContext as any;
//     const split_key = "split_key";
//     const attr_key_1 = "attr_key_1";
//     const attr_value_1 = "attr_value_1";
//     const attr_key_2 = "attr_key_2";
//     const attr_value_2 = "attr_value_2";

//     mockUseAlleTreatmentOverrides.mockReturnValueOnce({
//       treatmentAttributeOverrides: { [attr_key_1]: "attr_value_1" },
//       getAlleTreatmentsWithOverrides: mockGetAlleTreatmentsWithOverrides,
//     });

//     const wrapper = ({ children }: PropsWithChildren<{}>) => {
//       return (
//         <SplitContext.Provider value={{ client: mockClient }}>
//           {/* <MemoryRouter initialEntries={[`/?fa_${attr_key_1}=${attr_value_1}`]}>
//             {children}
//           </MemoryRouter> */}
//         </SplitContext.Provider>
//       );
//     };
//     const { result } = renderHook(
//       () =>
//         useGetAlleTreatmentsWithConfig({
//           key: split_key,
//           enableOverrides: false,
//         }),
//       { wrapper }
//     );

//     result.current.getAlleTreatmentsWithConfig({
//       splitNames,
//       attributes: { [attr_key_2]: attr_value_2 },
//     });
//     expect(mockGetTreatmentsWithConfig).toHaveBeenCalledWith(
//       split_key,
//       splitNames,
//       {
//         [attr_key_1]: attr_value_1,
//         [attr_key_2]: attr_value_2,
//       }
//     );
//   });

//   it("should call get treatments with overrides with correct params", () => {
//     const SplitContext = splitIOPackage.SplitContext as any;
//     mockGetTreatmentsWithConfig.mockReturnValueOnce(rawTreatments);

//     const wrapper = ({ children }: PropsWithChildren<{}>) => {
//       return (
//         <SplitContext.Provider value={{ client: mockClient }}>
//           {/* <MemoryRouter>{children}</MemoryRouter> */}
//         </SplitContext.Provider>
//       );
//     };
//     const { result } = renderHook(() => useGetAlleTreatmentsWithConfig(), {
//       wrapper,
//     });
//     result.current.getAlleTreatmentsWithConfig({
//       splitNames,
//     });
//     expect(mockGetAlleTreatmentsWithOverrides).toHaveBeenCalledWith(
//       rawTreatments
//     );
//   });
// });
