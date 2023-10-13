---
title: highlight.js test
id: highlight-js-test
---

```js
import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const CodeBlock: React.FC<{ codestring: string }> = ({ codestring }) => {
  return (
    <SyntaxHighlighter
      language="javascript"
      style={a11yDark}
      showLineNumbers>
      {codestring}
    </SyntaxHighlighter>
  );
};

function App() {

  var code = `function $initHighlight(block, cls) {
    try {
      if (cls.search(/\bno\-highlight\b/) != -1)
        return process(block, true, 0x0F) +
               \` class="\${cls}"\`;
    } catch (e) {
      /* handle exception */
    }
    for (var i = 0 / 2; i < classes.length; i++) {
      if (checkCondition(classes[i]) === undefined)
          return /\d+[\s/]/g;
      }
       return 0xA;
    }

    export  $initHighlight;`;

  return (
    <div className="w-1/2 bg-blue-700">
      <CodeBlock codestring={code} />
    </div>
  );
}

export default App;
```

plaintext
```
hello pre code tag
```

## conflict sample from post

## Kondisional pada GitHub Workflow
Kondisional-kondisional yang ada di Github Workflow. Kondisional ini berguna untuk memicu job step dengan kasus-kasus tertentu. [source](https://docs.github.com/en/actions/learn-github-actions/expressions) Misalnya:

### Menjalankan command apabila repository di push dengan commit yang memiliki substring tertentu (match substring from github commit messages)
```yaml
jobs:
  build:
    name: Nama Workflow
    runs-on: ubuntu-latest
    steps:
      - run: echo "git commit contains hello" # run this command if commit contains hello
        if: contains(github.event.head_commit.message, 'hello')
      - run: echo "git commit any"
```
selain `contains` untuk mencari sebuah substring pada string. Adapun fungsi'' lain seperti:
- `startsWith` untuk memeriksa apakah string memiliki **awalan** tertentu (penggunaannya sama seperti contoh kode diatas)
- `endsWith` untuk memeriksa apakah string memiliki **akhiran** tertentu (penggunaannya sama seperti contoh kode diatas)

### Melanjutkan steps meskipun command gagal (continue on error)
```yaml
jobs:
  build:
    name: Nama Workflow
    runs-on: ubuntu-latest
    steps:
      - run: this_command_is_not_found xxxxx # ini akan membuat workflow berhenti
        continue-on-error: true # namun dengan ini tidak akan membuat workflow berhenti
        id: custom-id # membuat id khusus (opsional)
      - run: echo "git commit any"
```

### Mengitung jumlah file yang termodifikasi
Menghitung berapa jumlah file yang termodifikasi (uncommited files) pada github. Lalu bagaimana cara mengintegrasikannya kedalam github CI? berikut ulasannya:

perintah dasar menggunakan `git diff` sebagai berikut:

```bash
git diff --cached --numstat | wc -l
```

#### Github CI - Mengitung jumlah file yang termodifikasi langsung di dalam `run`
Contoh konfigurasi github CI langsung di dalam `run`

```yaml
jobs:
  build:
    name: Mengitung jumlah file yang termodifikasi ke dalam output steps
    runs-on: ubuntu-latest
    steps:
      - shell: bash
        run: |
          cached=$(git diff --cached --numstat | wc -l)
          echo "jumlah file yang termodifikasi adalah ${cached}"
```

#### Github CI - Mengitung jumlah file yang termodifikasi ke dalam output steps
Contoh konfigurasi github CI ke dalam output steps

```yaml
jobs:
  build:
    name: Mengitung jumlah file yang termodifikasi ke dalam output steps
    runs-on: ubuntu-latest
    steps:
      - shell: bash
        run: |
          echo "cached=$(git diff --cached --numstat | wc -l)" >> $GITHUB_OUTPUT
        name: what changes
        id: changes
      - shell: bash
        run: |
          echo "jumlah file yang termodifikasi adalah ${{ steps.changes.outputs.cached }}"
```

### Menghitung jumlah commits yang belum dipush
Untuk mengihitung jumlah commit yang belum dipush, dapat menggunakan perintah dasar `git diff` juga. Contohnya sebagai berikut:

```bash
git diff origin/master..HEAD --numstat | wc -l
```

Untuk penggunaan dalam Github Actions (CI) contohnya sebagai berikut:

```bash
git diff origin/${GITHUB_REF#refs/heads/}..HEAD --numstat | wc -l
```

`GITHUB_REF#refs/heads/` berguna untuk mendapatkan branch yang saat ini dijalankan.

### Snippet lainnya sebagai berikut

#### Get current SHA short hash
bash
```bash
echo $GITHUB_SHA | cut -c 1-6
```
Github CI Yaml output env
```yaml
echo "GITHUB_SHA_SHORT=$(echo $GITHUB_SHA | cut -c 1-6)" >> $GITHUB_ENV
```
Github CI Yaml output steps
```yaml
echo "GITHUB_SHA_SHORT=$(echo $GITHUB_SHA | cut -c 1-6)" >> $GITHUB_OUTPUT
```

## Tentang artikel ini

Artikel ini untuk mempermudah visitor untuk memahami github workflow.

### Contoh FULL Github CI

https://github.com/dimaslanjaka/static-blog-generator/blob/e8ef351552d57c5e28e016e39e78fef139a8e7b2/.github/workflows/build-beta.yml

{% github https://github.com/dimaslanjaka/static-blog-generator/blob/e8ef351552d57c5e28e016e39e78fef139a8e7b2/.github/workflows/build-beta.yml %}

### gist shortcode

dimaslanjaka/a6aa24a8fa7a13999ee3dac077fa21fe

{% gist https://gist.github.com/dimaslanjaka/a6aa24a8fa7a13999ee3dac077fa21fe filename:anonymize-ip.php %}
