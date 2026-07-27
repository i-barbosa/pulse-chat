import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatLayout from './pages/ChatLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatLayout />} />
        <Route path="*" element={<ChatLayout />} />
      </Routes>
    </BrowserRouter>
  );
}