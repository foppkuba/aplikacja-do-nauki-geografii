import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useCountries } from "@/hooks/useCountries";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GameResult } from "@/components/GameResult";
import { getFlagUrl, shuffleArray } from "@/lib/utils";
import { Country } from "@/types/Country";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Typ pytania w Quizie
interface Question {
  country: string;
  correctAnswer: string;
  options: string[];
  flagCode: string; // Trzymamy kod, żeby wygenerować URL do flagi
}

const Quiz = () => {
  const { data: allCountries = [], isLoading } = useCountries();
  const { user, isAuthenticated, addXp } = useAuth();

  // Stan gry
  const [gameType, setGameType] = useState<"standard" | "learning" | "time" | null>(null);
  const [learnedCodes, setLearnedCodes] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [attempted, setAttempted] = useState(0);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Zegar dla trybu na czas
  useEffect(() => {
    if (gameType !== "time" || !gameStarted || showResult) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowResult(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameType, gameStarted, showResult]);

  const fetchLearningProgress = async () => {
    if (!isAuthenticated || !user) return;
    setLoadingProgress(true);
    try {
      const response = await fetch(`/api/learning/progress?username=${encodeURIComponent(user)}&gameMode=QUIZ`);
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
          gameMode: "QUIZ",
          countryCode
        })
      });
    } catch (e) {
      console.error("Błąd zapisu postępu w bazie", e);
    }
  };

  const startNewGame = React.useCallback(() => {
    if (allCountries.length < 4) return;

    const shuffled = shuffleArray(allCountries);
    const gameCount = Math.min(10, shuffled.length);

    const quizQuestions: Question[] = shuffled.slice(0, gameCount).map((targetCountry) => {
      const otherCountries = allCountries.filter((c) => c.code !== targetCountry.code);
      const wrongAnswers = shuffleArray(otherCountries)
        .slice(0, 3)
        .map((c) => c.capital);
      const options = shuffleArray([...wrongAnswers, targetCountry.capital]);
      
      return {
        country: targetCountry.name,
        correctAnswer: targetCountry.capital,
        options,
        flagCode: targetCountry.code,
      };
    });
    
    setQuestions(quizQuestions);
    setCurrentQuestion(0);
    setScore(0);
    setAttempted(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setGameType("standard");
    setGameStarted(true);
  }, [allCountries]);

  const startTimeAttackGame = React.useCallback(() => {
    if (allCountries.length < 4) return;

    const shuffled = shuffleArray(allCountries);

    const quizQuestions: Question[] = shuffled.map((targetCountry) => {
      const otherCountries = allCountries.filter((c) => c.code !== targetCountry.code);
      const wrongAnswers = shuffleArray(otherCountries)
        .slice(0, 3)
        .map((c) => c.capital);
      const options = shuffleArray([...wrongAnswers, targetCountry.capital]);
      
      return {
        country: targetCountry.name,
        correctAnswer: targetCountry.capital,
        options,
        flagCode: targetCountry.code,
      };
    });
    
    setQuestions(quizQuestions);
    setCurrentQuestion(0);
    setScore(0);
    setAttempted(0);
    setTimeLeft(60);
    setShowResult(false);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setGameType("time");
    setGameStarted(true);
  }, [allCountries]);

  const startLearningGame = React.useCallback(async (latestLearnedCodes?: string[]) => {
    const activeLearned = latestLearnedCodes !== undefined ? latestLearnedCodes : learnedCodes;
    if (allCountries.length < 4) return;

    const unlearned = allCountries.filter(c => !activeLearned.includes(c.code));
    
    if (unlearned.length === 0) {
      setQuestions([]);
      setCurrentQuestion(0);
      setScore(0);
      setShowResult(false);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setGameType("learning");
      setGameStarted(true);
      return;
    }

    const shuffledUnlearned = shuffleArray(unlearned);
    const gameCount = Math.min(10, shuffledUnlearned.length);
    const targetSet = shuffledUnlearned.slice(0, gameCount);

    const quizQuestions: Question[] = targetSet.map((targetCountry) => {
      const otherCountries = allCountries.filter((c) => c.code !== targetCountry.code);
      const wrongAnswers = shuffleArray(otherCountries)
        .slice(0, 3)
        .map((c) => c.capital);
      const options = shuffleArray([...wrongAnswers, targetCountry.capital]);
      
      return {
        country: targetCountry.name,
        correctAnswer: targetCountry.capital,
        options,
        flagCode: targetCountry.code,
      };
    });

    setQuestions(quizQuestions);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setIsAnswered(false);
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
          gameMode: "QUIZ"
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

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    setAttempted(prev => prev + 1);
    
    if (answer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
      if (isAuthenticated && user) {
        addXp(10);
        toast.success("+10 XP! 🎉", { duration: 1000, position: "top-center" });
      }
      if (gameType === "learning" && isAuthenticated && user) {
        const countryCode = questions[currentQuestion].flagCode;
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
            setShowResult(true);
          }
          return nextTime;
        });
      }
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      if (gameType === "time") {
        const shuffled = shuffleArray(allCountries);
        const quizQuestions: Question[] = shuffled.map((targetCountry) => {
          const otherCountries = allCountries.filter((c) => c.code !== targetCountry.code);
          const wrongAnswers = shuffleArray(otherCountries)
            .slice(0, 3)
            .map((c) => c.capital);
          const options = shuffleArray([...wrongAnswers, targetCountry.capital]);
          
          return {
            country: targetCountry.name,
            correctAnswer: targetCountry.capital,
            options,
            flagCode: targetCountry.code,
          };
        });
        setQuestions(prev => [...prev, ...quizQuestions]);
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
      } else {
        setShowResult(true);
      }
    }
  };

  // --- UI: Ładowanie ---
  if (isLoading) {
    return <LoadingScreen message="Przygotowywanie pytań..." />;
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
              <h1 className="text-3xl font-extrabold">Quiz ze znajomości stolic 🧠</h1>
              <p className="text-muted-foreground mt-1">Wybierz sposób rozgrywki</p>
            </div>
          </div>
          <div className="p-6 md:p-8 grid md:grid-cols-3 gap-6">
            {/* Tryb Klasyczny */}
            <Card className="flex flex-col justify-between hover:border-primary/50 transition-all duration-300 shadow-sm">
              <div className="p-6 pb-0">
                <h3 className="text-xl font-bold mb-2">Tryb Klasyczny 🎯</h3>
                <p className="text-sm text-muted-foreground">
                  Odpowiedz na 10 losowych pytań. Po zakończeniu możesz opublikować swój wynik w rankingu i rywalizować z innymi!
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
                    Musisz się zalogować, aby zapisywać postęp w nauce krajów.
                  </p>
                  <Link to="/auth">
                    <Button size="sm">Zaloguj się teraz</Button>
                  </Link>
                </div>
              )}
              <div className="p-6 pb-0">
                <h3 className="text-xl font-bold mb-2">Tryb Nauki 📖</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ucz się bez końca! Odpowiadasz na pytania dotyczące krajów, których jeszcze nie znasz. Twój postęp zapisuje się w bazie.
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
                  Odpowiedz na jak najwięcej pytań zanim skończy się czas! +2s za poprawną odpowiedź, -3s za błędną. Rywalizuj w osobnym rankingu!
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
  if (gameType === "learning" && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full p-6 text-center shadow-xl border-border/50">
          <div className="text-6xl mb-4">🎉</div>
          <CardTitle className="text-3xl font-bold mb-2">Gratulacje! 🥳</CardTitle>
          <p className="text-muted-foreground mb-6">
            Opanowałeś już wszystkie {allCountries.length} krajów w quizie stolic! Twój postęp wynosi 100%.
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

  // --- UI: Błąd (za mało danych) ---
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Brak danych do quizu</h2>
        <p className="mb-4">Potrzebujemy przynajmniej 4 krajów w bazie, aby uruchomić quiz.</p>
        <Link to="/">
          <Button>Wróć do menu</Button>
        </Link>
      </div>
    );
  }

  // --- UI: Wyniki rundy nauki ---
  if (gameType === "learning" && showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full p-6 text-center shadow-xl border-border/50">
          <div className="text-6xl mb-4">📖</div>
          <CardTitle className="text-3xl font-bold mb-2">Koniec rundy nauki!</CardTitle>
          <p className="text-muted-foreground mb-4">
            W tej rundzie odpowiedziałeś poprawnie na <span className="font-bold text-foreground">{score} z {questions.length}</span> pytań.
          </p>
          <div className="bg-muted p-4 rounded-xl mb-6">
            <p className="text-sm text-muted-foreground mb-2">Twój całkowity postęp nauki:</p>
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
                🎉 Gratulacje! Znasz już wszystkie kraje!
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

  // --- UI: Wyniki ---
  if (showResult) {
    return (
      <GameResult 
        score={score} 
        totalQuestions={gameType === "time" ? Math.max(1, attempted) : questions.length} 
        onRestart={gameType === "time" ? startTimeAttackGame : startNewGame} 
        gameMode={gameType === "time" ? "QUIZ_TIME" : "QUIZ"}
      />
    );
  }

  // --- UI: Gra ---
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => { setGameType(null); setGameStarted(false); }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zmień tryb
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
                  Pytanie {currentQuestion + 1} z {questions.length}
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
                src={getFlagUrl(question.flagCode)} 
                alt={`Flaga ${question.country}`} 
                className="w-48 h-auto object-cover mx-auto rounded-lg shadow-md mb-4 border" 
            />
            <CardTitle className="text-3xl mb-2">
              Jaka jest stolica kraju: {question.country}?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {question.options.map((option, index) => {
              const isCorrect = option === question.correctAnswer;
              const isSelected = option === selectedAnswer;
              
              let buttonVariant: "default" | "outline" | "destructive" | "secondary" = "outline";
              
              if (isAnswered) {
                if (isCorrect) {
                  buttonVariant = "secondary"; // Zielony (zależnie od theme)
                } else if (isSelected && !isCorrect) {
                  buttonVariant = "destructive";
                }
              }

              return (
                <Button
                  key={index}
                  variant={buttonVariant}
                  className={`w-full h-auto p-6 text-lg justify-start transition-all duration-300 ${
                    isAnswered && isCorrect ? "bg-green-100 hover:bg-green-200 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-500" : ""
                  }`}
                  onClick={() => handleAnswer(option)}
                  disabled={isAnswered}
                >
                  <span className="mr-4 text-2xl font-bold text-muted-foreground">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                  {isAnswered && isCorrect && <span className="ml-auto text-2xl">✓</span>}
                  {isAnswered && isSelected && !isCorrect && <span className="ml-auto text-2xl">✗</span>}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {isAnswered && (
          <Button 
            onClick={handleNext} 
            size="lg" 
            className="w-full animate-in fade-in zoom-in duration-300"
          >
            {currentQuestion < questions.length - 1 ? "Następne pytanie" : "Zobacz wynik"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Quiz;