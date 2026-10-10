import * as THREE from 'three';
import { sounds } from './audio.js';

export class SeekerCharacter {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Movement state
    this.position = this.group.position;
    this.velocity = new THREE.Vector3();
    this.rotationY = 0;
    this.targetRotationY = 0;

    this.speed = 0;
    this.walkSpeed = 7.5;
    this.sprintSpeed = 12.0;
    this.isGrounded = true;
    this.jumpForce = 13.0;
    this.gravity = 32.0;

    // Actions & states
    this.isRolling = false;
    this.rollTimer = 0;
    this.rollDuration = 0.42;

    this.isPraying = false;
    this.prayTimer = 0;
    this.faithAuraActive = false;
    this.faithEnergy = 100;
    this.maxFaith = 100;

    // Animation cycle timers
    this.animTime = 0;
    this.footstepTimer = 0;

    // Build the stylized 3D model
    this.createModel();

    // Dust particles
    this.createDustParticles();

    // Radiant Faith Aura particle ring
    this.createFaithAura();

    this.scene.add(this.group);
  }

  createModel() {
    // Materials
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xdeb887 }); // Warm desert tan
    const tunicMat = new THREE.MeshLambertMaterial({ color: 0x2b5c8f }); // Ancient cobalt blue tunic
    const trimMat = new THREE.MeshLambertMaterial({ color: 0xd4af37 });  // Gold sash / trim
    const leatherMat = new THREE.MeshLambertMaterial({ color: 0x6e3e1b }); // Leather sandals & pouch
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });   // Shepherd staff wood
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x221a15 });   // Dark hair
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // Root mesh container
    this.meshRoot = new THREE.Group();
    this.group.add(this.meshRoot);

    // Hips / Pelvis
    this.hips = new THREE.Group();
    this.hips.position.y = 1.05;
    this.meshRoot.add(this.hips);

    // Torso
    const torsoGeo = new THREE.CylinderGeometry(0.38, 0.32, 0.75, 8);
    this.torso = new THREE.Mesh(torsoGeo, tunicMat);
    this.torso.position.y = 0.38;
    this.torso.castShadow = true;
    this.hips.add(this.torso);

    // Belt / Sash
    const beltGeo = new THREE.CylinderGeometry(0.40, 0.40, 0.16, 8);
    const belt = new THREE.Mesh(beltGeo, trimMat);
    belt.position.y = -0.22;
    this.torso.add(belt);

    // Pouch on hip
    const pouchGeo = new THREE.BoxGeometry(0.2, 0.22, 0.14);
    const pouch = new THREE.Mesh(pouchGeo, leatherMat);
    pouch.position.set(0.35, -0.2, 0.12);
    this.torso.add(pouch);

    // Travel backpack / scroll case on back
    const scrollCaseGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8);
    scrollCaseGeo.rotateZ(Math.PI / 4);
    const scrollCase = new THREE.Mesh(scrollCaseGeo, leatherMat);
    scrollCase.position.set(0, 0.15, -0.32);
    scrollCase.castShadow = true;
    this.torso.add(scrollCase);

    // Head container
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.52;
    this.torso.add(this.headGroup);

    // Stylized Head
    const headGeo = new THREE.SphereGeometry(0.40, 10, 10);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.y = 0.32;
    this.head.castShadow = true;
    this.headGroup.add(this.head);

    // Hair
    const hairGeo = new THREE.SphereGeometry(0.42, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.35;
    this.headGroup.add(hair);

    // Headband / Cloth Wrap (Keffiyeh-style headband)
    const headbandGeo = new THREE.TorusGeometry(0.41, 0.06, 6, 12);
    headbandGeo.rotateX(Math.PI / 2);
    const headband = new THREE.Mesh(headbandGeo, trimMat);
    headband.position.y = 0.36;
    this.headGroup.add(headband);

    // Cloth tail trailing from headband
    const tailGeo = new THREE.BoxGeometry(0.12, 0.45, 0.04);
    this.clothTail = new THREE.Mesh(tailGeo, trimMat);
    this.clothTail.position.set(0, 0.15, -0.42);
    this.headGroup.add(this.clothTail);

    // Stylized Anime/Mini-Ninjas Eyes
    const eyeWhiteGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const pupilGeo = new THREE.SphereGeometry(0.05, 8, 8);

    // Left eye
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    leftEyeWhite.position.set(0.15, 0.32, 0.36);
    leftEyeWhite.scale.set(1, 1.2, 0.3);
    const leftPupil = new THREE.Mesh(pupilGeo, eyeMat);
    leftPupil.position.set(0.15, 0.32, 0.39);
    leftPupil.scale.set(1, 1.2, 0.3);
    this.headGroup.add(leftEyeWhite);
    this.headGroup.add(leftPupil);

    // Right eye
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    rightEyeWhite.position.set(-0.15, 0.32, 0.36);
    rightEyeWhite.scale.set(1, 1.2, 0.3);
    const rightPupil = new THREE.Mesh(pupilGeo, eyeMat);
    rightPupil.position.set(-0.15, 0.32, 0.39);
    rightPupil.scale.set(1, 1.2, 0.3);
    this.headGroup.add(rightEyeWhite);
    this.headGroup.add(rightPupil);

    // Left Arm (Upper arm + Forearm)
    this.leftUpperArm = new THREE.Group();
    this.leftUpperArm.position.set(0.42, 0.28, 0);
    this.torso.add(this.leftUpperArm);

    const leftArmGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.4, 6);
    leftArmGeo.translate(0, -0.2, 0);
    const leftArmMesh = new THREE.Mesh(leftArmGeo, tunicMat);
    this.leftUpperArm.add(leftArmMesh);

    this.leftForearm = new THREE.Group();
    this.leftForearm.position.set(0, -0.4, 0);
    this.leftUpperArm.add(this.leftForearm);

    const leftForearmMesh = new THREE.Mesh(leftArmGeo, skinMat);
    this.leftForearm.add(leftForearmMesh);

    // Right Arm (holds the Shepherd's Crook)
    this.rightUpperArm = new THREE.Group();
    this.rightUpperArm.position.set(-0.42, 0.28, 0);
    this.torso.add(this.rightUpperArm);

    const rightArmMesh = new THREE.Mesh(leftArmGeo, tunicMat);
    this.rightUpperArm.add(rightArmMesh);

    this.rightForearm = new THREE.Group();
    this.rightForearm.position.set(0, -0.4, 0);
    this.rightUpperArm.add(this.rightForearm);

    const rightForearmMesh = new THREE.Mesh(leftArmGeo, skinMat);
    this.rightForearm.add(rightForearmMesh);

    // Shepherd's Crook Staff
    this.staffGroup = new THREE.Group();
    this.staffGroup.position.set(0, -0.38, 0.15);
    this.staffGroup.rotation.x = Math.PI / 12;
    this.rightForearm.add(this.staffGroup);

    // Main shaft
    const staffShaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.1, 6);
    const staffShaft = new THREE.Mesh(staffShaftGeo, woodMat);
    staffShaft.castShadow = true;
    this.staffGroup.add(staffShaft);

    // Curved hook at top of crook
    const hookGeo = new THREE.TorusGeometry(0.18, 0.04, 6, 12, Math.PI * 1.25);
    hookGeo.rotateZ(-Math.PI / 2);
    const hook = new THREE.Mesh(hookGeo, woodMat);
    hook.position.set(0.12, 1.05, 0);
    this.staffGroup.add(hook);

    // Brass bands on staff
    const ringGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.06, 8);
    const ring1 = new THREE.Mesh(ringGeo, trimMat);
    ring1.position.y = 0.75;
    const ring2 = new THREE.Mesh(ringGeo, trimMat);
    ring2.position.y = 0.2;
    this.staffGroup.add(ring1);
    this.staffGroup.add(ring2);

    // Staff glowing tip (activates during Faith Light)
    const tipGeo = new THREE.SphereGeometry(0.1, 8, 8);
    this.staffTipMat = new THREE.MeshBasicMaterial({ color: 0xfff0aa, transparent: true, opacity: 0.0 });
    this.staffTip = new THREE.Mesh(tipGeo, this.staffTipMat);
    this.staffTip.position.set(0.24, 1.15, 0);
    this.staffGroup.add(this.staffTip);

    // PointLight on staff tip
    this.staffLight = new THREE.PointLight(0xffdf80, 0, 15);
    this.staffTip.add(this.staffLight);

    // Left Leg
    this.leftUpperLeg = new THREE.Group();
    this.leftUpperLeg.position.set(0.2, -0.05, 0);
    this.hips.add(this.leftUpperLeg);

    const legGeo = new THREE.CylinderGeometry(0.13, 0.10, 0.45, 6);
    legGeo.translate(0, -0.22, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, tunicMat);
    this.leftUpperLeg.add(leftLegMesh);

    this.leftLowerLeg = new THREE.Group();
    this.leftLowerLeg.position.set(0, -0.45, 0);
    this.leftUpperLeg.add(this.leftLowerLeg);

    const shinGeo = new THREE.CylinderGeometry(0.10, 0.09, 0.45, 6);
    shinGeo.translate(0, -0.22, 0);
    const leftShinMesh = new THREE.Mesh(shinGeo, skinMat);
    this.leftLowerLeg.add(leftShinMesh);

    const footGeo = new THREE.BoxGeometry(0.18, 0.12, 0.32);
    const leftFoot = new THREE.Mesh(footGeo, leatherMat);
    leftFoot.position.set(0, -0.45, 0.08);
    leftFoot.castShadow = true;
    this.leftLowerLeg.add(leftFoot);

    // Right Leg
    this.rightUpperLeg = new THREE.Group();
    this.rightUpperLeg.position.set(-0.2, -0.05, 0);
    this.hips.add(this.rightUpperLeg);

    const rightLegMesh = new THREE.Mesh(legGeo, tunicMat);
    this.rightUpperLeg.add(rightLegMesh);

    this.rightLowerLeg = new THREE.Group();
    this.rightLowerLeg.position.set(0, -0.45, 0);
    this.rightUpperLeg.add(this.rightLowerLeg);

    const rightShinMesh = new THREE.Mesh(shinGeo, skinMat);
    this.rightLowerLeg.add(rightShinMesh);

    const rightFoot = new THREE.Mesh(footGeo, leatherMat);
    rightFoot.position.set(0, -0.45, 0.08);
    rightFoot.castShadow = true;
    this.rightLowerLeg.add(rightFoot);
  }

  createDustParticles() {
    this.dustParticles = [];
    const dustGeo = new THREE.SphereGeometry(0.12, 4, 4);
    const dustMat = new THREE.MeshBasicMaterial({ color: 0xd2b48c, transparent: true, opacity: 0 });

    for (let i = 0; i < 15; i++) {
      const p = new THREE.Mesh(dustGeo, dustMat.clone());
      p.visible = false;
      this.scene.add(p);
      this.dustParticles.push({
        mesh: p,
        life: 0,
        maxLife: 0.35,
        vel: new THREE.Vector3()
      });
    }
  }

  spawnDust(pos) {
    const p = this.dustParticles.find(item => !item.mesh.visible);
    if (!p) return;
    p.mesh.visible = true;
    p.mesh.position.copy(pos);
    p.mesh.position.y += 0.05;
    p.life = 0;
    p.mesh.material.opacity = 0.6;
    p.mesh.scale.set(1, 1, 1);
    p.vel.set(
      (Math.random() - 0.5) * 1.5,
      Math.random() * 0.8 + 0.3,
      (Math.random() - 0.5) * 1.5
    );
  }

  createFaithAura() {
    // Ring of golden light pulses on the ground
    const ringGeo = new THREE.RingGeometry(0.5, 2.5, 24);
    ringGeo.rotateX(-Math.PI / 2);
    this.faithAuraMat = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.faithAura = new THREE.Mesh(ringGeo, this.faithAuraMat);
    this.faithAura.position.y = 0.08;
    this.group.add(this.faithAura);
  }

  // Activate spiritual ability: "Light of Faith"
  activateFaithAbility() {
    if (this.faithEnergy < 25 || this.isRolling) return false;
    this.faithEnergy = Math.max(0, this.faithEnergy - 25);
    this.isPraying = true;
    this.prayTimer = 1.6;
    this.faithAuraActive = true;
    sounds.playFaithLight();
    return true;
  }

  triggerRoll() {
    if (this.isRolling || !this.isGrounded) return;
    this.isRolling = true;
    this.rollTimer = 0;
    sounds.playRoll();
  }

  triggerJump() {
    if (!this.isGrounded || this.isRolling) return;
    this.velocity.y = this.jumpForce;
    this.isGrounded = false;
    sounds.playJump();
    this.spawnDust(this.position);
  }

  update(delta, inputDir, isSprint, cameraAngle, getTerrainHeight) {
    this.animTime += delta;

    // Regain faith energy over time
    if (this.faithEnergy < this.maxFaith) {
      this.faithEnergy = Math.min(this.maxFaith, this.faithEnergy + delta * 8);
    }

    // Praying / Spiritual Stance
    if (this.isPraying) {
      this.prayTimer -= delta;
      const t = 1.0 - (this.prayTimer / 1.6);

      // Raise staff high into air
      this.staffTipMat.opacity = Math.sin(t * Math.PI) * 0.95;
      this.staffLight.intensity = Math.sin(t * Math.PI) * 4.5;
      this.staffLight.distance = 25;

      this.faithAuraMat.opacity = Math.sin(t * Math.PI) * 0.7;
      this.faithAura.scale.setScalar(1 + t * 1.8);

      this.rightUpperArm.rotation.x = -Math.PI * 0.85;
      this.leftUpperArm.rotation.x = -Math.PI * 0.85;
      this.headGroup.rotation.x = -0.4;

      if (this.prayTimer <= 0) {
        this.isPraying = false;
        this.faithAuraActive = false;
        this.staffTipMat.opacity = 0;
        this.staffLight.intensity = 0;
        this.faithAuraMat.opacity = 0;
      }
      // Cannot move while channeling prayer
      this.velocity.x = 0;
      this.velocity.z = 0;
      return;
    }

    // Rolling animation
    if (this.isRolling) {
      this.rollTimer += delta;
      const rollProgress = this.rollTimer / this.rollDuration;

      // Spin mesh 360 degrees forward
      this.meshRoot.rotation.x = rollProgress * Math.PI * 2;
      this.meshRoot.position.y = -Math.sin(rollProgress * Math.PI) * 0.35;

      // Burst forward in heading
      const rollSpeed = 16.0;
      this.position.x += Math.sin(this.rotationY) * rollSpeed * delta;
      this.position.z += Math.cos(this.rotationY) * rollSpeed * delta;

      if (this.rollTimer >= this.rollDuration) {
        this.isRolling = false;
        this.meshRoot.rotation.x = 0;
        this.meshRoot.position.y = 0;
      }
      return;
    }

    // Movement calculation
    const isMoving = inputDir.lengthSq() > 0.01;
    const currentSpeed = isSprint ? this.sprintSpeed : this.walkSpeed;

    if (isMoving) {
      // Calculate target angle relative to camera
      const moveAngle = Math.atan2(inputDir.x, inputDir.z) + cameraAngle;
      this.targetRotationY = moveAngle;

      // Smooth turn towards target direction
      let diff = this.targetRotationY - this.rotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotationY += diff * Math.min(1.0, delta * 14.0);
      this.group.rotation.y = this.rotationY;

      // Move forward
      this.velocity.x = Math.sin(this.rotationY) * currentSpeed;
      this.velocity.z = Math.cos(this.rotationY) * currentSpeed;

      // Footstep sound & dust
      const stepFreq = isSprint ? 0.24 : 0.38;
      this.footstepTimer += delta;
      if (this.footstepTimer >= stepFreq && this.isGrounded) {
        this.footstepTimer = 0;
        sounds.playFootstep();
        this.spawnDust(this.position);
      }
    } else {
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, delta * 12.0);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, delta * 12.0);
    }

    // Gravity & Ground snap
    this.velocity.y -= this.gravity * delta;
    this.position.y += this.velocity.y * delta;

    const groundY = getTerrainHeight ? getTerrainHeight(this.position.x, this.position.z) : 0;
    if (this.position.y <= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      if (!this.isGrounded) {
        // Landing impact
        this.isGrounded = true;
        sounds.playFootstep('stone');
        this.spawnDust(this.position);
      }
    }

    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    // Mini Ninjas Procedural Animation System
    this.animate(delta, isMoving, isSprint);

    // Update dust particles
    this.updateParticles(delta);
  }

  animate(delta, isMoving, isSprint) {
    if (!this.isGrounded) {
      // Jump Pose: legs drawn slightly up, arms raised, staff flared
      this.leftUpperLeg.rotation.x = -0.6;
      this.rightUpperLeg.rotation.x = 0.5;
      this.leftLowerLeg.rotation.x = 0.8;
      this.rightLowerLeg.rotation.x = 0.8;

      this.leftUpperArm.rotation.x = -1.1;
      this.rightUpperArm.rotation.x = -0.9;
      this.torso.rotation.x = 0.1;
      this.hips.position.y = 1.05;
      return;
    }

    if (isMoving) {
      const animRate = isSprint ? 16.0 : 10.0;
      const legSwing = Math.sin(this.animTime * animRate);
      const armSwing = Math.cos(this.animTime * animRate);

      // Dynamic forward lean (Mini Ninjas style!)
      const forwardLean = isSprint ? 0.32 : 0.18;
      this.torso.rotation.x = forwardLean;
      this.torso.rotation.y = legSwing * 0.12;

      // Headbob & cloth physics
      this.headGroup.rotation.x = -forwardLean * 0.5 + Math.sin(this.animTime * animRate * 2) * 0.05;
      this.clothTail.rotation.x = 0.4 + (isSprint ? 0.3 : 0.1) + Math.sin(this.animTime * animRate) * 0.15;

      // Legs swing
      const swingAmp = isSprint ? 0.85 : 0.65;
      this.leftUpperLeg.rotation.x = legSwing * swingAmp;
      this.rightUpperLeg.rotation.x = -legSwing * swingAmp;

      // Lower leg bend on back-kick
      this.leftLowerLeg.rotation.x = Math.max(0, -legSwing * 1.2);
      this.rightLowerLeg.rotation.x = Math.max(0, legSwing * 1.2);

      // Arms swing
      this.leftUpperArm.rotation.x = armSwing * swingAmp;
      this.rightUpperArm.rotation.x = -armSwing * swingAmp * 0.65; // holds staff steady
      this.staffGroup.rotation.x = Math.PI / 12 + armSwing * 0.2;

      // Running vertical bounce
      this.hips.position.y = 1.05 + Math.abs(Math.sin(this.animTime * animRate)) * (isSprint ? 0.14 : 0.08);
    } else {
      // Idle Breathing & subtle sway
      const breath = Math.sin(this.animTime * 2.5);
      this.hips.position.y = 1.05 + breath * 0.02;
      this.torso.rotation.x = THREE.MathUtils.lerp(this.torso.rotation.x, 0, delta * 8);
      this.torso.rotation.y = THREE.MathUtils.lerp(this.torso.rotation.y, 0, delta * 8);
      this.headGroup.rotation.x = breath * 0.03;
      this.clothTail.rotation.x = 0.1 + breath * 0.04;

      this.leftUpperLeg.rotation.x = THREE.MathUtils.lerp(this.leftUpperLeg.rotation.x, 0, delta * 8);
      this.rightUpperLeg.rotation.x = THREE.MathUtils.lerp(this.rightUpperLeg.rotation.x, 0, delta * 8);
      this.leftLowerLeg.rotation.x = THREE.MathUtils.lerp(this.leftLowerLeg.rotation.x, 0, delta * 8);
      this.rightLowerLeg.rotation.x = THREE.MathUtils.lerp(this.rightLowerLeg.rotation.x, 0, delta * 8);

      this.leftUpperArm.rotation.x = breath * 0.08;
      this.rightUpperArm.rotation.x = -0.1 + breath * 0.05;
      this.staffGroup.rotation.x = Math.PI / 14 + breath * 0.04;
    }
  }

  updateParticles(delta) {
    for (const p of this.dustParticles) {
      if (!p.mesh.visible) continue;
      p.life += delta;
      p.mesh.position.addScaledVector(p.vel, delta);
      p.mesh.scale.multiplyScalar(1.0 + delta * 2.0);
      p.mesh.material.opacity = (1.0 - (p.life / p.maxLife)) * 0.5;

      if (p.life >= p.maxLife) {
        p.mesh.visible = false;
      }
    }
  }
}
