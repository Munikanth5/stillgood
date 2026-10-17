import React, { useState, useEffect } from 'react';
import { WalkinForecastResult, WalkinIntervalForecast } from '../types';
import { fetchWalkinForecast, recordWalkinEvent } from '../services/api';
import {
  Users, CloudRain, Sun, TrendingUp, ShieldCheck, X,
  Plus, Check, Clock, ChevronDown, ChevronUp, AlertCircle, ChefHat, Info
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
  const [showDetails, setShowDetails] = useState(false);

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
      setRecordingSuccess(`Recorded ${walkinPartySize} guest${walkinPartySize > 1 ? 's' : ''} seated at the door.`);
      setTimeout(() => setRecordingSuccess(null), 3500);
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
      <div className="relative w-full max-w-2xl bg-vanilla rounded-3xl border border-subtle shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-espresso text-vanilla px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-terracotta/20 border border-terracotta/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-saffron" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">Predict Guests</h3>
              <p className="text-xs text-vanilla/70">
                Walk-in arrivals and prep guidance for {kitchenName}
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
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto font-sans text-espresso">
          {/* Quick Weather Context Selector */}
          <div className="flex items-center justify-between p-3.5 bg-oat rounded-2xl border border-subtle">
            <div>
              <span className="text-xs font-semibold text-espresso block">Weather Context</span>
              <span className="text-[11px] text-espresso/70">
                Rain slows walk-in foot traffic; reservations remain stable
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRain(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                  !isRain
                    ? 'bg-espresso text-vanilla border-espresso shadow-xs'
                    : 'bg-white text-espresso border-subtle hover:bg-vanilla'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-saffron" />
                <span>Fair Weather</span>
              </button>
              <button
                type="button"
                onClick={() => setIsRain(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                  isRain
                    ? 'bg-terracotta text-white border-terracotta shadow-xs'
                    : 'bg-white text-espresso border-subtle hover:bg-vanilla'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span>Rainstorm (-35%)</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-terracotta border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-espresso/60">Updating walk-in demand estimate...</p>
            </div>
          ) : forecast ? (
            <>
              {/* Directive 7 Key Metrics:
                  1. Walk-ins expected in next 30 minutes
                  2. Forecast range
                  3. Actual arrivals so far
                  4. Practical preparation advice
                  5. Last update time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs">
                  <span className="text-[11px] font-semibold text-espresso/60 block">
                    Expected in Next 30 Mins
                  </span>
                  <div className="font-serif text-3xl font-bold text-terracotta mt-1">
                    {forecast.predicted_walkins_next_30m} <span className="text-sm font-sans font-normal text-espresso/70">guests</span>
                  </div>
                  <span className="text-[11px] text-espresso/60 block mt-1">
                    Range: [{forecast.walkin_prediction_interval[0]} – {forecast.walkin_prediction_interval[1]}]
                  </span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs">
                  <span className="text-[11px] font-semibold text-espresso/60 block">
                    Actual Arrivals Recorded
                  </span>
                  <div className="font-serif text-3xl font-bold text-espresso mt-1">
                    {forecast.current_recorded_arrivals} <span className="text-sm font-sans font-normal text-espresso/70">seated</span>
                  </div>
                  <span className="text-[11px] text-sage font-medium block mt-1">
                    {forecast.remaining_seating_capacity} seats available
                  </span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs">
                  <span className="text-[11px] font-semibold text-espresso/60 block">
                    Total Tonight's Target
                  </span>
                  <div className="font-serif text-3xl font-bold text-cocoa mt-1">
                    {forecast.total_expected_covers_today} <span className="text-sm font-sans font-normal text-espresso/70">covers</span>
                  </div>
                  <span className="text-[11px] text-espresso/60 block mt-1">
                    {forecast.expected_reservation_attendance} reservations attending
                  </span>
                </div>
              </div>

              {/* Practical Kitchen Preparation Advice */}
              <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-terracotta/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ChefHat className="w-4 h-4 text-terracotta" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-espresso block">
                    Chef Practical Prep Advice
                  </span>
                  <p className="text-xs text-espresso leading-relaxed">
                    {forecast.extra_prep_batch_recommendation}
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-espresso/50">
                    <Clock className="w-3 h-3" />
                    <span>Last updated: {forecast.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Simple Number Input to Update Actual Walk-Ins (Directive 7) */}
              <div className="p-4 bg-oat rounded-2xl border border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-espresso block">
                    Seat Walk-In Party At Door
                  </span>
                  <span className="text-[11px] text-espresso/70">
                    Type or tap guest count to update table occupancy instantly
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-subtle rounded-xl bg-white overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => setWalkinPartySize(Math.max(1, walkinPartySize - 1))}
                      className="px-3 py-1.5 hover:bg-oat text-espresso font-bold text-xs transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={walkinPartySize}
                      onChange={(e) => setWalkinPartySize(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center font-serif font-bold text-sm text-espresso bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setWalkinPartySize(walkinPartySize + 1)}
                      className="px-3 py-1.5 hover:bg-oat text-espresso font-bold text-xs transition"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleRecordWalkin}
                    disabled={isRecording}
                    className="px-4 py-2 bg-terracotta hover:bg-terracotta-dark text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isRecording ? 'Seating...' : 'Record Seating'}</span>
                  </button>
                </div>
              </div>

              {recordingSuccess && (
                <div className="p-3 bg-sage/15 border border-sage/30 rounded-xl text-sage text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{recordingSuccess} Remaining table capacity updated.</span>
                </div>
              )}

              {/* Expandable Section: "How was this estimated?" (Directive 7) */}
              <div className="pt-2 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-oat text-xs font-semibold text-espresso transition"
                >
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-terracotta" />
                    <span>How was this estimated?</span>
                  </span>
                  {showDetails ? (
                    <ChevronUp className="w-4 h-4 text-espresso/60" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-espresso/60" />
                  )}
                </button>

                {showDetails && (
                  <div className="mt-3 p-4 bg-white rounded-2xl border border-subtle space-y-3 text-xs animate-in fade-in">
                    <p className="text-espresso/80 leading-relaxed">
                      {forecast.explanation}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 bg-vanilla rounded-xl border border-subtle">
                      <div>
                        <span className="text-espresso/60 block">Model Type:</span>
                        <span className="font-semibold text-espresso">{forecast.evaluation_metrics.model_type}</span>
                      </div>
                      <div>
                        <span className="text-espresso/60 block">Historical Backtest Error:</span>
                        <span className="font-semibold text-espresso">
                          MAE {forecast.evaluation_metrics.mean_absolute_error_covers} covers ({forecast.evaluation_metrics.mean_absolute_percentage_error})
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-oat/50 text-espresso/70 font-semibold uppercase border-b border-subtle">
                          <tr>
                            <th className="px-3 py-2">Window</th>
                            <th className="px-3 py-2">Expected Walk-Ins</th>
                            <th className="px-3 py-2">90% Range</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-subtle/50">
                          {forecast.intervals.map((slot: WalkinIntervalForecast, idx: number) => (
                            <tr key={idx} className={slot.is_current_slot ? 'bg-saffron/10 font-bold' : ''}>
                              <td className="px-3 py-1.5 font-mono">{slot.time_slot}</td>
                              <td className="px-3 py-1.5 text-terracotta">{slot.expected_walkins} covers</td>
                              <td className="px-3 py-1.5 font-mono text-espresso/60">
                                [{slot.lower_bound_90pct} – {slot.upper_bound_90pct}]
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <p className="text-[10px] text-espresso/50 italic">
                      Notice: Walk-in arrivals are statistical projections from historical service patterns and weather indicators, not live point-of-sale data.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-oat px-6 py-3.5 border-t border-subtle flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-espresso hover:bg-cocoa text-vanilla text-xs font-semibold rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
export default PredictGuestsModal;
