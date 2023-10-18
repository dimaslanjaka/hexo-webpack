import Bluebird from 'bluebird';
import { fs, path, writefile } from 'sbg-utility';
import { fixtures, tmp } from '.';
import EventEmitter from 'events';

let styleCounter = 0;
const globalStyles = [] as string[];

export default function extractStyleTag(str: string) {
  const regex = /(<style\b[^>]*>)([\s\S]*?)(<\/style\b[^>]*>)/gim;
  let m: RegExpExecArray | null;
  const localStyles = [] as string[];
  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    // delete style tag
    str = str.replace(m[0], `<div htmlFor="style" data-index="${styleCounter}"></div>`);
    localStyles.push(m[0]);
    globalStyles.push(m[0]);

    // increase counter
    styleCounter++;
  }

  if (regex.test(str)) {
    console.log('extract script deeper');
    // extract deeper
    str = str.replace(regex, outer => {
      // push outer script
      localStyles.push(outer);
      globalStyles.push(outer);

      // capture pushed outer
      const replacement = `<div htmlFor="style" data-index="${scriptCounter}"></div>`;

      // increase counter
      styleCounter++;

      // delete style tag
      return replacement;
    });
  }

  return { extracted: localStyles, html: str };
}

export function restoreStyleTag(str: string) {
  const regex = /<div htmlFor="style" data-index="(.*)"><\/div>/gim;

  // Alternative syntax using RegExp constructor
  // const regex = new RegExp('<div htmlFor="(.*)" data-index="(.*)"><\\\/div>', 'gmi')

  return str.replace(regex, function (_, index) {
    return globalStyles[index];
  });
}

let scriptCounter = 0;
const globalScripts = [] as string[];
export function extractScriptTag(str: string) {
  const regex = /(<script\b[^>]*>)([\s\S]*?)(<\/script\b[^>]*>)/gim;
  const localScripts = [] as string[];

  let m: RegExpExecArray | null;
  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    // push outer script
    localScripts.push(m[0]);
    globalScripts.push(m[0]);

    // delete style tag
    str = str.replace(m[0], `<div htmlFor="script" data-index="${scriptCounter}"></div>`);

    // increase counter
    scriptCounter++;
  }

  if (regex.test(str)) {
    console.log('extract script deeper');
    // extract deeper
    str = str.replace(regex, outer => {
      // push outer script
      localScripts.push(outer);
      globalScripts.push(outer);

      // capture pushed outer
      const replacement = `<div htmlFor="script" data-index="${scriptCounter}"></div>`;

      // increase counter
      scriptCounter++;

      // delete style tag
      return replacement;
    });
  }

  return { extracted: localScripts, html: str };
}

export function restoreScriptTag(str: string) {
  const regex = /<div htmlFor="script" data-index="(.*)"><\/div>/gim;

  // Alternative syntax using RegExp constructor
  // const regex = new RegExp('<div htmlFor="(.*)" data-index="(.*)"><\\\/div>', 'gmi')

  return str.replace(regex, function (_, index) {
    return globalScripts[index];
  });
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface Extractor {
  on(event: 'before_extract_style', listener: (outerHTML: string) => void): this;
  on(event: 'before_extract_script', listener: (outerHTML: string) => void): this;
  on(event: string, listener: (...args: any[]) => any): this;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class Extractor extends EventEmitter {
  styles: string[] = [];
  html: string;
  getHtml = () => this.html;

  constructor(html: string) {
    super();
    this.html = html;
  }

  extractStyleTag(str?: string) {
    if (!str) str = this.html;
    const self = this;
    const regex = /(<style\b[^>]*>)([\s\S]*?)(<\/style\b[^>]*>)/gim;
    let m: RegExpExecArray | null;
    const localStyles = [] as string[];
    while ((m = regex.exec(str)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      // delete style tag
      str = str.replace(m[0], `<div htmlFor="style" data-index="${styleCounter}"></div>`);
      this.emit('before_extract_style', m[0]);
      localStyles.push(m[0]);
      this.styles.push(m[0]);

      // increase counter
      styleCounter++;
    }

    if (regex.test(str)) {
      // extract deeper
      str = str.replace(regex, outer => {
        // push outer script
        localStyles.push(outer);
        globalStyles.push(outer);
        self.emit('before_extract_style', outer);

        // capture pushed outer
        const replacement = `<div htmlFor="style" data-index="${scriptCounter}"></div>`;

        // increase counter
        styleCounter++;

        // delete style tag
        return replacement;
      });
    }

    // modify local html
    this.html = str;

    return { extracted: localStyles, html: str };
  }

  extractScriptTag(str?: string) {
    if (!str) str = this.html;
    const self = this;
    const regex = /(<script\b[^>]*>)([\s\S]*?)(<\/script\b[^>]*>)/gim;
    const localScripts = [] as string[];

    let m: RegExpExecArray | null;
    while ((m = regex.exec(str)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      // push outer script
      this.emit('before_extract_script', m[0]);
      localScripts.push(m[0]);
      globalScripts.push(m[0]);

      // delete style tag
      str = str.replace(m[0], `<div htmlFor="script" data-index="${scriptCounter}"></div>`);

      // increase counter
      scriptCounter++;
    }

    if (regex.test(str)) {
      // extract deeper
      str = str.replace(regex, function (outer) {
        // push outer script
        self.emit('before_extract_script', outer);
        localScripts.push(outer);
        globalScripts.push(outer);

        // capture pushed outer
        const replacement = `<div htmlFor="script" data-index="${scriptCounter}"></div>`;

        // increase counter
        scriptCounter++;

        // delete style tag
        return replacement;
      });
    }

    // modify local html
    this.html = str;

    return { extracted: localScripts, html: str };
  }
}

if (require.main === module) {
  let html = fs.readFileSync(fixtures('toJsx.html'), 'utf-8');
  const test = async function () {
    const { default: Axios } = await import('axios');
    const { setupCache } = await import('axios-cache-interceptor');
    const axios = setupCache(Axios);
    const urls = Bluebird.all([
      'https://gist.githubusercontent.com/tatygrassini/3055168/raw/7cba04ea8d606df967e789f562cf353ece947c20/google_adsense%2520250x300.html',
      'https://gist.githubusercontent.com/JarvusChen/7ba1546cfb89616cfae71dabce2910ee/raw/d918fb308fd33f5ef48efc740e282c699835ccbf/AdSense.html'
    ]);
    await urls.map(async url => {
      const { data } = await axios.get(url);
      html += '\n\n\n' + data;
    });
    const dump_before = writefile(tmp(path.basename(__filename, path.extname(__filename)), 'before.html'), html);
    console.log('raw original html', dump_before.file);

    let extract = extractScriptTag(html);
    extract = extractStyleTag(extract.html);

    const dump_extract = writefile(
      tmp(path.basename(__filename, path.extname(__filename)), 'after-extract.html'),
      extract.html
    );
    console.log(
      'extracted html should not have style tags',
      !/(<style\b[^>]*>)([\s\S]*?)(<\/style\b[^>]*>)/gim.test(extract.html)
    );
    console.log(
      'extracted html should not have script tags',
      !/(<script\b[^>]*>)([\s\S]*?)(<\/script\b[^>]*>)/gim.test(extract.html)
    );
    console.log('extracted result', dump_extract.file);

    let restore = restoreStyleTag(extract.html);
    restore = restoreScriptTag(restore);
    const dump_restore = writefile(
      tmp(path.basename(__filename, path.extname(__filename)), 'after-restore.html'),
      restore
    );

    console.log(
      'restored html should not have replacement tags',
      !/htmlFor=["'](script|style)["'] data-index/gim.test(restore)
    );
    console.log('restored result', dump_restore.file);
  };

  test();
}
