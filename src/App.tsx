/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  Terminal as TerminalIcon, 
  Music, 
  MessageSquare, 
  FileText, 
  Maximize2, 
  Minus, 
  X, 
  Wifi, 
  Battery, 
  ChevronDown, 
  LayoutGrid, 
  Power,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Send,
  Disc,
  Minimize2,
  Settings,
  Code,
  Activity,
  Smartphone,
  Monitor,
  Github,    
  Twitch,
  Youtube,
  Gamepad2,
  Globe,
  Volume2,
  VolumeX,
  Briefcase
} from 'lucide-react';

// --- Types ---
interface WindowState {
  id: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  component: React.ReactNode;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  url: string | undefined;
}

// --- Components ---
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
// ИЗОЛИРОВАННЫЕ ЧАСЫ: Спасает от лагов
const TopBarClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <>
      {time.toLocaleString('en-US', { 
        month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
      }).replace(',', '').toUpperCase()}
    </>
  );
};

interface WindowProps {
  win: WindowState;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onMove: (id: string, pos: { x: number; y: number }) => void;
  onResize: (id: string, size: { width: number; height: number }) => void;
  isActive: boolean;
  children: React.ReactNode;
}

const Window: React.FC<WindowProps> = ({ win, onClose, onMinimize, onMaximize, onFocus, onMove, onResize, isActive, children }) => {
  const dragControls = useDragControls();
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const windowRef = useRef<HTMLDivElement>(null); 
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 });

  const handleResizeStart = (direction: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onFocus(win.id);
    setIsResizing(direction);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    resizeStart.current = { 
      x: clientX, 
      y: clientY, 
      w: win.size.width, 
      h: win.size.height,
      px: win.position.x,
      py: win.position.y
    };
    
    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const curX = 'touches' in moveEvent ? (moveEvent as TouchEvent).touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const curY = 'touches' in moveEvent ? (moveEvent as TouchEvent).touches[0].clientY : (moveEvent as MouseEvent).clientY;
      const dx = curX - resizeStart.current.x;
      const dy = curY - resizeStart.current.y;
      
      let newWidth = resizeStart.current.w;
      let newHeight = resizeStart.current.h;
      let newX = resizeStart.current.px;
      let newY = resizeStart.current.py;

      if (direction.includes('e')) newWidth = Math.max(300, resizeStart.current.w + dx);
      if (direction.includes('s')) newHeight = Math.max(200, resizeStart.current.h + dy);
      
      if (direction.includes('w')) {
        const potentialWidth = Math.max(300, resizeStart.current.w - dx);
        if (potentialWidth > 300) {
          newWidth = potentialWidth;
          newX = resizeStart.current.px + dx;
        }
      }
      if (direction.includes('n')) {
        const potentialHeight = Math.max(200, resizeStart.current.h - dy);
        if (potentialHeight > 200) {
          newHeight = potentialHeight;
          newY = resizeStart.current.py + dy;
        }
      }

      onResize(win.id, { width: newWidth, height: newHeight });
      if (newX !== resizeStart.current.px || newY !== resizeStart.current.py) {
        onMove(win.id, { x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchmove', handleMouseUp);
  };

  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const barH = 40;
  const visibleX = 100;

  // Идеальные границы: Окно "ударяется" об них и выплевывается обратно
  const dragConstraints = useMemo(() => ({
    left: -win.size.width + visibleX,
    right: screenW - visibleX,
    top: 32,
    bottom: screenH - 80 - barH
  }), [win.size.width, screenW, screenH, barH]);

  if (!win.isOpen || win.isMinimized) return null;

  return (
    <motion.div 
      ref={windowRef}
      drag={!win.isMaximized && !isResizing}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={true}
      dragElastic={0.2}
      dragConstraints={dragConstraints}
      onDragStart={() => onFocus(win.id)}
      onDragEnd={() => {
        if (windowRef.current) {
          const rect = windowRef.current.getBoundingClientRect();
          onMove(win.id, { x: rect.left, y: rect.top });
        }
      }}
      style={{ top: 0, left: 0, position: 'fixed' }} 
      animate={{ 
        opacity: 1, 
        scale: 1,
        zIndex: win.zIndex,
        width: win.isMaximized ? screenW : win.size.width,
        height: win.isMaximized ? (screenH - 32 - 80) : win.size.height,
        y: win.isMaximized ? 32 : win.position.y,
        x: win.isMaximized ? 0 : win.position.x,
        borderRadius: win.isMaximized ? 0 : 8,
      }}
      transition={isResizing ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300, mass: 0.5 }}
      className={`fixed window-glass flex flex-col shadow-2xl ${isActive ? 'ring-1 ring-white/30 brightness-110' : 'opacity-90'}`}
      onClick={() => onFocus(win.id)}
    >
      {/* Title Bar (Drag Handle) */}
      <div 
        onPointerDown={(e) => {
          if (!win.isMaximized) dragControls.start(e);
        }}
        className="h-10 bg-gradient-to-b from-[#2d2d2d] to-[#1a1a1a] border-b border-white/10 flex justify-between items-center px-4 shrink-0 select-none cursor-move"
      >
        <div className="flex items-center gap-2">
          <span className="opacity-60">{win.icon}</span>
          <span className="font-sans text-[12px] text-primary/80 uppercase tracking-widest font-medium truncate max-w-[200px]">
            {win.title}
          </span>
        </div>
        <div className="flex gap-2" onPointerDown={e => e.stopPropagation()}>
          <button 
            onClick={(e) => { e.stopPropagation(); onMinimize(win.id); }}
            className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <Minus size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onMaximize(win.id); }}
            className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            {win.isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(win.id); }}
            className="w-6 h-6 rounded-full bg-white/5 hover:bg-red-500/80 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden bg-black/40 relative">
        {children}
      </div>

      {/* Resize Handles */}
      {!win.isMaximized && (
        <>
          <div className="absolute top-0 left-0 w-full h-1 cursor-ns-resize" onMouseDown={(e) => handleResizeStart('n', e)} />
          <div className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize" onMouseDown={(e) => handleResizeStart('s', e)} />
          <div className="absolute top-0 left-0 h-full w-1 cursor-ew-resize" onMouseDown={(e) => handleResizeStart('w', e)} />
          <div className="absolute top-0 right-0 h-full w-1 cursor-ew-resize" onMouseDown={(e) => handleResizeStart('e', e)} />
          <div className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize" onMouseDown={(e) => handleResizeStart('nw', e)} />
          <div className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize" onMouseDown={(e) => handleResizeStart('ne', e)} />
          <div className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize" onMouseDown={(e) => handleResizeStart('sw', e)} />
          <div className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize" onMouseDown={(e) => handleResizeStart('se', e)} />
        </>
      )}
    </motion.div>
  );
};

// --- BTOP SYSTEM MONITOR COMPONENT ---
const Btop: React.FC<{ windows: Record<string, WindowState> }> = ({ windows }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1500);
    return () => clearInterval(timer);
  }, []);

  const cpuCores = useMemo(() => Array.from({length: 16}).map(() => Math.floor(Math.random() * 100)), [tick]);
  const cpuUsage = useMemo(() => Math.floor(cpuCores.reduce((a, b) => a + b, 0) / 16), [cpuCores]);
  const memUsage = useMemo(() => Math.floor(Math.random() * 10 + 40), [tick]);

  const processes = useMemo(() => {
    const sysProcs = [
      { pid: 1, name: 'systemd', cpu: (Math.random() * 0.5).toFixed(1), mem: '0.2', user: 'root' },
      { pid: 433, name: 'xorg', cpu: (Math.random() * 5).toFixed(1), mem: '1.2', user: 'root' },
      { pid: 892, name: 'gnome-shell', cpu: (Math.random() * 8).toFixed(1), mem: '3.1', user: 'angerr' },
      { pid: 1024, name: 'dbus-daemon', cpu: '0.0', mem: '0.1', user: 'angerr' },
      { pid: 1205, name: 'pulseaudio', cpu: '0.5', mem: '0.4', user: 'angerr' },
    ];
    
    const winProcs = Object.values(windows).filter(w => w.isOpen).map((w, i) => {
      let name = w.id;
      if (name === 'terminal') name = '/bin/zsh';
      if (name === 'music') name = 'cmus-player';
      if (name === 'code') name = 'code --type=renderer';
      if (name === 'chat') name = 'ssh neural_net@link';
      if (name === 'notepad') name = 'nvim Brain_Dump.txt';
      if (name === 'cava') name = 'cava';
      if (name === 'btop') name = 'btop';
      if (name === 'social') name = 'firefox --app=links';

      return {
        pid: 2000 + i * 17,
        name,
        cpu: (Math.random() * 15 + 2).toFixed(1),
        mem: (Math.random() * 5 + 0.5).toFixed(1),
        user: 'angerr'
      };
    });

    return [...winProcs, ...sysProcs].sort((a, b) => parseFloat(b.cpu) - parseFloat(a.cpu));
  }, [windows, tick]);

  const drawBar = (percent: number, color: string) => (
    <div className="w-full bg-white/10 h-1.5 rounded overflow-hidden flex">
      <div className={`h-full ${color} transition-all duration-500 ease-out`} style={{ width: `${percent}%` }} />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#0d0d12] text-green-500 font-mono text-[10px] p-3 gap-3 overflow-hidden rounded-b-lg">
      <div className="flex justify-between items-center text-white/50 uppercase tracking-widest text-[9px]">
        <span>btop++ v1.2.13</span>
        <span>angerr@neural_architect</span>
      </div>

      <div className="border border-green-500/30 rounded p-2 flex flex-col gap-1 relative mt-1">
        <span className="absolute -top-2 left-2 bg-[#0d0d12] px-1 text-green-400 font-bold">CPU</span>
        <div className="flex justify-between text-white/80">
          <span>AMD Ryzen 9 7950X</span>
          <span>{cpuUsage}%</span>
        </div>
        {drawBar(cpuUsage, 'bg-green-500')}
        <div className="grid grid-cols-4 gap-x-2 gap-y-1 mt-2 opacity-80">
          {cpuCores.map((core, i) => (
            <div key={i} className="flex items-center gap-1 text-[8px]">
              <span className="w-3 text-green-600/70 text-right">{i}</span>
              {drawBar(core, 'bg-green-400')}
            </div>
          ))}
        </div>
      </div>

      <div className="border border-blue-500/30 rounded p-2 flex flex-col gap-1 relative mt-2">
        <span className="absolute -top-2 left-2 bg-[#0d0d12] px-1 text-blue-400 font-bold">MEM</span>
        <div className="flex justify-between text-white/80">
          <span>Total: 64.0 GiB</span>
          <span>Used: {(memUsage / 100 * 64).toFixed(1)} GiB ({memUsage}%)</span>
        </div>
        {drawBar(memUsage, 'bg-blue-500')}
      </div>

      <div className="border border-red-500/30 rounded p-2 flex-1 flex flex-col relative mt-2 overflow-hidden">
        <span className="absolute -top-2 left-2 bg-[#0d0d12] px-1 text-red-400 font-bold">PROCESSES</span>
        <div className="flex text-white/50 border-b border-white/10 pb-1 mb-1 font-bold">
          <span className="w-10">PID</span>
          <span className="w-14">USER</span>
          <span className="w-10 text-right">CPU%</span>
          <span className="w-10 text-right">MEM%</span>
          <span className="flex-1 ml-3 truncate">COMMAND</span>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
          {processes.map(p => (
            <div key={p.pid} className="flex hover:bg-white/10 cursor-pointer py-[1px]">
              <span className="w-10 text-gray-500">{p.pid}</span>
              <span className="w-14 text-gray-400 truncate">{p.user}</span>
              <span className="w-10 text-right text-green-400">{p.cpu}</span>
              <span className="w-10 text-right text-blue-400">{p.mem}</span>
              <span className="flex-1 ml-3 text-white truncate">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Guestbook (Отзывы) ---
const Guestbook: React.FC = () => {
  const [comments, setComments] = useState<{ id: number; author: string; text: string; created_at: string }[]>([]);
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/comments');
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error('Failed loading comments', e);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: author.trim(), text: text.trim() })
      });
      if (res.ok) {
        const created = await res.json();
        setComments(prev => [created, ...prev].slice(0, 50));
        setAuthor('');
        setText('');
      } else {
        console.error('Failed to post comment', await res.text());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col gap-3 text-white">
      <div className="text-left">
        <h3 className="text-lg font-bold text-primary">Отзывы</h3>
        <p className="text-sm text-on-surface-variant">Оставьте честный отзыв. Имя обязательно.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          placeholder="Ваше имя..."
          value={author}
          onChange={e => setAuthor(e.target.value)}
          className="bg-black/30 border border-white/5 px-3 py-2 rounded text-white placeholder-white/40"
        />
        <textarea
          placeholder="Ваш отзыв..."
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          className="bg-black/30 border border-white/5 px-3 py-2 rounded text-white placeholder-white/40 resize-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !author.trim() || !text.trim()}
            className="px-4 py-2 rounded bg-primary text-black font-bold disabled:opacity-50"
          >
            {submitting ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </form>

      <div className="overflow-y-auto mt-2 flex-1 custom-scrollbar">
        {comments.length === 0 ? (
          <div className="text-center text-primary/40 mt-6">Пока нет отзывов.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {comments.map(c => (
              <div key={c.id} className="p-3 bg-white/3 rounded border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-primary font-bold">{c.author}</div>
                  <div className="text-[11px] text-white/50">{new Date(c.created_at).toLocaleString()}</div>
                </div>
                <div className="text-white/90 whitespace-pre-wrap">{c.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Terminal: React.FC = () => {
  const [history, setHistory] = useState<string[]>(['Initializing NEURAL_ARCHITECT kernel...', 'Establishing secure link...']);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHistory(prev => [
        ...prev,
        'user@portfolio:~$ neofetch',
        'angerr@neural_architect',
        '---------------------',
        'OS: NeuralArchitect OS v2.0',
        'KERNEL: 6.12.0-ghost-edge',
        'UPTIME: 13 minutes',
        'PACKAGES: 1337 (pkg)',
        'SHELL: zsh 5.9',
        'RESOLUTION: 1920x1080',
        'DE: GNOME (Terminal Edition)',
        'CPU: Neural Engine v4',
        'MEMORY: 64GB',
        '',
        'Welcome to NEURAL_ARCHITECT Terminal.',
        'Type "help" to list available protocols.',
        ''
      ]);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      const cmd = input.toLowerCase().trim();
      let response = '';

      switch(cmd) {
        case 'help': response = 'AVAILABLE: HELP, CLEAR, ABOUT, STATUS, WHOAMI, LS, NEOFETCH, CAVA'; break;
        case 'about': response = 'NEURAL ARCHITECT: A sequence of code, dreams, and digital echoes.'; break;
        case 'status': response = 'SYSTEM: [NOMINAL] | UPTIME: 324h | LATENCY: 2ms'; break;
        case 'whoami': response = 'AUTHORIZED_USER: angerr_issuess | SKILLS: [FRONTEND, BACKEND, AI_INTEGRATION]'; break;
        case 'ls': response = 'about_me.txt  projects.db  brain_dump.txt  secrets.gpg'; break;
        case 'neofetch':
          setHistory(prev => [
            ...prev,
            'user@portfolio:~$ neofetch',
            'angerr@neural_architect',
            '---------------------',
            'OS: NeuralArchitect OS v2.0',
            'KERNEL: 6.12.0-ghost-edge',
            'CPU: amd ryzen 9 7950x',
            ''
          ]);
          setInput('');
          return;
        case 'cava': response = 'CAVA_CORE_INITIALIZED. Spectrogram window updated.'; break;
        case 'clear': setHistory(['']); setInput(''); return;
        default: response = `ERR: Command "${cmd}" not found in current namespace.`;
      }

      setHistory(prev => [...prev, `user@portfolio:~$ ${input}`, response, '']);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] p-4 font-mono text-[14px] relative">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {history.map((line, i) => (
          <div key={i} className={line.startsWith('user@') ? 'text-primary' : 'text-on-surface-variant'}>
            {line}
          </div>
        ))}
        <div className="flex items-center">
          <span className="text-primary font-bold mr-2 whitespace-nowrap">user@portfolio:~$</span>
          <input 
            autoFocus
            className="bg-transparent border-none outline-none p-0 flex-1 text-primary"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleCommand}
          />
          <span className="w-2 h-4 bg-primary cursor-blink ml-1"></span>
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

// --- CODE EDITOR COMPONENT ---
const CodeEditor: React.FC = () => {
  const fullCode = `// SYSTEM INITIALIZATION: NEURAL CORE
import { NeuralNet } from '@core/brain';
import { MemoryMatrix } from '@core/memory';

export class Architect {
  private brain: NeuralNet;
  private memory: MemoryMatrix;

  constructor() {
    this.brain = new NeuralNet({
      layers: [1024, 512, 256, 128],
      activation: 'relu',
      learningRate: 0.001
    });
    this.memory = new MemoryMatrix();
  }

  async bootstrap() {
    console.log("Waking up neural pathways...");
    await this.memory.load('core_memories.bin');
    this.brain.connect(this.memory);
    
    console.log("System stable. Awaiting input.");
    while (true) {
      const thought = await this.brain.process();
      if (thought.isLucid) {
        this.execute(thought);
      }
    }
  }

  private execute(thought: any) {
    // Architecture is the silent conversation 
    // between the user and the system...
    return thought.compile();
  }
}

const system = new Architect();
system.bootstrap().catch(err => console.error(err));`;

  const [displayedCode, setDisplayedCode] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedCode(fullCode.slice(0, i));
      i += 3;
      
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }

      if (i > fullCode.length + 5) {
        clearInterval(interval);
        setIsTyping(false);
        setDisplayedCode(fullCode);
      }
    }, 20);
    return () => clearInterval(interval);
  }, []);

  const highlightCode = (code: string) => {
    let safeCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Use placeholers to avoid nested replacement issues
    const tokens: string[] = [];
    let tokenIndex = 0;
    const saveToken = (html: string) => {
      const id = `__TOKEN_${tokenIndex++}__`;
      tokens.push(html);
      return id;
    };

    safeCode = safeCode.replace(/(\/\/.*)$/gm, (m) => saveToken(`<span class="text-[#6a9955]">${m}</span>`));
    safeCode = safeCode.replace(/('.*?'|".*?")/g, (m) => saveToken(`<span class="text-[#ce9178]">${m}</span>`));
    safeCode = safeCode.replace(/\b(const|let|var|function|async|await|while|if|true|false|new|import|from|return|catch|class|export|private)\b/g, (m) => saveToken(`<span class="text-[#569cd6]">${m}</span>`));
    safeCode = safeCode.replace(/\b(\d+(\.\d+)?)\b/g, (m) => saveToken(`<span class="text-[#b5cea8]">${m}</span>`));
    safeCode = safeCode.replace(/\b([a-zA-Z0-9_]+)(?=\()/g, (m) => saveToken(`<span class="text-[#dcdcaa]">${m}</span>`));

    // Restore tokens
    tokens.forEach((tokenHtml, index) => {
      safeCode = safeCode.replace(`__TOKEN_${index}__`, tokenHtml);
    });
    
    return safeCode;
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[13px] relative overflow-hidden">
      <div className="flex bg-[#2d2d2d] text-xs select-none">
        <div className="bg-[#1e1e1e] px-4 py-2 border-t border-blue-500 text-white flex items-center gap-2">
          <span className="text-[#519aba]">TS</span> neural_core.ts
          {isTyping && <span className="w-2 h-2 rounded-full bg-white/20 ml-2"></span>}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 custom-scrollbar" ref={scrollContainerRef}>
        <pre className="m-0 font-mono leading-relaxed whitespace-pre-wrap break-all flex flex-col">
          {displayedCode.split('\n').map((line, idx, arr) => (
            <div key={idx} className="flex">
              <div className="w-8 shrink-0 text-right pr-2 mr-2 text-[#858585] border-r border-[#404040] opacity-50 select-none">
                {idx + 1}
              </div>
              <code dangerouslySetInnerHTML={{
                __html: highlightCode(line) + (isTyping && idx === arr.length - 1 ? '<span class="animate-pulse bg-[#d4d4d4] w-2 h-4 inline-block align-middle ml-0.5"></span>' : '')
              }} />
            </div>
          ))}
        </pre>
      </div>

      <div className="bg-[#007acc] text-white text-[10px] px-3 py-1 flex justify-between select-none">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><X size={10} /> 0</span>
          <span className="flex items-center gap-1">master*</span>
        </div>
        <div className="flex gap-4">
          <span>Ln {displayedCode.split('\n').length}, Col {displayedCode.length % 50}</span>
          <span>UTF-8</span>
          <span>TypeScript React</span>
        </div>
      </div>
    </div>
  );
};

// --- SOCIAL LINKS COMPONENT ---
const SocialLinks: React.FC = () => {
  const links = [
    { name: 'GitHub', icon: <Github size={18} />, url: 'https://github.com/angerrissuess', color: 'hover:text-white hover:bg-white/10 text-white/70' },
    { name: 'Telegram', icon: <Send size={18} />, url: 'https://t.me/angerr_issuess', color: 'hover:text-[#0088cc] hover:bg-[#0088cc]/10 text-white/70' },
    { name: 'Twitch', icon: <Twitch size={18} />, url: 'https://www.twitch.tv/angerr_issues', color: 'hover:text-[#9146FF] hover:bg-[#9146FF]/10 text-white/70' },
    { name: 'YouTube', icon: <Youtube size={18} />, url: 'https://youtube.com/', color: 'hover:text-[#FF0000] hover:bg-[#FF0000]/10 text-white/70' },
    { name: 'Steam', icon: <Gamepad2 size={18} />, url: 'https://steamcommunity.com/profiles/76561199195996931/', color: 'hover:text-[#66c0f4] hover:bg-[#66c0f4]/10 text-white/70' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] p-5 gap-3 overflow-y-auto custom-scrollbar">
      <div className="text-primary/50 font-mono text-[10px] uppercase tracking-widest mb-1 flex items-center gap-2">
        <Globe size={12}/> // External Connections
      </div>
      {links.map(link => (
        <a 
          key={link.name} 
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 transition-all duration-300 group ${link.color}`}
        >
          <div className="transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300">
            {link.icon}
          </div>
          <span className="font-mono text-sm tracking-wide group-hover:font-bold transition-all">{link.name}</span>
        </a>
      ))}
    </div>
  );
};

// ОПТИМИЗАЦИЯ: GPU-Рендеринг визуализатора
const MusicVisualizer: React.FC<{ isPlaying: boolean; bars?: number; className?: string }> = React.memo(({ isPlaying, bars = 24, className = "" }) => {
  const durations = useMemo(() => Array.from({ length: bars }).map(() => 0.8 + Math.random() * 0.4), [bars]);

  return (
    <div className={`flex items-end justify-between gap-1 h-full w-full px-2 opacity-50 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0.1 }}
          animate={isPlaying ? { scaleY: [0.1, 0.8, 0.3, 0.9, 0.1] } : { scaleY: 0.1 }}
          transition={isPlaying ? { duration: durations[i], repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
          style={{ height: "100%", transformOrigin: "bottom" }}
          className="flex-1 bg-primary/40 rounded-t-sm"
        />
      ))}
    </div>
  );
});
MusicVisualizer.displayName = "MusicVisualizer";

const MusicPlayer: React.FC<{ songs: Song[]; isPlaying: boolean; setIsPlaying: (val: boolean) => void }> = ({ songs, isPlaying, setIsPlaying }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const currentSong = songs.length > 0 ? songs[currentIdx] : { title: 'Neural Drift', artist: 'LO-FI TERMINAL BITS', url: undefined };

  useEffect(() => {
    if (audioRef.current && currentSong.url) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentIdx, currentSong.url, setIsPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const next = () => {
    if (shuffle) {
      setCurrentIdx(Math.floor(Math.random() * (songs.length || 1)));
    } else {
      setCurrentIdx(prev => (prev + 1) % (songs.length || 1));
    }
    setProgress(0);
  };

  const prev = () => {
    setCurrentIdx(prev => (prev - 1 + (songs.length || 1)) % (songs.length || 1));
    setProgress(0);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      const cur = audioRef.current.currentTime;
      if (dur > 0 && Number.isFinite(dur)) {
        const p = (cur / dur) * 100;
        setProgress(Number.isFinite(p) ? p : 0);
      }
    }
  };

  const handleEnded = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (repeatMode === 'all' || (currentIdx < songs.length - 1)) {
      next();
    } else {
      setIsPlaying(false);
    }
  };
const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || !audioRef.current.duration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    let clientX: number;

    // Проверяем, это тач или мышка
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }

    const x = clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, x / width));
    
    // Устанавливаем время
    const newTime = percentage * audioRef.current.duration;
    if (!isNaN(newTime)) {
      audioRef.current.currentTime = newTime;
    }
  };

  const toggleRepeat = () => {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'all', 'one'];
    setRepeatMode(modes[(modes.indexOf(repeatMode) + 1) % modes.length]);
  };

  return (
    <div className="p-6 h-full flex flex-col justify-between bg-[#0a0a0a]">
      {currentSong.url && (
        <audio 
          ref={audioRef} 
          src={currentSong.url} 
          onTimeUpdate={handleTimeUpdate} 
          onEnded={handleEnded}
        />
      )}
      
      <div className="flex gap-4 items-center">
        <div className={`w-20 h-20 bg-white/5 border border-white/10 rounded-md flex items-center justify-center relative overflow-hidden group ${isPlaying ? 'animate-pulse' : ''}`}>
          <Disc className={`text-primary/20 w-12 h-12 ${isPlaying ? 'animate-spin-slow' : ''}`} />
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={togglePlay}>
            {isPlaying ? <Pause size={24} className="text-primary fill-primary" /> : <Play size={24} className="text-primary fill-primary" />}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-primary font-bold text-lg leading-tight truncate">{currentSong.title}</div>
          <div className="text-on-surface-variant text-sm mt-1">{currentSong.artist}</div>
        </div>
      </div>

      <MusicVisualizer isPlaying={isPlaying} />
      
 <div className="space-y-3">
        {/* Контейнер прогресс-бара */}
        <div 
          ref={progressBarRef}
          onClick={handleSeek} // Используем onClick для мобилок он работает стабильнее
          className="relative h-6 flex items-center cursor-pointer group/seek touch-none" 
        >
          {/* Фоновая подложка (серая линия) */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative pointer-events-none">
            {/* Активная линия прогресса */}
            <motion.div 
              animate={{ scaleX: Number.isFinite(progress) ? progress / 100 : 0 }}
              style={{ transformOrigin: "left" }}
              className="absolute top-0 left-0 h-full w-full bg-primary shadow-[0_0_8px_white]"
            />
          </div>

          {/* Область наведения (невидимая, но широкая для клика) */}
          <div className="absolute inset-0 bg-transparent rounded-full transition-colors group-hover/seek:bg-white/5" />
        </div>

        {/* Тайм-коды */}
        <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
          <span>{audioRef.current && Number.isFinite(audioRef.current.currentTime) ? Math.floor(audioRef.current.currentTime / 60) + ':' + String(Math.floor(audioRef.current.currentTime % 60)).padStart(2, '0') : '0:00'}</span>
          <span>{audioRef.current && Number.isFinite(audioRef.current.duration) ? Math.floor(audioRef.current.duration / 60) + ':' + String(Math.floor(audioRef.current.duration % 60)).padStart(2, '0') : '0:00'}</span>
        </div>
      </div>

      <div className="flex justify-center items-center gap-6">
        <Shuffle 
          size={16} 
          className={`cursor-pointer transition-colors ${shuffle ? 'text-primary' : 'text-on-surface-variant'}`} 
          onClick={() => setShuffle(!shuffle)}
        />
        <SkipBack size={24} className="cursor-pointer hover:text-primary transition-colors" onClick={prev} />
        <div 
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-primary text-background flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.2)]"
        >
          {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-1" />}
        </div>
        <SkipForward size={24} className="cursor-pointer hover:text-primary transition-colors" onClick={next} />
        <div className="relative" onClick={toggleRepeat}>
          <Repeat 
            size={16} 
            className={`cursor-pointer transition-colors ${repeatMode !== 'none' ? 'text-primary' : 'text-on-surface-variant'}`} 
          />
          {repeatMode === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 pb-2">
        {volume === 0 ? <VolumeX size={14} className="text-on-surface-variant" /> : <Volume2 size={14} className="text-on-surface-variant" />}
        <input
          type="range"
          min="0" max="1" step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    </div>
  );
};

const Notepad: React.FC = () => {
  const [text, setText] = useState(`// PRIORITY PROJECTS
- [tg bot @tokkipugpt_bot] neuro project
- [website https://preanalitiksayt.onrender.com/] med project
- [tg @angerr_issuess] telegramm channel

// PERSISTENT THOUGHTS
Architecture is the silent conversation between the user and the system...`);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <textarea 
        className="flex-1 w-full bg-transparent border-none p-4 font-mono text-on-surface-variant focus:ring-0 resize-none custom-scrollbar placeholder:opacity-30 text-sm outline-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type notes here..."
      />
      <div className="h-6 border-t border-white/5 px-3 flex items-center justify-between text-[10px] text-on-surface-variant bg-black/20 font-mono">
        <span>UTF-8</span>
        <span>Line {text.split('\n').length}, Col {text.length}</span>
      </div>
    </div>
  );
};

const NetworkChat: React.FC = () => {
  const [messages, setMessages] = useState<{ id: number; user: string; time: string; text: string; isMe: boolean; isAI?: boolean }[]>([
    { id: 1, user: 'SYSTEM', time: '10:24:12', text: 'Secure neural link established. OpenRouter core online.', isMe: false, isAI: true },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Use server-side proxy health check instead of checking Vite env from browser
  const [proxyOk, setProxyOk] = useState<boolean | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState({
    systemInstruction: "Ты — дружелюбный, живой и эрудированный собеседник. Общайся естественно, как человек, избегая сложной и сухой терминологии, если о ней прямо не просят. Давай развернутые, интересные и полезные ответы. ВАЖНО: интерфейс чата не поддерживает форматирование, поэтому КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать markdown-символы (звездочки, решетки, обратные кавычки и т.д.). Пиши только чистым текстом.",
    temperature: 0.9, 
    topP: 0.95
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/openrouter/health');
        if (!cancelled) setProxyOk(res.ok);
      } catch (e) {
        if (!cancelled) setProxyOk(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

const send = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = input.trim();
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });

    // 1. Добавляем ТОЛЬКО твое сообщение
    setMessages(prev => [
      ...prev, 
      { id: Date.now(), user: 'AUTHORIZED_USER', time: timeStr, text: userMsg, isMe: true }
    ]);
    
    setInput('');
    setIsTyping(true);

    if (proxyOk === false) {
      setMessages(prev => [...prev, { id: Date.now() + 1, user: 'SYSTEM', time: timeStr, text: 'ERR: Server proxy for OpenRouter unavailable or API key missing.', isMe: false, isAI: false }]);
      setIsTyping(false);
      return;
    }

    try {
      const response = await fetch("/api/openrouter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`HTTP error! status: ${response.status} ${text}`);
      }

      const data: any = await response.json().catch(() => null);
      let reply = '';
      if (data) {
        const anyData: any = data;
        // Пробуем достать ответ безопасно
        reply = anyData?.choices?.[0]?.message?.content ?? anyData?.choices?.[0]?.message ?? anyData?.choices?.[0]?.text ?? '';
        if (typeof reply === 'object' && reply !== null) {
          reply = ((reply as any).content ?? JSON.stringify(reply)).toString();
        }
      }

      const cleaned = (reply || '').toString().replace(/[*#`~]/g, '');
      const aiTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
      
      // 2. Добавляем ответ ИИ только когда он полностью готов
      setMessages(prev => [...prev, { id: Date.now(), user: 'AI_CORE', time: aiTimeStr, text: cleaned, isMe: false, isAI: true }]);
    } catch (error) { 
      let errorMsg = 'Unknown error occurred';
      if (error instanceof Error) errorMsg = error.message;
      else if (typeof error === 'string') errorMsg = error;
      
      const errTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
      setMessages(prev => [...prev, { id: Date.now(), user: 'SYSTEM', time: errTimeStr, text: `FAIL: NEURAL_LINK_DISRUPTED [${errorMsg}]`, isMe: false, isAI: false }]);
    } finally { 
      setIsTyping(false); 
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] relative">
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 z-20 bg-black/90 p-4 border-b border-white/10 font-mono text-[11px] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
              <span className="text-primary font-bold">AI_CORE_CONFIGURATION</span>
              <X className="cursor-pointer hover:text-red-400" size={14} onClick={() => setShowSettings(false)} />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-primary/60 mb-1 tracking-widest">SYSTEM_INSTRUCTION</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded p-2 focus:border-primary/50 outline-none h-24"
                  value={config.systemInstruction}
                  onChange={e => setConfig({...config, systemInstruction: e.target.value})}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-primary/60 mb-1 tracking-widest">TEMPERATURE ({config.temperature})</label>
                  <input 
                    type="range" min="0" max="2" step="0.1" 
                    className="w-full"
                    value={config.temperature}
                    onChange={e => setConfig({...config, temperature: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-primary/60 mb-1 tracking-widest">TOP_P ({config.topP})</label>
                  <input 
                    type="range" min="0" max="1" step="0.05" 
                    className="w-full"
                    value={config.topP}
                    onChange={e => setConfig({...config, topP: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col gap-1 ${m.isMe ? 'items-end' : ''}`}>
            <span className={`text-[10px] font-bold flex items-center gap-2 ${m.isAI ? 'text-blue-400' : 'text-primary'}`}>
              {!m.isMe && <span className={`w-1.5 h-1.5 rounded-full ${m.isAI ? 'bg-blue-500 animate-pulse' : 'bg-primary'}`} />} {m.user} [{m.time}]
            </span>
            <div className={`p-3 rounded-xl max-w-[85%] text-sm ${m.isMe ? 'bg-primary/10 border border-primary/20 text-primary' : 'bg-white/5 border border-white/10 text-on-surface-variant'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex flex-col gap-1">
            <span className="text-blue-400 font-bold text-[10px] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> AI_CORE [THINKING...]
            </span>
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl w-16 flex justify-center">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t border-white/5 flex items-center gap-3">
        <Settings 
          className="text-on-surface-variant cursor-pointer hover:text-primary transition-colors" 
          size={18} 
          onClick={() => setShowSettings(true)}
        />
        <input 
          className={`flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-colors text-white ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder={proxyOk !== true ? "AI module offline. OpenRouter key required." : (isTyping ? "AI is processing..." : "Initialize prompt...")}
          value={input}
          disabled={isTyping || proxyOk !== true}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          type="text"
        />
        <Send 
          className={`text-primary cursor-pointer hover:scale-110 transition-transform ${isTyping || proxyOk !== true ? 'opacity-30 cursor-not-allowed' : ''}`} 
          size={18} 
          onClick={send}
        />
      </div>
    </div>
  );
};

const ProjectsPortfolio: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      containerRef.current.scrollBy({ left: direction === 'right' ? width : -width, behavior: 'smooth' });
    }
  };

  const projects = [
    {
      id: 1,
      title: "82 Agency",
      type: "Platform & Bots Ecosystem",
      description: "Многофункциональная платформа для рекламного агентства 82agency.net, специализирующегося на работе с блогерами и рекламодателями. Это не просто сайт, а целая экосистема: помимо современного веб-интерфейса, разработана мощная панель управления (админка) на базе Telegram-бота для быстрого редактирования базы блогеров и контента сайта. Также внедрена продвинутая система ботов-уведомлений, которая моментально оповещает менеджеров о новых заявках, изменениях статусов и важных событиях.",
      features: [
        "Полноценный веб-сайт с отзывчивым и современным UX/UI",
        "Telegram-бот админка для управления базой блогеров со смартфона",
        "Система моментальных уведомлений для менеджеров о заявках и лидах",
        "Надежная архитектура, объединяющая Frontend и Telegram API"
      ],
      link: "https://82agency.net/"
    },
    {
      id: 2,
      title: "Менеджер-Ассистент",
      type: "AI Telegram Userbot",
      description: "Умный ИИ-ассистент, созданный для автоматизации рутины менеджеров по продажам. Скрипт работает в формате userbot (подключается прямо к аккаунту менеджера), анализирует входящие сообщения, понимает контекст диалога и берет на себя часть общения с клиентами. Бот спроектирован так, чтобы скрытно и эффективно вести диалог, освобождая время сотрудника от типовых ответов и сбора первичной информации.",
      features: [
        "Работа в режиме userbot (неотличим от реального человека)",
        "Анализ контекста и генерация ответов на базе передовых LLM",
        "Интеграция RAG (поиск по базе знаний) для точных ответов по услугам",
        "Автоматизация рутины и защита клиентских данных"
      ],
      link: null
    },
    {
      id: 3,
      title: "TokkipuGPT",
      type: "Medical & Lifestyle AI Assistant",
      description: "Многофункциональная нейросеть-помощник в Telegram. Бот выступает в роли умного медицинского и лайфстайл ассистента: он может выслушать симптомы, проанализировать фотографию (например, распознать кожное заболевание по фото) и дать рекомендации со строгим соблюдением врачебной этики. Помимо медицины, бот умеет генерировать изображения по запросу, ставить напоминания о приеме лекарств или делах, а также советовать музыку под ваше настроение.",
      features: [
        "Анализ изображений (распознавание болезней по фото)",
        "Генерация картинок и музыкальные рекомендации по настроению",
        "Система умных напоминаний",
        "Строгий медицинский tone of voice и удержание контекста диалога"
      ],
      link: "https://t.me/tokkipugpt_bot"
    },
    {
      id: 4,
      title: "WELKE Smart Home",
      type: ".NET MAUI Mobile App",
      description: "Мобильное приложение для управления системами умного дома и автоматизацией зданий (Smart Home / Smart Ward). Проект включает в себя кроссплатформенное мобильное приложение, написанное на C# и XAML (фреймворк .NET MAUI), а также выделенную библиотеку утилит для криптографии, работы с сетью и файлами. Приложение выступает как единый пульт управления инфраструктурой с возможностью подключения к удаленным серверам.",
      features: [
        "Кроссплатформенная мобильная разработка на стеке .NET MAUI",
        "Управление помещениями (Facilities), запуск скриптов и сценариев автоматизации",
        "Просмотр истории событий, мониторинг состояния и интерактивные карты",
        "Модульная архитектура с вынесением общей логики (Utilities)"
      ],
      link: null
    },
    {
      id: 5,
      title: "NEURAL_ARCHITECT",
      type: "Web OS / Desktop Environment",
      description: "Высокопроизводительная виртуальная среда \"рабочего стола\" прямо в браузере. Разработана на стеке React + Express + TypeScript. Проект представляет собой монохромный терминальный интерфейс, интегрированный с Gemini API.",
      features: [
        "Встроенный эмулятор терминала, редактор кода и музыкальный плеер",
        "Интеграция с искусственным интеллектом (Gemini API)",
        "Продвинутая защита (Helmet.js, Rate Limiting, защита API-ключей)",
        "Полностью готов к production-развертыванию на платформе Render"
      ],
      link: null
    },
    {
      id: 6,
      title: "Hospital Management System",
      type: "WPF Desktop Application",
      description: "Комплексная десктопная система управления больницей (HMS), разработанная на C# (WPF) с использованием локальной базы данных SQLite.",
      features: [
        "Управление профилями пациентов, расписанием приемов и персоналом",
        "Инвентаризация медикаментов и автоматизация процессов биллинга",
        "Генерация подробных отчетов и аналитики",
        "Использование Entity Framework, LINQ и компонентов DevExpress"
      ],
      link: null
    },
    {
      id: 7,
      title: "LeadParser",
      type: "Python GUI App",
      description: "Десктопное приложение для автоматизированного парсинга контактов (лидов) и сбора данных с веб-ресурсов. Оснащено графическим интерфейсом и работает с локальной БД SQLite.",
      features: [
        "Графический интерфейс для удобного управления процессом скрапинга",
        "Продвинутое использование регулярных выражений и CSS-селекторов",
        "Локальная база данных (SQLite) для безопасного хранения собранных лидов",
        "Наличие автоматизированных тестов (unit-тестирование)"
      ],
      link: null
    },
    {
      id: 8,
      title: "Travel Guide",
      type: "Android Native App",
      description: "Нативное мобильное приложение для путешественников, разработанное под ОС Android с использованием языка Kotlin/Java и базы данных PostgreSQL на бэкенде.",
      features: [
        "Нативная разработка под Android (Gradle)",
        "Интеграция с реляционной базой данных PostgreSQL",
        "Удобный пользовательский интерфейс для поиска туристических маршрутов",
        "Надежная архитектура приложения"
      ],
      link: null
    },
    {
      id: 9,
      title: "Happy Pet Hotel",
      type: "C# .NET Solution",
      description: "Система для управления отелем для животных. Классический пример надежной CRUD-системы для бизнеса.",
      features: [
        "Бэкенд на современном стеке C# .NET",
        "Архитектура, готовая к масштабированию",
        "Учет постояльцев отеля (животных) и свободных мест",
        "Быстрая обработка запросов"
      ],
      link: null
    },
    {
      id: 10,
      title: "AI Document Generator",
      type: "Python / Flask / AI",
      description: "Мощный инструмент для автоматической генерации структурированных Word-документов (курсовых, дипломных работ) по стандартам ГОСТ. Бэкенд написан на Python/Flask и взаимодействует с нейросетевыми API.",
      features: [
        "Сложный промпт-инжиниринг: умное поддержание контекста длинных текстов",
        "Строгий контроль объема (страниц/символов) и валидация структуры",
        "Извлечение требований к оформлению из загруженных файлов-шаблонов",
        "Генерация готовых файлов .docx (библиотека python-docx)"
      ],
      link: null
    },
    {
      id: 11,
      title: "Sanatorium Management System",
      type: "Full-stack Web App",
      description: "Полноценная веб-система для управления санаториями и отелями. Включает серверную часть (Node.js/Express) и современный фронтенд (React/Vite).",
      features: [
        "База данных SQLite для хранения информации о бронированиях и клиентах",
        "Разработка с полным циклом на TypeScript",
        "Строгое следование техническому заданию (ТЗ) при реализации",
        "Современный UI/UX и быстрая загрузка интерфейсов"
      ],
      link: null
    },
    {
      id: 12,
      title: "AI Porter Dashboard",
      type: "Web Dashboard / API",
      description: "Веб-панель управления и API-интерфейс для экосистемы Telegram-ботов с ИИ. Разработана на TypeScript с использованием современных ORM.",
      features: [
        "Современная работа с базой данных через Prisma ORM",
        "Надежный API на Node.js для взаимодействия с ботами",
        "Удобный интерфейс для администрирования бота и отслеживания статистики",
        "Архитектура, оптимизированная под высокие нагрузки"
      ],
      link: null
    }
  ];

  return (
    <div ref={containerRef} className="flex w-full h-full bg-[#0a0a0a] text-white overflow-x-auto snap-x snap-mandatory custom-scrollbar relative">
      {projects.map((p, i) => (
        <div key={p.id} className="min-w-full w-full h-full snap-start snap-always p-6 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-primary tracking-tighter">{p.title}</h2>
              <span className="text-[10px] font-mono tracking-widest text-on-surface-variant uppercase">{p.type}</span>
            </div>
            <div className="text-primary/20 text-4xl font-black italic select-none">0{i + 1}</div>
          </div>
          
          <div className="flex-1">
            <p className="text-sm text-white/80 leading-relaxed mb-6 font-sans">
              {p.description}
            </p>
            
            <h3 className="text-[11px] font-mono text-primary tracking-widest mb-3 uppercase">Ключевые особенности:</h3>
            <ul className="space-y-2 mb-6">
              {p.features.map((f, j) => (
                <li key={j} className="text-sm text-white/70 flex gap-2">
                  <span className="text-primary mt-1">▹</span> {f}
                </li>
              ))}
            </ul>

            {p.link && (
              <a href={p.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded text-primary text-sm hover:bg-primary hover:text-black transition-colors font-bold tracking-wide">
                View Project <Globe size={14} />
              </a>
            )}
          </div>
          
          <div className="mt-8 pt-4 border-t border-white/5 flex justify-center items-center text-[10px] text-white/50 font-mono gap-4 uppercase select-none">
            <button onClick={() => scroll('left')} className="hover:text-primary transition-colors hover:bg-white/10 px-3 py-1.5 rounded bg-white/5 disabled:opacity-30" disabled={i === 0}>← PREV</button>
            <span className="text-white/30">SCROLL TO EXPLORE</span>
            <button onClick={() => scroll('right')} className="hover:text-primary transition-colors hover:bg-white/10 px-3 py-1.5 rounded bg-white/5 disabled:opacity-30" disabled={i === projects.length - 1}>NEXT →</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  
  // 1. Инициализируем мобильный вид СРАЗУ, чтобы не было "прыжка" интерфейса
  const [isMobileView, setIsMobileView] = useState(isMobile);
  const [activeWindow, setActiveWindow] = useState<string>('projects');
  const [maxZ, setMaxZ] = useState(20);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);

  // 2. Умная функция создания окон с учетом устройства
const getInitialWindows = (): Record<string, WindowState> => {
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  const mobilePos = { x: 0, y: 0 };
  const mobileSize = { width: sw, height: sh - 130 };

  return {
    social: { 
      id: 'social', title: 'Connections', icon: <Globe size={14} />,
      isOpen: true,
      isMinimized: false, isMaximized: isMobileView, zIndex: 20,
      position: isMobileView ? mobilePos : { x: 1140, y: 320 },
      size: isMobileView ? mobileSize : { width: 280, height: 400 }, 
      component: null
    },
    projects: {
      id: 'projects', title: 'Completed Projects', icon: <Briefcase size={14} />,
      isOpen: true, isMinimized: false, isMaximized: isMobileView, zIndex: 21,
      position: isMobileView ? mobilePos : { x: 40, y: 40 },
      size: isMobileView ? mobileSize : { width: 500, height: 350 },
      component: null
    },
    terminal: { 
      id: 'terminal', title: 'terminal — user@portfolio:~', icon: <TerminalIcon size={14} />,
      isOpen: false, isMinimized: false, isMaximized: isMobileView, zIndex: 10,
      position: isMobileView ? mobilePos : { x: 80, y: 80 },
      size: isMobileView ? mobileSize : { width: 500, height: 350 },
      component: null
    },
    guestbook: {
      id: 'guestbook', title: 'Guestbook — Отзывы', icon: <MessageSquare size={14} />,
      isOpen: !isMobileView,
      isMinimized: false, isMaximized: isMobileView, zIndex: 11,
      position: isMobileView ? mobilePos : { x: 600, y: 40 },
      size: isMobileView ? mobileSize : { width: 500, height: 600 },
      component: null
    },
    btop: { 
      id: 'btop', title: 'btop++ - system monitor', icon: <Activity size={14} />,
      isOpen: false, isMinimized: false, isMaximized: isMobileView, zIndex: 6,
      position: isMobileView ? mobilePos : { x: 100, y: 100 },
      size: isMobileView ? mobileSize : { width: 400, height: 420 },
      component: null 
    },
    code: { 
      id: 'code', title: 'VS Code - neural_core.ts', icon: <Code size={14} />,
      isOpen: false, isMinimized: false, isMaximized: isMobileView, zIndex: 7,
      position: isMobileView ? mobilePos : { x: 150, y: 150 },
      size: isMobileView ? mobileSize : { width: 600, height: 450 },
      component: null
    },
    music: { 
      id: 'music', title: 'Music Player', icon: <Music size={14} />,
      isOpen: !isMobileView,
      isMinimized: false, isMaximized: isMobileView, zIndex: 5,
      position: isMobileView ? mobilePos : { x: 1140, y: 40 },
      size: isMobileView ? mobileSize : { width: 280, height: 260 },
      component: null
    },
    notepad: { 
      id: 'notepad', title: 'Brain_Dump.txt', icon: <FileText size={14} />,
      isOpen: false, isMinimized: false, isMaximized: isMobileView, zIndex: 2,
      position: isMobileView ? mobilePos : { x: 200, y: 200 },
      size: isMobileView ? mobileSize : { width: 350, height: 320 },
      component: null
    },
    chat: { 
      id: 'chat', title: 'Network_Chat v2.0', icon: <MessageSquare size={14} />,
      isOpen: !isMobileView,
      isMinimized: false, isMaximized: isMobileView, zIndex: 1,
      position: isMobileView ? mobilePos : { x: 40, y: 420 },
      size: isMobileView ? mobileSize : { width: 500, height: 310 },
      component: null
    },
    cava: {
      id: 'cava', title: 'CAVA_SPECTROGRAM', icon: <Disc size={14} />,
      isOpen: !isMobileView,
      isMinimized: false, isMaximized: isMobileView, zIndex: 0,
      position: isMobileView ? mobilePos : { x: 600, y: 660 },
      size: isMobileView ? mobileSize : { width: 500, height: 100 },
      component: null
    }
  };
};

  const [windows, setWindows] = useState<Record<string, WindowState>>(getInitialWindows());

  // Эффект для отслеживания ресайза (если пользователь крутит телефон)
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== isMobileView) {
        setIsMobileView(mobile);
        // При смене режима лучше сбросить окна в дефолт
        setWindows(getInitialWindows());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileView]);

  // Дальше весь остальной код без изменений...

  // NOTE: removed an effect that injected `btop.component` into state.
  // Storing React nodes in state and updating them from an effect caused
  // repeated state updates / re-renders when windows changed and could
  // lead to UI lockups (black screen). `Btop` is rendered directly where
  // needed instead of being injected into state.


  useEffect(() => {
    fetch('/api/music')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) setSongs(data);
        else {
          setSongs([{ id: '1', title: 'Station Drift', artist: 'LO-FI TERMINAL', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }]);
        }
      })
      .catch(() => {
        setSongs([{ id: '1', title: 'Station Drift', artist: 'LO-FI TERMINAL', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }]);
      });
  }, []);

  const handleFocus = (id: string) => {
    if (activeWindow === id && windows[id].zIndex === maxZ) return;
    const newZ = maxZ + 1;
    setMaxZ(newZ);
    setActiveWindow(id);
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], zIndex: newZ, isMinimized: false }
    }));
  };

  const updateWindow = (id: string, updates: Partial<WindowState>) => {
    setWindows(prev => {
      const win = prev[id];
      if (!win) return prev;
      
      const newWin = { ...win, ...updates };
      
      if (updates.position) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const barH = 40;
        const visibleX = 100;

        newWin.position = {
          x: Math.max(-newWin.size.width + visibleX, Math.min(updates.position.x, screenW - visibleX)),
          y: Math.max(32, Math.min(updates.position.y, screenH - barH - 80))
        };
      }

      return { ...prev, [id]: newWin };
    });
  };

  const handleClose = (id: string) => setWindows(prev => ({ ...prev, [id]: { ...prev[id], isOpen: false } }));
  const handleMinimize = (id: string) => setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMinimized: !prev[id].isMinimized } }));
  const handleMaximize = (id: string) => setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMaximized: !prev[id].isMaximized } }));
  const handleMove = (id: string, pos: { x: number; y: number }) => updateWindow(id, { position: pos });
  const handleResize = (id: string, size: { width: number; height: number }) => updateWindow(id, { size });

  const toggleWindow = (id: string) => {
    const win = windows[id];
    if (!win) return;

    if (!win.isOpen || win.isMinimized) {
      const newZ = maxZ + 1;
      setMaxZ(newZ);
      setActiveWindow(id);
      setWindows(prev => ({ ...prev, [id]: { ...prev[id], isOpen: true, isMinimized: false, zIndex: newZ } }));
    } else {
      if (activeWindow === id) {
        setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMinimized: true } }));
      } else {
        const newZ = maxZ + 1;
        setMaxZ(newZ);
        setActiveWindow(id);
        setWindows(prev => ({ ...prev, [id]: { ...prev[id], zIndex: newZ } }));
      }
    }
  };

  const resetSystem = () => {
    setWindows(getInitialWindows());
    setMaxZ(10);
    setActiveWindow('terminal');
    setIsPlaying(false);
  };

if (isMobileView) {
  const activeWin = windows[activeWindow];
  return (
    // ПРАВКА: h-[100dvh] вместо h-screen спасет от перекрытия панелью браузера
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden select-none font-sans flex flex-col text-white">
      {/* Сканлайны уносим на z-0 или даем навигации индекс ВЫШЕ */}
      <div className="fixed inset-0 scanlines pointer-events-none opacity-10 z-[50]"></div>
      
      <header className="h-16 bg-[#0d0d12] border-b border-white/10 flex items-center justify-between px-4 shrink-0 z-[110]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-outline/30 bg-surface-bright overflow-hidden">
            <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Felix" alt="USER_01" className="w-full h-full object-cover grayscale brightness-50" />
          </div>
          <div className="font-mono">
            <div className="text-lg font-bold text-primary leading-none tracking-tighter">ARCH_ISSUESS_01</div>
            <div className="text-[9px] text-primary flex items-center gap-1.5 mt-1 font-bold tracking-widest">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span> SYSTEM_LIVE
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileView(false)}
          className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          <Monitor size={18} />
        </button>
      </header>

       <main className="flex-1 overflow-hidden relative z-10 bg-[#050505]">
        <AnimatePresence mode="wait">
          {/* Контент активного окна */}
          <motion.div 
            key={activeWin.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {activeWin.id === 'music' ? (
              <MusicPlayer songs={songs} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
            ) : activeWin.id === 'social' ? (
              <SocialLinks />
            ) : activeWin.id === 'guestbook' ? (
              <Guestbook />
            ) : activeWin.id === 'btop' ? (
              <Btop windows={windows} />
            ) : activeWin.id === 'terminal' ? (
              <Terminal />
            ) : activeWin.id === 'code' ? (
              <CodeEditor />
            ) : activeWin.id === 'notepad' ? (
              <Notepad />
            ) : activeWin.id === 'chat' ? (
              <NetworkChat />
            ) : activeWin.id === 'projects' ? (
              <ProjectsPortfolio />
            ) : (
              <div className="p-10 text-center text-primary/20 font-mono tracking-tighter text-2xl">FILE_NOT_FOUND</div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

{/* ПРАВКА: z-[110], чтобы быть выше сканлайнов */}
      <nav className="h-20 bg-[#0d0d12] border-t border-white/10 flex items-center justify-between px-2 overflow-x-auto custom-scrollbar shrink-0 z-[110] pb-safe">
        {Object.values(windows).map(win => (
          <button
            key={win.id}
            onPointerDown={() => {
              // Используем onPointerDown для мгновенного отклика на тач
              if (!win.isOpen) {
                setWindows(prev => ({ ...prev, [win.id]: { ...prev[win.id], isOpen: true, isMinimized: false } }));
              }
              setActiveWindow(win.id);
            }}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${
              activeWindow === win.id 
                ? 'bg-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' 
                : 'bg-white/5 text-on-surface-variant hover:bg-white/10'
            }`}
          >
            {win.icon}
            <span className="text-[8px] font-mono mt-1 uppercase tracking-wider truncate w-full text-center px-1">
              {win.id}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none font-sans cursor-default">
      <div className="fixed inset-0 scanlines pointer-events-none opacity-10 z-[100]"></div>
      
      <div className="fixed inset-0 z-0 bg-[#020202]">
        <img 
          src="/wallpaper.jpg" 
          alt="Wallpaper"
          className="w-full h-full object-cover grayscale opacity-[0.15] contrast-125"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60"></div>
      </div>

      <header className="fixed top-0 left-0 right-0 h-8 flex justify-between items-center px-4 z-[90] bg-black/80 backdrop-blur-md border-b border-white/5 text-primary text-[11px] font-mono tracking-wider">
        <div className="flex items-center gap-6">
          <span className="font-bold cursor-pointer hover:text-white transition-colors">ACTIVITIES</span>
          <div className="flex items-center gap-4 text-on-surface-variant">
            {(Object.values(windows) as WindowState[]).map(win => win.isOpen && (
              <span 
                key={win.id}
                onClick={() => handleFocus(win.id)}
                className={`cursor-pointer transition-colors hover:text-primary ${activeWindow === win.id ? 'text-primary font-bold' : ''}`}
              >
                {win.title.split(' ')[0].toUpperCase()}
              </span>
            ))}
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 font-bold tracking-[0.2em] text-primary/60">
          <TopBarClock />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-on-surface-variant">
            <Wifi size={14} className="hover:text-primary cursor-pointer transition-colors" />
            <Battery size={14} className="hover:text-primary cursor-pointer transition-colors" />
            <ChevronDown size={14} className="hover:text-primary cursor-pointer transition-colors" />
          </div>
        </div>
      </header>

      <main className="relative w-full h-full pt-8 pb-20 z-10 overflow-hidden">
        <div className="absolute top-16 right-8 flex flex-col items-end gap-2 text-right pointer-events-none opacity-40 z-0 select-none">
          <div className="w-20 h-20 rounded-full border border-outline/30 bg-surface-bright overflow-hidden">
            <img 
              src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Felix" 
              alt="USER_01" 
              className="w-full h-full object-cover grayscale brightness-50" 
            />
          </div>
          <div className="font-mono">
            <div className="text-3xl font-bold text-primary leading-none tracking-tighter">ARCH_ISSUESS_01</div>
            <div className="text-[10px] text-primary flex items-center justify-end gap-1.5 mt-2 font-bold tracking-widest">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span> SYSTEM_LIVE
            </div>
          </div>
        </div>

        <AnimatePresence>
          {(Object.values(windows) as WindowState[]).map(win => (
            <Window 
              key={win.id} 
              win={win} 
              onClose={handleClose}
              onMinimize={handleMinimize}
              onMaximize={handleMaximize}
              onFocus={handleFocus}
              onMove={handleMove}
              onResize={handleResize}
              isActive={activeWindow === win.id}
            >
              {win.id === 'music' ? (
                <MusicPlayer songs={songs} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
              ) : win.id === 'cava' ? (
                <div className="p-4 h-full">
                  <MusicVisualizer isPlaying={isPlaying} bars={40} />
                </div>
              ) : win.id === 'btop' ? (
                <Btop windows={windows} />
              ) : win.id === 'terminal' ? (
                <Terminal />
              ) : win.id === 'code' ? (
                <CodeEditor />
              ) : win.id === 'social' ? (
                <SocialLinks />
              ) : win.id === 'notepad' ? (
                <Notepad />
              ) : win.id === 'chat' ? (
                <NetworkChat />
              ) : win.id === 'projects' ? (
                <ProjectsPortfolio />
              ) : win.id === 'guestbook' ? (
                <Guestbook />
              ) : (
                <div className="p-10 text-center text-primary/20 font-mono tracking-tighter text-4xl">FILE_NOT_FOUND</div>
              )}
            </Window>
          ))}
        </AnimatePresence>
      </main>

      <button 
        onClick={() => setIsMobileView(true)}
        className="fixed bottom-6 right-6 z-[999] w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:bg-white/20 hover:scale-110 transition-all"
        title="Switch to Mobile View"
      >
        <Smartphone size={20} />
      </button>

      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center">
        <AnimatePresence>
          {isStartMenuOpen && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="absolute bottom-20 left-4 w-64 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 flex flex-col gap-1"
            >
              <div className="text-[10px] text-white/50 font-mono tracking-widest uppercase mb-2 px-2 pb-2 border-b border-white/5">Applications</div>
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
                {(Object.values(windows) as WindowState[]).map(win => (
                  <button
                    key={win.id}
                    onClick={() => {
                      toggleWindow(win.id);
                      setIsStartMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-colors text-left ${activeWindow === win.id && !win.isMinimized ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary shrink-0">
                      {win.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white leading-none truncate">{win.id.toUpperCase()}</div>
                      <div className="text-[9px] font-mono text-white/50 mt-1 truncate">{win.title}</div>
                    </div>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: win.isOpen && !win.isMinimized ? '#22c55e' : 'transparent' }} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-black/80 backdrop-blur-xl p-2 rounded-2xl flex items-center gap-3 px-4 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)]"
        >
          <DockItem icon={<LayoutGrid size={24} />} label="Apps" onClick={() => setIsStartMenuOpen(!isStartMenuOpen)} focused={isStartMenuOpen} />
          <div className="h-8 w-[1px] bg-white/10 mx-1"></div>
          {(Object.values(windows) as WindowState[]).map(win => (
            <DockItem 
              key={win.id}
              icon={win.icon} 
              label={win.id.toUpperCase()} 
              active={win.isOpen}
              minimized={win.isMinimized}
              focused={activeWindow === win.id && !win.isMinimized}
              onClick={() => toggleWindow(win.id)}
            />
          ))}
          <div className="h-8 w-[1px] bg-white/10 mx-1"></div>
          <DockItem icon={<Power size={24} />} label="Power" danger onClick={resetSystem} />
        </motion.div>
      </footer>
    </div>
  );
}

interface DockItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  minimized?: boolean;
  focused?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

const DockItem: React.FC<DockItemProps> = ({ icon, label, active, minimized, focused, danger, onClick }) => {
  return (
    <div className="group relative flex flex-col items-center">
      <motion.div 
        whileHover={{ scale: 1.15, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer relative
          ${danger ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20 hover:text-red-400' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 text-on-surface-variant hover:text-primary'}
          ${focused ? 'bg-white/15 border-white/30 text-primary shadow-[0_0_15px_rgba(255,255,255,0.1)]' : ''}
          ${active && minimized ? 'opacity-50' : ''}
        `}
      >
        {icon}
        {active && (
          <div className={`absolute -bottom-1.5 w-1 h-1 rounded-full shadow-[0_0_5px_white] transition-all
            ${focused ? 'bg-white w-4 h-0.5' : 'bg-primary'}
          `} />
        )}
      </motion.div>
      <div className="absolute -top-12 bg-black/90 border border-white/10 text-white text-[10px] px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-mono tracking-[0.2em] z-[110] shadow-xl">
        {label}
      </div>
    </div>
  );
}