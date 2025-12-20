
import React, { useState, useRef, useEffect } from 'react';
import {
   Video, Mic, MicOff, PhoneOff, Calendar, User, Activity,
   Sparkles, Volume2, Loader2, AlertCircle, Clock, Plus, X, Zap, Target, History, ShieldAlert, Cpu, Globe
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

   const [isModalOpen, setIsModalOpen] = useState(false);
   const [newSession, setNewSession] = useState({ clientId: '', topic: '', date: '', time: '' });

   const [isLive, setIsLive] = useState(false);
   const [isMuted, setIsMuted] = useState(false);
   const [volumeLevel, setVolumeLevel] = useState(0);
   const [aiStatus, setAiStatus] = useState<'Disconnected' | 'Connecting' | 'Connected'>('Disconnected');

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
         toast.error("Bridge failure: Telehealth data retrieval interrupted");
      }
   };

   const handleCreateSession = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentTenant) return;
      const subToast = toast.loading('Synchronizing scheduled manifest...');
      try {
         const scheduledAt = `${newSession.date}T${newSession.time}:00`;
         await telehealthService.createSession({
            tenantId: currentTenant.id,
            clientId: newSession.clientId,
            topic: newSession.topic,
            scheduledAt
         });
         toast.success("Remote Session Protocol Initialized", { id: subToast });
         setIsModalOpen(false);
         loadData();
      } catch (e) {
         toast.error("Manifest Synchronization Failure", { id: subToast });
      }
   };

   const handleJoinCall = async (id: string) => {
      const joinToast = toast.loading('Calibrating Secure Vision Link...');
      try {
         await telehealthService.joinSession(id);
         toast.success("Vision Bridge Established", { id: joinToast });
         window.open(`https://meet.jit.si/careflow-${id}`, '_blank');
         loadData();
      } catch (e) {
         toast.error("Vision Bridge Failure", { id: joinToast });
      }
   };

   const startAiSession = async () => {
      try {
         setAiStatus('Connecting');
         toast.info('Initializing Neural Nurse Handshake...');

         const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
         streamRef.current = stream;

         const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
         const audioCtx = new AudioContextClass({ sampleRate: 16000 });
         audioContextRef.current = audioCtx;

         const analyser = audioCtx.createAnalyser();
         const source = audioCtx.createMediaStreamSource(stream);
         source.connect(analyser);
         analyser.fftSize = 256;
         const bufferLength = analyser.frequencyBinCount;
         const dataArray = new Uint8Array(bufferLength);

         const updateVolume = () => {
            if (!audioContextRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            setVolumeLevel(average);
            requestAnimationFrame(updateVolume);
         };

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
                  toast.success('Neural Link Live');
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
                  if (audioData) playAudio(audioData);
               },
               onclose: () => {
                  setAiStatus('Disconnected');
                  setIsLive(false);
                  toast.warning('Neural Link Decommissioned');
               },
               onerror: () => {
                  setAiStatus('Disconnected');
                  setIsLive(false);
                  toast.error('Neural Logic Collapse');
               }
            }
         });
      } catch (err) {
         setAiStatus('Disconnected');
         toast.error('Audio Hardware Engagement Failure');
      }
   };

   const endAiSession = () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) {
         audioContextRef.current.close();
         audioContextRef.current = null;
      }
      setIsLive(false);
      setAiStatus('Disconnected');
      setVolumeLevel(0);
      toast.info('Session Protocol Terminated');
   };

   function createBlob(data: Float32Array): Blob {
      const l = data.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
         const s = Math.max(-1, Math.min(1, data[i]));
         int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      let binary = '';
      const bytes = new Uint8Array(int16.buffer);
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
   }

   async function playAudio(base64: string) {
      if (!audioContextRef.current) return;
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();
   }

   return (
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-12 h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-hide pr-4">
         <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Virtual <span className="text-primary-600">Vision</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">
                  Secure Remote Consultations • Neural AI Health Check • Remote Telemetry
               </p>
            </div>
         </div>

         {/* Navigation Deck */}
         <div className="flex p-2 bg-white border border-slate-100 rounded-[3rem] w-fit shadow-2xl relative z-50">
            <button
               onClick={() => {
                  setActiveTab('appointments');
                  toast.info('Accessing Scheduled Vision Manifest');
               }}
               className={`px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 ${activeTab === 'appointments' ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
            >
               <Calendar size={20} /> Scheduled Bridge
            </button>
            <button
               onClick={() => {
                  setActiveTab('live-ai');
                  toast.info('Accessing Neural Nurse Spectrum');
               }}
               className={`px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 ${activeTab === 'live-ai' ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
            >
               <Sparkles size={20} /> Neural Nurse
            </button>
         </div>

         {activeTab === 'appointments' ? (
            <div className="space-y-10">
               <div className="flex justify-end">
                  <button
                     onClick={() => setIsModalOpen(true)}
                     className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:bg-black flex items-center gap-6 active:scale-95 transition-all"
                  >
                     <Plus size={20} className="text-primary-500" /> Initialize Call Manifest
                  </button>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {sessions.length === 0 ? <div className="col-span-2 p-32 text-center grayscale opacity-10 flex flex-col items-center gap-10 bg-white rounded-[4rem] border border-slate-100 shadow-xl">
                     <Video size={120} className="text-slate-900" />
                     <p className="font-black uppercase tracking-[0.8em] text-[18px]">Null Bridge Manifest</p>
                  </div> :
                     sessions.map(session => (
                        <div key={session.id} className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl hover:shadow-primary-500/10 transition-all group relative overflow-hidden h-[350px] flex flex-col justify-between">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full blur-[60px] -mr-16 -mt-16" />
                           <div className="flex justify-between items-start relative z-10">
                              <div className="flex items-center gap-6">
                                 <div className="p-6 bg-primary-900 text-primary-400 rounded-[2rem] shadow-xl group-hover:scale-110 transition-transform">
                                    <Video size={32} />
                                 </div>
                                 <div className="space-y-1">
                                    <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter leading-none">{session.topic}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widestAlpha">UNIT: {session.clientName}</p>
                                 </div>
                              </div>
                              <span className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-xl border ${session.status === 'Live' ? 'bg-emerald-900 text-emerald-400 border-emerald-500 animate-pulse' : 'bg-primary-900 text-primary-400 border-primary-500'}`}>
                                 {session.status}
                              </span>
                           </div>

                           <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-50 space-y-4 relative z-10">
                              <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                 <Calendar size={18} className="text-primary-600" /> {session.scheduledTime}
                              </div>
                              <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                 <Clock size={18} className="text-primary-600" /> {session.duration} EPOCH
                              </div>
                           </div>

                           <button
                              onClick={() => handleJoinCall(session.id)}
                              className="w-full py-6 bg-slate-900 text-white font-black uppercase tracking-[0.4em] text-[10px] rounded-[2rem] hover:bg-black flex items-center justify-center gap-6 transition-all shadow-xl active:scale-95 relative z-10"
                           >
                              <Video size={20} className="text-primary-500" /> {session.status === 'Live' ? 'Re-engage Vision' : 'Initialize Vision Bridge'}
                           </button>
                        </div>
                     ))}
               </div>
            </div>
         ) : (
            <div className="bg-slate-900 rounded-[5rem] overflow-hidden shadow-[0_50px_150px_rgba(0,0,0,0.5)] border border-white/5 relative h-[650px] flex flex-col items-center justify-center text-white p-20 animate-in zoom-in-95 duration-1000">
               <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />

               {/* Background Pulse */}
               {isLive && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                     <div className="w-[600px] h-[600px] bg-primary-600 rounded-full blur-[150px] animate-pulse" style={{ transform: `scale(${1 + volumeLevel / 100})` }}></div>
                  </div>
               )}

               {/* Main Content */}
               <div className="z-10 text-center space-y-12 relative">
                  <div className="w-56 h-56 bg-slate-800 rounded-[4rem] flex items-center justify-center mx-auto border-8 border-white/5 shadow-2xl relative group transition-transform hover:rotate-6">
                     {isLive ? (
                        <Activity size={80} className="text-primary-400 animate-pulse" />
                     ) : (
                        <Sparkles size={80} className="text-slate-600" />
                     )}
                     {isLive && (
                        <span className="absolute -bottom-6 px-10 py-3 bg-primary-600 text-white text-[12px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] shadow-[0_20px_40px_rgba(37,99,235,0.4)] border-4 border-slate-900">
                           LIVE LINK
                        </span>
                     )}
                  </div>

                  <div className="space-y-6">
                     <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">{isLive ? 'NEURAL SENSING...' : 'Virtual Nurse Core'}</h2>
                     <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.6em] max-w-2xl mx-auto leading-relaxed">
                        {isLive
                           ? "Neural lattice active. Awaiting symptom telemetry or health inquiries."
                           : "Integrate with our AI medical matrix for real-time diagnostic synthesis."}
                     </p>
                  </div>

                  {!isLive ? (
                     <button
                        onClick={startAiSession}
                        disabled={aiStatus === 'Connecting'}
                        className="px-20 py-8 bg-white text-slate-900 rounded-[3rem] font-black uppercase tracking-[0.5em] text-[12px] shadow-2xl hover:scale-105 transition-all flex items-center gap-6 active:scale-95 group/nurse"
                     >
                        {aiStatus === 'Connecting' ? <Loader2 className="animate-spin text-primary-600" size={32} /> : <Mic size={32} className="text-primary-600 group-hover/nurse:scale-125 transition-transform" />}
                        Initialize Neural Session
                     </button>
                  ) : (
                     <div className="flex gap-10">
                        <button
                           onClick={() => {
                              setIsMuted(!isMuted);
                              toast.info(isMuted ? 'Telemetry Transducer Open' : 'Telemetry Transducer Blocked');
                           }}
                           className={`p-10 rounded-[2.5rem] shadow-2xl transition-all border-4 ${isMuted ? 'bg-rose-900 border-rose-500 text-rose-400 shadow-rose-900/40' : 'bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700'}`}
                        >
                           {isMuted ? <MicOff size={40} /> : <Mic size={40} />}
                        </button>
                        <button
                           onClick={endAiSession}
                           className="p-10 bg-rose-600 hover:bg-rose-700 rounded-[2.5rem] text-white shadow-[0_25px_50px_rgba(225,29,72,0.4)] transition-all active:scale-95 border-4 border-rose-500"
                        >
                           <PhoneOff size={40} />
                        </button>
                     </div>
                  )}
               </div>

               {/* Status Overlay */}
               <div className="absolute top-12 right-12">
                  <div className={`flex items-center gap-6 px-10 py-5 rounded-[2rem] bg-black/40 backdrop-blur-2xl border-4 border-white/5 text-[10px] font-black uppercase tracking-[0.5em] shadow-2xl
                   ${aiStatus === 'Connected' ? 'text-emerald-400' : 'text-slate-500'}
                `}>
                     <div className={`w-4 h-4 rounded-full shadow-2xl ${aiStatus === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                     {aiStatus}
                  </div>
               </div>
            </div>
         )}

         {/* Schedule Modal */}
         {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-2xl">
               <div className="bg-white rounded-[4rem] shadow-[0_50px_150px_rgba(0,0,0,0.5)] w-full max-w-2xl p-16 animate-in zoom-in-95 duration-500 relative border border-white/20">
                  <div className="flex justify-between items-center mb-12">
                     <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none flex items-center gap-6">
                        <Video className="text-primary-600" size={40} /> Schedule Vision
                     </h3>
                     <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 text-slate-300 hover:text-slate-900 hover:bg-white rounded-full transition-all shadow-xl"><X size={32} /></button>
                  </div>
                  <form onSubmit={handleCreateSession} className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] ml-10">Select Satellite Unit (Patient)</label>
                        <div className="relative">
                           <User className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-200" size={24} />
                           <select
                              className="w-full pl-20 pr-10 py-8 bg-slate-50 border-4 border-slate-50 rounded-[2.5rem] focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition-all font-black text-slate-900 text-lg uppercase tracking-tight placeholder:text-slate-200 shadow-inner appearance-none"
                              value={newSession.clientId}
                              onChange={e => setNewSession({ ...newSession, clientId: e.target.value })}
                              required
                           >
                              <option value="">Choose Recipient...</option>
                              {clients.map(c => (
                                 <option key={c.id} value={c.id}>{c.name?.toUpperCase()}</option>
                              ))}
                           </select>
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] ml-10">Bridge Objective (Topic)</label>
                        <div className="relative">
                           <Target className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-200" size={24} />
                           <input
                              type="text"
                              className="w-full pl-20 pr-10 py-8 bg-slate-50 border-4 border-slate-50 rounded-[2.5rem] focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition-all font-black text-slate-900 text-lg uppercase tracking-tight placeholder:text-slate-200 shadow-inner"
                              placeholder="E.G. CLINICAL REVIEW ALPHA"
                              value={newSession.topic}
                              onChange={e => setNewSession({ ...newSession, topic: e.target.value })}
                              required
                           />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] ml-10">Epoch Date</label>
                           <input
                              type="date"
                              className="w-full p-8 bg-slate-50 border-4 border-slate-50 rounded-[2.5rem] focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition-all font-black text-slate-900 text-lg uppercase tracking-tight shadow-inner"
                              value={newSession.date}
                              onChange={e => setNewSession({ ...newSession, date: e.target.value })}
                              required
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] ml-10">Cycle Time</label>
                           <input
                              type="time"
                              className="w-full p-8 bg-slate-50 border-4 border-slate-50 rounded-[2.5rem] focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition-all font-black text-slate-900 text-lg uppercase tracking-tight shadow-inner"
                              value={newSession.time}
                              onChange={e => setNewSession({ ...newSession, time: e.target.value })}
                              required
                           />
                        </div>
                     </div>
                     <button className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-[11px] hover:bg-black transition-all shadow-[0_30px_60px_rgba(0,0,0,0.3)] active:scale-95 shadow-primary-900/10 mt-6">
                        Synchronize Session Manifest
                     </button>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default Telehealth;
