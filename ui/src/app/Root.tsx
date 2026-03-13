import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { Layout } from './components/Layout';
import { getCurrentUser } from './utils/storage';

export function Root() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
    } else {
      setIsChecking(false);
    }
  }, [navigate]);

  if (isChecking) {
    return null;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}