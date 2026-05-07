import { Outlet, Navigate } from 'react-router-dom';

export default function UserLayout() {
  const isLoggedIn = !!localStorage.getItem('auth');
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return <Outlet />;
}
