import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Check, X, Trophy } from "lucide-react";
import { useCountries } from "@/hooks/useCountries";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GameResult } from "@/components/GameResult";
import { getLargeFlagUrl, shuffleArray } from "@/lib/utils";
import { Country } from "@/types/Country";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const Flags = () => {
  const navigate = useNavigate();
  
  const { data: allCountries = [], isLoading, isError: error } = useCountries();
  const { user, isAuthenticated, addXp } = useAuth();

  // Stan gry
  const [gameType, setGameType] = useState<"standard" | "learning" | "time" | null>(null);
  const [learnedCodes, setLearnedCodes] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [attempted, setAttempted] = useState(0);
  const [timeGameOver, setTimeGameOver] = useState(false);

  const [gameCountries, setGameCountries] = useState<Country[]>([]);
  const [gameStarted, setGameStarted] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);

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
      const response = await fetch(`/api/learning/progress?username=${encodeURIComponent(user)}&gameMode=FLAGS`);
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
          gameMode: "FLAGS",
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
    setGameCountries(gameSet);
    setCurrentIndex(0);
    setScore(0);
    setAttempted(0);
    setTimeGameOver(false);
    setShowResult(false);
    setSelectedAnswer(null);
    setAnsweredQuestions(0);
    setGameType("standard");
    setGameStarted(true);
  }, [allCountries]);

  const startTimeAttackGame = React.useCallback(() => {
    if (allCountries.length === 0) return;
    const gameSet = shuffleArray(allCountries);
    setGameCountries(gameSet);
    setCurrentIndex(0);
    setScore(0);
    setAttempted(0);
    setTimeLeft(60);
    setTimeGameOver(false);
    setShowResult(false);
    setSelectedAnswer(null);
    setAnsweredQuestions(0);
    setGameType("time");
    setGameStarted(true);
  }, [allCountries]);

  const startLearningGame = React.useCallback(async (latestLearnedCodes?: string[]) => {
    const activeLearned = latestLearnedCodes !== undefined ? latestLearnedCodes : learnedCodes;
    if (allCountries.length === 0) return;

    const unlearned = allCountries.filter(c => !activeLearned.includes(c.code));
    
    if (unlearned.length === 0) {
      setGameCountries([]);
      setCurrentIndex(0);
      setScore(0);
      setShowResult(false);
      setSelectedAnswer(null);
      setAnsweredQuestions(0);
      setGameType("learning");
      setGameStarted(true);
      return;
    }

    const shuffledUnlearned = shuffleArray(unlearned);
    const gameCount = Math.min(10, shuffledUnlearned.length);
    const targetSet = shuffledUnlearned.slice(0, gameCount);

    setGameCountries(targetSet);
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setAnsweredQuestions(0);
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
          gameMode: "FLAGS"
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

  // Zabezpieczenie: jeśli lista pusta lub ładowanie
  const currentCountry = gameCountries[currentIndex];

  // 2. GENEROWANIE OPCJI (zaktualizowane pod nową listę)
  const options = useMemo(() => {
    if (!currentCountry || allCountries.length === 0) return [];

    const opts = [currentCountry.name];
    // Filtrujemy po kodzie (bo to unikalny identyfikator zamiast id)
    const otherCountries = allCountries.filter(c => c.code !== currentCountry.code);
    
    // Zabezpieczenie pętli while, jeśli mamy za mało krajów w bazie
    const maxOptions = Math.min(4, otherCountries.length + 1);

    while (opts.length < maxOptions) {
      const randomCountry = otherCountries[Math.floor(Math.random() * otherCountries.length)];
      if (!opts.includes(randomCountry.name)) {
        opts.push(randomCountry.name);
      }
    }
    
    return opts.sort(() => Math.random() - 0.5);
  }, [allCountries, currentCountry]);

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);
    setAnsweredQuestions(prev => prev + 1);
    setAttempted(prev => prev + 1);
    
    if (answer === currentCountry.name) {
      setScore(prev => prev + 1);
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
    if (currentIndex < gameCountries.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowResult(false);
      setSelectedAnswer(null);
    } else {
      if (gameType === "time") {
        const gameSet = shuffleArray(allCountries);
        setGameCountries(prev => [...prev, ...gameSet]);
        setCurrentIndex(prev => prev + 1);
        setShowResult(false);
        setSelectedAnswer(null);
      } else {
        setShowResult(true);
      }
    }
  };

  // --- EKRAN ŁADOWANIA ---
  if (isLoading) {
    return <LoadingScreen message="Ładowanie pytań z serwera..." />;
  }

  // --- UI: Wybór Trybu ---
  if (gameType === null) {
    const progressPercent = allCountries.length > 0 ? (learnedCodes.length / allCountries.length) * 100 : 0;
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-4xl w-full shadow-2xl border-border/50 overflow-hidden">
          <div className="relative p-6 md:p-8 bg-gradient-to-r from-primary/20 to-accent/20 border-b">
            <Button variant="ghost" size="sm" className="absolute top-4 left-4" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Menu główne
            </Button>
            <div className="text-center pt-6 pb-2">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-2 animate-bounce" />
              <h1 className="text-3xl font-extrabold">Nauka Flag 🚩</h1>
              <p className="text-muted-foreground mt-1">Wybierz sposób rozgrywki</p>
            </div>
          </div>
          <div className="p-6 md:p-8 grid md:grid-cols-3 gap-6">
            {/* Tryb Klasyczny */}
            <Card className="flex flex-col justify-between hover:border-primary/50 transition-all duration-300 shadow-sm">
              <div className="p-6 pb-0">
                <h3 className="text-xl font-bold mb-2">Tryb Klasyczny 🎯</h3>
                <p className="text-sm text-muted-foreground">
                  Rozpoznaj 10 losowych flag europejskich. Rywalizuj w tabeli wyników i poprawiaj swoje rekordy!
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
                    Musisz się zalogować, aby zapisywać postęp w nauce flag.
                  </p>
                  <Button size="sm" onClick={() => navigate("/auth")}>Zaloguj się teraz</Button>
                </div>
              )}
              <div className="p-6 pb-0">
                <h3 className="text-xl font-bold mb-2">Tryb Nauki 📖</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ucz się systematycznie! Rozpoznawaj flagi krajów, których jeszcze nie znasz. Twój postęp jest zapisywany.
                </p>
                {isAuthenticated && (
                  <div className="space-y-1.5 mt-2 bg-muted p-3 rounded-lg">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Postęp nauki:</span>
                      <span>{learnedCodes.length} / {allCountries.length} flag</span>
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
                  Rozpoznaj jak najwięcej flag zanim skończy się czas! +2s za poprawną odpowiedź, -3s za błędną. Rywalizuj w osobnym rankingu!
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
  if (gameType === "learning" && gameCountries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full p-6 text-center shadow-xl border-border/50">
          <div className="text-6xl mb-4">🎉</div>
          <CardTitle className="text-3xl font-bold mb-2">Gratulacje! 🥳</CardTitle>
          <p className="text-muted-foreground mb-6">
            Opanowałeś już wszystkie flagi ({allCountries.length}) w tym trybie! Twój postęp wynosi 100%.
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

  // --- EKRAN BŁĘDU ---
  if (error || allCountries.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Ups! Błąd.</h2>
          <p>Nie udało się pobrać flag. Sprawdź czy backend działa.</p>
          <Button onClick={() => navigate("/")} className="mt-4">Wróć</Button>
        </div>
      </div>
    );
  }

  // --- UI: Wyniki rundy nauki ---
  if (gameType === "learning" && answeredQuestions === gameCountries.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full p-6 text-center shadow-xl border-border/50">
          <div className="text-6xl mb-4">📖</div>
          <CardTitle className="text-3xl font-bold mb-2">Koniec rundy nauki!</CardTitle>
          <p className="text-muted-foreground mb-4">
            W tej rundzie rozpoznałeś poprawnie <span className="font-bold text-foreground">{score} z {gameCountries.length}</span> flag.
          </p>
          <div className="bg-muted p-4 rounded-xl mb-6">
            <p className="text-sm text-muted-foreground mb-2">Twój całkowity postęp nauki flag:</p>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Opanowane flagi</span>
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
                🎉 Gratulacje! Znasz już wszystkie flagi!
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

  // --- EKRAN WYNIKU ---
  if ((gameType === "time" ? timeGameOver : answeredQuestions === gameCountries.length) && gameCountries.length > 0) {
    return (
      <GameResult 
        score={score} 
        totalQuestions={gameType === "time" ? Math.max(1, attempted) : gameCountries.length} 
        onRestart={gameType === "time" ? startTimeAttackGame : startNewGame} 
        emojiThresholds={{ low: "🚩", medium: "🗺️", high: "🎉" }}
        messages={{
          low: "Brawo! Pamiętaj, praktyka czyni mistrza!",
          medium: "Świetnie! Prawie wszystkie flagi rozpoznane!",
          high: "Gratulacje! Znasz perfekcyjnie wszystkie flagi!"
        }}
        gameMode={gameType === "time" ? "FLAGS_TIME" : "FLAGS"}
      />
    );
  }

  // --- EKRAN GRY ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
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

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Nauka Flag 🚩</h1>
          {gameType === "time" ? (
            <div className="flex justify-center gap-6 mt-4">
              <p className="text-xl font-bold text-destructive animate-pulse">⏱️ Czas: {timeLeft}s</p>
              <p className="text-xl font-bold">🎯 Wynik: {score} / {attempted}</p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">Pytanie {currentIndex + 1} z {gameCountries.length}</p>
              <p className="text-sm text-muted-foreground mt-2">Wynik: {score} / {answeredQuestions}</p>
            </>
          )}
        </div>

        <Card className="p-8">
          <CardContent className="space-y-8">
            <div className="text-center space-y-4">
              <img 
                src={getLargeFlagUrl(currentCountry.code)} 
                alt={`Flaga`}
                className="mx-auto w-full max-w-md h-auto rounded-lg shadow-lg border"
              />
              <h2 className="text-2xl font-bold">Jaki to kraj?</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((option) => {
                const isCorrect = option === currentCountry.name;
                const isSelected = option === selectedAnswer;
                
                return (
                  <Button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={showResult}
                    variant={
                      showResult
                        ? isCorrect
                          ? "default"
                          : isSelected
                          ? "destructive"
                          : "outline"
                        : "outline"
                    }
                    className="h-auto py-4 text-lg relative"
                  >
                    {option}
                    {showResult && isCorrect && <Check className="ml-2 h-5 w-5 absolute right-4" />}
                    {showResult && isSelected && !isCorrect && <X className="ml-2 h-5 w-5 absolute right-4" />}
                  </Button>
                );
              })}
            </div>

            {showResult && (
              <div className="text-center space-y-4 animate-in fade-in duration-500">
                <p className="text-lg">
                  {selectedAnswer === currentCountry.name ? (
                    <span className="text-green-600 dark:text-green-400 font-bold">✓ Brawo! To {currentCountry.name}!</span>
                  ) : (
                    <span className="text-destructive font-bold">✗ Niestety, to {currentCountry.name}</span>
                  )}
                </p>
                <p className="text-muted-foreground">Stolica: {currentCountry.capital}</p>
                <Button onClick={handleNext}>
                  {currentIndex < gameCountries.length - 1 ? "Następna flaga" : "Zobacz wynik"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Flags;