# Room pictures

The game shows a static picture under the map for the room you are in. Put one image per room in `public/img/rooms/`, named exactly as below (JPEG, 16:9 works best, for example 800x450). Rooms without a picture of their own show their area's default picture (`public/img/areas/<area id>.jpg`: Whisperwood, Barrow Crypts, Sunken Marsh, Redrock Trail, Silverado Mines, Sunscorch Dunes, Frostpeak, Ember Wastes, Shattered Citadel, The Abyss, Tombstone Gulch and Starship Aurora have one), and areas without either show the guide's area art.

Quick way: save your downloads as `room-<key>.png` (or .jpg/.webp) in one folder, then run `python3 tools/import_art.py <folder>`. It crops each to 16:9, resizes and installs them.

584 rooms:

| Room | Area | File name (public/img/rooms/) |
|---|---|---|
| Heart of the Void | The Abyss (Sci-fi) | `abyss-core.jpg` |
| Dream Fragment | The Abyss (Sci-fi) | `abyss-dream_fragment.jpg` |
| Echo Chamber | The Abyss (Sci-fi) | `abyss-echo_chamber.jpg` |
| Edge of Nothing | The Abyss (Sci-fi) | `abyss-edge_of_nothing.jpg` |
| Eye of Silence | The Abyss (Sci-fi) | `abyss-eye_of_silence.jpg` |
| Fractured Stair | The Abyss (Sci-fi) | `abyss-fractured_stair.jpg` |
| Hollow Throne | The Abyss (Sci-fi) | `abyss-hollow_throne.jpg` |
| Maw of Stars | The Abyss (Sci-fi) | `abyss-maw_of_stars.jpg` |
| The Rift | The Abyss (Sci-fi) | `abyss-rift.jpg` |
| Shadow Bridge | The Abyss (Sci-fi) | `abyss-shadow_bridge.jpg` |
| The Black Stair | The Abyss (Sci-fi) | `abyss-stair.jpg` |
| Weeping Chasm | The Abyss (Sci-fi) | `abyss-weeping_chasm.jpg` |
| Whispering Void | The Abyss (Sci-fi) | `abyss-whispering_void.jpg` |
| Breach Hatch | Starship Aurora (Sci-fi) | `aurora-a.jpg` |
| Cargo Bay | Starship Aurora (Sci-fi) | `aurora-b.jpg` |
| Corridor Alpha | Starship Aurora (Sci-fi) | `aurora-c.jpg` |
| Galley | Starship Aurora (Sci-fi) | `aurora-d.jpg` |
| Crew Quarters | Starship Aurora (Sci-fi) | `aurora-e.jpg` |
| Med Bay | Starship Aurora (Sci-fi) | `aurora-f.jpg` |
| Engineering | Starship Aurora (Sci-fi) | `aurora-g.jpg` |
| Quartermaster Locker | Starship Aurora (Sci-fi) | `aurora-h.jpg` |
| Hydroponics | Starship Aurora (Sci-fi) | `aurora-i.jpg` |
| Corridor Beta | Starship Aurora (Sci-fi) | `aurora-j.jpg` |
| Observation Deck | Starship Aurora (Sci-fi) | `aurora-k.jpg` |
| Reactor Core | Starship Aurora (Sci-fi) | `aurora-l.jpg` |
| Escape Pod Bay | Starship Aurora (Sci-fi) | `aurora-m.jpg` |
| AI Core Antechamber | Starship Aurora (Sci-fi) | `aurora-n.jpg` |
| Bridge | Starship Aurora (Sci-fi) | `aurora-o.jpg` |
| Bank Lobby | Dry Gulch Bank (Old West) | `bank-a.jpg` |
| Teller Cages | Dry Gulch Bank (Old West) | `bank-b.jpg` |
| Manager's Office | Dry Gulch Bank (Old West) | `bank-c.jpg` |
| Vault Corridor | Dry Gulch Bank (Old West) | `bank-d.jpg` |
| The Vault | Dry Gulch Bank (Old West) | `bank-e.jpg` |
| Counting Room | Dry Gulch Bank (Old West) | `bank-f.jpg` |
| Buckstars Entrance | Buckstars Coffee Shop (Modern) | `buck-0_0.jpg` |
| Condiment Bar | Buckstars Coffee Shop (Modern) | `buck-0_1.jpg` |
| Restroom Hall | Buckstars Coffee Shop (Modern) | `buck-0_2.jpg` |
| Cleaning Closet | Buckstars Coffee Shop (Modern) | `buck-0_3.jpg` |
| Trash Room | Buckstars Coffee Shop (Modern) | `buck-0_4.jpg` |
| Order Counter | Buckstars Coffee Shop (Modern) | `buck-1_0.jpg` |
| Window Seats | Buckstars Coffee Shop (Modern) | `buck-1_1.jpg` |
| Women's Restroom | Buckstars Coffee Shop (Modern) | `buck-1_2.jpg` |
| Dish Pit | Buckstars Coffee Shop (Modern) | `buck-1_3.jpg` |
| Ice Machine Room | Buckstars Coffee Shop (Modern) | `buck-1_4.jpg` |
| Espresso Bar | Buckstars Coffee Shop (Modern) | `buck-2_0.jpg` |
| Cozy Corner | Buckstars Coffee Shop (Modern) | `buck-2_1.jpg` |
| Men's Restroom | Buckstars Coffee Shop (Modern) | `buck-2_2.jpg` |
| Stock Room | Buckstars Coffee Shop (Modern) | `buck-2_3.jpg` |
| Bean Storage | Buckstars Coffee Shop (Modern) | `buck-2_4.jpg` |
| Pastry Case | Buckstars Coffee Shop (Modern) | `buck-3_0.jpg` |
| Laptop Row | Buckstars Coffee Shop (Modern) | `buck-3_1.jpg` |
| Employee Hallway | Buckstars Coffee Shop (Modern) | `buck-3_2.jpg` |
| Walk-in Cooler | Buckstars Coffee Shop (Modern) | `buck-3_3.jpg` |
| Dumpster Alley | Buckstars Coffee Shop (Modern) | `buck-3_4.jpg` |
| Mobile Order Pickup | Buckstars Coffee Shop (Modern) | `buck-4_0.jpg` |
| Community Board Nook | Buckstars Coffee Shop (Modern) | `buck-4_1.jpg` |
| Break Room | Buckstars Coffee Shop (Modern) | `buck-4_2.jpg` |
| Manager's Office | Buckstars Coffee Shop (Modern) | `buck-4_3.jpg` |
| Loading Dock | Buckstars Coffee Shop (Modern) | `buck-4_4.jpg` |
| Merchandise Wall | Buckstars Coffee Shop (Modern) | `buck-5_0.jpg` |
| Patio Gate | Buckstars Coffee Shop (Modern) | `buck-5_1.jpg` |
| Outdoor Patio | Buckstars Coffee Shop (Modern) | `buck-5_2.jpg` |
| Drive-Thru Window | Buckstars Coffee Shop (Modern) | `buck-5_3.jpg` |
| The Roasting Room | Buckstars Coffee Shop (Modern) | `buck-5_4.jpg` |
| Crystal Cavern | The Mammoth Caverns (Prehistoric) | `cave-crystal.jpg` |
| Bear Den | The Mammoth Caverns (Prehistoric) | `cave-den.jpg` |
| Fire Pit Cavern | The Mammoth Caverns (Prehistoric) | `cave-fire.jpg` |
| Mammoth Gallery | The Mammoth Caverns (Prehistoric) | `cave-fork.jpg` |
| Mammoth Graveyard | The Mammoth Caverns (Prehistoric) | `cave-graveyard.jpg` |
| Drumming Grotto | The Mammoth Caverns (Prehistoric) | `cave-grot.jpg` |
| Painted Hall | The Mammoth Caverns (Prehistoric) | `cave-hall1.jpg` |
| Bone Midden | The Mammoth Caverns (Prehistoric) | `cave-hall2.jpg` |
| Grog's Hoard | The Mammoth Caverns (Prehistoric) | `cave-hoard.jpg` |
| Flint Knapping Floor | The Mammoth Caverns (Prehistoric) | `cave-knap.jpg` |
| Sinkhole Landing | The Mammoth Caverns (Prehistoric) | `cave-landing.jpg` |
| The Deep Ledge | The Mammoth Caverns (Prehistoric) | `cave-ledge.jpg` |
| Hunters' Lodge | The Mammoth Caverns (Prehistoric) | `cave-lodge.jpg` |
| Cave Mouth | The Mammoth Caverns (Prehistoric) | `cave-mouth.jpg` |
| Mammoth Pen | The Mammoth Caverns (Prehistoric) | `cave-pen.jpg` |
| Underground River | The Mammoth Caverns (Prehistoric) | `cave-river.jpg` |
| Bat Roost | The Mammoth Caverns (Prehistoric) | `cave-roost.jpg` |
| Shaman's Cave | The Mammoth Caverns (Prehistoric) | `cave-shaman.jpg` |
| Creeper Nest | The Mammoth Caverns (Prehistoric) | `cave-spiders.jpg` |
| Narrow Squeeze | The Mammoth Caverns (Prehistoric) | `cave-squeeze.jpg` |
| Dripping Tunnel | The Mammoth Caverns (Prehistoric) | `cave-t1.jpg` |
| Echoing Tunnel | The Mammoth Caverns (Prehistoric) | `cave-t2.jpg` |
| Crossing of Tunnels | The Mammoth Caverns (Prehistoric) | `cave-t3.jpg` |
| Grog's Throne Cavern | The Mammoth Caverns (Prehistoric) | `cave-throne.jpg` |
| Totem Chamber | The Mammoth Caverns (Prehistoric) | `cave-totem.jpg` |
| Armory Ruins | Shattered Citadel (Fantasy) | `cit-armory_ruins.jpg` |
| Banquet Hall | Shattered Citadel (Fantasy) | `cit-banquet_hall.jpg` |
| Haunted Barracks | Shattered Citadel (Fantasy) | `cit-barracks.jpg` |
| Chapel of Bells | Shattered Citadel (Fantasy) | `cit-chapel_of_bells.jpg` |
| Collapsed Rampart | Shattered Citadel (Fantasy) | `cit-collapsed_rampart.jpg` |
| Crypt Gate | Shattered Citadel (Fantasy) | `cit-crypt_gate.jpg` |
| Cursed Gallery | Shattered Citadel (Fantasy) | `cit-cursed_gallery.jpg` |
| Dungeon Stair | Shattered Citadel (Fantasy) | `cit-dungeon_stair.jpg` |
| Citadel Gate | Shattered Citadel (Fantasy) | `cit-gate.jpg` |
| Guard Post | Shattered Citadel (Fantasy) | `cit-guard_post.jpg` |
| Hall of Banners | Shattered Citadel (Fantasy) | `cit-hall.jpg` |
| Ruined Library | Shattered Citadel (Fantasy) | `cit-library.jpg` |
| Throne of the Dread Marshal | Shattered Citadel (Fantasy) | `cit-throne.jpg` |
| War Room | Shattered Citadel (Fantasy) | `cit-war_room.jpg` |
| Watchtower Top | Shattered Citadel (Fantasy) | `cit-watchtower_top.jpg` |
| Altar of Ash | Barrow Crypts (Fantasy) | `crypt-altar_of_ash.jpg` |
| Bone Gallery | Barrow Crypts (Fantasy) | `crypt-bone_gallery.jpg` |
| Ossuary | Barrow Crypts (Fantasy) | `crypt-bones.jpg` |
| Burial Cells | Barrow Crypts (Fantasy) | `crypt-cells.jpg` |
| Collapsed Vault | Barrow Crypts (Fantasy) | `crypt-collapsed_vault.jpg` |
| Embalming Room | Barrow Crypts (Fantasy) | `crypt-embalming_room.jpg` |
| Crypt Stairs | Barrow Crypts (Fantasy) | `crypt-entry.jpg` |
| Flooded Crypt | Barrow Crypts (Fantasy) | `crypt-flooded_crypt.jpg` |
| Ghoul Warren | Barrow Crypts (Fantasy) | `crypt-ghoul_warren.jpg` |
| Hall of Urns | Barrow Crypts (Fantasy) | `crypt-hall.jpg` |
| Reliquary | Barrow Crypts (Fantasy) | `crypt-reliquary.jpg` |
| Sealed Passage | Barrow Crypts (Fantasy) | `crypt-sealed_passage.jpg` |
| Shadowed Nave | Barrow Crypts (Fantasy) | `crypt-shadowed_nave.jpg` |
| Warlord's Throne | Barrow Crypts (Fantasy) | `crypt-throne.jpg` |
| Weeping Chamber | Barrow Crypts (Fantasy) | `crypt-weeping_chamber.jpg` |
| Broken Statue | Sunscorch Dunes (Fantasy) | `dunes-broken_statue.jpg` |
| Caravan Graveyard | Sunscorch Dunes (Fantasy) | `dunes-caravan_graveyard.jpg` |
| Cracked Dune | Sunscorch Dunes (Fantasy) | `dunes-cracked_dune.jpg` |
| Dry Well | Sunscorch Dunes (Fantasy) | `dunes-dry_well.jpg` |
| Mirage Gate | Sunscorch Dunes (Fantasy) | `dunes-mirage_gate.jpg` |
| Nomad Camp | Sunscorch Dunes (Fantasy) | `dunes-nomad_camp.jpg` |
| Dune Bazaar | Sunscorch Dunes (Fantasy) | `dunes-oasis.jpg` |
| Black Obelisk | Sunscorch Dunes (Fantasy) | `dunes-obelisk.jpg` |
| Sunken Ruins | Sunscorch Dunes (Fantasy) | `dunes-ruins.jpg` |
| Salt Flat | Sunscorch Dunes (Fantasy) | `dunes-salt_flat.jpg` |
| Sand Pit | Sunscorch Dunes (Fantasy) | `dunes-sand_pit.jpg` |
| Burning Sands | Sunscorch Dunes (Fantasy) | `dunes-sands.jpg` |
| Scorched Mesa | Sunscorch Dunes (Fantasy) | `dunes-scorched_mesa.jpg` |
| Pharaoh's Tomb | Sunscorch Dunes (Fantasy) | `dunes-tomb.jpg` |
| Whispering Dune | Sunscorch Dunes (Fantasy) | `dunes-whispering_dune.jpg` |
| Ashfields | Ember Wastes (Sci-fi) | `ember-ash.jpg` |
| Ash Dune | Ember Wastes (Sci-fi) | `ember-ash_dune.jpg` |
| Basalt Steps | Ember Wastes (Sci-fi) | `ember-basalt_steps.jpg` |
| The Caldera | Ember Wastes (Sci-fi) | `ember-caldera.jpg` |
| Charred Grove | Ember Wastes (Sci-fi) | `ember-charred_grove.jpg` |
| Ember Gate | Ember Wastes (Sci-fi) | `ember-gate.jpg` |
| Geyser Basin | Ember Wastes (Sci-fi) | `ember-geyser_basin.jpg` |
| River of Fire | Ember Wastes (Sci-fi) | `ember-lava.jpg` |
| Lava Tube | Ember Wastes (Sci-fi) | `ember-lava_tube.jpg` |
| Molten Pool | Ember Wastes (Sci-fi) | `ember-molten_pool.jpg` |
| Obsidian Field | Ember Wastes (Sci-fi) | `ember-obsidian_field.jpg` |
| Scorched Camp | Ember Wastes (Sci-fi) | `ember-scorched_camp.jpg` |
| Smoking Crater | Ember Wastes (Sci-fi) | `ember-smoking_crater.jpg` |
| Sulfur Vent | Ember Wastes (Sci-fi) | `ember-sulfur_vent.jpg` |
| Forge-Temple | Ember Wastes (Sci-fi) | `ember-temple.jpg` |
| Moonlit Clearing | Whisperwood (Fantasy) | `forest-clearing.jpg` |
| Deep Wood | Whisperwood (Fantasy) | `forest-deep.jpg` |
| Fallen Giant | Whisperwood (Fantasy) | `forest-fallen_giant.jpg` |
| Fern Dell | Whisperwood (Fantasy) | `forest-fern_dell.jpg` |
| Hermit's Clearing | Whisperwood (Fantasy) | `forest-hermits_clearing.jpg` |
| Hollow Oak | Whisperwood (Fantasy) | `forest-hollow_oak.jpg` |
| Hunter's Blind | Whisperwood (Fantasy) | `forest-hunters_blind.jpg` |
| Mossy Hollow | Whisperwood (Fantasy) | `forest-mossy_hollow.jpg` |
| Owl Roost | Whisperwood (Fantasy) | `forest-owl_roost.jpg` |
| Forest Path | Whisperwood (Fantasy) | `forest-path.jpg` |
| Reed Pond | Whisperwood (Fantasy) | `forest-pond.jpg` |
| Fallen Chapel | Whisperwood (Fantasy) | `forest-ruins.jpg` |
| Spider Grove | Whisperwood (Fantasy) | `forest-spider_grove.jpg` |
| Cold Stream | Whisperwood (Fantasy) | `forest-stream.jpg` |
| Bramble Thicket | Whisperwood (Fantasy) | `forest-thicket.jpg` |
| Thornwall | Whisperwood (Fantasy) | `forest-thornwall.jpg` |
| Twilight Glade | Whisperwood (Fantasy) | `forest-twilight_glade.jpg` |
| Avalanche Slope | Frostpeak Station (Sci-fi) | `frost-avalanche_slope.jpg` |
| Blizzard Gap | Frostpeak Station (Sci-fi) | `frost-blizzard_gap.jpg` |
| Crystal Cave | Frostpeak Station (Sci-fi) | `frost-cave.jpg` |
| Crystal Chasm | Frostpeak Station (Sci-fi) | `frost-crystal_chasm.jpg` |
| Abandoned Research Camp | Frostpeak Station (Sci-fi) | `frost-frozen_camp.jpg` |
| Frozen Waterfall | Frostpeak Station (Sci-fi) | `frost-frozen_waterfall.jpg` |
| Glacier Crack | Frostpeak Station (Sci-fi) | `frost-glacier_crack.jpg` |
| The Cryo Titan's Hall | Frostpeak Station (Sci-fi) | `frost-hall.jpg` |
| Hermit's Habitat | Frostpeak Station (Sci-fi) | `frost-hermits_igloo.jpg` |
| Ice Bridge | Frostpeak Station (Sci-fi) | `frost-ice_bridge.jpg` |
| Frozen Ledge | Frostpeak Station (Sci-fi) | `frost-ledge.jpg` |
| Frostpeak Station | Frostpeak Station (Sci-fi) | `frost-lodge.jpg` |
| Frostpeak Pass | Frostpeak Station (Sci-fi) | `frost-pass.jpg` |
| Starship Tharsis: Cockpit | Frostpeak Station (Sci-fi) | `frost-ship_cockpit.jpg` |
| Starship Tharsis: Passenger Deck | Frostpeak Station (Sci-fi) | `frost-ship_deck.jpg` |
| Starship Tharsis: Boarding Ramp | Frostpeak Station (Sci-fi) | `frost-ship_ramp.jpg` |
| Snowdrift Hollow | Frostpeak Station (Sci-fi) | `frost-snowdrift_hollow.jpg` |
| Wind-Scoured Peak | Frostpeak Station (Sci-fi) | `frost-windscoured_peak.jpg` |
| Rat Run | The Proving Grounds (Bots) | `grounds-f1.jpg` |
| Void Ring | The Proving Grounds (Bots) | `grounds-f10.jpg` |
| Bone Yard | The Proving Grounds (Bots) | `grounds-f2.jpg` |
| Reed Pit | The Proving Grounds (Bots) | `grounds-f3.jpg` |
| Spider Hollow | The Proving Grounds (Bots) | `grounds-f4.jpg` |
| Golem Court | The Proving Grounds (Bots) | `grounds-f5.jpg` |
| Sand Ring | The Proving Grounds (Bots) | `grounds-f6.jpg` |
| Frozen Pen | The Proving Grounds (Bots) | `grounds-f7.jpg` |
| Ember Pen | The Proving Grounds (Bots) | `grounds-f8.jpg` |
| Cinder Court | The Proving Grounds (Bots) | `grounds-f9.jpg` |
| Proving Grounds Gate | The Proving Grounds (Bots) | `grounds-gate.jpg` |
| The Turn | The Proving Grounds (Bots) | `grounds-mid.jpg` |
| Training Yard | The Proving Grounds (Bots) | `grounds-yard.jpg` |
| Gulch Gate | Tombstone Gulch (Old West) | `gulch-a.jpg` |
| Main Street | Tombstone Gulch (Old West) | `gulch-b.jpg` |
| Silver Dollar Saloon | Tombstone Gulch (Old West) | `gulch-c.jpg` |
| Undertaker's Parlor | Tombstone Gulch (Old West) | `gulch-d.jpg` |
| Sheriff's Office | Tombstone Gulch (Old West) | `gulch-e.jpg` |
| Gulch General Store | Tombstone Gulch (Old West) | `gulch-f.jpg` |
| Dusty Crossroads | Tombstone Gulch (Old West) | `gulch-g.jpg` |
| Bank of Tombstone | Tombstone Gulch (Old West) | `gulch-h.jpg` |
| Church of Ashes | Tombstone Gulch (Old West) | `gulch-i.jpg` |
| Boot Hill Cemetery | Tombstone Gulch (Old West) | `gulch-j.jpg` |
| Gallows Yard | Tombstone Gulch (Old West) | `gulch-k.jpg` |
| Abandoned Stable | Tombstone Gulch (Old West) | `gulch-l.jpg` |
| Dry Well | Tombstone Gulch (Old West) | `gulch-m.jpg` |
| Gold Rush Alley | Tombstone Gulch (Old West) | `gulch-n.jpg` |
| The Vault | Tombstone Gulch (Old West) | `gulch-o.jpg` |
| Crimson Ballroom | Nightfall Hollow (Fantasy) | `hollow-ball.jpg` |
| Witches' Bog | Nightfall Hollow (Fantasy) | `hollow-bog.jpg` |
| Bone Bridge | Nightfall Hollow (Fantasy) | `hollow-bridge.jpg` |
| The Great Cauldron | Nightfall Hollow (Fantasy) | `hollow-cauldron.jpg` |
| Wine Cellar | Nightfall Hollow (Fantasy) | `hollow-cellar.jpg` |
| Hall of Chains | Nightfall Hollow (Fantasy) | `hollow-chains.jpg` |
| Hunters' Chapel | Nightfall Hollow (Fantasy) | `hollow-chapel.jpg` |
| Coven Circle | Nightfall Hollow (Fantasy) | `hollow-circle.jpg` |
| Silver Clearing | Nightfall Hollow (Fantasy) | `hollow-clear.jpg` |
| Cursed Crossroads | Nightfall Hollow (Fantasy) | `hollow-cross.jpg` |
| The Count's Crypt | Nightfall Hollow (Fantasy) | `hollow-crypt.jpg` |
| The Alpha's Den | Nightfall Hollow (Fantasy) | `hollow-den.jpg` |
| Court of Fire | Nightfall Hollow (Fantasy) | `hollow-fire.jpg` |
| Brimstone Gate | Nightfall Hollow (Fantasy) | `hollow-gateway.jpg` |
| Moonlit Glade | Nightfall Hollow (Fantasy) | `hollow-glade.jpg` |
| Blood Hall | Nightfall Hollow (Fantasy) | `hollow-hall.jpg` |
| Hunters' Ruins | Nightfall Hollow (Fantasy) | `hollow-hunter.jpg` |
| Hag's Cottage | Nightfall Hollow (Fantasy) | `hollow-hut.jpg` |
| Forbidden Library | Nightfall Hollow (Fantasy) | `hollow-lib.jpg` |
| Manor Gate | Nightfall Hollow (Fantasy) | `hollow-manorgate.jpg` |
| The Hellmouth | Nightfall Hollow (Fantasy) | `hollow-pit.jpg` |
| Moonless Road | Nightfall Hollow (Fantasy) | `hollow-road.jpg` |
| Hollowmoor Square | Nightfall Hollow (Fantasy) | `hollow-square.jpg` |
| Bat Tower | Nightfall Hollow (Fantasy) | `hollow-tower.jpg` |
| Howling Woods | Nightfall Hollow (Fantasy) | `hollow-woods1.jpg` |
| Manor Lobby | Golden Years Manor (Modern) | `manor-0_0.jpg` |
| Activity Room | Golden Years Manor (Modern) | `manor-0_1.jpg` |
| East Wing Corridor | Golden Years Manor (Modern) | `manor-0_2.jpg` |
| Garden Path | Golden Years Manor (Modern) | `manor-0_3.jpg` |
| Sunroom | Golden Years Manor (Modern) | `manor-1_0.jpg` |
| Bingo Hall | Golden Years Manor (Modern) | `manor-1_1.jpg` |
| Resident Room 101 | Golden Years Manor (Modern) | `manor-1_2.jpg` |
| Shuffleboard Court | Golden Years Manor (Modern) | `manor-1_3.jpg` |
| Dining Hall | Golden Years Manor (Modern) | `manor-2_0.jpg` |
| Craft Room | Golden Years Manor (Modern) | `manor-2_1.jpg` |
| Resident Room 102 | Golden Years Manor (Modern) | `manor-2_2.jpg` |
| Gazebo Pond | Golden Years Manor (Modern) | `manor-2_3.jpg` |
| Kitchen | Golden Years Manor (Modern) | `manor-3_0.jpg` |
| Library | Golden Years Manor (Modern) | `manor-3_1.jpg` |
| Resident Room 103 | Golden Years Manor (Modern) | `manor-3_2.jpg` |
| Greenhouse | Golden Years Manor (Modern) | `manor-3_3.jpg` |
| Pantry | Golden Years Manor (Modern) | `manor-4_0.jpg` |
| Chapel | Golden Years Manor (Modern) | `manor-4_1.jpg` |
| Nurses Station | Golden Years Manor (Modern) | `manor-4_2.jpg` |
| Hobby Barn | Golden Years Manor (Modern) | `manor-4_3.jpg` |
| Laundry Room | Golden Years Manor (Modern) | `manor-5_0.jpg` |
| Tea Parlor | Golden Years Manor (Modern) | `manor-5_1.jpg` |
| Medication Room | Golden Years Manor (Modern) | `manor-5_2.jpg` |
| Memory Care Wing | Golden Years Manor (Modern) | `manor-5_3.jpg` |
| Martian Landing Pad | Mars (Sci-fi) | `mars-0_0.jpg` |
| Cracked Basin | Mars (Sci-fi) | `mars-0_1.jpg` |
| Dry Hollow | Mars (Sci-fi) | `mars-0_2.jpg` |
| Windswept Wash | Mars (Sci-fi) | `mars-0_3.jpg` |
| Dusty Dune | Mars (Sci-fi) | `mars-0_4.jpg` |
| Quiet Scar | Mars (Sci-fi) | `mars-0_5.jpg` |
| Jagged Fissure | Mars (Sci-fi) | `mars-0_6.jpg` |
| Old Rim | Mars (Sci-fi) | `mars-0_7.jpg` |
| Smoking Ledge | Mars (Sci-fi) | `mars-0_8.jpg` |
| Hidden Cut | Mars (Sci-fi) | `mars-0_9.jpg` |
| Silent Plain | Mars (Sci-fi) | `mars-1_0.jpg` |
| Rusty Flat | Mars (Sci-fi) | `mars-1_1.jpg` |
| Dusty Basin | Mars (Sci-fi) | `mars-1_2.jpg` |
| Crimson Hollow | Mars (Sci-fi) | `mars-1_3.jpg` |
| Deep Cairn | Mars (Sci-fi) | `mars-1_4.jpg` |
| Shattered Pit | Mars (Sci-fi) | `mars-1_5.jpg` |
| Smoking Dish | Mars (Sci-fi) | `mars-1_6.jpg` |
| Frozen Cairn | Mars (Sci-fi) | `mars-1_7.jpg` |
| Echoing Gorge | Mars (Sci-fi) | `mars-1_8.jpg` |
| Painted Chasm | Mars (Sci-fi) | `mars-1_9.jpg` |
| Martian Bazaar Ruins | Mars (Sci-fi) | `mars-2_0.jpg` |
| Dry Plain | Mars (Sci-fi) | `mars-2_1.jpg` |
| Windswept Flat | Mars (Sci-fi) | `mars-2_2.jpg` |
| Quiet Bowl | Mars (Sci-fi) | `mars-2_3.jpg` |
| Frozen Dish | Mars (Sci-fi) | `mars-2_4.jpg` |
| Glowing Cairn | Mars (Sci-fi) | `mars-2_5.jpg` |
| Old Bowl | Mars (Sci-fi) | `mars-2_6.jpg` |
| Towering Wall | Mars (Sci-fi) | `mars-2_7.jpg` |
| Red Stair | Mars (Sci-fi) | `mars-2_8.jpg` |
| Narrow Arch | Mars (Sci-fi) | `mars-2_9.jpg` |
| Salt Ridge | Mars (Sci-fi) | `mars-3_0.jpg` |
| Pitted Gully | Mars (Sci-fi) | `mars-3_1.jpg` |
| Glowing Pocket | Mars (Sci-fi) | `mars-3_2.jpg` |
| Shattered Crater | Mars (Sci-fi) | `mars-3_3.jpg` |
| Smoking Bowl | Mars (Sci-fi) | `mars-3_4.jpg` |
| Hollow Dish | Mars (Sci-fi) | `mars-3_5.jpg` |
| Sunken Defile | Mars (Sci-fi) | `mars-3_6.jpg` |
| Carved Arch | Mars (Sci-fi) | `mars-3_7.jpg` |
| Twisting Wall | Mars (Sci-fi) | `mars-3_8.jpg` |
| Hidden Defile | Mars (Sci-fi) | `mars-3_9.jpg` |
| Ochre Rise | Mars (Sci-fi) | `mars-4_0.jpg` |
| Broken Rim | Mars (Sci-fi) | `mars-4_1.jpg` |
| Hollow Ledge | Mars (Sci-fi) | `mars-4_2.jpg` |
| Jagged Pocket | Mars (Sci-fi) | `mars-4_3.jpg` |
| Saucer Hangar | Mars (Sci-fi) | `mars-4_4.jpg` |
| Painted Passage | Mars (Sci-fi) | `mars-4_5.jpg` |
| Hidden Spire | Mars (Sci-fi) | `mars-4_6.jpg` |
| Red Canyon | Mars (Sci-fi) | `mars-4_7.jpg` |
| Echoing Passage | Mars (Sci-fi) | `mars-4_8.jpg` |
| Crowded Terrace | Mars (Sci-fi) | `mars-4_9.jpg` |
| Frozen Scar | Mars (Sci-fi) | `mars-5_0.jpg` |
| Deep Fissure | Mars (Sci-fi) | `mars-5_1.jpg` |
| Shattered Rim | Mars (Sci-fi) | `mars-5_2.jpg` |
| Quiet Ledge | Mars (Sci-fi) | `mars-5_3.jpg` |
| Sunken Cut | Mars (Sci-fi) | `mars-5_4.jpg` |
| Carved Canyon | Mars (Sci-fi) | `mars-5_5.jpg` |
| Forgotten Passage | Mars (Sci-fi) | `mars-5_6.jpg` |
| Towering Spire | Mars (Sci-fi) | `mars-5_7.jpg` |
| Copper Alley | Mars (Sci-fi) | `mars-5_8.jpg` |
| Lamp-lit Arcade | Mars (Sci-fi) | `mars-5_9.jpg` |
| Smoking Pit | Mars (Sci-fi) | `mars-6_0.jpg` |
| Hollow Scar | Mars (Sci-fi) | `mars-6_1.jpg` |
| Glowing Fissure | Mars (Sci-fi) | `mars-6_2.jpg` |
| Forgotten Gorge | Mars (Sci-fi) | `mars-6_3.jpg` |
| Towering Chasm | Mars (Sci-fi) | `mars-6_4.jpg` |
| Red Cut | Mars (Sci-fi) | `mars-6_5.jpg` |
| Echoing Canyon | Mars (Sci-fi) | `mars-6_6.jpg` |
| Mirrored Yard | Mars (Sci-fi) | `mars-6_7.jpg` |
| Glass Market | Mars (Sci-fi) | `mars-6_8.jpg` |
| Silent Alley | Mars (Sci-fi) | `mars-6_9.jpg` |
| Old Cairn | Mars (Sci-fi) | `mars-7_0.jpg` |
| Broken Pit | Mars (Sci-fi) | `mars-7_1.jpg` |
| The Great Crater | Mars (Sci-fi) | `mars-7_2.jpg` |
| Narrow Stair | Mars (Sci-fi) | `mars-7_3.jpg` |
| Carved Gorge | Mars (Sci-fi) | `mars-7_4.jpg` |
| Twisting Chasm | Mars (Sci-fi) | `mars-7_5.jpg` |
| Neon Gate | Mars (Sci-fi) | `mars-7_6.jpg` |
| Humming Street | Mars (Sci-fi) | `mars-7_7.jpg` |
| Lamp-lit Yard | Mars (Sci-fi) | `mars-7_8.jpg` |
| Crowded Market | Mars (Sci-fi) | `mars-7_9.jpg` |
| Jagged Dish | Mars (Sci-fi) | `mars-8_0.jpg` |
| Echoing Defile | Mars (Sci-fi) | `mars-8_1.jpg` |
| Painted Arch | Mars (Sci-fi) | `mars-8_2.jpg` |
| Hidden Wall | Mars (Sci-fi) | `mars-8_3.jpg` |
| Sunken Stair | Mars (Sci-fi) | `mars-8_4.jpg` |
| Silver Plaza | Mars (Sci-fi) | `mars-8_5.jpg` |
| Ruined Lane | Mars (Sci-fi) | `mars-8_6.jpg` |
| Glass Gate | Mars (Sci-fi) | `mars-8_7.jpg` |
| Copper Street | Mars (Sci-fi) | `mars-8_8.jpg` |
| Endless Gate | Mars (Sci-fi) | `mars-8_9.jpg` |
| Twisting Passage | Mars (Sci-fi) | `mars-9_0.jpg` |
| Red Spire | Mars (Sci-fi) | `mars-9_1.jpg` |
| Narrow Defile | Mars (Sci-fi) | `mars-9_2.jpg` |
| Forgotten Arch | Mars (Sci-fi) | `mars-9_3.jpg` |
| Canyon Overlook | Mars (Sci-fi) | `mars-9_4.jpg` |
| Silent Tower | Mars (Sci-fi) | `mars-9_5.jpg` |
| Humming Plaza | Mars (Sci-fi) | `mars-9_6.jpg` |
| Mirrored Lane | Mars (Sci-fi) | `mars-9_7.jpg` |
| Royal Walk | Mars (Sci-fi) | `mars-9_8.jpg` |
| Overlord's Throne Room | Mars (Sci-fi) | `mars-9_9.jpg` |
| Hydra Den | Sunken Marsh (Fantasy) | `marsh-den.jpg` |
| Drowned Chapel | Sunken Marsh (Fantasy) | `marsh-drowned_chapel.jpg` |
| Marsh Edge | Sunken Marsh (Fantasy) | `marsh-edge.jpg` |
| Frog Pond | Sunken Marsh (Fantasy) | `marsh-frog_pond.jpg` |
| Fungus Grotto | Sunken Marsh (Fantasy) | `marsh-fungus_grotto.jpg` |
| Heron Rookery | Sunken Marsh (Fantasy) | `marsh-heron_rookery.jpg` |
| Hag's Hut | Sunken Marsh (Fantasy) | `marsh-hut.jpg` |
| Leech Pool | Sunken Marsh (Fantasy) | `marsh-leech_pool.jpg` |
| Stinking Mire | Sunken Marsh (Fantasy) | `marsh-mire.jpg` |
| Muddy Causeway | Sunken Marsh (Fantasy) | `marsh-muddy_causeway.jpg` |
| Peat Bog | Sunken Marsh (Fantasy) | `marsh-peat_bog.jpg` |
| Whispering Reeds | Sunken Marsh (Fantasy) | `marsh-reeds.jpg` |
| Rotting Pier | Sunken Marsh (Fantasy) | `marsh-rotting_pier.jpg` |
| Sunken Boat | Sunken Marsh (Fantasy) | `marsh-sunken_boat.jpg` |
| Witch Lights | Sunken Marsh (Fantasy) | `marsh-witch_lights.jpg` |
| Collapsed Stope | Silverado Mines (Old West) | `mines-collapsed_stope.jpg` |
| Crystal Seam | Silverado Mines (Old West) | `mines-crystal_seam.jpg` |
| Dripping Gallery | Silverado Mines (Old West) | `mines-dripping_gallery.jpg` |
| Echoing Chamber | Silverado Mines (Old West) | `mines-echoing_chamber.jpg` |
| Mine Entrance | Silverado Mines (Old West) | `mines-entry.jpg` |
| Flooded Drift | Silverado Mines (Old West) | `mines-flooded_drift.jpg` |
| Lucky Strike Saloon | Silverado Mines (Old West) | `mines-foremans_office.jpg` |
| Abandoned Forge | Silverado Mines (Old West) | `mines-forge.jpg` |
| Narrow Crawl | Silverado Mines (Old West) | `mines-narrow_crawl.jpg` |
| Ore Cart Track | Silverado Mines (Old West) | `mines-ore_cart_track.jpg` |
| Lift Shaft | Silverado Mines (Old West) | `mines-shaft.jpg` |
| Smelter Hall | Silverado Mines (Old West) | `mines-smelter_hall.jpg` |
| Timber Cavern | Silverado Mines (Old West) | `mines-timber_cavern.jpg` |
| Collapsed Tunnel | Silverado Mines (Old West) | `mines-tunnel.jpg` |
| Delver's Vault | Silverado Mines (Old West) | `mines-vault.jpg` |
| Multi-Mart: Main Aisle | Modern District (Modern) | `modern-ais.jpg` |
| Pixel Palace Arcade | Modern District (Modern) | `modern-arc.jpg` |
| Multi-Mart: Auto Center | Modern District (Modern) | `modern-aut.jpg` |
| Burger Barn | Modern District (Modern) | `modern-bbi.jpg` |
| Burger Barn: Parking Lot | Modern District (Modern) | `modern-bbl.jpg` |
| Page Turner Books | Modern District (Modern) | `modern-boo.jpg` |
| Multi-Mart: Clothing | Modern District (Modern) | `modern-clo.jpg` |
| Multi-Mart: Customer Service | Modern District (Modern) | `modern-cus.jpg` |
| Sunset Acres: Dumpster Alley | Modern District (Modern) | `modern-dmp.jpg` |
| Dollar Palace | Modern District (Modern) | `modern-dol.jpg` |
| Multi-Mart: Electronics | Modern District (Modern) | `modern-ele.jpg` |
| Food Court | Modern District (Modern) | `modern-foo.jpg` |
| QuikStop Gas: Pumps | Modern District (Modern) | `modern-g1p.jpg` |
| QuikStop Gas: Restroom | Modern District (Modern) | `modern-g1r.jpg` |
| QuikStop Gas: Convenience Store | Modern District (Modern) | `modern-g1s.jpg` |
| Fuel Stop: Pumps | Modern District (Modern) | `modern-g2p.jpg` |
| Fuel Stop: Restroom | Modern District (Modern) | `modern-g2r.jpg` |
| Fuel Stop: Convenience Store | Modern District (Modern) | `modern-g2s.jpg` |
| Portal Plaza | Modern District (Modern) | `modern-gate.jpg` |
| Multi-Mart: Grocery | Modern District (Modern) | `modern-gro.jpg` |
| Hot Dog Hut | Modern District (Modern) | `modern-hdh.jpg` |
| Multi-Mart: Home and Garden | Modern District (Modern) | `modern-hom.jpg` |
| Multi-Mart: Manager's Office | Modern District (Modern) | `modern-mgr.jpg` |
| Shopping Center: Mall Corridor | Modern District (Modern) | `modern-mid.jpg` |
| Multi-Mart Entrance | Modern District (Modern) | `modern-mme.jpg` |
| Multi-Mart Parking Lot | Modern District (Modern) | `modern-mml.jpg` |
| Paws and Claws Pet Store | Modern District (Modern) | `modern-pet.jpg` |
| Multi-Mart: Pharmacy | Modern District (Modern) | `modern-pha.jpg` |
| Westfield Shopping Center: Plaza | Modern District (Modern) | `modern-plz.jpg` |
| Commerce Avenue, West | Modern District (Modern) | `modern-s1.jpg` |
| Commerce Avenue | Modern District (Modern) | `modern-s2.jpg` |
| Commerce Avenue, Multi-Mart Corner | Modern District (Modern) | `modern-s3.jpg` |
| Commerce Avenue, Shopping Center Corner | Modern District (Modern) | `modern-s4.jpg` |
| Commerce Avenue, East | Modern District (Modern) | `modern-s5.jpg` |
| Multi-Mart: Sporting Goods | Modern District (Modern) | `modern-spo.jpg` |
| Multi-Mart: Stockroom | Modern District (Modern) | `modern-sto.jpg` |
| Trailer 1: The Pink Flamingo | Modern District (Modern) | `modern-t1.jpg` |
| Security Station | Modern District (Modern) | `modern-t1_a.jpg` |
| Corporate Gift Shop | Modern District (Modern) | `modern-t1_b.jpg` |
| Visitor Lounge | Modern District (Modern) | `modern-t1_c.jpg` |
| Atrium and Reception | Modern District (Modern) | `modern-t1_lobby.jpg` |
| Boardroom | Modern District (Modern) | `modern-t10_a.jpg` |
| Private Bar | Modern District (Modern) | `modern-t10_b.jpg` |
| The CEO's Office | Modern District (Modern) | `modern-t10_c.jpg` |
| Penthouse Landing | Modern District (Modern) | `modern-t10_lobby.jpg` |
| Trailer 2: The Doublewide | Modern District (Modern) | `modern-t2.jpg` |
| Call Center Floor | Modern District (Modern) | `modern-t2_a.jpg` |
| Complaints Department | Modern District (Modern) | `modern-t2_b.jpg` |
| Hold Music Room | Modern District (Modern) | `modern-t2_c.jpg` |
| Support Floor Landing | Modern District (Modern) | `modern-t2_lobby.jpg` |
| Trailer 3: The Gator Shack | Modern District (Modern) | `modern-t3.jpg` |
| Ledger Hall | Modern District (Modern) | `modern-t3_a.jpg` |
| Audit Room | Modern District (Modern) | `modern-t3_b.jpg` |
| Vault of Receipts | Modern District (Modern) | `modern-t3_c.jpg` |
| Accounting Landing | Modern District (Modern) | `modern-t3_lobby.jpg` |
| Trailer 4: The Rusty Airstream | Modern District (Modern) | `modern-t4.jpg` |
| Open Plan Office | Modern District (Modern) | `modern-t4_a.jpg` |
| Compliance Office | Modern District (Modern) | `modern-t4_b.jpg` |
| Training Room | Modern District (Modern) | `modern-t4_c.jpg` |
| HR Landing | Modern District (Modern) | `modern-t4_lobby.jpg` |
| Trailer 5: The Gnome Home | Modern District (Modern) | `modern-t5.jpg` |
| Help Desk | Modern District (Modern) | `modern-t5_a.jpg` |
| Server Farm | Modern District (Modern) | `modern-t5_b.jpg` |
| Network Closet | Modern District (Modern) | `modern-t5_c.jpg` |
| Break Room Landing | Modern District (Modern) | `modern-t5_lobby.jpg` |
| Trailer 6: The Vacant One | Modern District (Modern) | `modern-t6.jpg` |
| Brainstorm Room | Modern District (Modern) | `modern-t6_a.jpg` |
| Brand Studio | Modern District (Modern) | `modern-t6_b.jpg` |
| Social Media Den | Modern District (Modern) | `modern-t6_c.jpg` |
| Marketing Landing | Modern District (Modern) | `modern-t6_lobby.jpg` |
| Law Library | Modern District (Modern) | `modern-t7_a.jpg` |
| Deposition Room | Modern District (Modern) | `modern-t7_b.jpg` |
| Contracts Archive | Modern District (Modern) | `modern-t7_c.jpg` |
| Legal Landing | Modern District (Modern) | `modern-t7_lobby.jpg` |
| Prototype Lab | Modern District (Modern) | `modern-t8_a.jpg` |
| Test Chamber | Modern District (Modern) | `modern-t8_b.jpg` |
| Specimen Storage | Modern District (Modern) | `modern-t8_c.jpg` |
| R&D Landing | Modern District (Modern) | `modern-t8_lobby.jpg` |
| Executive Hall | Modern District (Modern) | `modern-t9_a.jpg` |
| Sales Floor | Modern District (Modern) | `modern-t9_b.jpg` |
| Corner Offices | Modern District (Modern) | `modern-t9_c.jpg` |
| Executive Lounge Landing | Modern District (Modern) | `modern-t9_lobby.jpg` |
| Boiler Room | Modern District (Modern) | `modern-tb_a.jpg` |
| Parking Garage | Modern District (Modern) | `modern-tb_b.jpg` |
| Mail Room | Modern District (Modern) | `modern-tb_c.jpg` |
| Basement Landing | Modern District (Modern) | `modern-tb_lobby.jpg` |
| TechHut Electronics | Modern District (Modern) | `modern-tec.jpg` |
| Sunset Acres: Park Office | Modern District (Modern) | `modern-tof.jpg` |
| Multi-Mart: Toys | Modern District (Modern) | `modern-toy.jpg` |
| Sunset Acres Gate | Modern District (Modern) | `modern-tpg.jpg` |
| Sunset Acres: Lot Road | Modern District (Modern) | `modern-tpr1.jpg` |
| Sunset Acres: Middle Row | Modern District (Modern) | `modern-tpr2.jpg` |
| Sunset Acres: East Row | Modern District (Modern) | `modern-tpr3.jpg` |
| Meridian Tower Plaza | Modern District (Modern) | `modern-tw_front.jpg` |
| Amber Hollow | The Primeval Rift (Prehistoric) | `prime-amber.jpg` |
| The Tyrant's Arena | The Primeval Rift (Prehistoric) | `prime-arena.jpg` |
| Cycad Grove | The Primeval Rift (Prehistoric) | `prime-cyc.jpg` |
| Fern Forest | The Primeval Rift (Prehistoric) | `prime-fern.jpg` |
| Allosaurus Gorge | The Primeval Rift (Prehistoric) | `prime-gorge.jpg` |
| Triceratops Plains | The Primeval Rift (Prehistoric) | `prime-herd.jpg` |
| Dino Lagoon | The Primeval Rift (Prehistoric) | `prime-lagoon.jpg` |
| Portal Landing | The Primeval Rift (Prehistoric) | `prime-landing.jpg` |
| Mudflats | The Primeval Rift (Prehistoric) | `prime-mud.jpg` |
| Raptor Nest | The Primeval Rift (Prehistoric) | `prime-nest.jpg` |
| Bone Pass | The Primeval Rift (Prehistoric) | `prime-pass.jpg` |
| Pteranodon Ridge | The Primeval Rift (Prehistoric) | `prime-ridge1.jpg` |
| Skyward Cliffs | The Primeval Rift (Prehistoric) | `prime-ridge2.jpg` |
| The Eyrie | The Primeval Rift (Prehistoric) | `prime-ridge3.jpg` |
| Roaring River | The Primeval Rift (Prehistoric) | `prime-river.jpg` |
| Spinosaur Shallows | The Primeval Rift (Prehistoric) | `prime-shallows.jpg` |
| Fern Swamp | The Primeval Rift (Prehistoric) | `prime-swamp.jpg` |
| Tar Pits | The Primeval Rift (Prehistoric) | `prime-tar.jpg` |
| Primeval Trail | The Primeval Rift (Prehistoric) | `prime-trail.jpg` |
| Stegosaur Valley | The Primeval Rift (Prehistoric) | `prime-valley.jpg` |
| Depot Gate | Brimstone Rail Yard (Old West) | `rail-a.jpg` |
| Ticket Office | Brimstone Rail Yard (Old West) | `rail-b.jpg` |
| Brimstone Saloon Car | Brimstone Rail Yard (Old West) | `rail-c.jpg` |
| Stationmaster's Office | Brimstone Rail Yard (Old West) | `rail-d.jpg` |
| Telegraph Hut | Brimstone Rail Yard (Old West) | `rail-e.jpg` |
| Coal Yard | Brimstone Rail Yard (Old West) | `rail-f.jpg` |
| Switching Yard | Brimstone Rail Yard (Old West) | `rail-g.jpg` |
| Roundhouse | Brimstone Rail Yard (Old West) | `rail-h.jpg` |
| Water Tower | Brimstone Rail Yard (Old West) | `rail-i.jpg` |
| Cattle Cars | Brimstone Rail Yard (Old West) | `rail-j.jpg` |
| Boxcar Boneyard | Brimstone Rail Yard (Old West) | `rail-k.jpg` |
| Turntable | Brimstone Rail Yard (Old West) | `rail-l.jpg` |
| Signal Tower | Brimstone Rail Yard (Old West) | `rail-m.jpg` |
| Hellmouth Tunnel | Brimstone Rail Yard (Old West) | `rail-n.jpg` |
| Ice Hole | The Drowned Reach (Fantasy) | `reach-a.jpg` |
| Sunken Stair | The Drowned Reach (Fantasy) | `reach-b.jpg` |
| Tidal Chapel | The Drowned Reach (Fantasy) | `reach-c.jpg` |
| Pearl Market | The Drowned Reach (Fantasy) | `reach-d.jpg` |
| Whale Bone Arch | The Drowned Reach (Fantasy) | `reach-e.jpg` |
| Kelp Forest | The Drowned Reach (Fantasy) | `reach-f.jpg` |
| Shipwreck Galleon | The Drowned Reach (Fantasy) | `reach-g.jpg` |
| Drowned Library | The Drowned Reach (Fantasy) | `reach-h.jpg` |
| Coral Hall | The Drowned Reach (Fantasy) | `reach-i.jpg` |
| Siren's Rock | The Drowned Reach (Fantasy) | `reach-j.jpg` |
| Pearl Grotto | The Drowned Reach (Fantasy) | `reach-k.jpg` |
| Abyssal Trench | The Drowned Reach (Fantasy) | `reach-l.jpg` |
| Trident Hall | The Drowned Reach (Fantasy) | `reach-m.jpg` |
| Coral Throne | The Drowned Reach (Fantasy) | `reach-n.jpg` |
| Rattlesnake Saloon | Redrock Trail (Old West) | `road-abandoned_inn.jpg` |
| Ambush Gully | Redrock Trail (Old West) | `road-ambush_gully.jpg` |
| Outlaw Camp | Redrock Trail (Old West) | `road-bandit_camp.jpg` |
| Burnt Wagon | Redrock Trail (Old West) | `road-burnt_wagon.jpg` |
| Dry Wash | Redrock Trail (Old West) | `road-dry_wash.jpg` |
| The Crossroads | Redrock Trail (Old West) | `road-fork.jpg` |
| Hanging Tree | Redrock Trail (Old West) | `road-hanging_tree.jpg` |
| Redrock Trail, First Mile | Redrock Trail (Old West) | `road-mile1.jpg` |
| Redrock Trail, Second Mile | Redrock Trail (Old West) | `road-mile2.jpg` |
| Old Milestone | Redrock Trail (Old West) | `road-old_milestone.jpg` |
| Shepherd's Rest | Redrock Trail (Old West) | `road-shepherds_rest.jpg` |
| Toll Bridge | Redrock Trail (Old West) | `road-toll_bridge.jpg` |
| Watch Hill | Redrock Trail (Old West) | `road-watch_hill.jpg` |
| Briar Gate | Thornwild Court (Fantasy) | `thorn-a.jpg` |
| Mushroom Ring | Thornwild Court (Fantasy) | `thorn-b.jpg` |
| Moonwell | Thornwild Court (Fantasy) | `thorn-c.jpg` |
| Pixie Market | Thornwild Court (Fantasy) | `thorn-d.jpg` |
| Thistle Bridge | Thornwild Court (Fantasy) | `thorn-e.jpg` |
| Hedge Maze | Thornwild Court (Fantasy) | `thorn-f.jpg` |
| Dreaming Pool | Thornwild Court (Fantasy) | `thorn-g.jpg` |
| Fae Library | Thornwild Court (Fantasy) | `thorn-h.jpg` |
| Glowing Grove | Thornwild Court (Fantasy) | `thorn-i.jpg` |
| Nightshade Garden | Thornwild Court (Fantasy) | `thorn-j.jpg` |
| Hollow Oak | Thornwild Court (Fantasy) | `thorn-k.jpg` |
| Toadstool Hall | Thornwild Court (Fantasy) | `thorn-l.jpg` |
| Sunlit Glade | Thornwild Court (Fantasy) | `thorn-m.jpg` |
| Court of Thorns | Thornwild Court (Fantasy) | `thorn-n.jpg` |
| Adventurers' Guild | Ashfall Junction (Old West) | `town-adventurers_guild.jpg` |
| Alchemist's Tower | Ashfall Junction (Old West) | `town-alchemists_tower.jpg` |
| Ironbound Armory | Ashfall Junction (Old West) | `town-armory.jpg` |
| Back Alley | Ashfall Junction (Old West) | `town-back_alley.jpg` |
| Baker's Row | Ashfall Junction (Old West) | `town-bakers_row.jpg` |
| Chapel Garden | Ashfall Junction (Old West) | `town-chapel_garden.jpg` |
| Chrome Clinic | Ashfall Junction (Old West) | `town-clinic.jpg` |
| Cobbler Lane | Ashfall Junction (Old West) | `town-cobbler_lane.jpg` |
| Cooper's Yard | Ashfall Junction (Old West) | `town-coopers_yard.jpg` |
| East Gate | Ashfall Junction (Old West) | `town-eastgate.jpg` |
| North Gate | Ashfall Junction (Old West) | `town-gate.jpg` |
| Hall of Many Faces | Ashfall Junction (Old West) | `town-hall_of_faces.jpg` |
| Hall of Rebirth | Ashfall Junction (Old West) | `town-hall_of_rebirth.jpg` |
| Neural Implant Lab | Ashfall Junction (Old West) | `town-implant_lab.jpg` |
| Silver Spur Saloon | Ashfall Junction (Old West) | `town-inn.jpg` |
| Market Row | Ashfall Junction (Old West) | `town-market.jpg` |
| Old Well | Ashfall Junction (Old West) | `town-old_well.jpg` |
| Old Quarry | Ashfall Junction (Old West) | `town-quarry.jpg` |
| Salvage Exchange | Ashfall Junction (Old West) | `town-salvage_exchange.jpg` |
| Brann's Smithy | Ashfall Junction (Old West) | `town-smithy.jpg` |
| Ashfall Square | Ashfall Junction (Old West) | `town-square.jpg` |
| Stables | Ashfall Junction (Old West) | `town-stables.jpg` |
| Temple of the Dawn | Ashfall Junction (Old West) | `town-temple.jpg` |
| Watchtower | Ashfall Junction (Old West) | `town-watchtower.jpg` |
