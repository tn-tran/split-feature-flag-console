import { createAttributeMap, createFeaturesMap } from './index';

describe('utils.ts', () => {
  describe('createFeaturesMap', () => {
    it('should return an object with 0 keys', () => {
      const features = createFeaturesMap('');

      const keys = Object.keys(features);

      expect(features).toBeDefined();
      expect(typeof features).toBe('object');
      expect(keys).toHaveLength(0);
    });

    it('should return a valid value', () => {
      const result = { key_1: { treatment: 'on' } };
      const features = createFeaturesMap('?ff_key_1=on');

      const keys = Object.keys(features);

      expect(typeof features).toBe('object');
      expect(features).toStrictEqual(result);
      expect(keys).toHaveLength(1);
      expect(keys).toContain('key_1');
    });
  });

  describe('createAttributeMap', () => {
    it('should return an object with 0 keys', () => {
      const features = createAttributeMap('');

      const keys = Object.keys(features);

      expect(features).toBeDefined();
      expect(typeof features).toBe('object');
      expect(keys).toHaveLength(0);
    });

    it('should return a valid attributes value', () => {
      const result = { attribute_1: 'green' };
      const attributes = createAttributeMap('?fa_attribute_1=green');

      const keys = Object.keys(attributes);

      expect(typeof attributes).toBe('object');
      expect(attributes).toStrictEqual(result);
      expect(keys).toHaveLength(1);
      expect(keys).toContain('attribute_1');
    });
  });
});
