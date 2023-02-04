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

  if (string.length > 13 && string.substring(0, 9) === "dynEncode") {
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
  const modulo = (n, m) => ((n % m) + m) % m,
    escapeCharacter = (byte1, charArray) =>
      charArray.push(String.fromCharCode(61, (byte1 + 64) % 256));

  let shouldEscape,
    escapeBytes,
    byteSequences = [],
    offsetLength = Infinity,
    byteCounts = Array(256).fill(0),
    offset = 0;

  if (stringWrapper === '"') {
    escapeBytes = [0, 8, 9, 10, 11, 12, 13, 34, 92, 61];
    shouldEscape = (byte1) =>
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
  } else if (stringWrapper === "'") {
    escapeBytes = [0, 8, 9, 10, 11, 12, 13, 39, 92, 61];
    shouldEscape = (byte1) =>
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
  } else if (stringWrapper === "`") {
    escapeBytes = [13, 61, 96];
    byteSequences = [7, 205, 231];
    shouldEscape = (byte1, byte2) =>
      byte1 === 13 || // CR
      (byte1 === 36 && byte2 === 123) || // ${
      byte1 === 61 || // =
      (byte1 === 92 && (byte2 === 85 || byte2 === 117)) || // \u or \U
      byte1 === 96; // `
  }

  // collect the number of bytes for the offset search
  for (let i = 0; i < byteArray.length; i++) {
    const byte1 = byteArray[i] | 0;

    byteCounts[byte1]++;

    for (let j = 0; j < byteSequences.length; j++) {
      const byteSequence = byteSequences[j];

      // for the backtick escape, there are sequences of bytes that need to be escaped
      // check if this byte sequence is the same and add to the length count if so
      if (modulo((byte1 - byteArray[i + 1]) | 0, 256) === byteSequence)
        byteCounts[byte1]++;
    }
  }

  // search for the byte offset with the least amount of escape characters
  for (let o = 0; o < 256; o++) {
    let length = 0;

    // for each escape byte, add the byte counts collected above
    for (let i = 0; i < escapeBytes.length; i++)
      length += byteCounts[modulo(escapeBytes[i] - o, 256)];

    // if the current offset results in a smaller length, use that
    if (length < offsetLength) {
      offsetLength = length;
      offset = o;
    }
  }

  const charArray = [
    "dynEncode", // magic signature
    "00", // version 0x00 - 0xfe (0xff reserved)
    offset.toString(16).padStart(2, "0"), // best offset in bytes 0x00 - 0xff
  ];

  for (let i = 0; i < byteArray.length; i++) {
    const byte1 = (byteArray[i] + offset) % 256;
    const byte2 = (byteArray[i + 1] + offset) % 256;

    shouldEscape(byte1, byte2)
      ? escapeCharacter(byte1, charArray)
      : charArray.push(String.fromCharCode(byte1));
  }

  // correct edge case where escape character is at end of string
  if (charArray[charArray.length - 1] === "\\") {
    charArray.pop();
    escapeCharacter("\\", charArray);
  }

  return charArray.join("");
};

// allows embedded javascript string template
const stringify = (rawString) =>
  rawString
    .replace(/[\\]/g, "\\\\")
    .replace(/[`]/g, "\\`")
    .replace(/\${/g, "\\${");

export { encode, dynamicEncode, decode, stringify };
