import _config from '../_config.json';
import pjson from '../package.json';
import routes from '../routes.json';

interface PropCont {
  property: string;
  content: string;
}

export type Route = {
  body?: string;
  title: string;
  filename: string;
  description: string;
  source: string;
  meta: PropCont & {
    [property: string]: {
      [property: string]: string;
    };
    canonical: {
      rel: 'canonical';
      href: string;
    };
  };
  permalink: string;
  id: string;
  jsxPath: string;
};

export const routeConfig = routes as Route[];
export const projectConfig = _config as Hexo['config'];
export const pkgjson = pjson;
export default { routeConfig, projectConfig, pkgjson };
