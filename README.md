# `simple-yenc`

`simple-yenc` is a minimalist yEnc encoder and decoder ECMAScript library for browser and NodeJS.

This library is designed to be simple to use and is optimized for size so that inclusion in a browser based application has very little impact.

## What is yEnc?

yEnc, or yEncode, is a very space efficient method of binary encoding. yEnc's overhead is around 1–2%,
compared to 33%–40% overhead for 6-bit encoding methods like Base64. yEnc has 252 of the 256 possible bytes available for use for encoding. NUL, LF, CR, and = are the only escaped characters.

### Read More
http://www.yenc.org/whatis.htm

## Usage

Install via [NPM](https://www.npmjs.com/package/simple-yenc)

```javascript
// NodeJS
const yenc = require("simple-yenc");

// ES6 Import
import yenc from "simple-yenc";
```

### `encode()`

Encode converts a Uint8Array, or array of integers 0-255, to a yEnc encoded string.

```javascript
// assuming `someUintArray` is already defined

const encodedString = yenc.encode(someUint8Array);
```

### `decode()`

Decode converts a yEnc encoded string into a Uint8Array.

Note: If you are embedding the yEnc string in HTML, this function will automatically handle the [HTML character reference overrides](https://html.spec.whatwg.org/multipage/parsing.html#table-charref-overrides). The HTML `charset` must be set to a character encoding that allows for single byte character representations such as `cp1252`, `ISO-8859-1`, etc. See [Issue #1](https://github.com/eshaz/simple-yenc/issues/1) for more information. 

```javascript
// assuming `encodedString` is already defined

const decodedUint8Array = yenc.decode(encodedString);
```

### `stringify()`

Stringify adds escape characters for ```'\', '`', '${'``` to a yEnc encoded string so it can be stored within a Javascript string template.

You can access the encoded value as a string using [``` String.raw`` ```](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/raw).

This is useful for inlining binary in Javascript that would otherwise need to be base64 encoded.

When stored as a Javascript string, the string can be decoded by using the `decode` function.

```javascript
// assuming `someUintArray` is already defined

const encodedString = yenc.encode(someUint8Array);
const stringified = yenc.strinfigy(encodedString);

fs.writeFileSync(
  "myfile.js",
  Buffer.concat(
    ["const encodedBinary = `", stringified, "`"].map(Buffer.from)
  ),
  { encoding: "binary" }
);
```