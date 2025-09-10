"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Menu, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function Header() {
  const [searchValue, setSearchValue] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Soil Analysis Complete",
      message: "Your clay soil analysis is ready for review",
      timestamp: "2 min ago",
      read: false
    },
    {
      id: "2", 
      title: "Weather Alert",
      message: "Heavy rain expected in your area tomorrow",
      timestamp: "1 hour ago",
      read: false
    }
  ]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearchClear = () => {
    setSearchValue("");
    searchInputRef.current?.focus();
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleSettingsSave = () => {
    setIsSettingsOpen(false);
    toast.success("Settings saved successfully");
  };

  const handleProfileAction = (action: string) => {
    switch (action) {
      case "account":
        toast.info("Opening account settings...");
        break;
      case "help":
        toast.info("Opening help center...");
        break;
      case "signout":
        toast.success("Signed out successfully");
        break;
    }
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-4 lg:px-6">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <div className="w-4 h-4 bg-primary-foreground rounded-sm"></div>
          </div>
          {!isMobile && (
            <h1 className="text-lg font-semibold text-foreground">SoilScope</h1>
          )}
        </div>

        {/* Center: Search */}
        {!isMobile && (
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pr-8 focus-visible:ring-ring"
                aria-label="Search"
              />
              {searchValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSearchClear}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                  aria-label="Clear search"
                >
                  <span className="text-xs">×</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu for Search */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              aria-label="Search"
              onClick={() => toast.info("Search functionality...")}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}

          {/* Notifications */}
          <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 relative"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
              >
                <div className="relative">
                  <div className="w-4 h-4 border-2 border-current rounded-sm">
                    <div className="absolute -top-0.5 right-0.5 w-2 h-1 bg-current rounded-full"></div>
                  </div>
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto" role="region" aria-live="polite">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b cursor-pointer hover:bg-muted transition-colors ${
                        !notification.read ? "bg-accent/5" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.timestamp}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Settings"
          >
            <div className="w-4 h-4 relative">
              <div className="absolute inset-1 border border-current rounded-full"></div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1 bg-current"></div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-1 bg-current"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0.5 bg-current"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-0.5 bg-current"></div>
            </div>
          </Button>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-full"
                aria-label="Profile menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    JD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => handleProfileAction("account")}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>My account</span>
                <ChevronRight className="h-3 w-3" />
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleProfileAction("help")}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>Help</span>
                <ChevronRight className="h-3 w-3" />
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleProfileAction("signout")}
                className="flex items-center justify-between cursor-pointer text-destructive focus:text-destructive"
              >
                <span>Sign out</span>
                <ChevronRight className="h-3 w-3" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weather-alerts" className="text-sm font-medium">
                  Receive weather alerts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get notified about weather conditions that may affect your soil
                </p>
              </div>
              <Switch
                id="weather-alerts"
                checked={weatherAlerts}
                onCheckedChange={setWeatherAlerts}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSettingsOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSettingsSave}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
