export const FlowbiteLoadStylesheet = () =>
  Promise.all([
    import(/* webpackChunkName: "main-css" */ '@assets/css/main.scss'),
    import(/* webpackChunkName: "flowbite-css" */ './style.scss')
  ]);
export const FlowbiteWithSidebarLayout = () => import(/* webpackChunkName: "flowbite-with-sidebar-layout" */ './index');
export const FlowbiteSingleContentLayout = () => import(/* webpackChunkName: "flowbite-single-layout" */ './post');
