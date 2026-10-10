import * as THREE from 'three';

export class BiblicalWorld {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.interactiveObjects = [];
    this.fireParticles = [];

    // Terrain size
    this.worldSize = 220;
    this.gridResolution = 110;

    this.createEnvironment();
    this.createTerrain();
    this.createVillage();
    this.createWatchtowerRuins();
    this.createCaveOfInscriptions();
    this.createVegetation();
    this.createGrassTufts();
    this.createProps();
    this.createAtmosphere();
    this.createClouds();
  }

  createEnvironment() {
    // Warm biblical golden daylight & atmospheric fog
    this.scene.background = new THREE.Color(0xdcecfb);
    this.scene.fog = new THREE.FogExp2(0xe8e0d4, 0.0065);

    // Ambient light - warm desert bounce & sky illumination
    const hemiLight = new THREE.HemisphereLight(0xfff7ea, 0x8a7761, 0.85);
    this.scene.add(hemiLight);

    // Main Golden Sun
    this.sunLight = new THREE.DirectionalLight(0xfff1cf, 1.4);
    this.sunLight.position.set(65, 95, 45);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 260;
    const d = 80;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);

    // Soft warm fill light for gentle stylized shadows
    const fillLight = new THREE.DirectionalLight(0xd9b382, 0.35);
    fillLight.position.set(-50, 40, -40);
    this.scene.add(fillLight);
  }

  getTerrainHeight(x, z) {
    // Distance from center village
    const dist = Math.hypot(x, z);

    // Village center plateau (flat around Bethany village)
    let h = 0;

    // Rolling gentle hills
    h += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2.5;
    h += Math.sin(x * 0.02 + 1.2) * Math.cos(z * 0.02 + 0.8) * 4.5;

    // Elevated watchtower cliff to the North-East (x > 30, z < -30)
    const cliffDist = Math.hypot(x - 55, z + 55);
    if (cliffDist < 45) {
      const t = Math.max(0, 1 - cliffDist / 45);
      h += t * t * 14.0;
    }

    // Ancient Cavern cliff to the West (x < -45)
    if (x < -40) {
      const t = Math.min(1, (-x - 40) / 25);
      h += t * 11.0;
    }

    // Dry brook / stream depression of Elah (running along z axis at x = 20 to 28)
    const brookDist = Math.abs(x - 22);
    if (brookDist < 8 && Math.abs(z) < 65) {
      h -= (1 - (brookDist / 8)) * 2.2;
    }

    // Flatten village center (radius 22 around origin)
    if (dist < 26) {
      const blend = dist / 26;
      h = h * blend * blend;
    }

    return h;
  }

  createTerrain() {
    const geo = new THREE.PlaneGeometry(
      this.worldSize,
      this.worldSize,
      this.gridResolution,
      this.gridResolution
    );
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      pos.setY(i, this.getTerrainHeight(vx, vz));
    }
    geo.computeVertexNormals();

    // Stylized terrain vertex colors: blend grass meadows, warm desert paths, stone cliffs, and brook pebbles
    const colors = new Float32Array(pos.count * 3);
    const normals = geo.attributes.normal;
    const colSand = new THREE.Color(0xdec69a);   // Village paths & warm sand
    const colGrass = new THREE.Color(0x8fa867);  // Sage green biblical hillside
    const colRock = new THREE.Color(0xb59e7e);   // Limestone rock
    const colBrook = new THREE.Color(0x9a8868);  // Damp brook bed
    const colCliff = new THREE.Color(0xcba476);  // Warm sunlit canyon
    const finalCol = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const ny = normals.getY(i);
      const dist = Math.hypot(x, z);
      const brookDist = Math.abs(x - 22);

      // Base: golden sand
      finalCol.copy(colSand);

      // Brook of Elah depression
      if (brookDist < 7.5 && Math.abs(z) < 65) {
        const t = 1 - (brookDist / 7.5);
        finalCol.lerp(colBrook, t * 0.85);
      } else if (dist > 20 && ny > 0.80 && y > 0.1) {
        // Rolling green meadows beyond village
        const grassFactor = Math.min(1, (dist - 20) / 16) * Math.min(1, (ny - 0.80) / 0.15);
        finalCol.lerp(colGrass, grassFactor * 0.78);
      }

      // Steeper slopes & ridges
      if (ny < 0.78) {
        const steepness = (0.78 - ny) / 0.35;
        finalCol.lerp(colRock, Math.min(1, steepness));
      }

      // High cliffs (watchtower & cave peaks)
      if (y > 6.0) {
        finalCol.lerp(colCliff, Math.min(1, (y - 6.0) / 8.0));
      }

      colors[i * 3] = finalCol.r;
      colors[i * 3 + 1] = finalCol.g;
      colors[i * 3 + 2] = finalCol.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const terrainMat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      roughness: 0.95
    });

    this.terrainMesh = new THREE.Mesh(geo, terrainMat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  createVillage() {
    // Village materials
    const stoneWallMat = new THREE.MeshLambertMaterial({ color: 0xccb28a }); // Light sand stone
    const woodBeamsMat = new THREE.MeshLambertMaterial({ color: 0x734827 });
    const clothCanopyMat = new THREE.MeshLambertMaterial({ color: 0xc24936 }); // Crimson awning
    const clothCanopyBlue = new THREE.MeshLambertMaterial({ color: 0x3d6b99 }); // Indigo awning
    const wellStoneMat = new THREE.MeshLambertMaterial({ color: 0x8a7f72 });

    // 1. Elder Simeon's House (North village)
    this.createHouse({
      x: -6, z: -16, width: 8, length: 10, height: 4.5,
      hasAwning: true, awningMat: clothCanopyMat,
      wallMat: stoneWallMat, woodMat: woodBeamsMat
    });

    // 2. Shepherd Martha's House (West village)
    this.createHouse({
      x: -16, z: 4, width: 7, length: 8, height: 4.2,
      hasAwning: true, awningMat: clothCanopyBlue,
      wallMat: stoneWallMat, woodMat: woodBeamsMat
    });

    // 3. Traveler's Storehouse (South-East village)
    this.createHouse({
      x: 12, z: 14, width: 9, length: 9, height: 5.0,
      hasAwning: false,
      wallMat: stoneWallMat, woodMat: woodBeamsMat
    });

    // 4. The Ancient Stone Well of Living Water (Village Center)
    this.createWell(wellStoneMat, woodBeamsMat);

    // 5. The Sheepfold (Stone enclosure with wooden fence)
    this.createSheepfold(stoneWallMat, woodBeamsMat);
  }

  createHouse({ x, z, width, length, height, hasAwning, awningMat, wallMat, woodMat }) {
    const houseGroup = new THREE.Group();
    const groundY = this.getTerrainHeight(x, z);
    houseGroup.position.set(x, groundY, z);

    // Main stone structure
    const bodyGeo = new THREE.BoxGeometry(width, height, length);
    const body = new THREE.Mesh(bodyGeo, wallMat);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    houseGroup.add(body);

    // Flat roof coping / terrace ledge
    const roofCopingGeo = new THREE.BoxGeometry(width + 0.4, 0.35, length + 0.4);
    const roofCoping = new THREE.Mesh(roofCopingGeo, wallMat);
    roofCoping.position.y = height + 0.17;
    roofCoping.castShadow = true;
    houseGroup.add(roofCoping);

    // Doorway opening (dark recessed box)
    const doorGeo = new THREE.BoxGeometry(1.6, 2.6, 0.4);
    const doorMat = new THREE.MeshBasicMaterial({ color: 0x221a15 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.3, length / 2 + 0.05);
    houseGroup.add(door);

    // Wooden door lintel beam
    const lintelGeo = new THREE.BoxGeometry(2.2, 0.25, 0.35);
    const lintel = new THREE.Mesh(lintelGeo, woodMat);
    lintel.position.set(0, 2.7, length / 2 + 0.1);
    houseGroup.add(lintel);

    // Windows
    const winGeo = new THREE.BoxGeometry(1.0, 1.2, 0.3);
    const winLeft = new THREE.Mesh(winGeo, doorMat);
    winLeft.position.set(width / 2 + 0.05, 2.5, 0);
    winLeft.rotation.y = Math.PI / 2;
    houseGroup.add(winLeft);

    // Fabric awning canopy out front
    if (hasAwning && awningMat) {
      const awningGeo = new THREE.BoxGeometry(4.2, 0.08, 2.8);
      awningGeo.rotateX(0.25);
      const awning = new THREE.Mesh(awningGeo, awningMat);
      awning.position.set(0, 3.2, length / 2 + 1.4);
      awning.castShadow = true;
      houseGroup.add(awning);

      // Support wooden posts
      const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.6, 6);
      const post1 = new THREE.Mesh(postGeo, woodMat);
      post1.position.set(-1.8, 1.3, length / 2 + 2.5);
      const post2 = new THREE.Mesh(postGeo, woodMat);
      post2.position.set(1.8, 1.3, length / 2 + 2.5);
      houseGroup.add(post1);
      houseGroup.add(post2);
    }

    this.scene.add(houseGroup);

    // Add bounding box collider
    this.colliders.push({
      box: new THREE.Box3().setFromObject(body)
    });
  }

  createWell(stoneMat, woodMat) {
    this.wellGroup = new THREE.Group();
    const groundY = this.getTerrainHeight(0, 0);
    this.wellGroup.position.set(0, groundY, 0);

    // Cylindrical stone well rim
    const wellRimGeo = new THREE.CylinderGeometry(1.6, 1.7, 1.1, 14, 1, true);
    const wellRim = new THREE.Mesh(wellRimGeo, stoneMat);
    wellRim.position.y = 0.55;
    wellRim.castShadow = true;
    this.wellGroup.add(wellRim);

    // Stone trough next to well for watering sheep
    const troughGeo = new THREE.BoxGeometry(2.4, 0.6, 1.1);
    const trough = new THREE.Mesh(troughGeo, stoneMat);
    trough.position.set(2.4, 0.3, 0);
    trough.castShadow = true;
    this.wellGroup.add(trough);

    // Water inside trough (initially low/dry, fills upon quest 2!)
    const waterGeo = new THREE.PlaneGeometry(2.1, 0.85);
    waterGeo.rotateX(-Math.PI / 2);
    this.waterMat = new THREE.MeshLambertMaterial({
      color: 0x4aa3df,
      transparent: true,
      opacity: 0.15
    });
    this.wellWater = new THREE.Mesh(waterGeo, this.waterMat);
    this.wellWater.position.set(2.4, 0.1, 0);
    this.wellGroup.add(this.wellWater);

    // Wooden A-frame posts
    const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.2, 6);
    const post1 = new THREE.Mesh(postGeo, woodMat);
    post1.position.set(0, 1.6, 1.2);
    const post2 = new THREE.Mesh(postGeo, woodMat);
    post2.position.set(0, 1.6, -1.2);

    const crossBeamGeo = new THREE.CylinderGeometry(0.09, 0.09, 2.6, 6);
    crossBeamGeo.rotateX(Math.PI / 2);
    const crossBeam = new THREE.Mesh(crossBeamGeo, woodMat);
    crossBeam.position.set(0, 3.0, 0);

    this.wellGroup.add(post1);
    this.wellGroup.add(post2);
    this.wellGroup.add(crossBeam);

    // Rope and wooden bucket
    const ropeGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.8, 4);
    const ropeMat = new THREE.MeshBasicMaterial({ color: 0xaa8855 });
    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    rope.position.set(0, 2.1, 0);
    this.wellGroup.add(rope);

    const bucketGeo = new THREE.CylinderGeometry(0.3, 0.24, 0.5, 8);
    const bucket = new THREE.Mesh(bucketGeo, woodMat);
    bucket.position.set(0, 1.1, 0);
    this.wellGroup.add(bucket);

    // Stone gear slot on the side for the quest
    const gearSlotGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 8);
    gearSlotGeo.rotateZ(Math.PI / 2);
    this.gearSlot = new THREE.Mesh(gearSlotGeo, new THREE.MeshLambertMaterial({ color: 0x444444 }));
    this.gearSlot.position.set(0.12, 2.9, -1.2);
    this.wellGroup.add(this.gearSlot);

    this.scene.add(this.wellGroup);

    this.colliders.push({
      box: new THREE.Box3().setFromObject(wellRim)
    });
  }

  createSheepfold(stoneMat, woodMat) {
    this.sheepfoldGroup = new THREE.Group();
    const sx = -22;
    const sz = -18;
    const sy = this.getTerrainHeight(sx, sz);
    this.sheepfoldGroup.position.set(sx, sy, sz);

    // U-shaped stone corral walls
    const wallHeight = 1.3;
    const wallThick = 0.6;
    const foldW = 12;
    const foldL = 10;

    // Back wall
    const backGeo = new THREE.BoxGeometry(foldW, wallHeight, wallThick);
    const backWall = new THREE.Mesh(backGeo, stoneMat);
    backWall.position.set(0, wallHeight / 2, -foldL / 2);
    this.sheepfoldGroup.add(backWall);

    // Left wall
    const sideGeo = new THREE.BoxGeometry(wallThick, wallHeight, foldL);
    const leftWall = new THREE.Mesh(sideGeo, stoneMat);
    leftWall.position.set(-foldW / 2, wallHeight / 2, 0);
    this.sheepfoldGroup.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(sideGeo, stoneMat);
    rightWall.position.set(foldW / 2, wallHeight / 2, 0);
    this.sheepfoldGroup.add(rightWall);

    // Front wall with open gate entrance
    const halfFrontGeo = new THREE.BoxGeometry((foldW - 3.5) / 2, wallHeight, wallThick);
    const frontL = new THREE.Mesh(halfFrontGeo, stoneMat);
    frontL.position.set(- (foldW - (foldW - 3.5) / 2) / 2, wallHeight / 2, foldL / 2);

    const frontR = new THREE.Mesh(halfFrontGeo, stoneMat);
    frontR.position.set((foldW - (foldW - 3.5) / 2) / 2, wallHeight / 2, foldL / 2);

    this.sheepfoldGroup.add(frontL);
    this.sheepfoldGroup.add(frontR);

    // Gate posts
    const gatePostGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.0, 6);
    const gPost1 = new THREE.Mesh(gatePostGeo, woodMat);
    gPost1.position.set(-1.8, 1.0, foldL / 2);
    const gPost2 = new THREE.Mesh(gatePostGeo, woodMat);
    gPost2.position.set(1.8, 1.0, foldL / 2);
    this.sheepfoldGroup.add(gPost1);
    this.sheepfoldGroup.add(gPost2);

    // Hay piles inside
    const hayGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.8, 8);
    const hayMat = new THREE.MeshLambertMaterial({ color: 0xd6c278 });
    const hay = new THREE.Mesh(hayGeo, hayMat);
    hay.position.set(3.0, 0.4, -2.5);
    this.sheepfoldGroup.add(hay);

    this.scene.add(this.sheepfoldGroup);

    // Sheepfold target destination for rescued sheep
    this.sheepfoldTarget = new THREE.Vector3(sx, sy, sz);
  }

  createWatchtowerRuins() {
    this.ruinsGroup = new THREE.Group();
    const rx = 52;
    const rz = -52;
    const ry = this.getTerrainHeight(rx, rz);
    this.ruinsGroup.position.set(rx, ry, rz);

    const ancientPillarMat = new THREE.MeshLambertMaterial({ color: 0xd8caa8 });

    // Ancient circular stone foundation
    const baseGeo = new THREE.CylinderGeometry(9.0, 10.0, 1.8, 16);
    const base = new THREE.Mesh(baseGeo, ancientPillarMat);
    base.position.y = 0.9;
    base.receiveShadow = true;
    this.ruinsGroup.add(base);

    // Broken Pillars around perimeter
    const pillarPositions = [
      { a: 0, h: 6.5 },
      { a: Math.PI * 0.25, h: 4.2 },
      { a: Math.PI * 0.5, h: 7.0 },
      { a: Math.PI * 0.75, h: 3.5 },
      { a: Math.PI * 1.0, h: 6.0 },
      { a: Math.PI * 1.25, h: 2.8 },
      { a: Math.PI * 1.5, h: 5.5 },
      { a: Math.PI * 1.75, h: 4.8 }
    ];

    pillarPositions.forEach(p => {
      const px = Math.cos(p.a) * 7.2;
      const pz = Math.sin(p.a) * 7.2;
      const pillarGeo = new THREE.CylinderGeometry(0.55, 0.65, p.h, 10);
      const pillar = new THREE.Mesh(pillarGeo, ancientPillarMat);
      pillar.position.set(px, 1.8 + p.h / 2, pz);
      pillar.castShadow = true;
      this.ruinsGroup.add(pillar);
    });

    // Central ancient Stone Pedestal
    const altGeo = new THREE.BoxGeometry(1.8, 1.2, 1.8);
    const altar = new THREE.Mesh(altGeo, ancientPillarMat);
    altar.position.set(0, 2.4, 0);
    altar.castShadow = true;
    this.ruinsGroup.add(altar);

    // Quest 2 Item: The Ancient Crank Mechanism / Stone Gear
    const gearGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.22, 12);
    const gearMat = new THREE.MeshLambertMaterial({ color: 0xe0a030, emissive: 0x442a08 });
    this.wellCrankItem = new THREE.Mesh(gearGeo, gearMat);
    this.wellCrankItem.position.set(0, 3.2, 0);
    this.wellCrankItem.castShadow = true;
    this.ruinsGroup.add(this.wellCrankItem);

    // Glowing beam over item
    const beamGeo = new THREE.CylinderGeometry(0.1, 0.4, 5.0, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    this.crankBeam = new THREE.Mesh(beamGeo, beamMat);
    this.crankBeam.position.set(0, 5.5, 0);
    this.ruinsGroup.add(this.crankBeam);

    this.scene.add(this.ruinsGroup);
  }

  createCaveOfInscriptions() {
    this.caveGroup = new THREE.Group();
    const cx = -55;
    const cz = 35;
    const cy = this.getTerrainHeight(cx, cz);
    this.caveGroup.position.set(cx, cy, cz);

    const darkStoneMat = new THREE.MeshLambertMaterial({ color: 0x5a483a });

    // Cave arch mouth
    const archGeo = new THREE.TorusGeometry(5.0, 2.2, 8, 12, Math.PI);
    archGeo.rotateZ(Math.PI);
    const arch = new THREE.Mesh(archGeo, darkStoneMat);
    arch.position.set(0, 2.0, 0);
    this.caveGroup.add(arch);

    // Cave interior hollow sphere
    const interiorGeo = new THREE.SphereGeometry(7.0, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.7);
    const interiorMat = new THREE.MeshLambertMaterial({
      color: 0x33261f,
      side: THREE.BackSide
    });
    const caveDome = new THREE.Mesh(interiorGeo, interiorMat);
    caveDome.position.set(0, 2.0, -4.5);
    this.caveGroup.add(caveDome);

    // Ancient Ark Chest inside
    const chestGeo = new THREE.BoxGeometry(1.4, 0.9, 0.9);
    const chestMat = new THREE.MeshLambertMaterial({ color: 0xb5893a, emissive: 0x2b1e06 });
    this.arkChest = new THREE.Mesh(chestGeo, chestMat);
    this.arkChest.position.set(0, 0.45, -5.5);
    this.arkChest.castShadow = true;
    this.caveGroup.add(this.arkChest);

    // Glowing ancient scripture runes etched on cave wall
    this.caveGlyphs = [];
    const glyphGeo = new THREE.PlaneGeometry(1.2, 0.6);
    this.glyphMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });

    for (let i = -2; i <= 2; i++) {
      const glyph = new THREE.Mesh(glyphGeo, this.glyphMat.clone());
      glyph.position.set(i * 1.8, 2.5 + Math.sin(i) * 0.4, -6.8);
      this.caveGroup.add(glyph);
      this.caveGlyphs.push(glyph);
    }

    this.scene.add(this.caveGroup);
  }

  createVegetation() {
    // Olive trees and Palm trees scattered across hills
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
    const oliveLeavesMat = new THREE.MeshLambertMaterial({ color: 0x5a7d50 }); // Silvery sage green
    const palmLeavesMat = new THREE.MeshLambertMaterial({ color: 0x2d6b38 });  // Deep palm green

    // 12 Olive Trees
    const oliveCoords = [
      [-14, -8], [-28, 12], [-35, -20], [-8, 24],
      [18, -12], [28, -25], [38, 10], [15, 38],
      [-22, 35], [45, -15], [30, 42], [-42, -5]
    ];

    oliveCoords.forEach(([ox, oz]) => {
      this.createOliveTree(ox, oz, trunkMat, oliveLeavesMat);
    });

    // 8 Date Palms near oasis and village borders
    const palmCoords = [
      [8, -2], [5, 6], [16, -6], [-5, 12],
      [24, 2], [32, -8], [-12, -28], [22, -35]
    ];

    palmCoords.forEach(([px, pz]) => {
      this.createPalmTree(px, pz, trunkMat, palmLeavesMat);
    });
  }

  createOliveTree(x, z, trunkMat, leavesMat) {
    const tree = new THREE.Group();
    const groundY = this.getTerrainHeight(x, z);
    tree.position.set(x, groundY, z);

    // Gnarled stylized trunk
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 3.2, 6);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.6;
    trunk.rotation.z = (Math.random() - 0.5) * 0.25;
    trunk.castShadow = true;
    tree.add(trunk);

    // Foliage canopy clumps
    const clumpOffsets = [
      [0, 3.4, 0, 1.8],
      [0.9, 3.1, 0.4, 1.4],
      [-0.8, 3.2, -0.5, 1.3],
      [0.2, 3.7, 0.8, 1.2]
    ];

    clumpOffsets.forEach(([cx, cy, cz, scale]) => {
      const foliageGeo = new THREE.DodecahedronGeometry(scale, 1);
      const foliage = new THREE.Mesh(foliageGeo, leavesMat);
      foliage.position.set(cx, cy, cz);
      foliage.castShadow = true;
      tree.add(foliage);
    });

    this.scene.add(tree);
  }

  createPalmTree(x, z, trunkMat, leavesMat) {
    const tree = new THREE.Group();
    const groundY = this.getTerrainHeight(x, z);
    tree.position.set(x, groundY, z);

    // Tall curved palm trunk
    const trunkHeight = 6.5;
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.45, trunkHeight, 7);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    trunk.castShadow = true;
    tree.add(trunk);

    // Palm fronds radiating out
    const numFronds = 7;
    for (let i = 0; i < numFronds; i++) {
      const angle = (i / numFronds) * Math.PI * 2;
      const frondGeo = new THREE.BoxGeometry(0.4, 0.08, 3.0);
      frondGeo.translate(0, 0, 1.5);
      frondGeo.rotateX(-0.35);

      const frond = new THREE.Mesh(frondGeo, leavesMat);
      frond.position.set(0, trunkHeight, 0);
      frond.rotation.y = angle;
      frond.castShadow = true;
      tree.add(frond);
    }

    this.scene.add(tree);
  }

  createProps() {
    // Clay amphoras, crates, and village campfire
    this.createCampfire(4, 8);

    // Target Jars for Quest 3 (David's Smooth Stones sling practice)
    this.targetJars = [];
    const jarMat = new THREE.MeshLambertMaterial({ color: 0xbf5b30 }); // Terracotta
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0xb5a082 });

    const jarPositions = [
      { x: 19, z: -10 },
      { x: 23, z: -4 },
      { x: 25, z: 8 },
      { x: 21, z: 18 }
    ];

    jarPositions.forEach((pos, idx) => {
      const group = new THREE.Group();
      const gy = this.getTerrainHeight(pos.x, pos.z);
      group.position.set(pos.x, gy, pos.z);

      // Stone post
      const postGeo = new THREE.CylinderGeometry(0.4, 0.45, 1.4, 6);
      const post = new THREE.Mesh(postGeo, pillarMat);
      post.position.y = 0.7;
      group.add(post);

      // Clay Jar target
      const jarGeo = new THREE.CylinderGeometry(0.2, 0.35, 0.65, 8);
      const jar = new THREE.Mesh(jarGeo, jarMat);
      jar.position.y = 1.7;
      jar.castShadow = true;
      group.add(jar);

      this.scene.add(group);
      this.targetJars.push({ group, jar, hit: false, index: idx });
    });

    // 5 Smooth Stones of Elah scattered along the dry brook (x: 20-25)
    this.smoothStones = [];
    const stoneGeo = new THREE.DodecahedronGeometry(0.25, 1);
    const stoneMat = new THREE.MeshLambertMaterial({
      color: 0x9ed1e8,
      emissive: 0x204060
    });

    const stoneCoords = [
      { x: 21, z: -18, label: "Stone of Faith" },
      { x: 24, z: -8, label: "Stone of Courage" },
      { x: 20, z: 2, label: "Stone of Truth" },
      { x: 23, z: 12, label: "Stone of Peace" },
      { x: 22, z: 24, label: "Stone of Righteousness" }
    ];

    stoneCoords.forEach((sc, idx) => {
      const gy = this.getTerrainHeight(sc.x, sc.z);
      const stoneMesh = new THREE.Mesh(stoneGeo, stoneMat.clone());
      stoneMesh.position.set(sc.x, gy + 0.25, sc.z);
      stoneMesh.castShadow = true;

      // Subtle glow ring
      const ringGeo = new THREE.RingGeometry(0.2, 0.5, 12);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x64b5f6,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(sc.x, gy + 0.08, sc.z);

      this.scene.add(stoneMesh);
      this.scene.add(ring);

      this.smoothStones.push({
        mesh: stoneMesh,
        ring: ring,
        label: sc.label,
        collected: false,
        x: sc.x,
        z: sc.z
      });
    });
  }

  createCampfire(x, z) {
    const fireGroup = new THREE.Group();
    const gy = this.getTerrainHeight(x, z);
    fireGroup.position.set(x, gy, z);

    // Stone ring around fire
    const ringMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rockGeo = new THREE.DodecahedronGeometry(0.22);
      const rock = new THREE.Mesh(rockGeo, ringMat);
      rock.position.set(Math.cos(a) * 0.75, 0.15, Math.sin(a) * 0.75);
      fireGroup.add(rock);
    }

    // Wood logs
    const logMat = new THREE.MeshLambertMaterial({ color: 0x4a2e18 });
    const logGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 5);
    logGeo.rotateZ(Math.PI / 4);
    const log1 = new THREE.Mesh(logGeo, logMat);
    const log2 = new THREE.Mesh(logGeo, logMat);
    log2.rotation.y = Math.PI / 2;
    fireGroup.add(log1);
    fireGroup.add(log2);

    // Campfire PointLight
    this.fireLight = new THREE.PointLight(0xff9922, 2.0, 16);
    this.fireLight.position.set(0, 0.8, 0);
    fireGroup.add(this.fireLight);

    // Fire flame cone meshes
    const flameGeo = new THREE.ConeGeometry(0.35, 0.9, 6);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    this.flameMesh = new THREE.Mesh(flameGeo, flameMat);
    this.flameMesh.position.y = 0.55;
    fireGroup.add(this.flameMesh);

    this.scene.add(fireGroup);
  }

  createGrassTufts() {
    // Instanced stylized grass blades for maximum mobile performance (1 draw call)
    const tuftCount = 280;
    const bladeGeo = new THREE.ConeGeometry(0.16, 0.6, 3);
    bladeGeo.translate(0, 0.3, 0);

    const grassMat = new THREE.MeshLambertMaterial({
      color: 0x829c5a,
      roughness: 0.9
    });

    this.grassInstanced = new THREE.InstancedMesh(bladeGeo, grassMat, tuftCount);
    this.grassInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;
    let attempts = 0;

    while (placed < tuftCount && attempts < 1500) {
      attempts++;
      const gx = (Math.random() - 0.5) * 160;
      const gz = (Math.random() - 0.5) * 160;
      const dist = Math.hypot(gx, gz);
      const brookDist = Math.abs(gx - 22);

      // Place in meadows outside village, away from brook center and deep cave
      if (dist > 22 && dist < 85 && brookDist > 6.0 && gx > -42) {
        const gy = this.getTerrainHeight(gx, gz);
        dummy.position.set(gx, gy, gz);
        const s = 0.75 + Math.random() * 0.7;
        dummy.scale.set(s, s * (0.8 + Math.random() * 0.4), s);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.rotation.z = (Math.random() - 0.5) * 0.2;
        dummy.updateMatrix();
        this.grassInstanced.setMatrixAt(placed, dummy.matrix);
        placed++;
      }
    }

    this.grassInstanced.instanceMatrix.needsUpdate = true;
    this.scene.add(this.grassInstanced);
  }

  createAtmosphere() {
    // Soft floating dust motes
    const particleCount = 70;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 90;
      positions[i + 1] = Math.random() * 12 + 1;
      positions[i + 2] = (Math.random() - 0.5) * 90;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0xffecb3,
      size: 0.16,
      transparent: true,
      opacity: 0.65
    });

    this.ambientParticles = new THREE.Points(geom, pMat);
    this.scene.add(this.ambientParticles);
  }

  createClouds() {
    this.cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xfffaf2,
      transparent: true,
      opacity: 0.88,
      flatShading: true
    });

    this.clouds = [];
    const cloudConfigs = [
      { x: -50, y: 52, z: -40, scale: 1.4 },
      { x: 30, y: 56, z: -60, scale: 1.2 },
      { x: -20, y: 49, z: 50, scale: 1.5 },
      { x: 60, y: 54, z: 30, scale: 1.3 },
      { x: -70, y: 58, z: 10, scale: 1.1 }
    ];

    cloudConfigs.forEach(cfg => {
      const c = new THREE.Group();
      c.position.set(cfg.x, cfg.y, cfg.z);

      // Low-poly cloud puffs
      const puffs = [
        { ox: 0, oy: 0, oz: 0, r: 4.5 * cfg.scale },
        { ox: 3.5 * cfg.scale, oy: -0.6, oz: 0.5, r: 3.2 * cfg.scale },
        { ox: -3.5 * cfg.scale, oy: -0.4, oz: -0.4, r: 3.4 * cfg.scale },
        { ox: 1.5 * cfg.scale, oy: 1.2, oz: -0.5, r: 2.8 * cfg.scale }
      ];

      puffs.forEach(p => {
        const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(p.r, 1), cloudMat);
        mesh.position.set(p.ox, p.oy, p.oz);
        c.add(mesh);
      });

      this.cloudGroup.add(c);
      this.clouds.push(c);
    });

    this.scene.add(this.cloudGroup);
  }

  update(delta, time) {
    // Flickering campfire
    if (this.fireLight) {
      this.fireLight.intensity = 1.8 + Math.sin(time * 12) * 0.4 + (Math.random() - 0.5) * 0.2;
    }
    if (this.flameMesh) {
      this.flameMesh.scale.y = 0.9 + Math.sin(time * 15) * 0.2;
      this.flameMesh.rotation.y = time * 2;
    }

    // Floating item rotations
    if (this.wellCrankItem) {
      this.wellCrankItem.rotation.y += delta * 1.5;
    }
    if (this.crankBeam) {
      this.crankBeam.rotation.y -= delta * 0.8;
    }

    // Smooth stones pulsing rings
    this.smoothStones.forEach((st, idx) => {
      if (!st.collected) {
        st.mesh.rotation.y += delta * 2;
        st.ring.scale.setScalar(1.0 + Math.sin(time * 3 + idx) * 0.15);
      }
    });

    // Slow drifting clouds
    if (this.clouds) {
      this.clouds.forEach(c => {
        c.position.x += delta * 1.2;
        if (c.position.x > 110) {
          c.position.x = -110;
        }
      });
    }

    // Ambient floating dust particles
    if (this.ambientParticles) {
      const pos = this.ambientParticles.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += delta * 0.2;
        if (pos[i] > 14) pos[i] = 1;
      }
      this.ambientParticles.geometry.attributes.position.needsUpdate = true;
    }
  }
}
