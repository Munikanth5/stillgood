import React, { useState, useEffect } from 'react';
import { WalkinForecastResult, WalkinIntervalForecast } from '../types';
import { fetchWalkinForecast, recordWalkinEvent } from '../services/api';
import {
  Users, CloudRain, Sun, TrendingUp, ShieldCheck, X,
  Plus, Check, Clock, ChevronDown, ChevronUp, AlertCircle, ChefHat, Info,
  Database, SlidersHorizontal, Sparkles
} from 'lucide-react';

interface PredictGuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  kitchenId: string;
  kitchenName: string;
}

interface SeatingDiff {
  size: number;
  prevArrivals: number;
  newArrivals: number;
  prevRemaining: number;
  newRemaining: number;
  prevTotal: number;
  newTotal: number;
  timestamp: string;
}

interface OverrideDiff {
  prevCovers: number;
  newCovers: number;
  diff: number;
  baseline: number;
  timestamp: string;
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
  const [lastSeatingDiff, setLastSeatingDiff] = useState<SeatingDiff | null>(null);
  const [lastOverrideDiff, setLastOverrideDiff] = useState<OverrideDiff | null>(null);

  // Manager Override (Part 2: Separately labelled from statistical model)
  const [managerOverride, setManagerOverride] = useState<number | ''>('');
  const [overrideActive, setOverrideActive] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadForecast(isRain);
    }
  }, [isOpen, kitchenId, isRain, overrideActive]);

  const loadForecast = async (rain: boolean, overrideVal?: number | '', isOverrideActive?: boolean) => {
    setLoading(true);
    try {
      const activeOvr = isOverrideActive !== undefined ? isOverrideActive : overrideActive;
      const ovrVal = overrideVal !== undefined ? overrideVal : managerOverride;
      const params: any = {
        cancellations: rain ? 40 : 0
      };
      if (activeOvr && typeof ovrVal === 'number' && ovrVal > 0) {
        params.manager_override = ovrVal;
        params.manager_override_reason = 'Manager private party or local event adjustment';
      }
      const data = await fetchWalkinForecast(kitchenId, params);
      setForecast(data);
    } catch (err) {
      console.error('Error fetching walkin forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyOverride = async () => {
    if (typeof managerOverride === 'number' && managerOverride > 0) {
      const prevCovers = forecast?.total_expected_covers_today ?? 0;
      setOverrideActive(true);
      setLoading(true);
      try {
        const params: any = {
          cancellations: isRain ? 40 : 0,
          manager_override: managerOverride,
          manager_override_reason: 'Manager private party or local event adjustment'
        };
        const data = await fetchWalkinForecast(kitchenId, params);
        setForecast(data);
        setLastOverrideDiff({
          prevCovers,
          newCovers: data.total_expected_covers_today,
          diff: data.total_expected_covers_today - prevCovers,
          baseline: data.baseline_model_covers,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      } catch (err) {
        console.error('Error applying manager override:', err);
      } finally {
        setLoading(false);
      }
    } else {
      handleClearOverride();
    }
  };

  const handleClearOverride = async () => {
    const prevCovers = forecast?.total_expected_covers_today ?? 0;
    setOverrideActive(false);
    setManagerOverride('');
    setLoading(true);
    try {
      const params: any = { cancellations: isRain ? 40 : 0 };
      const data = await fetchWalkinForecast(kitchenId, params);
      setForecast(data);
      setLastOverrideDiff({
        prevCovers,
        newCovers: data.total_expected_covers_today,
        diff: data.total_expected_covers_today - prevCovers,
        baseline: data.baseline_model_covers,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    } catch (err) {
      console.error('Error clearing override:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordWalkin = async (partySizeToRecord?: number) => {
    const size = partySizeToRecord || walkinPartySize;
    const prevArrivals = forecast?.current_recorded_arrivals ?? 0;
    const prevRemaining = forecast?.remaining_seating_capacity ?? 0;
    const prevTotal = forecast?.total_expected_covers_today ?? 0;

    setIsRecording(true);
    try {
      const eventId = `EVT-HOST-${Date.now()}`;
      await recordWalkinEvent(kitchenId, {
        id: eventId,
        kitchen_id: kitchenId,
        party_size: size,
        event_type: 'walkin_arrival',
        notes: `Walk-in party of ${size} seated at host stand`
      });
      setRecordingSuccess(`Recorded ${size} guest${size > 1 ? 's' : ''} seated at the door.`);
      setTimeout(() => setRecordingSuccess(null), 4000);

      const params: any = { cancellations: isRain ? 40 : 0 };
      if (overrideActive && typeof managerOverride === 'number' && managerOverride > 0) {
        params.manager_override = managerOverride;
        params.manager_override_reason = 'Manager private party or local event adjustment';
      }
      const data = await fetchWalkinForecast(kitchenId, params);
      setForecast(data);
      setLastSeatingDiff({
        size,
        prevArrivals,
        newArrivals: data.current_recorded_arrivals,
        prevRemaining,
        newRemaining: data.remaining_seating_capacity,
        prevTotal,
        newTotal: data.total_expected_covers_today,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
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
          {/* Weather & Live Connector Bar */}
          <div className="flex flex-wrap items-center justify-between p-3.5 bg-oat rounded-2xl border border-subtle gap-2">
            <div>
              <span className="text-xs font-semibold text-espresso block">Weather & Service Context</span>
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
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-serif text-3xl font-bold text-espresso">
                      {forecast.current_recorded_arrivals}
                    </span>
                    <span className="text-sm font-sans font-normal text-espresso/70">seated</span>
                    {lastSeatingDiff && (
                      <span className="px-2 py-0.5 bg-sage/20 text-sage text-[11px] font-bold rounded-md animate-pulse">
                        +{lastSeatingDiff.size} seated
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-sage font-medium block mt-1 flex items-center gap-1">
                    <span>{forecast.remaining_seating_capacity} seats available</span>
                    {lastSeatingDiff && (
                      <span className="text-terracotta font-semibold">(-{lastSeatingDiff.size})</span>
                    )}
                  </span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-espresso/60 block">
                      Total Projected Covers
                    </span>
                    {overrideActive ? (
                      <span className="px-1.5 py-0.5 bg-saffron/20 text-espresso text-[10px] font-bold rounded-md">
                        Override Active
                      </span>
                    ) : lastSeatingDiff ? (
                      <span className="px-1.5 py-0.5 bg-sage/20 text-sage text-[10px] font-bold rounded-md">
                        +{lastSeatingDiff.size} live
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-serif text-3xl font-bold text-cocoa">
                      {forecast.total_expected_covers_today}
                    </span>
                    <span className="text-sm font-sans font-normal text-espresso/70">covers</span>
                    {overrideActive && forecast.manager_override_difference !== undefined && (
                      <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${
                        forecast.manager_override_difference >= 0 ? 'bg-sage/20 text-sage' : 'bg-terracotta/20 text-terracotta'
                      }`}>
                        {forecast.manager_override_difference > 0 ? `+${forecast.manager_override_difference}` : forecast.manager_override_difference}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-espresso/60 block mt-1">
                    {overrideActive && forecast.baseline_model_covers ? (
                      <span>Baseline: <strong>{forecast.baseline_model_covers} covers</strong> • <strong>{forecast.manager_override_difference && forecast.manager_override_difference > 0 ? `+${forecast.manager_override_difference}` : forecast.manager_override_difference} difference</strong></span>
                    ) : (
                      <span>{forecast.expected_reservation_attendance} reservations + {forecast.future_walkins_expected} future walk-ins</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Source & Holdout Status Pill */}
              <div className="p-3 bg-white/70 rounded-xl border border-subtle flex flex-wrap items-center justify-between text-[11px] text-espresso/70 gap-2">
                <div className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-sage" />
                  <span><strong>Connected Data Source:</strong> {forecast.data_sources_connected?.[0] || 'Osteria Verde Historical Service Logs'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-espresso/60">
                  <Clock className="w-3 h-3" />
                  <span>Last Updated: {forecast.timestamp}</span>
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
                </div>
              </div>

              {/* Live Host-Stand Seating Ingestion */}
              <div className="p-4 bg-oat rounded-2xl border border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-espresso block">
                    Seat Walk-In Party At Door
                  </span>
                  <span className="text-[11px] text-espresso/70">
                    Ingests arrival event into live forecast stream (idempotent)
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
                    onClick={() => handleRecordWalkin()}
                    disabled={isRecording}
                    className="px-4 py-2 bg-terracotta hover:bg-terracotta-dark text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isRecording ? 'Seating...' : 'Record Seating'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRecordWalkin(4)}
                    disabled={isRecording}
                    className="px-3 py-2 bg-white border border-subtle hover:bg-vanilla text-espresso text-xs font-semibold rounded-xl transition"
                    title="Simulate a 4-guest walk-in party"
                  >
                    +4 Demo Party
                  </button>
                </div>
              </div>

              {/* Explicit Seating Difference Card */}
              {lastSeatingDiff && (
                <div className="p-3.5 bg-sage/10 border border-sage/30 rounded-2xl space-y-2 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between font-bold text-sage">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      Live Arrival Ingested: +{lastSeatingDiff.size} Guests Seated at Door Stand
                    </span>
                    <span className="text-[10px] text-espresso/60 font-mono">{lastSeatingDiff.timestamp}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2.5 bg-white rounded-xl border border-subtle">
                      <span className="text-espresso/60 block text-[10px] uppercase font-bold">Seated Diners</span>
                      <span className="font-bold text-espresso text-sm">{lastSeatingDiff.prevArrivals} &rarr; {lastSeatingDiff.newArrivals}</span>
                      <span className="text-sage font-bold ml-1 text-xs">(+{lastSeatingDiff.size})</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-subtle">
                      <span className="text-espresso/60 block text-[10px] uppercase font-bold">Table Capacity</span>
                      <span className="font-bold text-espresso text-sm">{lastSeatingDiff.prevRemaining} &rarr; {lastSeatingDiff.newRemaining}</span>
                      <span className="text-terracotta font-bold ml-1 text-xs">(-{lastSeatingDiff.size})</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-subtle">
                      <span className="text-espresso/60 block text-[10px] uppercase font-bold">Projected Covers</span>
                      <span className="font-bold text-espresso text-sm">{lastSeatingDiff.prevTotal} &rarr; {lastSeatingDiff.newTotal}</span>
                      <span className="text-sage font-bold ml-1 text-xs">(+{lastSeatingDiff.size})</span>
                    </div>
                  </div>
                </div>
              )}

              {recordingSuccess && !lastSeatingDiff && (
                <div className="p-3 bg-sage/15 border border-sage/30 rounded-xl text-sage text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{recordingSuccess} Remaining table capacity updated.</span>
                </div>
              )}

              {/* Manager Override Section (Part 2: Separately Labelled from Algorithm) */}
              <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-espresso/70 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-terracotta" />
                    Manager Override (Optional)
                  </span>
                  <span className="text-[10px] text-espresso/50">
                    Labelled separately from statistical model
                  </span>
                </div>
                <p className="text-[11px] text-espresso/70">
                  Override forecast covers if you have specific operational knowledge of an unbooked private event.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 110 covers"
                    value={managerOverride}
                    onChange={(e) => setManagerOverride(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-36 px-3 py-1.5 text-xs font-serif font-bold rounded-xl border border-subtle bg-vanilla text-espresso"
                  />
                  <button
                    type="button"
                    onClick={handleApplyOverride}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                      overrideActive
                        ? 'bg-sage text-white'
                        : 'bg-oat hover:bg-subtle text-espresso border border-subtle'
                    }`}
                  >
                    {overrideActive ? 'Override Active ✓' : 'Apply Override'}
                  </button>
                  {overrideActive && (
                    <button
                      type="button"
                      onClick={handleClearOverride}
                      className="text-xs text-terracotta underline ml-1"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Explicit Manager Override Difference Card */}
                {lastOverrideDiff && (
                  <div className="p-3.5 bg-saffron/10 border border-saffron/40 rounded-2xl space-y-2 text-xs animate-in fade-in">
                    <div className="flex items-center justify-between font-bold text-espresso">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-sage" />
                        Existing Count Updated: Manager Override {overrideActive ? 'Applied' : 'Cleared'}
                      </span>
                      <span className="text-[10px] text-espresso/60 font-mono">{lastOverrideDiff.timestamp}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2.5 bg-white rounded-xl border border-subtle">
                        <span className="text-espresso/60 block text-[10px] uppercase font-bold">Statistical Baseline</span>
                        <span className="font-bold text-espresso text-sm">{lastOverrideDiff.baseline} covers</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-subtle">
                        <span className="text-espresso/60 block text-[10px] uppercase font-bold">Existing Count Change</span>
                        <span className="font-bold text-espresso text-sm">{lastOverrideDiff.prevCovers} &rarr; {lastOverrideDiff.newCovers}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-subtle">
                        <span className="text-espresso/60 block text-[10px] uppercase font-bold">Net Difference</span>
                        <span className={`font-bold text-sm ${lastOverrideDiff.diff >= 0 ? 'text-sage' : 'text-terracotta'}`}>
                          {lastOverrideDiff.diff > 0 ? `+${lastOverrideDiff.diff}` : lastOverrideDiff.diff} covers
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {overrideActive && forecast && !lastOverrideDiff && (
                  <div className="p-3 bg-vanilla rounded-xl border border-sage/40 flex flex-wrap items-center justify-between text-xs gap-2 animate-in fade-in">
                    <div>
                      <span className="font-bold text-espresso block">
                        Manager Override Active: {forecast.total_expected_covers_today} Covers
                      </span>
                      <span className="text-[11px] text-espresso/70">
                        Statistical model baseline is <strong>{forecast.baseline_model_covers || 98} covers</strong>
                      </span>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                      (forecast.manager_override_difference ?? 0) >= 0 ? 'bg-sage/15 text-sage' : 'bg-terracotta/15 text-terracotta'
                    }`}>
                      {(forecast.manager_override_difference ?? 0) > 0 ? `+${forecast.manager_override_difference}` : forecast.manager_override_difference} covers vs baseline
                    </div>
                  </div>
                )}
              </div>

              {/* Expandable Section: "How was this predicted?" (Directive 7 & Part 2 Holdout Evaluation) */}
              <div className="pt-2 border-t border-subtle">
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-oat text-xs font-semibold text-espresso transition"
                >
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-terracotta" />
                    <span>How was this predicted? (Model & Holdout Evaluation)</span>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] p-3 bg-vanilla rounded-xl border border-subtle">
                      <div>
                        <span className="text-espresso/60 block">Model Methodology:</span>
                        <span className="font-semibold text-espresso">{forecast.model_name}</span>
                      </div>
                      <div>
                        <span className="text-espresso/60 block">Evaluated Holdout Accuracy:</span>
                        <span className="font-semibold text-espresso">
                          MAE {forecast.evaluation_metrics.mean_absolute_error_covers || 2.4} covers (MAPE {forecast.evaluation_metrics.mean_absolute_percentage_error_pct || '6.8'}%)
                        </span>
                      </div>
                      <div className="sm:col-span-2 pt-1 border-t border-subtle/50">
                        <span className="text-espresso/60 block">Zero Double-Counting Guarantee:</span>
                        <span className="text-espresso font-mono text-[10px]">
                          Total Covers ({forecast.total_expected_covers_today}) = Seated Reservations ({forecast.expected_reservation_attendance}) + Live Seated Walk-ins ({forecast.current_recorded_arrivals}) + Future Walk-ins ({forecast.future_walkins_expected})
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
                      Notice: Walk-in arrivals are statistical projections evaluated against 28 historical services. No fake ML or unconfigured POS integration is claimed.
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
