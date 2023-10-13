// const re_inline_code_block = /`([^`\n\r]+)`/gm;

const globalCodeblock = [] as { whole: string; content: string; lang: string }[];
let counter = 0;
export function extractMarkdownCodeblock(str: string) {
  /**
   * * group 0 = whole codeblock
   * * group 1 = code language when exist otherwise inner codeblock
   * * group 2 = inner codeblock
   */
  const regex = /^```(?: +)?(\w.*\s+)?([\s\S]*?)```/gm;
  let m: RegExpExecArray | null;
  const localCodeblock = [] as typeof globalCodeblock;

  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    const lang = m[1].trim();
    const val = { whole: m[0], lang, content: m[2] };

    localCodeblock.push(val);
    globalCodeblock.push(val);
    // delete codeblock
    str = str.replace(m[0], `<div htmlFor="codeblock" data-index="${counter}" data-lang="${lang}"></div>`);

    counter++;
  }

  return { extracted: localCodeblock, html: str };
}

export function restoreMarkdownCodeblock(str: string) {
  const regex = /<div htmlFor="codeblock" data-index="(.*)" data-lang="(.*)"><\/div>/gim;

  return str.replace(regex, function (_, index) {
    return globalCodeblock[index].whole;
  });
}

export function restoreMarkdownCodeblockAsHtml(str: string, jsx = false) {
  const regex = /<div htmlFor="codeblock" data-index="(.*)" data-lang="(.*)"><\/div>/gim;

  return str.replace(regex, function (_, index) {
    const data = globalCodeblock[index];
    // eslint-disable-next-line prefer-const
    let html = data.content;
    if (jsx) {
      // escape backslash
      // This escapes all instances of the three special characters
      // that would break a backtick string literal definition: ` \
      // https://stackoverflow.com/a/75688937/6404439
      html = html.replace(/[`\\]/g, '\\$&');
      return `<pre><code class="hljs ${data.lang}">{\`${html}\`}</code></pre>`;
    }
    return `<!-- prettier-ignore-start --><pre><code class="hljs ${data.lang}">${encodeEntities(
      html
    )}</code></pre><!-- prettier-ignore-end -->`;
  });
}

function encodeEntities(rawStr: string) {
  // eslint-disable-next-line no-useless-escape
  return rawStr.replace(/[\u00A0-\u9999<>\&]/g, function (i) {
    return '&#' + i.charCodeAt(0) + ';';
  });
}

if (require.main === module) {
  const html = `
\`\`\`js
console.log('hello world');
\`\`\`

\`\`\`js
console.log('hello world2');
\`\`\`
  `;
  const extract = extractMarkdownCodeblock(html);
  const restore = restoreMarkdownCodeblock(extract.html);
  console.log(restore.trim() === html.trim());
  console.log(restoreMarkdownCodeblockAsHtml(extract.html));
}
