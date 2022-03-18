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
    byte,
    offset = 42, // default yEnc offset
    startIdx = 0;

  if (string.length > 13 && string.substring(0, 9) === "DynEncode") {
    const version = parseInt(string.substring(9, 11), 16);
    if (version === 0) {
      offset = parseInt(string.substring(11, 13), 16);
      startIdx = 13;
    }
  }

  const offsetReverse = 256 - offset;

  for (let i = startIdx; i < string.length; i++) {
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

    output[byteIndex++] =
      byte < offset && byte > 0 ? byte + offsetReverse : byte - offset;
  }

  return output.subarray(0, byteIndex);
};

const dynamicEncode = (byteArray, stringWrapper = '"') => {
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

  const charArray = [
    ..."DynEncode", // magic signature
    ..."00", // version 0x00 - 0xff
    offset.toString(16).padStart(2, "0"), // best offset in bytes 0x00 - 0xff
  ];

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

// allows embedded javascript string template
const stringify = (rawString) =>
  rawString
    .replace(/[\\]/g, "\\\\")
    .replace(/[`]/g, "\\`")
    .replace(/\${/g, "\\${");

module.exports = {
  encode,
  dynamicEncode,
  decode,
  stringify,
};
