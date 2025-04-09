const FEATURE_PREFIX = 'ff_';
const ATTRIBUTE_PREFIX = 'fa_';

const createFeaturesMap = (params: string): SplitIO.TreatmentsWithConfig => {
  return Array.from(new URLSearchParams(params).entries()).reduce(
    (acc, [key, value]) => {
      if (!key.startsWith(FEATURE_PREFIX)) {
        return { ...acc };
      }

      return {
        ...acc,
        [key.slice(3)]: { treatment: value },
      };
    },
    {}
  );
};

const createAttributeMap = (params: string): SplitIO.Attributes => {
  return Array.from(new URLSearchParams(params).entries()).reduce(
    (acc, [key, value]) => {
      if (!key.startsWith(ATTRIBUTE_PREFIX)) {
        return { ...acc };
      }

      return {
        ...acc,
        [key.slice(3)]: value,
      };
    },
    {}
  );
};
export { createFeaturesMap, createAttributeMap };