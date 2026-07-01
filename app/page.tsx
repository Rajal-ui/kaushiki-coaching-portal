import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Lightbulb, 
  CheckSquare, 
  UserCheck, 
  TrendingUp, 
  HelpCircle, 
  Trophy, 
  Phone, 
  Mail, 
  MapPin, 
  Check 
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Public Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
              K
            </div>
            <span className="font-display font-bold text-xl text-dark tracking-tight">
              Kaushiki Classes
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 font-sans font-medium text-sm text-body">
            <a href="#" className="text-primary hover:text-primary transition-colors border-b-2 border-primary pb-1 translate-y-[2px]">
              Home
            </a>
            <a href="#programs" className="hover:text-primary transition-colors">
              Programs
            </a>
            <a href="#contact" className="hover:text-primary transition-colors">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Login
            </Button>
            <Button size="sm" asChild>
              <a href="#contact">Inquire Now</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 max-w-xl">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Admissions Open — 2026-27
                </span>
                
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-dark leading-[1.15] tracking-tight">
                  Learn. Grow.{" "}
                  <span className="relative inline-block text-primary">
                    Excel.
                    <svg
                      className="absolute -bottom-2 left-0 w-full h-2 text-primary"
                      viewBox="0 0 100 10"
                      preserveAspectRatio="none"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 7C30 3 70 3 97 7"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </h1>
                
                <p className="font-sans text-lg sm:text-xl text-muted leading-relaxed">
                  Small batches. Individual attention. Real results. Enforcing a physical classroom structure powered by digital learning tracking.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild>
                    <a href="#contact">Inquire About Admissions</a>
                  </Button>
                  <Button variant="secondary" size="lg" asChild>
                    <a href="#programs">View Our Programs</a>
                  </Button>
                </div>
              </div>

              {/* Decorative Right Side */}
              <div className="relative flex justify-center lg:justify-end">
                <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-primary/20 to-primary-light/10 shadow-inner flex items-center justify-center p-8">
                  <div className="w-full h-full rounded-full bg-surface shadow-xl flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <Trophy className="h-16 w-16 text-primary animate-bounce" />
                    <h3 className="font-display font-bold text-xl text-dark">Result Oriented</h3>
                    <p className="font-sans text-sm text-muted">CBSE / ICSE / Commerce / CA Prep</p>
                  </div>
                  
                  {/* Floating badge 1 */}
                  <div className="absolute -top-4 -right-4 bg-surface px-4 py-2 rounded-lg shadow-md border border-border flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-success"></span>
                    <span className="font-sans text-xs font-semibold text-dark">Small Batch Size Enforced</span>
                  </div>

                  {/* Floating badge 2 */}
                  <div className="absolute -bottom-4 -left-4 bg-surface px-4 py-2 rounded-lg shadow-md border border-border flex items-center gap-2">
                    <span className="font-sans text-xs font-semibold text-primary">15+ Active Batches</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Admissions Open Banner */}
        <section className="bg-primary text-white py-4 shadow-md">
          <div className="container mx-auto px-4 text-center font-display font-semibold text-sm sm:text-base flex flex-col sm:flex-row items-center justify-center gap-3">
            <span>Admissions Cycle for 2026–27 Academic Year is Now Active!</span>
            <a href="#contact" className="underline hover:text-primary-subtle transition-colors">
              Submit Lead Form &rarr;
            </a>
          </div>
        </section>

        {/* 6 Pillars Section */}
        <section className="py-20 bg-surface">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center space-y-12">
            <div className="space-y-4 max-w-2xl mx-auto">
              <span className="font-sans font-semibold text-xs text-primary uppercase tracking-widest">
                How We Teach
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-dark">
                Comprehensive Learning For Every Stage
              </h2>
              <p className="font-sans text-muted">
                Our educational philosophy is designed around our students' success, ensuring personal attention and conceptual mastery.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: Lightbulb, title: "Concept-Based Learning", desc: "Understanding first, memorizing later. Building strong foundations." },
                { icon: CheckSquare, title: "Regular Tests & Assessments", desc: "Continuous mapping of progress via digital dashboards." },
                { icon: UserCheck, title: "Individual Attention", desc: "Hard seat limits enforce a personalized approach." },
                { icon: TrendingUp, title: "Performance Tracking", desc: "Real-time visibility for students and parent portals." },
                { icon: HelpCircle, title: "Doubt Clearing Sessions", desc: "Lightweight doubt submission inbox with faculty routing." },
                { icon: Trophy, title: "Result Oriented", desc: "Exam-focused prep for classes and professional modules." }
              ].map((p, idx) => {
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

        {/* Why Parents Trust Us Strip */}
        <section className="bg-dark text-white py-8">
          <div className="container mx-auto px-4 max-w-7xl overflow-x-auto whitespace-nowrap scrollbar-hide">
            <div className="flex justify-between items-center gap-8 min-w-[800px] text-sm font-sans font-medium">
              {[
                "Experienced & caring faculty",
                "Small batch size",
                "Disciplined & supportive environment",
                "Personalised attention",
                "Regular parent feedback"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Programs Preview Section */}
        <section id="programs" className="py-20 bg-bg">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-dark">
                Our Academic Tracks
              </h2>
              <p className="font-sans text-muted">
                From primary school basics up to chartered accountancy preparation, we have batch options for every milestone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Classes 1–5",
                  tag: "CBSE / ICSE / State",
                  color: "border-t-primary text-primary",
                  bg: "bg-primary-subtle",
                  desc: "Concept building in core subjects. Small batch environment to foster learning curiosity.",
                  subjects: ["All General Subjects"]
                },
                {
                  title: "Classes 6–10",
                  tag: "CBSE / ICSE / State",
                  color: "border-t-[#2E7D32] text-[#2E7D32]",
                  bg: "bg-[#E8F5E9]",
                  desc: "Secondary level subject separation. Rigorous preparation for board exams.",
                  subjects: ["Mathematics", "Science", "English", "Social Studies"]
                },
                {
                  title: "Classes 11–12 Commerce",
                  tag: "Junior College",
                  color: "border-t-[#1565C0] text-[#1565C0]",
                  bg: "bg-[#E3F2FD]",
                  desc: "Advanced commercial foundations, accounting principles, and business economics.",
                  subjects: ["Accountancy", "Business Studies", "Economics", "Mathematics/SP/IP"]
                },
                {
                  title: "CA Foundation & Intermediate",
                  tag: "Professional Prep",
                  color: "border-t-[#6A1B9A] text-[#6A1B9A]",
                  bg: "bg-[#F3E5F5]",
                  desc: "Exam-oriented modular instruction by professional accountants to ensure passing rate.",
                  subjects: ["Paper 1: Accounting", "Paper 2: Business Laws", "Quantitative Aptitude", "Business Economics"]
                }
              ].map((track, idx) => (
                <Card key={idx} className={`border border-border border-t-4 ${track.color.split(' ')[0]} hover:translate-y-[-3px] hover:shadow-md transition-all duration-200`}>
                  <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                      <h3 className="font-display font-bold text-2xl text-dark">{track.title}</h3>
                      <span className={`inline-block mt-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${track.bg} ${track.color.split(' ')[1]}`}>
                        {track.tag}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="font-sans text-sm text-muted">{track.desc}</p>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-dark block uppercase tracking-wider">Subjects Covered:</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {track.subjects.map((sub, sIdx) => (
                          <span key={sIdx} className="bg-bg text-dark text-xs px-2 py-0.5 rounded-sm border border-border">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact & Inquiry Section */}
        <section id="contact" className="py-20 bg-surface">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h2 className="font-display font-bold text-3xl text-dark">Get In Touch</h2>
                <p className="font-sans text-muted">
                  Have questions about fees, batch schedules, or demo classes? Write to us or call our Admissions desk directly.
                </p>

                <div className="space-y-4 font-sans text-sm">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-semibold text-muted">Phone Number</p>
                      <a href="tel:+919175498572" className="font-mono text-lg font-bold text-primary hover:underline">
                        +91 9175498572
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-semibold text-muted">Email Address</p>
                      <a href="mailto:kaushikiclasses@klnbs.in" className="text-dark hover:underline">
                        kaushikiclasses@klnbs.in
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-semibold text-muted">Location Address</p>
                      <p className="text-dark leading-relaxed">
                        Survey No. 36 S, Jambhulwadi Road, Shani Nagar, Ambegaon Khurd, Pune – 411046
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="bg-bg p-8 rounded-xl border border-border shadow-xs">
                <form className="space-y-4">
                  <h3 className="font-display font-bold text-xl text-dark pb-2 border-b border-border">Admissions Inquiry</h3>
                  <div>
                    <label className="block text-sm font-medium text-body mb-1">Your Full Name</label>
                    <Input type="text" placeholder="e.g. Rahul Sharma" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-body mb-1">Contact Phone</label>
                    <div className="relative flex rounded-md shadow-xs">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-surface text-muted text-sm font-medium">
                        +91
                      </span>
                      <Input type="tel" placeholder="10-digit number" className="rounded-l-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-body mb-1">Track of Interest</label>
                    <select className="flex h-12 w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-dark shadow-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50">
                      <option>Classes 1–5</option>
                      <option>Classes 6–10</option>
                      <option>Classes 11–12 Commerce</option>
                      <option>CA Foundation & Intermediate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-body mb-1">Message (Optional)</label>
                    <textarea 
                      className="flex min-h-[80px] w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-dark shadow-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25"
                      placeholder="Ask about schedules, fees, or class formats..."
                    />
                  </div>
                  <Button type="button" className="w-full">Submit Lead Inquiry</Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs text-muted">
          <div>
            &copy; {new Date().getFullYear()} Kaushiki Classes. Powered by KLN Business Solutions.
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
