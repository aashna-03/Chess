import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../src/pages/Home.jsx";
import Game from "../src/pages/Game.jsx";

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