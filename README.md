# Injector

This package aims at injecting content (mostly code) into files at specific locations.

## Usage

```js
const inject = require('inject-code');

inject(
  // your content as a string
  'your_content',

  // opts
  {
    
    // path to file where to inject content
    into: '/path/to/dest/file',
    // OR content string containing tags
    intoStr: '...',

    // tags
    // insert between these two tags (this will remove anything that is written between them)
    between: {
      starttag: '// injectcode:start',
      endtag: '// endinjectcode'
    },
    // OR insert before this tag
    before: '// injectcode',
    // OR insert after this tag
    after: '// injectcode',

    // use synchronous api (default is false)
    sync: true,

    // content must be treated as code
    // using this option will preserve indentation for multilined content
    // (based on the indentation of the given tag, or starttag).
    // this is the default
    contentType: 'code',

    // detect new line parameter (crlf or lf) and automatically converts into result string.
    // if no new lines are found, 'lf' is the default.
    // this option is ignored if the contentType option is not 'code'.
    // values:
    // - 'auto' (auto detect)
    // - 'lf' or '\n' (unix style)
    // - 'crlf' or '\r\n' (windows style)
    newLine: 'auto'
  }
)
```

The `between` option takes precedence over the `before` option, which take precedence over the `after` option.

The `into` option takes precedence over the `intoStr` option.

## Return value

By default, the `inject` function is asynchronous and returns an ES6 Promise.

If you set the `sync` option to `true`, the function will use the node synchronous API and return `undefined` (or the final string if the `intoStr` option is specified instead).

Using the asynchronous API, the `resolve` function will be called with no argument if `into` is a valid file, or the result string ìf the `intoStr` option is specified instead.

## Errors

Using the synchronous API, errors will be thrown using `throw new Error()`.
Using the asynchronous API, errors will be sent to the `reject` method and you can catch them like you would with a simple Promise.
