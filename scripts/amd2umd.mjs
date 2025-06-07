/* globals process console Buffer */
/* eslint-disable no-console */

// TODO support source maps

export function runAmdToUmd() {
  const rootModule = process.argv[2];
  const globalName = process.argv[3];
  const chunks = [];

  process.stdin.on('data', (data) => chunks.push(data));
  process.stdin.on('end', () => {
    const buffer = Buffer.concat(chunks);
    console.log(amdToUmd(buffer.toString(), rootModule, globalName));
    process.exit(0);
  });
  process.stdin.on('error', (err) => {
    console.error(err.stack);
    process.exit(1);
  });
}

export function amdToUmd(amdCode, rootModule, globalName) {
  return `(function (root, factory) {
    var definitions = {};

    function staticDefine(id, dependencies, factory) {
      definitions[id] = {
        id: id,
        dependencies: dependencies,
        factory: factory,
        exports: {},
        loaded: false
      };
    }

    function staticRequire(id) {
      var definition = definitions[id];

      if (!definition) throw new Error('Undefined module ' + id);
      if (!definition.loaded) {
        definition.loaded = true;

        try {
          var returnExports = definition.factory.apply(
            undefined,
            definition.dependencies.map(function (id) {
              switch (id) {
                case "require":
                  return staticRequire;
                case "exports":
                  return definition.exports;
                case "module":
                  return definition;
                default:
                  return staticRequire(id);
              }
            })
          );
        } catch (err) {
          definition.loaded = false;
          throw err;
        }

        if (returnExports) definition.exports = returnExports;
      }

      return definition.exports;
    }

    if (typeof define === "function" && define.amd) {
      factory(define);
    } else if (typeof exports === "object" && typeof exports.nodeName !== "string") {
      factory(staticDefine);
      Object.assign(exports, staticRequire("${rootModule}"));
    } else {
      factory(staticDefine);
      root.${globalName} = staticRequire("${rootModule}");
    }
  }(typeof self !== "undefined" ? self : this, function (define) {
${stripSourceMap(amdCode)}
  }));`;
}

function stripSourceMap(code) {
  return code.replace(/\/\/# sourceMappingURL=[^\r\n]*/, '');
}

//

import { pathToFileURL } from 'url';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runAmdToUmd();
}
