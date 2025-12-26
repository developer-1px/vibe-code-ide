import React, { useState, useMemo } from 'react';
import { UserCard } from './UserCard';
import { useUsers } from './useUsers';

export const UserList: React.FC = () => {
  const { users, activeUsers, userCount } = useUsers();
  const [showActive, setShowActive] = useState(false);

  const displayedUsers = useMemo(() => {
    return showActive ? activeUsers : users;
  }, [showActive, activeUsers, users]);

  return (
    <div className="user-list">
      <h2>User List ({userCount} total)</h2>

      <div className="filter-bar">
        <button onClick={() => setShowActive(!showActive)}>
          {showActive ? 'Show All' : 'Show Active Only'}
        </button>
        <span>Active: {activeUsers.length}</span>
      </div>

      <div className="cards">
        {displayedUsers.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
};
