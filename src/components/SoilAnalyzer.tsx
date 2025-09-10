"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Images, 
  ZoomIn, 
  Undo, 
  Shovel, 
  Tractor, 
  MapPinX,
  Sprout,
  CircleDot,
  FileInput,
  Crop
} from "lucide-react";

interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  description: string;
}

interface SoilResult {
  type: string;
  confidence: number;
  description: string;
  color: string;
}

interface CropSuggestion {
  name: string;
  suitability: number;
  season: string;
  reason: string;
  details: string;
  saved: boolean;
}

interface LocationData {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
}

export default function SoilAnalyzer() {
  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  
  // Location & Weather
  const [location, setLocation] = useState<LocationData | null>(null);
  const [manualLocation, setManualLocation] = useState({ city: "", state: "" });
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  
  // Analysis & Results
  const [analyzing, setAnalyzing] = useState(false);
  const [soilResult, setSoilResult] = useState<SoilResult | null>(null);
  const [cropSuggestions, setCropSuggestions] = useState<CropSuggestion[]>([]);
  const [suggestingCrops, setSuggestingCrops] = useState(false);
  
  // UI States
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportEmail, setExportEmail] = useState("");
  const [selectedCropsForComparison, setSelectedCropsForComparison] = useState<string[]>([]);
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);

  // File handling
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file (JPEG or PNG)");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    toast.success("Image uploaded successfully");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const clearImage = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
    setSoilResult(null);
    setCropSuggestions([]);
    toast.info("Image cleared");
  }, [previewUrl]);

  // Camera capture
  const captureFromCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            handleFileSelect(file);
          }
        }, 'image/jpeg', 0.9);
        
        stream.getTracks().forEach(track => track.stop());
      });
    } catch (error) {
      toast.error("Camera access denied or not available");
    }
  }, [handleFileSelect]);

  // Location handling
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setLocationLoading(false);
        toast.success("Location detected successfully");
      },
      (error) => {
        setLocationLoading(false);
        toast.error("Failed to detect location. Please enter manually.");
        setShowManualLocation(true);
      }
    );
  }, []);

  const handleManualLocationSubmit = useCallback(() => {
    if (!manualLocation.city.trim()) {
      toast.error("Please enter a city name");
      return;
    }
    
    // Simulate geocoding
    const mockCoords = {
      lat: 40.7128 + (Math.random() - 0.5) * 10,
      lng: -74.0060 + (Math.random() - 0.5) * 10,
      city: manualLocation.city,
      state: manualLocation.state
    };
    
    setLocation(mockCoords);
    setShowManualLocation(false);
    toast.success(`Location set to ${manualLocation.city}`);
  }, [manualLocation]);

  // Weather handling
  const fetchWeather = useCallback(async () => {
    if (!location) {
      toast.error("Please set location first");
      return;
    }

    setWeatherLoading(true);
    
    // Simulate weather API call
    setTimeout(() => {
      const mockWeather: WeatherData = {
        temperature: Math.round(15 + Math.random() * 20),
        humidity: Math.round(40 + Math.random() * 40),
        precipitation: Math.round(Math.random() * 10),
        description: ["Sunny", "Partly Cloudy", "Overcast", "Light Rain"][Math.floor(Math.random() * 4)]
      };
      
      setWeather(mockWeather);
      setWeatherLoading(false);
      toast.success("Weather data fetched successfully");
    }, 2000);
  }, [location]);

  // Soil analysis
  const analyzeSoil = useCallback(async () => {
    if (!selectedFile) {
      toast.error("Please upload an image first");
      return;
    }

    setAnalyzing(true);
    toast.info("Analyzing soil composition...");
    
    // Simulate analysis
    setTimeout(() => {
      const soilTypes = [
        { type: "Clay Loam", color: "#8B4513", description: "Rich, fertile soil ideal for most crops" },
        { type: "Sandy Loam", color: "#DEB887", description: "Well-draining soil good for root vegetables" },
        { type: "Silt Loam", color: "#A0522D", description: "Nutrient-rich soil with good water retention" },
        { type: "Clay", color: "#654321", description: "Heavy soil that retains water well" }
      ];
      
      const selectedSoil = soilTypes[Math.floor(Math.random() * soilTypes.length)];
      const confidence = 75 + Math.random() * 20;
      
      setSoilResult({
        ...selectedSoil,
        confidence: Math.round(confidence)
      });
      
      setAnalyzing(false);
      toast.success(`Soil identified as ${selectedSoil.type} (${Math.round(confidence)}% confidence)`);
    }, 3000);
  }, [selectedFile]);

  // Crop suggestions
  const suggestCrops = useCallback(async () => {
    if (!soilResult) {
      toast.error("Please analyze soil first");
      return;
    }
    
    if (!weather) {
      toast.error("Weather data required for crop suggestions");
      return;
    }

    setSuggestingCrops(true);
    toast.info("Generating crop suggestions...");
    
    // Simulate crop suggestion API
    setTimeout(() => {
      const crops = [
        {
          name: "Tomatoes",
          suitability: 92,
          season: "Summer",
          reason: "Excellent match for clay loam soil",
          details: "Clay loam provides ideal drainage and nutrient retention for tomatoes. Current weather conditions are perfect for planting.",
          saved: false
        },
        {
          name: "Carrots",
          suitability: 88,
          season: "Spring/Fall",
          reason: "Good root development in this soil type",
          details: "The soil structure allows for proper root expansion. Temperature and humidity levels support healthy growth.",
          saved: false
        },
        {
          name: "Lettuce",
          suitability: 85,
          season: "Spring/Fall",
          reason: "Thrives in well-draining soil",
          details: "Quick-growing crop suitable for current soil and weather conditions. Low maintenance requirements.",
          saved: false
        },
        {
          name: "Peppers",
          suitability: 90,
          season: "Summer",
          reason: "Heat-loving crop suited to current conditions",
          details: "Warm weather and soil type create ideal growing conditions. Expect high yield potential.",
          saved: false
        }
      ];
      
      setCropSuggestions(crops);
      setSuggestingCrops(false);
      toast.success(`Found ${crops.length} crop suggestions`);
    }, 2000);
  }, [soilResult, weather]);

  // Crop actions
  const toggleCropSaved = useCallback((cropName: string) => {
    setCropSuggestions(prev => 
      prev.map(crop => 
        crop.name === cropName 
          ? { ...crop, saved: !crop.saved }
          : crop
      )
    );
    
    const crop = cropSuggestions.find(c => c.name === cropName);
    if (crop) {
      toast.success(`${crop.name} ${crop.saved ? 'removed from' : 'added to'} your plans`);
    }
  }, [cropSuggestions]);

  const toggleCropComparison = useCallback((cropName: string) => {
    setSelectedCropsForComparison(prev => {
      const isSelected = prev.includes(cropName);
      const newSelection = isSelected 
        ? prev.filter(name => name !== cropName)
        : [...prev, cropName];
      
      toast.info(`${cropName} ${isSelected ? 'removed from' : 'added to'} comparison`);
      return newSelection;
    });
  }, []);

  // Reset function
  const resetAll = useCallback(() => {
    clearImage();
    setLocation(null);
    setManualLocation({ city: "", state: "" });
    setShowManualLocation(false);
    setWeather(null);
    setSoilResult(null);
    setCropSuggestions([]);
    setSelectedCropsForComparison([]);
    setExpandedCrop(null);
    toast.info("All data cleared");
  }, [clearImage]);

  // Export functions
  const downloadReport = useCallback(() => {
    toast.info("Generating PDF report...");
    setTimeout(() => toast.success("Report downloaded successfully"), 2000);
  }, []);

  const shareLink = useCallback(() => {
    const shareUrl = `${window.location.origin}/soil-analysis/shared/${Date.now()}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard");
  }, []);

  const sendEmailReport = useCallback(() => {
    if (!exportEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    
    toast.info(`Sending report to ${exportEmail}...`);
    setTimeout(() => {
      toast.success("Email report sent successfully");
      setShowExportDialog(false);
      setExportEmail("");
    }, 2000);
  }, [exportEmail]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <TooltipProvider>
      <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
        {/* Header */}
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-heading text-foreground flex items-center gap-2">
                  <Shovel className="h-6 w-6 text-primary" />
                  Soil Analyzer
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Upload a soil image to identify soil type and get personalized crop recommendations
                </CardDescription>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    How it works
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>How Soil Analysis Works</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</div>
                      <div>
                        <h4 className="font-medium">Upload Soil Image</h4>
                        <p className="text-sm text-muted-foreground">Take or upload a clear photo of your soil sample</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</div>
                      <div>
                        <h4 className="font-medium">Set Location & Weather</h4>
                        <p className="text-sm text-muted-foreground">Provide location for weather data and regional recommendations</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</div>
                      <div>
                        <h4 className="font-medium">AI Analysis</h4>
                        <p className="text-sm text-muted-foreground">Our AI identifies soil composition and characteristics</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">4</div>
                      <div>
                        <h4 className="font-medium">Get Recommendations</h4>
                        <p className="text-sm text-muted-foreground">Receive personalized crop suggestions based on your soil and climate</p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>

        {/* Image Upload Area */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Upload Soil Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
            >
              {previewUrl ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img 
                      src={previewUrl} 
                      alt="Soil sample"
                      className="max-w-xs max-h-48 rounded-lg object-cover"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => setShowImageZoom(true)}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedFile?.name} ({Math.round((selectedFile?.size || 0) / 1024)} KB)
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Images className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-lg font-medium">Drop your soil image here</p>
                    <p className="text-sm text-muted-foreground">or use the buttons below to select an image</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Label htmlFor="file-input">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <FileInput className="h-4 w-4 mr-2" />
                    Choose Image
                  </span>
                </Button>
              </Label>
              <input
                id="file-input"
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleFileInputChange}
              />
              
              <Button variant="outline" onClick={captureFromCamera}>
                <Images className="h-4 w-4 mr-2" />
                Use Camera
              </Button>
              
              {previewUrl && (
                <Button variant="outline" onClick={clearImage}>
                  <Undo className="h-4 w-4 mr-2" />
                  Clear Image
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location & Weather Controls */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Location & Weather</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Location</Label>
                {location ? (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPinX className="h-4 w-4 text-success" />
                      <span className="text-sm">
                        {location.city ? `${location.city}, ${location.state}` : `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      onClick={detectLocation}
                      disabled={locationLoading}
                      className="w-full"
                    >
                      {locationLoading ? (
                        <CircleDot className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MapPinX className="h-4 w-4 mr-2" />
                      )}
                      {locationLoading ? "Detecting..." : "Detect Location"}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowManualLocation(!showManualLocation)}
                      className="w-full"
                    >
                      Enter Location Manually
                    </Button>
                  </div>
                )}

                {showManualLocation && (
                  <div className="space-y-3 p-3 border rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="Enter city name"
                        value={manualLocation.city}
                        onChange={(e) => setManualLocation(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Country</Label>
                      <Input
                        id="state"
                        placeholder="Enter state or country"
                        value={manualLocation.state}
                        onChange={(e) => setManualLocation(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleManualLocationSubmit}>
                        Set Location
                      </Button>
                      <Dialog open={showMapPicker} onOpenChange={setShowMapPicker}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Use Map
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Select Location on Map</DialogTitle>
                            <DialogDescription>Click on the map to select your location</DialogDescription>
                          </DialogHeader>
                          <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <MapPinX className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                              <p className="text-muted-foreground">Interactive map would be displayed here</p>
                              <p className="text-sm text-muted-foreground">Click to select coordinates</p>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowMapPicker(false)}>Cancel</Button>
                            <Button onClick={() => {
                              setLocation({ lat: 40.7128, lng: -74.0060, city: "New York", state: "NY" });
                              setShowMapPicker(false);
                              toast.success("Location selected from map");
                            }}>
                              Confirm Location
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}
              </div>

              {/* Weather */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Weather</Label>
                {weather ? (
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{weather.description}</span>
                      <span className="text-lg font-semibold">{weather.temperature}°C</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Humidity: {weather.humidity}%</div>
                      <div>Precipitation: {weather.precipitation}mm</div>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={fetchWeather}
                    disabled={!location || weatherLoading}
                    className="w-full"
                  >
                    {weatherLoading ? (
                      <CircleDot className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CircleDot className="h-4 w-4 mr-2" />
                    )}
                    {weatherLoading ? "Fetching..." : "Fetch Weather"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Action Buttons */}
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap">
              <Button 
                onClick={analyzeSoil}
                disabled={!selectedFile || analyzing}
                className="flex-1 min-w-[140px]"
                size="lg"
              >
                {analyzing ? (
                  <CircleDot className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shovel className="h-4 w-4 mr-2" />
                )}
                {analyzing ? "Analyzing..." : "Analyze Soil"}
              </Button>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="secondary"
                    onClick={suggestCrops}
                    disabled={!soilResult || !weather || suggestingCrops}
                    className="flex-1 min-w-[140px]"
                    size="lg"
                  >
                    {suggestingCrops ? (
                      <CircleDot className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sprout className="h-4 w-4 mr-2" />
                    )}
                    {suggestingCrops ? "Suggesting..." : "Suggest Crops"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {!soilResult ? "Analyze soil first" : !weather ? "Weather data required" : "Get crop recommendations"}
                </TooltipContent>
              </Tooltip>
              
              <Button variant="outline" onClick={resetAll}>
                <Undo className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Progress */}
        {analyzing && (
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analyzing soil composition...</span>
                  <span>65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Soil Results */}
        {soilResult && (
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Soil Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div 
                  className="w-12 h-12 rounded-lg border-2"
                  style={{ backgroundColor: soilResult.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">{soilResult.type}</h3>
                    <Badge variant="secondary">{soilResult.confidence}% confidence</Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">{soilResult.description}</p>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => toast.info("Soil analysis explanation opened")}>
                        Explain Results
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Soil Analysis Explanation</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: soilResult.color }}
                          />
                          <div>
                            <h4 className="font-medium">{soilResult.type}</h4>
                            <p className="text-sm text-muted-foreground">Confidence: {soilResult.confidence}%</p>
                          </div>
                        </div>
                        <p className="text-sm">{soilResult.description}</p>
                        <div className="space-y-2">
                          <h5 className="font-medium">Key Characteristics:</h5>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Good drainage and water retention balance</li>
                            <li>• Rich in organic matter and nutrients</li>
                            <li>• Suitable pH range for most crops</li>
                            <li>• Easy to work with standard tools</li>
                          </ul>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crop Suggestions */}
        {cropSuggestions.length > 0 && (
          <Card className="bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-heading">Crop Recommendations</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={suggestCrops}>
                    <Undo className="h-4 w-4 mr-2" />
                    Refresh Suggestions
                  </Button>
                  {selectedCropsForComparison.length > 1 && (
                    <Button variant="outline" size="sm" onClick={() => toast.info("Comparison feature coming soon")}>
                      Compare Selected ({selectedCropsForComparison.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cropSuggestions.map((crop) => (
                  <Card key={crop.name} className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Crop className="h-5 w-5 text-primary" />
                            <h4 className="font-medium">{crop.name}</h4>
                          </div>
                          <Badge 
                            variant={crop.suitability >= 90 ? "default" : "secondary"}
                            className="bg-success text-success-foreground"
                          >
                            {crop.suitability}% match
                          </Badge>
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <p><span className="font-medium">Season:</span> {crop.season}</p>
                          <p><span className="font-medium">Why recommended:</span> {crop.reason}</p>
                        </div>
                        
                        {expandedCrop === crop.name && (
                          <div className="p-3 bg-card rounded border">
                            <h5 className="font-medium mb-2">Detailed Analysis</h5>
                            <p className="text-sm text-muted-foreground">{crop.details}</p>
                          </div>
                        )}
                        
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedCrop(expandedCrop === crop.name ? null : crop.name)}
                          >
                            {expandedCrop === crop.name ? "Hide" : "View"} Details
                          </Button>
                          
                          <Button
                            variant={crop.saved ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleCropSaved(crop.name)}
                          >
                            <Tractor className="h-4 w-4 mr-1" />
                            {crop.saved ? "Saved" : "Save to Plans"}
                          </Button>
                          
                          <Button
                            variant={selectedCropsForComparison.includes(crop.name) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleCropComparison(crop.name)}
                          >
                            Compare
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export & Share Controls */}
        {(soilResult || cropSuggestions.length > 0) && (
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Export & Share</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={downloadReport}>
                  <FileInput className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
                
                <Button variant="outline" onClick={shareLink}>
                  <CircleDot className="h-4 w-4 mr-2" />
                  Share Link
                </Button>
                
                <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <FileInput className="h-4 w-4 mr-2" />
                      Email Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Email Report</DialogTitle>
                      <DialogDescription>Send your soil analysis and crop recommendations via email</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Recipient Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter email address"
                          value={exportEmail}
                          onChange={(e) => setExportEmail(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={sendEmailReport}>
                          Send Report
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!selectedFile && !soilResult && (
          <Card className="bg-card">
            <CardContent className="pt-8 pb-8 text-center">
              <Shovel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Ready to Analyze Your Soil?</h3>
              <p className="text-muted-foreground mb-4">
                Upload a clear photo of your soil sample to get started with AI-powered analysis and personalized crop recommendations.
              </p>
              <div className="flex gap-2 justify-center">
                <Label htmlFor="empty-file-input">
                  <Button asChild>
                    <span>
                      <Images className="h-4 w-4 mr-2" />
                      Upload Soil Image
                    </span>
                  </Button>
                </Label>
                <input
                  id="empty-file-input"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Zoom Modal */}
        <Dialog open={showImageZoom} onOpenChange={setShowImageZoom}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Soil Sample Image</DialogTitle>
            </DialogHeader>
            {previewUrl && (
              <div className="max-h-[70vh] overflow-auto">
                <img 
                  src={previewUrl} 
                  alt="Soil sample - full size"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
