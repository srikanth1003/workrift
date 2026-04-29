import { describe, it, expect, beforeEach } from "vitest";
import { getFieldLabel, detectPageMode } from "../../src/content/page-analyzer";

describe("getFieldLabel", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("gets label from <label for> element", () => {
    document.body.innerHTML = `
      <label for="company">Company Name</label>
      <input id="company" type="text" />
    `;
    const input = document.querySelector("input") as HTMLInputElement;
    expect(getFieldLabel(input)).toBe("Company Name");
  });

  it("gets label from aria-label", () => {
    document.body.innerHTML = `<input aria-label="Phone Number" type="tel" />`;
    const input = document.querySelector("input") as HTMLInputElement;
    expect(getFieldLabel(input)).toBe("Phone Number");
  });

  it("gets label from placeholder", () => {
    document.body.innerHTML = `<input placeholder="Enter email address" type="email" />`;
    const input = document.querySelector("input") as HTMLInputElement;
    expect(getFieldLabel(input)).toBe("Enter email address");
  });

  it("falls back to name attribute", () => {
    document.body.innerHTML = `<input name="firstName" type="text" />`;
    const input = document.querySelector("input") as HTMLInputElement;
    expect(getFieldLabel(input)).toBe("firstName");
  });
});

describe("detectPageMode", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("detects form mode with multiple inputs", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" />
        <input type="email" />
        <input type="tel" />
        <textarea></textarea>
      </form>
    `;
    expect(detectPageMode()).toBe("form");
  });

  it("detects compose mode with compose class", () => {
    document.body.innerHTML = `<div class="compose">Type here...</div>`;
    expect(detectPageMode()).toBe("compose");
  });

  it("ignores small contenteditable elements", () => {
    document.body.innerHTML = `<div contenteditable="true">comment box</div>`;
    expect(detectPageMode()).not.toBe("compose");
  });

  it("detects list mode with table", () => {
    document.body.innerHTML = `
      <table>
        <tr><td>Row 1</td></tr>
        <tr><td>Row 2</td></tr>
        <tr><td>Row 3</td></tr>
        <tr><td>Row 4</td></tr>
        <tr><td>Row 5</td></tr>
      </table>
    `;
    expect(detectPageMode()).toBe("list");
  });

  it("detects article mode with long text", () => {
    const longText = "Lorem ipsum ".repeat(50);
    document.body.innerHTML = `<article><p>${longText}</p></article>`;
    expect(detectPageMode()).toBe("article");
  });

  it("returns unknown for empty page", () => {
    document.body.innerHTML = `<div></div>`;
    expect(detectPageMode()).toBe("unknown");
  });
});
