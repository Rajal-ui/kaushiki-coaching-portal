'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, ArrowLeft, BookOpen, Users, Calendar } from "lucide-react";

interface Subject {
  id: string;
  name: string;
}

interface Track {
  id: string;
  name: string;
  boardCoverage: string | null;
  subjects: Subject[];
}

interface Batch {
  id: string;
  capacity: number;
  seatsFilled: number;
  schedule: string;
  status: string;
  subject: { id: string; name: string };
  faculty: { id: string; name: string };
}

const SLUG_MAP: Record<string, string> = {
  "classes-1-5": "CLASSES_1_5",
  "classes-6-10": "CLASSES_6_10",
  "classes-11-12-commerce": "CLASSES_11_12_COMMERCE",
  "ca-foundation": "CA_FOUNDATION_INTERMEDIATE",
};

const FORMATTED_NAMES: Record<string, string> = {
  CLASSES_1_5: "Classes 1-5",
  CLASSES_6_10: "Classes 6-10",
  CLASSES_11_12_COMMERCE: "Classes 11-12 Commerce",
  CA_FOUNDATION_INTERMEDIATE: "CA Foundation & Intermediate",
};

export default function ProgramDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [track, setTrack] = useState<Track | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const trackName = SLUG_MAP[slug];
    if (!trackName) {
      setError("Invalid program. The page you are looking for does not exist.");
      setLoading(false);
      return;
    }

    fetch("/api/tracks")
      .then((r) => r.json())
      .then((data) => {
        const list: Track[] = Array.isArray(data) ? data : data.data ?? [];
        const found = list.find((t) => t.name === trackName);
        if (!found) {
          setError("Program not found.");
          setLoading(false);
          return;
        }
        setTrack(found);
        return fetch(`/api/tracks/${found.id}/batches`);
      })
      .then((res) => res && res.json())
      .then((data) => {
        if (data) {
          setBatches(Array.isArray(data) ? data : data.data ?? []);
        }
      })
      .catch(() => setError("Failed to load program details. Please try again later."))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-bg">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="font-sans text-muted">Loading program details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="flex flex-col min-h-screen bg-bg">
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-auto border-border text-center">
            <CardHeader>
              <div className="flex justify-center mb-2">
                <AlertCircle className="h-12 w-12 text-error" />
              </div>
              <CardTitle className="font-display text-xl text-dark">Oops!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-sans text-muted">{error || "Something went wrong."}</p>
              <Button variant="secondary" asChild>
                <Link href="/#programs">Back to Programs</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formattedName = FORMATTED_NAMES[track.name] || track.name.replace(/_/g, " ");

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
              K
            </div>
            <span className="font-display font-bold text-xl text-dark tracking-tight">
              Kaushiki Classes
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 font-sans font-medium text-sm text-body">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/#programs" className="hover:text-primary transition-colors">
              Programs
            </Link>
            <a href="/#contact" className="hover:text-primary transition-colors">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="inline-flex items-center justify-center h-9 px-4 text-sm rounded-sm font-sans font-medium transition-all bg-transparent text-muted hover:bg-border hover:text-dark">
              Login
            </Link>
            <Link href="/signup" className="inline-flex items-center justify-center h-9 px-4 text-sm rounded-sm font-sans font-medium transition-all bg-primary text-white hover:bg-primary-light">
              Sign Up
            </Link>
            <Button size="sm" asChild>
              <a href="/#contact">Inquire Now</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-12 bg-surface border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <Link href="/#programs" className="inline-flex items-center gap-1.5 font-sans text-sm text-muted hover:text-primary transition-colors mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Programs
            </Link>
            <div className="space-y-4">
              <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-dark">
                {formattedName}
              </h1>
              {track.boardCoverage && (
                <span className="inline-block rounded-full bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary">
                  {track.boardCoverage}
                </span>
              )}
              <p className="font-sans text-muted max-w-2xl">
                Explore available batches, faculty, and schedules for this academic track.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 bg-bg">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-12">
            {track.subjects.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-2xl text-dark flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  Subjects Covered
                </h2>
                <div className="flex flex-wrap gap-2">
                  {track.subjects.map((s) => (
                    <span key={s.id} className="bg-surface text-dark text-sm px-3 py-1.5 rounded-sm border border-border font-sans">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <h2 className="font-display font-bold text-2xl text-dark flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Open Batches
              </h2>

              {batches.length === 0 ? (
                <Card className="border-border">
                  <CardContent className="py-12 text-center">
                    <p className="font-sans text-muted">No active batches available for this track at the moment. Please check back later.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {batches.map((batch) => {
                    const fillPct = batch.capacity > 0 ? Math.round((batch.seatsFilled / batch.capacity) * 100) : 0;
                    const isFull = batch.seatsFilled >= batch.capacity;
                    return (
                      <Card key={batch.id} className="border-border hover:translate-y-[-3px] hover:shadow-md transition-all duration-200">
                        <CardHeader>
                          <CardTitle className="font-display text-lg text-dark">{batch.subject.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-2 font-sans text-sm text-muted">
                            <Users className="h-4 w-4 shrink-0" />
                            <span>{batch.faculty.name}</span>
                          </div>
                          {batch.schedule && (
                            <div className="flex items-center gap-2 font-sans text-sm text-muted">
                              <Calendar className="h-4 w-4 shrink-0" />
                              <span>{batch.schedule}</span>
                            </div>
                          )}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-sans text-muted">
                              <span>Seats</span>
                              <span>{batch.seatsFilled} / {batch.capacity}</span>
                            </div>
                            <div className="bg-border rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  isFull ? "bg-error" : fillPct >= 80 ? "bg-warning" : fillPct >= 50 ? "bg-primary" : "bg-success"
                                }`}
                                style={{ width: `${Math.min(100, fillPct)}%` }}
                              />
                            </div>
                          </div>
                          {isFull ? (
                            <Button variant="secondary" className="w-full" asChild>
                              <a href="/#contact">Batch Full &mdash; Join Waitlist</a>
                            </Button>
                          ) : (
                            <Button className="w-full" asChild>
                              <a href="/#contact">Inquire Now</a>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-primary text-white py-16">
          <div className="container mx-auto px-4 max-w-7xl text-center space-y-6">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Admissions Open 2026-27
            </h2>
            <p className="font-sans text-lg text-white/80 max-w-xl mx-auto">
              Enrolments are now being accepted across all tracks. Limited seats per batch — secure your spot today.
            </p>
            <Button size="lg" variant="secondary" className="border-white text-white hover:bg-white hover:text-primary bg-transparent" asChild>
              <a href="/#contact">Inquire Today</a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface py-8">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs text-muted">
          <div>
            &copy; 2026 Kaushiki Classes. Powered by KLN Business Solutions.
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary">Privacy Policy</a>
            <a href="#" className="hover:text-primary">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
