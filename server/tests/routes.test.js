const { test } = require("node:test");
const assert = require("node:assert");
const router = require("../routes");

// หาเส้นแรกที่รับคำขอนี้ ตามลำดับที่ express จะลองจริง
const firstMatch = (method, url) => {
  for (const mounted of router.stack) {
    for (const layer of mounted.handle.stack || []) {
      if (layer.route?.methods[method] && layer.match(url)) {
        return layer.route.path;
      }
    }
  }
  return null;
};

test("เส้นที่ชื่อชนกับ :id ต้องถูกจับก่อน", () => {
  assert.equal(firstMatch("get", "/vehicles/models"), "/vehicles/models");
  assert.equal(firstMatch("get", "/vehicles/lookup"), "/vehicles/lookup");
  assert.equal(firstMatch("get", "/vehicles/12"), "/vehicles/:id");
  assert.equal(firstMatch("get", "/inventory/units"), "/inventory/units");
  assert.equal(
    firstMatch("get", "/customers/organizations"),
    "/customers/organizations",
  );
});

test("เส้นพิมพ์ฉลากอะไหล่ถูกลงทะเบียน", () => {
  const firstPost = (url) => {
    for (const mounted of router.stack) {
      for (const layer of mounted.handle.stack || []) {
        if (layer.route?.methods.post && layer.match(url)) {
          return layer.route.path;
        }
      }
    }
    return null;
  };
  assert.equal(
    firstPost("/parts/12/label/preview"),
    "/parts/:id/label/preview",
  );
  assert.equal(firstPost("/parts/12/label/print"), "/parts/:id/label/print");
});
