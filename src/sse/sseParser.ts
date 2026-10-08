/**
 * Minimal text/event-stream parser (only `data:` is used).
 * Feed it decoded text chunks in order; it calls onMessage once per complete event.
 * Chunks may split lines anywhere, including between \r and \n.
 */
export const createSseParser = (onMessage: (data: string) => void) => {
  let buffer = "";
  let dataLines: string[] = [];
  let hasData = false;
  // Last chunk ended with \r: a \n at the start of the next chunk belongs to it.
  let skipLeadingLf = false;

  const dispatch = () => {
    if (hasData) onMessage(dataLines.join("\n"));
    dataLines = [];
    hasData = false;
  };

  const processLine = (line: string) => {
    if (line === "") {
      dispatch();
      return;
    }
    if (line.startsWith(":")) return;

    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    if (field !== "data") return;

    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    dataLines.push(value);
    hasData = true;
  };

  const push = (chunk: string) => {
    if (chunk === "") return;
    if (skipLeadingLf && chunk.startsWith("\n")) chunk = chunk.slice(1);
    skipLeadingLf = chunk.endsWith("\r");
    buffer += chunk;

    for (;;) {
      const match = /\r\n|\r|\n/.exec(buffer);
      if (!match) break;

      processLine(buffer.slice(0, match.index));
      buffer = buffer.slice(match.index + match[0].length);
    }
  };

  return { push };
};
