// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none" 
             style={{ background: 'radial-gradient(ellipse at top right, rgba(6, 182, 212, 0.15), transparent 50%), radial-gradient(ellipse at bottom left, rgba(168, 85, 247, 0.1), transparent 50%)' }} />
        {/*<Navbar />*/}
        <main className="relative z-10 min-h-[calc(100vh-160px)]">
          <AppRoutes />
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;