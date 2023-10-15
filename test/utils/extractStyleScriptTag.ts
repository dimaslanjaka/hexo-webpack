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
    localStyles.push(m[2]);
    globalStyles.push(m[2]);

    // increase counter
    styleCounter++;
  }
  return { extracted: localStyles, html: str };
}

export function restoreStyleTag(str: string) {
  const regex = /<div htmlFor="style" data-index="(.*)"><\/div>/gim;

  // Alternative syntax using RegExp constructor
  // const regex = new RegExp('<div htmlFor="(.*)" data-index="(.*)"><\\\/div>', 'gmi')

  return str.replace(regex, function (_, index) {
    return '<style>' + globalStyles[index] + '</style>';
  });
}

let scriptCounter = 0;
const globalScripts = [] as string[];
export function extractScriptTag(str: string) {
  const regex = /(<script\b[^>]*>)([\s\S]*?)(<\/script\b[^>]*>)/gim;
  let m: RegExpExecArray | null;
  const localScripts = [] as string[];

  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    // delete style tag
    str = str.replace(m[0], `<div htmlFor="script" data-index="${scriptCounter}"></div>`);
    localScripts.push(m[2]);
    globalScripts.push(m[2]);

    // increase counter
    scriptCounter++;
  }

  return { extracted: localScripts, html: str };
}

export function restoreScriptTag(str: string) {
  const regex = /<div htmlFor="script" data-index="(.*)"><\/div>/gim;

  // Alternative syntax using RegExp constructor
  // const regex = new RegExp('<div htmlFor="(.*)" data-index="(.*)"><\\\/div>', 'gmi')

  return str.replace(regex, function (_, index) {
    return '<script>' + globalScripts[index] + '</script>';
  });
}

if (require.main === module) {
  const html = `
  <style>[id*="questions-filter"] li:not([data-id]) {
    display: none;
  }

  [id*="questions"] li {
    display: block;
    /*text-transform: lowercase;*/
  }

  [id*="questions"] li:first-letter {
    text-transform: uppercase;
  }

  input[type="text"] {
    width: 90%;
    border: 2px solid #aaa;
    border-radius: 4px;
    margin: 8px 0;
    outline: none;
    padding: 8px;
    box-sizing: border-box;
    transition: 0.3s;
    display: inline-block;
  }

  input[type="text"]:focus {
    border-color: dodgerBlue;
    box-shadow: 0 0 8px 0 dodgerBlue;
  }
  </style>
  <script>console.clear();

  /* eslint-disable no-undef */
  /* eslint-disable no-prototype-builtins */
  /* eslint-disable no-inner-declarations */

  if (location.host == 'cdpn.io') {
    console.clear();

    function rangeAlphabetic(start, stop) {
    var result = [];
    for (
      var idx = start.charCodeAt(0), end = stop.charCodeAt(0);
      idx <= end;
      ++idx
    ) {
      result.push(String.fromCharCode(idx));
    }
    return result;
    }

    let aZ = rangeAlphabetic('a', 'z')
    .concat(rangeAlphabetic('A', 'Z'))
    .filter(function (el) {
      return el != null;
    }); // a-zA-Z array

    // automated test
    setTimeout(function () {
    let inputSearch = document.getElementById('search-questions');
    var keyword = aZ[Math.floor(Math.random() * aZ.length)];
    inputSearch.value = keyword;
    inputSearch.dispatchEvent(new Event('keyup'));
    }, 3000);
  }
  </script>
  `;
  let extract = extractStyleTag(html);
  extract = extractScriptTag(extract.html);
  let restore = restoreStyleTag(extract.html);
  restore = restoreScriptTag(restore);
  console.log(restore.trim() === html.trim());
}
