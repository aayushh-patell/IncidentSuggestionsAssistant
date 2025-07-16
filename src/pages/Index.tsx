// Home/Landing Page for Incident Insights

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F3]">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-12">
        {/* Illustration/Icon */}
        <div className="mb-8">
          {/* Decorative SVG for hero */}
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="40" fill="#E3C7F7"/>
            <rect x="22" y="32" width="36" height="16" rx="8" fill="#B8E0D2"/>
            <rect x="30" y="40" width="20" height="8" rx="4" fill="#A7C7E7"/>
          </svg>
        </div>
        <h1 className="text-5xl font-extrabold mb-4 text-ink drop-shadow-sm">Incident Insights</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-xl text-center">
          Surface actionable findings from incident transcripts, in real time.
        </p>
        <Button
          className="bg-[#FAF8F3] border border-[#E0DED8] text-black hover:bg-black hover:text-[#FAF8F3] hover:border-black transition-colors font-medium rounded-md px-6 py-3 text-lg flex items-center gap-2 shadow-sm"
          onClick={() => window.location.href = '/dashboard'}
        >
          View Details <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
      {/* Footer */}
      <footer className="w-full bg-[#F3F0E8] border-t border-[#E0DED8] py-4 shadow-md mt-auto">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between px-6">
          <span className="text-sm text-muted-foreground">© 2025 Incident Insights</span>
          <div className="flex gap-4 mt-2 md:mt-0">
            <a href="https://github.com/yourrepo" className="hover:underline text-muted-foreground">GitHub</a>
            <a href="/about" className="hover:underline text-muted-foreground">About</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
