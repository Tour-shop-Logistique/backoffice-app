import { Link } from 'react-router-dom';
import { CubeTransparentIcon } from '@heroicons/react/24/outline';

const WelcomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        <CubeTransparentIcon className="h-24 w-24 mx-auto text-blue-400 mb-6" />
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
          Plateforme de Gestion d'Expéditions
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8">
          Optimisez, suivez et gérez toutes vos opérations logistiques depuis une interface unique et puissante.
        </p>
        <Link to="/login">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg">
            Accéder à mon espace
          </button>
        </Link>
      </div>
      <footer className="absolute bottom-4 text-gray-500 text-sm">
        © {new Date().getFullYear()} Tous Shop Logistique. Tous droits réservés.
      </footer>
    </div>
  );
};

export default WelcomePage;
