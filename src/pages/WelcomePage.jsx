import { Link } from "react-router-dom";
import { Truck, Box, ArrowRight } from "lucide-react";

const WelcomePage = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-gray-800 text-white overflow-hidden relative">
      {/* Décor de fond */}
      <div className="absolute inset-0">
        <div className="absolute w-96 h-96 bg-blue-500/20 blur-3xl rounded-full top-10 left-0 animate-pulse" />
        <div className="absolute w-96 h-96 bg-indigo-500/20 blur-3xl rounded-full bottom-10 right-0 animate-pulse" />
      </div>

      {/* Colonne gauche : logo + branding */}
      <div className="relative flex-1 flex flex-col items-center md:items-end justify-center p-10 z-10 text-center md:text-right">
        <div className="flex items-center gap-3 justify-center md:justify-end mb-6">
          <Truck className="w-14 h-14 text-blue-400 drop-shadow-lg" />
          <h1 className="text-4xl font-extrabold text-blue-300 tracking-tight">
            Tous Shop Logistique
          </h1>
        </div>

        <p className="max-w-md text-gray-300 text-lg leading-relaxed mb-8">
          Bienvenue dans votre espace de gestion.  
          Suivez vos expéditions, gérez vos partenaires et contrôlez vos flux en
          toute sérénité.
        </p>

        <Link to="/login">
          <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 font-semibold py-3 px-8 rounded-full text-lg transition-all duration-300 hover:scale-105 shadow-xl">
            <span>Accéder au Backoffice</span>
            <ArrowRight className="w-6 h-6 text-white" />
          </button>
        </Link>
      </div>

      {/* Colonne droite : illustration / visuel */}
      <div className="relative flex-1 flex justify-center items-center p-10 z-10">
        <div className="relative bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl p-8 max-w-md text-center">
          <Box className="w-20 h-20 mx-auto text-blue-400 mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold mb-3">
            Une logistique moderne et connectée
          </h2>
          <p className="text-gray-300">
            Simplifiez la gestion de vos expéditions, suivez vos colis en temps
            réel et améliorez vos performances avec notre plateforme intuitive.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-5 text-gray-500 text-sm text-center w-full">
        © {new Date().getFullYear()}{" "}
        <span className="text-blue-400">Tous Shop Logistique</span>. Tous droits
        réservés.
      </footer>
    </div>
  );
};

export default WelcomePage;
