export default function createhtml(tagName: string, attributes: Record<string, any>) {
  const html = [] as string[];
  if (/\b(meta)\b/.test(tagName)) {
    const arr = Object.keys(attributes).map(key => {
      return `${key}="${attributes[key]}"`;
    });
    html.push(`<${tagName} ${arr.join(' ')} />`);
  }
  return html.join(' ');
}

if (require.main === module) {
  console.log(createhtml('meta', { rel: 'canonical', href: 'http://example.com' }));
}
