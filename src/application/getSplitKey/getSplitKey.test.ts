import { mockLocalStorage } from '../testUtils/mockLocalStorage';
import { getSplitKey } from './getSplitKey';

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('getSplitKey', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should use the Segment ID in localStorage as splitKey if it exists', () => {
    //setup
    localStorage.setItem('ajs_anonymous_id', JSON.stringify('testSegmentId'));

    const splitKey = getSplitKey();
    expect(splitKey).toBe('testSegmentId');
    expect(localStorage.getItem('alle_anonymous_id')).toBeNull();
  });

  it('should generate a uuid to use as splitKey if cannot find segmentId, and set that key in localStorage', () => {
    const splitKey = getSplitKey();
    expect(splitKey.length).toBe(36);
    expect(localStorage.getItem('alle_anonymous_id')).toBeDefined();
  });
});
