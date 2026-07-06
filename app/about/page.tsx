'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PublicHeader from "@/components/layout/PublicHeader";
import {
  Lightbulb,
  CheckSquare,
  UserCheck,
  TrendingUp,
  HelpCircle,
  Trophy,
  Check,
  MapPin,
  GraduationCap,
  Target,
  Eye,
} from "lucide-react";

const PILLARS = [
  { icon: Lightbulb, title: "Concept-Based Learning", desc: "Understanding first, memorizing later. Building strong foundations." },
  { icon: CheckSquare, title: "Regular Tests & Assessments", desc: "Continuous mapping of progress via digital dashboards." },
  { icon: UserCheck, title: "Individual Attention", desc: "Hard seat limits enforce a personalized approach." },
  { icon: TrendingUp, title: "Performance Tracking", desc: "Real-time visibility for students and parent portals." },
  { icon: HelpCircle, title: "Doubt Clearing Sessions", desc: "Lightweight doubt submission inbox with faculty routing." },
  { icon: Trophy, title: "Result Oriented", desc: "Exam-focused prep for classes and professional modules." },
];

const TRUST_ITEMS = [
  "Experienced & caring faculty",
  "Small batch size",
  "Disciplined & supportive environment",
  "Personalised attention",
  "Regular parent feedback",
];

const FACULTY = [
  {
    name: "Priya Kulkarni",
    initials: "PK",
    color: "bg-primary",
    specialization: "Mathematics",
    grades: "Classes 6-10, 11-12",
    bio: "With over a decade of teaching experience, Priya specializes in making mathematics intuitive and accessible for secondary and higher-secondary students.",
  },
  {
    name: "Amit Desai",
    initials: "AD",
    color: "bg-info",
    specialization: "Science",
    grades: "Classes 6-10",
    bio: "Amit brings laboratory-style teaching to the classroom, emphasising conceptual clarity in Physics, Chemistry, and Biology for foundational years.",
  },
  {
    name: "Sunita Joshi",
    initials: "SJ",
    color: "bg-[#6A1B9A]",
    specialization: "CA Foundation & Intermediate",
    grades: "Professional Prep",
    bio: "Sunita is a qualified Chartered Accountant who guides aspiring CAs through the Foundation and Intermediate levels with structured, exam-oriented instruction.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <PublicHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                About Us
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-dark leading-[1.15] tracking-tight">
                About Kaushiki Classes
              </h1>
              <p className="font-display text-xl sm:text-2xl font-semibold text-primary">
                Learn. Grow. Excel.
              </p>
              <p className="font-sans text-lg text-muted leading-relaxed max-w-2xl mx-auto">
                At Kaushiki Classes, we believe that quality education begins with personalised attention.
                Our institution is built on the philosophy of small batch sizes, ensuring every student
                receives the guidance they need to thrive academically and personally. From primary school
                to CA preparation, we are committed to delivering excellence in education through disciplined
                instruction, regular assessments, and a supportive learning environment.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-surface">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="border-t-4 border-t-primary border-border">
                <CardHeader className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-primary-subtle rounded-md">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="font-display text-xl text-dark">Our Mission</CardTitle>
                </CardHeader>
                <CardContent className="text-center font-sans text-muted">
                  To provide every student with the individual attention they deserve through small, focused batches.
                </CardContent>
              </Card>
              <Card className="border-t-4 border-t-primary border-border">
                <CardHeader className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-primary-subtle rounded-md">
                    <Eye className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="font-display text-xl text-dark">Our Vision</CardTitle>
                </CardHeader>
                <CardContent className="text-center font-sans text-muted">
                  To be the most trusted coaching centre in Pune for academic excellence and character development.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 bg-bg">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center space-y-12">
            <div className="space-y-4 max-w-2xl mx-auto">
              <span className="font-sans font-semibold text-xs text-primary uppercase tracking-widest">
                Our Philosophy
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-dark">
                The 6 Pillars of Kaushiki Classes
              </h2>
              <p className="font-sans text-muted">
                Our educational philosophy is designed around our students&apos; success, ensuring personal attention and conceptual mastery.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {PILLARS.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <Card key={idx} className="border-border hover:translate-y-[-3px] hover:shadow-md transition-all duration-200">
                    <CardHeader className="flex flex-col items-center space-y-2">
                      <div className="p-3 bg-primary-subtle rounded-md">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="font-display text-lg text-dark">{p.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="font-sans text-sm text-muted">
                      {p.desc}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-dark text-white py-8">
          <div className="container mx-auto px-4 max-w-7xl overflow-x-auto whitespace-nowrap scrollbar-hide">
            <div className="flex justify-between items-center gap-8 min-w-[800px] text-sm font-sans font-medium">
              {TRUST_ITEMS.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-surface">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <span className="font-sans font-semibold text-xs text-primary uppercase tracking-widest">
                Our Team
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-dark">
                Meet Our Faculty
              </h2>
              <p className="font-sans text-muted">
                Dedicated educators committed to your child&apos;s academic journey.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {FACULTY.map((f, idx) => (
                <Card key={idx} className="border-border hover:translate-y-[-3px] hover:shadow-md transition-all duration-200">
                  <CardHeader className="flex flex-col items-center text-center space-y-3">
                    <div className={`h-16 w-16 rounded-full ${f.color} flex items-center justify-center text-white font-bold text-xl shadow-sm`}>
                      {f.initials}
                    </div>
                    <div>
                      <CardTitle className="font-display text-lg text-dark">{f.name}</CardTitle>
                      <p className="font-sans text-sm font-semibold text-primary mt-1">{f.specialization}</p>
                      <p className="font-sans text-xs text-muted mt-0.5">{f.grades}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="font-sans text-sm text-muted text-center">
                    {f.bio}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-bg">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-10">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <span className="font-sans font-semibold text-xs text-primary uppercase tracking-widest">
                Visit Us
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-dark">
                Our Location
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-sans font-semibold text-dark">Kaushiki Classes</p>
                    <p className="font-sans text-sm text-muted leading-relaxed">
                      Survey No. 36 S, Jambhulwadi Road, Shani Nagar,<br />
                      Ambegaon Khurd, Pune – 411046
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-sans font-semibold text-dark">Nearby Landmark</p>
                    <p className="font-sans text-sm text-muted leading-relaxed">
                      Located in the heart of Ambegaon Khurd, easily accessible from Sinhagad Road and surrounding areas.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3784.1!2d73.85!3d18.45!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMThCsjI3JzAwLjAiTiA3M8KwNTEnMDAuMCJF!5e0!3m2!1sen!2sin!4v1"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Kaushiki Classes Location"
                />
              </div>
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
