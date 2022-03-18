const encode = (byteArray) => {
  const charArray = [];

  for (const byte of byteArray) {
    let encoded = (byte + 42) % 256;

    if (
      encoded === 0 || //  NULL
      encoded === 10 || // LF
      encoded === 13 || // CR
      encoded === 61 //    =
    ) {
      charArray.push("=" + String.fromCharCode((encoded + 64) % 256));
    } else {
      charArray.push(String.fromCharCode(encoded));
    }
  }

  return charArray.join("");
};

const decode = (string) => {
  const htmlCodeOverrides = new Map();
  [
    ,
    8364,
    ,
    8218,
    402,
    8222,
    8230,
    8224,
    8225,
    710,
    8240,
    352,
    8249,
    338,
    ,
    381,
    ,
    ,
    8216,
    8217,
    8220,
    8221,
    8226,
    8211,
    8212,
    732,
    8482,
    353,
    8250,
    339,
    ,
    382,
    376,
  ].forEach((k, v) => htmlCodeOverrides.set(k, v));

  const output = new Uint8Array(string.length);

  let escaped = false,
    byteIndex = 0,
    byte;

  for (let i = 0; i < string.length; i++) {
    byte = string.charCodeAt(i);

    if (byte === 61 && !escaped) {
      escaped = true;
      continue;
    }

    if (byte > 255) {
      const htmlOverride = htmlCodeOverrides.get(byte);
      if (htmlOverride) byte = htmlOverride + 127;
    }

    if (escaped) {
      escaped = false;
      byte -= 64;
    }

    output[byteIndex++] = byte < 42 && byte > 0 ? byte + 214 : byte - 42;
  }

  return output.subarray(0, byteIndex);
};

const encodeDynamicOffset = (byteArray, stringWrapper) => {
  let shouldEscape,
    offsetLength = Infinity,
    offset = 0;

  if (stringWrapper === '"')
    shouldEscape = (byte1, byte2) =>
      byte1 === 0 || //  NULL
      byte1 === 8 || //  BS
      byte1 === 9 || //  TAB
      byte1 === 10 || // LF
      byte1 === 11 || // VT
      byte1 === 12 || // FF
      byte1 === 13 || // CR
      byte1 === 34 || // "
      byte1 === 92 || // \
      byte1 === 61; //   =;

  if (stringWrapper === "'")
    shouldEscape = (byte1, byte2) =>
      byte1 === 0 || //  NULL
      byte1 === 8 || //  BS
      byte1 === 9 || //  TAB
      byte1 === 10 || // LF
      byte1 === 11 || // VT
      byte1 === 12 || // FF
      byte1 === 13 || // CR
      byte1 === 39 || // '
      byte1 === 92 || // \
      byte1 === 61; //   =;

  if (stringWrapper === "`")
    shouldEscape = (byte1, byte2) =>
      byte1 === 61 || // =
      byte1 === 13 || // CR
      byte1 === 96 || // `
      (byte1 === 36 && byte2 === 123); // ${

  // search for the byte offset with the least amount of escape characters
  for (let o = 0; o < 256; o++) {
    let length = 0;

    for (let i = 0; i < byteArray.length; i++) {
      const byte1 = (byteArray[i] + o) % 256;
      const byte2 = (byteArray[i + 1] + o) % 256;

      if (shouldEscape(byte1, byte2)) length++;
      length++;
    }

    if (length < offsetLength) {
      offsetLength = length;
      offset = o;
    }
  }

  const charArray = [offset.toString(16).padStart(2, "0")];

  for (let i = 0; i < byteArray.length; i++) {
    const byte1 = (byteArray[i] + offset) % 256;
    const byte2 = (byteArray[i + 1] + offset) % 256;

    if (shouldEscape(byte1, byte2)) {
      charArray.push("=", String.fromCharCode((byte1 + 64) % 256));
    } else {
      charArray.push(String.fromCharCode(byte1));
    }
  }

  return charArray.join("");
};

const decodeDynamicOffset = (string) => {
  const output = new Uint8Array(string.length);
  const offset = parseInt(string.substring(0, 2), 16);
  const offsetReverse = 256 - offset;

  let escaped = false,
    byteIndex = 0,
    byte;

  for (let i = 2; i < string.length; i++) {
    byte = string.charCodeAt(i);

    if (byte === 61 && !escaped) {
      escaped = true;
      continue;
    }

    //if (byte > 255) {
    //  const htmlOverride = htmlCodeOverrides.get(byte);
    //  if (htmlOverride) byte = htmlOverride + 127;
    //}

    if (escaped) {
      escaped = false;
      byte -= 64;
    }

    output[byteIndex++] =
      byte < offset && byte > 0 ? byte + offsetReverse : byte - offset;
  }

  return output.subarray(0, byteIndex);
};

// allows embedded javascript string template
const stringify = (rawString) =>
  rawString
    .replace(/[\\]/g, "\\\\")
    .replace(/[`]/g, "\\`")
    .replace(/\${/g, "\\${");

module.exports = {
  encode,
  decode,
  encodeDynamicOffset,
  decodeDynamicOffset,
  stringify,
};
