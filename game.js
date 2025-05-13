class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.player = null;
        // --- NEW: Define world dimensions ---
        this.worldWidth = 3000;  // Example: Make the world 3000px wide
        this.worldHeight = 2000; // Example: Make the world 2000px tall
        // ---
        this.isoOriginX = 0;
        this.isoOriginY = 0;
        this.tileWidthIso = 128;
        this.tileHeightIso = 64;
        this.targetMarker = null;
        this.playerTargetPos = null;
        this.playerSpeed = 150;
        this.interactableObjects = null;
        console.log("MainScene constructor called");
    }

    preload() {
        console.log("preload started");
        this.load.image('player', 'assets/player_placeholder.png');
        this.load.image('project_shrine', 'assets/shrine_placeholder.png');
        this.load.image('ground_tile', 'assets/ground_tile.png');
        console.log("preload finished");
    }

    create() {
        console.log("create started");

        // --- Adjust World & Camera Setup ---
        // Set physics bounds to the new larger world size
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

        // Calculate iso origin relative to the larger world center
        this.isoOriginX = this.worldWidth / 2;
        // Keep origin fairly high in the world, e.g., 10% down from top
        this.isoOriginY = this.worldHeight * 0.1; // e.g., 200 if worldHeight is 2000
        console.log(`World size: ${this.worldWidth}x${this.worldHeight}. Iso Origin set to: X=${this.isoOriginX.toFixed(0)}, Y=${this.isoOriginY.toFixed(0)}`);

        // Set camera bounds to the world size
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        // --- End of World/Camera Adjustments ---

        // --- NEW: Add Ground Tiles ---
        console.log("Adding ground tiles...");
        // Determine the range of isometric coordinates needed to cover the world.
        // This is an estimation; a more precise calculation involves converting world corners to iso coords.
        // Let's estimate a generous range based on world size and tile size.
        const approxTilesX = Math.ceil(this.worldWidth / this.tileWidthIso) + 10; // Extra buffer
        const approxTilesY = Math.ceil(this.worldHeight / (this.tileHeightIso / 2)) + 10; // World height coverage depends more on half-tile height steps
        // const rangeX = Math.ceil(approxTilesX / 2 + approxTilesY / 2) ; // Rough estimate for combined iso range
        // const rangeY = rangeX; // Keep it simple

        const rangeX = 15; // e.g., only 15 tiles out from origin horizontally
        const rangeY = 15; // e.g., only 15 tiles out from origin vertically

        const minIsoTileX = -rangeX;
        const maxIsoTileX = rangeX;
        const minIsoTileY = -rangeY;
        const maxIsoTileY = rangeY;

        // Group for organization (doesn't add much performance here vs Tilemap)
        this.groundTiles = this.add.group();

        for (let isoX = minIsoTileX; isoX <= maxIsoTileX; isoX++) {
            for (let isoY = minIsoTileY; isoY <= maxIsoTileY; isoY++) {
                // Convert the iso grid coordinate to world pixel coordinates
                const tileWorldPos = this.isoToScreen(isoX, isoY);

                // Place the tile image
                const tileImage = this.add.image(tileWorldPos.x, tileWorldPos.y, 'ground_tile');

                // Set origin for diamond tiles. Usually center (0.5, 0.5) is fine.
                // If your tile graphic's base is at the bottom center, you might use (0.5, 1).
                // If its logical point is top center, use (0.5, 0). Start with default (0.5, 0.5).
                tileImage.setOrigin(.5, .5); // Default, often okay

                 // Add to group (optional)
                 this.groundTiles.add(tileImage);
            }
        }
        console.log(`Added tiles in iso range X: ${minIsoTileX} to ${maxIsoTileX}, Y: ${minIsoTileY} to ${maxIsoTileY}`);
        // --- END of Ground Tiles ---


        // --- Player Setup ---
        const startIsoX = 0;
        const startIsoY = 0;
        const playerScreenPos = this.isoToScreen(startIsoX, startIsoY); // Note: screenPos is now worldPos
        this.player = this.physics.add.sprite(playerScreenPos.x, playerScreenPos.y, 'player');
        this.player.setOrigin(0.5, 1);
        // Collision bounds now refer to the larger world
        this.player.setCollideWorldBounds(true);
        console.log("Player sprite added at world pos:", playerScreenPos.x.toFixed(0), playerScreenPos.y.toFixed(0));

        // --- Target Marker Setup (No changes needed) ---
        this.targetMarker = this.add.graphics();
        this.targetMarker.fillStyle(0xff0000, 0.7);
        this.targetMarker.fillCircle(0, 0, 8);
        this.targetMarker.setVisible(false);

        // --- Interactable Objects Group (No changes needed) ---
        this.interactableObjects = this.physics.add.staticGroup();

        // --- Add an Interactable Object ---
        const shrineIsoX = 15; // Using your adjusted position
        const shrineIsoY = 10;
        const shrineScreenPos = this.isoToScreen(shrineIsoX, shrineIsoY); // This is worldPos
        console.log(`Calculated World Position for Shrine: X=${shrineScreenPos.x.toFixed(0)}, Y=${shrineScreenPos.y.toFixed(0)}`);
        const shrine = this.interactableObjects.create(shrineScreenPos.x, shrineScreenPos.y, 'project_shrine');
        // Use setDisplaySize or setScale as preferred
        shrine.setDisplaySize(48, 64); // Example size
        shrine.setOrigin(0.5, 1);
        shrine.refreshBody();
        shrine.setInteractive({ useHandCursor: true });
        shrine.setData('name', 'Steamdle');
        shrine.setData('description', 'This shrine holds info about my first cool project.');
        shrine.setData('isoPos', { x: shrineIsoX, y: shrineIsoY });
        console.log("Added interactable shrine:", shrine.getData('name'));


        // --- Start Camera Follow ---
        // Make the camera follow the player
        // Parameters: target, roundPixels, lerpX, lerpY
        // Lerp values (0 to 1) control smoothness (lower = smoother)
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        console.log("Camera started following player.");
        // --- End Camera Follow ---
        

        // --- Input Handling ---

        // Hover effects for interactables
        this.input.on('gameobjectover', (pointer, gameObject) => {
            // Check if the hovered object is in our interactable group
            if (this.interactableObjects.contains(gameObject)) {
                gameObject.setTint(0xdddddd); // Apply a light tint on hover
            }
        });

        this.input.on('gameobjectout', (pointer, gameObject) => {
            // Check if the object leaving hover is in our interactable group
            if (this.interactableObjects.contains(gameObject)) {
                gameObject.clearTint(); // Remove tint when mouse leaves
            }
        });


        // Click handling... (no changes needed, pointer.worldX/Y are correct)
        this.input.on('pointerdown', (pointer, gameObjects) => {
            const clickedInteractable = gameObjects.find(obj => this.interactableObjects.contains(obj));

            if (clickedInteractable) {
                // --- Clicked Interactable ---
                // Using simplified target logic from before
                console.log("Clicked on interactable:", clickedInteractable.getData('name'));
                const targetX = clickedInteractable.x;
                const targetY = clickedInteractable.y + 10; // Stop slightly below base
                console.log(`  Simplified Target Pos: X=${targetX.toFixed(1)}, Y=${targetY.toFixed(1)}`);

                this.playerTargetPos = new Phaser.Math.Vector2(targetX, targetY);
                console.log("Set player target to interactable Vector2:", this.playerTargetPos);

                // Target marker position needs to be relative to the current camera view
                // We calculate its position in world space, but need to show it correctly on screen
                // The marker itself has setScrollFactor(0), so setting its world position works
                this.targetMarker.setPosition(targetX, targetY);
                this.targetMarker.setVisible(true);


                this.physics.moveToObject(this.player, this.playerTargetPos, this.playerSpeed);
                this.player.setData('interactionTarget', clickedInteractable);

            } else if (pointer.leftButtonDown()) {
                // --- Clicked Ground ---
                console.log("Clicked on ground");
                const worldX = pointer.worldX; // pointer.worldX is correct even with camera scroll
                const worldY = pointer.worldY;

                const isoPos = this.screenToIso(worldX, worldY);
                const tileCenterWorldPos = this.isoToScreen(Math.floor(isoPos.x), Math.floor(isoPos.y));

                // Target marker position (world coordinates)
                this.targetMarker.setPosition(tileCenterWorldPos.x, tileCenterWorldPos.y);
                this.targetMarker.setVisible(true);


                this.playerTargetPos = new Phaser.Math.Vector2(tileCenterWorldPos.x, tileCenterWorldPos.y);
                console.log("Set player target to ground:", this.playerTargetPos);

                this.physics.moveToObject(this.player, this.playerTargetPos, this.playerSpeed);
                this.player.setData('interactionTarget', null);
            }
        });
        console.log("Input listeners added");

        console.log("create finished");
    } // End of create()

      // --- isoToScreen / screenToIso
    isoToScreen(isoX, isoY) {
        const screenX = this.isoOriginX + (isoX - isoY) * (this.tileWidthIso / 2);
        const screenY = this.isoOriginY + (isoX + isoY) * (this.tileHeightIso / 2);
        return new Phaser.Math.Vector2(screenX, screenY);
    }

    screenToIso(screenX, screenY) {
        const screenOffsetX = screenX - this.isoOriginX;
        const screenOffsetY = screenY - this.isoOriginY;
        const isoX = (screenOffsetX / (this.tileWidthIso / 2) + screenOffsetY / (this.tileHeightIso / 2)) / 2;
        const isoY = (screenOffsetY / (this.tileHeightIso / 2) - screenOffsetX / (this.tileWidthIso / 2)) / 2;
        return new Phaser.Math.Vector2(isoX, isoY);
    }

     // --- update
    update(time, delta) {
        if (this.playerTargetPos) {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                this.playerTargetPos.x, this.playerTargetPos.y
            );

            // Use the threshold that worked before (e.g., 8)
            if (distance < 8) {
                console.log("Player reached target.");
                this.player.body.reset(this.playerTargetPos.x, this.playerTargetPos.y);
                this.playerTargetPos = null;
                // Keep marker logic as is - it should disappear when target reached
                this.targetMarker.setVisible(false);

                const interactionTarget = this.player.getData('interactionTarget');
                if (interactionTarget) {
                    console.log("Arrived at interactable:", interactionTarget.getData('name'));
                    this.triggerInteraction(interactionTarget);
                    this.player.setData('interactionTarget', null);
                }
            }
            // Optional debug log for distance
            // console.log(`Moving dist: ${distance.toFixed(1)}`);
        }
    } // End of update()


    // --- NEW: Function to handle interaction ---
    triggerInteraction(targetObject) {
        console.log("--- INTERACTION TRIGGERED ---");
        console.log("Object Name:", targetObject.getData('name'));
        console.log("Description:", targetObject.getData('description'));
        console.log("Iso Coords:", targetObject.getData('isoPos'));

        // --- TODO: Display this info diegetically ---
        // For now, we just log it. Next step could be showing a text bubble.
        // Example: Create a temporary text object near the targetObject
        const infoText = this.add.text(
            targetObject.x,
            targetObject.y - targetObject.height - 10, // Position above the object
            targetObject.getData('name'), // Display the object's name
            { fontSize: '12px', fill: '#fff', backgroundColor: '#000a', padding: { x: 5, y: 3 } }
        ).setOrigin(0.5, 1); // Align bottom center

        // Make the text disappear after a few seconds
        this.time.delayedCall(3000, () => {
            infoText.destroy();
        });
    }
}


// Config hasn't changed (physics already included)
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: '',
        width: '100%',
        height: '100%'
    },
    physics: {
        default: 'arcade',
        arcade: {
            // gravity: { y: 0 },
            debug: true
        }
    },
    scene: [MainScene],
    backgroundColor: '#333333'
};

console.log("Config defined, creating game...");
const game = new Phaser.Game(config);
console.log("Phaser Game instance created:", game);