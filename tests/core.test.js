"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const M = require("../core.js");

test("clamp rejects NaN and bounds numeric input", () => {
  assert.equal(M.clamp(NaN, 0, 40), 0);
  assert.equal(M.clamp("18", 0, 40), 18);
  assert.equal(M.clamp(100, 0, 40), 40);
  assert.equal(M.clamp(-5, 0, 40), 0);
});
for (const [ratio, size] of Object.entries({"9:16":[1080,1920],"4:5":[1080,1350],"1:1":[1080,1080],"16:9":[1920,1080]})) {
  test(`dimensions for ${ratio}`, () => assert.deepEqual(M.dimensions(ratio, 1080), {width:size[0],height:size[1]}));
}
test("export sizes scale by short edge", () => {
  assert.deepEqual(M.dimensions("9:16",720),{width:720,height:1280});
  assert.deepEqual(M.dimensions("16:9",2160),{width:3840,height:2160});
});
test("unknown ratio falls back to vertical", () => assert.deepEqual(M.dimensions("invalid",1080),{width:1080,height:1920}));
test("safe rectangle is derived from percentages", () => assert.deepEqual(M.safeRect(1000,2000,{top:10,bottom:20,left:5,right:15}),{x:50,y:200,width:800,height:1400}));
test("margin bounds keep a nonempty guide", () => assert.deepEqual(M.normalizeMargins({top:90,bottom:-10,left:100,right:40}),{top:40,bottom:0,left:40,right:40}));
for (const key of Object.keys(M.PRESETS)) {
  test(`${key} preset is valid, compact < standard < expanded`, () => {
    const a=M.presetMargins(key,"compact"), b=M.presetMargins(key,"standard"), c=M.presetMargins(key,"expanded");
    assert.ok(a.bottom < b.bottom && b.bottom < c.bottom);
    assert.ok(c.top+c.bottom<100 && c.left+c.right<100);
  });
}
test("cover fills without stretching", () => {
  const r=M.fitRect(1200,800,1080,1920,"cover",1,0,0);
  assert.equal(r.width,2880); assert.equal(r.height,1920); assert.equal(r.x,-900); assert.equal(r.y,0);
});
test("contain preserves all media", () => {
  const r=M.fitRect(1200,800,1080,1920,"contain",1,0,0);
  assert.equal(r.width,1080); assert.equal(r.height,720); assert.equal(r.y,600);
});
test("positive pan reaches left crop edge without a gap", () => {
  const r=M.fitRect(1200,800,1080,1920,"cover",1,100,0); assert.equal(r.x,0);
});
test("negative pan reaches right crop edge", () => {
  const r=M.fitRect(1200,800,1080,1920,"cover",1,-100,0); assert.equal(r.x+r.width,1080);
});
test("invalid geometry fails explicitly", () => assert.throws(()=>M.fitRect(0,800,1080,1920,"cover",1,0,0),RangeError));
test("zoom is bounded", () => {
  const r=M.fitRect(1080,1920,1080,1920,"cover",99,0,0); assert.equal(r.width,3240);
});
test("rect containment includes exact boundaries", () => {
  const r={x:5,y:10,width:100,height:200}; assert.ok(M.isInside(r,r)); assert.ok(!M.isInside({...r,x:0},r));
});
for (const [name,type,kind] of [["x.png","image/png","image"],["x.JPG","image/jpeg","image"],["x.webp","image/webp","image"],["x.MOV","video/quicktime","video"],["x.mp4","video/mp4","video"],["x.webm","video/webm","video"],["x.png","","image"]]) {
  test(`accepts ${name} with ${type || "missing MIME"}`, () => assert.equal(M.fileKind({name,type}),kind));
}
for (const [name,type] of [["x.svg","image/svg+xml"],["x.gif","image/gif"],["x.heic","image/heic"],["x.jpg","text/html"],["x.exe","image/png"]]) {
  test(`rejects ${name} with ${type}`, () => assert.equal(M.fileKind({name,type}),null));
}
test("file-size caps and empty files", () => {
  assert.ok(!M.validateFile({name:"x.png",type:"image/png",size:0}).ok);
  assert.ok(!M.validateFile({name:"x.png",type:"image/png",size:26*1048576}).ok);
  assert.ok(!M.validateFile({name:"x.mp4",type:"video/mp4",size:201*1048576}).ok);
  assert.ok(M.validateFile({name:"x.mp4",type:"video/mp4",size:10000}).ok);
});
test("only HTTPS URLs without embedded credentials are linked", () => {
  assert.equal(M.safeExternalUrl("https://example.org/support"),"https://example.org/support");
  for(const value of ["", "javascript:alert(1)","data:text/html,hello","http://example.org/", "https://user:pass@example.org/"]) assert.equal(M.safeExternalUrl(value),"");
});
test("download names are path-safe and bounded", () => {
  assert.equal(M.filename("../hello world.PNG","reels-clean"),"hello-world-reels-clean.png");
  assert.equal(M.filename("", "guide"),"creative-guide.png");
  assert.ok(M.filename("x".repeat(500)+".png","clean").length<80);
});
test("presets cannot be accidentally mutated", () => {
  assert.throws(()=>{M.PRESETS.reels.top=100;},TypeError); assert.equal(M.PRESETS.reels.top,12);
});
