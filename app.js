/* Framekind: local-first creative layout checking. No framework or network calls.
 * See core.js for geometry and docs/GUIDE-METHODOLOGY.md for preset limitations.
 */
(function () {
  "use strict";
  const M = window.FrameMath;
  const $ = id => document.getElementById(id);
  const all = selector => [...document.querySelectorAll(selector)];
  const config = window.FRAMEKIND_CONFIG || {};
  const MAX_PIXELS = 40_000_000;
  const state = {
    platform: "reels", ratio: "9:16", mode: "single", fit: "cover",
    zoom: 1, panX: 0, panY: 0, background: "#eeeae2",
    showGuides: true, showUI: true, showGrid: false, showText: false,
    headline: "Your next great idea.", textSize: 64, textX: 46, textY: 46, textColor: "#ffffff",
    captions: { reels: "standard", tiktok: "standard", shorts: "standard" },
    overrides: {}, genericMargins: { top: 5, bottom: 5, left: 5, right: 5 },
    exportType: "preview", exportSize: 1080, loading: false, seeking: false, exporting: false
  };
  let asset = null;
  let loadGeneration = 0;
  let renderPending = false;
  let toastTimer;
  let drag = null;
  const demo = makeDemo();

  function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(Math.max(0, radius), width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r); ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height); ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function circle(ctx, x, y, r, fill) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
  }
  function makeDemo() {
    // Original, procedural artwork. No stock images or third-party asset requests.
    const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1920;
    const c = canvas.getContext("2d");
    const bg = c.createLinearGradient(0, 0, 800, 1920);
    bg.addColorStop(0, "#ebeadc"); bg.addColorStop(.5, "#e7e2c8"); bg.addColorStop(1, "#b7c1a3");
    c.fillStyle = bg; c.fillRect(0, 0, 1080, 1920);
    c.fillStyle = "#dddcca"; c.fillRect(0, 1340, 1080, 580);
    c.fillStyle = "#c1c7ad"; c.beginPath(); c.moveTo(0, 1610); c.lineTo(1080, 1240); c.lineTo(1080, 1920); c.lineTo(0, 1920); c.fill();
    // A quiet arc behind the headline.
    c.lineWidth = 2; c.strokeStyle = "#80947545";
    c.beginPath(); c.ellipse(720, 620, 520, 720, -.37, 0, Math.PI * 2); c.stroke();
    c.fillStyle = "#35523b"; c.font = "500 24px Arial, sans-serif"; c.fillText("THE SLOW STUDIO", 136, 357);
    c.fillStyle = "#294734"; c.font = "bold 146px Arial, sans-serif";
    ["Make", "some", "space."].forEach((line, i) => c.fillText(line, 129, 544 + i * 153));
    c.font = "500 27px Arial, sans-serif"; c.fillStyle = "#59684c";
    c.fillText("GOOD THINGS NEED ROOM TO GROW.", 138, 923);
    // A dimensional terracotta sphere and its soft shadow.
    c.save(); c.translate(599, 1655); c.scale(1, .23);
    const shadow = c.createRadialGradient(0, 0, 30, 0, 0, 410); shadow.addColorStop(0, "#283b3655"); shadow.addColorStop(1, "#283b3600");
    c.fillStyle = shadow; c.fillRect(-440, -440, 880, 880); c.restore();
    const orb = c.createRadialGradient(600, 1150, 8, 480, 1320, 400);
    orb.addColorStop(0, "#f4c298"); orb.addColorStop(.45, "#df956e"); orb.addColorStop(.8, "#ba6848"); orb.addColorStop(1, "#8c533d");
    circle(c, 625, 1324, 323, orb);
    // Sculptural ribbon in front.
    c.save(); c.translate(281, 1490); c.rotate(-.38);
    c.lineWidth = 103; c.strokeStyle = "#385643";
    c.beginPath(); c.ellipse(0, 0, 124, 231, 0, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 6; c.strokeStyle = "#81926a";
    c.beginPath(); c.ellipse(-28, -10, 104, 229, 0, Math.PI * 1.04, Math.PI * 1.89); c.stroke(); c.restore();
    c.fillStyle = "#f7f4e8"; roundRect(c, 141, 1740, 355, 59, 29); c.fill();
    c.fillStyle = "#52664e"; c.font = "500 22px Arial, sans-serif"; c.fillText("A FRESH PERSPECTIVE", 174, 1778);
    // Deterministic paper grain.
    let seed = 83;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 15000; i++) {
      const alpha = random() * .04;
      c.fillStyle = `rgba(35,56,38,${alpha})`; c.fillRect(random() * 1080, random() * 1920, 1.5, 1.5);
    }
    return canvas;
  }
  function marginsFor(key = state.platform, vertical = state.ratio === "9:16") {
    return vertical ? state.overrides[key] || M.presetMargins(key, state.captions[key]) : state.genericMargins;
  }
  function toast(message, error = false) {
    clearTimeout(toastTimer);
    const node = $("toast"); node.textContent = message; node.classList.toggle("error", error); node.hidden = false;
    toastTimer = setTimeout(() => { node.hidden = true; }, error ? 8000 : 4500);
  }
  function setStatus(message, error = false) {
    $("file-status").textContent = error ? message : "";
    $("stage-status").textContent = message;
  }
  function formatTime(seconds) {
    const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    return `${Math.floor(safe / 60)}:${(safe % 60).toFixed(1).padStart(4, "0")}`;
  }
  function releaseAsset(item) {
    if (!item) return;
    if (item.kind === "video") { item.element.pause(); item.element.removeAttribute("src"); item.element.load(); }
    if (item.url) URL.revokeObjectURL(item.url);
  }
  function resetCrop() {
    state.zoom = 1; state.panX = 0; state.panY = 0;
    $("zoom").value = "100"; $("pan-x").value = "0"; $("pan-y").value = "0";
  }
  function useDemo(announce = false) {
    ++loadGeneration;
    releaseAsset(asset);
    asset = { kind: "image", element: demo, width: 1080, height: 1920, name: "A little inspiration.png", demo: true };
    state.loading = false; state.seeking = false; resetCrop();
    $("file-name").textContent = asset.name;
    $("file-meta").textContent = "1080 × 1920 · demo creative";
    $("video-controls").hidden = true;
    setStatus("Demo loaded. Try your own creative."); syncControls(); requestRender();
    if (announce) toast("Demo creative restored. Your previous file was released.");
  }
  function waitForMedia(element, readyEvent, timeoutMs = 25000) {
    return new Promise((resolve, reject) => {
      let timer;
      const cleanup = () => { clearTimeout(timer); element.removeEventListener(readyEvent, success); element.removeEventListener("error", failure); };
      const success = () => { cleanup(); resolve(); };
      const failure = () => { cleanup(); reject(new Error("This browser could not decode the file. Try JPG/PNG for images, or an H.264 MP4/WebM for video.")); };
      element.addEventListener(readyEvent, success, { once: true });
      element.addEventListener("error", failure, { once: true });
      timer = setTimeout(() => { cleanup(); reject(new Error("The file took too long to open. Try a smaller or browser-compatible file.")); }, timeoutMs);
    });
  }
  async function loadFile(file) {
    if (!file) return;
    const check = M.validateFile(file);
    if (!check.ok) { setStatus(check.message, true); toast(check.message, true); return; }
    const generation = ++loadGeneration;
    state.loading = true; state.seeking = false; setStatus("Opening your file locally…"); syncBusy();
    const url = URL.createObjectURL(file);
    const element = check.kind === "video" ? document.createElement("video") : new Image();
    const nextAsset = { kind: check.kind, element, url, name: file.name };
    let installed = false;
    try {
      if (check.kind === "video") {
        element.muted = true; element.playsInline = true; element.preload = "auto";
        const ready = waitForMedia(element, "loadeddata"); element.src = url; element.load(); await ready;
        nextAsset.width = element.videoWidth; nextAsset.height = element.videoHeight;
        if (!Number.isFinite(element.duration) || element.duration <= 0) throw new Error("This video's duration is unavailable. Convert it to a seekable MP4 or WebM and try again.");
      } else {
        const ready = waitForMedia(element, "load"); element.src = url; await ready;
        nextAsset.width = element.naturalWidth; nextAsset.height = element.naturalHeight;
      }
      if (generation !== loadGeneration) return;
      if (!nextAsset.width || !nextAsset.height || nextAsset.width * nextAsset.height > MAX_PIXELS) throw new Error("This creative is too large to process safely here. Please use a version under 40 megapixels.");
      releaseAsset(asset); asset = nextAsset; installed = true; resetCrop();
      $("file-name").textContent = file.name;
      $("file-meta").textContent = `${asset.width} × ${asset.height} · ${(file.size / 1048576).toFixed(1)} MB`;
      $("video-controls").hidden = check.kind !== "video";
      if (check.kind === "video") {
        $("video-time").max = String(Math.max(0, element.duration - .05));
        $("video-time").value = "0"; $("video-time-value").textContent = `0:00.0 / ${formatTime(element.duration)}`;
        element.addEventListener("seeked", () => {
          if (asset !== nextAsset) return;
          state.seeking = false;
          $("video-time-value").textContent = `${formatTime(element.currentTime)} / ${formatTime(element.duration)}`;
          setStatus("Frame ready. Preview or export this moment."); syncBusy(); requestRender();
        });
        element.addEventListener("error", () => {
          if (asset !== nextAsset) return;
          state.seeking = false;
          const message = "This video frame could not be decoded. Try another frame or convert the video.";
          setStatus(message, true); toast(message, true); syncBusy();
        });
      }
      setStatus(check.kind === "video" ? "Video opened locally. Choose a frame below your file." : "Creative loaded. Check the edges, then make it yours.");
      toast("Opened on your device. Nothing was uploaded.");
    } catch (error) {
      if (generation === loadGeneration) { setStatus(error.message || "The file could not be opened.", true); toast(error.message || "The file could not be opened.", true); }
    } finally {
      if (!installed) releaseAsset(nextAsset);
      if (generation === loadGeneration) { state.loading = false; syncControls(); requestRender(); }
    }
  }
  function drawSource(ctx, width, height) {
    ctx.fillStyle = state.background; ctx.fillRect(0, 0, width, height);
    if (!asset || (asset.kind === "video" && asset.element.readyState < 2)) return;
    const rect = M.fitRect(asset.width, asset.height, width, height, state.fit, state.zoom, state.panX, state.panY);
    ctx.drawImage(asset.element, rect.x, rect.y, rect.width, rect.height);
  }
  function drawGuides(ctx, width, height, key, vertical, transparent = false) {
    const r = M.safeRect(width, height, marginsFor(key, vertical));
    const scale = Math.min(width, height) / 1080;
    ctx.fillStyle = transparent ? "rgba(192,108,65,.23)" : "rgba(65,70,43,.18)";
    ctx.fillRect(0, 0, width, r.y);
    ctx.fillRect(0, r.y + r.height, width, height - r.y - r.height);
    ctx.fillRect(0, r.y, r.x, r.height);
    ctx.fillRect(r.x + r.width, r.y, width - r.x - r.width, r.height);
    if (!transparent) { ctx.fillStyle = "rgba(225,242,186,.05)"; ctx.fillRect(r.x, r.y, r.width, r.height); }
    ctx.save();
    ctx.strokeStyle = transparent ? "rgba(51,105,65,.95)" : "rgba(246,255,219,.88)";
    ctx.lineWidth = 2.5 * scale; ctx.setLineDash([11 * scale, 9 * scale]);
    ctx.strokeRect(r.x, r.y, r.width, r.height); ctx.setLineDash([]);
    const corner = Math.min(29 * scale, r.width / 4, r.height / 4);
    ctx.lineWidth = 6 * scale;
    for (const [x, y, dx, dy] of [[r.x,r.y,1,1],[r.x+r.width,r.y,-1,1],[r.x,r.y+r.height,1,-1],[r.x+r.width,r.y+r.height,-1,-1]]) {
      ctx.beginPath(); ctx.moveTo(x + dx * corner, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * corner); ctx.stroke();
    }
    if (!transparent) {
      const label = vertical ? "KEEP KEY CONTENT HERE" : "CUSTOM CROP GUIDE";
      ctx.font = `600 ${20 * scale}px Arial, sans-serif`;
      const labelWidth = ctx.measureText(label).width + 24 * scale;
      if (labelWidth < r.width - 12 * scale) {
        ctx.fillStyle = "rgba(234,243,205,.92)"; roundRect(ctx, r.x + 12 * scale, r.y + 14 * scale, labelWidth, 34 * scale, 5 * scale); ctx.fill();
        ctx.fillStyle = "#4e6846"; ctx.fillText(label, r.x + 24 * scale, r.y + 37 * scale);
      }
    }
    ctx.restore();
  }
  function drawGrid(ctx, width, height) {
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.65)"; ctx.lineWidth = Math.max(1, width / 600);
    ctx.setLineDash([6, 6]); ctx.beginPath();
    for (let i = 1; i <= 2; i++) { ctx.moveTo(width * i / 3, 0); ctx.lineTo(width * i / 3, height); ctx.moveTo(0, height * i / 3); ctx.lineTo(width, height * i / 3); }
    ctx.stroke(); ctx.restore();
  }
  function drawMockIcon(ctx, type, x, y, size) {
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 24, size / 24);
    ctx.strokeStyle = "#fff"; ctx.fillStyle = "#fff"; ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath();
    if (type === "heart") {
      ctx.moveTo(12, 20); ctx.bezierCurveTo(4, 14, 0, 10, 4, 5); ctx.bezierCurveTo(7, 2, 10, 4, 12, 6); ctx.bezierCurveTo(15, 1, 21, 3, 22, 7); ctx.bezierCurveTo(24, 12, 17, 17, 12, 20);
    } else if (type === "comment") {
      ctx.moveTo(19, 16); ctx.bezierCurveTo(30, 1, -4, -4, 3, 14); ctx.lineTo(2, 21); ctx.lineTo(9, 18); ctx.bezierCurveTo(13, 20, 16, 18, 19, 16);
    } else if (type === "share") {
      ctx.moveTo(2, 10); ctx.lineTo(23, 1); ctx.lineTo(16, 23); ctx.lineTo(11, 13); ctx.closePath(); ctx.moveTo(11, 13); ctx.lineTo(23, 1);
    } else if (type === "camera") {
      roundRect(ctx, 1, 4, 22, 16, 4); ctx.stroke(); ctx.beginPath(); ctx.arc(12, 12, 5, 0, Math.PI * 2);
    } else if (type === "dots") {
      [4,12,20].forEach(px => circle(ctx, px, 12, 1.5, "#fff")); ctx.restore(); return;
    } else {
      ctx.moveTo(4, 4); ctx.lineTo(20, 4); ctx.lineTo(20, 23); ctx.lineTo(12, 18); ctx.lineTo(4, 23); ctx.closePath();
    }
    ctx.stroke(); ctx.restore();
  }
  function drawMockUI(ctx, width, height, key) {
    const s = width / 1080;
    const gradient = ctx.createLinearGradient(0, height * .65, 0, height);
    gradient.addColorStop(0, "rgba(17,30,23,0)"); gradient.addColorStop(1, "rgba(17,30,23,.5)");
    ctx.fillStyle = gradient; ctx.fillRect(0, height * .65, width, height * .35);
    const top = ctx.createLinearGradient(0, 0, 0, height * .17); top.addColorStop(0, "rgba(17,30,23,.24)"); top.addColorStop(1, "rgba(17,30,23,0)");
    ctx.fillStyle = top; ctx.fillRect(0, 0, width, height * .17);
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.2)"; ctx.shadowBlur = 3 * s;
    ctx.fillStyle = "#fff"; ctx.font = `600 ${43 * s}px Arial, sans-serif`;
    const title = key === "tiktok" ? "Following  |  For You" : key === "shorts" ? "Shorts" : "Reels";
    ctx.fillText(title, width * .062, height * .066);
    drawMockIcon(ctx, key === "reels" ? "camera" : "dots", width * .85, height * .043, 50 * s);
    const labels = ["12.8K", "128", "Share"];
    ["heart", "comment", "share"].forEach((type, i) => {
      const y = height * (.49 + i * .097);
      drawMockIcon(ctx, type, width * .867, y, 57 * s);
      ctx.font = `500 ${23 * s}px Arial, sans-serif`; ctx.textAlign = "center"; ctx.fillText(labels[i], width * .895, y + 87 * s);
    });
    drawMockIcon(ctx, "dots", width * .867, height * .783, 51 * s);
    circle(ctx, width * .094, height * .835, 28 * s, "rgba(255,255,255,.45)");
    ctx.font = `bold ${31 * s}px Arial, sans-serif`; ctx.textAlign = "left";
    ctx.fillText("@yourstudio", width * .142, height * .842);
    const count = state.captions[key] === "expanded" ? 3 : state.captions[key] === "compact" ? 1 : 2;
    ctx.font = `${28 * s}px Arial, sans-serif`;
    const captionLines = ["A little space for your next idea.", "Create something that feels like you.", "Example caption · more room to read"];
    const step = height * .023;
    captionLines.slice(0, count).forEach((line, i) => ctx.fillText(line, width * .065, height * .875 + i * step, width * .72));
    ctx.font = `${24 * s}px Arial, sans-serif`; ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.fillText("♪  Original audio · your studio", width * .065, height * .961);
    ctx.restore();
  }
  function wrapLines(ctx, text, maxWidth) {
    const lines = [];
    for (const paragraph of String(text).split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        if (ctx.measureText(word).width > maxWidth) {
          if (line) { lines.push(line); line = ""; }
          for (const char of Array.from(word)) {
            if (line && ctx.measureText(line + char).width > maxWidth) { lines.push(line); line = char; } else line += char;
          }
        } else {
          const candidate = line ? `${line} ${word}` : word;
          if (line && ctx.measureText(candidate).width > maxWidth) { lines.push(line); line = word; } else line = candidate;
        }
      }
      lines.push(line);
    }
    return lines.length ? lines : [""];
  }
  function textLayout(ctx, width, height) {
    const scale = Math.min(width, height) / 1080;
    const fontSize = state.textSize * scale, lineHeight = fontSize * 1.18, padding = 17 * scale;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    const lines = wrapLines(ctx, state.headline.slice(0, 120), width * .79);
    const lineWidth = Math.max(...lines.map(line => ctx.measureText(line).width), 0);
    const boxWidth = lineWidth + padding * 2, boxHeight = lineHeight * lines.length + padding * 2;
    return { lines, fontSize, lineHeight, padding, rect: { x: width * state.textX / 100 - boxWidth / 2, y: height * state.textY / 100 - boxHeight / 2, width: boxWidth, height: boxHeight } };
  }
  function drawText(ctx, width, height) {
    if (!state.headline.trim()) return;
    ctx.save(); const layout = textLayout(ctx, width, height), r = layout.rect;
    ctx.fillStyle = "rgba(20,35,27,.66)"; roundRect(ctx, r.x, r.y, r.width, r.height, layout.padding * .55); ctx.fill();
    ctx.fillStyle = state.textColor; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    layout.lines.forEach((line, i) => ctx.fillText(line, r.x + r.width / 2, r.y + layout.padding + layout.lineHeight * (i + .5)));
    ctx.restore();
  }
  function drawReferenceLabel(ctx, width, height, guideOnly = false) {
    const scale = Math.min(width, height) / 1080;
    const barHeight = 37 * scale;
    ctx.fillStyle = guideOnly ? "rgba(30,72,45,.9)" : "rgba(25,45,33,.88)";
    ctx.fillRect(0, height - barHeight, width, barHeight);
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `${18 * scale}px Arial, sans-serif`;
    ctx.fillText("FRAMEKIND · ILLUSTRATIVE LAYOUT REFERENCE", width / 2, height - barHeight / 2);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  }
  function renderScene(ctx, width, height, key, options = {}) {
    const { kind = "preview", exportLabel = false, vertical = state.ratio === "9:16" } = options;
    ctx.save(); ctx.clearRect(0, 0, width, height); ctx.beginPath(); ctx.rect(0, 0, width, height); ctx.clip();
    if (kind !== "guide") drawSource(ctx, width, height);
    if (kind !== "clean") {
      if (kind === "guide" || state.showGuides) drawGuides(ctx, width, height, key, vertical, kind === "guide");
      if (kind !== "guide" && vertical && state.showUI) drawMockUI(ctx, width, height, key);
      if (kind !== "guide" && state.showGrid) drawGrid(ctx, width, height);
      if (kind !== "guide" && state.showText) drawText(ctx, width, height);
      if (exportLabel) drawReferenceLabel(ctx, width, height, kind === "guide");
    }
    ctx.restore();
  }
  function requestRender() {
    if (renderPending) return;
    renderPending = true;
    requestAnimationFrame(() => { renderPending = false; render(); });
  }
  function comparisonDimensions(shortEdge) {
    const width = Math.min(shortEdge, 1080), height = Math.round(width * 16 / 9);
    const gap = Math.round(width / 27), header = Math.round(width * .11);
    return { cellWidth: width, cellHeight: height, gap, header, width: width * 3 + gap * 4, height: height + header + gap * 2 };
  }
  function updateExportNote() {
    const d = state.exportType === "comparison" ? comparisonDimensions(state.exportSize) : M.dimensions(state.ratio, state.exportSize);
    $("export-note").textContent = `${d.width} × ${d.height} px · ${state.exportType === "comparison" ? "9:16 layouts · max 1080 px each" : "free, no signup"}`;
    $("export-size").querySelector('option[value="2160"]').disabled = state.exportType === "comparison";
  }
  function render() {
    if (!asset) return;
    const vertical = state.ratio === "9:16";
    const canvas = $("preview");
    if (state.mode === "single") {
      const ratio = M.RATIOS[state.ratio];
      const parentWidth = $("preview-stage").clientWidth || 380;
      const maxHeight = window.innerWidth >= 1500 ? 480 : 448;
      const availableWidth = Math.max(120, parentWidth - 58);
      const displayHeight = Math.min(maxHeight, availableWidth * ratio.height / ratio.width);
      const displayWidth = displayHeight * ratio.width / ratio.height;
      const pixelWidth = Math.round(displayWidth * 2), pixelHeight = Math.round(displayHeight * 2);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight; }
      canvas.style.width = `${displayWidth}px`; canvas.style.height = `${displayHeight}px`;
      renderScene(canvas.getContext("2d"), canvas.width, canvas.height, state.platform);
    } else {
      for (const key of Object.keys(M.PRESETS)) {
        const mini = $("compare-" + key); renderScene(mini.getContext("2d"), mini.width, mini.height, key, { vertical: true });
      }
    }
    $("zoom-value").textContent = `${Math.round(state.zoom * 100)}%`;
    $("pan-x-value").textContent = String(Math.round(state.panX)); $("pan-y-value").textContent = String(Math.round(state.panY));
    $("text-size-value").textContent = String(state.textSize);
    $("text-x-value").textContent = `${state.textX}%`; $("text-y-value").textContent = `${state.textY}%`;
    $("canvas-size").textContent = `${M.RATIOS[state.ratio].width} × ${M.RATIOS[state.ratio].height}`;
    document.querySelector(".preview-badge").hidden = !state.showGuides;
    document.querySelector(".preview-badge").textContent = vertical ? "ESTIMATED SAFE ZONE" : "CUSTOM CROP GUIDE";
    if (state.showText) {
      const ctx = canvas.getContext("2d"), d = M.RATIOS[state.ratio];
      ctx.save(); const textBox = textLayout(ctx, d.width, d.height).rect; ctx.restore();
      const keys = state.mode === "compare" ? Object.keys(M.PRESETS) : [state.platform];
      const outside = keys.filter(key => !M.isInside(textBox, M.safeRect(d.width, d.height, marginsFor(key, vertical))));
      const warning = $("text-warning");
      warning.classList.toggle("warning", outside.length > 0);
      warning.textContent = !state.headline.trim() ? "Add a headline to check its position." : outside.length ? (state.mode === "compare" ? `Outside the chosen guide: ${outside.map(key => M.PRESETS[key].short).join(", ")}.` : "Your test headline extends beyond the chosen guide.") : "Test headline is inside the chosen guide. Verify in the real app.";
    }
    updateExportNote(); syncBusy();
  }
  function syncBusy() {
    const busy = state.loading || state.seeking || state.exporting;
    $("download").disabled = busy || !asset;
    $("download-label").textContent = state.exporting ? "Preparing your PNG…" : state.loading ? "Opening creative…" : state.seeking ? "Loading frame…" : "Download PNG";
    $("workspace").setAttribute("aria-busy", String(busy));
  }
  function syncMargins() {
    const margins = marginsFor();
    for (const side of ["top", "bottom", "left", "right"]) $("margin-" + side).value = String(margins[side]);
    $("margin-info").textContent = state.ratio !== "9:16" ? "Custom crop buffer · no platform claims" : state.overrides[state.platform] ? "Custom margins · not platform-certified" : "Estimated preset · not platform-certified";
  }
  function syncControls() {
    all("[data-platform]").forEach(button => { const active = button.dataset.platform === state.platform; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); button.disabled = state.ratio !== "9:16"; });
    all("[data-ratio]").forEach(button => { const active = button.dataset.ratio === state.ratio; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); });
    const compare = state.mode === "compare";
    $("single-mode").classList.toggle("active", !compare); $("single-mode").setAttribute("aria-pressed", String(!compare));
    $("compare-mode").classList.toggle("active", compare); $("compare-mode").setAttribute("aria-pressed", String(compare));
    $("preview-stage").hidden = compare; $("compare-stage").hidden = !compare;
    $("canvas-help").textContent = compare ? "Same creative. Three illustrative layouts. Adjust individual margins with the platform tabs." : "Drag to reposition · arrow keys to fine-tune";
    $("generic-note").hidden = state.ratio === "9:16";
    $("caption-room").disabled = state.ratio !== "9:16"; $("caption-room").value = state.captions[state.platform];
    $("show-ui").disabled = state.ratio !== "9:16";
    $("fit-mode").value = state.fit; $("zoom").value = String(Math.round(state.zoom * 100));
    $("pan-x").value = String(state.panX); $("pan-y").value = String(state.panY); $("background").value = state.background;
    for (const [id, key] of [["show-guides","showGuides"],["show-ui","showUI"],["show-grid","showGrid"],["show-text","showText"]]) $(id).checked = state[key];
    $("text-controls").hidden = !state.showText;
    $("headline").value = state.headline; $("text-size").value = String(state.textSize);
    $("text-x").value = String(state.textX); $("text-y").value = String(state.textY); $("text-color").value = state.textColor;
    $("export-type").value = state.exportType; $("export-size").value = String(state.exportSize);
    syncMargins(); updateExportNote(); syncBusy();
  }
  async function exportPNG() {
    if (state.loading || state.seeking || state.exporting || !asset) return;
    state.exporting = true; syncBusy();
    const canvas = document.createElement("canvas");
    const exportName = asset.name, exportKind = state.exportType, exportRatio = state.ratio, exportPlatform = state.platform;
    try {
      if (asset.kind === "video" && asset.element.readyState < 2) throw new Error("The selected frame is not ready. Choose another frame and try again.");
      if (state.exportType === "comparison") {
        const d = comparisonDimensions(state.exportSize); canvas.width = d.width; canvas.height = d.height;
        const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Your browser could not allocate an export canvas. Try a smaller size.");
        ctx.fillStyle = "#f3f4ed"; ctx.fillRect(0, 0, d.width, d.height);
        Object.keys(M.PRESETS).forEach((key, index) => {
          const x = d.gap + (d.cellWidth + d.gap) * index;
          ctx.fillStyle = "#294c39"; ctx.font = `bold ${Math.round(d.cellWidth * .035)}px Arial, sans-serif`;
          ctx.fillText(M.PRESETS[key].name, x, d.header * .63);
          ctx.save(); ctx.translate(x, d.header); renderScene(ctx, d.cellWidth, d.cellHeight, key, { vertical: true }); ctx.restore();
        });
        ctx.fillStyle = "#627557"; ctx.font = `${Math.round(d.cellWidth * .02)}px Arial, sans-serif`;
        ctx.fillText("FRAMEKIND · Illustrative layout references, not official platform specifications. Verify in the real app.", d.gap, d.height - d.gap * .65);
      } else {
        const d = M.dimensions(state.ratio, state.exportSize); canvas.width = d.width; canvas.height = d.height;
        const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Your browser could not allocate an export canvas. Try a smaller size.");
        renderScene(ctx, d.width, d.height, state.platform, { kind: state.exportType, exportLabel: state.exportType !== "clean" });
      }
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(value => value ? resolve(value) : reject(new Error("The PNG could not be created. Try a smaller export size.")), "image/png");
      });
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      const suffix = `${exportKind === "comparison" ? "all-platforms" : exportRatio === "9:16" ? exportPlatform : exportRatio.replace(":", "x")}-${exportKind}`;
      link.href = url; link.download = M.filename(exportName, suffix); link.hidden = true;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast("Your PNG is ready. Thanks for creating with Framekind!");
    } catch (error) {
      toast(error.message || "Export failed. Try a smaller resolution or a different file.", true);
    } finally {
      canvas.width = 1; canvas.height = 1;
      state.exporting = false; syncBusy();
    }
  }

  // Safe, public configuration. Unconfigured donation links never send money anywhere.
  const developerName = typeof config.developerName === "string" && config.developerName.trim() ? config.developerName.slice(0, 80) : "the developer";
  all("[data-developer]").forEach(node => { node.textContent = developerName; });
  $("year").textContent = String(new Date().getFullYear());
  const donationUrl = M.safeExternalUrl(config.donationUrl);
  if (donationUrl) {
    $("donation-link").href = donationUrl; $("donation-link").hidden = false;
    $("donation-label").textContent = typeof config.donationLabel === "string" && config.donationLabel.trim() ? config.donationLabel.slice(0, 50) : "Support my work";
    $("donation-unconfigured").hidden = true; $("donation-setup-note").hidden = true;
  }
  const repositoryUrl = M.safeExternalUrl(config.repositoryUrl);
  if (repositoryUrl) { $("source-link").href = repositoryUrl; $("source-link").hidden = false; }

  // Plain links only: no affiliate SDKs, remote embeds, or tracking scripts.
  if (Array.isArray(config.recommendedTools)) {
    for (const tool of config.recommendedTools.slice(0, 6)) {
      if (!tool || typeof tool.name !== "string" || !tool.name.trim()) continue;
      const url = M.safeExternalUrl(tool.url); if (!url) continue;
      const card = document.createElement("article");
      const badge = document.createElement("span"); badge.className = "partner-badge"; badge.textContent = "PARTNER LINK";
      const heading = document.createElement("h3"); heading.textContent = tool.name.slice(0, 70);
      const description = document.createElement("p"); description.textContent = typeof tool.description === "string" ? tool.description.slice(0, 220) : "Explore this tool for your creative workflow.";
      const link = document.createElement("a"); link.href = url; link.target = "_blank"; link.rel = "sponsored noopener noreferrer"; link.textContent = "Explore " + tool.name.slice(0, 50) + " \u2197";
      card.append(badge, heading, description, link); $("partner-cards").append(card);
    }
    $("recommendations").hidden = $("partner-cards").children.length === 0;
  }

  $("upload-button").addEventListener("click", () => $("file-input").click());
  $("file-input").addEventListener("change", event => { loadFile(event.target.files[0]); event.target.value = ""; });
  const dropzone = $("upload-button"); let dragDepth = 0;
  dropzone.addEventListener("dragenter", event => { event.preventDefault(); ++dragDepth; dropzone.classList.add("is-dragover"); });
  dropzone.addEventListener("dragover", event => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; });
  dropzone.addEventListener("dragleave", event => { event.preventDefault(); if (--dragDepth <= 0) { dragDepth = 0; dropzone.classList.remove("is-dragover"); } });
  dropzone.addEventListener("drop", event => { event.preventDefault(); dragDepth = 0; dropzone.classList.remove("is-dragover"); loadFile(event.dataTransfer.files[0]); });
  // Prevent an accidental file drop elsewhere from navigating away from the editor.
  window.addEventListener("dragover", event => { if ([...(event.dataTransfer?.types || [])].includes("Files")) event.preventDefault(); });
  window.addEventListener("drop", event => { if ([...(event.dataTransfer?.types || [])].includes("Files")) event.preventDefault(); });
  $("use-demo").addEventListener("click", () => useDemo(true));
  $("reset-all").addEventListener("click", () => {
    Object.assign(state, { platform:"reels", ratio:"9:16", mode:"single", fit:"cover", background:"#eeeae2", showGuides:true, showUI:true, showGrid:false, showText:false, headline:"Your next great idea.", textSize:64, textX:46, textY:46, textColor:"#ffffff", captions:{reels:"standard",tiktok:"standard",shorts:"standard"}, overrides:{}, genericMargins:{top:5,bottom:5,left:5,right:5}, exportType:"preview", exportSize:1080 });
    useDemo(false); toast("Workspace reset. Back to a fresh start.");
  });
  all("[data-ratio]").forEach(button => button.addEventListener("click", () => { state.ratio = button.dataset.ratio; if (state.ratio !== "9:16") state.mode = "single"; resetCrop(); syncControls(); requestRender(); }));
  all("[data-platform]").forEach(button => button.addEventListener("click", () => { state.platform = button.dataset.platform; syncControls(); requestRender(); }));
  $("single-mode").addEventListener("click", () => { state.mode = "single"; syncControls(); requestRender(); });
  $("compare-mode").addEventListener("click", () => {
    if (state.ratio !== "9:16") { state.ratio = "9:16"; resetCrop(); toast("Comparison uses a vertical 9:16 canvas."); }
    state.mode = "compare"; syncControls(); requestRender();
  });
  $("fit-mode").addEventListener("change", event => { state.fit = event.target.value; resetCrop(); requestRender(); });
  for (const [id, key, factor] of [["zoom","zoom",.01],["pan-x","panX",1],["pan-y","panY",1],["text-size","textSize",1],["text-x","textX",1],["text-y","textY",1]]) {
    $(id).addEventListener("input", event => { state[key] = Number(event.target.value) * factor; requestRender(); });
  }
  for (const [id, key] of [["background","background"],["headline","headline"],["text-color","textColor"]]) $(id).addEventListener("input", event => { state[key] = event.target.value; requestRender(); });
  for (const [id, key] of [["show-guides","showGuides"],["show-ui","showUI"],["show-grid","showGrid"],["show-text","showText"]]) {
    $(id).addEventListener("change", event => { state[key] = event.target.checked; $("text-controls").hidden = !state.showText; requestRender(); });
  }
  $("caption-room").addEventListener("change", event => { state.captions[state.platform] = event.target.value; delete state.overrides[state.platform]; syncMargins(); requestRender(); });
  for (const side of ["top","bottom","left","right"]) $("margin-" + side).addEventListener("change", event => {
    const margins = { ...marginsFor(), [side]: M.clamp(event.target.value, 0, 40) };
    if (state.ratio === "9:16") state.overrides[state.platform] = margins; else state.genericMargins = margins;
    syncMargins(); requestRender();
  });
  $("reset-margins").addEventListener("click", () => { if (state.ratio === "9:16") delete state.overrides[state.platform]; else state.genericMargins = { top:5,bottom:5,left:5,right:5 }; syncMargins(); requestRender(); });
  $("video-time").addEventListener("input", event => {
    if (asset?.kind !== "video" || state.loading) return;
    const target = M.clamp(event.target.value, 0, Math.max(0, asset.element.duration - .05));
    if (Math.abs(asset.element.currentTime - target) < .025) return;
    state.seeking = true; syncBusy();
    $("video-time-value").textContent = `${formatTime(target)} / ${formatTime(asset.element.duration)}`;
    asset.element.currentTime = target;
  });
  $("export-type").addEventListener("change", event => { state.exportType = event.target.value; if (state.exportType === "comparison" && state.exportSize > 1080) { state.exportSize = 1080; $("export-size").value = "1080"; } updateExportNote(); });
  $("export-size").addEventListener("change", event => { state.exportSize = M.clamp(event.target.value, 720, state.exportType === "comparison" ? 1080 : 2160); updateExportNote(); });
  $("download").addEventListener("click", exportPNG);

  // Canvas drag and keyboard panning; sliders offer an alternative on every device.
  const canvas = $("preview");
  canvas.addEventListener("pointerdown", event => {
    if (event.button !== 0 || !asset) return;
    canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId);
    drag = { x:event.clientX, y:event.clientY, panX:state.panX, panY:state.panY };
  });
  canvas.addEventListener("pointermove", event => {
    if (!drag || !asset) return;
    const box = canvas.getBoundingClientRect();
    const rect = M.fitRect(asset.width, asset.height, box.width, box.height, state.fit, state.zoom, drag.panX, drag.panY);
    if (rect.travelX > .5) state.panX = M.clamp(drag.panX + (event.clientX - drag.x) / rect.travelX * 100, -100, 100);
    if (rect.travelY > .5) state.panY = M.clamp(drag.panY + (event.clientY - drag.y) / rect.travelY * 100, -100, 100);
    $("pan-x").value = String(state.panX); $("pan-y").value = String(state.panY); requestRender();
  });
  for (const event of ["pointerup","pointercancel","lostpointercapture"]) canvas.addEventListener(event, () => { drag = null; });
  canvas.addEventListener("keydown", event => {
    if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key)) return;
    event.preventDefault(); const step = event.shiftKey ? 10 : 2;
    if (event.key === "ArrowLeft") state.panX = M.clamp(state.panX - step, -100, 100);
    if (event.key === "ArrowRight") state.panX = M.clamp(state.panX + step, -100, 100);
    if (event.key === "ArrowUp") state.panY = M.clamp(state.panY - step, -100, 100);
    if (event.key === "ArrowDown") state.panY = M.clamp(state.panY + step, -100, 100);
    $("pan-x").value = String(state.panX); $("pan-y").value = String(state.panY); requestRender();
  });
  const dialog = $("privacy-dialog");
  all("[data-open-privacy]").forEach(button => button.addEventListener("click", () => dialog.showModal()));
  $("close-privacy").addEventListener("click", () => dialog.close()); $("privacy-done").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  window.addEventListener("resize", requestRender);
  if ("ResizeObserver" in window) new ResizeObserver(requestRender).observe($("preview-panel") || document.querySelector(".preview-panel"));
  window.addEventListener("beforeunload", () => { ++loadGeneration; releaseAsset(asset); });
  useDemo();
})();
