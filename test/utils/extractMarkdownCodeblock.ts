// const re_inline_code_block = /`([^`\n\r]+)`/gm;

const globalCodeblock = [] as { whole: string; content: string; lang: string }[];
let counter = 0;
export function extractMarkdownCodeblock(str: string) {
  /**
   * * group 0 = whole codeblock
   * * group 1 = code language when exist otherwise inner codeblock
   * * group 2 = inner codeblock
   */
  const regex = /^```(?: +)?(\w.*\s+)?([\s\S]*?)```/m;
  let m: RegExpExecArray | null;
  const localCodeblock = [] as typeof globalCodeblock;

  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    // empty string = plaintext
    const lang = (m[1] || '').trim();
    const val = { whole: m[0], lang, content: m[2] };

    localCodeblock.push(val);
    globalCodeblock.push(val);
    // delete codeblock
    str = str.replace(m[0], `\n<div htmlFor="codeblock" data-index="${counter}" data-lang="${lang}"></div>\n`);

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
    let result: string;
    let html = data.content;
    if (jsx) {
      // This escapes all instances of the three special characters
      // that would break a backtick string literal definition: ` \
      // https://stackoverflow.com/a/75688937/6404439
      html = html.replace(/[`\\]|\${/g, '\\$&');
      result = `<pre><code class="hljs ${data.lang}">{\`${html}\`}</code></pre>`;
    } else {
      result = `<!-- prettier-ignore-start --><pre><code class="hljs language-${data.lang}">${encodeEntities(
        html
      )}</code></pre><!-- prettier-ignore-end -->`;
    }
    // fix class to className in jsx
    if (jsx) {
      result = result.replace(/<code class="hljs /gm, '<code className="hljs ');
    }
    return result;
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
