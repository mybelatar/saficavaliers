export type NotificationSoundKind =
  | 'NEW_ORDER'
  | 'ORDER_READY'
  | 'STATUS_CHANGED'
  | 'STOCK_ALERT'
  | 'RESERVATION';

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (sharedAudioContext) {
    return sharedAudioContext;
  }

  const AudioContextClass =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  sharedAudioContext = new AudioContextClass();
  return sharedAudioContext;
}

function scheduleTone(
  context: AudioContext,
  startAt: number,
  frequency: number,
  duration: number,
  peakGain = 0.14
) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.03);
}

export async function primeNotificationAudio() {
  const context = getAudioContext();
  if (!context) {
    return false;
  }

  if (context.state === 'suspended') {
    await context.resume();
  }

  return context.state === 'running';
}

export async function playNotificationSound(kind: NotificationSoundKind) {
  const context = getAudioContext();
  if (!context) {
    return false;
  }

  if (!(await primeNotificationAudio())) {
    return false;
  }

  const startAt = context.currentTime + 0.01;

  if (kind === 'NEW_ORDER') {
    scheduleTone(context, startAt, 920, 0.11);
    scheduleTone(context, startAt + 0.14, 920, 0.11);
    scheduleTone(context, startAt + 0.28, 760, 0.14);
    return true;
  }

  if (kind === 'ORDER_READY') {
    scheduleTone(context, startAt, 640, 0.1);
    scheduleTone(context, startAt + 0.13, 880, 0.2);
    return true;
  }

  if (kind === 'STOCK_ALERT') {
    scheduleTone(context, startAt, 520, 0.16);
    scheduleTone(context, startAt + 0.2, 520, 0.16);
    scheduleTone(context, startAt + 0.4, 440, 0.24);
    return true;
  }

  if (kind === 'RESERVATION') {
    scheduleTone(context, startAt, 700, 0.09);
    scheduleTone(context, startAt + 0.11, 820, 0.12);
    return true;
  }

  scheduleTone(context, startAt, 720, 0.12);
  return true;
}
