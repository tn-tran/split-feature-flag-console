import { SplitContext, useSplitClient } from "@splitsoftware/splitio-react";
import SplitIO from "@splitsoftware/splitio/types/splitio";
import { deepmerge } from "deepmerge-ts";
import { useCallback } from "react";

import { useAlleTreatmentOverrides } from "../useAlleTreatmentOverrides";
import { TreatmentsWithConfig } from "../types";

type useGetAlleTreatmentsWithConfigProps = {
  key?: SplitIO.SplitKey;
  enableOverrides?: boolean;
};

interface getTreatmentsWithConfigArgs<T extends string> {
  splitNames: T[];
  attributes?: SplitIO.Attributes;
}

const useGetAlleTreatmentsWithConfig = (
  props?: useGetAlleTreatmentsWithConfigProps
) => {
  const key = props?.key;
  const enableOverrides = props?.enableOverrides ?? true;

  const { treatmentAttributeOverrides, getAlleTreatmentsWithOverrides } =
    useAlleTreatmentOverrides({
      enableOverrides,
    });

  const { client } = useSplitClient();

  const getAlleTreatmentsWithConfig = useCallback(
    <T extends string>({
      splitNames,
      attributes,
    }: getTreatmentsWithConfigArgs<T>) => {
      let rawTreatments: TreatmentsWithConfig = {};
      if (client) {
        const splitClient = client as SplitIO.IBrowserClient;

        if (key) {
          rawTreatments = splitClient.getTreatmentsWithConfig(
            splitNames,
            deepmerge(attributes, treatmentAttributeOverrides)
          );
        } else {
          rawTreatments = splitClient.getTreatmentsWithConfig(
            splitNames,
            deepmerge(attributes, treatmentAttributeOverrides)
          );
        }
      }

      return getAlleTreatmentsWithOverrides(rawTreatments);
    },
    [key, treatmentAttributeOverrides, client, getAlleTreatmentsWithOverrides]
  );

  return {
    getAlleTreatmentsWithConfig,
  };
};

export { useGetAlleTreatmentsWithConfig };
