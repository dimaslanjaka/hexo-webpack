import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { fs, md5, path, writefile } from 'sbg-utility';
import prettierFormat from './format';
import { fixtures, tmp } from './utils';

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
  { for: 'htmlFor', class: 'className', defaultvalue: 'defaultValue' }
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
  /** post id */
  id: string;
}) {
  const _scripts: string[] = [];
  const _styles: string[] = [];
  const { source, id: _id } = options;
  let { body } = options;
  if (!body) {
    body = fs.readFileSync(source, 'utf-8');
  }
  let newHtml = body;

  // writefile(options.dest + '/body.html', body);

  // extract style tags
  let styleTagMatch: RegExpExecArray | null;
  while ((styleTagMatch = re_style_tag.exec(newHtml)) !== null) {
    // delete style tag
    newHtml = newHtml.replace(styleTagMatch[0], '');
    _styles.push(styleTagMatch[1]);
  }

  // extract script tags
  const allScriptSrc: string[] = [];
  let hasScript = re_script_tag.test(newHtml);
  let scriptTagMatch: null | RegExpExecArray;
  while ((scriptTagMatch = re_script_tag.exec(newHtml)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (scriptTagMatch.index === re_script_tag.lastIndex) {
      re_script_tag.lastIndex++;
    }
    // console.log('script', scriptTagMatch[1], scriptTagMatch[2]);
    // delete script tag
    newHtml = newHtml.replace(scriptTagMatch[0], '');
    const src = ((scriptTagMatch[1] || '').match(/src=['"](.*)['"]/) || [])[1] || '';
    let inner = (scriptTagMatch[2] || '').trim().length > 0 ? scriptTagMatch[2] : '';
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

  // double check extract script tags
  hasScript = re_script_tag.test(newHtml);
  if (hasScript && _scripts.length === 0) {
    const regex = /(<script\b[^>]*>)([\s\S]*?)(<\/script\b[^>]*>)/gim;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(newHtml)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      let inner = (m[2] || '').trim().length > 0 ? m[2] : '';
      let src = '';
      if (m[1] && m[1].trim().length > 0) {
        src = ((m[1] || '').match(/src=['"](.*)['"]/) || [])[1] || '';
      }
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

      // delete script tag
      newHtml = newHtml.replace(m[0], '');

      _scripts.push(inner);
    }
  }

  // initialize JSDOM
  // prepare modification
  const dom = new JSDOM(newHtml);

  // extract inline style from html element
  const styleIds: string[] = [];
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

  // change selected select or input value attribute to react defaultValue
  dom.window.document.querySelectorAll('select,input').forEach(el => {
    let defaultValue: string | null = null;
    if (el.tagName === 'SELECT') {
      el.querySelectorAll('option[selected]').forEach(option => {
        option.removeAttribute('selected');
        defaultValue = option.getAttribute('value');
      });
    } else {
      defaultValue = el.getAttribute('value');
      el.removeAttribute('value');
    }
    if (defaultValue) el.setAttribute('defaultValue', defaultValue);
  });

  // re-assign html with JSDOM inner body
  newHtml = dom.window.document.body.innerHTML;

  // close JSDOM instance
  // free memory
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

  // replace image src to base64 encoded
  // newHtml = htmlImg2base64({ source, body: newHtml });

  // base64 encoded images to import style
  // const imagePaths: { importName: string; import: string; path: string }[] = [];
  // const re_images = /<img [^>]*src="[^"]*"[^>]*>/gim;
  // newHtml = newHtml.replace(re_images, function (tag) {
  //   const repl = tag.replace(
  //     /<img [^>]*src=(['"]data:image\/(\w{3,4});base64,(.*)['"])[^>]*>/gim,
  //     function (_, src, ext, base64) {
  //       if (ext && src && base64) {
  //         const filename = md5(base64);
  //         const imagePath = path.join(options.dest, filename + '.' + ext);
  //         const obj = {
  //           path: imagePath,
  //           importName: '_' + filename,
  //           import: `import _${filename} from './${filename}.${ext}';`
  //         };
  //         imagePaths.push(obj);
  //         const buff = Buffer.from(base64, 'base64');
  //         if (!fs.existsSync(path.dirname(imagePath))) {
  //           fs.mkdirSync(path.dirname(imagePath), { recursive: true });
  //         }
  //         fs.writeFileSync(imagePath, buff);
  //         return _.replace(src, `{ ${obj.importName} }`);
  //       } else {
  //         return _;
  //       }
  //     }
  //   );
  //   return repl;
  // });

  const hash = md5(source || newHtml);
  const classWrapperName = 'toJsx-style-wrapper-' + hash;
  const scriptPath = path.join(options.dest, '/script.js');
  const stylePath = path.join(options.dest, '/styles.scss');
  const jsxPath = path.join(options.dest, '/index.jsx');
  let scriptContent = '';
  let styleContent = '';
  if (_scripts.length > 0) {
    scriptContent = await prettierFormat(_scripts.join('\n'), { parser: 'typescript' });
    writefile(scriptPath, scriptContent);
  }
  if (_styles.length > 0) {
    styleContent = await prettierFormat(`.${classWrapperName}{\n` + _styles.join('\n') + '\n}', {
      parser: 'scss'
    });
    writefile(stylePath, styleContent);
  }

  const funcName = 'Post_' + hash;
  let result = `
import React from 'react';
${styleContent.length > 0 ? "import './styles.scss';" : ''}

function ${funcName}() {
${
  scriptContent.length > 0
    ? `
React.useEffect(() => {
  import('./script.js');
});
`
    : ''
}
  return (<div className="${classWrapperName}">${newHtml}</div>)
}

export default ${funcName};
export { ${funcName} as Component };
  `.trim();
  // writefile(tmp('toJsx/result.jsx'), result);

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
    // writefile(tmp('toJsx/format.jsx'), result);
  } catch (e) {
    e.source = source;
    console.error(e);
  }

  writefile(jsxPath, result);

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
    const {
      content: _,
      styleContent: __,
      scriptContent: ___,
      ...result
    } = await toJsx({
      source,
      body: readFileSync(source, 'utf-8'),
      dest: tmp('toJsx/result'),
      id: 'custom-id'
    });
    console.log(result);
  })();
}
