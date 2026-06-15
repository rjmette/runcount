import { createAwsBackend } from './awsBackend';

describe('createAwsBackend', () => {
  test('omits account update capabilities when no auth actions are provided', () => {
    const backend = createAwsBackend(vi.fn().mockResolvedValue('token'));

    expect(backend.updateEmail).toBeUndefined();
    expect(backend.updatePassword).toBeUndefined();
    expect(backend.requiresCurrentPasswordForPasswordUpdate).toBeUndefined();
  });

  test('exposes password update capability when password auth actions are provided', async () => {
    const updatePassword = vi.fn().mockResolvedValue(undefined);
    const backend = createAwsBackend(vi.fn().mockResolvedValue('token'), {
      updateEmail: vi.fn(),
      verifyEmailUpdate: vi.fn(),
      updatePassword,
    });

    await backend.updatePassword?.('NewStrongPass1!', 'CurrentPass1!');

    expect(backend.updateEmail).toBeDefined();
    expect(backend.requiresCurrentPasswordForPasswordUpdate).toBe(true);
    expect(updatePassword).toHaveBeenCalledWith('CurrentPass1!', 'NewStrongPass1!');
  });
});
