/**
 * Minor League Major Filtration — Main entry point
 * Initializes all systems and starts the game loop.
 */

import { GameLoop } from './engine/GameLoop.js';
import { StateManager } from './engine/StateManager.js';
import { EventBus } from './engine/EventBus.js';
import { SaveLoad } from './engine/saveLoad.js';
import { CanvasRenderer } from './rendering/CanvasRenderer.js';
import { SpriteSystem } from './rendering/SpriteSystem.js';
import { TileMap } from './rendering/TileMap.js';
import { ConsequenceRenderer } from './rendering/ConsequenceRenderer.js';
import { ZoneManager } from './rendering/ZoneManager.js';
import { FiltrationSystem } from './systems/FiltrationSystem.js';
import { EconomySystem } from './systems/EconomySystem.js';
import { EventSystem } from './systems/EventSystem.js';
import { ProgressionSystem } from './systems/ProgressionSystem.js';
import { StorySystem } from './systems/StorySystem.js';
import { StaffSystem } from './systems/StaffSystem.js';
import { RivalSystem } from './systems/RivalSystem.js';
import { SchemesSystem } from './systems/SchemesSystem.js';
import { MediaSystem } from './systems/MediaSystem.js';
import { ResearchSystem } from './systems/ResearchSystem.js';
import { ConsequenceSystem } from './systems/ConsequenceSystem.js';
import { MarketSystem } from './systems/MarketSystem.js';
import { HUD } from './ui/HUD.js';
import { PanelManager } from './ui/PanelManager.js';
import { TooltipManager } from './ui/TooltipManager.js';
import { InputManager } from './ui/InputManager.js';
import { NotificationManager, TutorialManager, showConfirmDialog, showOffSeasonEventDialog, showDomainPickerDialog } from './ui/notifications.js';
import { MenuManager } from './ui/menus.js';

import { registerFilterInspectorPanel } from './ui/FilterInspectorPanel.js';
import { DialogueBox } from './ui/DialogueBox.js';
import { CutsceneRenderer } from './ui/CutsceneRenderer.js';
import { registerJournalPanel } from './ui/JournalPanel.js';
import { StaffPanel } from './ui/StaffPanel.js';
import { NewspaperPanel } from './ui/NewspaperPanel.js';
import { ContractPanel } from './ui/ContractPanel.js';
import { TechTreePanel } from './ui/TechTreePanel.js';
import { SystemsPanel } from './ui/SystemsPanel.js';
import { ExpansionPanel } from './ui/ExpansionPanel.js';
import { EconomyPanel } from './ui/EconomyPanel.js';
import { ObjectivesPanel } from './ui/ObjectivesPanel.js';
import { NPCContactsPanel } from './ui/NPCContactsPanel.js';
import { GiftShopPanel } from './ui/GiftShopPanel.js';
import { SchemesPanel } from './ui/SchemesPanel.js';
import { MiniGame } from './ui/MiniGame.js';
import { SettingsPanel } from './ui/SettingsPanel.js';
import { HelpPanel } from './ui/HelpPanel.js';
import { StatsPanel } from './ui/StatsPanel.js';
import { AchievementPanel } from './ui/AchievementPanel.js';
import { SeasonSummaryPanel } from './ui/SeasonSummaryPanel.js';
import { FilterAnalyticsPanel } from './ui/FilterAnalyticsPanel.js';
import { StatsTracker } from './systems/StatsTracker.js';
import { GuidedTutorial } from './systems/GuidedTutorial.js';
import { PrestigeSystem } from './systems/PrestigeSystem.js';
import { PrestigeMenu } from './ui/PrestigeMenu.js';
import { ZoneNavigator } from './ui/ZoneNavigator.js';
import { AudioManager } from './audio/audioManager.js';
import { MusicGenerator } from './audio/musicGenerator.js';
import { InteractiveObjects } from './rendering/InteractiveObjects.js';
import { ParticleSystem, FloatingTextSystem, ScreenShake, ScreenFlash, IncomeBreakdown, EventBanner } from './rendering/particles.js';
import { CrowdSystem } from './rendering/CrowdSystem.js';
import { PIXEL_SPRITES } from './assets/pixelSprites.js';
import { MobileAdapter } from './ui/MobileAdapter.js';
import { GAME_CONFIG } from './data/gameConfig.js';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 320;
const PIXEL_SCALE = 3;

function init() {
  const canvas = document.getElementById('game-canvas');
  const uiOverlay = document.getElementById('ui-overlay');

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.style.width = `${CANVAS_WIDTH * PIXEL_SCALE}px`;
  canvas.style.height = `${CANVAS_HEIGHT * PIXEL_SCALE}px`;

  // Core engine
  const eventBus = new EventBus();
  const state = new StateManager(eventBus, GAME_CONFIG);
  const prestige = new PrestigeSystem();
  const saveLoad = new SaveLoad(state, eventBus);
  const renderer = new CanvasRenderer(canvas);
  const sprites = new SpriteSystem();
  sprites.registerPixelSprites(PIXEL_SPRITES);
  const tileMap = new TileMap();
  const consequenceRenderer = new ConsequenceRenderer();
  tileMap.setConsequenceRenderer(consequenceRenderer);
  const particles = new ParticleSystem();
  const floatingText = new FloatingTextSystem(uiOverlay, PIXEL_SCALE);
  const screenShake = new ScreenShake();
  const screenFlash = new ScreenFlash();
  const incomeBreakdown = new IncomeBreakdown(eventBus, uiOverlay, PIXEL_SCALE);
  const eventBanner = new EventBanner(eventBus, uiOverlay);

  // Crowd system (walking characters in each zone)
  const crowd = new CrowdSystem(state, eventBus);

  // Zone management
  const zoneManager = new ZoneManager(tileMap, state, eventBus);

  // Register field zone (uses the grid already generated by TileMap)
  zoneManager.registerZone('field', {
    name: 'Field Overview',
    description: 'Stadium cross-section overview',
    grid: tileMap.tiles,
    ventSlots: [],
    icon: '\u26be',
    color: '#00e436',
  });

  // Generate and register other zones
  const zoneList = ['concourse', 'mechanical', 'underground', 'luxury', 'pressbox'];
  const zoneNames = {
    concourse: { name: 'Concourse', description: 'Fan walkways & concessions', icon: '\ud83c\udfdf', color: '#29adff' },
    mechanical: { name: 'Mechanical Room', description: 'HVAC & filtration hub', icon: '\u2699', color: '#ffa300' },
    underground: { name: 'Underground', description: 'Drainage & water systems', icon: '\ud83d\udd27', color: '#7e2553' },
    luxury: { name: 'Luxury Suites', description: 'VIP boxes & premium areas', icon: '\u2b50', color: '#ffec27' },
    pressbox: { name: 'Press Box', description: 'Media & scoreboard control', icon: '\ud83d\udce1', color: '#ff77a8' },
  };
  for (const z of zoneList) {
    const gen = tileMap[`_generate${z.charAt(0).toUpperCase() + z.slice(1)}Grid`]();
    zoneManager.registerZone(z, { ...zoneNames[z], ...gen });
  }

  // Clear particles, floating text, and screen flash on zone change
  eventBus.on('zone:changed', () => {
    particles.clear();
    floatingText.clear();
    screenFlash.clear();
  });

  // On save load or new game, sync ZoneManager + TileMap to the restored zone
  eventBus.on('state:loaded', () => {
    const targetZone = state.currentZone ?? 'field';
    const zoneDef = zoneManager.getZone(targetZone);
    if (zoneDef) {
      // Force ZoneManager and TileMap to the correct zone without transition
      zoneManager._activeZone = targetZone;
      tileMap.setGrid(zoneDef.grid, zoneDef.ventSlots, targetZone);
    }
  });

  // Game systems
  const filtration = new FiltrationSystem(state, eventBus);
  const economy = new EconomySystem(state, eventBus);
  const events = new EventSystem(state, eventBus);
  const progression = new ProgressionSystem(state, eventBus);
  state._progressionSystem = progression;
  const story = new StorySystem(state, eventBus);
  const staffSystem = new StaffSystem(state, eventBus);
  const rival = new RivalSystem(state, eventBus);
  state._rivalSystem = rival;
  const schemes = new SchemesSystem(state, eventBus);
  const media = new MediaSystem(state, eventBus);
  const research = new ResearchSystem(state, eventBus);
  const consequences = new ConsequenceSystem(state, eventBus);
  const marketSystem = new MarketSystem(state, eventBus);

  // UI
  const notifications = new NotificationManager(uiOverlay, eventBus);
  const tooltips = new TooltipManager(uiOverlay, state, eventBus);
  const panels = new PanelManager(uiOverlay, state, eventBus);
  const hud = new HUD(uiOverlay, state, eventBus, zoneManager);
  const menus = new MenuManager(uiOverlay, state, eventBus);
  menus.setSaveLoad(saveLoad);
  menus.setPrestige(prestige);
  const interactiveObjects = new InteractiveObjects(state, eventBus);
  const mobile = new MobileAdapter(canvas, uiOverlay, eventBus);
  const input = new InputManager(canvas, uiOverlay, state, eventBus, tileMap, tooltips, zoneManager, interactiveObjects, crowd, mobile);
  const zoneNav = new ZoneNavigator(uiOverlay, zoneManager, state, eventBus);

  // Register enhanced filter inspector (adds upgrade support to built-in)
  registerFilterInspectorPanel(panels, state, eventBus);

  // Provide sprite system to notifications for story mini-portraits
  notifications.setSprites(sprites);

  // Tutorial / onboarding hints for new players
  const tutorial = new TutorialManager(uiOverlay, state, eventBus);

  // Story UI: dialogue, cutscenes, journal
  const dialogueBox = new DialogueBox(uiOverlay, state, eventBus, sprites);
  const cutscene = new CutsceneRenderer(uiOverlay, state, eventBus, sprites);
  registerJournalPanel(panels, state, eventBus, sprites);

  // Staff UI & mini-games
  const staffPanel = new StaffPanel(uiOverlay, state, eventBus, staffSystem);
  const miniGame = new MiniGame(uiOverlay, state, eventBus, staffSystem);

  // World UI: newspaper (media), contracts, and tech tree
  const newspaperPanel = new NewspaperPanel(panels, state, eventBus);
  const contractPanel = new ContractPanel(panels, state, eventBus);
  const techTreePanel = new TechTreePanel(panels, state, eventBus, research);
  const systemsPanel = new SystemsPanel(panels, state, eventBus, zoneManager);
  const expansionPanel = new ExpansionPanel(panels, state, eventBus);
  const economyPanel = new EconomyPanel(panels, state, eventBus);
  const filterAnalyticsPanel = new FilterAnalyticsPanel(panels, state, eventBus, zoneManager);
  const objectivesPanel = new ObjectivesPanel(uiOverlay, state, eventBus);
  const contactsPanel = new NPCContactsPanel(uiOverlay, state, eventBus);
  const giftShopPanel = new GiftShopPanel(uiOverlay, state, eventBus);
  const schemesPanel = new SchemesPanel(uiOverlay, state, eventBus, schemes);
  const statsPanel = new StatsPanel(uiOverlay, state, eventBus);
  const achievementPanel = new AchievementPanel(uiOverlay, state, eventBus);
  const seasonSummaryPanel = new SeasonSummaryPanel(uiOverlay, state, eventBus);
  const prestigeMenu = new PrestigeMenu(uiOverlay, state, eventBus, prestige);

  // Statistics tracker (listens to events, updates state.stats)
  const statsTracker = new StatsTracker(state, eventBus);

  // Guided onboarding for first-time players
  const guidedTutorial = new GuidedTutorial(uiOverlay, state, eventBus);

  // TileMap generates its own stadium cross-section layout in the constructor

  // Audio
  const audio = new AudioManager(eventBus, state);
  const music = new MusicGenerator(audio, eventBus, state);
  // Ensure audio initializes on first touch (mobile devices)
  document.addEventListener('touchstart', () => audio.init(), { once: true });

  // ── Daily event log for Hank's Journal ──
  eventBus.on('event:started', (evt) => {
    state.logEvent(evt.description ?? evt.name, evt.isPositive ? 'positive' : 'negative');
  });
  eventBus.on('inspection:result', ({ grade, repChange }) => {
    state.logEvent(`Health inspection: Grade ${grade} (rep ${repChange >= 0 ? '+' : ''}${repChange})`, grade === 'A' || grade === 'B' ? 'positive' : 'negative');
  });
  eventBus.on('rival:sabotageAlert', (data) => {
    state.logEvent(`Sabotage: ${data.title}${data.impact ? ` — ${data.impact}` : ''}`, 'danger');
  });
  eventBus.on('rival:sabotageBlocked', (data) => {
    state.logEvent(`Sabotage blocked: ${data.name}`, 'positive');
  });
  eventBus.on('filter:broken', (f) => {
    state.logEvent(`Equipment #${f.id} broke down (${f.domain ?? 'unknown'})`, 'negative');
  });
  eventBus.on('progression:achievement', (m) => {
    state.logEvent(`Achievement: ${m.name}`, 'positive');
  });
  eventBus.on('progression:tierChange', ({ to, promoted }) => {
    if (to?.name) state.logEvent(promoted ? `Promoted to ${to.name}!` : `Sent down to ${to.name}`, promoted ? 'positive' : 'negative');
  });
  eventBus.on('contract:accepted', (c) => {
    state.logEvent(`Contract signed: ${c.sponsor ?? c.name ?? 'New sponsor'}`, 'positive');
  });
  eventBus.on('contract:lost', (c) => {
    state.logEvent(`Contract lost: ${c.name ?? 'Sponsor'} (${c.reason ?? 'breached'})`, 'negative');
  });
  eventBus.on('staff:hired', (s) => {
    state.logEvent(`Hired: ${s.name} (${s.specialization ?? 'general'})`, 'info');
  });
  eventBus.on('staff:fired', (s) => {
    state.logEvent(`Fired: ${s.name}`, 'info');
  });
  eventBus.on('story:dialogue', (evt) => {
    state.logEvent(`Story: ${evt.title ?? evt.id ?? 'Event'}`, 'story');
  });

  // ── Wire particle effects, floating text, and screen shake to game events ──

  // Filter install: particles + floating cost text + notification
  eventBus.on('filter:added', (f) => {
    particles.emit('success', f.x + 8, f.y + 8);
    floatingText.add('INSTALLED', f.x + 8, f.y, '#00e436', 1.2);
  });

  // Filter repair: blue/white sparkle burst + floating text
  eventBus.on('filter:repaired', (f) => {
    if (f && f.x != null) {
      particles.emit('repairSparkle', f.x + 8, f.y + 8);
      floatingText.add('REPAIRED', f.x + 8, f.y, '#29adff', 1.2);
    }
  });

  // Filter broken: sparks + screen shake + red flash + floating text
  eventBus.on('filter:broken', (f) => {
    particles.emit('sparks', f.x + 8, f.y + 8);
    particles.emit('smoke', f.x + 8, f.y + 4);
    screenShake.shake(3, 0.3);
    screenFlash.flash('#ff004d', 0.3, 0.2);
    floatingText.add('BROKEN!', f.x + 8, f.y, '#ff004d', 1.8);
  });

  eventBus.on('filter:removed', (f) => particles.emit('removePuff', f.x + 8, f.y + 8));

  // Prestige points from monthly challenges
  eventBus.on('prestige:addPoints', ({ points }) => {
    if (points > 0) prestige.addPoints(points);
  });

  // Generic particle emit bridge (used by CrowdSystem for confetti bursts)
  eventBus.on('particles:emit', ({ preset, x, y }) => {
    if (preset && x != null && y != null) {
      particles.emit(preset, x, y);
    }
  });

  // Filter upgrade: double success burst + floating text
  eventBus.on('filter:upgraded', ({ filter: f, newType }) => {
    if (f && f.x != null) {
      particles.emit('success', f.x + 8, f.y + 8);
      particles.emit('success', f.x + 8, f.y + 4);
      floatingText.add('UPGRADED!', f.x + 8, f.y, '#ffec27', 1.5);
    }
  });

  // Filter events — visual feedback for random filter events
  eventBus.on('filter:powerSurge', ({ filterId, zone }) => {
    const f = state.getFilter(filterId);
    if (f && f.x != null) {
      particles.emit('sparks', f.x + 8, f.y + 8);
      floatingText.add('SURGE!', f.x + 8, f.y, '#ffcc00', 1.5);
    }
  });
  eventBus.on('filter:contamination', () => {
    floatingText.add('CONTAMINATION!', CANVAS_WIDTH / 2, 30, '#00b7ff', 2.0);
  });
  eventBus.on('filter:efficiencyBoost', () => {
    floatingText.add('EFFICIENCY BOOST!', CANVAS_WIDTH / 2, 30, '#00e436', 2.0);
  });
  eventBus.on('filter:dustStorm', () => {
    floatingText.add('DUST STORM!', CANVAS_WIDTH / 2, 30, '#ff8800', 2.0);
  });

  // Contract renewal/renegotiation — floating feedback
  eventBus.on('contract:renewed', ({ sponsorName }) => {
    floatingText.add('RENEWED!', CANVAS_WIDTH / 2, 30, '#00e436', 1.5);
  });
  eventBus.on('contract:renegotiated', ({ sponsorName }) => {
    floatingText.add('RENEGOTIATED!', CANVAS_WIDTH / 2, 30, '#ffec27', 1.5);
  });

  // Money changes — floating +/- dollar amounts
  eventBus.on('economy:inningEnd', (data) => {
    const net = data.income - data.expenses;
    if (net !== 0) {
      const sign = net > 0 ? '+' : '';
      const color = net > 0 ? '#00e436' : '#ff004d';
      // Show near the budget area (top-left of screen, in world coords)
      floatingText.add(`${sign}$${net}`, 40, 14, color, 1.5);
    }
  });

  // Reputation change — floating rep indicator
  eventBus.on('reputation:changed', ({ amount, reason }) => {
    if (Math.abs(amount) >= 0.5) {
      const sign = amount > 0 ? '+' : '';
      const color = amount > 0 ? '#ffec27' : '#ff004d';
      const text = `${sign}${amount.toFixed(0)} REP`;
      // Show near the rep display area (right side)
      floatingText.add(text, CANVAS_WIDTH - 60, 14, color, 1.8);
    }
  });

  // Consequence critical events — subtle warning shake when systems critically failing
  eventBus.on('consequence:update', ({ scores }) => {
    const worst = Math.min(scores.air ?? 100, scores.water ?? 100, scores.hvac ?? 100, scores.drainage ?? 100);
    if (worst < 15) {
      screenShake.shake(2, 0.2);
    }

    // When electrical domain is critically low, emit sparks near random filter positions
    if ((scores.electrical ?? 100) < 25) {
      const elecFilters = state.filters.filter(f => f.domain === 'electrical');
      if (elecFilters.length > 0) {
        const f = elecFilters[Math.floor(Math.random() * elecFilters.length)];
        particles.emit('electricArc', f.x + 8, f.y + 8);
      }
    }

    // When pest domain is critically low, occasional scurry effect
    if ((scores.pest ?? 100) < 25 && Math.random() < 0.3) {
      particles.emit('pestScurry', 50 + Math.random() * 380, 50 + Math.random() * 200);
    }
  });

  // Game events: shake + flash for negative events
  eventBus.on('event:started', (evt) => {
    const isPositive = evt.category === 'positive' || evt.isPositive;
    if (isPositive) {
      particles.emit('confetti', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    } else if (evt.degradeMultiplier >= 2.0) {
      screenShake.shake(6, 0.5);
      screenFlash.flash('#ff004d', 0.3, 0.15);
    } else if (evt.degradeMultiplier >= 1.5) {
      screenShake.shake(3, 0.3);
    }

    // Lightning storm — dramatic flash + shake + lightning particle burst
    if (evt.name === 'Lightning Storm') {
      screenFlash.flash('#ffffff', 0.15, 0.4);
      screenShake.shake(5, 0.4);
      particles.emit('lightningStrike', 100 + Math.random() * 280, 20);
    }

    // Pest infestation — swarm particles emerging in waves
    if (evt.name === 'Pest Infestation') {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => particles.emit('pestSwarm', 80 + Math.random() * 320, 80 + Math.random() * 160), i * 300);
      }
    }
  });

  // New game day — subtle celebration particles
  eventBus.on('game:newDay', ({ day }) => {
    // Brief crowd cheer at start of each new game day
    particles.emit('crowdCheer', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.7);
    if (day && day % 10 === 0) {
      // Milestone game day
      particles.emit('confetti', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    }
  });

  // Baseball-themed particle events
  eventBus.on('game:win', () => {
    screenShake.shake(8, 0.8);
    screenFlash.flash('#ffdd44', 0.5, 0.2);
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        particles.emit('homerun', 80 + Math.random() * 320, 160 + Math.random() * 40);
        particles.emit('confetti', 60 + Math.random() * 360, 100 + Math.random() * 80);
      }, i * 400);
    }
  });
  eventBus.on('game:lose', () => {
    screenShake.shake(10, 1.0);
    screenFlash.flash('#ff004d', 0.6, 0.25);
  });

  eventBus.on('progression:tierChange', ({ promoted }) => {
    particles.emit('confetti', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    particles.emit('crowdCheer', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    if (promoted) {
      // Extra celebration for promotion
      particles.emit('homerun', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
      screenShake.shake(2, 0.3);
    }
  });

  eventBus.on('story:chapterChange', () => {
    particles.emit('homerun', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  });

  // Streak milestone celebrations
  eventBus.on('progression:achievement', () => {
    particles.emit('confetti', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    particles.emit('homerun', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    screenShake.shake(4, 0.4);
    screenFlash.flash('#00e436', 0.4, 0.15);
  });

  // Inspection result — yellow flash for poor grades
  eventBus.on('inspection:result', ({ grade }) => {
    if (grade === 'C' || grade === 'D' || grade === 'F') {
      screenFlash.flash('#ffa300', 0.3, 0.15);
    }
  });

  // Rival sabotage — red-orange flash
  eventBus.on('rival:victorEncounter', () => {
    screenShake.shake(6, 0.5);
    screenFlash.flash('#ff6600', 0.3, 0.15);
  });

  // Wire staff early warning events to notifications
  eventBus.on('staff:earlyWarning', (data) => {
    eventBus.emit('ui:message', { text: data.message, type: 'warning' });
  });

  // Wire story game end to win/lose flow
  eventBus.on('story:gameEnd', (data) => {
    if (data.ending === 'win' || data.ending === 'victory') {
      eventBus.emit('game:win', { reason: 'Story complete!' });
    } else {
      eventBus.emit('game:lose', { reason: data.ending ?? 'Story ended.' });
    }
  });

  const systems = [filtration, consequences, economy, events, progression, story, staffSystem, rival, schemes, media, research, marketSystem];

  // Game loop callbacks
  function update(dt) {
    for (const system of systems) {
      system.update(dt);
    }
    crowd.update(dt);
    particles.update(dt);
    floatingText.update(dt);
    screenShake.update(dt);
    screenFlash.update(dt);
    audio.update(dt);
    music.update(dt);
    hud.update(dt);
    panels.update(dt);
    incomeBreakdown.update(dt);
    eventBanner.update(dt);
    zoneManager.updateTransition(dt * 1000); // convert seconds to ms
  }

  function render(interpolation) {
    // Apply screen shake offset to camera
    if (screenShake.active) {
      renderer.cameraX = screenShake.offsetX;
      renderer.cameraY = screenShake.offsetY;
    } else {
      renderer.cameraX = 0;
      renderer.cameraY = 0;
    }

    renderer.clear();

    // Pipe placement mode info to TileMap for vent slot highlights
    if (input.isPlacing) {
      tileMap.placementMode = input._placementMode;
      const currentZone = state.currentZone ?? 'field';
      const ts = tileMap.tileSize;
      const occ = new Set();
      for (const f of state.filters) {
        if (f.zone && f.zone !== currentZone) continue;
        if (!f.zone && currentZone !== 'mechanical') continue;
        occ.add(`${Math.floor(f.x / ts)},${Math.floor(f.y / ts)}`);
      }
      tileMap.placementOccupied = occ;
    } else {
      tileMap.placementMode = null;
      tileMap.placementOccupied = null;
    }

    tileMap.render(renderer, state);

    // Render crowd characters (behind filters)
    crowd.render(renderer);

    // Render filter placement ghost preview
    const ghost = input.getPlacementGhost();
    if (ghost) {
      renderer.save();
      renderer.setAlpha(ghost.valid ? 0.5 : 0.2);
      renderer.drawRect(ghost.x, ghost.y, 16, 16, ghost.valid ? '#55aa55' : '#aa3333');
      renderer.restore();
    }

    // Render filters via sprite system (pixel sprites + condition bars + empty slot indicators)
    sprites.render(renderer, state, tileMap);

    // Render particles
    particles.render(renderer);

    // Render floating text (world-space rising numbers)
    floatingText.render(renderer);

    // Reset camera for screen-space UI elements (event banner, HUD, edge tint)
    renderer.cameraX = 0;
    renderer.cameraY = 0;

    // Active event banner
    if (state.activeEvent) {
      renderer.save();
      renderer.setAlpha(0.7);
      renderer.drawRect(0, CANVAS_HEIGHT - 24, CANVAS_WIDTH, 20, '#442244');
      renderer.restore();
      renderer.drawText(
        state.activeEvent.name + ' - ' + (state.activeEvent.description || ''),
        CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20,
        { align: 'center', size: 8, color: '#ffaaff' }
      );
    }

    hud.render();

    // Screen flash overlay (fading color wash for dramatic moments)
    if (screenFlash.active) {
      screenFlash.render(renderer);
    }

    // Consequence screen edge tint — visual urgency based on domain health
    const health = state.domainHealth;
    if (health) {
      const worstScore = Math.min(
        health.air ?? 100, health.water ?? 100,
        health.hvac ?? 100, health.drainage ?? 100,
        health.electrical ?? 100, health.pest ?? 100
      );
      if (worstScore < 25) {
        // Critical: pulsing red vignette border
        renderer.save();
        const pulse = Math.sin(Date.now() * 0.004) * 0.04 + 0.10;
        renderer.setAlpha(pulse);
        renderer.drawRectScreen(0, 0, CANVAS_WIDTH, 4, '#ff004d');
        renderer.drawRectScreen(0, CANVAS_HEIGHT - 4, CANVAS_WIDTH, 4, '#ff004d');
        renderer.drawRectScreen(0, 0, 4, CANVAS_HEIGHT, '#ff004d');
        renderer.drawRectScreen(CANVAS_WIDTH - 4, 0, 4, CANVAS_HEIGHT, '#ff004d');
        // Inner glow for urgency
        renderer.setAlpha(pulse * 0.4);
        renderer.drawRectScreen(4, 4, CANVAS_WIDTH - 8, 2, '#ff004d');
        renderer.drawRectScreen(4, CANVAS_HEIGHT - 6, CANVAS_WIDTH - 8, 2, '#ff004d');
        renderer.restore();
      } else if (worstScore < 50) {
        // Warning: visible amber top/bottom border with gentle pulse
        renderer.save();
        const pulse = Math.sin(Date.now() * 0.002) * 0.02 + 0.07;
        renderer.setAlpha(pulse);
        renderer.drawRectScreen(0, 0, CANVAS_WIDTH, 2, '#ffa300');
        renderer.drawRectScreen(0, CANVAS_HEIGHT - 2, CANVAS_WIDTH, 2, '#ffa300');
        renderer.drawRectScreen(0, 0, 2, CANVAS_HEIGHT, '#ffa300');
        renderer.drawRectScreen(CANVAS_WIDTH - 2, 0, 2, CANVAS_HEIGHT, '#ffa300');
        renderer.restore();
      }
    }

    // Income/expense breakdown floating text (screen-space)
    incomeBreakdown.render(renderer);

    // Event announcement banner overlay
    eventBanner.render(renderer);

    // Zone transition crossfade overlay (renders on top of everything)
    zoneManager.renderTransition(renderer);
  }

  const loop = new GameLoop(update, render);

  // Wire up pause/resume and speed control via EventBus
  eventBus.on('game:pause', () => {
    loop.pause();
    state.set('paused', true);
  });

  eventBus.on('game:resume', () => {
    loop.resume();
    state.set('paused', false);
  });

  eventBus.on('game:setSpeed', ({ speed }) => {
    loop.setSpeed(speed);
    state.set('speed', speed);
  });

  // Wire up game win/lose — pause the loop, award prestige, notify the player, and show game over menu
  eventBus.on('game:win', (data) => {
    loop.pause();
    state.set('paused', true);
    // Initialize post-win sandbox goals
    progression.initSandboxGoals();
    // Award prestige legacy points
    const prestigeBreakdown = prestige.recordGameEnd(state, true);
    eventBus.emit('ui:showEndScreen', { result: 'win', ...data });
    eventBus.emit('ui:message', {
      text: data?.message ?? 'Congratulations! You won!',
      type: 'achievement',
    });
    if (prestigeBreakdown.total > 0) {
      eventBus.emit('ui:message', {
        text: `+${prestigeBreakdown.total} Legacy Points earned!`,
        type: 'success',
      });
    }
    menus.showGameOver({ ...data, win: true, prestigeBreakdown });
  });

  eventBus.on('game:lose', (data) => {
    loop.pause();
    state.set('paused', true);
    // Award prestige legacy points (even on loss)
    const prestigeBreakdown = prestige.recordGameEnd(state, false);
    eventBus.emit('ui:showEndScreen', { result: 'lose', ...data });
    eventBus.emit('ui:message', {
      text: data?.message ?? 'Game over. The stadium has been condemned.',
      type: 'danger',
    });
    if (prestigeBreakdown.total > 0) {
      eventBus.emit('ui:message', {
        text: `+${prestigeBreakdown.total} Legacy Points earned.`,
        type: 'info',
      });
    }
    menus.showGameOver({ ...data, win: false, prestigeBreakdown });
  });

  // Wire up save/load
  eventBus.on('game:save', ({ slot }) => {
    const existing = saveLoad.hasSlotData(slot);
    if (existing) {
      const info = saveLoad.getSlotInfo().find(s => s.slot === slot);
      const label = info && !info.empty
        ? `Overwrite save? (Day ${info.gameDay}, Rep ${Math.floor(info.reputation)}%, $${info.money.toLocaleString()})`
        : 'Overwrite existing save?';
      showConfirmDialog(uiOverlay, label, () => {
        saveLoad.saveToSlot(slot);
        eventBus.emit('ui:message', { text: `Saved to slot ${slot}`, type: 'success' });
      });
    } else {
      saveLoad.saveToSlot(slot);
      eventBus.emit('ui:message', { text: `Saved to slot ${slot}`, type: 'success' });
    }
  });
  eventBus.on('game:load', ({ slot }) => saveLoad.loadFromSlot(slot));
  eventBus.on('game:quickSave', () => saveLoad.autoSave());
  eventBus.on('game:quickLoad', () => saveLoad.loadAutoSave());
  eventBus.on('game:quickLoadRequest', () => {
    if (!saveLoad.hasAutoSave()) {
      eventBus.emit('ui:message', { text: 'No save data found', type: 'warning' });
      return;
    }
    showConfirmDialog(uiOverlay, 'Load last save? Unsaved progress will be lost.', () => {
      saveLoad.loadAutoSave();
    });
  });

  // Settings and help panels (need audio reference)
  const settingsPanel = new SettingsPanel(panels, state, eventBus, audio, music);
  const helpPanel = new HelpPanel(panels, state, eventBus);

  // Wire up audio mute toggle (M key)
  eventBus.on('audio:toggleMute', () => audio.toggleMute());


  // Journal toggle is handled inside JournalPanel.js (registerJournalPanel)

  // Wire up ESC → menu toggle
  eventBus.on('ui:toggleMenu', () => {
    if (menus.isVisible) {
      menus.hide();
      eventBus.emit('game:resume');
    } else {
      eventBus.emit('game:pause');
      menus.show('pause');
    }
  });

  // Mobile toolbar events
  if (mobile.isMobile) {
    eventBus.on('mobile:togglePause', () => {
      if (state.paused) {
        if (menus.isVisible) menus.hide();
        eventBus.emit('game:resume');
      } else {
        eventBus.emit('game:pause');
      }
    });
    eventBus.on('mobile:nextZone', () => {
      if (zoneManager) zoneManager.nextZone();
    });
    eventBus.on('mobile:cancel', () => {
      if (input.isPlacing) {
        input.exitPlacementMode();
      } else {
        eventBus.emit('ui:closeAllPanels');
      }
    });
  }

  // Off-season event dialogs
  eventBus.on('offseason:event', (eventData) => {
    showOffSeasonEventDialog(uiOverlay, eventData);
  });
  eventBus.on('offseason:pickDomain', (options) => {
    showDomainPickerDialog(uiOverlay, options);
  });

  // Multi-day event chain choice dialogs
  eventBus.on('eventChain:choice', ({ chainName, text, onYes, onNo }) => {
    showConfirmDialog(uiOverlay, `${chainName}: ${text}`, () => {
      onYes();
    }, 'YES');
    // If the user cancels (clicks CANCEL), trigger the no path
    // showConfirmDialog only fires onConfirm on YES. Override to handle NO.
    // We need to patch the cancel path — wrap with a custom handler.
    const overlay = uiOverlay.lastElementChild;
    if (overlay) {
      const cancelBtn = overlay.querySelector('[data-confirm="no"]');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          onNo();
        }, { once: true });
      }
    }
  });

  // Expose core references for debugging
  window.__game = { state, eventBus, loop, saveLoad, menus, particles, floatingText, screenShake, screenFlash, tileMap, staffSystem, rival, schemes, media, story, research, zoneManager, consequences, prestige, filtration };

  eventBus.emit('game:init', { config: GAME_CONFIG });
  loop.start();

}

window.addEventListener('DOMContentLoaded', init);
