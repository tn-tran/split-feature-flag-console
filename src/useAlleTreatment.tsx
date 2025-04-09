import { useSplitTreatments } from '@splitsoftware/splitio-react';
import SplitIO from '@splitsoftware/splitio/types/splitio';
import { deepmerge } from 'deepmerge-ts';

import { useAlleTreatmentOverrides } from './useAlleTreatmentOverrides';
// import { TreatmentsWithConfig } from '../types';

interface useAlleTreatmentsProps<T extends string> {
  splitNames: T[];
  attributes?: SplitIO.Attributes;
  key?: SplitIO.SplitKey;
  enableOverrides?: boolean;
}

const useAlleTreatments = <T extends string>({
  splitNames,
  attributes,
  key,
  enableOverrides = true,
}: useAlleTreatmentsProps<T>): SplitIO.TreatmentsWithConfig => {
  const { treatmentAttributeOverrides, getAlleTreatmentsWithOverrides } =
    useAlleTreatmentOverrides({
      enableOverrides,
    });

  const splitContextWithTreatments = useSplitTreatments({
    names: splitNames,
    attributes: deepmerge(attributes, treatmentAttributeOverrides),
    splitKey: key,
  });

  if (process.env.REACT_APP_SPLIT_DEBUGGER === 'enabled') {
    console.log(
      `%cSplit treatments fetched with splitKey: ${
        //@ts-ignore
        splitContextWithTreatments.client?.key
      }`,
      'color:red;font-family:system-ui;font-size:1rem;-webkit-text-stroke: 1px black;font-weight:bold'
    );
    console.table(splitContextWithTreatments.treatments);
  }

  const rawTreatments: SplitIO.TreatmentsWithConfig =
    splitContextWithTreatments.treatments;

  return getAlleTreatmentsWithOverrides(rawTreatments);
};

export { useAlleTreatments };
