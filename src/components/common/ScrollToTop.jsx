import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll window
        window.scrollTo(0, 0);

        // Scroll internal main container if it exists (common in dashboard layouts)
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
};

export default ScrollToTop;
