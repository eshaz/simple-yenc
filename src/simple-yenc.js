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
  const output = new Uint8Array(string.length);

  let continued = false,
    byteIndex = 0,
    byte;

  for (let i = 0; i < string.length; i++) {
    byte = string.charCodeAt(i);

    if (byte === 13 || byte === 10) continue;

    if (byte === 61 && !continued) {
      continued = true;
      continue;
    }

    if (continued) {
      continued = false;
      byte -= 64;
    }

    output[byteIndex++] = byte < 42 && byte > 0 ? byte + 214 : byte - 42;
  }

  return output.subarray(0, byteIndex);
};

// allows embedded javascript string template
const stringify = (rawString) =>
  rawString.replace(/[\\]/g, "\\\\").replace(/[`]/g, "\\`");

module.exports = { encode, decode, stringify };
