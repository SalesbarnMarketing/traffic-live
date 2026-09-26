import { useState, useEffect, useRef, useCallback } from 'react';
import { IncidentReport, ReportType } from '../types';
import {
  playVoiceActivationChime,
  playVoiceSuccessChime,
  playVoiceErrorChime,
  speakVoiceAssistantResponse
} from '../utils/voiceAudioFeedback';
import { calculateDistanceKm, formatDistance } from '../utils/spikeProximityAudio';
import { getLastKnownUserPosition, getExactDeviceGps } from '../utils/locationChecker';

export interface VoiceCommandAction {
  id: string;
  label: string;
  category: 'safety' | 'navigation' | 'reports' | 'system';
  phrases: string[];
  description: string;
  example: string;
  handler: (args?: { transcript: string; matchedPhrase: string }) => void;
}

export interface UseVoiceAssistantProps {
  reports?: IncidentReport[];
  latestAlert?: string;
  activeTab: 'dashboard' | 'map' | 'feed' | 'report' | 'admin' | 'donations' | 'pricing' | 'course';
  setActiveTab: (tab: 'dashboard' | 'map' | 'feed' | 'report' | 'admin' | 'donations' | 'pricing' | 'course') => void;
  openSOSModal: (options?: any) => void;
  openReportModal: (options?: {
    type?: ReportType;
    title?: string;
    coords?: { lat: number; lng: number };
    onScene?: boolean;
    autoDetectGps?: boolean;
    forceFullModal?: boolean;
  }) => void;
  openDriverMode?: () => void;
  closeDriverMode?: () => void;
  isDriverModeOpen?: boolean;
  openLocationCheck?: () => void;
  openOnboarding?: () => void;
  openFeedback?: () => void;
  openUserProfile?: () => void;
  openWallOfHeroes?: () => void;
  toggleSpikeVoice?: () => void;
  isSpikeVoiceEnabled?: boolean;
}

export function useVoiceAssistant({
  reports = [],
  latestAlert = "N1 North: Spiking hazard reported past Pumulani Toll. Drive with extreme caution.",
  activeTab,
  setActiveTab,
  openSOSModal,
  openReportModal,
  openDriverMode,
  closeDriverMode,
  isDriverModeOpen = false,
  openLocationCheck,
  openOnboarding,
  openFeedback,
  openUserProfile,
  openWallOfHeroes,
  toggleSpikeVoice,
  isSpikeVoiceEnabled = true
}: UseVoiceAssistantProps) {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isContinuousMode, setIsContinuousMode] = useState<boolean>(() => {
    return localStorage.getItem('lt_npc_voice_continuous') === 'true';
  });
  const [wakeWordDetected, setWakeWordDetected] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [lastExecutedCommand, setLastExecutedCommand] = useState<{
    text: string;
    actionLabel: string;
    timestamp: number;
    success: boolean;
  } | null>(null);
  const [isVoiceCommandModalOpen, setIsVoiceCommandModalOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const restartTimerRef = useRef<any>(null);
  const isContinuousModeRef = useRef<boolean>(isContinuousMode);
  const isListeningIntentRef = useRef<boolean>(false);

  // Keep ref synced
  useEffect(() => {
    isContinuousModeRef.current = isContinuousMode;
  }, [isContinuousMode]);

  // Check user GPS location for proximity queries
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  // Compute nearest spike hazard on demand
  const getNearestSpikeInfo = useCallback(() => {
    const activeSpikes = reports.filter(
      (r) =>
        (r.type === 'spiking' || (r.title + ' ' + r.description).toLowerCase().includes('spike')) &&
        (r.status === 'approved' || r.status === 'resolved')
    );

    if (activeSpikes.length === 0) {
      return {
        count: 0,
        nearest: null,
        distanceKm: null,
        message: 'All corridors monitored. There are currently no active spike trap hazards reported in the system.'
      };
    }

    if (!userLocation) {
      const first = activeSpikes[0];
      return {
        count: activeSpikes.length,
        nearest: first,
        distanceKm: null,
        message: `There are ${activeSpikes.length} active verified spike trap hotspots monitored across Gauteng. Nearest recorded is on ${first.roadName || first.locationName}: ${first.title}.`
      };
    }

    let minDistance = Infinity;
    let closestSpike = activeSpikes[0];

    for (const spike of activeSpikes) {
      const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, spike.latitude, spike.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closestSpike = spike;
      }
    }

    const distStr = formatDistance(minDistance);
    const loc = closestSpike.roadName || closestSpike.locationName;
    const urgency = minDistance <= 3.5 ? 'Warning! High alert.' : 'Advisory:';

    return {
      count: activeSpikes.length,
      nearest: closestSpike,
      distanceKm: minDistance,
      message: `${urgency} ${activeSpikes.length} active spike hazards monitored. Nearest is ${distStr} away on ${loc}.`
    };
  }, [reports, userLocation]);

  const dispatchVoiceReportWithGps = useCallback(async (options: { type?: ReportType; title?: string }) => {
    playVoiceSuccessChime();

    // 1. Immediate cache check: if we already have a recent GPS fix
    const cached = getLastKnownUserPosition();
    if (cached && typeof cached.latitude === 'number' && typeof cached.longitude === 'number') {
      const cleanLat = Number(cached.latitude.toFixed(6));
      const cleanLng = Number(cached.longitude.toFixed(6));
      openReportModal({
        ...options,
        coords: { lat: cleanLat, lng: cleanLng },
        onScene: true,
        autoDetectGps: true,
        forceFullModal: true
      });
      speakVoiceAssistantResponse(`Opening ${options.title || 'report'} with your GPS location locked.`);
      return;
    }

    // 2. Announce location acquisition
    speakVoiceAssistantResponse(`Acquiring GPS location for ${options.title || 'accident'} report.`);

    // 3. Concurrently fetch fresh device GPS
    try {
      const fix = await getExactDeviceGps({ timeout: 6000 });
      if (fix) {
        const cleanLat = Number(fix.latitude.toFixed(6));
        const cleanLng = Number(fix.longitude.toFixed(6));
        openReportModal({
          ...options,
          coords: { lat: cleanLat, lng: cleanLng },
          onScene: true,
          autoDetectGps: true,
          forceFullModal: true
        });
        speakVoiceAssistantResponse(`GPS locked. Opening ${options.title || 'accident'} report.`);
        return;
      }
    } catch (err) {
      console.warn('Voice command GPS error:', err);
    }

    // 4. Fallback: open report modal with autoDetectGps enabled so ReportModal continues locating in background
    openReportModal({
      ...options,
      onScene: true,
      autoDetectGps: true,
      forceFullModal: true
    });
    speakVoiceAssistantResponse(`Opening ${options.title || 'report'} form.`);
  }, [openReportModal]);

  // Voice Command Definitions
  const commands: VoiceCommandAction[] = [
    // 1. EMERGENCY & SOS
    {
      id: 'emergency_sos',
      label: 'Trigger Emergency SOS',
      category: 'safety',
      phrases: [
        'emergency',
        'sos',
        'help',
        'mayday',
        'send help',
        'emergency sos',
        'accident emergency',
        'puncture emergency',
        'call sos',
        'i need help',
        'distress'
      ],
      description: 'Immediately triggers the emergency SOS broadcast protocol',
      example: '"Hey NPC, Emergency SOS" or "Send Help"',
      handler: () => {
        playVoiceSuccessChime();
        openSOSModal();
        speakVoiceAssistantResponse('Opening Emergency SOS protocol. Stay safe.');
      }
    },

    // 1b. GBV / VULNERABLE MOTORIST ASSIST
    {
      id: 'gbv_assist',
      label: 'Trigger GBV Emergency Assist',
      category: 'safety',
      phrases: [
        'gbv',
        'gbv assist',
        'gender based violence',
        'vulnerable motorist',
        'safe escort',
        'domestic violence help',
        'i am in danger'
      ],
      description: 'Immediately triggers confidential GBV & vulnerable motorist emergency assistance',
      example: '"Hey NPC, GBV assist" or "I am in danger"',
      handler: () => {
        playVoiceSuccessChime();
        openSOSModal();
        speakVoiceAssistantResponse('Activating GBV priority emergency assistance protocol. Stay safe.');
      }
    },

    // 2. SPIKE TRAP RADAR QUERY
    {
      id: 'check_spikes',
      label: 'Query Spike Trap Radar',
      category: 'safety',
      phrases: [
        'where is the spike',
        'where is the nearest spike',
        'nearest spike',
        'spike status',
        'check spikes',
        'check spike traps',
        'are there spikes',
        'spike warning',
        'spike hazards',
        'hazard check',
        'is it safe',
        'spike radar'
      ],
      description: 'Checks active spike hotspots and speaks the nearest distance aloud',
      example: '"Hey NPC, where is the nearest spike?"',
      handler: () => {
        playVoiceSuccessChime();
        const spikeInfo = getNearestSpikeInfo();
        speakVoiceAssistantResponse(spikeInfo.message);
      }
    },

    // 3. LATEST TRAFFIC REPORT
    {
      id: 'traffic_update',
      label: 'Read Latest Traffic Alert',
      category: 'safety',
      phrases: [
        'traffic report',
        'traffic update',
        'latest alert',
        'latest traffic',
        'what is the traffic',
        'read alert',
        'read alerts',
        'road status',
        'highway status',
        'road conditions',
        'whats the update',
        'traffic status'
      ],
      description: 'Reads the latest live ticker highway alert aloud',
      example: '"Hey NPC, traffic report"',
      handler: () => {
        playVoiceSuccessChime();
        speakVoiceAssistantResponse(`Live Traffic Update: ${latestAlert}`);
      }
    },

    // 4. REPORT SPIKING
    {
      id: 'report_spiking',
      label: 'Report Spiking Hazard',
      category: 'reports',
      phrases: [
        'report spike',
        'report spiking',
        'report spike trap',
        'report nails',
        'spike trap alert'
      ],
      description: 'Opens report dialog pre-configured for spike trap hazard with GPS',
      example: '"Hey NPC, report spike"',
      handler: () => {
        dispatchVoiceReportWithGps({ type: 'spiking', title: 'Spike Trap Hazard' });
      }
    },

    // 5. REPORT CRASH / COLLISION (ACCIDENT SCENE)
    {
      id: 'report_crash',
      label: 'Report Crash / Collision',
      category: 'reports',
      phrases: [
        'report crash',
        'report collision',
        'report car crash',
        'report accident',
        'car crash',
        'car accident',
        'accident',
        'crash',
        'accident scene',
        'crash scene',
        'there is an accident',
        'there is a crash',
        'there\'s an accident',
        'there\'s a crash',
        'report an accident',
        'post an accident',
        'post accident',
        'post crash',
        'vehicle crash',
        'major accident',
        'accident report',
        'crash report'
      ],
      description: 'Opens report dialog pre-configured for vehicle crash with GPS auto-location',
      example: '"Hey NPC, report crash" or "Hey NPC, accident"',
      handler: () => {
        dispatchVoiceReportWithGps({ type: 'crash', title: 'Vehicle Crash' });
      }
    },

    // 5b. REPORT FATAL CRASH
    {
      id: 'report_fatal_crash',
      label: 'Report Fatal Crash / Major Collision',
      category: 'reports',
      phrases: [
        'report fatal crash',
        'report fatal accident',
        'report fatal collision',
        'fatal crash',
        'fatal accident',
        'fatal collision',
        'fatal scene',
        'deadly crash',
        'critical accident'
      ],
      description: 'Opens report dialog pre-configured for fatal crash scene with GPS',
      example: '"Hey NPC, report fatal crash"',
      handler: () => {
        dispatchVoiceReportWithGps({ type: 'fatal_crash', title: 'Fatal Crash / Critical Scene' });
      }
    },

    // 6. REPORT POTHOLE
    {
      id: 'report_pothole',
      label: 'Report Dangerous Pothole',
      category: 'reports',
      phrases: [
        'report pothole',
        'report road damage',
        'pothole report',
        'dangerous pothole'
      ],
      description: 'Opens report dialog pre-configured for pothole damage with GPS',
      example: '"Hey NPC, report pothole"',
      handler: () => {
        dispatchVoiceReportWithGps({ type: 'pothole', title: 'Dangerous Pothole' });
      }
    },

    // 7. GENERAL REPORT HAZARD & CREATE POST
    {
      id: 'report_hazard',
      label: 'Report Road Hazard / Incident',
      category: 'reports',
      phrases: [
        'report hazard',
        'report incident',
        'report roadworks',
        'add report',
        'new report',
        'create report',
        'log report',
        'create post',
        'create a post',
        'new post',
        'make a post',
        'post',
        'post incident',
        'post hazard',
        'post update'
      ],
      description: 'Opens incident reporting form with GPS auto-location',
      example: '"Hey NPC, create a post" or "Hey NPC, report hazard"',
      handler: () => {
        dispatchVoiceReportWithGps({ type: 'crash', title: 'Traffic Incident' });
      }
    },

    // 8. GO TO MAP
    {
      id: 'open_map',
      label: 'Open Live Map',
      category: 'navigation',
      phrases: [
        'open map',
        'show map',
        'go to map',
        'live map',
        'map view',
        'view map',
        'map'
      ],
      description: 'Switches to the live interactive radar map',
      example: '"Hey NPC, open map"',
      handler: () => {
        playVoiceSuccessChime();
        setActiveTab('map');
        speakVoiceAssistantResponse('Opening live interactive map.');
      }
    },

    // 9. GO TO FEEDS / CLOSE MAP
    {
      id: 'open_feed',
      label: 'Open Live Feeds',
      category: 'navigation',
      phrases: [
        'open feed',
        'open feeds',
        'show feed',
        'show feeds',
        'go to feeds',
        'live feed',
        'close map',
        'radar feeds',
        'feeds'
      ],
      description: 'Switches to live multi-source traffic feeds',
      example: '"Hey NPC, open feeds" or "Close map"',
      handler: () => {
        playVoiceSuccessChime();
        setActiveTab('feed');
        speakVoiceAssistantResponse('Switching to live radar feeds.');
      }
    },

    // 10. GO TO DASHBOARD / OPTIONS
    {
      id: 'open_dashboard',
      label: 'Open Control Dashboard',
      category: 'navigation',
      phrases: [
        'open dashboard',
        'go to dashboard',
        'dashboard',
        'options',
        'menu',
        'home',
        'main menu'
      ],
      description: 'Switches to main options control dashboard',
      example: '"Hey NPC, open dashboard"',
      handler: () => {
        playVoiceSuccessChime();
        setActiveTab('dashboard');
        speakVoiceAssistantResponse('Switching to control dashboard.');
      }
    },

    // 11. DRIVER MODE TOGGLE
    {
      id: 'driver_mode',
      label: 'Open Driver Mode',
      category: 'navigation',
      phrases: [
        'driver mode',
        'driving mode',
        'open driver mode',
        'start driver mode',
        'driver bulletin',
        'driver view'
      ],
      description: 'Launches high-contrast full-screen hands-free Driver Bulletin Mode',
      example: '"Hey NPC, driver mode"',
      handler: () => {
        playVoiceSuccessChime();
        if (openDriverMode) openDriverMode();
        speakVoiceAssistantResponse('Driver bulletin mode activated.');
      }
    },

    // 12. EXIT DRIVER MODE
    {
      id: 'exit_driver_mode',
      label: 'Exit Driver Mode',
      category: 'navigation',
      phrases: [
        'exit driver mode',
        'close driver mode',
        'normal mode',
        'stop driving mode',
        'exit driver'
      ],
      description: 'Exits Driver Bulletin Mode back to standard interface',
      example: '"Hey NPC, normal mode"',
      handler: () => {
        playVoiceSuccessChime();
        if (closeDriverMode) closeDriverMode();
        speakVoiceAssistantResponse('Exiting driver mode.');
      }
    },

    // 13. DONATIONS / SUPPORT
    {
      id: 'open_support',
      label: 'Community Safety Fund',
      category: 'navigation',
      phrases: [
        'support',
        'donations',
        'donate',
        'safety fund',
        'support fund',
        'community fund',
        'help fund'
      ],
      description: 'Opens community donations and fuel sponsorship portal',
      example: '"Hey NPC, open donations"',
      handler: () => {
        playVoiceSuccessChime();
        setActiveTab('donations');
        speakVoiceAssistantResponse('Opening community support and safety fund.');
      }
    },

    // 13B. COMMUNITY WALL OF HEROES
    {
      id: 'wall_of_heroes',
      label: 'Wall of Heroes',
      category: 'navigation',
      phrases: [
        'wall of heroes',
        'heroes wall',
        'heroes roll',
        'community heroes',
        'show heroes',
        'who donated',
        'who donated coffee',
        'who fixed potholes',
        'coffee donors',
        'pothole fixers',
        'fuel donors',
        'heroes'
      ],
      description: 'Opens the Community Wall of Heroes displaying coffee donors, pothole fixers & fuel sponsors',
      example: '"Hey NPC, Wall of Heroes"',
      handler: () => {
        playVoiceSuccessChime();
        if (openWallOfHeroes) {
          openWallOfHeroes();
        } else {
          setActiveTab('donations');
        }
        speakVoiceAssistantResponse('Opening the Community Wall of Heroes roll.');
      }
    },

    // 14. DRIVING COURSE
    {
      id: 'open_course',
      label: 'Safe Driving Course',
      category: 'navigation',
      phrases: [
        'safe driving course',
        'driving course',
        'anti hijack course',
        'driving school',
        'safety course',
        'course'
      ],
      description: 'Opens anti-hijacking and defensive driving course registration',
      example: '"Hey NPC, safe driving course"',
      handler: () => {
        playVoiceSuccessChime();
        setActiveTab('course');
        speakVoiceAssistantResponse('Opening safe driving anti hijack course portal.');
      }
    },

    // 15. PRICING & SPONSORSHIP
    {
      id: 'open_pricing',
      label: 'Pricing & Advertising',
      category: 'navigation',
      phrases: [
        'pricing',
        'rate card',
        'advertising',
        'advertise',
        'sponsor packages',
        'rates'
      ],
      description: 'Opens live sponsorship rate card',
      example: '"Hey NPC, pricing"',
      handler: () => {
        playVoiceSuccessChime();
        setActiveTab('pricing');
        speakVoiceAssistantResponse('Opening sponsorship packages and rate card.');
      }
    },

    // 16. ADMIN PORTAL
    {
      id: 'open_admin',
      label: 'Admin Control Portal',
      category: 'navigation',
      phrases: [
        'admin',
        'admin portal',
        'admin login',
        'control portal'
      ],
      description: 'Switches to the administrator verification portal',
      example: '"Hey NPC, admin"',
      handler: () => {
        playVoiceSuccessChime();
        setActiveTab('admin');
        speakVoiceAssistantResponse('Opening admin control portal.');
      }
    },

    // 17. GPS LOCATION CHECK
    {
      id: 'gps_check',
      label: 'Check GPS Diagnostic',
      category: 'system',
      phrases: [
        'gps check',
        'check gps',
        'check location',
        'where am i',
        'my location',
        'gps status',
        'location check'
      ],
      description: 'Opens GPS accuracy diagnostic and position telemetry',
      example: '"Hey NPC, check GPS"',
      handler: () => {
        playVoiceSuccessChime();
        if (openLocationCheck) openLocationCheck();
        speakVoiceAssistantResponse('Opening GPS accuracy and diagnostic telemetry.');
      }
    },

    // 18. SAFE DRIVING TIPS & TOUR
    {
      id: 'safety_tips',
      label: 'Safe Driving Rules & Tour',
      category: 'system',
      phrases: [
        'safe driving tips',
        'safety tips',
        'driving rules',
        'tour',
        'app tour',
        'how to use'
      ],
      description: 'Opens safe driving guidelines and defensive rules',
      example: '"Hey NPC, safe driving tips"',
      handler: () => {
        playVoiceSuccessChime();
        if (openOnboarding) openOnboarding();
        speakVoiceAssistantResponse('Opening safe driving tips and safety guidelines.');
      }
    },

    // 19. MUTE / UNMUTE AUDIO
    {
      id: 'toggle_voice_audio',
      label: 'Toggle Voice Radar Audio',
      category: 'system',
      phrases: [
        'mute',
        'silence',
        'stop talking',
        'be quiet',
        'stop audio',
        'mute voice',
        'unmute',
        'enable voice',
        'turn on voice'
      ],
      description: 'Mutes or unmutes speech synthesis announcements',
      example: '"Hey NPC, mute" or "Unmute"',
      handler: ({ matchedPhrase }) => {
        const wantsMute = ['mute', 'silence', 'stop talking', 'be quiet', 'stop audio', 'mute voice'].some((p) =>
          matchedPhrase.toLowerCase().includes(p)
        );
        if (wantsMute) {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
          if (toggleSpikeVoice && isSpikeVoiceEnabled) {
            toggleSpikeVoice();
          }
          playVoiceSuccessChime();
          speakVoiceAssistantResponse('Voice announcements muted.');
        } else {
          if (toggleSpikeVoice && !isSpikeVoiceEnabled) {
            toggleSpikeVoice();
          }
          playVoiceSuccessChime();
          speakVoiceAssistantResponse('Voice announcements enabled.');
        }
      }
    },

    // 20. HELP & COMMANDS LIST
    {
      id: 'voice_help',
      label: 'Show Voice Commands',
      category: 'system',
      phrases: [
        'help',
        'what can i say',
        'voice commands',
        'list commands',
        'commands',
        'voice help',
        'show commands'
      ],
      description: 'Opens the complete Voice Commands directory and guide',
      example: '"Hey NPC, what can I say?"',
      handler: () => {
        playVoiceSuccessChime();
        setIsVoiceCommandModalOpen(true);
        speakVoiceAssistantResponse('Here are the available voice commands. You can say: Emergency SOS, where is the nearest spike, traffic report, report crash, or open map.');
      }
    }
  ];

  // Process a text transcript and match against commands
  const processVoiceTranscript = useCallback(
    (rawTranscript: string) => {
      if (!rawTranscript || !rawTranscript.trim()) return false;
      const text = rawTranscript.trim().toLowerCase();
      setLiveTranscript(text);

      // Check for Wake Words: "hey npc", "npc", "live traffic", "hey traffic", "traffic npc"
      const wakeWords = ['hey npc', 'live traffic npc', 'live traffic', 'hey traffic', 'traffic npc', 'npc', 'ok npc'];
      let commandContent = text;
      let hasWakeWord = false;

      for (const wake of wakeWords) {
        if (text.startsWith(wake)) {
          hasWakeWord = true;
          commandContent = text.substring(wake.length).trim();
          break;
        }
      }

      // If in continuous mode and wake word was said alone:
      if (hasWakeWord && !commandContent) {
        setWakeWordDetected(true);
        playVoiceActivationChime();
        setTimeout(() => setWakeWordDetected(false), 4000);
        return true;
      }

      // If wake word was included at start, remove punctuation
      commandContent = commandContent.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();

      // Find matching command
      let matchedCommand: VoiceCommandAction | null = null;
      let matchedPhrase = '';

      for (const cmd of commands) {
        for (const phrase of cmd.phrases) {
          const cleanPhrase = phrase.toLowerCase().trim();
          // Check if commandContent matches or contains phrase
          if (
            commandContent === cleanPhrase ||
            commandContent.startsWith(cleanPhrase + ' ') ||
            commandContent.endsWith(' ' + cleanPhrase) ||
            commandContent.includes(cleanPhrase)
          ) {
            matchedCommand = cmd;
            matchedPhrase = cleanPhrase;
            break;
          }
        }
        if (matchedCommand) break;
      }

      if (matchedCommand) {
        setLastExecutedCommand({
          text: rawTranscript,
          actionLabel: matchedCommand.label,
          timestamp: Date.now(),
          success: true
        });
        setWakeWordDetected(false);
        setIsProcessing(false);

        // Execute action
        matchedCommand.handler({ transcript: rawTranscript, matchedPhrase });
        return true;
      } else {
        // If wake word was detected or user tapped mic, but no command matched:
        if (hasWakeWord || !isContinuousModeRef.current) {
          playVoiceErrorChime();
          setLastExecutedCommand({
            text: rawTranscript,
            actionLabel: 'Unrecognized command. Say "Help" for list.',
            timestamp: Date.now(),
            success: false
          });
        }
        return false;
      }
    },
    [commands, getNearestSpikeInfo, latestAlert]
  );

  const processVoiceTranscriptRef = useRef(processVoiceTranscript);
  processVoiceTranscriptRef.current = processVoiceTranscript;

  // Initialize Speech Recognition API
  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-ZA'; // English (South Africa) for local dialect / accents, fallbacks to en-US

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += trans;
          } else {
            interimTranscript += trans;
          }
        }

        const activeText = finalTranscript || interimTranscript;
        setLiveTranscript(activeText);

        if (finalTranscript) {
          setIsProcessing(true);
          processVoiceTranscriptRef.current(finalTranscript);
          setTimeout(() => setIsProcessing(false), 800);
        }
      };

      recognition.onerror = (event: any) => {
        // Ignore benign errors like 'no-speech' or 'aborted'
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please allow microphone in browser settings.');
          setIsListening(false);
          isListeningIntentRef.current = false;
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech recognition event error:', event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // If continuous mode or intent is active, gracefully restart after brief timeout
        if (isListeningIntentRef.current || isContinuousModeRef.current) {
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            try {
              if (recognitionRef.current && (isListeningIntentRef.current || isContinuousModeRef.current)) {
                recognitionRef.current.start();
              }
            } catch (err) {
              // already running or stopped
            }
          }, 350);
        }
      };

      recognitionRef.current = recognition;

      // Auto start if user previously left continuous mode ON
      if (isContinuousModeRef.current) {
        isListeningIntentRef.current = true;
        try {
          recognition.start();
        } catch {}
      }
    } catch (e) {
      console.warn('Speech Recognition setup error:', e);
      setIsSupported(false);
    }

    return () => {
      clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Start listening (Push-to-Talk or Continuous Activation)
  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    isListeningIntentRef.current = true;
    playVoiceActivationChime();
    setLiveTranscript('');
    try {
      recognitionRef.current.start();
    } catch (e) {
      // might already be started
    }
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    isListeningIntentRef.current = false;
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {}
    setIsListening(false);
    setLiveTranscript('');
  }, []);

  // Toggle Continuous Wake Word Mode ("Hey NPC")
  const toggleContinuousMode = useCallback(() => {
    const nextVal = !isContinuousMode;
    setIsContinuousMode(nextVal);
    localStorage.setItem('lt_npc_voice_continuous', String(nextVal));

    if (nextVal) {
      startListening();
      speakVoiceAssistantResponse('Hands-free voice mode active. Say "Hey NPC" followed by your command.');
    } else {
      stopListening();
      speakVoiceAssistantResponse('Hands-free listening disabled. Tap microphone when needed.');
    }
  }, [isContinuousMode, startListening, stopListening]);

  // Manual Trigger helper for Voice HUD Buttons
  const executeCommandById = useCallback(
    (cmdId: string) => {
      const target = commands.find((c) => c.id === cmdId);
      if (target) {
        target.handler({ transcript: target.phrases[0], matchedPhrase: target.phrases[0] });
        setLastExecutedCommand({
          text: target.phrases[0],
          actionLabel: target.label,
          timestamp: Date.now(),
          success: true
        });
      }
    },
    [commands]
  );

  return {
    isSupported,
    isListening,
    isContinuousMode,
    wakeWordDetected,
    liveTranscript,
    lastExecutedCommand,
    isProcessing,
    errorMessage,
    commands,
    isVoiceCommandModalOpen,
    setIsVoiceCommandModalOpen,
    startListening,
    stopListening,
    toggleContinuousMode,
    executeCommandById,
    processVoiceTranscript
  };
}
