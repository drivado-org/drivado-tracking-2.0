import { createSseParser } from "@/server/sse/sseParser";

const setup = () => {
  const messages: string[] = [];
  const parser = createSseParser((data) => messages.push(data));
  return { messages, parser };
};

describe("createSseParser", () => {
  it("emits one message per event", () => {
    const { messages, parser } = setup();
    parser.push('data: {"a":1}\n\ndata: {"a":2}\n\n');
    expect(messages).toEqual(['{"a":1}', '{"a":2}']);
  });

  it("waits for the blank line before emitting", () => {
    const { messages, parser } = setup();
    parser.push('data: {"a":1}\n');
    expect(messages).toEqual([]);
    parser.push("\n");
    expect(messages).toEqual(['{"a":1}']);
  });

  it("joins an event split across chunks mid-line", () => {
    const { messages, parser } = setup();
    parser.push("da");
    parser.push('ta: {"lat":22.5');
    parser.push("726}\n");
    parser.push("\n");
    expect(messages).toEqual(['{"lat":22.5726}']);
  });

  it("joins multiple data lines with a newline", () => {
    const { messages, parser } = setup();
    parser.push("data: line1\ndata: line2\n\n");
    expect(messages).toEqual(["line1\nline2"]);
  });

  it.each([
    ["\\r\\n", "data: x\r\n\r\n"],
    ["\\r", "data: x\r\r"],
  ])("handles %s line endings", (_label, text) => {
    const { messages, parser } = setup();
    parser.push(text);
    expect(messages).toEqual(["x"]);
  });

  it("handles \\r\\n split across two chunks", () => {
    const { messages, parser } = setup();
    parser.push("data: x\r");
    parser.push("\n\r");
    parser.push("\n");
    expect(messages).toEqual(["x"]);
  });

  it("removes only one leading space after the colon", () => {
    const { messages, parser } = setup();
    parser.push("data:no-space\n\ndata:  two-spaces\n\n");
    expect(messages).toEqual(["no-space", " two-spaces"]);
  });

  it("ignores comment lines (heartbeats)", () => {
    const { messages, parser } = setup();
    parser.push(": ping\n\n");
    parser.push(": ping\ndata: x\n\n");
    expect(messages).toEqual(["x"]);
  });

  it("ignores other fields such as event, id and retry", () => {
    const { messages, parser } = setup();
    parser.push("event: location\nid: 5\nretry: 1000\ndata: x\n\n");
    expect(messages).toEqual(["x"]);
  });

  it("does not emit events with no data", () => {
    const { messages, parser } = setup();
    parser.push("event: ping\n\n\n\n");
    expect(messages).toEqual([]);
  });

  it("treats a 'data' line without a colon as empty data", () => {
    const { messages, parser } = setup();
    parser.push("data\ndata: x\n\n");
    expect(messages).toEqual(["\nx"]);
  });
});
