import { expect } from '@playwright/test';
import { z } from 'zod';

/**
 * Asserts that `data` matches `schema` and returns it typed.
 * On mismatch the test fails with the Zod issues in the message.
 */
export function expectToMatchSchema<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);

  expect(
    result.success,
    `Response does not match schema:\n${JSON.stringify(result.error?.issues, null, 2)}`,
  ).toBe(true);

  return result.data as z.infer<T>;
}