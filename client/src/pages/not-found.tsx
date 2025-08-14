import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();
  
  const handleGoBack = () => {
    // Safe navigation back - if no history, go to dashboard
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="w-full flex items-center justify-center py-8">
      <Card className="w-full max-w-md mx-4 border border-[#f0e6ff] shadow-lg overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-[#3e0075] to-[#5a0099]"></div>
        <CardContent className="pt-8 pb-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="bg-[#f8f5ff] p-4 rounded-full mb-4">
              <AlertCircle className="h-12 w-12 text-[#3e0075]" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#3e0075] to-[#5a0099] bg-clip-text text-transparent mb-2">
              404 Page Not Found
            </h1>
            <p className="text-slate-600 max-w-sm">
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pb-6 bg-[#f8f5ff]">
          <Button asChild variant="outline" className="border-[#3e0075] text-[#3e0075] hover:bg-[#f1e9fd] hover:text-[#3e0075]">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Link>
          </Button>
          <Button onClick={handleGoBack} className="bg-[#3e0075] hover:bg-[#5a0099]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
