---
title: post with javascript
id: post-with-javascript
permalink: post-with-javascript.html
---

<h2 style="text-align: center; color: red">post with javascript</h2>
<style>
pre {
  white-space: pre-wrap;       /* css-3 */
  white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
  white-space: -pre-wrap;      /* Opera 4-6 */
  white-space: -o-pre-wrap;    /* Opera 7 */
  word-wrap: break-word;       /* Internet Explorer 5.5+ */
}
</style>

<script>
  console.log('inner script');
</script>

<pre><code>
function Shape(){
  // this is a comment
  this.name = 'Shape';
  this.toString = function(){return this.name;};
}


function Shape2D(){
  this.name = 'Shape 2D';
}

function Triangle(base,height){
    this.name = 'Triangle';
    this.base = base;
    this.height = height;
    this.getArea = function(){return this.base*this.height/2;};
}

</code></pre>
<link rel="stylesheet" href="https://yandex.st/highlightjs/8.0/styles/vs.min.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
<script src="https://yandex.st/highlightjs/8.0/highlight.min.js"></script>
<script>
  (function(){
    hljs.initHighlightingOnLoad();
  })();
</script>