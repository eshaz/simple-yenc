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

  it("should properly escape characters for a string template", () => {
    const result = yenc.stringify(encodedImage);

    const stringifiedInJs = eval("() => `" + result + "`")();

    const decodedString = yenc.decode(stringifiedInJs);

    expect(Buffer.compare(image, decodedString));
  });
});

const base64FromUri = (base64) =>
  base64.match(/^data:.+\/(.+);base64,(.*)$/)[2];
