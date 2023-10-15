import Promise from 'bluebird';
import { fs, path, writefile } from 'sbg-utility';
import args from './config/cli';
import paths from './config/paths';
import { default as genRouteTest } from './test/genRoute';
import { init } from './test/render';
import { default as toJsx } from './test/toJsx';
import { splitIntoChunks } from './test/utils/array';
import moment from 'moment-timezone';

/**
 * @param options
 * @example
 * ```bash
 * gulp route
 * # or force options
 * gulp route --random --limit=10 --clean
 * ```
 */
export default async function genRoute(
  options: Partial<{
    filter: string;
    randomize: boolean;
    limit: number;
    onBeforePostsProcess: ((posts: string[]) => string[]) | ((posts: string[]) => Promise<string[]>);
    clean: boolean;
  }> = {}
) {
  await init();
  const dest = paths.src + '/posts';
  let { limit, filter, randomize, clean } = Object.assign(
    { filter: '', clean: false, limit: 0, randomize: false },
    options || {}
  );
  const { onBeforePostsProcess } = options;

  // force option clean from cli
  if (args.clean) clean = true;
  // force randomize from cli
  if (args.random || args.randomize) randomize = true;
  // force limit from cli
  if (args.limit) limit = parseInt(args.limit);
  // force filter from cli
  if (args.filter) filter = filter?.split(',').concat(args.filter.split(',')).join(',');

  if (clean) {
    await Promise.all([
      // truncate auto generated post folder
      dest,
      // truncate auto generated post images folder
      paths.public + '/post-images',
      // truncate auto generated static folder
      paths.tmp + '/static',
      paths.tmp + '/meta'
    ])
      .filter(p => fs.exists(p))
      .each(p => fs.emptyDir(p));
  }

  // let total = 0;
  const routes = [] as any[];
  let { default: posts } = await import('./.cache/posts.json');
  // filter only file
  posts = posts.filter(file => fs.existsSync(file) && fs.statSync(file).isFile());
  // filter by options
  if (filter.length > 0) {
    posts = posts.filter(file => {
      const fil = filter
        ?.split(',')
        .filter(str => str.length > 0)
        .some(str => {
          const regex = new RegExp(str);
          const test = regex.test(file);
          // if (test) console.log({ str, regex, test, file });
          return test;
        });
      return fil || false;
    });
  }

  if (typeof onBeforePostsProcess === 'function') {
    // const promisify = Promise.promisify(onBeforePostsProcess);
    // await promisify(posts);
    const run = onBeforePostsProcess(posts);
    if (run['then'] || run instanceof Promise) {
      posts = await run;
    } else {
      posts = run;
    }
  }

  if (randomize) {
    posts = posts.sort(() => Math.random() - 0.5);
  }

  // filter limit when post length is same or more than limit
  if (limit > 0 && posts.length >= limit) {
    posts = posts.splice(0, limit);
  }

  console.log('total post', posts.length);

  const processPost = async (postPath: string) => {
    const route = await genRouteTest(postPath);
    try {
      const jsx = await toJsx({
        body: route.body,
        source: route.source,
        dest: path.join(dest, route.id),
        id: route.id || route.permalink
      });
      const { body: _body, ...toPrint } = route;
      // total++;
      const value = { ...toPrint, jsxPath: jsx.jsxPath };
      // console.log(total, route.permalink);
      routes.push(value);

      return { route, jsx, value };
    } catch (e) {
      console.error('jsx cannot parse', route.source);
      console.error(e);
    }
  };

  // const readableStream = stream.Readable.from(posts);

  // readableStream
  //   .on('data', postPath =>
  //     processPost(postPath).then(() => writefile(__dirname + '/routes.json', JSON.stringify(routes, null, 2)))
  //   )
  //   .on('end', function () {
  //     // This may not been called since we are destroying the stream
  //     // the first time "data" event is received
  //     console.log('All the data in the file has been read');
  //   })
  //   .on('close', function (_err) {
  //     console.log('Stream has been destroyed and file has been closed');
  //   });

  const chunks = splitIntoChunks(posts, 100);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    await Promise.all(chunk).each(processPost);
  }

  writefile(__dirname + '/routes.json', JSON.stringify(routes, null, 2));
}

export async function sortRoute() {
  const { default: routes } = await import('./routes.json');
  const { default: config } = await import('./_config.json');
  const orderBy = /updated/.test(config.index_generator.order_by) ? 'updated' : 'date';
  const descending = /-/.test(config.index_generator.order_by) ? true : false;
  const sorted = routes.sort(function (a, b) {
    const dateA = moment((a.meta as any)[orderBy].content).unix();
    const dateB = moment((b.meta as any)[orderBy].content).unix();

    // ? -1 : 1 for ascending/increasing order
    if (descending) return dateA < dateB ? 1 : -1;
    return dateA < dateB ? -1 : 1;
  });
  writefile(__dirname + '/routes.json', JSON.stringify(sorted, null, 2));
}
