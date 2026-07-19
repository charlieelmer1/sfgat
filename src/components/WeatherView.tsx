import React, { useState } from "react";
import { CloudSun, Sun, Wind, Droplets, Cloud, CloudRain, ShieldAlert, Thermometer, Edit3, Save, Clock } from "lucide-react";
import { WeatherData } from "../types";

interface WeatherViewProps {
  userRole: "EMT" | "Supervisor";
  weatherData: WeatherData;
  onUpdateWeather: (data: WeatherData) => void;
}

export default function WeatherView({ userRole, weatherData, onUpdateWeather }: WeatherViewProps) {
  const isSupervisor = userRole === "Supervisor";
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [temp, setTemp] = useState(weatherData.temp);
  const [feelsLike, setFeelsLike] = useState(weatherData.feelsLike);
  const [condition, setCondition] = useState(weatherData.condition);
  const [wind, setWind] = useState(weatherData.wind);
  const [humidity, setHumidity] = useState(weatherData.humidity);
  const [cloudCover, setCloudCover] = useState(weatherData.cloudCover);
  const [precipitation, setPrecipitation] = useState(weatherData.precipitation);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWeather({
      ...weatherData,
      temp,
      feelsLike,
      condition,
      wind,
      humidity,
      cloudCover,
      precipitation,
    });
    setIsEditing(false);
  };

  const getWeatherIcon = (cond: string) => {
    const norm = cond.toLowerCase();
    if (norm.includes("rain") || norm.includes("shower") || norm.includes("storm")) {
      return <CloudRain className="w-12 h-12 text-blue-600" />;
    }
    if (norm.includes("cloud") || norm.includes("overcast")) {
      return <Cloud className="w-12 h-12 text-slate-500" />;
    }
    if (norm.includes("partly") || norm.includes("scattered")) {
      return <CloudSun className="w-12 h-12 text-amber-600 animate-pulse" />;
    }
    return <Sun className="w-12 h-12 text-amber-500 animate-spin-slow" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CloudSun className="w-6 h-6 text-red-650" />
            Active Incident Weather Briefing
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Meteorological observation for Zip Code <strong>{weatherData.zipCode}</strong> (Jackson, NJ - SFGA Area).
          </p>
        </div>

        {isSupervisor && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-900 hover:bg-blue-850 text-white text-xs font-bold px-4 py-2.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4" /> Simulate / Override Weather
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded p-6 space-y-4 shadow-sm border-t-4 border-t-blue-900">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500 animate-pulse" />
            Weather Simulation Controller
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                Temperature (°F)
              </label>
              <input
                type="number"
                value={temp}
                onChange={(e) => setTemp(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                Feels Like (°F)
              </label>
              <input
                type="number"
                value={feelsLike}
                onChange={(e) => setFeelsLike(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                General Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-sans"
              >
                <option value="Sunny">Sunny</option>
                <option value="Partly Cloudy">Partly Cloudy</option>
                <option value="Mostly Overcast">Mostly Overcast</option>
                <option value="Severe Heat Wave">Severe Heat Wave</option>
                <option value="Active Thunderstorms">Active Thunderstorms</option>
                <option value="Scattered Showers">Scattered Showers</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                Wind Speed / Dir
              </label>
              <input
                type="text"
                value={wind}
                onChange={(e) => setWind(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                Humidity (%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={humidity}
                onChange={(e) => setHumidity(parseInt(e.target.value) || 0)}
                className="w-full h-1.5 bg-slate-100 accent-blue-900 rounded-lg cursor-pointer"
              />
              <span className="text-xs text-slate-700 font-mono block mt-1">{humidity}%</span>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                Cloud Cover (%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={cloudCover}
                onChange={(e) => setCloudCover(parseInt(e.target.value) || 0)}
                className="w-full h-1.5 bg-slate-100 accent-blue-900 rounded-lg cursor-pointer"
              />
              <span className="text-xs text-slate-700 font-mono block mt-1">{cloudCover}%</span>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                Precipitation Chance
              </label>
              <input
                type="text"
                value={precipitation}
                onChange={(e) => setPrecipitation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 bg-white text-slate-500 hover:bg-slate-50 border border-slate-200 rounded text-xs cursor-pointer font-bold"
            >
              Discard
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-900 hover:bg-blue-850 text-white rounded text-xs cursor-pointer font-bold flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" /> Push Weather Override
            </button>
          </div>
        </form>
      ) : (
        /* Current Weather Showcase */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-2 bg-white border border-slate-200 rounded p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm relative overflow-hidden border-t-4 border-t-blue-900">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(30,58,138,0.03),transparent_40%)]" />
            <div className="space-y-4 relative z-10 w-full md:w-auto text-center md:text-left">
              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-slate-500 font-bold">
                  Jackson Municipal Radar
                </span>
                <h3 className="text-3xl font-black text-slate-900 mt-1">Great Adventure Incident Arena</h3>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="text-5xl font-extrabold text-slate-850 font-sans">{weatherData.temp}°F</div>
                <div className="text-left font-mono">
                  <span className="text-slate-450 text-xs block">FEELS LIKE</span>
                  <span className="text-slate-800 font-bold text-sm">{weatherData.feelsLike}°F</span>
                </div>
              </div>
              <p className="text-sm font-bold text-amber-700">{weatherData.condition}</p>
            </div>
            
            <div className="bg-slate-50 p-6 rounded border border-slate-200 flex flex-col items-center justify-center text-center shrink-0 w-32 h-32 md:w-40 md:h-40 relative z-10 shadow-sm">
              {getWeatherIcon(weatherData.condition)}
              <span className="text-[10px] text-slate-500 font-mono mt-2 font-bold uppercase">MET BRIEFING</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4 border-t-4 border-t-blue-900">
            <h3 className="text-sm uppercase font-mono font-bold tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Environmental Parameters
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-col justify-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase font-bold flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-slate-400" /> Wind Velocity
                </span>
                <span className="text-slate-850 font-mono font-bold text-xs mt-1">{weatherData.wind}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-col justify-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase font-bold flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-slate-400" /> Rel Humidity
                </span>
                <span className="text-slate-850 font-mono font-bold text-xs mt-1">{weatherData.humidity}%</span>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-col justify-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase font-bold flex items-center gap-1">
                  <Cloud className="w-3.5 h-3.5 text-slate-400" /> Cloud Cover
                </span>
                <span className="text-slate-850 font-mono font-bold text-xs mt-1">{weatherData.cloudCover}%</span>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-col justify-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase font-bold flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-slate-400" /> Precipitation
                </span>
                <span className="text-slate-850 font-mono font-bold text-xs mt-1">{weatherData.precipitation}</span>
              </div>
            </div>

            {/* Heat Index Safety Warning */}
            {weatherData.temp >= 85 && (
              <div className="bg-red-50 border border-red-200 text-red-850 p-2.5 rounded text-[11px] leading-relaxed flex items-start gap-2">
                <Thermometer className="w-4 h-4 text-red-650 shrink-0 mt-0.5" />
                <span>
                  <strong>Heat Alert:</strong> Elevated ambient temperature. Monitor patrons for heat exhaustion and exertional heat stroke, especially near high-queue rides.
                </span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 12 Hour Lookout Section */}
      <div className="bg-white border border-slate-200 rounded p-6 shadow-sm border-t-4 border-t-blue-900">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-900" />
          12-Hour Lookout & Forecast Grid
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
          {weatherData.hourly.map((hour, idx) => {
            // Apply simulation scaling dynamically based on overridden temperature if relevant
            const delta = weatherData.temp - 84; // Difference from baseline temperature 84
            const adjustedTemp = hour.temp + delta;
            
            return (
              <div
                key={idx}
                className="bg-slate-50 p-3.5 rounded border border-slate-200 text-center space-y-2 hover:border-slate-300 transition-colors"
              >
                <span className="text-[10px] font-mono font-bold text-slate-500 block">{hour.time}</span>
                <div className="flex justify-center my-1.5">{getWeatherIcon(hour.condition)}</div>
                <div className="text-sm font-bold text-slate-800 font-sans">{adjustedTemp}°F</div>
                <div className="text-[9px] text-slate-450 font-mono uppercase tracking-tight">
                  Precip: {hour.precip}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
