import * as THREE from 'three';
import { SeekerCharacter } from './character.js';
import { BiblicalWorld } from './world.js';
import { Sheep } from './sheep.js';
import { NPC } from './npcs.js';
import { QuestManager } from './quests.js';
import { GameUI } from './ui.js';
import { sounds } from './audio.js';

class Game {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();

    // Scene & Renderer
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // Camera
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 400);
    this.cameraDistance = 7.5;
    this.cameraAngleH = 0; // Horizontal orbit angle
    this.cameraAngleV = 0.32; // Vertical pitch
    this.isDraggingMouse = false;
    this.prevMousePos = { x: 0, y: 0 };

    // Initialize subsystems
    this.ui = new GameUI();
    this.quests = new QuestManager(this.ui);
    this.world = new BiblicalWorld(this.scene);
    this.character = new SeekerCharacter(this.scene);

    // Place character near village square
    this.character.position.set(2, this.world.getTerrainHeight(2, 6), 6);

    // Spawn Sheep for Quest 1
    this.sheepList = [];
    this.spawnSheep();

    // Spawn Biblical NPCs
    this.npcs = [];
    this.spawnNPCs();

    // Input state
    this.keys = {};
    this.setupInput();
    this.setupTouchInput();

    // Hook journal open button to quest manager scrolls
    document.getElementById('btn-journal').onclick = () => {
      this.ui.toggleJournal(this.quests.collectedScrolls);
    };

    // Resize listener
    window.addEventListener('resize', () => this.onWindowResize());

    // PWA Install prompt listener (Android/Chrome)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      this.ui.setupPWAInstall(async () => {
        if (this.deferredInstallPrompt) {
          this.deferredInstallPrompt.prompt();
          const choice = await this.deferredInstallPrompt.userChoice;
          if (choice && choice.outcome === 'accepted') {
            this.ui.hideInstallButton();
          }
          this.deferredInstallPrompt = null;
        }
      });
    });

    // Initial notification & first quest state
    setTimeout(() => {
      this.ui.showNotification("Welcome, Seeker! Speak with Elder Simeon in Bethany.");
      this.ui.updateQuestHUD(this.quests.getActiveQuest());
    }, 800);

    // Start loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  spawnSheep() {
    // 3 lost lambs scattered beyond the village borders
    const sheepConfigs = [
      { id: 'sheep_1', x: -28, z: 18, name: "Lamb of the Grove" },
      { id: 'sheep_2', x: 15, z: -26, name: "Little White Fleece" },
      { id: 'sheep_3', x: -38, z: -28, name: "Wandering Stray" }
    ];

    sheepConfigs.forEach(cfg => {
      const sheep = new Sheep(
        this.scene,
        (x, z) => this.world.getTerrainHeight(x, z),
        cfg.id,
        cfg.x,
        cfg.z,
        cfg.name
      );
      this.sheepList.push(sheep);
    });
  }

  spawnNPCs() {
    // 1. Elder Simeon (Village elder)
    const simeon = new NPC(this.scene, (x, z) => this.world.getTerrainHeight(x, z), {
      id: 'simeon',
      name: 'Elder Simeon',
      title: 'Bethany Patriarch',
      x: -3,
      z: -10,
      hasBeard: true,
      robeColor: 0xd9c5a0
    });
    simeon.setQuestState('available');
    this.npcs.push(simeon);

    // 2. Sister Martha (by the well)
    const martha = new NPC(this.scene, (x, z) => this.world.getTerrainHeight(x, z), {
      id: 'martha',
      name: 'Sister Martha',
      title: 'Daughter of Bethany',
      x: -3.5,
      z: 2.5,
      hasBeard: false,
      robeColor: 0x41658a
    });
    martha.setQuestState('locked');
    this.npcs.push(martha);

    // 3. Shepherd Caleb (overlooking the brook of Elah)
    const caleb = new NPC(this.scene, (x, z) => this.world.getTerrainHeight(x, z), {
      id: 'caleb',
      name: 'Shepherd Caleb',
      title: 'Keeper of Flocks',
      x: 18,
      z: -12,
      hasBeard: true,
      robeColor: 0x8a6240
    });
    caleb.setQuestState('locked');
    this.npcs.push(caleb);
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Start music on first user interaction if not started
      sounds.startMusic();

      if (e.code === 'KeyE') {
        this.handleInteraction();
      }
      if (e.code === 'KeyQ') {
        this.handleFaithAbility();
      }
      if (e.code === 'KeyR') {
        this.character.triggerRoll();
      }
      if (e.code === 'Space') {
        this.character.triggerJump();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Orbit Camera mouse controls
    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('.hud-container') || e.target.closest('.modal-backdrop')) return;
      this.isDraggingMouse = true;
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingMouse = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDraggingMouse) return;
      const dx = e.clientX - this.prevMousePos.x;
      const dy = e.clientY - this.prevMousePos.y;

      this.cameraAngleH -= dx * 0.0055;
      this.cameraAngleV = Math.max(0.1, Math.min(1.2, this.cameraAngleV + dy * 0.004));

      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    // Mouse scroll to zoom camera
    window.addEventListener('wheel', (e) => {
      this.cameraDistance = Math.max(4.0, Math.min(14.0, this.cameraDistance + e.deltaY * 0.005));
    }, { passive: true });
  }

  setupTouchInput() {
    this.touchJoystick = { x: 0, z: 0, active: false, id: null };
    
    // Joystick elements
    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');
    const controlsContainer = document.querySelector('.mobile-controls-container');
    if (!zone || !knob) return;

    // Show mobile controls on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      if (controlsContainer) controlsContainer.style.display = 'block';
    }

    const handleJoystickMove = (e) => {
      if (!this.touchJoystick.active) return;
      let touch = Array.from(e.touches).find(t => t.identifier === this.touchJoystick.id);
      if (!touch) return;

      const rect = zone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let dx = touch.clientX - cx;
      let dy = touch.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const maxDist = rect.width / 2;

      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }

      knob.style.transform = `translate(${dx}px, ${dy}px)`;

      // Deadzone & normalization
      const normDist = dist / maxDist;
      if (normDist > 0.08) {
        this.touchJoystick.x = dx / maxDist;
        this.touchJoystick.z = dy / maxDist;
      } else {
        this.touchJoystick.x = 0;
        this.touchJoystick.z = 0;
      }
    };

    // Allow thumb placement across bottom-left quadrant
    window.addEventListener('touchstart', (e) => {
      if (this.touchJoystick.active) return;
      for (const touch of Array.from(e.changedTouches)) {
        if (touch.clientX < window.innerWidth * 0.45 && touch.clientY > window.innerHeight * 0.28) {
          // Ignore if touching HUD
          if (e.target.closest('.hud-top-left') || e.target.closest('.quest-tracker') || e.target.closest('.modal-backdrop')) return;
          
          this.touchJoystick.active = true;
          this.touchJoystick.id = touch.identifier;
          sounds.startMusic();

          // Anchor joystick base directly under user thumb
          zone.style.left = `${Math.max(10, touch.clientX - 60)}px`;
          zone.style.top = `${Math.max(10, touch.clientY - 60)}px`;
          zone.style.bottom = 'auto';

          handleJoystickMove(e);
          break;
        }
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      handleJoystickMove(e);
    }, { passive: false });

    const handleJoystickEnd = (e) => {
      let touch = Array.from(e.changedTouches).find(t => t.identifier === this.touchJoystick.id);
      if (touch) {
        this.touchJoystick.active = false;
        this.touchJoystick.id = null;
        this.touchJoystick.x = 0;
        this.touchJoystick.z = 0;
        knob.style.transform = `translate(0px, 0px)`;
        // Reset joystick back to standard dock position
        zone.style.left = '24px';
        zone.style.bottom = '24px';
        zone.style.top = 'auto';
      }
    };

    window.addEventListener('touchend', handleJoystickEnd);
    window.addEventListener('touchcancel', handleJoystickEnd);

    // Action Buttons with responsive haptics
    const triggerHaptic = (ms) => {
      if (navigator.vibrate) {
        try { navigator.vibrate(ms); } catch (_) {}
      }
    };

    const btnJump = document.getElementById('btn-touch-jump');
    btnJump.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.character.triggerJump();
      triggerHaptic(15);
    }, { passive: false });

    const btnRoll = document.getElementById('btn-touch-roll');
    btnRoll.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.character.triggerRoll();
      triggerHaptic(20);
    }, { passive: false });

    const btnFaith = document.getElementById('btn-touch-faith');
    btnFaith.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleFaithAbility();
      triggerHaptic([15, 30, 20]);
    }, { passive: false });

    const btnInteract = document.getElementById('btn-touch-interact');
    btnInteract.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleInteraction();
      triggerHaptic(12);
    }, { passive: false });

    // Touch Orbit Camera with Pinch-to-Zoom
    this.touchCamera = { active: false, id: null, lastX: 0, lastY: 0, prevPinchDist: null };
    
    window.addEventListener('touchstart', (e) => {
      // Ignore clicks on HUD or action controls
      if (e.target.closest('.hud-container') || e.target.closest('.action-buttons') || e.target.closest('.modal-backdrop')) return;

      const rightTouches = Array.from(e.touches).filter(t => t.clientX >= window.innerWidth * 0.45);
      if (rightTouches.length === 2) {
        // Pinch zoom detected
        this.touchCamera.prevPinchDist = Math.hypot(
          rightTouches[0].clientX - rightTouches[1].clientX,
          rightTouches[0].clientY - rightTouches[1].clientY
        );
      } else if (rightTouches.length === 1 && !this.touchCamera.active) {
        const touch = rightTouches[0];
        this.touchCamera.active = true;
        this.touchCamera.id = touch.identifier;
        this.touchCamera.lastX = touch.clientX;
        this.touchCamera.lastY = touch.clientY;
        this.touchCamera.prevPinchDist = null;
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      const rightTouches = Array.from(e.touches).filter(t => t.clientX >= window.innerWidth * 0.45);
      
      // Handle pinch-to-zoom
      if (rightTouches.length >= 2 && this.touchCamera.prevPinchDist !== null) {
        const curDist = Math.hypot(
          rightTouches[0].clientX - rightTouches[1].clientX,
          rightTouches[0].clientY - rightTouches[1].clientY
        );
        const diff = curDist - this.touchCamera.prevPinchDist;
        this.cameraDistance = Math.max(3.8, Math.min(14.0, this.cameraDistance - diff * 0.02));
        this.touchCamera.prevPinchDist = curDist;
        return;
      }

      // Handle single finger camera orbit
      if (!this.touchCamera.active) return;
      const touch = Array.from(e.touches).find(t => t.identifier === this.touchCamera.id);
      if (touch) {
        const dx = touch.clientX - this.touchCamera.lastX;
        const dy = touch.clientY - this.touchCamera.lastY;

        this.cameraAngleH -= dx * 0.0055;
        this.cameraAngleV = Math.max(0.1, Math.min(1.2, this.cameraAngleV + dy * 0.004));

        this.touchCamera.lastX = touch.clientX;
        this.touchCamera.lastY = touch.clientY;
      }
    }, { passive: false });

    const endCamera = (e) => {
      const remainingRight = Array.from(e.touches).filter(t => t.clientX >= window.innerWidth * 0.45);
      if (remainingRight.length < 2) {
        this.touchCamera.prevPinchDist = null;
      }
      const touch = Array.from(e.changedTouches).find(t => t.identifier === this.touchCamera.id);
      if (touch) {
        this.touchCamera.active = false;
        this.touchCamera.id = null;
      }
    };
    window.addEventListener('touchend', endCamera);
    window.addEventListener('touchcancel', endCamera);
  }

  handleFaithAbility() {
    const activated = this.character.activateFaithAbility();
    if (!activated) return;

    // Check if inside Ancient Cavern for Mission 4
    const p = this.character.position;
    const cavernDist = Math.hypot(p.x - (-55), p.z - 35);
    if (cavernDist < 10) {
      // Illuminate cavern glyphs!
      this.world.caveGlyphs.forEach(g => {
        g.material.opacity = 0.95;
        g.material.color.setHex(0xffdf80); // Radiant gold
      });
      this.world.arkChest.material.emissive.setHex(0x775511);
      this.quests.onCavernLightActivated(this.npcs);
    }
  }

  handleInteraction() {
    const p = this.character.position;

    // 1. Check NPC interaction
    for (const npc of this.npcs) {
      const dist = p.distanceTo(npc.position);
      if (dist < 4.5) {
        this.interactWithNPC(npc);
        return;
      }
    }

    // 2. Check Sheep interaction
    for (const sheep of this.sheepList) {
      const dist = p.distanceTo(sheep.position);
      if (dist < 3.8 && !sheep.isRescued && !sheep.isSafelyHome) {
        sheep.rescue();
        this.ui.showNotification(`${sheep.name} is now following you! Lead it to the sheepfold.`);
        return;
      }
    }

    // 3. Check Watchtower Crank Item (Quest 2)
    const activeQ = this.quests.getActiveQuest();
    if (activeQ && activeQ.id === 'living_water' && !activeQ.hasItem) {
      const crankPos = new THREE.Vector3(52, this.world.getTerrainHeight(52, -52) + 3.2, -52);
      if (p.distanceTo(crankPos) < 5.0) {
        this.world.wellCrankItem.visible = false;
        this.world.crankBeam.visible = false;
        this.quests.onWellCrankCollected();
        return;
      }
    }

    // 4. Check Village Well repair (Quest 2)
    if (activeQ && activeQ.id === 'living_water' && activeQ.hasItem && activeQ.currentCount === 0) {
      const wellPos = new THREE.Vector3(0, this.world.getTerrainHeight(0, 0), 0);
      if (p.distanceTo(wellPos) < 4.5) {
        // Repair well!
        this.world.gearSlot.material.color.setHex(0xe0a030);
        this.world.wellWater.position.y = 0.45;
        this.world.waterMat.opacity = 0.85;
        this.quests.onWellRepaired(this.npcs);
        return;
      }
    }

    // 5. Check Smooth Stones along brook (Quest 3)
    if (activeQ && activeQ.id === 'smooth_stones') {
      for (const st of this.world.smoothStones) {
        if (!st.collected) {
          const dist = Math.hypot(p.x - st.x, p.z - st.z);
          if (dist < 3.2) {
            st.collected = true;
            st.mesh.visible = false;
            st.ring.visible = false;
            this.quests.onSmoothStoneCollected(st.label, this.npcs);
            return;
          }
        }
      }
    }
  }

  interactWithNPC(npc) {
    const q = this.quests.quests.find(item => item.giverId === npc.id && (item.status === 'available' || item.status === 'active' || item.status === 'ready'));

    if (!q) {
      // General peaceful greeting
      this.ui.openDialogue({
        npc,
        lines: [
          `Grace and peace to you, traveler. May the Lord guard your steps as you journey through the hills.`
        ]
      });
      return;
    }

    if (q.status === 'available') {
      this.ui.openDialogue({
        npc,
        lines: q.dialogueIntro,
        onComplete: () => {
          this.quests.startQuest(q.id);
          npc.setQuestState('active');
        }
      });
    } else if (q.status === 'active') {
      this.ui.openDialogue({
        npc,
        lines: q.dialogueInProgress
      });
    } else if (q.status === 'ready') {
      this.ui.openDialogue({
        npc,
        lines: q.dialogueComplete,
        onComplete: () => {
          this.quests.completeQuest(q.id, this.npcs);
        }
      });
    }
  }

  updateInteractionsPrompt() {
    const p = this.character.position;
    let foundPrompt = null;

    // NPC prompt
    for (const npc of this.npcs) {
      if (p.distanceTo(npc.position) < 4.0) {
        foundPrompt = `Speak with ${npc.name}`;
        break;
      }
    }

    // Sheep prompt
    if (!foundPrompt) {
      for (const sheep of this.sheepList) {
        if (p.distanceTo(sheep.position) < 3.5 && !sheep.isRescued && !sheep.isSafelyHome) {
          foundPrompt = `Guide ${sheep.name}`;
          break;
        }
      }
    }

    // Quest items prompts
    const activeQ = this.quests.getActiveQuest();
    if (!foundPrompt && activeQ) {
      if (activeQ.id === 'living_water') {
        const crankPos = new THREE.Vector3(52, this.world.getTerrainHeight(52, -52) + 3.2, -52);
        if (!activeQ.hasItem && p.distanceTo(crankPos) < 5.0) {
          foundPrompt = "Pick up Stone Gear Mechanism";
        } else if (activeQ.hasItem && activeQ.currentCount === 0 && p.distanceTo(new THREE.Vector3(0, this.world.getTerrainHeight(0, 0), 0)) < 4.0) {
          foundPrompt = "Restore Village Well";
        }
      } else if (activeQ.id === 'smooth_stones') {
        for (const st of this.world.smoothStones) {
          if (!st.collected && Math.hypot(p.x - st.x, p.z - st.z) < 3.0) {
            foundPrompt = `Take ${st.label}`;
            break;
          }
        }
      } else if (activeQ.id === 'ancient_cavern') {
        const cavernDist = Math.hypot(p.x - (-55), p.z - 35);
        if (cavernDist < 9.0) {
          foundPrompt = "Press [Q] to Cast Light of Faith";
        }
      }
    }

    if (foundPrompt) {
      this.ui.showInteractionPrompt(foundPrompt);
    } else {
      this.ui.hideInteractionPrompt();
    }
  }

  updateSheepLogic(delta) {
    let safeCount = 0;
    this.sheepList.forEach(sheep => {
      sheep.update(delta, this.character.position, this.world.sheepfoldTarget);
      if (sheep.isSafelyHome) {
        safeCount++;
      }
    });

    // Check Parable of Lost Sheep progress
    this.quests.updateSheepProgress(safeCount, this.npcs);
  }

  updateCamera() {
    // Mini Ninjas Third-person Camera: smooth follow with pitch & yaw orbit
    const charPos = this.character.position.clone();
    charPos.y += 1.4; // Aim around character shoulders

    const camX = charPos.x + Math.sin(this.cameraAngleH) * Math.cos(this.cameraAngleV) * this.cameraDistance;
    const camY = charPos.y + Math.sin(this.cameraAngleV) * this.cameraDistance;
    const camZ = charPos.z + Math.cos(this.cameraAngleH) * Math.cos(this.cameraAngleV) * this.cameraDistance;

    // Ensure camera stays above terrain
    const minCamY = this.world.getTerrainHeight(camX, camZ) + 0.8;
    const finalCamY = Math.max(minCamY, camY);

    this.camera.position.lerp(new THREE.Vector3(camX, finalCamY, camZ), 0.15);
    this.camera.lookAt(charPos);

    this.ui.updateCompass(this.cameraAngleH);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // Direction vector from keys
    const inputDir = new THREE.Vector3(0, 0, 0);
    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputDir.z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputDir.z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputDir.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputDir.x += 1;

    // Add touch input
    if (this.touchJoystick && (this.touchJoystick.x !== 0 || this.touchJoystick.z !== 0)) {
       inputDir.x = this.touchJoystick.x;
       inputDir.z = this.touchJoystick.z;
    }

    if (inputDir.lengthSq() > 0) {
      inputDir.normalize();
    }

    const isSprint = !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'];

    // Update character physics & animation
    this.character.update(
      delta,
      inputDir,
      isSprint,
      this.cameraAngleH,
      (x, z) => this.world.getTerrainHeight(x, z)
    );

    // Update World animations
    this.world.update(delta, elapsedTime);

    // Update Sheep
    this.updateSheepLogic(delta);

    // Update NPCs
    this.npcs.forEach(npc => npc.update(delta, this.character.position));

    // Update Proximity interactions
    this.updateInteractionsPrompt();

    // Update HUD
    this.ui.updateFaithBar(this.character.faithEnergy, this.character.maxFaith);

    // Update Third-Person Camera
    this.updateCamera();

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
