import React, { useState, useRef, useEffect } from 'react';
import { Download, Play, Pause, Image as ImageIcon, Music, Trash2, Info, Settings, Video, Layers, Zap, ChevronUp, ChevronDown, Plus, ArrowUp, ArrowDown, SunMedium, Sparkles, Moon, MousePointer2, Lightbulb, Type } from 'lucide-react';
import { ImageItem, AudioItem, ActionButton, LightItem, TextItem, VideoItem } from './types';

export default function App() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [lights, setLights] = useState<LightItem[]>([]);
  const [audioItem, setAudioItem] = useState<AudioItem | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState<number>(5);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Tabs & Global Settings
  const [activeTab, setActiveTab] = useState<'content' | 'effects' | 'actions'>('content');
  const [globalLight, setGlobalLight] = useState<'none' | 'spotlight' | 'fireflies'>('none');
  const [actionButtons, setActionButtons] = useState<ActionButton[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const elapsedRef = useRef<number>(0);
  const firefliesRef = useRef<any[]>([]);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const CANVAS_WIDTH = 1280;
  const CANVAS_HEIGHT = 720;

  // Render loop
  const renderCanvas = (time: number) => {
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    
    if (isPlaying) {
      elapsedRef.current += deltaTime;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) {
      animationRef.current = requestAnimationFrame(renderCanvas);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animationRef.current = requestAnimationFrame(renderCanvas);
      return;
    }

    // Clear background
    ctx.fillStyle = '#171717'; // neutral-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const elapsed = elapsedRef.current;

    // Draw videos
    videos.forEach(item => {
      ctx.save();
      
      let dx = 0;
      let dy = 0;
      let rotation = 0;
      let scale = 1;

      if (item.animationType !== 'none') {
        const durationMs = item.duration * 1000;
        let t = 0;
        if (item.loop) {
          t = (elapsed % durationMs) / durationMs;
        } else {
          t = Math.min(elapsed / durationMs, 1);
        }
        
        if (item.animationType === 'shake') {
          rotation = Math.sin(t * Math.PI * 2 * 5) * 0.15 * item.amplitude;
        } else if (item.animationType === 'spin') {
          rotation = t * Math.PI * 2 * item.amplitude;
        } else if (item.animationType === 'bounce') {
          dy = -Math.abs(Math.sin(t * Math.PI * 2 * 2)) * 60 * item.amplitude;
        } else if (item.animationType === 'float') {
          dy = Math.sin(t * Math.PI * 2) * 20 * item.amplitude;
        } else if (item.animationType === 'moveLeftRight') {
          dx = Math.sin(t * Math.PI * 2) * 100 * item.amplitude;
        }
      }

      ctx.translate(item.x + dx, item.y + dy);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);
      
      if (item.brightness !== 100) {
        ctx.filter = `brightness(${item.brightness}%)`;
      }
      
      ctx.drawImage(item.videoElement, -item.width / 2, -item.height / 2, item.width, item.height);
      
      ctx.filter = 'none';

      // Draw selection border
      if (item.id === selectedId && !isRecording) {
        ctx.strokeStyle = '#a855f7'; // purple-500
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(-item.width / 2 - 2, -item.height / 2 - 2, item.width + 4, item.height + 4);
        ctx.setLineDash([]);
      }
      
      ctx.restore();
    });

    // Draw images
    images.forEach(item => {
      ctx.save();
      
      let dx = 0;
      let dy = 0;
      let rotation = 0;
      let scale = 1;

      if (item.animationType !== 'none') {
        const durationMs = item.duration * 1000;
        let t = 0;
        if (item.loop) {
          t = (elapsed % durationMs) / durationMs;
        } else {
          t = Math.min(elapsed / durationMs, 1);
        }
        
        if (item.animationType === 'shake') {
          rotation = Math.sin(t * Math.PI * 2 * 5) * 0.15 * item.amplitude;
        } else if (item.animationType === 'spin') {
          rotation = t * Math.PI * 2 * item.amplitude;
        } else if (item.animationType === 'bounce') {
          dy = -Math.abs(Math.sin(t * Math.PI * 2 * 2)) * 60 * item.amplitude;
        } else if (item.animationType === 'float') {
          dy = Math.sin(t * Math.PI * 2) * 20 * item.amplitude;
        } else if (item.animationType === 'moveLeftRight') {
          dx = Math.sin(t * Math.PI * 2) * 100 * item.amplitude;
        }
      }

      ctx.translate(item.x + item.width / 2 + dx, item.y + item.height / 2 + dy);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);
      
      // Shadows
      if (item.dropShadow) {
        ctx.shadowColor = item.shadowColor;
        ctx.shadowBlur = item.shadowBlur;
        ctx.shadowOffsetX = item.shadowOffset;
        ctx.shadowOffsetY = item.shadowOffset;
      }

      // Determine which image to show (Base or Alt)
      let isAutoAlt = false;
      if (item.autoSwapTime > 0) {
        const cycle = Math.floor(elapsed / (item.autoSwapTime * 1000));
        isAutoAlt = cycle % 2 !== 0;
      }
      const showAlt = item.isAltState !== isAutoAlt; // XOR logic
      const currentImg = (showAlt && item.altImgElement) ? item.altImgElement : item.imgElement;
      
      ctx.drawImage(currentImg, -item.width / 2, -item.height / 2, item.width, item.height);
      
      // Reset shadow for selection border
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw selection border
      if (item.id === selectedId && !isRecording) {
        ctx.strokeStyle = '#3b82f6'; // blue-500
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(-item.width / 2 - 2, -item.height / 2 - 2, item.width + 4, item.height + 4);
        ctx.setLineDash([]);
      }
      
      ctx.restore();
    });

    // Draw texts
    texts.forEach(item => {
      ctx.save();
      
      let dx = 0;
      let dy = 0;
      let rotation = 0;
      let scale = 1;

      if (item.animationType !== 'none') {
        const durationMs = item.duration * 1000;
        let t = 0;
        if (item.loop) {
          t = (elapsed % durationMs) / durationMs;
        } else {
          t = Math.min(elapsed / durationMs, 1);
        }
        
        if (item.animationType === 'shake') {
          rotation = Math.sin(t * Math.PI * 2 * 5) * 0.15 * item.amplitude;
        } else if (item.animationType === 'spin') {
          rotation = t * Math.PI * 2 * item.amplitude;
        } else if (item.animationType === 'bounce') {
          dy = -Math.abs(Math.sin(t * Math.PI * 2 * 2)) * 60 * item.amplitude;
        } else if (item.animationType === 'float') {
          dy = Math.sin(t * Math.PI * 2) * 20 * item.amplitude;
        } else if (item.animationType === 'moveLeftRight') {
          dx = Math.sin(t * Math.PI * 2) * 100 * item.amplitude;
        }
      }

      ctx.translate(item.x + dx, item.y + dy);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);
      
      ctx.font = `${item.fontSize}px ${item.fontFamily}`;
      ctx.fillStyle = item.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Shadows
      if (item.dropShadow) {
        ctx.shadowColor = item.shadowColor;
        ctx.shadowBlur = item.shadowBlur;
        ctx.shadowOffsetX = item.shadowOffset;
        ctx.shadowOffsetY = item.shadowOffset;
      }

      ctx.fillText(item.text, 0, 0);
      
      // Reset shadow for selection border
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw selection border
      if (item.id === selectedId && !isRecording) {
        const metrics = ctx.measureText(item.text);
        const width = metrics.width;
        const height = item.fontSize;
        ctx.strokeStyle = '#22c55e'; // green-500
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8);
        ctx.setLineDash([]);
      }
      
      ctx.restore();
    });

    // Draw Custom Lights
    lights.forEach(light => {
      ctx.save();
      
      let currentIntensity = light.intensity;
      if (light.animationType !== 'none' && light.duration > 0) {
        const durationMs = light.duration * 1000;
        const t = (elapsed % durationMs) / durationMs;
        if (light.animationType === 'fade') {
          // Smooth fade in and out (0 to 1 to 0)
          currentIntensity *= (Math.sin(t * Math.PI * 2 - Math.PI/2) + 1) / 2;
        } else if (light.animationType === 'blink') {
          // Blink (on for first half, off for second half)
          currentIntensity *= t < 0.5 ? 1 : 0;
        }
      }

      ctx.translate(light.x, light.y);
      ctx.globalAlpha = currentIntensity;
      ctx.shadowBlur = light.blur;
      ctx.shadowColor = light.color;
      ctx.fillStyle = light.color;

      ctx.beginPath();
      if (light.shape === 'glow') {
        const hex = light.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) || 255;
        const g = parseInt(hex.substring(2, 4), 16) || 255;
        const b = parseInt(hex.substring(4, 6), 16) || 255;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, light.radius);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = grad;
        ctx.shadowBlur = 0; // Disable shadow blur for glow
        ctx.arc(0, 0, light.radius, 0, Math.PI * 2);
      } else if (light.shape === 'circle') {
        ctx.arc(0, 0, light.radius, 0, Math.PI * 2);
      } else if (light.shape === 'star') {
        const spikes = 5;
        const outerRadius = light.radius;
        const innerRadius = light.radius / 2;
        let rot = Math.PI / 2 * 3;
        let x = 0;
        let y = 0;
        let step = Math.PI / spikes;

        ctx.moveTo(0, -outerRadius);
        for (let i = 0; i < spikes; i++) {
          x = Math.cos(rot) * outerRadius;
          y = Math.sin(rot) * outerRadius;
          ctx.lineTo(x, y);
          rot += step;

          x = Math.cos(rot) * innerRadius;
          y = Math.sin(rot) * innerRadius;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(0, -outerRadius);
        ctx.closePath();
      }
      ctx.fill();
      
      // Draw selection border for light
      if (light.id === selectedId && !isRecording) {
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#eab308'; // yellow-500
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(-light.radius - 4, -light.radius - 4, light.radius * 2 + 8, light.radius * 2 + 8);
        ctx.setLineDash([]);
      }

      ctx.restore();
    });

    // Draw Global Lighting Effects
    if (globalLight === 'spotlight') {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const gradient = ctx.createRadialGradient(cx, cy, 100, cx, cy, canvas.width);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (globalLight === 'fireflies') {
      if (firefliesRef.current.length === 0) {
        for(let i=0; i<60; i++) {
           firefliesRef.current.push({
             x: Math.random() * canvas.width,
             y: Math.random() * canvas.height,
             vx: (Math.random() - 0.5) * 1.5,
             vy: (Math.random() - 0.5) * 1.5,
             size: Math.random() * 2.5 + 0.5,
             life: Math.random() * 100,
             maxLife: 100 + Math.random() * 100
           });
        }
      }
      
      if (isPlaying) {
        firefliesRef.current.forEach(f => {
          f.x += f.vx * (deltaTime / 16);
          f.y += f.vy * (deltaTime / 16);
          f.life += (deltaTime / 16);
          if (f.life > f.maxLife) {
            f.life = 0;
            f.x = Math.random() * canvas.width;
            f.y = Math.random() * canvas.height;
          }
        });
      }

      firefliesRef.current.forEach(f => {
        const alpha = Math.sin((f.life / f.maxLife) * Math.PI) * 0.8;
        ctx.fillStyle = `rgba(255, 255, 150, ${alpha})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        // glow
        ctx.shadowColor = 'rgba(255, 255, 150, 1)';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }

    animationRef.current = requestAnimationFrame(renderCanvas);
  };

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(renderCanvas);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [images, lights, selectedId, isPlaying, isRecording, globalLight]);

  // Mouse events for canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isRecording) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check lights first
    for (let i = lights.length - 1; i >= 0; i--) {
      const light = lights[i];
      if (x >= light.x - light.radius && x <= light.x + light.radius && 
          y >= light.y - light.radius && y <= light.y + light.radius) {
        setSelectedId(light.id);
        setIsDragging(true);
        setDragOffset({ x: x - light.x, y: y - light.y });
        return;
      }
    }

    // Then check texts
    for (let i = texts.length - 1; i >= 0; i--) {
      const txt = texts[i];
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      let width = txt.text.length * (txt.fontSize * 0.6);
      if (tempCtx) {
        tempCtx.font = `${txt.fontSize}px ${txt.fontFamily}`;
        width = tempCtx.measureText(txt.text).width;
      }
      const height = txt.fontSize;
      // Adjust hit detection based on center alignment
      if (x >= txt.x - width/2 && x <= txt.x + width/2 && y >= txt.y - height/2 && y <= txt.y + height/2) {
        setSelectedId(txt.id);
        setIsDragging(true);
        setDragOffset({ x: x - txt.x, y: y - txt.y });
        return;
      }
    }

    // Then check videos
    for (let i = videos.length - 1; i >= 0; i--) {
      const vid = videos[i];
      if (x >= vid.x - vid.width/2 && x <= vid.x + vid.width/2 && y >= vid.y - vid.height/2 && y <= vid.y + vid.height/2) {
        setSelectedId(vid.id);
        setIsDragging(true);
        setDragOffset({ x: x - vid.x, y: y - vid.y });
        return;
      }
    }

    // Then check images
    for (let i = images.length - 1; i >= 0; i--) {
      const img = images[i];
      // Image is drawn centered at x,y
      if (x >= img.x - img.width/2 && x <= img.x + img.width/2 && y >= img.y - img.height/2 && y <= img.y + img.height/2) {
        setSelectedId(img.id);
        setIsDragging(true);
        setDragOffset({ x: x - img.x, y: y - img.y });
        return;
      }
    }
    setSelectedId(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedId || isRecording) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setVideos(prev => prev.map(vid => 
      vid.id === selectedId 
        ? { ...vid, x: x - dragOffset.x, y: y - dragOffset.y }
        : vid
    ));
    setImages(prev => prev.map(img => 
      img.id === selectedId 
        ? { ...img, x: x - dragOffset.x, y: y - dragOffset.y }
        : img
    ));
    setTexts(prev => prev.map(txt => 
      txt.id === selectedId 
        ? { ...txt, x: x - dragOffset.x, y: y - dragOffset.y }
        : txt
    ));
    setLights(prev => prev.map(light => 
      light.id === selectedId 
        ? { ...light, x: x - dragOffset.x, y: y - dragOffset.y }
        : light
    ));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Upload handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file: File) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const max = 400;
        if (w > max || h > max) {
          const ratio = Math.min(max / w, max / h);
          w *= ratio;
          h *= ratio;
        }
        
        const newItem: ImageItem = {
          id: Math.random().toString(36).substr(2, 9),
          url,
          imgElement: img,
          isAltState: false,
          autoSwapTime: 0,
          x: CANVAS_WIDTH / 2 - w / 2,
          y: CANVAS_HEIGHT / 2 - h / 2,
          width: w,
          height: h,
          animationType: 'none',
          duration: 5,
          amplitude: 1.0,
          loop: true,
          dropShadow: false,
          shadowColor: '#000000',
          shadowBlur: 20,
          shadowOffset: 10,
          name: file.name
        };
        setImages(prev => [...prev, newItem]);
        setSelectedId(newItem.id);
      };
      img.src = url;
    });
    e.target.value = '';
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file: File) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.loop = true;
      video.muted = true; // Mute by default for autoplay
      video.playsInline = true;
      
      video.onloadedmetadata = () => {
        let w = video.videoWidth;
        let h = video.videoHeight;
        const max = 400;
        if (w > max || h > max) {
          const ratio = Math.min(max / w, max / h);
          w *= ratio;
          h *= ratio;
        }
        
        const newItem: VideoItem = {
          id: Math.random().toString(36).substr(2, 9),
          url,
          videoElement: video,
          x: CANVAS_WIDTH / 2 - w / 2,
          y: CANVAS_HEIGHT / 2 - h / 2,
          width: w,
          height: h,
          animationType: 'none',
          duration: 5,
          amplitude: 1.0,
          loop: true,
          brightness: 100,
          name: file.name
        };
        setVideos(prev => [...prev, newItem]);
        setSelectedId(newItem.id);
        if (isPlaying || isRecording) {
          video.play().catch(e => console.log("Autoplay prevented", e));
        }
      };
    });
    e.target.value = '';
  };

  const handleAltImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      updateImage(id, { altUrl: url, altImgElement: img });
    };
    img.src = url;
    e.target.value = '';
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    setAudioItem({
      url,
      name: file.name,
      loop: true
    });
    e.target.value = '';
  };

  const updateImage = (id: string, updates: Partial<ImageItem>) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  const deleteImage = (id: string) => {
    setImages(prev => prev.map(img => {
      if (img.id === id) {
        URL.revokeObjectURL(img.url);
        if (img.altUrl) URL.revokeObjectURL(img.altUrl);
      }
      return img;
    }).filter(img => img.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveImageUp = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index+1]] = [newImages[index+1], newImages[index]];
    setImages(newImages);
  };

  const moveImageDown = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index], newImages[index-1]] = [newImages[index-1], newImages[index]];
    setImages(newImages);
  };

  const updateVideo = (id: string, updates: Partial<VideoItem>) => {
    setVideos(prev => prev.map(vid => {
      if (vid.id === id) {
        if (updates.loop !== undefined) {
          vid.videoElement.loop = updates.loop;
        }
        return { ...vid, ...updates };
      }
      return vid;
    }));
  };

  const deleteVideo = (id: string) => {
    setVideos(prev => prev.map(vid => {
      if (vid.id === id) {
        vid.videoElement.pause();
        vid.videoElement.removeAttribute('src');
        vid.videoElement.load();
        URL.revokeObjectURL(vid.url);
      }
      return vid;
    }).filter(vid => vid.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveVideoUp = (index: number) => {
    if (index === videos.length - 1) return;
    const newVids = [...videos];
    [newVids[index], newVids[index+1]] = [newVids[index+1], newVids[index]];
    setVideos(newVids);
  };

  const moveVideoDown = (index: number) => {
    if (index === 0) return;
    const newVids = [...videos];
    [newVids[index], newVids[index-1]] = [newVids[index-1], newVids[index]];
    setVideos(newVids);
  };

  const createText = () => {
    const newText: TextItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: 'Văn bản mới',
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      fontSize: 48,
      fontFamily: 'Arial',
      color: '#ffffff',
      animationType: 'none',
      duration: 5,
      amplitude: 1.0,
      loop: true,
      dropShadow: false,
      shadowColor: '#000000',
      shadowBlur: 10,
      shadowOffset: 5,
      name: 'Văn bản'
    };
    setTexts([...texts, newText]);
    setSelectedId(newText.id);
  };

  const updateText = (id: string, updates: Partial<TextItem>) => {
    setTexts(prev => prev.map(txt => txt.id === id ? { ...txt, ...updates } : txt));
  };

  const deleteText = (id: string) => {
    setTexts(prev => prev.filter(txt => txt.id !== id));
    if (selectedId === id) setSelectedId(null);
  };
  
  const moveTextUp = (index: number) => {
    if (index === texts.length - 1) return;
    const newTexts = [...texts];
    [newTexts[index], newTexts[index+1]] = [newTexts[index+1], newTexts[index]];
    setTexts(newTexts);
  };

  const moveTextDown = (index: number) => {
    if (index === 0) return;
    const newTexts = [...texts];
    [newTexts[index], newTexts[index-1]] = [newTexts[index-1], newTexts[index]];
    setTexts(newTexts);
  };

  const createActionButton = () => {
    const newBtn: ActionButton = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Nút biến đổi ${actionButtons.length + 1}`,
      targetIds: []
    };
    setActionButtons([...actionButtons, newBtn]);
  };

  const updateActionButton = (id: string, updates: Partial<ActionButton>) => {
    setActionButtons(prev => prev.map(btn => btn.id === id ? { ...btn, ...updates } : btn));
  };

  const deleteActionButton = (id: string) => {
    setActionButtons(prev => prev.filter(btn => btn.id !== id));
  };

  const triggerAction = (btnId: string) => {
    const btn = actionButtons.find(b => b.id === btnId);
    if (!btn) return;
    setImages(prev => prev.map(img => 
      btn.targetIds.includes(img.id) ? { ...img, isAltState: !img.isAltState } : img
    ));
  };

  const createLight = () => {
    const newLight: LightItem = {
      id: Math.random().toString(36).substr(2, 9),
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      color: '#ffffff',
      radius: 30,
      blur: 40,
      shape: 'circle',
      intensity: 1.0,
      animationType: 'none',
      duration: 2,
      name: `Đèn ${lights.length + 1}`
    };
    setLights([...lights, newLight]);
    setSelectedId(newLight.id);
  };

  const updateLight = (id: string, updates: Partial<LightItem>) => {
    setLights(prev => prev.map(light => light.id === id ? { ...light, ...updates } : light));
  };

  const deleteLight = (id: string) => {
    setLights(prev => prev.filter(light => light.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const startRecording = async () => {
    if (!canvasRef.current) return;
    
    setIsRecording(true);
    setRecordingProgress(0);
    elapsedRef.current = 0; // Reset animation to start
    setIsPlaying(true);
    setSelectedId(null); // Hide selection border
    
    const canvasStream = canvasRef.current.captureStream(30);
    const tracks = [...canvasStream.getVideoTracks()];
    
    let audioCtx: AudioContext | null = null;
    let dest: MediaStreamAudioDestinationNode | null = null;
    let source: MediaElementAudioSourceNode | null = null;
    let audio: HTMLAudioElement | null = null;
    
    if (audioItem) {
      try {
        audioCtx = new AudioContext();
        dest = audioCtx.createMediaStreamDestination();
        audio = new Audio(audioItem.url);
        audio.loop = audioItem.loop;
        source = audioCtx.createMediaElementSource(audio);
        source.connect(dest);
        source.connect(audioCtx.destination);
        audio.play().catch(e => console.error("Audio play failed", e));
        tracks.push(...dest.stream.getAudioTracks());
      } catch (e) {
        console.error("Failed to setup audio recording", e);
      }
    }
    
    const combinedStream = new MediaStream(tracks);
    const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'animation_export.webm';
      a.click();
      URL.revokeObjectURL(url);
      
      setIsRecording(false);
      setRecordingProgress(0);
      
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      if (audioCtx) {
        audioCtx.close();
      }
    };
    
    recorder.start();
    
    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    }, recordDuration * 1000);
    
    const interval = setInterval(() => {
      setRecordingProgress(prev => {
        const next = prev + (100 / (recordDuration * 10));
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 100);
  };

  useEffect(() => {
    videos.forEach(v => {
      if (isPlaying || isRecording) {
        v.videoElement.play().catch(e => console.log("Autoplay prevented", e));
      } else {
        v.videoElement.pause();
      }
    });
  }, [isPlaying, isRecording, videos]);

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-96 bg-neutral-900 border-r border-neutral-800 flex flex-col z-10 shadow-xl">
        <div className="p-4 border-b border-neutral-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-500" />
            Web Animator Pro
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Tạo video chuyển động, hiệu ứng ánh sáng & bóng
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800">
          <button 
            className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'content' ? 'border-blue-500 text-blue-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
            onClick={() => setActiveTab('content')}
          >
            Nội dung
          </button>
          <button 
            className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'effects' ? 'border-blue-500 text-blue-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
            onClick={() => setActiveTab('effects')}
          >
            Hiệu ứng
          </button>
          <button 
            className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'actions' ? 'border-blue-500 text-blue-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
            onClick={() => setActiveTab('actions')}
          >
            Hành động
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* TAB: CONTENT */}
          {activeTab === 'content' && (
            <>
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Thêm nội dung</h2>
                <div className="grid grid-cols-4 gap-2">
                  <label className="flex flex-col items-center justify-center p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors border border-neutral-700">
                    <ImageIcon className="w-5 h-5 mb-1 text-blue-400" />
                    <span className="text-xs font-medium">Ảnh</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                  <label className="flex flex-col items-center justify-center p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors border border-neutral-700">
                    <Video className="w-5 h-5 mb-1 text-orange-400" />
                    <span className="text-xs font-medium">Video</span>
                    <input type="file" accept="video/*" multiple className="hidden" onChange={handleVideoUpload} />
                  </label>
                  <button onClick={createText} className="flex flex-col items-center justify-center p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors border border-neutral-700">
                    <Type className="w-5 h-5 mb-1 text-green-400" />
                    <span className="text-xs font-medium">Chữ</span>
                  </button>
                  <label className="flex flex-col items-center justify-center p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors border border-neutral-700">
                    <Music className="w-5 h-5 mb-1 text-purple-400" />
                    <span className="text-xs font-medium">MP3</span>
                    <input type="file" accept="audio/mp3,audio/wav" className="hidden" onChange={handleAudioUpload} />
                  </label>
                </div>
              </div>

              {audioItem && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Âm thanh</h2>
                  <div className="bg-neutral-800 p-3 rounded-lg border border-neutral-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Music className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="text-sm truncate">{audioItem.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={audioItem.loop}
                          onChange={(e) => setAudioItem({...audioItem, loop: e.target.checked})}
                          className="rounded border-neutral-600 bg-neutral-700 text-blue-500 focus:ring-blue-500"
                        />
                        Loop
                      </label>
                      <button onClick={() => setAudioItem(null)} className="text-neutral-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Danh sách Chữ</h2>
                {texts.length === 0 ? (
                  <div className="text-center p-6 border border-dashed border-neutral-700 rounded-lg text-neutral-500 text-sm">
                    Chưa có chữ nào.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {texts.map((txt, index) => (
                      <div 
                        key={txt.id} 
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${selectedId === txt.id ? 'bg-neutral-800 border-green-500' : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'}`}
                        onClick={() => setSelectedId(txt.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Type className="w-4 h-4 text-green-400 shrink-0" />
                            <span className="text-sm truncate">{txt.text || 'Văn bản trống'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); moveTextUp(index); }} disabled={index === texts.length - 1} className="text-neutral-400 hover:text-white disabled:opacity-30 p-1"><ArrowDown className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); moveTextDown(index); }} disabled={index === 0} className="text-neutral-400 hover:text-white disabled:opacity-30 p-1"><ArrowUp className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteText(txt.id); }} className="text-neutral-400 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        
                        {selectedId === txt.id && (
                          <div className="space-y-4 mt-3 pt-3 border-t border-neutral-700" onClick={e => e.stopPropagation()}>
                            <div>
                              <label className="block text-[10px] text-neutral-400 mb-1">Nội dung</label>
                              <input type="text" value={txt.text} onChange={(e) => updateText(txt.id, { text: e.target.value })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs outline-none focus:border-green-500" />
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] text-neutral-400 mb-1">Màu chữ</label>
                                <input type="color" value={txt.color} onChange={(e) => updateText(txt.id, { color: e.target.value })} className="w-full h-7 bg-neutral-900 border border-neutral-700 rounded cursor-pointer" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-neutral-400 mb-1">Cỡ chữ</label>
                                <input type="number" min="10" value={txt.fontSize} onChange={(e) => updateText(txt.id, { fontSize: parseInt(e.target.value) || 48 })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs outline-none" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-neutral-400 mb-1">Font</label>
                                <select value={txt.fontFamily} onChange={(e) => updateText(txt.id, { fontFamily: e.target.value })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs outline-none">
                                  <option value="Arial">Arial</option>
                                  <option value="Times New Roman">Times New Roman</option>
                                  <option value="Courier New">Courier New</option>
                                  <option value="Georgia">Georgia</option>
                                  <option value="Verdana">Verdana</option>
                                </select>
                              </div>
                            </div>

                            {/* Animation Settings */}
                            <div>
                              <label className="block text-xs text-neutral-400 mb-1 font-semibold">Chuyển động</label>
                              <select 
                                value={txt.animationType}
                                onChange={(e) => updateText(txt.id, { animationType: e.target.value as any })}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-sm focus:border-green-500 outline-none mb-2"
                              >
                                <option value="none">Không có</option>
                                <option value="shake">Lắc (Shake)</option>
                                <option value="spin">Xoay (Spin)</option>
                                <option value="bounce">Nảy (Bounce)</option>
                                <option value="float">Trôi (Float)</option>
                                <option value="moveLeftRight">Di chuyển Trái-Phải</option>
                              </select>
                              
                              {txt.animationType !== 'none' && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-neutral-400 mb-1">Thời gian (s)</label>
                                    <input type="number" min="0.1" step="0.1" value={txt.duration} onChange={(e) => updateText(txt.id, { duration: parseFloat(e.target.value) || 1 })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs outline-none" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-neutral-400 mb-1">Biên độ (x)</label>
                                    <input type="number" min="0.1" max="5" step="0.1" value={txt.amplitude} onChange={(e) => updateText(txt.id, { amplitude: parseFloat(e.target.value) || 1 })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs outline-none" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Shadow Settings */}
                            <div className="pt-2 border-t border-neutral-700/50">
                              <label className="flex items-center gap-2 text-xs text-neutral-300 font-semibold mb-2 cursor-pointer">
                                <input type="checkbox" checked={txt.dropShadow} onChange={(e) => updateText(txt.id, { dropShadow: e.target.checked })} className="rounded bg-neutral-900 border-neutral-700" />
                                Đổ bóng (Shadow)
                              </label>
                              {txt.dropShadow && (
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-neutral-400 mb-1">Màu</label>
                                    <input type="color" value={txt.shadowColor} onChange={(e) => updateText(txt.id, { shadowColor: e.target.value })} className="w-full h-7 bg-neutral-900 border border-neutral-700 rounded cursor-pointer" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-neutral-400 mb-1">Độ nhòe</label>
                                    <input type="number" value={txt.shadowBlur} onChange={(e) => updateText(txt.id, { shadowBlur: parseInt(e.target.value) || 0 })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs outline-none" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-neutral-400 mb-1">Độ lệch</label>
                                    <input type="number" value={txt.shadowOffset} onChange={(e) => updateText(txt.id, { shadowOffset: parseInt(e.target.value) || 0 })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs outline-none" />
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Danh sách Video</h2>
                {videos.length === 0 ? (
                  <div className="text-center p-6 border border-dashed border-neutral-700 rounded-lg text-neutral-500 text-sm">
                    Chưa có video nào.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {videos.map((vid, index) => (
                      <div 
                        key={vid.id} 
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${selectedId === vid.id ? 'bg-neutral-800 border-orange-500' : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'}`}
                        onClick={() => setSelectedId(vid.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-8 h-8 rounded bg-neutral-700 overflow-hidden shrink-0 flex items-center justify-center">
                              <Video className="w-4 h-4 text-orange-400" />
                            </div>
                            <span className="text-sm truncate">{vid.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); moveVideoUp(index); }} disabled={index === videos.length - 1} className="text-neutral-400 hover:text-white disabled:opacity-30 p-1"><ArrowDown className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); moveVideoDown(index); }} disabled={index === 0} className="text-neutral-400 hover:text-white disabled:opacity-30 p-1"><ArrowUp className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteVideo(vid.id); }} className="text-neutral-400 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        
                        {selectedId === vid.id && (
                          <div className="space-y-4 mt-3 pt-3 border-t border-neutral-700" onClick={e => e.stopPropagation()}>
                            {/* Video Settings */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] text-neutral-400 mb-1">Độ sáng (%)</label>
                                <input type="number" min="0" max="200" value={vid.brightness} onChange={(e) => updateVideo(vid.id, { brightness: parseInt(e.target.value) || 100 })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs outline-none focus:border-orange-500" />
                              </div>
                              <div className="flex items-end pb-1">
                                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                                  <input type="checkbox" checked={vid.loop} onChange={(e) => updateVideo(vid.id, { loop: e.target.checked })} className="rounded bg-neutral-900 border-neutral-700 text-orange-500 focus:ring-orange-500" />
                                  Lặp lại (Loop)
                                </label>
                              </div>
                            </div>

                            {/* Animation Settings */}
                            <div>
                              <label className="block text-xs text-neutral-400 mb-1 font-semibold">Chuyển động</label>
                              <select 
                                value={vid.animationType}
                                onChange={(e) => updateVideo(vid.id, { animationType: e.target.value as any })}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-sm focus:border-orange-500 outline-none mb-2"
                              >
                                <option value="none">Không có</option>
                                <option value="shake">Lắc (Shake)</option>
                                <option value="spin">Xoay (Spin)</option>
                                <option value="bounce">Nảy (Bounce)</option>
                                <option value="float">Trôi (Float)</option>
                                <option value="moveLeftRight">Di chuyển Trái-Phải</option>
                              </select>
                              
                              {vid.animationType !== 'none' && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-neutral-400 mb-1">Thời gian (s)</label>
                                    <input type="number" min="0.1" step="0.1" value={vid.duration} onChange={(e) => updateVideo(vid.id, { duration: parseFloat(e.target.value) || 1 })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs outline-none" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-neutral-400 mb-1">Biên độ (x)</label>
                                    <input type="number" min="0.1" max="5" step="0.1" value={vid.amplitude} onChange={(e) => updateVideo(vid.id, { amplitude: parseFloat(e.target.value) || 1 })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs outline-none" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Danh sách Ảnh (Layers)</h2>
                {images.length === 0 ? (
                  <div className="text-center p-6 border border-dashed border-neutral-700 rounded-lg text-neutral-500 text-sm">
                    Chưa có ảnh nào.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {images.map((img, index) => (
                      <div 
                        key={img.id} 
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${selectedId === img.id ? 'bg-neutral-800 border-blue-500' : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'}`}
                        onClick={() => setSelectedId(img.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-8 h-8 rounded bg-neutral-700 overflow-hidden shrink-0 relative">
                              <img src={img.url} alt="" className="w-full h-full object-cover" />
                              {img.altUrl && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></div>}
                            </div>
                            <span className="text-sm truncate">{img.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); moveImageUp(index); }} disabled={index === images.length - 1} className="text-neutral-400 hover:text-white disabled:opacity-30 p-1"><ArrowDown className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); moveImageDown(index); }} disabled={index === 0} className="text-neutral-400 hover:text-white disabled:opacity-30 p-1"><ArrowUp className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }} className="text-neutral-400 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        
                        {selectedId === img.id && (
                          <div className="space-y-4 mt-3 pt-3 border-t border-neutral-700" onClick={e => e.stopPropagation()}>
                            {/* Animation Settings */}
                            <div>
                              <label className="block text-xs text-neutral-400 mb-1 font-semibold">Chuyển động</label>
                              <select 
                                value={img.animationType}
                                onChange={(e) => updateImage(img.id, { animationType: e.target.value as any })}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-sm focus:border-blue-500 outline-none mb-2"
                              >
                                <option value="none">Không có</option>
                                <option value="shake">Lắc (Shake)</option>
                                <option value="spin">Xoay (Spin)</option>
                                <option value="bounce">Nảy (Bounce)</option>
                                <option value="float">Trôi (Float)</option>
                                <option value="moveLeftRight">Di chuyển Trái-Phải</option>
                              </select>
                              
                              {img.animationType !== 'none' && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-neutral-400 mb-1">Thời gian (s)</label>
                                    <input type="number" min="0.1" step="0.1" value={img.duration} onChange={(e) => updateImage(img.id, { duration: parseFloat(e.target.value) || 1 })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs outline-none" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-neutral-400 mb-1">Biên độ (x)</label>
                                    <input type="number" min="0.1" max="5" step="0.1" value={img.amplitude} onChange={(e) => updateImage(img.id, { amplitude: parseFloat(e.target.value) || 1 })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs outline-none" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Shadow Settings */}
                            <div className="pt-2 border-t border-neutral-700/50">
                              <label className="flex items-center gap-2 text-xs text-neutral-300 font-semibold mb-2 cursor-pointer">
                                <input type="checkbox" checked={img.dropShadow} onChange={(e) => updateImage(img.id, { dropShadow: e.target.checked })} className="rounded bg-neutral-900 border-neutral-700" />
                                Đổ bóng (Shadow)
                              </label>
                              {img.dropShadow && (
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-neutral-400 mb-1">Màu</label>
                                    <input type="color" value={img.shadowColor} onChange={(e) => updateImage(img.id, { shadowColor: e.target.value })} className="w-full h-7 bg-neutral-900 border border-neutral-700 rounded cursor-pointer" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-neutral-400 mb-1">Độ nhòe</label>
                                    <input type="number" value={img.shadowBlur} onChange={(e) => updateImage(img.id, { shadowBlur: parseInt(e.target.value) || 0 })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs outline-none" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-neutral-400 mb-1">Độ lệch</label>
                                    <input type="number" value={img.shadowOffset} onChange={(e) => updateImage(img.id, { shadowOffset: parseInt(e.target.value) || 0 })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs outline-none" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Transformation Settings */}
                            <div className="pt-2 border-t border-neutral-700/50">
                              <label className="block text-xs text-neutral-300 font-semibold mb-2">Biến đổi (Alt Image)</label>
                              <div className="flex items-center gap-2 mb-2">
                                {img.altUrl && (
                                  <div className="w-8 h-8 rounded bg-neutral-700 overflow-hidden shrink-0">
                                    <img src={img.altUrl} alt="" className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <label className="flex-1 flex items-center justify-center p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded cursor-pointer transition-colors border border-neutral-700 text-xs text-neutral-300">
                                  {img.altUrl ? 'Đổi ảnh khác' : 'Tải ảnh thay thế'}
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAltImageUpload(img.id, e)} />
                                </label>
                              </div>
                              {img.altUrl && (
                                <div>
                                  <label className="block text-[10px] text-neutral-400 mb-1">Tự động đổi (Loop) mỗi (giây)</label>
                                  <input type="number" min="0" step="0.5" value={img.autoSwapTime} onChange={(e) => updateImage(img.id, { autoSwapTime: parseFloat(e.target.value) || 0 })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs outline-none" placeholder="0 = tắt" />
                                </div>
                              )}
                            </div>

                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB: EFFECTS */}
          {activeTab === 'effects' && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Hiệu ứng Ánh sáng</h2>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => setGlobalLight('none')}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${globalLight === 'none' ? 'bg-blue-900/20 border-blue-500 text-blue-400' : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'}`}
                >
                  <SunMedium className="w-5 h-5" />
                  <div>
                    <div className="font-medium text-sm">Bình thường</div>
                    <div className="text-xs opacity-70">Không có hiệu ứng ánh sáng</div>
                  </div>
                </button>
                <button 
                  onClick={() => setGlobalLight('spotlight')}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${globalLight === 'spotlight' ? 'bg-blue-900/20 border-blue-500 text-blue-400' : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'}`}
                >
                  <Moon className="w-5 h-5" />
                  <div>
                    <div className="font-medium text-sm">Spotlight (Đèn rọi)</div>
                    <div className="text-xs opacity-70">Làm tối xung quanh, sáng ở giữa</div>
                  </div>
                </button>
                <button 
                  onClick={() => setGlobalLight('fireflies')}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${globalLight === 'fireflies' ? 'bg-blue-900/20 border-blue-500 text-blue-400' : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'}`}
                >
                  <Sparkles className="w-5 h-5" />
                  <div>
                    <div className="font-medium text-sm">Đom đóm (Fireflies)</div>
                    <div className="text-xs opacity-70">Hạt sáng bay lơ lửng trên màn hình</div>
                  </div>
                </button>
              </div>

              {/* CUSTOM LIGHTS */}
              <div className="space-y-3 mt-6 pt-6 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Đèn tùy chỉnh</h2>
                  <button onClick={createLight} className="p-1.5 bg-yellow-600 hover:bg-yellow-500 rounded text-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {lights.length === 0 ? (
                  <div className="text-center p-4 border border-dashed border-neutral-700 rounded-lg text-neutral-500 text-xs">
                    Chưa có đèn nào. Bấm nút + để thêm điểm sáng.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lights.map(light => (
                      <div 
                        key={light.id} 
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${selectedId === light.id ? 'bg-neutral-800 border-yellow-500' : 'bg-neutral-800/50 border-neutral-700'}`}
                        onClick={() => setSelectedId(light.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            <input 
                              value={light.name} 
                              onChange={(e) => updateLight(light.id, { name: e.target.value })}
                              className="bg-transparent border-b border-neutral-600 text-sm font-medium w-24 outline-none focus:border-yellow-500"
                              onClick={e => e.stopPropagation()}
                            />
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); deleteLight(light.id); }} className="text-neutral-400 hover:text-red-400 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {selectedId === light.id && (
                          <div className="space-y-3 mt-3 pt-3 border-t border-neutral-700" onClick={e => e.stopPropagation()}>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] text-neutral-400 mb-1">Màu sắc</label>
                                <input type="color" value={light.color} onChange={(e) => updateLight(light.id, { color: e.target.value })} className="w-full h-7 bg-neutral-900 border border-neutral-700 rounded cursor-pointer" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-neutral-400 mb-1">Hình dạng</label>
                                <select value={light.shape} onChange={(e) => updateLight(light.id, { shape: e.target.value as any })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-xs outline-none">
                                  <option value="circle">Tròn</option>
                                  <option value="star">Ngôi sao</option>
                                  <option value="glow">Tỏa sáng (Glow)</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] text-neutral-400 mb-1">Kích thước</label>
                                <input type="number" min="1" value={light.radius} onChange={(e) => updateLight(light.id, { radius: parseFloat(e.target.value) || 10 })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-xs outline-none" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-neutral-400 mb-1">Độ mờ (Blur)</label>
                                <input type="number" min="0" value={light.blur} onChange={(e) => updateLight(light.id, { blur: parseFloat(e.target.value) || 0 })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-xs outline-none" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-neutral-400 mb-1">Độ sáng</label>
                                <input type="number" min="0" max="1" step="0.1" value={light.intensity} onChange={(e) => updateLight(light.id, { intensity: parseFloat(e.target.value) || 1 })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-xs outline-none" />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] text-neutral-400 mb-1">Hiệu ứng chớp/tắt (Loop)</label>
                              <div className="flex gap-2">
                                <select value={light.animationType} onChange={(e) => updateLight(light.id, { animationType: e.target.value as any })} className="flex-1 bg-neutral-900 border border-neutral-700 rounded p-1 text-xs outline-none">
                                  <option value="none">Không</option>
                                  <option value="fade">Từ từ (Fade)</option>
                                  <option value="blink">Đột ngột (Blink)</option>
                                </select>
                                {light.animationType !== 'none' && (
                                  <input type="number" min="0.1" step="0.1" value={light.duration} onChange={(e) => updateLight(light.id, { duration: parseFloat(e.target.value) || 1 })} className="w-16 bg-neutral-900 border border-neutral-700 rounded p-1 text-xs outline-none" placeholder="Giây" title="Thời gian loop (giây)" />
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ACTIONS */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Nút Biến Đổi</h2>
                <button onClick={createActionButton} className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {actionButtons.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-neutral-700 rounded-lg text-neutral-500 text-sm">
                  Chưa có nút nào. Hãy tạo nút để thay đổi trạng thái ảnh khi bấm.
                </div>
              ) : (
                <div className="space-y-3">
                  {actionButtons.map(btn => (
                    <div key={btn.id} className="p-3 bg-neutral-800 rounded-lg border border-neutral-700">
                      <div className="flex items-center justify-between mb-2">
                        <input 
                          value={btn.name} 
                          onChange={(e) => updateActionButton(btn.id, { name: e.target.value })} 
                          className="bg-transparent border-b border-neutral-600 text-sm font-medium w-2/3 outline-none focus:border-blue-500"
                        />
                        <button onClick={() => deleteActionButton(btn.id)} className="text-neutral-400 hover:text-red-400 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="text-xs text-neutral-400 mb-1.5">Chọn ảnh sẽ bị thay đổi:</div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {images.map(img => (
                          <label key={img.id} className="flex items-center gap-1 text-xs bg-neutral-900 px-2 py-1 rounded border border-neutral-700 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={btn.targetIds.includes(img.id)} 
                              onChange={(e) => {
                                const newIds = e.target.checked 
                                  ? [...btn.targetIds, img.id] 
                                  : btn.targetIds.filter(id => id !== img.id);
                                updateActionButton(btn.id, { targetIds: newIds });
                              }}
                              className="rounded bg-neutral-800 border-neutral-600"
                            />
                            {img.name}
                          </label>
                        ))}
                      </div>
                      
                      <button 
                        onClick={() => triggerAction(btn.id)} 
                        className="w-full py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        BẤM ĐỂ ĐỔI ẢNH
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export Section */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900">
          <div className="mb-3">
            <label className="block text-xs text-neutral-400 mb-1">Thời lượng xuất video (giây)</label>
            <input 
              type="number" 
              min="1" max="300"
              value={recordDuration}
              onChange={(e) => setRecordDuration(parseInt(e.target.value) || 5)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm focus:border-blue-500 outline-none"
              disabled={isRecording}
            />
          </div>
          
          <button 
            onClick={startRecording}
            disabled={isRecording || images.length === 0}
            className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
              isRecording 
                ? 'bg-neutral-800 text-neutral-400 cursor-not-allowed' 
                : images.length === 0
                  ? 'bg-blue-600/50 text-neutral-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
            }`}
          >
            {isRecording ? (
              <>
                <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                Đang ghi... {Math.round(recordingProgress)}%
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Xuất Video (.webm)
              </>
            )}
          </button>
          
          {isRecording && (
            <div className="mt-2 h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-100 ease-linear"
                style={{ width: `${recordingProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Main Area */}
      <div className="flex-1 flex flex-col relative bg-neutral-950">
        {/* Topbar */}
        <div className="h-14 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-900/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-md text-sm font-medium transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Tạm dừng' : 'Phát'}
            </button>
            <span className="text-xs text-neutral-500 flex items-center gap-1">
              <MousePointer2 className="w-3 h-3" />
              Kéo thả ảnh/đèn trên khung hình để di chuyển
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-400/10 px-3 py-1.5 rounded-md border border-amber-400/20">
            <Info className="w-4 h-4" />
            <span>Web App - Có thể đóng gói thành .exe bằng Electron</span>
          </div>
        </div>
        
        {/* Canvas Container */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')]">
           <div className="relative shadow-2xl shadow-black/50 ring-1 ring-neutral-800 rounded-lg overflow-hidden bg-[#171717]">
             <canvas 
               ref={canvasRef}
               width={CANVAS_WIDTH}
               height={CANVAS_HEIGHT}
               onMouseDown={handleMouseDown}
               onMouseMove={handleMouseMove}
               onMouseUp={handleMouseUp}
               onMouseLeave={handleMouseUp}
               className="max-w-full h-auto cursor-move"
               style={{ 
                 width: '100%', 
                 maxWidth: `${CANVAS_WIDTH}px`,
                 aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`
               }}
             />
             
             {/* Resolution Badge */}
             <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-neutral-400 font-mono pointer-events-none">
               {CANVAS_WIDTH} x {CANVAS_HEIGHT}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
