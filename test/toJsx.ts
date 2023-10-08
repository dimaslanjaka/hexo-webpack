import { readFileSync } from 'fs';
import { fs, md5, path, writefile } from 'sbg-utility';
import prettierFormat from './format';
import { fixtures, tmp } from './utils';
import img2base64 from './utils/img2base64';
import { JSDOM } from 'jsdom';

// inspired by
// https://github.com/probablyup/markdown-to-jsx/blob/main/index.tsx#L266

const JSX_ATTRIBUTES = [
  'allowFullScreen',
  'allowTransparency',
  'autoComplete',
  'autoFocus',
  'autoPlay',
  'cellPadding',
  'cellSpacing',
  'charSet',
  'className',
  'classId',
  'colSpan',
  'contentEditable',
  'contextMenu',
  'crossOrigin',
  'encType',
  'formAction',
  'formEncType',
  'formMethod',
  'formNoValidate',
  'formTarget',
  'frameBorder',
  'hrefLang',
  'inputMode',
  'keyParams',
  'keyType',
  'marginHeight',
  'marginWidth',
  'maxLength',
  'mediaGroup',
  'minLength',
  'noValidate',
  'radioGroup',
  'readOnly',
  'rowSpan',
  'spellCheck',
  'srcDoc',
  'srcLang',
  'srcSet',
  'tabIndex',
  'useMap'
];

const ATTRIBUTE_TO_JSX_PROP_MAP = JSX_ATTRIBUTES.reduce(
  (obj, x) => {
    obj[x.toLowerCase()] = x;
    return obj;
  },
  { for: 'htmlFor', class: 'className' }
);

/**
 * * group 0 = whole codeblock
 * * group 1 = code language when exist otherwise inner codeblock
 * * group 2 = inner codeblock
 */
export const re_code_block = /^```\s?(\w.*\s+)?([\s\S]*?)```/gm;
export const re_inline_code_block = /`([^`\n\r]+)`/gm;
export const re_script_tag = /<script(\b[^>]*)>([\s\S]*?)<\/script\b[^>]*>/gim;
export const re_style_tag = /<style\b[^>]*>([\s\S]*?)<\/style\b[^>]*>/gim;

const UNCLOSED_TAGS = [
  'area',
  'base',
  'br',
  'col',
  'command',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
];

// function getAttrObj(element) {
//   const attrsObj = {};
//   const attrs = [...element.attributes];
//   for (let attr of attrs) {
//     attrsObj[attr.name] = attr.value;
//   }
//   return attrsObj;
// }

/**
 * transform html to jsx
 * @param options
 */
async function toJsx(options: {
  body: string;
  /** source file */
  source: string;
  /** folder destination */
  dest: string;
}) {
  const _scripts: string[] = [];
  const _styles: string[] = [];
  const { source } = options;
  let { body } = options;
  if (!body) {
    body = fs.readFileSync(source, 'utf-8');
  }
  let newHtml = body;

  let m: RegExpExecArray | null;
  while ((m = re_style_tag.exec(newHtml)) !== null) {
    // delete style tag
    newHtml = newHtml.replace(m[0], '');
    _styles.push(m[1]);
  }
  const allScriptSrc: string[] = [];
  const detachScriptTags = () => {
    return new Promise(resolve => {
      // process 3 times
      for (let index = 0; index < 3; index++) {
        while ((m = re_script_tag.exec(newHtml)) !== null) {
          // delete script tag
          newHtml = newHtml.replace(m[0], '');
          const src = ((m[1] || '').match(/src=['"](.*)['"]/) || [])[1] || '';
          let inner = (m[2] || '').trim().length > 0 ? m[2] : '';
          // call src script dynamically
          // skip duplicated script
          if (src.length > 0 && !allScriptSrc.includes(src)) {
            allScriptSrc.push(src);
            inner +=
              '\n' +
              `
    (()=>{
      const script = document.createElement('script');
      script.src = '${src}';
      document.body.appendChild(script);
    })();
                `.trim() +
              '\n';
          }

          _scripts.push(inner);
        }
      }
      resolve(null);
    });
  };

  while (re_script_tag.test(newHtml)) {
    await detachScriptTags();
  }

  // extract inline style from html element
  // const regex = /style=['"]([\s\S]*?)['"]/gim;
  //   newHtml = newHtml.replace(regex, function (_whole, style) {
  //     const id = md5(_whole + style);
  //     if (!styleIds.includes(id)) {
  //       styleIds.push(id);
  //       _styles.push(`
  // [data-htmlstyle="${id}"] {
  // ${style}
  // }
  //     `);
  //     }
  //     return `data-htmlstyle="${id}"`;
  //   });
  const styleIds: string[] = [];
  const dom = new JSDOM(newHtml);
  dom.window.document.querySelectorAll('*').forEach(el => {
    if (el.hasAttribute('style')) {
      const style = el.getAttribute('style');
      const id = md5(el.outerHTML + style);
      if (!styleIds.includes(id)) {
        styleIds.push(id);
        _styles.push(`
[data-htmlstyle="${id}"] {
  ${style}
}
      `);
      }
      el.removeAttribute('style');
      el.setAttribute('data-htmlstyle', id);
    } else if (el.tagName === 'STYLE') {
      _styles.push(el.innerHTML);
      el.remove();
    }
  });
  newHtml = dom.window.document.body.innerHTML;
  dom.window.close();

  // fix unclosed tags
  UNCLOSED_TAGS.forEach(tag => {
    // const regex = new RegExp(`<${tag}([^>]*)>`, 'g');
    // newHtml = newHtml.replace(regex, `<${tag}$1/>`);
    // const regex = new RegExp(`(<${tag}("[^"]*"|[^>])+)(?<!/)>|(<${tag})(?<!/)>`, 'gm');
    const regex = new RegExp(`<${tag}([^>]*)(?<!/)>`, 'g');
    newHtml = newHtml.replace(regex, (_, m1) => {
      return `<${tag} ${m1} />`;
    });
  });

  // escape curly braces
  newHtml = newHtml.replace(/\{|\}/gm, function (_) {
    return `{'${_}'}`;
  });

  // escape html comments
  newHtml = newHtml.replace(/<!--[\s\S]*?(?:-->)/gm, function (_) {
    return `{/*${_}*/}`;
  });

  // replace image src to url base64
  newHtml = img2base64({ source, body: newHtml });

  const classWrapperName = 'toJsx-style-wrapper-' + md5(source || newHtml);
  let result = `
import React from 'react';
import './styles.scss';

export default function () {
  React.useEffect(() => {
    import('./script.js');
  });
  return (<div className="${classWrapperName}">${newHtml}</div>)
}
  `.trim();
  writefile(tmp('toJsx/result.jsx'), result);

  // fix lowercased attributes
  // const regexAttr = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|\s*\/?[>"']))+.)["']?/gmi
  for (const attr in ATTRIBUTE_TO_JSX_PROP_MAP) {
    const jsxattr = ATTRIBUTE_TO_JSX_PROP_MAP[attr];
    const regex = new RegExp(attr + '=', 'gm');
    result = result.replace(regex, jsxattr + '=');
    // console.log(regex, jsxattr);
  }

  try {
    result = await prettierFormat(result, { parser: 'babel' });
    writefile(tmp('toJsx/format.jsx'), result);
  } catch (e) {
    e.source = source;
    const w = writefile(tmp('/toJsx/' + md5(newHtml.substring(0, 100)) + '.json'), e);
    console.error('toJsx', 'prettier fail', source, w.file.replace(process.cwd(), ''));
  }

  const scriptPath = path.join(options.dest, '/script.js');
  const stylePath = path.join(options.dest, '/styles.scss');
  const jsxPath = path.join(options.dest, '/index.jsx');
  const scriptContent = await prettierFormat(_scripts.join('\n'), { parser: 'typescript' });
  const styleContent = await prettierFormat(`.${classWrapperName}{\n` + _styles.join('\n') + '\n}', { parser: 'scss' });

  writefile(jsxPath, result);
  writefile(scriptPath, scriptContent);
  writefile(stylePath, styleContent);

  return {
    content: result,
    jsxPath,
    stylePath,
    styleContent,
    scriptPath,
    scriptContent
  };
}

export default toJsx;

if (require.main === module) {
  (async () => {
    const source = fixtures('toJsx.html');
    const result = await toJsx({
      source,
      body: readFileSync(source, 'utf-8'),
      dest: tmp('toJsx/result')
    });
    console.log('jsx', result.jsxPath);
  })();
}
