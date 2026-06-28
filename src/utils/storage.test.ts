import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SCHEMA_VERSION,
  isFiniteNumber,
  isNullableFiniteNumber,
  isNumberRecord,
  isString,
  isStringArray,
  readValidated,
  safeGet,
  safeRemove,
  safeSet,
  writeValidated,
} from './storage';

describe('storage primitive guards', () => {
  it('isString', () => {
    expect(isString('x')).toBe(true);
    expect(isString(1)).toBe(false);
    expect(isString(null)).toBe(false);
  });

  it('isFiniteNumber rejects NaN/Infinity/strings', () => {
    expect(isFiniteNumber(3)).toBe(true);
    expect(isFiniteNumber(NaN)).toBe(false);
    expect(isFiniteNumber(Infinity)).toBe(false);
    expect(isFiniteNumber('3')).toBe(false);
  });

  it('isNullableFiniteNumber accepts null and finite numbers', () => {
    expect(isNullableFiniteNumber(null)).toBe(true);
    expect(isNullableFiniteNumber(60)).toBe(true);
    expect(isNullableFiniteNumber(undefined)).toBe(false);
    expect(isNullableFiniteNumber('x')).toBe(false);
  });

  it('isStringArray', () => {
    expect(isStringArray([])).toBe(true);
    expect(isStringArray(['a', 'b'])).toBe(true);
    expect(isStringArray(['a', 1])).toBe(false);
    expect(isStringArray('a')).toBe(false);
  });

  it('isNumberRecord', () => {
    expect(isNumberRecord({})).toBe(true);
    expect(isNumberRecord({ a: 1, b: 2 })).toBe(true);
    expect(isNumberRecord({ a: '1' })).toBe(false);
    expect(isNumberRecord([1, 2])).toBe(false);
    expect(isNumberRecord(null)).toBe(false);
  });
});

describe('safeGet / safeSet / safeRemove', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a raw string', () => {
    expect(safeSet('k', 'v')).toBe(true);
    expect(safeGet('k')).toBe('v');
    safeRemove('k');
    expect(safeGet('k')).toBeNull();
  });

  it('returns null/false instead of throwing when storage throws', () => {
    const getSpy = vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const setSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(safeGet('k')).toBeNull();
    expect(safeSet('k', 'v')).toBe(false);

    getSpy.mockRestore();
    setSpy.mockRestore();
    warn.mockRestore();
  });
});

describe('readValidated / writeValidated', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('round-trips a valid value through the versioned envelope', () => {
    writeValidated('nums', [1, 2, 3]);
    const raw = JSON.parse(localStorage.getItem('nums') as string);
    expect(raw).toEqual({ v: SCHEMA_VERSION, data: [1, 2, 3] });

    const result = readValidated(
      'nums',
      (v): v is number[] => Array.isArray(v) && v.every((n) => typeof n === 'number'),
      [],
    );
    expect(result).toEqual([1, 2, 3]);
  });

  it('returns the fallback when the key is missing', () => {
    expect(readValidated('missing', isStringArray, ['default'])).toEqual(['default']);
  });

  it('clears and falls back on malformed JSON', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('bad', '{not json');

    expect(readValidated('bad', isStringArray, [])).toEqual([]);
    expect(localStorage.getItem('bad')).toBeNull(); // auto-cleared
    warn.mockRestore();
  });

  it('clears and falls back when the data fails the guard', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    writeValidated('wrong', { not: 'an array' });

    expect(readValidated('wrong', isStringArray, ['fallback'])).toEqual(['fallback']);
    expect(localStorage.getItem('wrong')).toBeNull();
    warn.mockRestore();
  });

  it('reads legacy (unversioned) data and validates it directly', () => {
    // Pre-envelope value written by old code.
    localStorage.setItem('legacy', JSON.stringify(['a', 'b']));
    expect(readValidated('legacy', isStringArray, [])).toEqual(['a', 'b']);
  });

  it('treats a stored null as a valid value, not a missing key', () => {
    writeValidated('clock', null);
    expect(readValidated('clock', isNullableFiniteNumber, 60)).toBeNull();
  });

  it('applies a migrator for older versions', () => {
    // Legacy data missing a field; migrator backfills it.
    localStorage.setItem('mig', JSON.stringify({ name: 'x' }));
    const guard = (v: unknown): v is { name: string; count: number } =>
      typeof v === 'object' &&
      v !== null &&
      typeof (v as { name: unknown }).name === 'string' &&
      typeof (v as { count: unknown }).count === 'number';

    const result = readValidated('mig', guard, { name: '', count: 0 }, (from, data) => {
      if (from < SCHEMA_VERSION) {
        return { ...(data as object), count: 1 };
      }
      return data;
    });
    expect(result).toEqual({ name: 'x', count: 1 });
  });

  it('clears and falls back when migration throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('throws', JSON.stringify({ a: 1 }));

    const result = readValidated('throws', isNumberRecord, { z: 0 }, () => {
      throw new Error('boom');
    });
    expect(result).toEqual({ z: 0 });
    expect(localStorage.getItem('throws')).toBeNull();
    warn.mockRestore();
  });
});
