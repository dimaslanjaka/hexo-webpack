import React from 'react';
import { BiBuoy } from 'react-icons/bi';
import { HiArrowSmRight, HiChartPie, HiInbox, HiShoppingBag, HiTable, HiUser, HiViewBoards } from 'react-icons/hi';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from './context/SidebarContext';
import Header from './header';
import Sidebar from './sidebar';
import FlowbiteContext from './context/FlowbitContext';

function FlowbiteLayout() {
  return (
    <div id="FlowbiteLayout">
      <FlowbiteContext>
        <SidebarProvider>
          <Header />
          <div className="flex flex-col md:flex-row h-screen w-screen dark:bg-gray-900">
            <main className="order-2 mx-4 mt-4 mb-24 flex-[1_0_16rem]" id="flowbite-main-content">
              <Outlet />
            </main>
            <div className="order-1">
              <ActualSidebar />
            </div>
          </div>
        </SidebarProvider>
      </FlowbiteContext>
    </div>
  );
}

function ActualSidebar(): JSX.Element {
  return (
    <Sidebar>
      <Sidebar.Items>
        <Sidebar.ItemGroup>
          <Sidebar.Item href="#" icon={HiChartPie}>
            Dashboard
          </Sidebar.Item>
          <Sidebar.Item href="#" icon={HiViewBoards}>
            Kanban
          </Sidebar.Item>
          <Sidebar.Item href="#" icon={HiInbox}>
            Inbox
          </Sidebar.Item>
          <Sidebar.Item href="#" icon={HiUser}>
            Users
          </Sidebar.Item>
          <Sidebar.Item href="#" icon={HiShoppingBag}>
            Products
          </Sidebar.Item>
          <Sidebar.Item href="#" icon={HiArrowSmRight}>
            Sign In
          </Sidebar.Item>
          <Sidebar.Item href="#" icon={HiTable}>
            Sign Up
          </Sidebar.Item>
        </Sidebar.ItemGroup>
        <Sidebar.ItemGroup>
          <Sidebar.Item href="#" icon={HiChartPie}>
            Upgrade to Pro
          </Sidebar.Item>
          <Sidebar.Item href="#" icon={HiViewBoards}>
            Documentation
          </Sidebar.Item>
          <Sidebar.Item href="#" icon={BiBuoy}>
            Help
          </Sidebar.Item>
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  );
}

export default FlowbiteLayout;
export { FlowbiteLayout as Component };