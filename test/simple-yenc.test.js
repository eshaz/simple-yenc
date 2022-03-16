const fs = require("fs");
const path = require("path");

const yenc = require("../src/simple-yenc");

const imagePath = path.join(
  __dirname,
  "418294_tree-woody-plant-vascular-plant.jpg"
);
const base64ImagePath = path.join(
  __dirname,
  "418294_tree-woody-plant-vascular-plant.jpg.base64"
);
const encodedImagePath = path.join(
  __dirname,
  "418294_tree-woody-plant-vascular-plant.jpg.yenc"
);
const stringifiedImagePath = path.join(
  __dirname,
  "418294_tree-woody-plant-vascular-plant.jpg.yenc.stringified"
);

const generateTestData = () => {
  const image = fs.readFileSync(imagePath);
  const expectedEncode = yenc.encode(Uint8Array.from(image));
  fs.writeFileSync(encodedImagePath, expectedEncode, { encoding: "binary" });
  fs.writeFileSync(stringifiedImagePath, yenc.stringify(expectedEncode), {
    encoding: "binary",
  });
};

describe("simple-yenc.js", () => {
  let image, encodedImage, stringifiedImage;

  beforeAll(() => {
    //generateTestData();

    image = fs.readFileSync(imagePath);
    encodedImage = fs.readFileSync(encodedImagePath).toString("binary");
    stringifiedImage = fs.readFileSync(stringifiedImagePath).toString("binary");
  });

  it("should encode from a byte array", () => {
    const result = yenc.encode(Uint8Array.from(image));

    expect(result).toEqual(encodedImage);
  });

  it("should decode from a string", () => {
    const result = yenc.decode(encodedImage);

    expect(Buffer.compare(image, result)).toEqual(0);
  });

  it("should decode when read from inlined HTML", () => {
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

    const htmlEncodedString = new HTMLEncodedString(encodedImage);

    const result = yenc.decode(htmlEncodedString);

    expect(Buffer.compare(image, result)).toEqual(0);
  });

  it("should properly escape characters for a string template", () => {
    const result = yenc.stringify(encodedImage);

    const stringifiedInJs = eval("() => `" + result + "`")();

    const decodedString = yenc.decode(stringifiedInJs);

    expect(Buffer.compare(image, decodedString));
  });
});

const base64FromUri = (base64) =>
  base64.match(/^data:.+\/(.+);base64,(.*)$/)[2];
