import { fs } from 'sbg-utility';
import paths from '../config/paths';
import React from 'react';

/**
 * get bundled webpack js from dist/index.html
 * @returns return jsx element array
 */
function getDistScripts(): JSX.Element[];
/**
 * get bundled webpack js from dist/index.html
 * @param jsx
 * @returns return jsx element array
 */
function getDistScripts(jsx: true): JSX.Element[];
/**
 * get bundled webpack js from dist/index.html
 * @param jsx
 * @returns return script html string array
 */
function getDistScripts(jsx: false): string[];

/**
 * get bundled webpack js from dist/index.html
 * @param jsx return jsx element
 * @returns
 */
function getDistScripts(jsx = true) {
  const generatedIndex = paths.build + '/index.html';
  const regex = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
  let m: RegExpExecArray | null = null;
  const scripts = [] as (JSX.Element | string)[];

  if (fs.existsSync(generatedIndex)) {
    const contents = fs.readFileSync(generatedIndex, 'utf-8');
    // get script bundles
    while ((m = regex.exec(contents)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      if (typeof m[0] === 'string' && m[0].length > 0 && !m[0].includes('/page/main.js')) {
        const srcRegEx = /src=["'](.*?)["']/g;
        const source = srcRegEx.exec(m[0]);
        if (source) {
          if (jsx) {
            scripts.push(<script src={source[1]} key={source[1]} defer={true}></script>);
          } else {
            scripts.push(`<script defer src="${source[1]}"></script>`);
          }
        }
      }
    }
  }
  return scripts;
}

export default getDistScripts;
