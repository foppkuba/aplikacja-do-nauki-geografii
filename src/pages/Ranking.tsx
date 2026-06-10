import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trophy, User, Users, Calendar, Medal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ScoreEntry {
  id: number;
  username: string;
  gameMode: string;
  score: number;
  maxScore: number;
  createdAt: string;
}

const Ranking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  // Domyślny tryb gry z parametrów URL (QUIZ, MAP, FLAGS)
  const urlMode = searchParams.get("mode") || "QUIZ";
  const [activeGameMode, setActiveGameMode] = useState<string>(urlMode);
  const [viewType, setViewType] = useState<"all" | "personal">("all");
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Synchronizacja stanu z adresem URL przy zmianie
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode && ["QUIZ", "MAP", "FLAGS"].includes(mode)) {
      setActiveGameMode(mode);
    }
  }, [searchParams]);

  // Pobieranie danych z API
  useEffect(() => {
    const fetchScores = async () => {
      setIsLoading(true);
      try {
        let url = `/api/scores/leaderboard?mode=${activeGameMode}`;
        if (viewType === "personal" && isAuthenticated && user) {
          url += `&username=${encodeURIComponent(user)}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setScores(data);
        } else {
          console.error("Błąd pobierania rankingu");
        }
      } catch (error) {
        console.error("Błąd połączenia z serwerem podczas pobierania rankingu", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScores();
  }, [activeGameMode, viewType, user, isAuthenticated]);

  const handleGameModeChange = (mode: string) => {
    setActiveGameMode(mode);
    setSearchParams({ mode });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pl-PL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return "text-yellow-500 fill-yellow-500"; // Złoto
    if (index === 1) return "text-gray-400 fill-gray-400";     // Srebro
    if (index === 2) return "text-amber-600 fill-amber-600";   // Brąz
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Strona główna
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-primary/10 rounded-full text-primary mb-4 animate-bounce">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Ranking Wyników
          </h1>
          <p className="text-muted-foreground mt-2">
            Zobacz najlepsze wyniki w grach geograficznych!
          </p>
        </div>

        <Tabs value={activeGameMode} onValueChange={handleGameModeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="QUIZ" className="text-sm md:text-base">
              🧠 Quiz Stolice
            </TabsTrigger>
            <TabsTrigger value="MAP" className="text-sm md:text-base">
              🗺️ Gra Mapowa
            </TabsTrigger>
            <TabsTrigger value="FLAGS" className="text-sm md:text-base">
              🚩 Nauka Flag
            </TabsTrigger>
          </TabsList>

          <Card className="border border-border/50 shadow-lg">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  {activeGameMode === "QUIZ" && "Quiz ze znajomości stolic"}
                  {activeGameMode === "MAP" && "Gra mapowa (lokalizacja państw)"}
                  {activeGameMode === "FLAGS" && "Rozpoznawanie flag państw"}
                </CardTitle>
                <CardDescription>
                  Lista najlepszych wyników dla wybranego trybu
                </CardDescription>
              </div>

              <div className="flex bg-muted p-1 rounded-lg self-start sm:self-center">
                <Button
                  variant={viewType === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewType("all")}
                  className="rounded-md flex items-center gap-1.5 px-3"
                >
                  <Users className="h-4 w-4" /> Wszyscy
                </Button>
                <Button
                  variant={viewType === "personal" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewType("personal")}
                  className="rounded-md flex items-center gap-1.5 px-3"
                >
                  <User className="h-4 w-4" /> Moje Wyniki
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {viewType === "personal" && !isAuthenticated ? (
                <div className="text-center py-12 space-y-4">
                  <User className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-bold">Brak zalogowania</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Musisz się zalogować, aby śledzić i przeglądać swoje osobiste wyniki rankingowe.
                  </p>
                  <Link to="/auth">
                    <Button className="mt-2">Zaloguj się teraz</Button>
                  </Link>
                </div>
              ) : isLoading ? (
                <div className="text-center py-12 text-muted-foreground animate-pulse">
                  Ładowanie wyników rankingu...
                </div>
              ) : scores.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Brak zapisanych wyników w tym trybie. Bądź pierwszym, który zapisze swój wynik! 🏆
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[80px] text-center font-bold">Miejsce</TableHead>
                        <TableHead>Gracz</TableHead>
                        <TableHead className="text-center">Wynik</TableHead>
                        <TableHead className="text-center">Skuteczność</TableHead>
                        <TableHead className="hidden md:table-cell text-right">Data zapisu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scores.map((score, index) => {
                        const effectiveness = (score.score / score.maxScore) * 100;
                        const isTopThree = index < 3;
                        return (
                          <TableRow 
                            key={score.id} 
                            className={score.username === user ? "bg-primary/5 hover:bg-primary/10 font-semibold" : ""}
                          >
                            <TableCell className="text-center font-bold">
                              {isTopThree ? (
                                <Medal className={`h-6 w-6 mx-auto ${getMedalColor(index)}`} />
                              ) : (
                                `#${index + 1}`
                              )}
                            </TableCell>
                            <TableCell className="flex items-center gap-2 py-4">
                              <span className="truncate">{score.username}</span>
                              {score.username === user && (
                                <span className="bg-primary/15 text-primary text-[10px] px-1.5 py-0.5 rounded-full">
                                  Ty
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {score.score} / {score.maxScore}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                effectiveness >= 80 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                  : effectiveness >= 65
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {effectiveness.toFixed(0)}%
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-right text-muted-foreground text-sm">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(score.createdAt)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
};

export default Ranking;
