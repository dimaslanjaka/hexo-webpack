import Bluebird from 'bluebird';
import { fs, path, writefile } from 'sbg-utility';
import { fixtures, tmp } from '.';
import EventEmitter from 'events';

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface Extractor {
  on(event: 'before_extract_style', listener: (outerHTML: string) => void): this;
  on(event: 'before_extract_script', listener: (outerHTML: string) => void): this;
  on(event: 'before_extract_custom', listener: (obj: { outer: string; inner: string; attr: string }) => void): this;
  on(event: string, listener: (...args: any[]) => any): this;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class Extractor extends EventEmitter {
  styles: string[] = [];
  styleCounter = 0;
  scripts: string[] = [];
  scriptCounter = 0;
  private html: string;
  getHtml = () => this.html;
  setHtml = (str: string) => (this.html = str);

  constructor(html: string) {
    super();
    this.html = html;
  }

  /**
   * extract style tags
   * @param str custom html?
   * @returns
   */
  extractStyleTag(str?: string) {
    if (!str) str = this.html;
    const regex = /(<style\b[^>]*>)([\s\S]*?)(<\/style\b[^>]*>)/gim;
    let m: RegExpExecArray | null;
    const localStyles = [] as string[];
    while ((m = regex.exec(str)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      // delete style tag
      str = str.replace(m[0], `<div htmlFor="style" data-index="${this.styleCounter}"></div>`);
      this.emit('before_extract_style', m[0]);
      localStyles.push(m[0]);
      this.styles.push(m[0]);

      // increase counter
      this.styleCounter++;
    }

    if (regex.test(str)) {
      // extract deeper
      str = str.replace(regex, outer => {
        // push outer script
        localStyles.push(outer);
        this.styles.push(outer);
        this.emit('before_extract_style', outer);

        // capture pushed outer
        const replacement = `<div htmlFor="style" data-index="${this.scriptCounter}"></div>`;

        // increase counter
        this.styleCounter++;

        // delete style tag
        return replacement;
      });
    }

    // modify local html
    this.html = str;

    return { extracted: localStyles, html: str };
  }

  /**
   * restore style tags
   * @param str custom html?
   * @returns
   */
  restoreStyleTag(str?: string) {
    if (!str) str = this.html;
    const regex = /<div htmlFor="style" data-index="(.*)"><\/div>/gim;

    str = str.replace(regex, (_, index) => {
      return this.styles[index];
    });

    // modify local html
    this.html = str;

    return str;
  }

  /**
   * extract script tags
   * @param str custom html?
   * @returns
   */
  extractScriptTag(str?: string) {
    if (!str) str = this.html;
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
      this.scripts.push(m[0]);

      // delete style tag
      str = str.replace(m[0], `<div htmlFor="script" data-index="${this.scriptCounter}"></div>`);

      // increase counter
      this.scriptCounter++;
    }

    if (regex.test(str)) {
      // extract deeper
      str = str.replace(regex, outer => {
        // push outer script
        this.emit('before_extract_script', outer);
        localScripts.push(outer);
        this.scripts.push(outer);

        // capture pushed outer
        const replacement = `<div htmlFor="script" data-index="${this.scriptCounter}"></div>`;

        // increase counter
        this.scriptCounter++;

        // delete style tag
        return replacement;
      });
    }

    // modify local html
    this.html = str;

    return { extracted: localScripts, html: str };
  }

  restoreScriptTag(str?: string) {
    if (!str) str = this.html;
    const regex = /<div htmlFor="script" data-index="(.*)"><\/div>/gim;

    str = str.replace(regex, (_, index) => {
      return this.scripts[index];
    });

    // modify local html
    this.html = str;

    return str;
  }

  customTags = {} as {
    [tagName: string]: { counter: number; values: { outer: string; attr: string; inner: string }[] };
  };

  /**
   * extract custom tags
   * @param tagName tagname to extracted
   * @param str custom html?
   */
  extractTag(tagName: string, str?: string) {
    if (!str) str = this.html;
    const localTags = [] as {
      outer: string;
      attr: string;
      inner: string;
    }[];
    // assign empty array when not exist
    if (!this.customTags[tagName]) this.customTags[tagName] = { counter: 0, values: [] };

    // eslint-disable-next-line prettier/prettier, no-useless-escape
    const regex = new RegExp(`(<${tagName}(\\b[^>]*)>)([\\s\\S]*?)(<\\\/${tagName}\\b[^>]*>)`, 'gmi');
    str = str.replace(regex, (outer, attr, inner) => {
      this.customTags[tagName].values.push({ outer, attr, inner });
      localTags.push({ outer, attr, inner });
      this.emit('before_extract_custom', { outer, attr, inner });
      // capture pushed outer
      const replacement = `<div htmlFor="${tagName}" data-index="${this.customTags[tagName].counter}"></div>`;

      // increase counter
      this.customTags[tagName].counter++;

      // delete style tag
      return replacement;
    });

    // modify local html
    this.html = str;

    return { extracted: localTags, html: str };
  }

  /**
   * restore custom tags
   * @param tagName
   * @param str custom html?
   */
  restoreTag(tagName: string, str?: string) {
    if (!str) str = this.html;
    if (!this.customTags[tagName]) {
      throw new Error(
        `tag name ${tagName} never extracted, please extract ${tagName} with \`extractTag('${tagName}')\` before restoring`
      );
    }

    // eslint-disable-next-line prettier/prettier, no-useless-escape
    const regex = new RegExp(`<div htmlFor="${tagName}" data-index="(.*)"><\\\/div>`, 'gmi');

    str = str.replace(regex, (_, index) => {
      return this.customTags[tagName].values[index].outer;
    });

    // modify local html
    this.html = str;

    return str;
  }

  /**
   * remove all replacement elements `<div htmlFor="(.*)" data-index="(.*)"></div>`
   * @param str custom html?
   * @returns
   */
  removeReplacements(str?: string) {
    if (!str) str = this.html;
    // eslint-disable-next-line prettier/prettier, no-useless-escape
    const regex = new RegExp('<div htmlFor="(.*)" data-index="(.*)"><\\\/div>', 'gmi')
    str = str.replace(regex, '');
    // apply local html
    this.html = str;

    return str;
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

    const instance = new Extractor(html);

    instance.extractStyleTag();
    instance.extractScriptTag();

    const dump_extract = writefile(
      tmp(path.basename(__filename, path.extname(__filename)), 'after-extract.html'),
      instance.getHtml()
    );
    console.log(
      'extracted html should not have style tags',
      !/(<style\b[^>]*>)([\s\S]*?)(<\/style\b[^>]*>)/gim.test(instance.getHtml())
    );
    console.log(
      'extracted html should not have script tags',
      !/(<script\b[^>]*>)([\s\S]*?)(<\/script\b[^>]*>)/gim.test(instance.getHtml())
    );
    console.log('extracted result', dump_extract.file);

    instance.restoreStyleTag();
    instance.restoreScriptTag();

    const dump_restore = writefile(
      tmp(path.basename(__filename, path.extname(__filename)), 'after-restore.html'),
      instance.getHtml()
    );

    console.log(
      'restored html should not have replacement tags',
      !/htmlFor=["'](script|style)["'] data-index/gim.test(instance.getHtml())
    );
    console.log('restored result', dump_restore.file);
  };

  test();
}
