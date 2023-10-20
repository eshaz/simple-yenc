import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";

import * as yenc from "simple-yenc";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const bytesPath = path.join(__dirname, "bytes.bin");
const encodedBytesPath = path.join(__dirname, "bytes.yenc");
const imagePath = path.join(
  __dirname,
  "418294_tree-woody-plant-vascular-plant.jpg",
);
const opusPath = path.join(__dirname, "ogg.opus");
const vorbisPath = path.join(__dirname, "ogg.vorbis");
const mpegPath = path.join(__dirname, "mpeg.cbr.mp3");
const base64ImagePath = path.join(
  __dirname,
  "418294_tree-woody-plant-vascular-plant.jpg.base64",
);
const encodedImagePath = path.join(
  __dirname,
  "418294_tree-woody-plant-vascular-plant.jpg.yenc",
);
const stringifiedImagePath = path.join(
  __dirname,
  "418294_tree-woody-plant-vascular-plant.jpg.yenc.stringified",
);

const generateTestData = () => {
  const image = fs.readFileSync(imagePath);
  const encodedImage = yenc.encode(Uint8Array.from(image));

  const bytes = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    bytes[i] = i;
  }
  const encodedBytes = yenc.encode(bytes);

  fs.writeFileSync(bytesPath, bytes);
  fs.writeFileSync(encodedBytesPath, encodedBytes, { encoding: "binary" });
  fs.writeFileSync(encodedImagePath, encodedImage, { encoding: "binary" });
  fs.writeFileSync(stringifiedImagePath, yenc.stringify(encodedImage), {
    encoding: "binary",
  });
};

const logDecodeStats = (testName, input, output, offset) => {
  process.stdout.write(
    testName +
      " encoded " +
      input.length +
      " bytes " +
      "to " +
      output.length +
      " bytes with " +
      Math.round((output.length / input.length - 1 + Number.EPSILON) * 10000) /
        100 +
      "% overhead using escape offset " +
      offset +
      "\n",
  );
};

describe("simple-yenc.js", () => {
  let image,
    opus,
    mpeg,
    vorbis,
    encodedImage,
    bytes,
    encodedBytes,
    stringifiedImage;

  beforeAll(async () => {
    //generateTestData();
    [
      image,
      opus,
      mpeg,
      vorbis,
      encodedImage,
      bytes,
      encodedBytes,
      stringifiedImage,
    ] = await Promise.all([
      fs.promises.readFile(imagePath),
      fs.promises.readFile(opusPath),
      fs.promises.readFile(mpegPath),
      fs.promises.readFile(vorbisPath),
      fs.promises.readFile(encodedImagePath).then((f) => f.toString("binary")),
      fs.promises.readFile(bytesPath),
      fs.promises.readFile(encodedBytesPath).then((f) => f.toString("binary")),
      fs.promises
        .readFile(stringifiedImagePath)
        .then((f) => f.toString("binary")),
    ]);
  });

  describe("yEnc encoded strings", () => {
    it("should encode and decode to the same data", () => {
      const encoded = yenc.encode(Uint8Array.from(image));
      const decoded = yenc.decode(encoded);

      logDecodeStats("yEnc", image, encoded, 42);

      expect(Buffer.compare(image, decoded)).toEqual(0);
    });

    it("should encode from a byte array", () => {
      const result = yenc.encode(Uint8Array.from(image));

      expect(result === encodedImage).toBeTruthy();
    });

    it("should decode from a string", () => {
      const result = yenc.decode(encodedImage);

      expect(Buffer.compare(image, result)).toEqual(0);
    });

    it("should properly escape characters for a string template", () => {
      const result = yenc.stringify(encodedImage);

      const stringifiedInJs = eval("() => `" + result + "`")();

      const decodedString = yenc.decode(stringifiedInJs);

      expect(Buffer.compare(image, decodedString));
    });

    describe("HTML overrides", () => {
      class HTMLEncodedString extends String {
        // https://html.spec.whatwg.org/multipage/parsing.html#table-charref-overrides
        static characterEncoding = {
          0x80: 0x20ac, // EURO SIGN (€)
          0x82: 0x201a, // SINGLE LOW-9 QUOTATION MARK (‚)
          0x83: 0x0192, // LATIN SMALL LETTER F WITH HOOK (ƒ)
          0x84: 0x201e, // DOUBLE LOW-9 QUOTATION MARK („)
          0x85: 0x2026, // HORIZONTAL ELLIPSIS (…)
          0x86: 0x2020, // DAGGER (†)
          0x87: 0x2021, // DOUBLE DAGGER (‡)
          0x88: 0x02c6, // MODIFIER LETTER CIRCUMFLEX ACCENT (ˆ)
          0x89: 0x2030, // PER MILLE SIGN (‰)
          0x8a: 0x0160, // LATIN CAPITAL LETTER S WITH CARON (Š)
          0x8b: 0x2039, // SINGLE LEFT-POINTING ANGLE QUOTATION MARK (‹)
          0x8c: 0x0152, // LATIN CAPITAL LIGATURE OE (Œ)
          0x8e: 0x017d, // LATIN CAPITAL LETTER Z WITH CARON (Ž)
          0x91: 0x2018, // LEFT SINGLE QUOTATION MARK (‘)
          0x92: 0x2019, // RIGHT SINGLE QUOTATION MARK (’)
          0x93: 0x201c, // LEFT DOUBLE QUOTATION MARK (“)
          0x94: 0x201d, // RIGHT DOUBLE QUOTATION MARK (”)
          0x95: 0x2022, // BULLET (•)
          0x96: 0x2013, // EN DASH (–)
          0x97: 0x2014, // EM DASH (—)
          0x98: 0x02dc, // SMALL TILDE (˜)
          0x99: 0x2122, // TRADE MARK SIGN (™)
          0x9a: 0x0161, // LATIN SMALL LETTER S WITH CARON (š)
          0x9b: 0x203a, // SINGLE RIGHT-POINTING ANGLE QUOTATION MARK (›)
          0x9c: 0x0153, // LATIN SMALL LIGATURE OE (œ)
          0x9e: 0x017e, // LATIN SMALL LETTER Z WITH CARON (ž)
          0x9f: 0x0178, // LATIN CAPITAL LETTER Y WITH DIAERESIS (Ÿ)
        };

        constructor(string) {
          super(string);
        }

        charCodeAt(i) {
          const code = super.charCodeAt(i);

          return HTMLEncodedString.characterEncoding[code] || code;
        }
      }

      it("should decode all byte values when read from inlined HTML", () => {
        const htmlEncodedString = new HTMLEncodedString(encodedBytes);

        const result = yenc.decode(htmlEncodedString);

        expect(Buffer.compare(bytes, result)).toEqual(0);
      });

      it("should decode when read from inlined HTML", () => {
        const htmlEncodedString = new HTMLEncodedString(encodedImage);

        const result = yenc.decode(htmlEncodedString);

        expect(Buffer.compare(image, result)).toEqual(0);
      });
    });
  });

  describe("DynEnc Encoded Strings", () => {
    const dynamicEncodeWorker = (imagePath, outputPath, stringWrapper) => {
      const source =
        "(" +
        ((
          inputPath,
          outputPath,
          stringWrapper,
          dynamicEncode,
          crc32,
          logDecodeStats,
        ) => {
          const fs = require("fs");
          const input = fs.readFileSync(inputPath);
          const encoded = dynamicEncode(
            Uint8Array.from(input),
            stringWrapper,
            crc32,
          );

          logDecodeStats(
            "DynEnc " + stringWrapper,
            input,
            encoded,
            parseInt(encoded.substring(11, 13), 16),
          );

          fs.writeFileSync(outputPath, encoded, { encoding: "binary" });
        }).toString() +
        ")('" +
        imagePath +
        "'," +
        "'" +
        outputPath +
        "'," +
        stringWrapper +
        "," +
        yenc.dynamicEncode.toString() +
        "," +
        yenc.crc32.toString() +
        "," +
        logDecodeStats.toString() +
        ")";

      const worker = new Worker(source, { eval: true });

      return new Promise((res) => worker.on("exit", res)).then(() =>
        fs.promises.readFile(outputPath).then((f) => f.toString("binary")),
      );
    };

    describe("double quote", () => {
      let encoded;

      it.concurrent(
        "should encode and decode to the same data when double quote image",
        async () => {
          const stringWrapper = '"\\""';
          const outputPath = imagePath + ".dynamic.doublequote";

          encoded = await dynamicEncodeWorker(
            imagePath,
            outputPath,
            stringWrapper,
          );
          const decoded = yenc.decode(encoded);

          expect(encoded.length).toEqual(9572301); // 46
          expect(Buffer.compare(image, decoded)).toEqual(0);
        },
        30000,
      );

      it.concurrent(
        "should encode and decode to the same data when double quote opus",
        async () => {
          const stringWrapper = '"\\""';
          const outputPath = opusPath + ".dynamic.doublequote";

          encoded = await dynamicEncodeWorker(
            opusPath,
            outputPath,
            stringWrapper,
          );
          const decoded = yenc.decode(encoded);

          expect(encoded.length).toEqual(950192); // 224
          expect(Buffer.compare(opus, decoded)).toEqual(0);
        },
        30000,
      );

      it.concurrent(
        "should encode and decode to the same data when double quote mpeg",
        async () => {
          const stringWrapper = '"\\""';
          const outputPath = mpegPath + ".dynamic.doublequote";

          encoded = await dynamicEncodeWorker(
            mpegPath,
            outputPath,
            stringWrapper,
          );
          const decoded = yenc.decode(encoded);

          expect(encoded.length).toEqual(1311948); // 143
          expect(Buffer.compare(mpeg, decoded)).toEqual(0);
        },
        30000,
      );

      it.concurrent(
        "should encode and decode to the same data when double quote vorbis",
        async () => {
          const stringWrapper = '"\\""';
          const outputPath = vorbisPath + ".dynamic.doublequote";

          encoded = await dynamicEncodeWorker(
            vorbisPath,
            outputPath,
            stringWrapper,
          );
          const decoded = yenc.decode(encoded);

          expect(encoded.length).toEqual(1758730); // 118
          expect(Buffer.compare(vorbis, decoded)).toEqual(0);
        },
        30000,
      );

      it("should encode and decode all bytes when double quote", async () => {
        const stringWrapper = '"\\""';
        const outputPath = bytesPath + ".dynamic.doublequote.bytes";

        encoded = await dynamicEncodeWorker(
          bytesPath,
          outputPath,
          stringWrapper,
        );
        const decoded = yenc.decode(encoded);

        expect(encoded.length).toEqual(287);
        expect(Buffer.compare(bytes, decoded)).toEqual(0);
      }, 30000);

      it("should properly escape characters for a string using double quotes", () => {
        const stringifiedInJs = eval('() => "' + encoded + '"')();
        const decodedString = yenc.decode(stringifiedInJs);

        expect(Buffer.compare(image, decodedString));
      });
    });

    describe("single quote", () => {
      let encoded;

      it.concurrent(
        "should encode and decode to the same data when single quote image",
        async () => {
          const stringWrapper = '"\'"';
          const outputPath = imagePath + ".dynamic.singlequote";

          encoded = await dynamicEncodeWorker(
            imagePath,
            outputPath,
            stringWrapper,
          );
          const decoded = yenc.decode(encoded);

          expect(encoded.length).toEqual(9572494); // 77
          expect(Buffer.compare(image, decoded)).toEqual(0);
        },
        30000,
      );

      it.concurrent(
        "should encode and decode to the same data when single quote opus",
        async () => {
          const stringWrapper = '"\'"';
          const outputPath = opusPath + ".dynamic.singlequote";

          encoded = await dynamicEncodeWorker(
            opusPath,
            outputPath,
            stringWrapper,
          );
          const decoded = yenc.decode(encoded);

          expect(encoded.length).toEqual(950165); // 225
          expect(Buffer.compare(opus, decoded)).toEqual(0);
        },
        30000,
      );

      it.concurrent(
        "should encode and decode to the same data when single quote mpeg",
        async () => {
          const stringWrapper = '"\'"';
          const outputPath = mpegPath + ".dynamic.singlequote";

          encoded = await dynamicEncodeWorker(
            mpegPath,
            outputPath,
            stringWrapper,
          );
          const decoded = yenc.decode(encoded);

          expect(encoded.length).toEqual(1311740); // 69
          expect(Buffer.compare(mpeg, decoded)).toEqual(0);
        },
        30000,
      );

      it.concurrent(
        "should encode and decode to the same data when single quote vorbis",
        async () => {
          const stringWrapper = '"\\""';
          const outputPath = vorbisPath + ".dynamic.singlequote";

          encoded = await dynamicEncodeWorker(
            vorbisPath,
            outputPath,
            stringWrapper,
          );
          const decoded = yenc.decode(encoded);

          expect(encoded.length).toEqual(1758730); // 188
          expect(Buffer.compare(vorbis, decoded)).toEqual(0);
        },
        30000,
      );

      it("should encode and decode all bytes when single quote", async () => {
        const stringWrapper = '"\'"';
        const outputPath = bytesPath + ".dynamic.singlequote.bytes";

        encoded = await dynamicEncodeWorker(
          bytesPath,
          outputPath,
          stringWrapper,
        );
        const decoded = yenc.decode(encoded);

        expect(encoded.length).toEqual(287);
        expect(Buffer.compare(bytes, decoded)).toEqual(0);
      }, 30000);

      it("should properly escape characters for a string using a single quote", () => {
        const stringifiedInJs = eval("() => '" + encoded + "'")();
        const decodedString = yenc.decode(stringifiedInJs);

        expect(Buffer.compare(image, decodedString));
      });
    });

    describe("backtick", () => {
      let encoded;

      it.concurrent(
        "should encode and decode to the same data when backtick image",
        async () => {
          const stringWrapper = '"`"';
          const outputPath = imagePath + ".dynamic.backtick";

          encoded = await dynamicEncodeWorker(
            imagePath,
            outputPath,
            stringWrapper,
          );
          const decoded = yenc.decode(encoded);

          expect(encoded.length).toEqual(9344095); // 110
          expect(Buffer.compare(image, decoded)).toEqual(0);
        },
        30000,
      );

      it.concurrent(
        "should encode and decode to the same data when backtick opus",
        async () => {
          const stringWrapper = '"`"';
          const outputPath = opusPath + ".dynamic.backtick";

          encoded = await dynamicEncodeWorker(
            opusPath,
            outputPath,
            stringWrapper,
          );
          const decoded = yenc.decode(encoded);

          expect(encoded.length).toEqual(925718); // 224
          expect(Buffer.compare(opus, decoded)).toEqual(0);
        },
        30000,
      );

      it.concurrent(
        "should encode and decode to the same data when backtick mpeg",
        async () => {
          const stringWrapper = '"`"';
          const outputPath = mpegPath + ".dynamic.backtick";

          encoded = await dynamicEncodeWorker(
            mpegPath,
            outputPath,
            stringWrapper,
          );
          const decoded = yenc.decode(encoded);

          expect(encoded.length).toEqual(1282185); // 143
          expect(Buffer.compare(mpeg, decoded)).toEqual(0);
        },
        30000,
      );

      it.concurrent(
        "should encode and decode to the same data when backtick vorbis",
        async () => {
          const stringWrapper = '"`"';
          const outputPath = vorbisPath + ".dynamic.backtick";

          encoded = await dynamicEncodeWorker(
            vorbisPath,
            outputPath,
            stringWrapper,
          );
          const decoded = yenc.decode(encoded);

          expect(encoded.length).toEqual(1721863); // 118
          expect(Buffer.compare(vorbis, decoded)).toEqual(0);
        },
        30000,
      );

      it("should encode and decode all bytes when backtick", async () => {
        const stringWrapper = '"`"';
        const outputPath = bytesPath + ".dynamic.backtick.bytes";

        encoded = await dynamicEncodeWorker(
          bytesPath,
          outputPath,
          stringWrapper,
        );
        const decoded = yenc.decode(encoded);

        expect(Buffer.compare(bytes, decoded)).toEqual(0);
      }, 30000);

      it("should properly escape characters for a string template", () => {
        const stringifiedInJs = eval("() => String.raw`" + encoded + "`")();
        const decodedString = yenc.decode(stringifiedInJs);

        expect(Buffer.compare(image, decodedString));
      });
    });

    describe("crc", () => {
      let encoded;

      it("should throw an error when crc doesn't match", async () => {
        const stringWrapper = '"`"';
        const outputPath = imagePath + ".dynamic.backtick";

        encoded = await dynamicEncodeWorker(
          imagePath,
          outputPath,
          stringWrapper,
        );
        encoded = encoded.slice(0, 1234) + " " + encoded.slice(1235);

        let error;
        try {
          yenc.decode(encoded);
        } catch (e) {
          error = e;
        }

        expect(error).toEqual(new Error("Decode failed crc32 validation"));
      }, 30000);
    });

    describe("UTF escape codes", () => {
      let encoded;

      const utf8Escape = (string) =>
        Array.from(string)
          .map((ch) =>
            ch.charCodeAt(0) <= 0x7f
              ? ch
              : "\\u" + ("0000" + ch.charCodeAt(0).toString(16)).slice(-4),
          )
          .join("");

      it.concurrent(
        "should encode and decode to the same data when backtick image and utf8 escaped",
        async () => {
          const stringWrapper = '"`"';
          const outputPath = imagePath + ".dynamic.backtick";

          const encoder = new TextEncoder();
          const decoder = new TextDecoder();

          encoded = await dynamicEncodeWorker(
            imagePath,
            outputPath,
            stringWrapper,
          );
          const utf8_escaped = utf8Escape(encoded);

          const decoded = yenc.decode(utf8_escaped);

          expect(encoded.length).toEqual(9344095); // 110
          expect(Buffer.compare(image, decoded)).toEqual(0);
        },
        30000,
      );

      it.concurrent(
        "should encode and decode to the same data when backtick opus and utf8 escaped",
        async () => {
          const stringWrapper = '"`"';
          const outputPath = opusPath + ".dynamic.backtick";

          encoded = await dynamicEncodeWorker(
            opusPath,
            outputPath,
            stringWrapper,
          );
          const utf8_escaped = utf8Escape(encoded);

          const decoded = yenc.decode(utf8_escaped);

          expect(encoded.length).toEqual(925718); // 224
          expect(Buffer.compare(opus, decoded)).toEqual(0);
        },
        30000,
      );

      it.concurrent(
        "should encode and decode to the same data when backtick mpeg and utf8 escaped",
        async () => {
          const stringWrapper = '"`"';
          const outputPath = mpegPath + ".dynamic.backtick";

          encoded = await dynamicEncodeWorker(
            mpegPath,
            outputPath,
            stringWrapper,
          );
          const utf8_escaped = utf8Escape(encoded);

          const decoded = yenc.decode(utf8_escaped);

          expect(encoded.length).toEqual(1282185); // 143
          expect(Buffer.compare(mpeg, decoded)).toEqual(0);
        },
        30000,
      );

      it.concurrent(
        "should encode and decode to the same data when backtick vorbis and utf8 escaped",
        async () => {
          const stringWrapper = '"`"';
          const outputPath = vorbisPath + ".dynamic.backtick";

          encoded = await dynamicEncodeWorker(
            vorbisPath,
            outputPath,
            stringWrapper,
          );
          const utf8_escaped = utf8Escape(encoded);

          const decoded = yenc.decode(utf8_escaped);

          expect(encoded.length).toEqual(1721863); // 118
          expect(Buffer.compare(vorbis, decoded)).toEqual(0);
        },
        30000,
      );

      it("should encode and decode all bytes when backtick and utf8 escaped", async () => {
        const stringWrapper = '"`"';
        const outputPath = bytesPath + ".dynamic.backtick.bytes";

        encoded = await dynamicEncodeWorker(
          bytesPath,
          outputPath,
          stringWrapper,
        );
        const utf8_escaped = utf8Escape(encoded);

        const decoded = yenc.decode(utf8_escaped);

        expect(Buffer.compare(bytes, decoded)).toEqual(0);
      }, 30000);
    });
  });
});

const base64FromUri = (base64) =>
  base64.match(/^data:.+\/(.+);base64,(.*)$/)[2];
