import type { SendEmailCommand } from '@aws-sdk/client-sesv2';
import { describe, expect, it } from 'vitest';
import { createSesEmailTransport } from './transports.js';

describe('SES transport', () => {
  it('sends a UTF-8 text email from the configured sender', async () => {
    const commands: SendEmailCommand[] = [];
    const transport = createSesEmailTransport({
      region: 'ap-south-1',
      from: 'IBC <no-reply@mail.example>',
      configurationSet: 'ibc-transactional',
      client: {
        send: async (command) => {
          commands.push(command);
          return { MessageId: 'ses-123' };
        },
      },
    });
    const result = await transport.send({
      to: 'priya@example.com',
      template: 'identity.verify_email',
      locale: 'en',
      subject: 'Verify your email',
      textBody: 'Hello ₹ नमस्ते',
    });
    expect(result.messageId).toBe('ses-123');
    expect(commands[0]!.input).toMatchObject({
      FromEmailAddress: 'IBC <no-reply@mail.example>',
      Destination: { ToAddresses: ['priya@example.com'] },
      ConfigurationSetName: 'ibc-transactional',
      Content: { Simple: { Body: { Text: { Data: 'Hello ₹ नमस्ते', Charset: 'UTF-8' } } } },
    });
  });

  it('propagates provider errors so the relay can retry', async () => {
    const transport = createSesEmailTransport({
      region: 'ap-south-1',
      from: 'no-reply@mail.example',
      client: { send: () => Promise.reject(new Error('Throttling')) },
    });
    await expect(
      transport.send({ to: 'a@b.co', template: 't', locale: 'en', subject: 's', textBody: 'b' }),
    ).rejects.toThrow('Throttling');
  });
});
