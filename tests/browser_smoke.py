"""Browser smoke tests; runtime has no Python dependency.

Normal use (after installing Playwright, its Chromium browser, and Pillow):
    python tests/browser_smoke.py

The in-memory test mode is for restricted test environments that prohibit browser
URL navigation. It injects the SAME local CSS/JS into a blank page, with CSP bypassed
only in the test context. It does NOT verify HTTP navigation/CSP enforcement.
    FRAMEKIND_TEST_IN_MEMORY=1 CHROMIUM_PATH=/usr/bin/chromium python tests/browser_smoke.py
"""
from __future__ import annotations
import contextlib
import functools
import http.server
import io
import json
import os
from pathlib import Path
import re
import tempfile
import threading
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
MEMORY = os.getenv("FRAMEKIND_TEST_IN_MEMORY") == "1"
OUT = Path(os.getenv("FRAMEKIND_TEST_OUTPUT", str(ROOT / "test-results")))
OUT.mkdir(parents=True, exist_ok=True)
RESULTS = []
ERRORS = []
EXTERNAL_REQUESTS = []


def check(name, condition=True):
    if not condition:
        raise AssertionError(name)
    RESULTS.append({"test": name, "status": "PASS"})
    print("PASS", name, flush=True)


def set_range(page, selector, value):
    page.locator(selector).evaluate("(el, value) => {el.value = String(value); el.dispatchEvent(new Event('input', {bubbles:true}));}", value)
    page.wait_for_timeout(80)


def load_site(page, base, config=None):
    if MEMORY:
        html = (ROOT / "index.html").read_text()
        html = re.sub(r'<script\b[^>]*\bsrc="[^"]+"[^>]*>\s*</script>', '', html)
        html = re.sub(r'<link\b[^>]*\brel="(?:stylesheet|icon)"[^>]*>', '', html)
        page.set_content(html, wait_until="domcontentloaded")
        page.add_style_tag(content=(ROOT / "styles.css").read_text())
        page.add_script_tag(content=config or (ROOT / "config.js").read_text())
        page.add_script_tag(content=(ROOT / "core.js").read_text())
        page.add_script_tag(content=(ROOT / "app.js").read_text())
    else:
        if config:
            page.route("**/config.js", lambda route: route.fulfill(status=200, content_type="text/javascript", body=config))
        page.goto(base + "/framekind/", wait_until="networkidle")
    expect(page.locator("#download")).to_be_enabled()
    page.wait_for_timeout(150)


def png_download(page, name):
    with page.expect_download(timeout=15000) as event:
        page.locator("#download").click()
    item = event.value
    path = OUT / name
    item.save_as(path)
    check("download succeeds: " + name, item.failure() is None)
    return Image.open(path).convert("RGBA")


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


# Host the repository at a subpath to catch root-relative asset regressions.
# The temporary directory only contains a symlink to our source directory.
with tempfile.TemporaryDirectory() as tmp:
    os.symlink(ROOT, Path(tmp) / "framekind", target_is_directory=True)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=tmp))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{server.server_port}"
    try:
        with sync_playwright() as p:
            launch = {"headless": True}
            if os.getenv("CHROMIUM_PATH"):
                launch["executable_path"] = os.environ["CHROMIUM_PATH"]
                launch["args"] = ["--no-sandbox"]
            browser = p.chromium.launch(**launch)
            context = browser.new_context(viewport={"width":1440,"height":1100}, bypass_csp=MEMORY, accept_downloads=True)
            page = context.new_page()
            page.on("pageerror", lambda error: ERRORS.append(str(error)))
            page.on("console", lambda msg: ERRORS.append(msg.text) if msg.type == "error" else None)
            page.on("request", lambda request: EXTERNAL_REQUESTS.append(request.url) if request.url.startswith(("http://", "https://")) and not request.url.startswith(base) else None)
            load_site(page, base)
            check("initial demo and enabled PNG export", "demo creative" in page.locator("#file-meta").inner_text())
            check("donation is disabled until configured", page.locator("#donation-unconfigured").is_disabled() and page.locator("#donation-link").is_hidden())
            check("partner section hidden without real links", page.locator("#recommendations").is_hidden())
            # Track only media object URLs, not temporary export Blobs.
            page.evaluate("""() => {
              window.__liveFileUrls = new Set();
              const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
              URL.createObjectURL = obj => { const url = create(obj); if(obj instanceof File) window.__liveFileUrls.add(url); return url; };
              URL.revokeObjectURL = url => {window.__liveFileUrls.delete(url); return revoke(url);};
            }""")
            page.locator("#file-input").set_input_files(ROOT / "tests/fixtures/sample.png")
            expect(page.locator("#file-name")).to_have_text("sample.png")
            expect(page.locator("#download")).to_be_enabled()
            check("local raster image loads with original dimensions", "1200 × 800" in page.locator("#file-meta").inner_text())
            check("only one live file object URL", page.evaluate("window.__liveFileUrls.size") == 1)
            page.locator("#export-size").select_option("720")
            page.locator("#export-type").select_option("clean")
            clean = png_download(page, "clean.png")
            check("vertical clean PNG resolution", clean.size == (720,1280))
            check("clean center pixel matches uploaded image", clean.getpixel((360,700))[:3] == (23,96,64))
            page.locator("#export-type").select_option("preview")
            preview = png_download(page, "reference.png")
            check("preview contains overlays excluded from clean PNG", ImageChops.difference(preview.convert("RGB"),clean.convert("RGB")).getbbox() is not None)
            page.locator("#export-type").select_option("guide")
            guide = png_download(page, "transparent-guide.png")
            check("guide center is truly transparent", guide.getpixel((360,600))[3] == 0)
            check("guide edge retains translucent shading", 0 < guide.getpixel((10,10))[3] < 255)
            page.locator("#fit-mode").select_option("contain")
            page.locator("#export-type").select_option("clean")
            contain = png_download(page, "contain.png")
            check("contain creates chosen canvas background", contain.getpixel((360,5))[:3] == (238,234,226))
            page.locator('[data-ratio="1:1"]').click()
            check("non-vertical canvas disables platform mockups", page.locator("#show-ui").is_disabled() and page.locator("#generic-note").is_visible())
            square = png_download(page, "square.png")
            check("square export resolution", square.size == (720,720))
            page.locator("#compare-mode").click()
            check("comparison switches to vertical", page.locator('[data-ratio="9:16"]').get_attribute("aria-pressed") == "true")
            check("three comparison canvases visible", all(page.locator("#compare-"+key).is_visible() for key in ("reels","tiktok","shorts")))
            page.locator("#export-type").select_option("comparison")
            sheet = png_download(page, "comparison.png")
            check("comparison sheet contains expected three-cell geometry", sheet.size == (2268,1413))
            check("largest comparison size correctly disabled", page.locator('#export-size option[value="2160"]').is_disabled())
            page.locator("#single-mode").click()
            page.locator("#fit-mode").select_option("cover")
            set_range(page, "#zoom", 130)
            check("zoom output updates", page.locator("#zoom-value").inner_text() == "130%")
            box=page.locator("#preview").bounding_box()
            page.mouse.move(box["x"]+box["width"]*.5,box["y"]+box["height"]*.5)
            page.mouse.down(); page.mouse.move(box["x"]+box["width"]*.5+25,box["y"]+box["height"]*.5); page.mouse.up()
            check("dragging repositions the image", float(page.locator("#pan-x").input_value())>0)
            before=float(page.locator("#pan-x").input_value())
            page.locator("#preview").press("ArrowLeft")
            check("keyboard panning works", float(page.locator("#pan-x").input_value()) < before)
            page.locator(".margin-controls summary").click()
            page.locator("#margin-top").fill("30"); page.locator("#margin-top").press("Tab")
            check("custom guide margins applied", page.locator("#margin-top").input_value()=="30")
            page.locator('[data-platform="tiktok"]').click()
            check("platform presets remain independent", page.locator("#margin-top").input_value()=="13")
            page.locator('[data-platform="reels"]').click()
            check("custom margins persist while switching platform", page.locator("#margin-top").input_value()=="30")
            page.locator("#caption-room").select_option("expanded")
            check("caption preset intentionally restores preset margins", page.locator("#margin-top").input_value()=="12" and page.locator("#margin-bottom").input_value()=="28")
            page.locator("#show-text").check()
            set_range(page,"#text-y",98)
            check("headline overlap warning", "beyond" in page.locator("#text-warning").inner_text())
            set_range(page,"#text-y",46)
            page.locator("#headline").fill("Hello creator")
            page.wait_for_timeout(100)
            check("headline inside-guide message", "inside" in page.locator("#text-warning").inner_text())
            page.locator("#show-guides").uncheck(); page.wait_for_timeout(80)
            check("guide toggle hides on-canvas badge", page.locator(".preview-badge").is_hidden())
            page.locator("#show-ui").uncheck(); page.locator("#show-grid").check()
            check("independent UI and grid switches", not page.locator("#show-ui").is_checked() and page.locator("#show-grid").is_checked())
            # Unsupported content does not replace the existing creative.
            page.locator("#file-input").set_input_files({"name":"unsafe.svg","mimeType":"image/svg+xml","buffer":b'<svg xmlns="http://www.w3.org/2000/svg"/>'})
            check("SVG upload rejected while preserving current media", "not supported" in page.locator("#file-status").inner_text() and page.locator("#file-name").inner_text()=="sample.png")
            page.locator("#file-input").set_input_files({"name":"broken.png","mimeType":"image/png","buffer":b'not an image'})
            expect(page.locator("#file-status")).to_contain_text("could not decode")
            check("corrupt image fails safely and does not leak object URL", page.evaluate("window.__liveFileUrls.size")==1)
            page.locator("#file-input").set_input_files(ROOT/"tests/fixtures/sample.webm")
            expect(page.locator("#file-name")).to_have_text("sample.webm")
            expect(page.locator("#download")).to_be_enabled()
            check("WebM frame preview loads",page.locator("#video-controls").is_visible())
            first=page.locator("#preview").evaluate("c => c.toDataURL()")
            set_range(page,"#video-time",1.2)
            expect(page.locator("#download")).to_be_enabled()
            page.wait_for_timeout(120)
            second=page.locator("#preview").evaluate("c => c.toDataURL()")
            check("video seeking changes the preview frame",first!=second and "0:01.2" in page.locator("#video-time-value").inner_text())
            page.locator("#export-type").select_option("clean")
            video=png_download(page,"video-frame.png")
            check("video frame exports to PNG",video.size==(720,1280))
            page.locator("#reset-all").click()
            check("reset releases uploaded media",page.evaluate("window.__liveFileUrls.size")==0)
            check("reset restores settings and demo",page.locator("#show-ui").is_checked() and not page.locator("#show-text").is_checked() and page.locator("#file-name").inner_text()=="A little inspiration.png")
            page.locator("button[data-open-privacy]").last.click()
            check("privacy dialog opens",page.locator("#privacy-dialog").is_visible())
            page.keyboard.press("Escape")
            check("privacy dialog closes with Escape",page.locator("#privacy-dialog").is_hidden())
            # Exercise all layout breakpoints, including narrow phones.
            for width in (1440,1280,1024,900,768,740,390,360,320):
                page.set_viewport_size({"width":width,"height":1000})
                page.wait_for_timeout(100)
                check(f"no horizontal overflow at {width}px",page.evaluate("document.documentElement.scrollWidth <= innerWidth"))
            page.set_viewport_size({"width":1440,"height":1100});page.wait_for_timeout(120)
            page.evaluate("scrollTo(0,0)")
            page.screenshot(path=str(OUT/"desktop.png"),full_page=True)
            page.set_viewport_size({"width":390,"height":844});page.wait_for_timeout(120)
            page.evaluate("scrollTo(0,0)")
            page.screenshot(path=str(OUT/"mobile.png"),full_page=True)
            check("form controls have labels",page.evaluate("[...document.querySelectorAll('input,select,textarea')].every(e => e.labels.length || e.getAttribute('aria-label'))"))
            check("tool did not make third-party HTTP requests",len(EXTERNAL_REQUESTS)==0)
            # Dedicated configuration test: safe URLs, plain-text rendering, and disclosures.
            custom=browser.new_context(viewport={"width":1440,"height":1000},bypass_csp=MEMORY)
            configured=custom.new_page()
            configured.on("pageerror",lambda error:ERRORS.append(str(error)))
            cfg='window.FRAMEKIND_CONFIG='+json.dumps({"developerName":"Karthik","donationUrl":"https://example.org/support","donationLabel":"Support my work","repositoryUrl":"https://example.org/source","recommendedTools":[{"name":"Helpful editor","description":"<script>alert(1)</script>","url":"https://example.org/partner"},{"name":"Unsafe link","url":"javascript:alert(1)"}]})+';'
            load_site(configured,base,cfg)
            check("real HTTPS support URL activates button",configured.locator("#donation-link").is_visible() and configured.locator("#donation-link").get_attribute("href")=="https://example.org/support")
            check("support checkout opens externally and safely",configured.locator("#donation-link").get_attribute("target")=="_blank" and "noopener" in configured.locator("#donation-link").get_attribute("rel"))
            check("unconfigured support notice is removed",configured.locator("#donation-unconfigured").is_hidden() and configured.locator("#donation-setup-note").is_hidden())
            check("unsafe partner links are skipped",configured.locator("#partner-cards article").count()==1)
            check("affiliate disclosure and sponsored relation",configured.locator(".affiliate-disclosure").is_visible() and "sponsored" in configured.locator("#partner-cards a").get_attribute("rel"))
            check("partner copy cannot inject HTML",configured.locator("#partner-cards script").count()==0 and "<script>" in configured.locator("#partner-cards p").inner_text())
            custom.close()
            # Large output path (raster canvas), separate from comparison memory cap.
            page.locator('[data-ratio="16:9"]').click();page.locator("#export-type").select_option("clean");page.locator("#export-size").select_option("2160")
            large=png_download(page,"large-wide.png")
            check("large landscape output is 3840x2160",large.size==(3840,2160))
            check("no JavaScript runtime errors",len(ERRORS)==0)
            browser.close()
    finally:
        server.shutdown();server.server_close()

report={"mode":"in-memory HTML/CSS/JS; CSP bypassed for test" if MEMORY else "HTTP repository subpath with shipped CSP", "results":RESULTS,"runtime_errors":ERRORS,"unexpected_http_requests":EXTERNAL_REQUESTS}
(OUT/"browser-results.json").write_text(json.dumps(report,indent=2))
print(f"\n{len(RESULTS)} browser assertions passed. Results: {OUT}")
