'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject
} from 'react';
import { Rnd } from 'react-rnd';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

export type LayerType = 'text' | 'image';

export interface BaseLayer {
  id: string;
  name: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  color: string;
  align: 'left' | 'center' | 'right';
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;
  fit: 'cover' | 'contain';
  opacity: number;
}

export type Layer = TextLayer | ImageLayer;

interface CanvasPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

export type JobStatus = 'pending' | 'success' | 'error';
export interface EditorJob {
  id: string;
  action: 'enhance' | 'img2img' | 'caption';
  status: JobStatus;
  message?: string;
  url?: string;
}

interface EditorState {
  layers: Layer[];
  activeLayerId: string | null;
  canvas: {
    presetId: string;
    width: number;
    height: number;
    background: string;
  };
  zoom: number;
  pan: { x: number; y: number };
  filters: { brightness: number; contrast: number; saturation: number };
  flip: { horizontal: boolean; vertical: boolean };
  rotation: number;
  panMode: boolean;
  jobs: EditorJob[];
}

const CANVAS_PRESETS: CanvasPreset[] = [
  { id: 'square', label: 'Instagram 1:1', width: 1080, height: 1080 },
  { id: 'story', label: 'Stories 9:16', width: 1080, height: 1920 },
  { id: 'post45', label: 'Feed 4:5', width: 1080, height: 1350 },
  { id: 'landscape', label: 'Video 16:9', width: 1920, height: 1080 }
];

const initialLayers: Layer[] = [
  {
    id: 'layer-headline',
    name: 'Headline',
    type: 'text',
    text: 'Promo Laris Hari Ini',
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: 700,
    fontSize: 64,
    color: '#F8FAFC',
    align: 'left',
    x: 120,
    y: 160,
    width: 560,
    height: 140,
    rotation: 0,
    visible: true
  },
  {
    id: 'layer-sub',
    name: 'Subheadline',
    type: 'text',
    text: 'Diskon spesial semua menu kopi susu & pastry.',
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: 500,
    fontSize: 32,
    color: '#CBD5F5',
    align: 'left',
    x: 120,
    y: 320,
    width: 520,
    height: 120,
    rotation: 0,
    visible: true
  },
  {
    id: 'layer-image',
    name: 'Foto Produk',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=60',
    fit: 'cover',
    opacity: 1,
    x: 660,
    y: 180,
    width: 320,
    height: 420,
    rotation: 0,
    visible: true
  }
];

const initialState: EditorState = {
  layers: initialLayers,
  activeLayerId: initialLayers[0]?.id ?? null,
  canvas: {
    presetId: CANVAS_PRESETS[0].id,
    width: CANVAS_PRESETS[0].width,
    height: CANVAS_PRESETS[0].height,
    background: 'linear-gradient(135deg,#111827,#1f2937)'
  },
  zoom: 0.6,
  pan: { x: 0, y: 0 },
  filters: { brightness: 100, contrast: 100, saturation: 100 },
  flip: { horizontal: false, vertical: false },
  rotation: 0,
  panMode: false,
  jobs: []
};

interface EditorAction {
  type:
    | 'set-active'
    | 'update-layer'
    | 'add-layer'
    | 'remove-layer'
    | 'reorder-layer'
    | 'set-zoom'
    | 'set-pan'
    | 'set-canvas'
    | 'set-filters'
    | 'rotate'
    | 'toggle-flip'
    | 'set-pan-mode'
    | 'set-layers'
    | 'apply-template'
    | 'job-upsert';
  payload?: any;
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'set-active':
      return { ...state, activeLayerId: action.payload as string };
    case 'update-layer': {
      const { id, updates } = action.payload as { id: string; updates: Partial<Layer> };
      return {
        ...state,

        layers: state.layers.map((layer) => {
          if (layer.id !== id) return layer;
          const nextLayer = { ...layer, ...updates } as Layer;
          return nextLayer;
        })

      };
    }
    case 'add-layer': {
      const layer = action.payload as Layer;
      return { ...state, layers: [...state.layers, layer], activeLayerId: layer.id };
    }
    case 'remove-layer': {
      const id = action.payload as string;
      const filtered = state.layers.filter((layer) => layer.id !== id);
      return {
        ...state,
        layers: filtered,
        activeLayerId: state.activeLayerId === id ? filtered[filtered.length - 1]?.id ?? null : state.activeLayerId
      };
    }
    case 'reorder-layer': {
      const { id, direction } = action.payload as { id: string; direction: 'up' | 'down' };
      const layers = [...state.layers];
      const index = layers.findIndex((layer) => layer.id === id);
      if (index === -1) return state;
      const targetIndex = direction === 'up' ? Math.max(0, index - 1) : Math.min(layers.length - 1, index + 1);
      if (targetIndex === index) return state;
      const [item] = layers.splice(index, 1);
      layers.splice(targetIndex, 0, item);
      return { ...state, layers };
    }
    case 'set-zoom':
      return { ...state, zoom: action.payload as number };
    case 'set-pan':
      return { ...state, pan: action.payload as { x: number; y: number } };
    case 'set-canvas':
      return { ...state, canvas: { ...state.canvas, ...(action.payload as Partial<EditorState['canvas']>) } };
    case 'set-filters':
      return { ...state, filters: { ...state.filters, ...(action.payload as Partial<EditorState['filters']>) } };
    case 'rotate':
      return { ...state, rotation: (state.rotation + (action.payload as number)) % 360 };
    case 'toggle-flip': {
      const axis = action.payload as 'horizontal' | 'vertical';
      return { ...state, flip: { ...state.flip, [axis]: !state.flip[axis] } };
    }
    case 'set-pan-mode':
      return { ...state, panMode: action.payload as boolean };
    case 'set-layers':
      return { ...state, layers: action.payload as Layer[] };
    case 'apply-template':
      return {
        ...state,
        canvas: { ...state.canvas, background: action.payload.background },
        layers: action.payload.layers,
        activeLayerId: action.payload.layers[0]?.id ?? null
      };
    case 'job-upsert': {
      const job = action.payload as EditorJob;
      const existingIndex = state.jobs.findIndex((item) => item.id === job.id);
      if (existingIndex > -1) {
        const clone = [...state.jobs];
        clone[existingIndex] = job;
        return { ...state, jobs: clone };
      }
      return { ...state, jobs: [...state.jobs, job] };
    }
    default:
      return state;
  }
}

export interface EditorStore {
  state: EditorState;
  presets: CanvasPreset[];

  artboardRef: RefObject<HTMLDivElement | null>;

  actions: {
    setActiveLayer: (id: string) => void;
    updateLayer: (id: string, updates: Partial<Layer>) => void;
    addTextLayer: () => void;
    removeLayer: (id: string) => void;
    reorderLayer: (id: string, direction: 'up' | 'down') => void;
    setZoom: (value: number) => void;
    setPan: (pan: { x: number; y: number }) => void;
    setCanvasPreset: (presetId: string) => void;
    setFilters: (filters: Partial<EditorState['filters']>) => void;
    rotateCanvas: (deg: number) => void;
    toggleFlip: (axis: 'horizontal' | 'vertical') => void;
    setPanMode: (value: boolean) => void;
    applyTemplate: (template: { id: string; name: string; background: string; description: string }) => void;
    upsertJob: (job: EditorJob) => void;
  };
}

const EditorContext = createContext<EditorStore | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const artboardRef = useRef<HTMLDivElement>(null);

  const store = useMemo<EditorStore>(() => {
    return {
      state,
      presets: CANVAS_PRESETS,
      artboardRef,
      actions: {
        setActiveLayer: (id) => dispatch({ type: 'set-active', payload: id }),
        updateLayer: (id, updates) => dispatch({ type: 'update-layer', payload: { id, updates } }),
        addTextLayer: () => {
          const id = crypto.randomUUID();
          const layer: TextLayer = {
            id,
            name: `Teks ${state.layers.length + 1}`,
            type: 'text',
            text: 'Teks baru',
            fontFamily: 'Plus Jakarta Sans',
            fontWeight: 600,
            fontSize: 40,
            color: '#F8FAFC',
            align: 'left',
            x: 120,
            y: 120 + state.layers.length * 40,
            width: 420,
            height: 120,
            rotation: 0,
            visible: true
          };
          dispatch({ type: 'add-layer', payload: layer });
        },
        removeLayer: (id) => dispatch({ type: 'remove-layer', payload: id }),
        reorderLayer: (id, direction) => dispatch({ type: 'reorder-layer', payload: { id, direction } }),
        setZoom: (value) => dispatch({ type: 'set-zoom', payload: value }),
        setPan: (pan) => dispatch({ type: 'set-pan', payload: pan }),
        setCanvasPreset: (presetId) => {
          const preset = CANVAS_PRESETS.find((item) => item.id === presetId) ?? CANVAS_PRESETS[0];
          dispatch({ type: 'set-canvas', payload: { presetId: preset.id, width: preset.width, height: preset.height } });
        },
        setFilters: (filters) => dispatch({ type: 'set-filters', payload: filters }),
        rotateCanvas: (deg) => dispatch({ type: 'rotate', payload: deg }),
        toggleFlip: (axis) => dispatch({ type: 'toggle-flip', payload: axis }),
        setPanMode: (value) => dispatch({ type: 'set-pan-mode', payload: value }),
        applyTemplate: (template) => {
          const baseLayers: Layer[] = [
            {
              id: crypto.randomUUID(),
              name: `${template.name} Headline`,
              type: 'text',
              text: template.name,
              fontFamily: 'Plus Jakarta Sans',
              fontWeight: 700,
              fontSize: 60,
              color: '#FFFFFF',
              align: 'left',
              x: 120,
              y: 180,
              width: 520,
              height: 140,
              rotation: 0,
              visible: true
            },
            {
              id: crypto.randomUUID(),
              name: 'Deskripsi',
              type: 'text',
              text: template.description,
              fontFamily: 'Plus Jakarta Sans',
              fontWeight: 500,
              fontSize: 30,
              color: '#CBD5F5',
              align: 'left',
              x: 120,
              y: 320,
              width: 520,
              height: 120,
              rotation: 0,
              visible: true
            },
            {
              id: crypto.randomUUID(),
              name: 'Foto Template',
              type: 'image',
              src: (template as any).thumbnail ?? 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=60',
              fit: 'cover',
              opacity: 1,
              x: 620,
              y: 180,
              width: 340,
              height: 420,
              rotation: 0,
              visible: true
            }
          ];
          dispatch({ type: 'apply-template', payload: { layers: baseLayers, background: template.background } });
        },
        upsertJob: (job) => dispatch({ type: 'job-upsert', payload: job })
      }
    };
  }, [state]);

  return <EditorContext.Provider value={store}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return ctx;
}

function usePanHandlers() {
  const {
    state: { pan, panMode },
    actions: { setPan }
  } = useEditor();
  const pointer = useRef<{ id: number; startX: number; startY: number; originPan: { x: number; y: number } } | null>(null);

  const start = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panMode && event.pointerType !== 'touch' && !event.shiftKey) return;
    event.preventDefault();
    pointer.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originPan: pan
    };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointer.current || event.pointerId !== pointer.current.id) return;
    const dx = event.clientX - pointer.current.startX;
    const dy = event.clientY - pointer.current.startY;
    setPan({ x: pointer.current.originPan.x + dx, y: pointer.current.originPan.y + dy });
  };

  const end = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointer.current || event.pointerId !== pointer.current.id) return;
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    pointer.current = null;
  };

  return { start, move, end };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function EditorCanvas() {
  const {
    state: { layers, activeLayerId, canvas, zoom, pan, filters, flip, rotation },
    actions: { setActiveLayer, updateLayer, setZoom }
  } = useEditor();
  const { artboardRef } = useEditor();
  const { start, move, end } = usePanHandlers();
  const [isDragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    const artboard = artboardRef.current;
    if (!artboard) return;
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const nextZoom = clamp(zoom - event.deltaY * 0.001, 0.3, 2.2);
        setZoom(Number(nextZoom.toFixed(2)));
      }
    };
    artboard.addEventListener('wheel', handleWheel, { passive: false });
    return () => artboard.removeEventListener('wheel', handleWheel);
  }, [zoom, setZoom, artboardRef]);

  const transform = [
    `translate(${pan.x}px, ${pan.y}px)`,
    `scale(${zoom})`,
    `rotate(${rotation}deg)`,
    flip.horizontal ? 'scaleX(-1)' : '',
    flip.vertical ? 'scaleY(-1)' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const filterString = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;

  return (
    <div className="relative flex min-h-[520px] flex-1 flex-col rounded-2xl border border-white/10 bg-surface/60 p-4">
      <div className="flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-black/40">
        <div
          ref={artboardRef}
          className="relative h-full w-full touch-none"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        >
          <motion.div
            className="relative mx-auto flex origin-center"
            style={{ transform }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          >
            <div
              className="relative"
              style={{
                width: canvas.width,
                height: canvas.height,
                filter: filterString,
                backgroundImage: `${canvas.background}, linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
                backgroundBlendMode: 'normal, screen, screen',
                backgroundSize: `auto, 40px 40px, 40px 40px`
              }}
            >
              {layers.map((layer, index) => {
                if (!layer.visible) return null;
                const isActive = layer.id === activeLayerId;
                return (
                  <Rnd
                    key={layer.id}
                    className={cn('group absolute', isActive ? 'z-50' : 'z-40')}
                    size={{ width: layer.width, height: layer.height }}
                    position={{ x: layer.x, y: layer.y }}
                    bounds="parent"
                    grid={[8, 8]}
                    enableResizing
                    onDragStart={() => {
                      setActiveLayer(layer.id);
                      setDragging(layer.id);
                    }}
                    onDragStop={(_, data) => {
                      setDragging(null);
                      updateLayer(layer.id, { x: Math.round(data.x), y: Math.round(data.y) });
                    }}
                    onResize={(e, _dir, ref, _delta, position) => {
                      updateLayer(layer.id, {
                        width: Math.round(ref.offsetWidth),
                        height: Math.round(ref.offsetHeight),
                        x: Math.round(position.x),
                        y: Math.round(position.y)
                      });
                    }}
                    onClick={() => setActiveLayer(layer.id)}
                  >
                    <div
                      className={cn(
                        'relative h-full w-full cursor-move rounded-xl border border-transparent bg-white/5 p-4',
                        isActive && 'border-primary/60 shadow-[0_0_0_2px_rgba(59,130,246,0.35)]'
                      )}
                    >
                      {layer.type === 'text' ? (
                        <div
                          className="h-full w-full cursor-text"
                          contentEditable={isActive}
                          suppressContentEditableWarning
                          style={{
                            fontFamily: layer.fontFamily,
                            fontWeight: layer.fontWeight,
                            fontSize: layer.fontSize,
                            color: layer.color,
                            textAlign: layer.align as CanvasTextAlign
                          }}
                          onBlur={(event) =>
                            updateLayer(layer.id, {
                              text: event.currentTarget.textContent ?? layer.text
                            })
                          }
                        >
                          {layer.text}
                        </div>
                      ) : (
                        <img
                          src={layer.src}
                          alt={layer.name}
                          className="h-full w-full rounded-lg object-cover"
                          style={{
                            objectFit: layer.fit,
                            opacity: layer.opacity
                          }}
                        />
                      )}
                      {isActive && !isDragging ? (
                        <span className="pointer-events-none absolute -top-8 left-0 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white">
                          {layer.name}
                        </span>
                      ) : null}
                    </div>
                  </Rnd>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
        Geser dengan mode pan atau gestur sentuh, cubit untuk zoom, dan gunakan grid 8px untuk presisi.
      </p>
    </div>
  );
}
