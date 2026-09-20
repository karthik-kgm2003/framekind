/* Pure geometry shared by the browser and the dependency-free Node test suite.
 * Presets are intentionally conservative, illustrative editorial starting points.
 * They are NOT measured, guaranteed, or official platform specifications.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FrameMath = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const PRESETS = Object.freeze({
    reels: Object.freeze({ name: "Instagram Reels", short: "Reels", top: 12, bottom: 22, left: 6, right: 17 }),
    tiktok: Object.freeze({ name: "TikTok", short: "TikTok", top: 13, bottom: 25, left: 6, right: 18 }),
    shorts: Object.freeze({ name: "YouTube Shorts", short: "Shorts", top: 14, bottom: 24, left: 6, right: 18 })
  });
  const RATIOS = Object.freeze({
    "9:16": Object.freeze({ width: 1080, height: 1920, label: "Vertical" }),
    "4:5": Object.freeze({ width: 1080, height: 1350, label: "Portrait" }),
    "1:1": Object.freeze({ width: 1080, height: 1080, label: "Square" }),
    "16:9": Object.freeze({ width: 1920, height: 1080, label: "Landscape" })
  });
  function clamp(value, min, max) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
  }
  function dimensions(ratio, shortEdge) {
    const r = RATIOS[ratio] || RATIOS["9:16"];
    const scale = clamp(shortEdge || 1080, 360, 2160) / 1080;
    return { width: Math.round(r.width * scale), height: Math.round(r.height * scale) };
  }
  function normalizeMargins(margins) {
    return Object.fromEntries(["top", "bottom", "left", "right"].map(k => [k, clamp(margins[k], 0, 40)]));
  }
  function presetMargins(key, caption) {
    const p = PRESETS[key] || PRESETS.reels;
    const extra = caption === "expanded" ? 6 : caption === "compact" ? -5 : 0;
    return normalizeMargins({ ...p, bottom: p.bottom + extra });
  }
  function safeRect(width, height, margins) {
    const m = normalizeMargins(margins);
    return {
      x: width * m.left / 100, y: height * m.top / 100,
      width: width * (100 - m.left - m.right) / 100,
      height: height * (100 - m.top - m.bottom) / 100
    };
  }
  function fitRect(sourceWidth, sourceHeight, width, height, fit, zoom, panX, panY) {
    if (![sourceWidth, sourceHeight, width, height].every(n => Number.isFinite(n) && n > 0)) {
      throw new RangeError("Image and canvas dimensions must be positive finite numbers.");
    }
    const scale = (fit === "contain" ? Math.min : Math.max)(width / sourceWidth, height / sourceHeight) * clamp(zoom, 1, 3);
    const drawWidth = sourceWidth * scale, drawHeight = sourceHeight * scale;
    const travelX = Math.abs(drawWidth - width) / 2, travelY = Math.abs(drawHeight - height) / 2;
    return {
      x: (width - drawWidth) / 2 + clamp(panX, -100, 100) / 100 * travelX,
      y: (height - drawHeight) / 2 + clamp(panY, -100, 100) / 100 * travelY,
      width: drawWidth, height: drawHeight, travelX, travelY
    };
  }
  function isInside(inner, outer, epsilon = 0.01) {
    return inner.x >= outer.x - epsilon && inner.y >= outer.y - epsilon &&
      inner.x + inner.width <= outer.x + outer.width + epsilon &&
      inner.y + inner.height <= outer.y + outer.height + epsilon;
  }
  function fileKind(file) {
    const ext = (file.name || "").toLowerCase().split(".").pop();
    const type = (file.type || "").toLowerCase();
    if (["jpg", "jpeg", "png", "webp"].includes(ext) && (!type || ["image/jpeg", "image/png", "image/webp"].includes(type))) return "image";
    if (["mp4", "webm", "mov", "m4v"].includes(ext) && (!type || type.startsWith("video/"))) return "video";
    return null;
  }
  function validateFile(file) {
    const kind = fileKind(file);
    if (!kind) return { ok: false, message: "Choose a JPG, PNG, WebP, MP4, WebM, or MOV file. SVG, GIF, and HEIC are not supported." };
    if (!Number.isFinite(file.size) || file.size <= 0) return { ok: false, message: "This file is empty. Please choose another file." };
    const limit = (kind === "image" ? 25 : 200) * 1024 * 1024;
    if (file.size > limit) return { ok: false, message: `${kind === "image" ? "Images" : "Videos"} must be under ${kind === "image" ? 25 : 200} MB.` };
    return { ok: true, kind };
  }
  function safeExternalUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
    } catch { return ""; }
  }
  function filename(name, suffix) {
    const base = String(name || "creative").replace(/\.[^/.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "creative";
    return `${base}-${suffix}.png`;
  }
  return Object.freeze({ PRESETS, RATIOS, clamp, dimensions, normalizeMargins, presetMargins, safeRect, fitRect, isInside, fileKind, validateFile, safeExternalUrl, filename });
});
