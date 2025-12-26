import { useState, useMemo, useCallback } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const initialUsers: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', status: 'active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', status: 'active' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', status: 'inactive' }
];

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);

  const activeUsers = useMemo(() => {
    return users.filter(user => user.status === 'active');
  }, [users]);

  const userCount = useMemo(() => users.length, [users]);

  const addUser = useCallback((user: User) => {
    setUsers(prev => [...prev, user]);
  }, []);

  const removeUser = useCallback((userId: number) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  return {
    users,
    activeUsers,
    userCount,
    addUser,
    removeUser
  };
};
