#!/usr/bin/env node
// Minimal headless-Chromium REPL for driving the Vite dev server via Playwright.
// Reads one command per line from stdin. Commands:
//   nav <url>
//   click <selector>
//   fill <selector> <text...>
//   press <key>                (sent to the currently focused element)
//   wait-for <selector>
//   screenshot [name]          (saved to .claude/skills/run-app/screenshots/<name|timestamp>.png)
//   eval <js expression>       (runs page.evaluate, prints the JSON result)
//   console                    (dump captured console messages; add --errors to filter to errors)
//   quit
//
// Selectors follow Playwright syntax (CSS, `text=...`, `role=button[name="X"]`, etc).

import { chromium } from 'playwright';
import { createInterface } from 'node:readline';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotDir = join(__dirname, '..', 'screenshots');
mkdirSync(screenshotDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

const consoleLog = [];
page.on('console', (msg) => consoleLog.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', (err) => consoleLog.push({ type: 'pageerror', text: String(err) }));

function log(...args) {
  process.stdout.write(args.join(' ') + '\n');
}

async function runCommand(line) {
  const trimmed = line.trim();
  if (!trimmed) return true;
  const [cmd, ...rest] = trimmed.split(' ');
  const arg = rest.join(' ');

  try {
    switch (cmd) {
      case 'nav': {
        await page.goto(arg, { waitUntil: 'domcontentloaded' });
        log('ok: navigated to', arg);
        break;
      }
      case 'click': {
        await page.click(arg, { timeout: 5000 });
        log('ok: clicked', arg);
        break;
      }
      case 'fill': {
        const [selector, ...textParts] = rest;
        await page.fill(selector, textParts.join(' '), { timeout: 5000 });
        log('ok: filled', selector);
        break;
      }
      case 'press': {
        await page.keyboard.press(arg);
        log('ok: pressed', arg);
        break;
      }
      case 'wait-for': {
        await page.waitForSelector(arg, { timeout: 10000 });
        log('ok: found', arg);
        break;
      }
      case 'screenshot': {
        const name = arg || `shot-${Date.now()}`;
        const path = join(screenshotDir, `${name}.png`);
        await page.screenshot({ path });
        log('ok: screenshot ->', path);
        break;
      }
      case 'eval': {
        const result = await page.evaluate((expr) => eval(expr), arg);
        log('ok:', JSON.stringify(result));
        break;
      }
      case 'console': {
        const errorsOnly = rest.includes('--errors');
        const entries = errorsOnly
          ? consoleLog.filter((e) => e.type === 'error' || e.type === 'pageerror')
          : consoleLog;
        log(JSON.stringify(entries, null, 2));
        break;
      }
      case 'quit':
      case 'exit': {
        await browser.close();
        return false;
      }
      default:
        log('unknown command:', cmd);
    }
  } catch (err) {
    log('error:', err.message);
  }
  return true;
}

const rl = createInterface({ input: process.stdin });
let alive = true;
for await (const line of rl) {
  if (!alive) break;
  alive = await runCommand(line);
}
if (alive) await browser.close();
process.exit(0);
