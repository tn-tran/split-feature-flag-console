import { deepmerge } from 'deepmerge-ts';
import { useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import { SPLIT_OVERRIDES } from '../application.config';
import { TreatmentsWithConfig } from '../types';
import { createAttributeMap, createFeaturesMap } from '../utils';

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
    return SPLIT_OVERRIDES ? createFeaturesMap(`?${SPLIT_OVERRIDES}`) : {};
  }, []);

  const getAlleTreatmentsWithOverrides = useCallback(
    (treatments: TreatmentsWithConfig) => {
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
