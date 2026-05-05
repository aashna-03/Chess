import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../src/pages/home.jsx";
import Game from "../src/pages/game.jsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/game/:roomId" element={<Game />} />
            </Routes>
        </BrowserRouter>
    );
}