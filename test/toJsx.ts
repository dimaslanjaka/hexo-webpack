import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { fs, md5, path, writefile } from 'sbg-utility';
import prettierFormat from './format';
import { fixtures, tmp } from './utils';
import { extractMarkdownCodeblock, restoreMarkdownCodeblockAsHtml } from './utils/extractMarkdownCodeblock';
import { Extractor } from './utils/extractStyleScriptTag';

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

  // writefile(__dirname + '/tmp/toJsx/before-extract-codeblock.html', body);

  // extract markdown codeblock
  newHtml = extractMarkdownCodeblock(newHtml).html;

  // writefile(__dirname + '/tmp/toJsx/after-extract-codeblock.html', newHtml);

  const extractor = new Extractor(newHtml);

  // extract style tags
  extractor.on('before_extract_style', styleTag => {
    const regex = /<style\b[^>]*>([\s\S]*?)<\/style\b[^>]*>/gim;
    _styles.push(
      styleTag.replace(regex, (_outer, inner: string) => {
        return inner;
      })
    );
  });
  extractor.extractStyleTag();

  // extract script tags
  const allScriptSrc: string[] = [];

  extractor.on('before_extract_script', scriptTag => {
    const regex = /<script(\b[^>]*)>([\s\S]*?)<\/script\b[^>]*>/gim;
    _scripts.push(
      scriptTag.replace(regex, (_outer, attr: string, inner: string) => {
        let src = '';
        if (attr && attr.length > 0) {
          src = (attr.match(/src=['"](.*)['"]/) || [])[1] || '';
        }
        if (src.length > 0 && !allScriptSrc.includes(src)) {
          allScriptSrc.push(src);
          inner =
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
        return inner;
      })
    );
  });
  extractor.extractScriptTag();

  // extract <ins/>
  // extractor.on('before_extract_custom', obj => {
  //   console.log(obj.outer);
  // });
  extractor.extractTag('ins');

  // re-assign extracted script and style tags html
  newHtml = extractor.getHtml();

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
  // update extractor html
  extractor.setHtml(newHtml);

  // close JSDOM instance
  // free memory
  dom.window.close();

  // restore <ins/>
  extractor.restoreTag('ins');
  // re-assign restored <ins/>
  newHtml = extractor.getHtml();

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

  // fix lowercased attributes
  // const regexAttr = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|\s*\/?[>"']))+.)["']?/gmi
  for (const attr in ATTRIBUTE_TO_JSX_PROP_MAP) {
    const jsxattr = ATTRIBUTE_TO_JSX_PROP_MAP[attr];
    const regex = new RegExp(`\\b${attr}\\b=`, 'gm');
    newHtml = newHtml.replace(regex, jsxattr + '=');
    // console.log(regex, jsxattr);
  }

  // restore markdown codeblock
  newHtml = restoreMarkdownCodeblockAsHtml(newHtml, true);

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
