import { useState, useEffect } from "react";
import { Search, X, Clock, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// Mock data - in a real app you would fetch this from the API
const mockDeals = [
  { id: 1, reference: "DEAL-001", advertiser: "Google", value: 250000, status: "pending" },
  { id: 2, reference: "DEAL-002", advertiser: "Amazon", value: 180000, status: "approved" },
  { id: 3, reference: "DEAL-003", advertiser: "Meta", value: 320000, status: "pending" },
  { id: 4, reference: "DEAL-004", advertiser: "Microsoft", value: 440000, status: "rejected" },
  { id: 5, reference: "DEAL-005", advertiser: "Apple", value: 560000, status: "approved" },
];

export function SmartSearch() {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();
  
  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse search history", e);
        setSearchHistory([]);
      }
    }
  }, []);
  
  // Save search history to localStorage
  const saveSearchHistory = (history: string[]) => {
    localStorage.setItem("searchHistory", JSON.stringify(history));
    setSearchHistory(history);
  };
  
  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Filter deals
    const results = mockDeals.filter(deal => 
      deal.reference.toLowerCase().includes(term.toLowerCase()) ||
      deal.advertiser.toLowerCase().includes(term.toLowerCase())
    );
    
    setSearchResults(results);
    
    // Add to search history if not empty and not already in history
    if (term.trim() && !searchHistory.includes(term)) {
      const newHistory = [term, ...searchHistory].slice(0, 5); // Keep last 5 searches
      saveSearchHistory(newHistory);
    }
  };
  
  // Clear search history
  const clearHistory = () => {
    localStorage.removeItem("searchHistory");
    setSearchHistory([]);
  };
  
  // Handle selecting a search result
  const handleSelectResult = (dealId: number) => {
    setIsOpen(false);
    // In a real app, navigate to the deal detail page
    setLocation(`/dashboard/deals/${dealId}`);
  };
  
  // Handle selecting a history item
  const handleSelectHistory = (term: string) => {
    setSearchTerm(term);
    handleSearch(term);
  };
  
  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search deals, advertisers..."
              className="pl-10 w-[280px] bg-white focus:ring-2 focus:ring-[#e9ddff] transition-all duration-200"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsOpen(true)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => {
                  setSearchTerm("");
                  setSearchResults([]);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search deals..." 
              value={searchTerm}
              onValueChange={handleSearch}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              
              {searchResults.length > 0 && (
                <CommandGroup heading="Search Results">
                  {searchResults.map((deal) => (
                    <CommandItem 
                      key={deal.id}
                      onSelect={() => handleSelectResult(deal.id)}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-sm">{deal.reference}</p>
                        <p className="text-xs text-gray-500">{deal.advertiser}</p>
                      </div>
                      <div className="flex items-center">
                        <span 
                          className={`text-xs px-2 py-1 rounded-full ${
                            deal.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : deal.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {deal.status}
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 ml-2 text-gray-500" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {searchResults.length === 0 && searchHistory.length > 0 && (
                <CommandGroup heading="Search History">
                  {searchHistory.map((term, index) => (
                    <CommandItem 
                      key={index}
                      onSelect={() => handleSelectHistory(term)}
                    >
                      <Clock className="h-3.5 w-3.5 mr-2 text-gray-500" />
                      <span>{term}</span>
                    </CommandItem>
                  ))}
                  <CommandItem onSelect={clearHistory} className="text-red-500 justify-center">
                    Clear history
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}