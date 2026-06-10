import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import SimpleMapGame from "@/components/GoogleMapGame";
import { useCountries } from "@/hooks/useCountries";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GameResult } from "@/components/GameResult";
import { getFlagUrl, shuffleArray } from "@/lib/utils";
import { Country } from "@/types/Country";

interface GameCountry extends Country {
  flag: string;
}

// --- LISTA ZAKAZANYCH MIKROPAŃSTW ---

const EXCLUDED_CODES = ["MT", "MC", "VA", "SM", "AD", "LI"];

const MapGame = () => {
  const { data: rawCountries = [], isLoading } = useCountries();
  
  const allCountries = useMemo(() => {
    const formattedData: GameCountry[] = rawCountries.map((item) => ({
      ...item,
      flag: getFlagUrl(item.code)
    }));
    return formattedData.filter(country => !EXCLUDED_CODES.includes(country.code));
  }, [rawCountries]);

  const [shuffledCountries, setShuffledCountries] = useState<GameCountry[]>([]);
  const [currentCountryIndex, setCurrentCountryIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const startNewGame = React.useCallback(() => {
    if (allCountries.length === 0) return;
    // Losujemy 10 krajów do gry
    const gameSet = shuffleArray(allCountries).slice(0, 10);
    setShuffledCountries(gameSet);
    setCurrentCountryIndex(0);
    setScore(0);
    setGameOver(false);
    setIsCorrect(null);
  }, [allCountries]);

  // 1. Inicjalizacja gry po pobraniu danych
  useEffect(() => {
    if (allCountries.length > 0 && !gameStarted) {
      startNewGame();
      setGameStarted(true);
    }
  }, [allCountries, gameStarted, startNewGame]);

  const handleRestart = () => {
    startNewGame();
  };

  const currentCountry = shuffledCountries[currentCountryIndex];
  
  const progress = shuffledCountries.length > 0 
    ? ((currentCountryIndex + 1) / shuffledCountries.length) * 100 
    : 0;

  const handleCountryClick = (clickedCountryName: string) => {
    if (isCorrect !== null) return;

    if (clickedCountryName === currentCountry.name) {
      setIsCorrect(true);
      setScore(score + 1);
    } else {
      setIsCorrect(false);
    }
  };

  const handleNext = () => {
    if (currentCountryIndex < shuffledCountries.length - 1) {
      setCurrentCountryIndex(currentCountryIndex + 1);
      setIsCorrect(null);
    } else {
      setGameOver(true);
    }
  };

  // --- EKRAN ŁADOWANIA ---
  if (isLoading || !gameStarted) {
    return <LoadingScreen />;
  }

  // --- EKRAN KONIEC GRY ---
  if (gameOver) {
    return (
      <GameResult 
        score={score} 
        totalQuestions={shuffledCountries.length} 
        onRestart={handleRestart} 
        emojiThresholds={{ low: "📍", medium: "🗺️", high: "🌍" }}
        gameMode="MAP"
      />
    );
  }

  if (!currentCountry) return <div>Błąd danych.</div>;

  // --- EKRAN GRY ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-primary/10 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Strona główna
          </Button>
        </Link>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Pytanie {currentCountryIndex + 1} z {shuffledCountries.length}
            </span>
            <span className="text-sm font-medium flex items-center">
              <Trophy className="mr-1 h-4 w-4 text-accent" />
              Wynik: {score}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="mb-6">
          <CardHeader className="text-center">
            <img 
               src={currentCountry.flag} 
               alt={currentCountry.name} 
               className="w-32 h-24 object-cover mx-auto rounded-lg shadow-md mb-3 border" 
            />
            <CardTitle className="text-3xl mb-2">
              Gdzie leży: {currentCountry.name}?
            </CardTitle>
            <CardDescription className="text-lg">
              Kliknij na mapie, aby wybrać kraj
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleMapGame
              currentCountry={currentCountry}
              onCountryClick={handleCountryClick}
              isCorrect={isCorrect}
            />

            {isCorrect !== null && (
              <div className={`mt-6 p-6 rounded-lg text-center ${
                isCorrect 
                  ? "bg-secondary/10 border-2 border-secondary" 
                  : "bg-destructive/10 border-2 border-destructive"
              }`}>
                <div className="text-5xl mb-3">{isCorrect ? "✓" : "✗"}</div>
                <p className="text-xl font-semibold mb-2">
                  {isCorrect ? "Brawo! To poprawny kraj!" : "Niestety, to nie tu."}
                </p>
                <p className="text-muted-foreground">
                  Szukaliśmy: {currentCountry.name} - {currentCountry.capital}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {isCorrect !== null && (
          <Button onClick={handleNext} size="lg" className="w-full">
            {currentCountryIndex < shuffledCountries.length - 1 ? "Następny kraj" : "Zobacz wynik"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default MapGame;