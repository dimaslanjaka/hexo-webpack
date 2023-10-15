import { fs, jsonParseWithCircularRefs, jsonStringifyWithCircularRefs, path, writefile } from 'sbg-utility';
import crypto from 'crypto';
import { Readable, Stream, Transform } from 'stream';
import through2 from 'through2';

let ONEXIT;

class cache {
  cache: any = {};
  options = {
    cacheFile: __dirname + '/tmp/gulpCache'
  };
  changes = false;

  constructor() {
    // Load the cache file if any, synchronously.
    if (fs.existsSync(this.options.cacheFile)) this.fromFile(this.options.cacheFile);
  }

  bindOnExit() {
    ONEXIT = function (event: string) {
      process.on(event, this.onexit);
    }.bind(this);
    // Save the cache on exits and ctrl+c
    ['exit', 'SIGINT'].forEach(ONEXIT);
  }

  start() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const theClass = this;
    return through2.obj(function (file, _enc, callback) {
      const self = this;
      if (file.isNull() || file.isDirectory()) return callback(null, file);
      // Ensure we have a stream
      const fileStream = through2();

      // Pipe in the contents
      if (file.isStream()) {
        file.contents.pipe(fileStream);
      } else if (file.isBuffer()) {
        Readable.from(file.contents).pipe(fileStream);
      }

      // Test if the file has changed (md5 regardless)
      theClass.changed(file.path, fileStream, function (err, changed) {
        // console.log({ err, changed });
        if (changed) return callback(err, file);
        self.emit('cached', file.path);
        self.push(file);
        callback(err);
      });
    });
  }

  changed(name: string, stream: Transform, callback: (...args: any[]) => any) {
    const run = function (err: any, hash: any) {
      // console.log({ err, hash });
      if (err) return callback(err);

      // Get the old hash
      const currentHash = this.cache[name];

      // Update the hash
      this.cache[name] = hash;

      // console.log(currentHash, hash, !currentHash || currentHash !== hash);

      // Compare
      if (!currentHash || currentHash !== hash) {
        this.changes = true;
        callback(null, true);
      } else {
        callback(null, false);
      }
    };
    this.md5(stream, run.bind(this));
  }

  toFile(file: string) {
    writefile(file, jsonStringifyWithCircularRefs(this.cache));
  }

  fromFile(file: string) {
    this.cache = jsonParseWithCircularRefs(fs.readFileSync(file, 'utf-8'));
  }

  md5(stream: Stream, callback: (...args: any[]) => any) {
    const hash = crypto.createHash('md5');
    hash.setEncoding('hex');

    stream.on('error', callback).on('end', function () {
      hash.end();
      callback(null, hash.read());
    });

    stream.pipe(hash);
  }

  onexit() {
    console.log('onExit', this.cache);
    if (this.changes) {
      try {
        this.toFile(this.options.cacheFile);
      } catch (err) {
        console.warn('Unable to save cache file to %s.', this.options.cacheFile);

        if (err.code === 'ENOENT')
          console.warn('The directory %s does not exist.', path.dirname(this.options.cacheFile));
      }
    }
  }

  pipeOnExit() {
    const self = this;
    return through2.obj((vinyl, _enc, cb) => {
      self.onexit();
      cb(null, vinyl);
    });
  }
}

export default cache;

export function gulpCache() {
  const c = new cache();
  return c.start().on('end', c.onexit);
}
