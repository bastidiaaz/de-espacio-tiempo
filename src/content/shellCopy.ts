/**
 * Shell interface copy (menu, act select, options). PROVISIONAL: functional labels only;
 * the author rewrites them in UI-02. "Seleccionar acto" and "Volver al menú principal" are the author's.
 */
export const SHELL_COPY = {
  selectAct: 'Seleccionar acto',
  back: 'Volver',
  actLabel: (roman: string, title?: string) => (title ? `Acto ${roman} — ${title}` : `Acto ${roman}`),
  loadError: 'No se pudo cargar el acto.',
  options: 'Opciones',
  resume: 'Continuar',
  sound: 'Sonido',
  pixels: 'Píxeles',
  toMenu: 'Volver al menú principal',
  lookSensitivity: 'Sensibilidad de cámara',
  lookValue: (x: number) => `×${String(x).replace('.', ',')}`,
  textSize: 'Tamaño de texto',
  textSizes: { 1: 'Normal', 1.25: 'Grande', 1.5: 'Muy grande' } as Record<number, string>,
} as const;
