import React, { useState, useRef, useEffect } from 'react';
import {
   Video, Mic, MicOff, PhoneOff, Calendar, User, Activity,
   Sparkles, Volume2, Loader2, AlertCircle, Clock, Plus, X
} from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { TelehealthSession, Client } from '../types';
import { telehealthService, clientService } from '../services/supabaseService';
import { useTenant } from '../context/TenantContext';
import { toast } from 'sonner';

const Telehealth: React.FC = () => {
   const { currentTenant } = useTenant();
   const [activeTab, setActiveTab] = useState<'appointments' | 'live-ai'>('appointments');
   const [sessions, setSessions] = useState<TelehealthSession[]>([]);
   const [clients, setClients] = useState<Client[]>([]);

   // Create Modal State
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [newSession, setNewSession] = useState({ clientId: '', topic: '', date: '', time: '' });

   // AI State
   const [isLive, setIsLive] = useState(false);
   const [isMuted, setIsMuted] = useState(false);
   const [volumeLevel, setVolumeLevel] = useState(0);
   const [aiStatus, setAiStatus] = useState<'Disconnected' | 'Connecting' | 'Connected'>('Disconnected');

   // --- Live API Refs ---
   const sessionPromiseRef = useRef<Promise<any> | null>(null);
   const audioContextRef = useRef<AudioContext | null>(null);
   const streamRef = useRef<MediaStream | null>(null);

   useEffect(() => {
      if (currentTenant) {
         loadData();
      }
   }, [currentTenant]);

   const loadData = async () => {
      try {
         const s = await telehealthService.getSessions();
         setSessions(s);
         const c = await clientService.getByTenant(currentTenant!.id);
         setClients(c);
      } catch (e) {
         console.error(e);
         toast.error("Failed to load telehealth data");
      }
   };

   const handleCreateSession = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentTenant) return;
      try {
         const scheduledAt = `${newSession.date}T${newSession.time}:00`;
         await telehealthService.createSession({
            tenantId: currentTenant.id,
            clientId: newSession.clientId,
            topic: newSession.topic,
            scheduledAt
         });
         toast.success("Telehealth session scheduled");
         setIsModalOpen(false);
         loadData();
      } catch (e) {
         console.error(e);
         toast.error("Failed to schedule session");
      }
   };

   const handleJoinCall = async (id: string) => {
      try {
         await telehealthService.joinSession(id);
         toast.success("Joining secure video room...");
         // In a real app, verify permission then:
         window.open(`https://meet.jit.si/careflow-${id}`, '_blank');
         loadData();
      } catch (e) {
         toast.error("Failed to join session");
      }
   };

   // --- Handlers for AI Assistant ---

   const startAiSession = async () => {
      try {
         setAiStatus('Connecting');

         const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
         streamRef.current = stream;

         // Setup Audio Context (Cross-browser safe)
         const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
         const audioCtx = new AudioContextClass({ sampleRate: 16000 });
         audioContextRef.current = audioCtx;

         // Visualizer setup (Mock volume for UI)
         const analyser = audioCtx.createAnalyser();
         const source = audioCtx.createMediaStreamSource(stream);
         source.connect(analyser);
         analyser.fftSize = 256;
         const bufferLength = analyser.frequencyBinCount;
         const dataArray = new Uint8Array(bufferLength);

         const updateVolume = () => {
            if (!audioContextRef.current) return; // Stop if closed
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            setVolumeLevel(average);
            requestAnimationFrame(updateVolume);
         };

         // Connect to Gemini Live
         sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
               responseModalities: [Modality.AUDIO],
               speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
               },
               systemInstruction: 'You are a friendly and empathetic virtual care assistant. Help the user with symptom checking and general health advice. Keep answers concise.',
            },
            callbacks: {
               onopen: () => {
                  setAiStatus('Connected');
                  setIsLive(true);
                  updateVolume();

                  // Start Input Stream
                  const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
                  scriptProcessor.onaudioprocess = (e) => {
                     if (isMuted) return;
                     const inputData = e.inputBuffer.getChannelData(0);
                     const pcmBlob = createBlob(inputData);
                     sessionPromiseRef.current?.then(session => {
                        session.sendRealtimeInput({ media: pcmBlob });
                     });
                  };
                  source.connect(scriptProcessor);
                  scriptProcessor.connect(audioCtx.destination);
               },
               onmessage: async (msg: LiveServerMessage) => {
                  const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                  if (audioData) {
                     playAudio(audioData);
                  }
               },
               onclose: () => {
                  setAiStatus('Disconnected');
                  setIsLive(false);
               },
               onerror: (e) => {
                  console.error(e);
                  setAiStatus('Disconnected');
                  setIsLive(false);
               }
            }
         });

      } catch (err) {
         console.error("Failed to start AI session", err);
         setAiStatus('Disconnected');
      }
   };

   const endAiSession = () => {
      if (streamRef.current) {
         streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
         audioContextRef.current.close();
         audioContextRef.current = null;
      }
      setIsLive(false);
      setAiStatus('Disconnected');
      setVolumeLevel(0);
   };

   // Helper: Create PCM Blob
   function createBlob(data: Float32Array): Blob {
      const l = data.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
         // Clamp values
         const s = Math.max(-1, Math.min(1, data[i]));
         int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Simple base64 encode
      let binary = '';
      const bytes = new Uint8Array(int16.buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
         binary += String.fromCharCode(bytes[i]);
      }

      return {
         data: btoa(binary),
         mimeType: 'audio/pcm;rate=16000',
      };
   }

   // Helper: Play Audio
   async function playAudio(base64: string) {
      if (!audioContextRef.current) return;

      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
         bytes[i] = binaryString.charCodeAt(i);
      }

      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
         channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();
   }


   // --- Render ---

   return (
      <div className="space-y-6 animate-in fade-in duration-500">
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-2xl font-bold text-slate-900">Telehealth & Virtual Care</h1>
               <p className="text-slate-500 text-sm">Connect remotely with your care team or AI assistant.</p>
            </div>
         </div>

         {/* Tabs */}
         <div className="flex p-1 bg-slate-200 rounded-xl w-fit">
            <button
               onClick={() => setActiveTab('appointments')}
               className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'appointments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
               <Calendar size={16} /> Scheduled Calls
            </button>
            <button
               onClick={() => setActiveTab('live-ai')}
               className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'live-ai' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
               <Sparkles size={16} /> AI Virtual Nurse
            </button>
         </div>

         {activeTab === 'appointments' ? (
            <div>
               <div className="flex justify-end mb-6">
                  <button
                     onClick={() => setIsModalOpen(true)}
                     className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 flex items-center gap-2"
                  >
                     <Plus size={18} /> Schedule Call
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sessions.length === 0 ? <p className="text-slate-500 col-span-2 text-center py-10">No upcoming sessions.</p> :
                     sessions.map(session => (
                        <div key={session.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                                    <Video size={24} />
                                 </div>
                                 <div>
                                    <h3 className="font-bold text-slate-900">{session.topic}</h3>
                                    <p className="text-xs text-slate-500">with {session.clientName}</p>
                                 </div>
                              </div>
                              <span className={`text-xs font-bold px-2 py-1 rounded border ${session.status === 'Live' ? 'bg-green-100 text-green-700 border-green-200 animate-pulse' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                 {session.status}
                              </span>
                           </div>

                           <div className="space-y-2 mb-6">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                 <Calendar size={16} className="text-slate-400" /> {session.scheduledTime}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                 <Clock size={16} className="text-slate-400" /> {session.duration}
                              </div>
                           </div>

                           <button
                              onClick={() => handleJoinCall(session.id)}
                              className="w-full py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-900/20 flex items-center justify-center gap-2"
                           >
                              <Video size={18} /> {session.status === 'Live' ? 'Rejoin Call' : 'Start Video Call'}
                           </button>
                        </div>
                     ))}
               </div>
            </div>
         ) : (
            <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl relative h-[500px] flex flex-col items-center justify-center text-white">
               {/* Background Pulse */}
               {isLive && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                     <div className="w-64 h-64 bg-primary-500 rounded-full blur-3xl animate-pulse" style={{ transform: `scale(${1 + volumeLevel / 100})` }}></div>
                  </div>
               )}

               {/* Main Content */}
               <div className="z-10 text-center space-y-6">
                  <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-4 border-slate-700 relative">
                     {isLive ? (
                        <Activity size={48} className="text-primary-400 animate-pulse" />
                     ) : (
                        <Sparkles size={48} className="text-slate-500" />
                     )}
                     {isLive && (
                        <span className="absolute -bottom-2 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full border-2 border-slate-900">
                           LIVE
                        </span>
                     )}
                  </div>

                  <div>
                     <h2 className="text-2xl font-bold">{isLive ? 'Listening...' : 'Virtual Health Assistant'}</h2>
                     <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
                        {isLive
                           ? "Ask about symptoms, medication advice, or general health questions."
                           : "Connect to start a real-time voice conversation with our AI nurse."}
                     </p>
                  </div>

                  {!isLive ? (
                     <button
                        onClick={startAiSession}
                        disabled={aiStatus === 'Connecting'}
                        className="px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-3"
                     >
                        {aiStatus === 'Connecting' ? <Loader2 className="animate-spin" /> : <Mic size={24} />}
                        Start Voice Session
                     </button>
                  ) : (
                     <div className="flex gap-4">
                        <button
                           onClick={() => setIsMuted(!isMuted)}
                           className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-slate-700 hover:bg-slate-600'}`}
                        >
                           {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
                        <button
                           onClick={endAiSession}
                           className="p-4 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors"
                        >
                           <PhoneOff size={24} />
                        </button>
                     </div>
                  )}
               </div>

               {/* Status Overlay */}
               <div className="absolute top-6 right-6">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-xs font-bold
                   ${aiStatus === 'Connected' ? 'text-green-400' : 'text-slate-400'}
                `}>
                     <div className={`w-2 h-2 rounded-full ${aiStatus === 'Connected' ? 'bg-green-400' : 'bg-slate-500'}`}></div>
                     {aiStatus}
                  </div>
               </div>
            </div>
         )}

         {/* Schedule Modal */}
         {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold text-slate-900">Schedule Telehealth Session</h3>
                     <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                  </div>
                  <form onSubmit={handleCreateSession} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
                        <select
                           className="w-full p-2 border border-slate-300 rounded-lg"
                           value={newSession.clientId}
                           onChange={e => setNewSession({ ...newSession, clientId: e.target.value })}
                           required
                        >
                           <option value="">Select Patient</option>
                           {clients.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                           ))}
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                        <input
                           type="text"
                           className="w-full p-2 border border-slate-300 rounded-lg"
                           placeholder="e.g. Monthly Review, Symptom Check"
                           value={newSession.topic}
                           onChange={e => setNewSession({ ...newSession, topic: e.target.value })}
                           required
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                           <input
                              type="date"
                              className="w-full p-2 border border-slate-300 rounded-lg"
                              value={newSession.date}
                              onChange={e => setNewSession({ ...newSession, date: e.target.value })}
                              required
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                           <input
                              type="time"
                              className="w-full p-2 border border-slate-300 rounded-lg"
                              value={newSession.time}
                              onChange={e => setNewSession({ ...newSession, time: e.target.value })}
                              required
                           />
                        </div>
                     </div>
                     <button className="w-full py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 mt-2">
                        Schedule Session
                     </button>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default Telehealth;
