import React, { PropsWithChildren } from 'react';
import { cleanup, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TreatmentsWithConfigFromArrayType } from '../types';
import * as applicationConfigModule from '../application.config';
import { useAlleTreatmentOverrides } from './index';

const testKeys = {
  test_key_1: 'test_key_1',
  test_key_2: 'test_key_2',
} as const;

const splitNames = [testKeys.test_key_1, testKeys.test_key_2];
type SplitNames = typeof splitNames;

const rawTreatments: TreatmentsWithConfigFromArrayType<SplitNames> = {
  test_key_1: {
    config: null,
    treatment: 'off',
  },
  test_key_2: {
    config: null,
    treatment: 'off',
  },
};

const overriddenTreatments: TreatmentsWithConfigFromArrayType<SplitNames> = {
  test_key_1: {
    config: null,
    treatment: 'on',
  },
  test_key_2: {
    config: null,
    treatment: 'off',
  },
};

describe('useAlleTreatmentsOverrides', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render', () => {
    const wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <MemoryRouter>{children}</MemoryRouter>;
    };
    renderHook(() => useAlleTreatmentOverrides(), { wrapper });
  });

  it('should return treatment attribute overrides', () => {
    const key = 'attr_key';
    const value = 'attr_value';

    const wrapper = ({ children }: PropsWithChildren<{}>) => {
      return (
        <MemoryRouter initialEntries={[`/?fa_${key}=${value}`]}>
          {children}
        </MemoryRouter>
      );
    };
    const { result } = renderHook(() => useAlleTreatmentOverrides(), {
      wrapper,
    });
    expect(result.current.treatmentAttributeOverrides[key]).toBe(value);
  });

  it('should return the raw treatments when no overrides exist', () => {
    const wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <MemoryRouter>{children}</MemoryRouter>;
    };
    const { result } = renderHook(() => useAlleTreatmentOverrides(), {
      wrapper,
    });
    const treatments =
      result.current.getAlleTreatmentsWithOverrides(rawTreatments);
    expect(treatments).toMatchObject(rawTreatments);
  });

  it('should return the overridden treatments when query overrides exist', () => {
    const wrapper = ({ children }: PropsWithChildren<{}>) => {
      return (
        <MemoryRouter initialEntries={[`/?ff_${testKeys.test_key_1}=on`]}>
          {children}
        </MemoryRouter>
      );
    };
    const { result } = renderHook(() => useAlleTreatmentOverrides(), {
      wrapper,
    });
    const treatments =
      result.current.getAlleTreatmentsWithOverrides(rawTreatments);
    expect(treatments).toMatchObject(overriddenTreatments);
  });

  it('should return the overridden treatments when env overrides exist', () => {
    const prevApplicationModule = { ...applicationConfigModule };
    Object.defineProperty(applicationConfigModule, 'SPLIT_OVERRIDES', {
      value: `ff_${testKeys.test_key_1}=on`,
    });

    const wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <MemoryRouter>{children}</MemoryRouter>;
    };
    const { result } = renderHook(() => useAlleTreatmentOverrides(), {
      wrapper,
    });
    const treatments =
      result.current.getAlleTreatmentsWithOverrides(rawTreatments);
    expect(treatments).toMatchObject(overriddenTreatments);

    Object.defineProperty(applicationConfigModule, 'SPLIT_OVERRIDES', {
      value: prevApplicationModule.SPLIT_OVERRIDES,
    });
  });

  it('should return raw treatments when overrides disabled', () => {
    const prevApplicationModule = { ...applicationConfigModule };
    Object.defineProperty(applicationConfigModule, 'SPLIT_OVERRIDES', {
      value: `ff_${testKeys.test_key_1}=on`,
    });

    const wrapper = ({ children }: PropsWithChildren<{}>) => {
      return (
        <MemoryRouter initialEntries={[`/?ff_${testKeys.test_key_1}=on`]}>
          {children}
        </MemoryRouter>
      );
    };
    const { result } = renderHook(
      () => useAlleTreatmentOverrides({ enableOverrides: false }),
      { wrapper }
    );
    const treatments =
      result.current.getAlleTreatmentsWithOverrides(rawTreatments);
    expect(treatments).toMatchObject(rawTreatments);

    Object.defineProperty(applicationConfigModule, 'SPLIT_OVERRIDES', {
      value: prevApplicationModule.SPLIT_OVERRIDES,
    });
  });
});
