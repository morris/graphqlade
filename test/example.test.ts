import { GraphQLReader } from '../src';
import { requireExampleServer } from './util';

describe('The example', () => {
  let operations: string;
  let sdl: string;

  requireExampleServer();

  beforeAll(async () => {
    const reader = new GraphQLReader();
    operations = await reader.readDir(
      `${__dirname}/../examples/client/operations`,
    );
    sdl = await reader.readDir(`${__dirname}/../examples/server/schema`);
  });

  it('should run', async () => {
    const response = await fetch('http://localhost:4999/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: operations,
        operationName: 'Bosses',
      }),
    });

    const json = await response.json();

    expect(json).toEqual({
      data: {
        bosses: [
          {
            id: '1',
            location: {
              id: '11',
              name: 'Northern Undead Asylum',
            },
            name: 'Asylum Demon',
          },
          {
            id: '2',
            location: {
              id: '12',
              name: 'Undead Burg',
            },
            name: 'Taurus Demon',
          },
          {
            id: '3',
            location: {
              id: '13',
              name: 'Undead Parish',
            },
            name: 'Bell Gargoyles',
          },
        ],
      },
    });
  });

  it('should reject invalid queries', async () => {
    const response = await fetch('http://localhost:4999/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `{ invalid }`,
      }),
    });

    expect(response.status).toEqual(400);

    const json = await response.json();
    expect(json).toEqual({
      errors: [
        {
          locations: [
            {
              column: 3,
              line: 1,
            },
          ],
          message: 'Cannot query field "invalid" on type "Query".',
        },
      ],
    });
  });

  it('should respect @skip directives', async () => {
    const response = await fetch('http://localhost:4999/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: operations,
        operationName: 'Locations',
        variables: {
          skipBosses: true,
        },
      }),
    });

    const json = await response.json();

    expect(json).toEqual({
      data: {
        locations: [
          {
            id: '11',
            name: 'Northern Undead Asylum',
          },
          {
            id: '12',
            name: 'Undead Burg',
          },
          {
            id: '13',
            name: 'Undead Parish',
          },
        ],
      },
    });
  });

  it('should respect @skip directives (negative case)', async () => {
    const response = await fetch('http://localhost:4999/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: operations,
        operationName: 'Locations',
        variables: {
          skipBosses: false,
        },
      }),
    });

    const json = await response.json();

    expect(json).toEqual({
      data: {
        locations: [
          {
            id: '11',
            name: 'Northern Undead Asylum',
            bosses: [
              {
                id: '1',
                name: 'Asylum Demon',
              },
            ],
          },
          {
            id: '12',
            name: 'Undead Burg',
            bosses: [
              {
                id: '2',
                name: 'Taurus Demon',
              },
            ],
          },
          {
            id: '13',
            name: 'Undead Parish',
            bosses: [
              {
                id: '3',
                name: 'Bell Gargoyles',
              },
            ],
          },
        ],
      },
    });
  });

  it('should respect @include directives', async () => {
    const response = await fetch('http://localhost:4999/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: operations,
        operationName: 'Locations',
        variables: {
          includeReviews: true,
        },
      }),
    });

    const json = await response.json();

    expect(json).toEqual({
      data: {
        locations: [
          {
            id: '11',
            name: 'Northern Undead Asylum',
            bosses: [
              {
                id: '1',
                name: 'Asylum Demon',
                reviews: [
                  {
                    difficulty: 'OKAYISH',
                  },
                ],
              },
            ],
          },
          {
            id: '12',
            name: 'Undead Burg',
            bosses: [
              {
                id: '2',
                name: 'Taurus Demon',
                reviews: [],
              },
            ],
          },
          {
            id: '13',
            name: 'Undead Parish',
            bosses: [
              {
                id: '3',
                name: 'Bell Gargoyles',
                reviews: [],
              },
            ],
          },
        ],
      },
    });
  });

  it('should resolve SDL fields', async () => {
    const response = await fetch('http://localhost:4999/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: '{ _sdl _sdlVersion }',
      }),
    });

    const json = await response.json();

    expect(json).toEqual({
      data: {
        _sdl: sdl,
        _sdlVersion: '79b0cab0ba9ca035d10e57c2d739eace9be2a044',
      },
    });
  });

  it('should reject queries with more than 1000 tokens', async () => {
    const response = await fetch('http://localhost:4999/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `{ ${' x'.repeat(1000)} }`,
      }),
    });

    const json = await response.json();

    expect(json).toEqual({
      errors: [
        {
          locations: [
            {
              column: 2002,
              line: 1,
            },
          ],
          message:
            'Syntax Error: Document contains more that 1000 tokens. Parsing aborted.',
        },
      ],
    });
  });
});
