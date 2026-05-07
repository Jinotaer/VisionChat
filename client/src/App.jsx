import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UserLayout from './layouts/userLayouts';
import GuestLayout from './layouts/guestLayout';
import Login from './pages/login';
import Chat from './pages/chat';
import Welcome from './pages/welcome';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Guest routes*/}
        <Route element={<GuestLayout />}>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected routes — requires login */}
        <Route element={<UserLayout />}>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/chat" element={<Chat />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}
