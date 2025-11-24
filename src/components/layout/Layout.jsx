import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBackofficeConfig } from '../../redux/slices/backofficeSlice';
import SettingsModal from './SettingsModal';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const { isConfigured, loading } = useSelector((state) => state.backoffice);

  useEffect(() => {
    if (loading === 'idle') {
      dispatch(fetchBackofficeConfig());
    }
  }, [dispatch, loading]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Topbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-1">
          {children}
        </main>
      </div>
      {!isConfigured && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <SettingsModal closeModal={() => { /* Ne rien faire pour forcer la config */ }} />
        </div>
      )}
    </div>
  );
};

export default Layout;
