import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useEffect, useState } from 'react';

const UserContext = createContext<{ user: User | null; loading: boolean }>({
  loading: true,
  user: null,
});

export function UserProvider({ children }: { children: any }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      setUser(user);
      loading && setLoading(false);
    });
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserContext;
