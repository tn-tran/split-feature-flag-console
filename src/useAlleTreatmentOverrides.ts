import { deepmerge } from 'deepmerge-ts';
import { useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { createFeaturesMap, createAttributeMap } from './utils';
export const splitOverrides = process.env.REACT_APP_SPLIT_OVERRIDES;

type useAlleTreatmentOverridesProps = {
  enableOverrides?: boolean;
};

const useAlleTreatmentOverrides = (props?: useAlleTreatmentOverridesProps) => {
  const enableOverrides = props?.enableOverrides ?? true;

  const location = useLocation();

  const queryFeatureKeys = useMemo(() => {
    return createFeaturesMap(location.search);
  }, [location.search]);

  const queryFeatureAttributes = useMemo(() => {
    return createAttributeMap(location.search);
  }, [location.search]);

  const envFeatureKeys = useMemo(() => {
    return splitOverrides ? createFeaturesMap(`?${splitOverrides}`) : {};
  }, []);

  const getAlleTreatmentsWithOverrides = useCallback(
    (treatments: SplitIO.TreatmentsWithConfig) => {
      return !enableOverrides
        ? treatments
        : deepmerge(treatments, {
            ...queryFeatureKeys,
            ...envFeatureKeys,
          });
    },
    [enableOverrides, queryFeatureKeys, envFeatureKeys]
  );

  return {
    treatmentAttributeOverrides: queryFeatureAttributes,
    getAlleTreatmentsWithOverrides,
  };
};

export { useAlleTreatmentOverrides };