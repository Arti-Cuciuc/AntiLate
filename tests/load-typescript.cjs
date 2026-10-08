// Isolated loader: tests exercise production TypeScript without a native runtime.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

module.exports = function createLoader(mocks = {}) {
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (!path.extname(filename)) filename += '.ts';
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText;
    const localRequire = id => Object.hasOwn(mocks, id) ? mocks[id] :
      id.startsWith('.') ? load(path.resolve(path.dirname(filename), id)) : require(id);
    vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename })(localRequire, module, module.exports);
    return module.exports;
  }
  return load;
};
