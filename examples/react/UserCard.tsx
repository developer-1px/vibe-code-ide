import React from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

interface UserCardProps {
  user: User;
}

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const statusClass = user.status === 'active' ? 'status-active' : 'status-inactive';

  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <span className={statusClass}>{user.status}</span>
    </div>
  );
};
