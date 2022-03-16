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

// allows embedded javascript string template
const stringify = (rawString) =>
  rawString
    .replace(/[\\]/g, "\\\\")
    .replace(/[`]/g, "\\`")
    .replace(/\${/g, "\\${");

module.exports = { encode, decode, stringify };
