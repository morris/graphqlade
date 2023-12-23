import { GraphQLScalarType } from 'graphql';
import { GraphQLDate, GraphQLDateTime, GraphQLTime } from 'graphql-scalars';
import { Resolvers } from '../generated/schema';
import { MyContext } from '../MyContext';

export const scalarResolvers: Resolvers<MyContext> = {
  Date: GraphQLDate,
  Time: GraphQLTime,
  DateTime: GraphQLDateTime,
  ESNumber: new GraphQLScalarType<number, number | string>({
    name: 'ESNumber',
    serialize(value) {
      if (value === Number.NEGATIVE_INFINITY) return '-Infinity';
      if (value === Number.POSITIVE_INFINITY) return 'Infinity';
      if (typeof value === 'number' && isNaN(value)) return 'NaN';

      if (typeof value === 'string') {
        return parseFloat(value);
      }

      if (typeof value === 'number') {
        return value;
      }

      throw new Error(`Could not serialize ${value} to ESNumber`);
    },
    parseValue(value) {
      switch (value) {
        case 'Infinity':
          return Infinity;
        case '-Infinity':
          return -Infinity;
        case 'NaN':
          return NaN;
        default:
          if (typeof value === 'number') {
            return value;
          }

          if (typeof value === 'string') {
            return parseFloat(value);
          }

          throw new Error(`Could not parse ${value} to ESNumber`);
      }
    },
  }),
};
