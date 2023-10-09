import _config from '../_config.json';
import pkgjson from '../package.json';
import routes from '../routes.json';

export type Route = {
  body?: string;
  title: string;
  filename: string;
  description: string;
  source: string;
  meta: {
    [property: string]: {
      [property: string]: string;
    };
  };
  permalink: string;
  id: string;
  jsxPath: string;
};

export const routeConfig = routes as Route[];
export { _config as config, pkgjson };
export default {};
