import Hexo from 'hexo';
import { fs, path } from 'sbg-utility';
import { parse } from 'yaml';

export type CFG = Hexo['config'] & {
  external_link: {
    enable: boolean;
    field: string;
    safelink: {
      enable: boolean;
      exclude: string[];
      redirect: string;
      type: string;
      password: string;
    };
    exclude: string[];
  };
  exclude: string[];
  skip_render: string[];
  post_dir: string;
};

const base = path.resolve(__dirname, '..');
export const _config: CFG = Object.assign(
  { skip_render: [], exclude: [] },
  parse(fs.readFileSync(base + '/_config.yml', 'utf8'))
);
// const hexo = new Hexo(base, { ...yaml.parse(fs.readFileSync(base + '/_config.yml', 'utf8')), silent: false });
// const hexo = new Hexo(__dirname, { ..._config, silent: true });
