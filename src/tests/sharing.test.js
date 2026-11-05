const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

const source = readFileSync(`${__dirname}/../static/sharing.js`, "utf8");
const name = "Art & Robotics / Friends? #1";
const description = "Create & learn together!";
const schedule = "Monday, 3:00 PM - 4:00 PM";

function setup(navigator = {}, secure = true) {
  const errors = [];
  const document = {
    createElement(tagName) {
      return {
        tagName,
        children: [],
        attributes: {},
        listeners: {},
        classList: {
          add(value) { this[value] = true; },
          remove(value) { this[value] = false; },
        },
        setAttribute(key, value) { this.attributes[key] = value; },
        appendChild(child) { this.children.push(child); },
        addEventListener(event, callback) { this.listeners[event] = callback; },
        focus() { this.focused = true; },
        select() { this.selected = true; },
      };
    },
  };
  const window = {
    location: {
      origin: "https://school.example",
      pathname: "/static/index.html",
      search: "?teacher_username=private&email=private",
      hash: "#private",
    },
    isSecureContext: secure,
  };
  vm.runInNewContext(source, {
    window, navigator, document, URL, URLSearchParams,
    console: { error: (...args) => errors.push(args) },
  });
  const controls = window.activitySharing.createControls(name, description, schedule);
  return {
    controls,
    errors,
    links: controls.children.filter((child) => child.tagName === "a"),
    button: controls.children.find((child) => child.textContent === "Copy link"),
    nativeButton: controls.children.find((child) => child.textContent === "Share..."),
    status: controls.children.find((child) => child.attributes.role === "status"),
    input: controls.children.find((child) => child.tagName === "input"),
  };
}

test("social destinations safely encode activity details and strip unrelated URL data", () => {
  const { controls, links, input, nativeButton } = setup();
  assert.equal(controls.attributes["aria-label"], `Share ${name}`);
  assert.equal(links.length, 3);
  assert.equal(nativeButton, undefined);
  const activityUrl = new URL(input.value);
  assert.equal(activityUrl.origin, "https://school.example");
  assert.equal(activityUrl.pathname, "/static/index.html");
  assert.deepEqual([...activityUrl.searchParams], [["activity", name]]);
  assert.equal(activityUrl.hash, "");

  const [facebook, x, whatsapp] = links.map((link) => new URL(link.href));
  assert.equal(facebook.origin, "https://www.facebook.com");
  assert.equal(facebook.searchParams.get("u"), input.value);
  assert.equal(x.origin, "https://twitter.com");
  assert.equal(x.searchParams.get("url"), input.value);
  assert.ok(x.searchParams.get("text").includes(name));
  assert.ok(x.searchParams.get("text").includes(description));
  assert.ok(x.searchParams.get("text").includes(schedule));
  assert.equal(whatsapp.origin, "https://wa.me");
  assert.ok(whatsapp.searchParams.get("text").endsWith(input.value));
  links.forEach((link) => {
    assert.equal(link.target, "_blank");
    assert.equal(link.rel, "noopener noreferrer");
    assert.ok(link.attributes["aria-label"].includes(name));
    assert.ok(!link.href.includes("private"));
  });
});

test("copy link reports success only after the clipboard write succeeds", async () => {
  let copied;
  const { button, status, input } = setup({
    clipboard: { writeText: async (value) => { copied = value; } },
  });
  await button.listeners.click();
  assert.equal(copied, input.value);
  assert.equal(status.textContent, "Activity link copied!");
  assert.equal(input.classList.hidden, true);
});

test("unavailable clipboard and insecure pages show a selectable manual link", async () => {
  for (const [navigator, secure] of [
    [{}, true],
    [{ clipboard: { writeText: () => assert.fail("Must not use insecure clipboard") } }, false],
  ]) {
    const { button, status, input } = setup(navigator, secure);
    await button.listeners.click();
    assert.ok(status.textContent.includes("Select and copy"));
    assert.equal(input.classList.hidden, false);
    assert.equal(input.readOnly, true);
    assert.equal(input.focused, true);
    assert.equal(input.selected, true);
  }
});

test("clipboard failures are logged and offer manual copying", async () => {
  const { button, status, input, errors } = setup({
    clipboard: { writeText: async () => { throw new Error("Permission denied"); } },
  });
  await button.listeners.click();
  assert.equal(errors.length, 1);
  assert.ok(status.textContent.includes("Select and copy"));
  assert.equal(input.selected, true);
});

test("native sharing contains only public activity information", async () => {
  let shared;
  const { nativeButton, input } = setup({ share: async (data) => { shared = data; } });
  await nativeButton.listeners.click();
  assert.equal(shared.title, `${name} at Mergington High School`);
  assert.equal(shared.text, `${shared.title}\n${description}\nSchedule: ${schedule}`);
  assert.equal(shared.url, input.value);
  assert.deepEqual(Object.keys(shared).sort(), ["text", "title", "url"]);
});

test("native share cancellation is silent while failures are explained", async () => {
  for (const errorName of ["AbortError", "NotAllowedError"]) {
    const { nativeButton, status, errors } = setup({
      share: async () => {
        const error = new Error("Sharing stopped");
        error.name = errorName;
        throw error;
      },
    });
    await nativeButton.listeners.click();
    if (errorName === "AbortError") {
      assert.equal(errors.length, 0);
      assert.equal(status.textContent, undefined);
    } else {
      assert.equal(errors.length, 1);
      assert.ok(status.textContent.includes("Unable to share"));
    }
  }
});
