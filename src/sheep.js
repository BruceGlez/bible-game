import * as THREE from 'three';
import { sounds } from './audio.js';

export class Sheep {
  constructor(scene, getTerrainHeight, id, startX, startZ, name) {
    this.scene = scene;
    this.getTerrainHeight = getTerrainHeight;
    this.id = id;
    this.name = name;

    this.group = new THREE.Group();
    this.position = this.group.position;
    this.position.set(startX, this.getTerrainHeight(startX, startZ), startZ);

    this.state = 'idle'; // 'idle', 'wander', 'follow', 'safe'
    this.speed = 3.6;
    this.animTime = Math.random() * 10;
    this.wanderTimer = Math.random() * 3 + 2;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.baaTimer = 5 + Math.random() * 8;

    this.isRescued = false;
    this.isSafelyHome = false;

    this.createModel();
    this.scene.add(this.group);
  }

  createModel() {
    const woolMat = new THREE.MeshLambertMaterial({ color: 0xf5f3ea }); // Soft fluffy cream wool
    const skinMat = new THREE.MeshLambertMaterial({ color: 0x3d312a }); // Dark face/feet
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // Wool Body (fluffy rounded cloud shape)
    const bodyGeo = new THREE.DodecahedronGeometry(0.7, 1);
    this.body = new THREE.Mesh(bodyGeo, woolMat);
    this.body.position.y = 0.75;
    this.body.scale.set(1.0, 0.9, 1.3);
    this.body.castShadow = true;
    this.group.add(this.body);

    // Wool clump collar
    const collarGeo = new THREE.SphereGeometry(0.5, 8, 8);
    const collar = new THREE.Mesh(collarGeo, woolMat);
    collar.position.set(0, 0.95, 0.6);
    this.group.add(collar);

    // Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.95, 0.9);
    this.group.add(this.headGroup);

    const headGeo = new THREE.CylinderGeometry(0.2, 0.14, 0.45, 8);
    headGeo.rotateX(Math.PI / 4);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    this.headGroup.add(head);

    // Floppy ears
    const earGeo = new THREE.BoxGeometry(0.3, 0.08, 0.12);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(0.25, 0.1, -0.05);
    leftEar.rotation.z = -0.3;

    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(-0.25, 0.1, -0.05);
    rightEar.rotation.z = 0.3;

    this.headGroup.add(leftEar);
    this.headGroup.add(rightEar);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(0.12, 0.08, 0.2);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(-0.12, 0.08, 0.2);
    this.headGroup.add(leftEye);
    this.headGroup.add(rightEye);

    // 4 Tiny stylized legs
    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.5, 6);
    legGeo.translate(0, -0.25, 0);

    this.frontLeftLeg = new THREE.Mesh(legGeo, skinMat);
    this.frontLeftLeg.position.set(0.32, 0.5, 0.4);
    this.frontRightLeg = new THREE.Mesh(legGeo, skinMat);
    this.frontRightLeg.position.set(-0.32, 0.5, 0.4);

    this.backLeftLeg = new THREE.Mesh(legGeo, skinMat);
    this.backLeftLeg.position.set(0.32, 0.5, -0.4);
    this.backRightLeg = new THREE.Mesh(legGeo, skinMat);
    this.backRightLeg.position.set(-0.32, 0.5, -0.4);

    this.group.add(this.frontLeftLeg);
    this.group.add(this.frontRightLeg);
    this.group.add(this.backLeftLeg);
    this.group.add(this.backRightLeg);

    // Heart icon over head when rescued
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, 0.3, -0.3, 0.6, -0.6, 0.6);
    heartShape.bezierCurveTo(-1.0, 0.6, -1.0, 0, -1.0, 0);
    heartShape.bezierCurveTo(-1.0, -0.4, -0.5, -0.8, 0, -1.2);
    heartShape.bezierCurveTo(0.5, -0.8, 1.0, -0.4, 1.0, 0);
    heartShape.bezierCurveTo(1.0, 0, 1.0, 0.6, 0.6, 0.6);
    heartShape.bezierCurveTo(0.3, 0.6, 0, 0.3, 0, 0);

    const heartGeo = new THREE.ShapeGeometry(heartShape);
    const heartMat = new THREE.MeshBasicMaterial({ color: 0xff4d6d, side: THREE.DoubleSide });
    this.heartMesh = new THREE.Mesh(heartGeo, heartMat);
    this.heartMesh.scale.set(0.25, 0.25, 0.25);
    this.heartMesh.rotation.z = Math.PI;
    this.heartMesh.position.set(0, 1.8, 0);
    this.heartMesh.visible = false;
    this.group.add(this.heartMesh);
  }

  rescue() {
    if (this.isRescued) return;
    this.isRescued = true;
    this.state = 'follow';
    this.heartMesh.visible = true;
    sounds.playSheepBaa();
  }

  markSafe() {
    this.state = 'safe';
    this.isSafelyHome = true;
    this.heartMesh.visible = true;
  }

  update(delta, playerPos, foldTarget) {
    this.animTime += delta;

    // Periodic cute "baa"
    this.baaTimer -= delta;
    if (this.baaTimer <= 0) {
      this.baaTimer = 8 + Math.random() * 12;
      const dToPlayer = this.position.distanceTo(playerPos);
      if (dToPlayer < 25) {
        sounds.playSheepBaa();
      }
    }

    if (this.heartMesh.visible) {
      this.heartMesh.position.y = 1.8 + Math.sin(this.animTime * 4) * 0.12;
      this.heartMesh.rotation.y = this.animTime * 2;
    }

    // AI Behaviors
    let isMoving = false;

    if (this.state === 'safe') {
      // Happily grazing inside the sheepfold
      this.headGroup.rotation.x = 0.3 + Math.sin(this.animTime * 2) * 0.15;
      this.body.position.y = 0.75 + Math.sin(this.animTime * 1.5) * 0.02;
      return;
    }

    if (this.state === 'follow') {
      // Check if arrived at sheepfold
      const distToFold = this.position.distanceTo(foldTarget);
      if (distToFold < 7.5) {
        this.markSafe();
        return;
      }

      // Follow player
      const distToPlayer = this.position.distanceTo(playerPos);
      if (distToPlayer > 3.0) {
        isMoving = true;
        const dir = new THREE.Vector3().subVectors(playerPos, this.position).normalize();
        this.group.rotation.y = Math.atan2(dir.x, dir.z);

        this.position.x += dir.x * this.speed * delta;
        this.position.z += dir.z * this.speed * delta;
      }
    } else {
      // Idle / Wonder state
      this.wanderTimer -= delta;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = Math.random() * 4 + 2;
        if (Math.random() < 0.4) {
          this.state = 'wander';
          this.wanderAngle = Math.random() * Math.PI * 2;
        } else {
          this.state = 'idle';
        }
      }

      if (this.state === 'wander') {
        isMoving = true;
        this.group.rotation.y = this.wanderAngle;
        const dx = Math.sin(this.wanderAngle) * (this.speed * 0.45) * delta;
        const dz = Math.cos(this.wanderAngle) * (this.speed * 0.45) * delta;
        this.position.x += dx;
        this.position.z += dz;
      }
    }

    // Snap to terrain height
    const groundY = this.getTerrainHeight(this.position.x, this.position.z);
    this.position.y = groundY;

    // Leg trotting animation
    if (isMoving) {
      const legRate = 12.0;
      const legSwing = Math.sin(this.animTime * legRate) * 0.5;
      this.frontLeftLeg.rotation.x = legSwing;
      this.frontRightLeg.rotation.x = -legSwing;
      this.backLeftLeg.rotation.x = -legSwing;
      this.backRightLeg.rotation.x = legSwing;
      this.body.position.y = 0.75 + Math.abs(Math.sin(this.animTime * legRate)) * 0.08;
    } else {
      this.frontLeftLeg.rotation.x = 0;
      this.frontRightLeg.rotation.x = 0;
      this.backLeftLeg.rotation.x = 0;
      this.backRightLeg.rotation.x = 0;
      this.headGroup.rotation.x = Math.sin(this.animTime * 2) * 0.12;
    }
  }
}
