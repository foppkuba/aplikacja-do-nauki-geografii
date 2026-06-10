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
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

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

  const { user, isAuthenticated, addXp } = useAuth();

  // Stan gry
  const [gameType, setGameType] = useState<"standard" | "learning" | "time" | null>(null);
  const [learnedCodes, setLearnedCodes] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [attempted, setAttempted] = useState(0);
  const [timeGameOver, setTimeGameOver] = useState(false);

  const [shuffledCountries, setShuffledCountries] = useState<GameCountry[]>([]);
  const [currentCountryIndex, setCurrentCountryIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  // Zegar dla trybu na czas
  useEffect(() => {
    if (gameType !== "time" || !gameStarted || timeGameOver) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameType, gameStarted, timeGameOver]);

  const fetchLearningProgress = async () => {
    if (!isAuthenticated || !user) return;
    setLoadingProgress(true);
    try {
      const response = await fetch(`/api/learning/progress?username=${encodeURIComponent(user)}&gameMode=MAP`);
      if (response.ok) {
        const data = await response.json();
        setLearnedCodes(data);
      }
    } catch (e) {
      console.error("Błąd pobierania postępu nauki", e);
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchLearningProgress();
    }
  }, [user, isAuthenticated]);

  const saveProgressToBackend = async (countryCode: string) => {
    try {
      await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user,
          gameMode: "MAP",
          countryCode
        })
      });
    } catch (e) {
      console.error("Błąd zapisu postępu w bazie", e);
    }
  };

  const startNewGame = React.useCallback(() => {
    if (allCountries.length === 0) return;
    const gameSet = shuffleArray(allCountries).slice(0, 10);
    setShuffledCountries(gameSet);
    setCurrentCountryIndex(0);
    setScore(0);
    setAttempted(0);
    setTimeGameOver(false);
    setGameOver(false);
    setIsCorrect(null);
    setGameType("standard");
    setGameStarted(true);
  }, [allCountries]);

  const startTimeAttackGame = React.useCallback(() => {
    if (allCountries.length === 0) return;
    const gameSet = shuffleArray(allCountries);
    setShuffledCountries(gameSet);
    setCurrentCountryIndex(0);
    setScore(0);
    setAttempted(0);
    setTimeLeft(60);
    setTimeGameOver(false);
    setGameOver(false);
    setIsCorrect(null);
    setGameType("time");
    setGameStarted(true);
  }, [allCountries]);

  const startLearningGame = React.useCallback(async (latestLearnedCodes?: string[]) => {
    const activeLearned = latestLearnedCodes !== undefined ? latestLearnedCodes : learnedCodes;
    if (allCountries.length === 0) return;

    const unlearned = allCountries.filter(c => !activeLearned.includes(c.code));
    
    if (unlearned.length === 0) {
      setShuffledCountries([]);
      setCurrentCountryIndex(0);
      setScore(0);
      setGameOver(false);
      setIsCorrect(null);
      setGameType("learning");
      setGameStarted(true);
      return;
    }

    const shuffledUnlearned = shuffleArray(unlearned);
    const gameCount = Math.min(10, shuffledUnlearned.length);
    const targetSet = shuffledUnlearned.slice(0, gameCount);

    setShuffledCountries(targetSet);
    setCurrentCountryIndex(0);
    setScore(0);
    setGameOver(false);
    setIsCorrect(null);
    setGameType("learning");
    setGameStarted(true);
  }, [allCountries, learnedCodes]);

  const handleResetProgress = async () => {
    if (!window.confirm("Czy na pewno chcesz zresetować cały postęp nauki dla tego trybu?")) {
      return;
    }
    try {
      const response = await fetch("/api/learning/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user,
          gameMode: "MAP"
        })
      });
      if (response.ok) {
        toast.success("Zresetowano postęp nauki!");
        setLearnedCodes([]);
        setGameStarted(false);
        setGameType(null);
      }
    } catch (e) {
      console.error("Błąd podczas resetowania postępu", e);
      toast.error("Błąd połączenia z serwerem.");
    }
  };

  const handleRestart = () => {
    startNewGame();
  };

  const currentCountry = shuffledCountries[currentCountryIndex];
  
  const progress = shuffledCountries.length > 0 
    ? ((currentCountryIndex + 1) / shuffledCountries.length) * 100 
    : 0;

  const handleCountryClick = (clickedCountryName: string) => {
    if (isCorrect !== null) return;

    setAttempted(prev => prev + 1);

    if (clickedCountryName === currentCountry.name) {
      setIsCorrect(true);
      setScore(score + 1);
      if (isAuthenticated && user) {
        addXp(10);
        toast.success("+10 XP! 🎉", { duration: 1000, position: "top-center" });
      }
      if (gameType === "learning" && isAuthenticated && user) {
        const countryCode = currentCountry.code;
        saveProgressToBackend(countryCode);
        setLearnedCodes(prev => {
          if (prev.includes(countryCode)) return prev;
          return [...prev, countryCode];
        });
      } else if (gameType === "time") {
        setTimeLeft(t => t + 2);
      }
    } else {
      setIsCorrect(false);
      if (gameType === "time") {
        setTimeLeft(t => {
          const nextTime = Math.max(0, t - 3);
          if (nextTime === 0) {
            setTimeGameOver(true);
          }
          return nextTime;
        });
      }
    }
  };

  const handleNext = () => {
    if (currentCountryIndex < shuffledCountries.length - 1) {
      setCurrentCountryIndex(currentCountryIndex + 1);
      setIsCorrect(null);
    } else {
      if (gameType === "time") {
        const gameSet = shuffleArray(allCountries);
        setShuffledCountries(prev => [...prev, ...gameSet]);
        setCurrentCountryIndex(currentCountryIndex + 1);
        setIsCorrect(null);
      } else {
        setGameOver(true);
      }
    }
  };

  // --- EKRAN ŁADOWANIA ---
  if (isLoading) {
    return <LoadingScreen />;
  }

  // --- UI: Wybór Trybu ---
  if (gameType === null) {
    const progressPercent = allCountries.length > 0 ? (learnedCodes.length / allCountries.length) * 100 : 0;
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-4xl w-full shadow-2xl border-border/50 overflow-hidden">
          <div className="relative p-6 md:p-8 bg-gradient-to-r from-primary/20 to-accent/20 border-b">
            <Link to="/">
              <Button variant="ghost" size="sm" className="absolute top-4 left-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Menu główne
              </Button>
            </Link>
            <div className="text-center pt-6 pb-2">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-2 animate-bounce" />
              <h1 className="text-3xl font-extrabold">Gra Mapowa 🗺️</h1>
              <p className="text-muted-foreground mt-1">Wybierz sposób rozgrywki</p>
            </div>
          </div>
          <div className="p-6 md:p-8 grid md:grid-cols-3 gap-6">
            {/* Tryb Klasyczny */}
            <Card className="flex flex-col justify-between hover:border-primary/50 transition-all duration-300 shadow-sm">
              <div className="p-6 pb-0">
                <h3 className="text-xl font-bold mb-2">Tryb Klasyczny 🎯</h3>
                <p className="text-sm text-muted-foreground">
                  Zlokalizuj 10 losowych krajów na mapie Europy. Rywalizuj w tabeli wyników!
                </p>
              </div>
              <div className="p-6">
                <Button 
                  onClick={startNewGame}
                  className="w-full"
                >
                  Graj Klasycznie 🚀
                </Button>
              </div>
            </Card>

            {/* Tryb Nauki */}
            <Card className="flex flex-col justify-between hover:border-primary/50 transition-all duration-300 shadow-sm relative">
              {!isAuthenticated && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center z-10 rounded-lg">
                  <span className="text-3xl mb-2">🔒</span>
                  <h4 className="font-bold text-foreground">Tryb Nauki zablokowany</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Musisz się zalogować, aby zapisywać postęp nauki lokalizacji krajów.
                  </p>
                  <Link to="/auth">
                    <Button size="sm">Zaloguj się teraz</Button>
                  </Link>
                </div>
              )}
              <div className="p-6 pb-0">
                <h3 className="text-xl font-bold mb-2">Tryb Nauki 📖</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ucz się bez limitu! Wskazuj na mapie kraje, których jeszcze nie znasz. Twój postęp jest stale zapisywany.
                </p>
                {isAuthenticated && (
                  <div className="space-y-1.5 mt-2 bg-muted p-3 rounded-lg">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Postęp nauki:</span>
                      <span>{learnedCodes.length} / {allCountries.length} krajów</span>
                    </div>
                    <Progress value={progressPercent} className="h-1.5" />
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col gap-2">
                <Button 
                  onClick={() => startLearningGame()}
                  className="w-full"
                  disabled={loadingProgress}
                >
                  {learnedCodes.length > 0 ? "Kontynuuj naukę 📖" : "Rozpocznij naukę 📖"}
                </Button>
                {isAuthenticated && learnedCodes.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleResetProgress} className="text-destructive hover:bg-destructive/10">
                    Resetuj postęp 🔄
                  </Button>
                )}
              </div>
            </Card>

            {/* Wyzwanie na Czas */}
            <Card className="flex flex-col justify-between hover:border-primary/50 transition-all duration-300 shadow-sm">
              <div className="p-6 pb-0">
                <h3 className="text-xl font-bold mb-2">Wyzwanie na Czas ⏱️</h3>
                <p className="text-sm text-muted-foreground">
                  Wskazuj kraje na mapie jak najszybciej! +2s za poprawny wybór, -3s za błędny. Rywalizuj w osobnym rankingu!
                </p>
              </div>
              <div className="p-6">
                <Button 
                  onClick={startTimeAttackGame}
                  className="w-full"
                >
                  Rozpocznij Wyzwanie 🚀
                </Button>
              </div>
            </Card>
          </div>
        </Card>
      </div>
    );
  }

  // --- UI: Wszystko opanowane w trybie nauki ---
  if (gameType === "learning" && shuffledCountries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full p-6 text-center shadow-xl border-border/50">
          <div className="text-6xl mb-4">🎉</div>
          <CardTitle className="text-3xl font-bold mb-2">Gratulacje! 🥳</CardTitle>
          <p className="text-muted-foreground mb-6">
            Opanowałeś już wszystkie kraje ({allCountries.length}) na mapie! Twój postęp wynosi 100%.
          </p>
          <div className="space-y-3">
            <Button onClick={handleResetProgress} className="w-full text-lg py-6 flex items-center justify-center gap-2">
              Zresetuj postęp i zacznij od nowa 🔄
            </Button>
            <Button variant="ghost" onClick={() => { setGameType(null); setGameStarted(false); }} className="w-full">
              Wróć do wyboru trybu
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // --- EKRAN KONIEC GRY W TRYBIE NAUKI ---
  if (gameType === "learning" && gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full p-6 text-center shadow-xl border-border/50">
          <div className="text-6xl mb-4">📖</div>
          <CardTitle className="text-3xl font-bold mb-2">Koniec rundy nauki!</CardTitle>
          <p className="text-muted-foreground mb-4">
            W tej rundzie poprawnie wskazałeś <span className="font-bold text-foreground">{score} z {shuffledCountries.length}</span> krajów.
          </p>
          <div className="bg-muted p-4 rounded-xl mb-6">
            <p className="text-sm text-muted-foreground mb-2">Twój całkowity postęp nauki mapy:</p>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Opanowane kraje</span>
              <span>{learnedCodes.length} z {allCountries.length}</span>
            </div>
            <Progress value={(learnedCodes.length / allCountries.length) * 100} className="h-2" />
          </div>
          <div className="space-y-3">
            {learnedCodes.length < allCountries.length ? (
              <Button 
                onClick={async () => {
                  await fetchLearningProgress();
                  startLearningGame();
                }} 
                className="w-full text-lg py-6"
              >
                Ucz się dalej 🚀
              </Button>
            ) : (
              <div className="p-3 bg-green-500/10 text-green-600 rounded-lg text-sm font-semibold">
                🎉 Gratulacje! Znasz już wszystkie kraje na mapie!
              </div>
            )}
            <Button variant="outline" onClick={handleResetProgress} className="w-full text-destructive hover:bg-destructive/10">
              Resetuj postęp nauki 🔄
            </Button>
            <Button variant="ghost" onClick={() => { setGameType(null); setGameStarted(false); }} className="w-full">
              Wróć do wyboru trybu
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // --- EKRAN KONIEC GRY KLASYCZNEJ LUB NA CZAS ---
  if (gameOver || timeGameOver) {
    return (
      <GameResult 
        score={score} 
        totalQuestions={gameType === "time" ? Math.max(1, attempted) : shuffledCountries.length} 
        onRestart={gameType === "time" ? startTimeAttackGame : startNewGame} 
        emojiThresholds={{ low: "📍", medium: "🗺️", high: "🌍" }}
        gameMode={gameType === "time" ? "MAP_TIME" : "MAP"}
      />
    );
  }

  if (!currentCountry) return <div>Błąd danych.</div>;

  // --- EKRAN GRY ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-primary/10 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => { setGameType(null); setGameStarted(false); }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Zmień tryb
          </Button>
          {gameType === "learning" && (
            <Button variant="destructive" size="sm" onClick={handleResetProgress}>
              Resetuj progres 🔄
            </Button>
          )}
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            {gameType === "time" ? (
              <>
                <span className="text-sm font-bold text-destructive animate-pulse flex items-center gap-1">
                  ⏱️ Czas: {timeLeft}s
                </span>
                <span className="text-sm font-bold flex items-center">
                  🎯 Wynik: {score} / {attempted}
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium">
                  Pytanie {currentCountryIndex + 1} z {shuffledCountries.length}
                </span>
                <span className="text-sm font-medium flex items-center">
                  <Trophy className="mr-1 h-4 w-4 text-accent" />
                  Wynik: {score}
                </span>
              </>
            )}
          </div>
          {gameType !== "time" && <Progress value={progress} className="h-2" />}
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
            {gameType === "time" ? "Następny kraj" : (currentCountryIndex < shuffledCountries.length - 1 ? "Następny kraj" : "Zobacz wynik")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default MapGame;