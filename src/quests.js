import { sounds } from './audio.js';

export class QuestManager {
  constructor(ui) {
    this.ui = ui;

    // Scripture Journal entries collected
    this.collectedScrolls = [];

    // All available biblical missions
    this.quests = [
      {
        id: 'lost_sheep',
        title: 'The Parable of the Lost Sheep',
        scriptureRef: 'Luke 15:4-7',
        giverId: 'simeon',
        status: 'available', // 'available', 'active', 'ready', 'completed'
        description: 'Elder Simeon is troubled. Three vulnerable young sheep have wandered past the village outskirts into the rocky hills. A true shepherd cares for every single one.',
        objective: 'Find 3 lost sheep and guide them safely to the sheepfold corral.',
        targetCount: 3,
        currentCount: 0,
        dialogueIntro: [
          "Peace be with you, young traveler. You carry the staff of a shepherd, yet our village faces a heavy trial.",
          "Three of our lambs have strayed into the jagged hills beyond the gate. The sun will set soon, and jackals roam the gullies.",
          "Remember the parable our Lord spoke: 'What man among you, having a hundred sheep, if he has lost one of them, does not leave the ninety-nine in the open country, and go after the one that is lost, until he finds it?'",
          "Go into the hills, approach each sheep with care, and lead them safely back into the stone sheepfold!"
        ],
        dialogueInProgress: [
          "Have you found them yet? Keep searching near the olive groves and rocky ridges. Every sheep is precious."
        ],
        dialogueComplete: [
          "Glory be to God! All three lambs are resting safely by the hay in the fold!",
          "You have shown the heart of a true shepherd. Receive this sacred parchment, passed down from the psalmists of old."
        ],
        scrollReward: {
          title: "The Good Shepherd",
          reference: "Psalm 23:1-3",
          text: "The LORD is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul. He leads me in paths of righteousness for His name's sake.",
          reflection: "Just as Eli gently guides each straying lamb to safety, we are reminded that no one is forgotten in God's eyes. Even when we wander into dark valleys, the Shepherd watches over us with steadfast love."
        }
      },
      {
        id: 'living_water',
        title: 'Living Water at the Well',
        scriptureRef: 'John 4:13-14',
        giverId: 'martha',
        status: 'locked',
        description: 'The village well mechanism was broken in the violent desert storm. The stone gear mechanism was swept up to the ancient watchtower ruins.',
        objective: 'Climb the Watchtower Ruins to retrieve the Stone Gear, then restore the village well.',
        targetCount: 1,
        currentCount: 0,
        hasItem: false,
        dialogueIntro: [
          "Welcome, friend! You arrive at a difficult moment for Bethany. Our ancient stone well has gone completely dry.",
          "The desert storm blew the stone crank mechanism clear across the valley to the Watchtower Ruins on the eastern hill.",
          "Without it, our families and animals have no water to drink. Climb the hill, retrieve the gear from the ruins, and place it back on the well!",
          "Remember what Jesus said at the well of Sychar: 'Whoever drinks of this water will thirst again, but whoever drinks of the water that I will give him will never thirst.'"
        ],
        dialogueInProgress: [
          "Look to the high eastern hill—the ruins of the watchtower stand among the broken pillars. The golden stone gear rests upon the ancient pedestal!"
        ],
        dialogueComplete: [
          "Listen! The cool subterranean waters are rushing up through the stones once more! The trough is filled with life!",
          "You have brought refreshing life to our whole village. Take this scroll and meditate on the Living Water that never runs dry."
        ],
        scrollReward: {
          title: "The Living Water",
          reference: "John 4:13-14",
          text: "Jesus answered, 'Everyone who drinks this water will be thirsty again, but whoever drinks the water I give them will never thirst. Indeed, the water I give them will become in them a spring of water welling up to eternal life.'",
          reflection: "Physical water sustains our body for a moment, but the spiritual grace and truth given by Christ satisfy the deep thirst of the soul forever."
        }
      },
      {
        id: 'smooth_stones',
        title: 'The Five Smooth Stones of Elah',
        scriptureRef: '1 Samuel 17:40-47',
        giverId: 'caleb',
        status: 'locked',
        description: 'Caleb the shepherd teaches the legacy of David. Along the dry brook bed lie five smooth stones symbolizing faith, courage, truth, peace, and righteousness.',
        objective: 'Collect all 5 Smooth Stones along the brook bed.',
        targetCount: 5,
        currentCount: 0,
        dialogueIntro: [
          "Hail, seeker! Look upon this dry valley. It reminds me of the valley of Elah where young David confronted the Philistine champion.",
          "King Saul offered him heavy bronze armor and a mighty sword, but David refused them. Instead, he took his staff, chose five smooth stones from the brook, and put them in his shepherd's bag.",
          "Search along the dry brook bed that runs south through this valley. Find the 5 radiant stones of faith: Courage, Faith, Truth, Peace, and Righteousness!"
        ],
        dialogueInProgress: [
          "Follow the natural depression of the stream bed. The smooth stones have a gentle azure glow."
        ],
        dialogueComplete: [
          "Splendid! You hold all five stones in your satchel! With faith as your foundation, no giant of fear or adversity can stand against you.",
          "Read David's proclamation of victory and let it embolden your heart!"
        ],
        scrollReward: {
          title: "Courage in the Valley",
          reference: "1 Samuel 17:45",
          text: "David said to the Philistine, 'You come against me with sword and spear and javelin, but I come against you in the name of the LORD Almighty, the God of the armies of Israel, whom you have defied.'",
          reflection: "True courage does not rely on worldly weapons or brute strength, but on humble, unshakeable trust in God's faithfulness."
        }
      },
      {
        id: 'ancient_cavern',
        title: 'The Light of Truth in the Cavern',
        scriptureRef: 'Isaiah 9:2 & Psalm 119:105',
        giverId: 'simeon',
        status: 'locked',
        description: 'To the west lies the Cavern of Inscriptions, veiled in deep shadow. Only the divine Light of Faith can illuminate the ancient promises.',
        objective: 'Enter the Western Cavern and activate your Light of Faith (Press Q) near the ancient glyphs.',
        targetCount: 1,
        currentCount: 0,
        dialogueIntro: [
          "You have proven faithful with small things, and now the greatest mystery of this valley awaits you.",
          "To the far west, carved into the cliffside, is the Cavern of Inscriptions. For generations, travelers feared its darkness.",
          "Go there, step inside, and channel your prayer—press [Q] to summon the 'Light of Faith' from your staff. The light will reveal the ancient promise engraved upon the stone walls!"
        ],
        dialogueInProgress: [
          "Journey west to the canyon cliffs. When inside the cavern dome, press [Q] to illuminate the glyphs!"
        ],
        dialogueComplete: [
          "The cave shines with the glory of ancient scripture! The Ark of Remembrance has opened to you!",
          "You have walked as a true Seeker and Wayfarer. The Chronicle of Wisdom is yours."
        ],
        scrollReward: {
          title: "Light in Darkness",
          reference: "Isaiah 9:2 & Psalm 119:105",
          text: "The people walking in darkness have seen a great light; on those living in the land of deep darkness, a light has dawned... Your word is a lamp for my feet, a light on my path.",
          reflection: "When the road ahead seems uncertain and shadows press in, God's Word illuminates each step, guiding us surely into peace."
        }
      }
    ];

    this.activeQuest = null; // No quest active until accepted by player!
  }

  getActiveQuest() {
    // Only return quests that have actually been accepted and are in progress or ready to turn in
    return this.quests.find(q => q.status === 'active' || q.status === 'ready') || null;
  }

  startQuest(questId) {
    const q = this.quests.find(item => item.id === questId);
    if (q && q.status === 'available') {
      q.status = 'active';
      this.activeQuest = q;
      this.ui.showNotification(`Mission Accepted: ${q.title}`);
      this.ui.updateQuestHUD(q);
      sounds.playScrollPickup();
    }
  }

  updateSheepProgress(count, npcs) {
    const q = this.quests.find(item => item.id === 'lost_sheep');
    if (!q || q.status !== 'active') return;

    q.currentCount = count;
    this.ui.updateQuestHUD(q);

    if (q.currentCount >= q.targetCount) {
      q.status = 'ready';
      this.ui.showNotification("Objective Complete! Return to Elder Simeon.");
      sounds.playQuestComplete();
      const simeon = npcs.find(n => n.id === 'simeon');
      if (simeon) simeon.setQuestState('ready');
    }
  }

  onWellCrankCollected() {
    const q = this.quests.find(item => item.id === 'living_water');
    if (q && q.status === 'active') {
      q.hasItem = true;
      q.objective = "Return to the village well and press [E] to restore the mechanism.";
      this.ui.showNotification("Collected the Stone Gear! Return to the village well.");
      sounds.playScrollPickup();
      this.ui.updateQuestHUD(q);
    }
  }

  onWellRepaired(npcs) {
    const q = this.quests.find(item => item.id === 'living_water');
    if (q && q.status === 'active' && q.hasItem) {
      q.currentCount = 1;
      q.status = 'ready';
      this.ui.showNotification("The Well is restored! Speak with Martha.");
      sounds.playQuestComplete();
      sounds.playWaterSplash();
      const martha = npcs.find(n => n.id === 'martha');
      if (martha) martha.setQuestState('ready');
    }
  }

  onSmoothStoneCollected(stoneName, npcs) {
    const q = this.quests.find(item => item.id === 'smooth_stones');
    if (!q || q.status !== 'active') return;

    q.currentCount++;
    this.ui.showNotification(`Found ${stoneName}! (${q.currentCount}/5)`);
    sounds.playScrollPickup();
    this.ui.updateQuestHUD(q);

    if (q.currentCount >= q.targetCount) {
      q.status = 'ready';
      this.ui.showNotification("All 5 Stones Collected! Speak with Caleb.");
      sounds.playQuestComplete();
      const caleb = npcs.find(n => n.id === 'caleb');
      if (caleb) caleb.setQuestState('ready');
    }
  }

  onCavernLightActivated(npcs) {
    const q = this.quests.find(item => item.id === 'ancient_cavern');
    if (q && q.status === 'active') {
      q.currentCount = 1;
      q.status = 'ready';
      this.ui.showNotification("The Cave Glyphs have illuminated! Speak with Elder Simeon.");
      sounds.playQuestComplete();
      const simeon = npcs.find(n => n.id === 'simeon');
      if (simeon) simeon.setQuestState('ready');
    }
  }

  completeQuest(questId, npcs) {
    const q = this.quests.find(item => item.id === questId);
    if (!q || q.status !== 'ready') return;

    q.status = 'completed';
    this.activeQuest = null;
    sounds.playQuestComplete();
    this.ui.showNotification(`Mission Completed: ${q.title}!`);

    // Add scripture scroll reward to journal
    if (q.scrollReward) {
      this.collectedScrolls.push(q.scrollReward);
      this.ui.showScrollUnlockedModal(q.scrollReward);
    }

    // Unlock next quest in series as AVAILABLE, but do NOT activate it yet
    const idx = this.quests.indexOf(q);
    if (idx + 1 < this.quests.length) {
      const nextQ = this.quests[idx + 1];
      nextQ.status = 'available';

      const nextNpc = npcs.find(n => n.id === nextQ.giverId);
      if (nextNpc) nextNpc.setQuestState('available');
    }

    const currentNpc = npcs.find(n => n.id === q.giverId);
    if (currentNpc) currentNpc.setQuestState('completed');

    // Hide quest tracker until player accepts next mission
    this.ui.updateQuestHUD(null);
  }
}
