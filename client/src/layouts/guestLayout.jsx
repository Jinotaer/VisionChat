import { Outlet, Navigate } from 'react-router-dom';

export default function GuestLayout() {
  const isLoggedIn = !!localStorage.getItem('auth');

  if (isLoggedIn) return <Navigate to="/welcome" replace />;

  return (
    <div className="min-h-screen bg-white text-black">
      <Outlet />
    </div>
  );
}
