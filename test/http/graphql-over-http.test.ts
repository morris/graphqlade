import { AuditFail, auditServer } from 'graphql-http';
import { requireExampleServer } from '../util';

describe('The GraphQL over HTTP audit', () => {
  const ready = requireExampleServer();

  const ACCEPTED_WARNINGS = [
    // GraphQLade responds with status code 400 if the GraphQL request
    // could not be parsed or validated, even when using application/json.
    // The following four warnings are accepted.
    '22EB',
    '572B',
    'FDE2',
    '7B9B',
  ];

  it('passes', async () => {
    const { url } = await ready;

    const results = await auditServer({ url });

    expect(
      results
        .filter((it): it is AuditFail => it.status === 'error')
        .map((it) => [it.id, it.name, it.reason]),
    ).toEqual([]);

    expect(
      results
        .filter((it): it is AuditFail => it.status === 'warn')
        .filter((it) => !ACCEPTED_WARNINGS.includes(it.id))
        .map((it) => ({
          ...it,
          response: {
            status: it.response.status,
            headers: Object.fromEntries(it.response.headers.entries()),
          },
        })),
    ).toEqual([]);
  });
});
