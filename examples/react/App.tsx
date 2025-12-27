import React, { useState, useMemo } from 'react';
import { UserList } from './UserList';
import { useUsers } from './useUsers';

export const App: React.FC = () => {
  const [title] = useState('User Management System');
  const [currentUser] = useState('Admin');

  const { users, activeUsers, userCount } = useUsers();

  const activeCount = useMemo(() => activeUsers.length, [activeUsers]);

  return (
    <div className="app">
      <header>
        <h1>{title}</h1>
        <p>Welcome, {currentUser}</p>
      </header>

      <main>
        <UserList />

        <div className="stats">
          <p>Total Users: {userCount}</p>
          <p>Active: {activeCount}</p>
        </div>
      </main>
    </div>
  );
};
