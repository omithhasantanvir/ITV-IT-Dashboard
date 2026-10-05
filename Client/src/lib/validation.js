import { z } from 'zod';

// Client-side mirror of the rules the API enforces. This is a convenience for
// fast feedback, not a security control: the server still validates everything,
// and its message is what gets surfaced when it disagrees with this schema.
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(40, 'Username must be under 40 characters')
    .regex(
      /^[a-z0-9._-]+$/i,
      'Use letters, numbers, dots, hyphens or underscores only'
    ),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be under 128 characters'),
});

export default loginSchema;
