// Usage: node tools/build-result-pages.mjs [--images]
// HTML is always rebuilt; JPEGs are regenerated only with --images.
import assert from 'node:assert/strict';
import { mkdir, readFile, realpath, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser } from './lib/chromium.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
assert(args.every(arg => arg === '--images'), 'Usage: node tools/build-result-pages.mjs [--images]');
const images = args.includes('--images');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll("'", '&#39;');
async function writeChanged(path, bytes) {
  const content = Buffer.from(bytes);
  try { if ((await readFile(path)).equals(content)) return; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const temporary = `${path}.tmp-${process.pid}`;
  await writeFile(temporary, content);
  await rename(temporary, path);
}

// No additional CSS. Preserve the live family-map color before rebasing the
// href selectors, and reuse the existing share-actions/primary layout for the CTA.

const browser = await openBrowser(root);
try {
  await browser.navigate('/index.html');
  const source = await browser.evaluate(`(async () => {
    await document.fonts.ready;
    const rebase = root => {
      for (const image of root.querySelectorAll('[src]')) {
        const src = image.getAttribute('src');
        if (src.startsWith('images/')) image.setAttribute('src', '../' + src);
      }
      for (const link of root.querySelectorAll('a[href]')) {
        const href = link.getAttribute('href');
        if (href.startsWith('#type/')) {
          const code = href.slice(6);
          if (!Object.hasOwn(TYPES, code)) throw new Error('Unknown linked type: ' + code);
          link.setAttribute('href', code.toLowerCase() + '.html');
        } else if (href.startsWith('#')) link.setAttribute('href', '../index.html' + href);
      }
      return root;
    };
    const clone = selector => rebase(document.querySelector(selector).cloneNode(true)).outerHTML;
    const entries = Object.keys(TYPES).sort().map(code => {
      const container = document.createElement('div');
      container.hidden = true;
      container.innerHTML = detailHTML(code, false);
      document.body.append(container);
      const article = container.querySelector('article');
      // Existing CSS uses :has(a[href^="#type/..."]). Capture its exact color
      // before these links become static filenames; do not invent a second palette.
      for (const group of article.querySelectorAll('.family-map-group')) {
        const color = getComputedStyle(group).getPropertyValue('--map-color').trim();
        if (color) group.style.setProperty('--map-color', color);
      }
      container.remove();
      const actions = article.querySelector('.actions');
      const start = document.createElement('a');
      start.className = 'button primary';
      start.setAttribute('href', '../index.html');
      start.textContent = '自分のタイプを診断する';
      const top = document.createElement('div');
      top.className = 'share-actions';
      top.append(start);
      article.querySelector('.result-hero').after(top);
      const detail = document.createElement('a');
      detail.className = 'button';
      detail.setAttribute('href', '../index.html#type/' + code);
      detail.textContent = '詳しく見る';
      actions.replaceChildren(start.cloneNode(true), detail, actions.querySelector('.types-link'));
      rebase(article);
      return { code, url: shareUrlFor(code), friend: companionCode(code), pairLine: pairLine(code), html: article.outerHTML };
    });
    return { types: TYPES, families: FAMILIES, axes: AXES, pairLines: PAIR_LINES,
      styles: [...document.querySelectorAll('style')].map(style => style.textContent).join('\\n'),
      drift: clone('.v16-drift'), masthead: clone('.masthead'), footer: clone('footer'), entries };
  })()`);
  assert.equal(source.entries.length, 16);
  assert.equal(source.axes.length, 4);
  assert(source.entries.every(({ code }) => code.length === 4
    && source.axes.every((axis, index) => axis.poles.includes(code[index]))));
  await mkdir(resolve(root, 'r'), { recursive: true });
  await mkdir(resolve(root, 'images/share'), { recursive: true });
  for (const entry of source.entries) {
    const type = source.types[entry.code];
    assert(source.families[entry.code.slice(0, 2)]);
    assert.equal(source.pairLines[[entry.code, entry.friend].sort().join('-')], entry.pairLine);
    const title = `童話キャラ16タイプ診断｜私は『${type.name}』でした`;
    const imageURL = new URL(`../images/share/${entry.code.toLowerCase()}.jpg`, entry.url).href;
    const html = `<!doctype html>
<html lang="ja" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f5f7ff">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(type.catch)}">
  <link rel="canonical" href="${escape(entry.url)}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(type.catch)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escape(entry.url)}">
  <meta property="og:image" content="${escape(imageURL)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escape(title)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(type.catch)}">
  <meta name="twitter:image" content="${escape(imageURL)}">
  <meta name="twitter:image:alt" content="${escape(title)}">
  <style>${source.styles}</style>
</head>
<body class="static-result">
  ${source.drift}
  <div class="shell">
    ${source.masthead}
    <main id="app">${entry.html}</main>
    ${source.footer}
  </div>
</body>
</html>
`;
    await writeChanged(resolve(root, `r/${entry.code.toLowerCase()}.html`), html);
    if (images) {
      const image = await browser.evaluate(`(async () => {
        const code = ${JSON.stringify(entry.code)};
        await document.fonts.ready;
        // generateShareBlob itself awaits both the portrait and logo load events.
        const png = await generateShareBlob(code);
        if (png.type !== 'image/png') throw new Error('Expected source PNG');
        const bitmap = await createImageBitmap(png);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width; canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No 2D canvas');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0); bitmap.close();
        const jpg = await new Promise((resolve, reject) => canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error('JPEG encoding failed')), 'image/jpeg', 0.9));
        if (jpg.type !== 'image/jpeg') throw new Error('JPEG not supported');
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader(); reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error); reader.readAsDataURL(jpg);
        });
        return { width: canvas.width, height: canvas.height, data };
      })()`);
      assert.equal(image.width, 1200); assert.equal(image.height, 630);
      const bytes = Buffer.from(image.data.split(',')[1], 'base64');
      assert.equal(bytes.readUInt16BE(0), 0xffd8);
      await writeChanged(resolve(root, `images/share/${entry.code.toLowerCase()}.jpg`), bytes);
      console.log(`${entry.code}: HTML + JPEG 1200x630 (${bytes.length} bytes)`);
    } else console.log(`${entry.code}: HTML`);
  }

  // Parse the generated files with the browser's HTML parser; verify every src/href,
  // canonical/OG target, and image, including files saved in a previous --images run.
  let references = 0;
  for (const entry of source.entries) {
    const filename = `r/${entry.code.toLowerCase()}.html`;
    const html = await readFile(resolve(root, filename), 'utf8');
    const parsed = await browser.evaluate(`(async () => {
      const doc = new DOMParser().parseFromString(${JSON.stringify(html)}, 'text/html');
      const image = await loadShareImage('images/share/${entry.code.toLowerCase()}.jpg');
      return { links: [...doc.querySelectorAll('[src], [href]')].flatMap(node =>
        ['src', 'href'].filter(key => node.hasAttribute(key)).map(key => node.getAttribute(key))),
        metaImages: [...doc.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]')].map(node => node.content),
        width: image.naturalWidth, height: image.naturalHeight,
        axes: doc.querySelectorAll('.axis').length, scripts: doc.scripts.length,
        buttons: doc.querySelectorAll('button').length };
    })()`);
    assert.equal(parsed.width, 1200); assert.equal(parsed.height, 630);
    assert.equal(parsed.axes, 4); assert.equal(parsed.scripts, 0); assert.equal(parsed.buttons, 0);
    for (const link of [...parsed.links, ...parsed.metaImages]) {
      const target = new URL(link, entry.url);
      assert.equal(target.origin, new URL(entry.url).origin, `Unexpected external link: ${link}`);
      const siteBase = new URL('../', entry.url).pathname;
      assert(target.pathname.startsWith(siteBase), `Outside site: ${link}`);
      const file = await realpath(resolve(root, decodeURIComponent(target.pathname.slice(siteBase.length))));
      const local = relative(root, file);
      assert(!isAbsolute(local) && local !== '..' && !local.startsWith(`..${sep}`));
      assert((await stat(file)).isFile(), `Missing file: ${filename} -> ${link}`);
      references++;
    }
  }
  assert.deepEqual(browser.failures, [], 'Browser script errors');
  console.log(`PASS: 16 pages, 16 JPEGs at 1200x630, ${references} references. ${browser.version.product}`);
} finally {
  await browser.close();
}
