export const FlowbiteLoadStylesheet = () =>
  Promise.all([
    import(/* webpackChunkName: "flowbite-css" */ './style.scss'),
    import(/* webpackChunkName: "main-css" */ '@assets/css/main.scss')
  ]);
export const FlowbiteWithSidebarLayout = () => import(/* webpackChunkName: "flowbite-with-sidebar-layout" */ './index');
export const FlowbiteSingleContentLayout = () => import(/* webpackChunkName: "flowbite-single-layout" */ './post');
