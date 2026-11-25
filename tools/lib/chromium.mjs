// Minimal Chromium/CDP runner. Node standard modules only; no installed packages.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { access, mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

async function executable() {
  const candidates = process.env.CHROME_BIN ? [process.env.CHROME_BIN] : [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ...['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']
      .flatMap(name => (process.env.PATH || '').split(delimiter).map(dir => join(dir, name)))
  ];
  for (const path of candidates) {
    try { await access(path); return path; } catch { /* Try next installed browser. */ }
  }
  throw new Error('Chrome/Chromium not found. Set CHROME_BIN to an installed executable.');
}

export async function openBrowser(root) {
  root = await realpath(root);
  const chromePath = await executable();
  const profile = await mkdtemp(join(tmpdir(), 'fairytale-browser-'));
  const mime = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg' };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
      const file = await realpath(resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`));
      const local = relative(root, file);
      if (isAbsolute(local) || local === '..' || local.startsWith(`..${sep}`)
          || !(local === 'index.html' || local.startsWith(`r${sep}`) || local.startsWith(`images${sep}`))) {
        response.writeHead(403).end(); return;
      }
      const bytes = await readFile(file);
      response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(bytes);
    } catch { response.writeHead(404).end(); }
  });
  let child;
  const pending = new Map();
  let closed = false;
  let stderr = '';
  let serial = 0;
  let sessionId;
  const failures = [];
  const rejectPending = error => {
    for (const item of pending.values()) { clearTimeout(item.timer); item.reject(error); }
    pending.clear();
  };
  function send(method, params = {}, session = sessionId) {
    return new Promise((resolveRequest, reject) => {
      if (closed) { reject(new Error('Browser closed')); return; }
      const id = ++serial;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP timeout: ${method}\n${stderr}`));
      }, 45000);
      pending.set(id, { resolve: resolveRequest, reject, timer });
      child.stdio[3].write(JSON.stringify({ id, method, params, ...(session ? { sessionId: session } : {}) }) + '\0');
    });
  }
  async function close() {
    if (child && child.exitCode === null && !closed) {
      const exited = once(child, 'exit');
      child.kill('SIGTERM');
      const stopped = await Promise.race([exited.then(() => true), delay(3000).then(() => false)]);
      if (!stopped) { child.kill('SIGKILL'); await exited; }
    }
    closed = true;
    rejectPending(new Error('Browser closed'));
    server.closeAllConnections();
    if (server.listening) await new Promise(done => server.close(done));
    await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const origin = `http://127.0.0.1:${server.address().port}`;
    child = spawn(chromePath, [
      '--headless=new', '--remote-debugging-pipe', `--user-data-dir=${profile}`,
      '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
      '--disable-component-update', 'about:blank'
    ], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
    child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-4000); });
    child.on('error', error => { closed = true; rejectPending(error); });
    child.on('exit', (code, signal) => {
      closed = true;
      rejectPending(new Error(`Chrome exited (${code ?? signal})\n${stderr}`));
    });
    let buffer = '';
    child.stdio[4].setEncoding('utf8');
    child.stdio[4].on('data', chunk => {
      buffer += chunk;
      for (let end; (end = buffer.indexOf('\0')) >= 0;) {
        const message = JSON.parse(buffer.slice(0, end));
        buffer = buffer.slice(end + 1);
        const item = pending.get(message.id);
        if (item) {
          pending.delete(message.id); clearTimeout(item.timer);
          if (message.error) item.reject(new Error(JSON.stringify(message.error)));
          else item.resolve(message.result);
        } else if (message.method === 'Runtime.exceptionThrown') {
          failures.push(message.params.exceptionDetails);
        }
      }
    });
    const version = await send('Browser.getVersion');
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    ({ sessionId } = await send('Target.attachToTarget', { targetId, flatten: true }));
    await send('Runtime.enable');
    await send('Page.enable');
    async function evaluate(expression) {
      const value = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (value.exceptionDetails) throw new Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text);
      return value.result.value;
    }
    async function navigate(path) {
      const url = new URL(path, origin).href;
      if (new URL(url).origin !== origin) throw new Error('Only local project navigation is allowed');
      const response = await send('Page.navigate', { url });
      if (response.errorText) throw new Error(response.errorText);
      for (let attempt = 0; attempt < 200; attempt++) {
        try {
          if (await evaluate(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete'`)) return;
        } catch (error) {
          if (!/context|navigat/i.test(error.message)) throw error;
        }
        await delay(50);
      }
      throw new Error(`Navigation timed out: ${path}`);
    }
    return { send, evaluate, navigate, close, origin, version, failures };
  } catch (error) { await close(); throw error; }
}
