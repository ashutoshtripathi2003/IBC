import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import type { FastifyBaseLogger } from 'fastify';
import type { EmailTransport } from './email.js';

/**
 * Development transport: writes the message to the log so links can be followed
 * locally. Configuration forbids it in production because bodies contain tokens.
 */
export function createLogEmailTransport(logger: FastifyBaseLogger): EmailTransport {
  return {
    send: async (message) => {
      logger.info(
        { email: { template: message.template, subject: message.subject, body: message.textBody } },
        'email (log transport, not delivered)',
      );
      return { messageId: null };
    },
  };
}

/** Minimal surface of the SES client, so tests can substitute a fake. */
export interface SesClientLike {
  send(command: SendEmailCommand): Promise<{ MessageId?: string | undefined }>;
}

/**
 * Amazon SES (v2) transport. Credentials come from the default AWS provider chain
 * (IAM role on the workload) — never from application configuration.
 */
export function createSesEmailTransport(options: {
  region: string;
  from: string;
  configurationSet?: string | undefined;
  client?: SesClientLike;
}): EmailTransport {
  const client: SesClientLike = options.client ?? new SESv2Client({ region: options.region });
  return {
    send: async (message) => {
      const response = await client.send(
        new SendEmailCommand({
          FromEmailAddress: options.from,
          Destination: { ToAddresses: [message.to] },
          Content: {
            Simple: {
              Subject: { Data: message.subject, Charset: 'UTF-8' },
              Body: { Text: { Data: message.textBody, Charset: 'UTF-8' } },
            },
          },
          ...(options.configurationSet ? { ConfigurationSetName: options.configurationSet } : {}),
          EmailTags: [{ Name: 'template', Value: message.template }],
        }),
      );
      return { messageId: response.MessageId ?? null };
    },
  };
}
