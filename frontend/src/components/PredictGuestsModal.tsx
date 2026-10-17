import React, { useState, useEffect } from 'react';
import { WalkinForecastResult, WalkinIntervalForecast } from '../types';
import { fetchWalkinForecast, recordWalkinEvent } from '../services/api';
import {
  Users, CloudRain, Sun, TrendingUp, ShieldCheck, X,
  Plus, Check, Clock, AlertTriangle, Sparkles, ChefHat
} from 'lucide-react';

interface PredictGuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  kitchenId: string;
  kitchenName: string;
}

export const PredictGuestsModal: React.FC<PredictGuestsModalProps> = ({
  isOpen,
  onClose,
  kitchenId,
  kitchenName
}) => {
  const [forecast, setForecast] = useState<WalkinForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRain, setIsRain] = useState(false);
  const [walkinPartySize, setWalkinPartySize] = useState(2);
  const [recordingSuccess, setRecordingSuccess] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadForecast(isRain);
    }
  }, [isOpen, kitchenId, isRain]);

  const loadForecast = async (rain: boolean) => {
    setLoading(true);
    try {
      const data = await fetchWalkinForecast(kitchenId, {
        rain_scenario: rain,
        lunch_or_dinner: 'dinner'
      });
      setForecast(data);
    } catch (err) {
      console.error('Error fetching walkin forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordWalkin = async () => {
    setIsRecording(true);
    try {
      await recordWalkinEvent(kitchenId, {
        party_size: walkinPartySize,
        table_type: walkinPartySize <= 2 ? 'Deuce' : 'Standard 4-Top',
        notes: `Walk-in party of ${walkinPartySize} seated during dinner service`
      });
      setRecordingSuccess(`Recorded walk-in party of ${walkinPartySize}!`);
      setTimeout(() => setRecordingSuccess(null), 3000);
      // Reload forecast to show updated recorded arrival counts
      await loadForecast(isRain);
    } catch (err) {
      console.error('Failed to record walk-in:', err);
    } finally {
      setIsRecording(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-cocoa/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-vanilla rounded-2xl border border-subtle shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-espresso text-vanilla px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-terracotta/20 border border-terracotta/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-saffron" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-white">Predict My Guests</h3>
                <span className="text-[10px] bg-terracotta text-white px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                  Poisson GLM Twin
                </span>
              </div>
              <p className="text-xs text-vanilla/70">
                Separated reservation attendance & 30-min walk-in arrival forecasting for {kitchenName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 text-vanilla/80 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto font-sans text-espresso">
          {/* Quick Scenario Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-oat rounded-xl border border-subtle">
            <div>
              <span className="text-xs font-bold text-espresso uppercase tracking-wider block">
                Simulate Weather & Demand Context
              </span>
              <p className="text-xs text-espresso/70">
                Weather directly impacts walk-in velocity while booked reservations remain resilient
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRain(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  !isRain
                    ? 'bg-espresso text-vanilla border-espresso shadow-xs'
                    : 'bg-white text-espresso border-subtle hover:bg-vanilla'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-saffron" />
                <span>Fair Weather</span>
              </button>

              <button
                onClick={() => setIsRain(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  isRain
                    ? 'bg-terracotta text-white border-terracotta shadow-xs'
                    : 'bg-white text-espresso border-subtle hover:bg-vanilla'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span>Sudden Rainstorm (-35% Walk-ins)</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-terracotta border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-espresso/60">Computing Poisson count regression & 90% confidence bands...</p>
            </div>
          ) : forecast ? (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-subtle shadow-xs">
                  <span className="text-[10px] text-espresso/60 uppercase font-semibold block">Total Expected Covers</span>
                  <div className="font-serif text-2xl font-bold text-cocoa mt-0.5">
                    {forecast.total_expected_covers}
                  </div>
                  <span className="text-[11px] text-espresso/70">
                    Hist. baseline: {forecast.historical_baseline_covers}
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-subtle shadow-xs">
                  <span className="text-[10px] text-espresso/60 uppercase font-semibold block">Likely Reservations</span>
                  <div className="font-serif text-2xl font-bold text-sage mt-0.5">
                    {forecast.total_reservations_expected}
                  </div>
                  <span className="text-[11px] text-espresso/70">86% turnup model</span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-subtle shadow-xs">
                  <span className="text-[10px] text-espresso/60 uppercase font-semibold block">Expected Walk-Ins</span>
                  <div className="font-serif text-2xl font-bold text-terracotta mt-0.5">
                    {forecast.total_walkins_expected}
                  </div>
                  <span className="text-[11px] text-espresso/70">Poisson count mode</span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-subtle shadow-xs">
                  <span className="text-[10px] text-espresso/60 uppercase font-semibold block">Model Accuracy</span>
                  <div className="font-serif text-2xl font-bold text-espresso mt-0.5">
                    {(100 - forecast.evaluation_metrics.backtest_mape_pct).toFixed(1)}%
                  </div>
                  <span className="text-[11px] text-espresso/70 font-mono">
                    MAE: {forecast.evaluation_metrics.backtest_mae_covers} covers
                  </span>
                </div>
              </div>

              {/* Kitchen Prep Guidance Banner */}
              <div className="p-4 bg-oat rounded-xl border border-subtle flex items-start gap-3">
                <ChefHat className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-espresso uppercase tracking-wider">
                      Chef Prep Batch Advice
                    </span>
                    <span className="bg-sage/15 text-sage text-[10px] font-bold px-2 py-0.5 rounded">
                      +{forecast.extra_prep_batch_advice.recommended_safety_portions} Safety Portions
                    </span>
                  </div>
                  <p className="text-xs text-espresso/80">
                    {forecast.extra_prep_batch_advice.rationale}
                  </p>
                </div>
              </div>

              {/* 30-Minute Interval Forecast Table */}
              <div className="bg-white rounded-xl border border-subtle overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-vanilla/60 border-b border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-terracotta" />
                    <span className="text-xs font-bold text-espresso uppercase tracking-wider">
                      Service Timeline (30-Minute Windows)
                    </span>
                  </div>
                  <span className="text-[11px] text-espresso/60">
                    90% Prediction Intervals [Lower – Upper]
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-oat/50 text-[11px] text-espresso/70 font-semibold uppercase border-b border-subtle">
                      <tr>
                        <th className="px-4 py-2.5">Time Slot</th>
                        <th className="px-4 py-2.5">Reservations</th>
                        <th className="px-4 py-2.5">Walk-Ins (Poisson)</th>
                        <th className="px-4 py-2.5 font-bold text-espresso">Total Expected</th>
                        <th className="px-4 py-2.5">90% Range</th>
                        <th className="px-4 py-2.5">Arrival Bar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle/60">
                      {forecast.interval_forecasts.map((slot: WalkinIntervalForecast, idx: number) => {
                        const maxCovers = 30;
                        const widthPct = Math.min(100, Math.round((slot.total_covers / maxCovers) * 100));
                        return (
                          <tr key={idx} className="hover:bg-vanilla/40 transition">
                            <td className="px-4 py-2 font-mono font-medium text-espresso">
                              {slot.time_slot}
                            </td>
                            <td className="px-4 py-2 text-sage font-medium">
                              {slot.expected_reservations}
                            </td>
                            <td className="px-4 py-2 text-terracotta font-medium">
                              {slot.expected_walkins}
                            </td>
                            <td className="px-4 py-2 font-bold text-espresso">
                              {slot.total_covers} covers
                            </td>
                            <td className="px-4 py-2 font-mono text-espresso/70">
                              [{slot.lower_bound_90} – {slot.upper_bound_90}]
                            </td>
                            <td className="px-4 py-2 w-36">
                              <div className="h-2 w-full bg-oat rounded-full overflow-hidden flex">
                                <div
                                  className="h-full bg-sage"
                                  style={{
                                    width: `${slot.total_covers > 0 ? (slot.expected_reservations / slot.total_covers) * widthPct : 0}%`
                                  }}
                                  title="Reservations"
                                />
                                <div
                                  className="h-full bg-terracotta"
                                  style={{
                                    width: `${slot.total_covers > 0 ? (slot.expected_walkins / slot.total_covers) * widthPct : 0}%`
                                  }}
                                  title="Walk-ins"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live Host Stand Walk-in Arrival Recorder */}
              <div className="p-4 bg-vanilla rounded-xl border border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-terracotta/15 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-terracotta" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-espresso block">
                      Door Staff Quick-Check: Record Walk-In Seating
                    </span>
                    <span className="text-[11px] text-espresso/70">
                      Instantly updates real-time table turnover and remaining evening demand
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-espresso/70">Party Size:</span>
                  <div className="flex items-center border border-subtle rounded-lg bg-white overflow-hidden">
                    <button
                      onClick={() => setWalkinPartySize(Math.max(1, walkinPartySize - 1))}
                      className="px-2.5 py-1 text-xs hover:bg-oat text-espresso transition"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 font-mono text-xs font-bold text-espresso">
                      {walkinPartySize}
                    </span>
                    <button
                      onClick={() => setWalkinPartySize(walkinPartySize + 1)}
                      className="px-2.5 py-1 text-xs hover:bg-oat text-espresso transition"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleRecordWalkin}
                    disabled={isRecording}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-terracotta hover:bg-terracotta-dark text-white text-xs font-semibold shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isRecording ? 'Logging...' : 'Seat Walk-in'}</span>
                  </button>
                </div>
              </div>

              {recordingSuccess && (
                <div className="p-3 bg-sage/15 border border-sage/30 rounded-lg text-sage text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{recordingSuccess} Real-time table capacity updated.</span>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-oat px-6 py-3.5 border-t border-subtle flex items-center justify-between">
          <div className="text-[11px] text-espresso/60 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sage" />
            <span>Poisson GLM with 90% confidence bounds prevents both stockout & over-prep</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-espresso hover:bg-cocoa text-vanilla text-xs font-semibold rounded-lg transition"
          >
            Close Forecaster
          </button>
        </div>
      </div>
    </div>
  );
};
