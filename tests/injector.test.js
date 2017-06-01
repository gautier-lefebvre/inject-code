'use strict';

const fs = require('fs-extra');
const path = require('path');
const injector = require('../src');

const content = `a: {\n  a: '1'\n}`;

const destBetween = `module.exports = {\n  // injector:start\n  // endinjector\n};`;
const destOneTag = `module.exports = {\n  // injector\n};`;

const betweenResult = `module.exports = {\n  // injector:start\n  a: {\n    a: '1'\n  }\n  // endinjector\n};`;
const beforeResult = `module.exports = {\n  a: {\n    a: '1'\n  }\n  // injector\n};`;
const afterResult = `module.exports = {\n  // injector\n  a: {\n    a: '1'\n  }\n};`;

const initFiles = () => {
  return fs.copy(path.join(__dirname, 'after.sample.js'), path.join(__dirname, 'after.js'))
    .then(() => fs.copy(path.join(__dirname, 'before.sample.js'), path.join(__dirname, 'before.js')))
    .then(() => fs.copy(path.join(__dirname, 'between.sample.js'), path.join(__dirname, 'between.js')));
};

beforeAll(initFiles);

describe('inject between', () => {
  test('inject into string sync', () => {
    expect(injector(content, {
      intoStr: destBetween,
      between: {
        starttag: '// injector:start',
        endtag: '// endinjector'
      },
      sync: true
    })).toBe(betweenResult);
  });

  test('inject into string async', () => {
    return injector(content, {
      intoStr: destBetween,
      between: {
        starttag: '// injector:start',
        endtag: '// endinjector'
      },
    }).then(result => expect(result).toBe(betweenResult));
  });

  test('inject into file sync', () => {
    injector(content, {
      into: path.join(__dirname, 'between.js'),
      between: {
        starttag: '// injector:start',
        endtag: '// endinjector'
      },
      sync: true
    });

    expect(fs.readFileSync(path.join(__dirname, 'between.js'), 'utf8')).toBe(fs.readFileSync(path.join(__dirname, 'between.result.js'), 'utf8'));

    return initFiles();
  });

  test('inject into file async', () => {
    return injector(content, {
      into: path.join(__dirname, 'between.js'),
      between: {
        starttag: '// injector:start',
        endtag: '// endinjector'
      }
    })
    .then(() => {
      expect(fs.readFileSync(path.join(__dirname, 'between.js'), 'utf8')).toBe(fs.readFileSync(path.join(__dirname, 'between.result.js'), 'utf8'));
    });

  });
});

describe('inject before', () => {
  test('inject into string sync', () => {
    expect(injector(content, {
      intoStr: destOneTag,
      before: '// injector',
      sync: true
    })).toBe(beforeResult);
  });

  test('inject into string async', () => {
    return injector(content, {
      intoStr: destOneTag,
      before: '// injector'
    }).then(result => expect(result).toBe(beforeResult));
  });

  test('inject into file sync', () => {
    injector(content, {
      into: path.join(__dirname, 'before.js'),
      before: '// injector',
      sync: true
    });

    expect(fs.readFileSync(path.join(__dirname, 'before.js'), 'utf8')).toBe(fs.readFileSync(path.join(__dirname, 'before.result.js'), 'utf8'));

    return initFiles();
  });

  test('inject into file async', () => {
    return injector(content, {
      into: path.join(__dirname, 'before.js'),
      before: '// injector'
    })
    .then(() => {
      expect(fs.readFileSync(path.join(__dirname, 'before.js'), 'utf8')).toBe(fs.readFileSync(path.join(__dirname, 'before.result.js'), 'utf8'));
    });

  });
});

describe('inject after', () => {
  test('inject into string sync', () => {
    expect(injector(content, {
      intoStr: destOneTag,
      after: '// injector',
      sync: true
    })).toBe(afterResult);
  });

  test('inject into string async', () => {
    return injector(content, {
      intoStr: destOneTag,
      after: '// injector'
    }).then(result => expect(result).toBe(afterResult));
  });

  test('inject into file sync', () => {
    injector(content, {
      into: path.join(__dirname, 'after.js'),
      after: '// injector',
      sync: true
    });

    expect(fs.readFileSync(path.join(__dirname, 'after.js'), 'utf8')).toBe(fs.readFileSync(path.join(__dirname, 'after.result.js'), 'utf8'));

    return initFiles();
  });

  test('inject into file async', () => {
    return injector(content, {
      into: path.join(__dirname, 'after.js'),
      after: '// injector'
    })
    .then(() => {
      expect(fs.readFileSync(path.join(__dirname, 'after.js'), 'utf8')).toBe(fs.readFileSync(path.join(__dirname, 'after.result.js'), 'utf8'));
    });
  });
});
