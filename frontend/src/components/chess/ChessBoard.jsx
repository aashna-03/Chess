import { useState, useCallback, useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

const BOARD_THEMES = {
    default: { dark: "#779556", light: "#ebecd0" },
    wooden: { dark: "#b58863", light: "#f0d9b5" },
    violet: { dark: "#7d4a8d", light: "#e2e2e2" },
    blue: { dark: "#4b7399", light: "#dee3e6" },
    burgandy: { dark: "#8b3a3a", light: "#e8e0d5" },
};

export default function ChessBoard({
    fen,
    myColor,
    isMyTurn,
    onMove,
    gameMode,
    diceRoll,
    brainCall,
    lastMove,
    isCheck,
    boardStyle = "default"
}) {
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [highlightedSquares, setHighlightedSquares] = useState({});

    const chess = useMemo(() => {
        try {
            return new Chess(fen === "start" || !fen ? undefined : fen);
        } catch {
            return new Chess();
        }
    }, [fen]);

    const theme = BOARD_THEMES[boardStyle] || BOARD_THEMES.default;

    const getAllowedMoves = () => {
        if (gameMode === "dice" && diceRoll) return diceRoll.legalMoves;
        return null;
    };

    const isMoveLegal = (from, to) => {
        const allowedMoves = getAllowedMoves();
        const uci = from + to;
        const uciPromo = uci + "q";
        if (allowedMoves) {
            return allowedMoves.includes(uci) || allowedMoves.includes(uciPromo);
        }
        const moves = chess.moves({ square: from, verbose: true });
        return moves.some((m) => m.to === to);
    };

    const highlightMoves = (square) => {
        const allowedMoves = getAllowedMoves();
        let destinations = [];
        if (allowedMoves) {
            destinations = allowedMoves
                .filter((uci) => uci.startsWith(square))
                .map((uci) => uci.slice(2, 4));
        } else {
            const moves = chess.moves({ square, verbose: true });
            destinations = moves.map((m) => m.to);
        }
        const highlights = {};
        destinations.forEach((sq) => {
            highlights[sq] = {
                background: chess.get(sq)
                    ? "radial-gradient(circle, rgba(239,68,68,0.55) 85%, transparent 85%)"
                    : "radial-gradient(circle, rgba(74,222,128,0.55) 30%, transparent 30%)",
                borderRadius: "50%",
            };
        });
        highlights[square] = { background: "rgba(250, 204, 21, 0.45)" };
        setHighlightedSquares(highlights);
    };

    // King-in-check highlight
    const checkHighlight = useMemo(() => {
        const result = {};
        if (isCheck && chess.isCheck()) {
            const inCheckColor = chess.turn(); // 'w' or 'b'
            for (const file of "abcdefgh") {
                for (const rank of "12345678") {
                    const sq = file + rank;
                    const piece = chess.get(sq);
                    if (piece && piece.type === "k" && piece.color === inCheckColor) {
                        result[sq] = {
                            background: "radial-gradient(circle, rgba(239,68,68,0.85) 60%, rgba(239,68,68,0.3) 100%)",
                            boxShadow: "inset 0 0 0 3px #ef4444",
                        };
                        break;
                    }
                }
            }
        }
        return result;
    }, [fen, isCheck]);

    // Last move highlight
    const lastMoveHighlight = useMemo(() => {
        const result = {};
        if (lastMove && lastMove.length >= 4) {
            result[lastMove.slice(0, 2)] = { background: "rgba(255, 200, 0, 0.28)" };
            result[lastMove.slice(2, 4)] = { background: "rgba(255, 200, 0, 0.48)" };
        }
        return result;
    }, [lastMove]);

    const onSquareClick = useCallback(
        (square) => {
            if (!isMyTurn) return;
            const piece = chess.get(square);
            if (selectedSquare) {
                if (isMoveLegal(selectedSquare, square)) {
                    const moves = chess.moves({ square: selectedSquare, verbose: true });
                    const move = moves.find((m) => m.to === square);
                    const uci = selectedSquare + square + (move?.promotion ? "q" : "");
                    onMove(uci);
                    setSelectedSquare(null);
                    setHighlightedSquares({});
                } else if (piece && piece.color === (myColor === "white" ? "w" : "b")) {
                    setSelectedSquare(square);
                    highlightMoves(square);
                } else {
                    setSelectedSquare(null);
                    setHighlightedSquares({});
                }
            } else {
                if (piece && piece.color === (myColor === "white" ? "w" : "b")) {
                    setSelectedSquare(square);
                    highlightMoves(square);
                }
            }
        },
        [selectedSquare, isMyTurn, fen, gameMode, diceRoll, brainCall]
    );

    const onPieceDrop = useCallback(
        (sourceSquare, targetSquare) => {
            if (!isMyTurn) return false;
            if (!isMoveLegal(sourceSquare, targetSquare)) return false;
            const moves = chess.moves({ square: sourceSquare, verbose: true });
            const move = moves.find((m) => m.to === targetSquare);
            const uci = sourceSquare + targetSquare + (move?.promotion ? "q" : "");
            onMove(uci);
            setHighlightedSquares({});
            return true;
        },
        [isMyTurn, fen, gameMode, diceRoll, brainCall]
    );

    const combinedStyles = {
        ...checkHighlight,
        ...lastMoveHighlight,
        ...highlightedSquares,
    };

    return (
        <div style={{
            width: "100%",
            aspectRatio: "1/1",
            maxWidth: "640px",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: isCheck
                ? "0 0 32px 8px rgba(239,68,68,0.45)"
                : "0 12px 60px rgba(0,0,0,0.8)",
            transition: "box-shadow 0.4s ease",
            margin: "0 auto"
        }}>
            <Chessboard
                position={!fen || fen === "start" ? "start" : fen}
                onSquareClick={onSquareClick}
                onPieceDrop={onPieceDrop}
                boardOrientation={myColor || "white"}
                customSquareStyles={combinedStyles}
                animationDuration={200}
                arePiecesDraggable={isMyTurn}
                customDarkSquareStyle={{ backgroundColor: theme.dark }}
                customLightSquareStyle={{ backgroundColor: theme.light }}
            />
        </div>
    );
}