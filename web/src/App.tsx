import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/sections/Hero';
import { AboutUs } from './components/sections/About';
import { Product } from './components/sections/Product';
import { Contacto } from './components/sections/Contacto';
import { Footer } from './components/layout/Footer';
import { Privacidad } from './components/sections/Privacidad'; 
import { Aviso } from './components/sections/Aviso';
import './App.css';
import { Scroll } from './components/ui/Scroll';
import {Cookies} from './components/sections/Cookies';
import NotFound from './components/sections/NotFound';
import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <Scroll />
        <div className="bg-[#050505] min-h-screen text-white">
          <Navbar />
          <Routes>
            {/* PÁGINA PRINCIPAL (Home) */}
            <Route path="/" element={
              <>
                <section id="home"><Hero /></section>
                <section id="about"><AboutUs /></section>
                <section id="product"><Product /></section>
                <section id="contacto"><Contacto /></section>
              </>
            } />
            {/* PÁGINA DE PRIVACIDAD */}
            <Route path="/politica-privacidad" element={<Privacidad />} />
            <Route path="/aviso-legal" element={<Aviso />}/>    
            <Route path="/cookies" element={<Cookies />}/>     
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;
