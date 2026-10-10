import * as THREE from 'three';

export class NPC {
  constructor(scene, getTerrainHeight, config) {
    this.scene = scene;
    this.getTerrainHeight = getTerrainHeight;
    this.id = config.id;
    this.name = config.name;
    this.title = config.title;
    this.x = config.x;
    this.z = config.z;
    this.dialogue = config.dialogue;
    this.robeColor = config.robeColor || 0xc4a36e;
    this.hasBeard = !!config.hasBeard;

    this.group = new THREE.Group();
    this.position = this.group.position;
    const gy = this.getTerrainHeight(this.x, this.z);
    this.position.set(this.x, gy, this.z);

    this.animTime = Math.random() * 5;
    this.questState = 'available'; // 'available', 'active', 'completed'

    this.createModel();
    this.createQuestIndicator();
    this.scene.add(this.group);
  }

  createModel() {
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xdeb887 });
    const robeMat = new THREE.MeshLambertMaterial({ color: this.robeColor });
    const hairMat = new THREE.MeshLambertMaterial({ color: this.hasBeard ? 0xf0f0f0 : 0x241d18 });
    const caneMat = new THREE.MeshLambertMaterial({ color: 0x5a3d28 });

    // Robed Body
    const robeGeo = new THREE.CylinderGeometry(0.38, 0.58, 1.8, 8);
    const robe = new THREE.Mesh(robeGeo, robeMat);
    robe.position.y = 0.9;
    robe.castShadow = true;
    this.group.add(robe);

    // Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 1.95;
    this.group.add(this.headGroup);

    const headGeo = new THREE.SphereGeometry(0.32, 8, 8);
    const head = new THREE.Mesh(headGeo, skinMat);
    this.headGroup.add(head);

    // Head covering / turban
    const turbanGeo = new THREE.SphereGeometry(0.36, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const turbanMat = new THREE.MeshLambertMaterial({ color: 0xeee8d5 });
    const turban = new THREE.Mesh(turbanGeo, turbanMat);
    turban.position.y = 0.08;
    this.headGroup.add(turban);

    // Beard if elder
    if (this.hasBeard) {
      const beardGeo = new THREE.ConeGeometry(0.25, 0.6, 6);
      beardGeo.rotateX(-0.25);
      const beard = new THREE.Mesh(beardGeo, hairMat);
      beard.position.set(0, -0.22, 0.22);
      this.headGroup.add(beard);

      // Walking cane in hand
      const caneGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.9, 6);
      const cane = new THREE.Mesh(caneGeo, caneMat);
      cane.position.set(0.65, -1.0, 0.35);
      this.group.add(cane);
    }

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.7, 6);
    const leftArm = new THREE.Mesh(armGeo, robeMat);
    leftArm.position.set(0.48, 1.35, 0.1);
    leftArm.rotation.x = 0.3;
    this.group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, robeMat);
    rightArm.position.set(-0.48, 1.35, 0.1);
    rightArm.rotation.x = 0.3;
    this.group.add(rightArm);
  }

  createQuestIndicator() {
    this.indicatorGroup = new THREE.Group();
    this.indicatorGroup.position.y = 2.6;

    // Stylized floating diamond / exclamation mark
    const diamondGeo = new THREE.OctahedronGeometry(0.24, 0);
    this.indicatorMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    this.indicator = new THREE.Mesh(diamondGeo, this.indicatorMat);
    this.indicatorGroup.add(this.indicator);

    this.group.add(this.indicatorGroup);
  }

  setQuestState(state) {
    this.questState = state;
    if (state === 'available') {
      this.indicatorMat.color.setHex(0xffd700); // Golden exclamation
      this.indicatorGroup.visible = true;
    } else if (state === 'active') {
      this.indicatorMat.color.setHex(0x00bcd4); // Cyan in-progress
      this.indicatorGroup.visible = true;
    } else if (state === 'ready') {
      this.indicatorMat.color.setHex(0x4caf50); // Green ready to complete
      this.indicatorGroup.visible = true;
    } else {
      this.indicatorGroup.visible = false; // Hidden when fully completed
    }
  }

  update(delta, playerPos) {
    this.animTime += delta;

    // Gentle breathing
    this.headGroup.position.y = 1.95 + Math.sin(this.animTime * 2.2) * 0.02;

    // Bobbing indicator
    if (this.indicatorGroup.visible) {
      this.indicator.position.y = Math.sin(this.animTime * 4.0) * 0.12;
      this.indicator.rotation.y = this.animTime * 3.0;
    }

    // Look towards player when close
    const dist = this.position.distanceTo(playerPos);
    if (dist < 10) {
      const angle = Math.atan2(playerPos.x - this.position.x, playerPos.z - this.position.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, angle, delta * 5);
    }
  }
}
