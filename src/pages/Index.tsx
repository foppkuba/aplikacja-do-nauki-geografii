import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Brain, Map, Flag, User, LogOut, Trophy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Panel logowania w prawym górnym rogu */}
      <div className="fixed top-4 right-[70px] z-50 flex items-center gap-2">
        {isAuthenticated ? (
          <div className="flex items-center gap-2 bg-card/85 border shadow-sm px-3 py-1.5 rounded-full text-sm backdrop-blur-sm">
            <User className="h-4 w-4 text-primary" />
            <span className="font-semibold max-w-[120px] truncate" title={user || ""}>{user}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Wyloguj się"
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Link to="/auth">
            <Button variant="outline" className="shadow-sm rounded-full bg-background/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Zaloguj się</span>
            </Button>
          </Link>
        )}
      </div>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-in fade-in duration-1000">
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            GeoWiedza dla Dzieci
          </span>
          <span className="ml-2">🌍</span>
        </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-in fade-in duration-1000 delay-200">
            Poznaj kraje Europy w zabawny i interaktywny sposób!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in duration-1000 delay-300">
            <Link to="/learn">
              <Button size="lg" className="text-lg px-8 py-6 h-auto">
                Zacznij naukę! 🚀
              </Button>
            </Link>
            <Link to="/ranking?mode=QUIZ">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Rankingi 🏆
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <div className="block group">
            <Card className="h-full flex flex-col justify-between transition-all duration-300 hover:shadow-[var(--shadow-hover)] hover:scale-[1.02]">
              <div>
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Biblioteka Krajów</CardTitle>
                  <CardDescription className="text-base">
                    Poznaj 40 krajów europejskich
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <span className="mr-2">🌟</span>
                      <span>Interaktywne fiszki z krajami</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">🏛️</span>
                      <span>Stolice i ciekawe fakty</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">📊</span>
                      <span>Informacje o populacji i powierzchni</span>
                    </li>
                  </ul>
                </CardContent>
              </div>
              <div className="p-6 pt-0 mt-auto">
                <Link to="/learn" className="block w-full">
                  <Button className="w-full">Otwórz bibliotekę 📖</Button>
                </Link>
              </div>
            </Card>
          </div>

          <div className="block group">
            <Card className="h-full flex flex-col justify-between transition-all duration-300 hover:shadow-[var(--shadow-hover)] hover:scale-[1.02]">
              <div>
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-secondary to-secondary/50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Quiz Geograficzny</CardTitle>
                  <CardDescription className="text-base">
                    Sprawdź swoją wiedzę!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <span className="mr-2">❓</span>
                      <span>10 pytań o stolice krajów</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">🎯</span>
                      <span>Pytania wielokrotnego wyboru</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">🏆</span>
                      <span>Zdobywaj punkty i poprawiaj rekordy</span>
                    </li>
                  </ul>
                </CardContent>
              </div>
              <div className="p-6 pt-0 flex gap-2 mt-auto">
                <Link to="/quiz" className="flex-1">
                  <Button className="w-full">Zagraj 🎯</Button>
                </Link>
                <Link to="/ranking?mode=QUIZ">
                  <Button variant="outline" size="icon" title="Ranking">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          <div className="block group">
            <Card className="h-full flex flex-col justify-between transition-all duration-300 hover:shadow-[var(--shadow-hover)] hover:scale-[1.02]">
              <div>
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-accent to-accent/50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Map className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Gra Mapowa</CardTitle>
                  <CardDescription className="text-base">
                    Znajdź kraje na mapie!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <span className="mr-2">🗺️</span>
                      <span>Interaktywna mapa Europy</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">📍</span>
                      <span>Kliknij na właściwy kraj</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">🎮</span>
                      <span>Ucz się geografii poprzez zabawę</span>
                    </li>
                  </ul>
                </CardContent>
              </div>
              <div className="p-6 pt-0 flex gap-2 mt-auto">
                <Link to="/map" className="flex-1">
                  <Button className="w-full">Zagraj 🗺️</Button>
                </Link>
                <Link to="/ranking?mode=MAP">
                  <Button variant="outline" size="icon" title="Ranking">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          <div className="block group">
            <Card className="h-full flex flex-col justify-between transition-all duration-300 hover:shadow-[var(--shadow-hover)] hover:scale-[1.02]">
              <div>
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-300 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Flag className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Nauka Flag</CardTitle>
                  <CardDescription className="text-base">
                    Poznaj flagi krajów!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <span className="mr-2">🚩</span>
                      <span>Zgaduj nazwy krajów po flagach</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">🎯</span>
                      <span>4 odpowiedzi do wyboru</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">🏅</span>
                      <span>Zdobywaj punkty za prawidłowe odpowiedzi</span>
                    </li>
                  </ul>
                </CardContent>
              </div>
              <div className="p-6 pt-0 flex gap-2 mt-auto">
                <Link to="/flags" className="flex-1">
                  <Button className="w-full">Zagraj 🚩</Button>
                </Link>
                <Link to="/ranking?mode=FLAGS">
                  <Button variant="outline" size="icon" title="Ranking">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-3xl p-8 md:p-12 border border-border">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Co możesz się nauczyć?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-primary mb-2">40</div>
              <p className="text-muted-foreground">Krajów europejskich</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-secondary mb-2">40</div>
              <p className="text-muted-foreground">Stolic do zapamiętania</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-accent mb-2">∞</div>
              <p className="text-muted-foreground">Możliwości nauki</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t">
        <p>GeoWiedza dla Dzieci © 2025 - Nauka geografii nigdy nie była tak zabawna!</p>
      </footer>
    </div>
  );
};

export default Index;
