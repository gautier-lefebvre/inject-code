'use strict';

const fs = require('fs');
const path = require('path');

const includes = require('lodash.includes');
const times = require('lodash.times');
const map = require('lodash.map');
const merge = require('lodash.merge');
const findIndex = require('lodash.findindex');

/**
 *  Given the value of opt, returns the new line character.
 *  If opt is 'auto', returns '\r\n' if any is found in the given string, else '\n'.
 *  If opt is 'crlf' or '\r\n', returns '\r\n'.
 *  In any other case, returns '\n'.
 *
 *  @param opt - {String}
 *  @param content - {String} - the string to infer new line character from
 */
function getNewLineChar(opt, content) {
  switch (opt) {
    case 'auto':
      return content.indexOf('\r\n') < 0 ? '\n' : '\r\n';
    case 'crlf':
    case '\r\n':
      return '\r\n';
    case 'lf':
    case '\n':
    default:
      return '\n';
  }
}

/**
 *  Replaces every occurrences of new line characters in the content
 *  with the given new line character.
 *
 *  @param newLineChar - String - '\n' or '\r\n'
 *  @param content - String - the content to replace
 */
function replaceNewLineChars(newLineChar, content) {
  // replace new line characters
  switch (newLineChar) {
    case '\n':
      return content.replace(new RegExp('\r\n', 'g'), '\n');
    case '\r\n':
      return content.replace(new RegExp('\r\n', 'g'), '\n').replace(new RegExp('\n', 'g'), '\r\n');
  }
}

/**
 *  Given the line of the tag, returns the current indentation as a number of spaces.
 *
 *  @param tagLine - String - the line of the tag
 *  @param tag - String - the tag to find in the line
 */
function getIndentation(tagLine, tag) {
  const tagIdx = tagLine.indexOf(tag);
  let indentNb = 0;
  for (let i = tagIdx - 1 ; i >= 0 && includes([ ' ', '\t' ], tagLine[i]) ; --i) {
     ++indentNb;
  }
  return indentNb;
}

/**
 *  Given the lines to indent, prepend the given number of spaces.
 *
 *  @param indentNb - Number - number of spaces to prepend
 *  @param lines - [String] - lines to reindent
 *  @returns [String] the content reindented
 */
function reindent(indentNb, lines) {
  const indent = times(indentNb, () => ' ').join('');
  return map(lines, line => indent + line);
}

/**
 *  
 */
function injectIntoString(content, dest, opts) {
  switch (opts.contentType) {
    case 'code':
      // replace new line characters
      const newLineCharDest = getNewLineChar(opts.newLine, dest);
      const newLineCharContent = getNewLineChar(opts.newLine, content);
      dest = replaceNewLineChars(newLineCharDest, dest);
      content = replaceNewLineChars(newLineCharContent, content);

      // split lines
      const destLines = dest.split(newLineCharDest);
      const contentLines = content.split(newLineCharContent);

      if (opts.between) {
        // find tags
        const startLineIdx = findIndex(destLines, line => line.indexOf(opts.between.starttag) >= 0);
        const endLineIdx = findIndex(destLines, line => line.indexOf(opts.between.endtag) >= 0);

        if (startLineIdx < 0 || endLineIdx < 0) {
          throw new Error('could not find tags');
        }

        // reindent content from dest tag indentation
        let indentNb = getIndentation(destLines[startLineIdx], opts.between.starttag);
        // and inject between tags
        destLines.splice(startLineIdx + 1, endLineIdx - startLineIdx - 1, ...reindent(indentNb, contentLines));
      } else {
        // find tag
        const tag = opts.before || opts.after;
        const tagLineIdx = findIndex(destLines, line => line.indexOf(tag) >= 0);

        if (tagLineIdx < 0) {
          throw new Error('could not find tag');
        }
        
        // reindent content from dest tag indentation
        let indentNb = getIndentation(destLines[tagLineIdx], tag);

        if (opts.before) {
          // inject before tag
          destLines.splice(tagLineIdx, 0, ...reindent(indentNb, contentLines));
        } else if (opts.after) {
          // inject after tag
          destLines.splice(tagLineIdx + 1, 0, ...reindent(indentNb, contentLines));
        }
      }

      // squash lines
      return destLines.join(newLineCharDest);
    default:
      // simple injection
      if (opts.between) {
        return dest.slice(0, dest.indexOf(opts.between.starttag) + opts.between.starttag.length) +
          content +
          dest.slice(dest.indexOf(opts.between.endtag));
      } else if (opts.before) {
        return dest.slice(0, dest.indexOf(opts.before)) +
          content +
          dest.slice(dest.indexOf(opts.between.before));
      } else if (opts.after) {
        return dest.slice(0, dest.indexOf(opts.after) + opts.after.length) +
          content +
          dest.slice(dest.indexOf(opts.between.after) + opts.after.length);
      }
      break;
  }
}

/**
 *  Sync version
 *  If destination is a file, reads the file, injects the content, and rewrites the file.
 *  If destination is a string, injects into the string and returns the result.
 */
function injectSync(content, opts) {
  if (opts.into) {
    const data = fs.readFileSync(opts.into, 'utf8');
    const result = injectIntoString(content, data, opts);
    fs.writeFileSync(opts.into, result);
  } else {
    return injectIntoString(content, opts.intoStr, opts);
  }
}

/**
 *  Async version
 *  If destination is a file, reads the file, injects the content, and rewrites the file.
 *  If destination is a string, injects into the string and returns the result.
 */
function injectAsync(content, opts) {
  return new Promise((resolve, reject) => {
    if (opts.into) {
      fs.readFile(opts.into, 'utf8', (err, data) => {
        if (err) { return reject(err); }

        try {
          const result = injectIntoString(content, data, opts);
          fs.writeFile(opts.into, result, err => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        } catch (err) {
          reject(err);
        }
      });
    } else {
      try {
        const result = injectIntoString(content, opts.intoStr, opts);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }
  });
}

module.exports = (content, opts) => {
  opts = merge({
    sync: false,
    contentType: 'code',
    newLine: 'auto'
  }, opts);

  if ((!opts.into && !opts.intoStr) ||
      (opts.between && (!opts.between.starttag || !opts.between.endtag)) ||
      (!opts.between && !opts.before && !opts.after)) {
    const err = new Error('invalid arguments');

    if (opts.sync) {
      throw err;
    } else {
      return new Promise((resolve, reject) => { reject(err); });
    }
  }

  return opts.sync ?
    injectSync(content, opts)
    : injectAsync(content, opts);
};
