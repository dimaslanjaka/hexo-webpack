import React from 'react';
import { Outlet } from 'react-router-dom';
import FlowbiteContext from './context/FlowbitContext';
import { SidebarProvider } from './context/SidebarContext';
import Header from './header';

function FlowbitePostLayout() {
  return (
    <FlowbiteContext>
      <SidebarProvider>
        <Header />
        <div className="dark:bg-gray-900">
          <main className="mx-4 mt-4 mb-24">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </FlowbiteContext>
  );
}

export default FlowbitePostLayout;
export { FlowbitePostLayout as Component };
