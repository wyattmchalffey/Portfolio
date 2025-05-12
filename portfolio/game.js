class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.player = null;
        this.isoOriginX = 0;
        this.isoOriginY = 0;
        this.tileWidthIso = 64;
        this.tileHeightIso = 32;
        this.targetMarker = null;
        this.playerTargetPos = null;
        this.playerSpeed = 150;
        this.interactableObjects = null; // NEW: Group to hold interactable objects
        console.log("MainScene constructor called");
    }

    preload() {
        console.log("preload started");
        this.load.image('player', 'assets/player_placeholder.png');
        // NEW: Load an image for our interactable object
        this.load.image('project_shrine', 'assets/shrine_placeholder.png'); // Create a simple placeholder image
        // Fallback if you don't have one yet:
        // this.load.image('project_shrine', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAAAACshmLzAAABJ0lEQVRYCe1Wuw6CQBCs7w40Nja2vjcwMBAbGwdPYGNj4xX82/gMFjY+MPAPsLGL+AnUaWlLWlqyJAlJEna7M7MhCPxfAgBAxMAAgIESAGBLOQSXV3c3TwA4/gBYo4QnAY7jII7j2nZAHAcQjmM5jnOk6+u9K+Fbh9K5jHMYx2Fd1xVAVVUgBEJEI8YYOI5jzjnjXOdxHMQYI0QIIYQQQgghlLKUEgAxRjHGKKWUUkqpTdN85nk+5/k+BEGAIAhFUZTneZ7n+VVVFcFvzPdyPbQoaubVVTeb+fQ+5/kQQhDTtEVRrKur2sM0zUo0TWOMh0L8c+E5RERCRLBcF8z3XjCe5/s8D9M0lmWZTtO6bptWlmU5jrMEQcB1zTJN07quCwAohBCzLOO6LgBACCHE+R+eAbQ/AbnO7HgrZdFRAAAAAElFTkSuQmCC'); // 32x32 blue square
        console.log("preload finished");
    }

    create() {
        console.log("create started");

        // --- World & Physics Setup ---
        this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.isoOriginX = this.cameras.main.width / 2;
        this.isoOriginY = 200;

        // --- Player Setup ---
        const startIsoX = 0;
        const startIsoY = 0;
        const playerScreenPos = this.isoToScreen(startIsoX, startIsoY);
        this.player = this.physics.add.sprite(playerScreenPos.x, playerScreenPos.y, 'player');
        this.player.setOrigin(0.5, 1); // Align player's feet
        this.player.setCollideWorldBounds(true); // Keep player on screen

        console.log("Player sprite added at screen:", playerScreenPos.x, playerScreenPos.y);

        // --- Target Marker Setup ---
        this.targetMarker = this.add.graphics();
        this.targetMarker.fillStyle(0xff0000, 0.7);
        this.targetMarker.fillCircle(0, 0, 8);
        this.targetMarker.setVisible(false);

        // --- Create Interactable Objects Group ---
        // Using a Physics Group allows objects to potentially interact physically later if needed,
        // but more importantly, helps organize them.
        this.interactableObjects = this.physics.add.staticGroup(); // Static group: objects don't move due to physics

        // --- Add an Interactable Object ---
        const shrineIsoX = 3;
        const shrineIsoY = 2;
        const shrineScreenPos = this.isoToScreen(shrineIsoX, shrineIsoY);
        console.log(`Calculated Screen Position for Shrine: X=${shrineScreenPos.x.toFixed(0)}, Y=${shrineScreenPos.y.toFixed(0)}`); // Log new position
        const shrine = this.interactableObjects.create(shrineScreenPos.x, shrineScreenPos.y, 'project_shrine');

        shrine.setScale(0.5);
        shrine.setOrigin(0.5, 1); // Align bottom center like the player
        shrine.refreshBody(); // Important for static physics objects after moving/setting origin
        

        // Make the shrine interactive
        shrine.setInteractive({ useHandCursor: true }); // Enable input and show hand cursor on hover

        // Store data on the object itself (useful later)
        shrine.setData('name', 'Project Shrine Alpha');
        shrine.setData('description', 'This shrine holds info about my first cool project.');
        shrine.setData('isoPos', { x: shrineIsoX, y: shrineIsoY }); // Store its logical iso position

        console.log("Added interactable shrine:", shrine.getData('name'));


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


        // Click handling (slight modification)
        this.input.on('pointerdown', (pointer, gameObjects) => { // gameObjects is an array of objects under the pointer

            const clickedInteractable = gameObjects.find(obj => this.interactableObjects.contains(obj));

            if (clickedInteractable) {
                // --- Clicked ON an interactable object ---
                console.log("Clicked on interactable:", clickedInteractable.getData('name'));
                console.log(`  Shrine Screen Pos: X=${clickedInteractable.x.toFixed(1)}, Y=${clickedInteractable.y.toFixed(1)}`); // Log shrine pos

                const targetPos = { x: clickedInteractable.x, y: clickedInteractable.y };

                // Log values for offset calculation
                const objHeight = clickedInteractable.height; // Height after scaling
                const objOriginY = clickedInteractable.originY;
                console.log(`  Shrine Scaled Height: ${objHeight.toFixed(1)}, OriginY: ${objOriginY.toFixed(1)}`);

                const interactionOffsetY = - (objHeight * objOriginY) / 2;
                console.log(`  Calculated OffsetY: ${interactionOffsetY.toFixed(1)}`); // Log offset

                targetPos.y += interactionOffsetY;
                console.log(`  Final Target Pos: X=${targetPos.x.toFixed(1)}, Y=${targetPos.y.toFixed(1)}`); // Log final target before Vector2

                this.playerTargetPos = new Phaser.Math.Vector2(targetPos.x, targetPos.y);
                console.log("Set player target to interactable Vector2:", this.playerTargetPos); // Log the vector

                this.targetMarker.setPosition(targetPos.x, targetPos.y);
                this.targetMarker.setVisible(true);

                this.physics.moveToObject(this.player, this.playerTargetPos, this.playerSpeed);

                this.player.setData('interactionTarget', clickedInteractable);


            } else if (pointer.leftButtonDown()) { // Check if it's a left click specifically
                // --- Clicked on the ground (like before) ---
                console.log("Clicked on ground");
                const screenX = pointer.worldX;
                const screenY = pointer.worldY;

                const isoPos = this.screenToIso(screenX, screenY);
                const tileCenterScreenPos = this.isoToScreen(Math.floor(isoPos.x), Math.floor(isoPos.y));

                this.targetMarker.setPosition(tileCenterScreenPos.x, tileCenterScreenPos.y);
                this.targetMarker.setVisible(true);

                this.playerTargetPos = new Phaser.Math.Vector2(tileCenterScreenPos.x, tileCenterScreenPos.y);
                console.log("Set player target to ground:", this.playerTargetPos);

                this.physics.moveToObject(this.player, this.playerTargetPos, this.playerSpeed);

                // Clear any interaction target if moving to ground
                this.player.setData('interactionTarget', null);
            }

        });
        console.log("Input listeners added");

        console.log("create finished");
    }

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


    update(time, delta) {
        if (this.playerTargetPos) {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                this.playerTargetPos.x, this.playerTargetPos.y
            );

            // --- ADD DETAILED LOGGING ---
            const interactionTarget = this.player.getData('interactionTarget');
            if (interactionTarget) { // Only log verbosely if moving to an interactable
                console.log(`Moving to ${interactionTarget.getData('name')}: Player(${this.player.x.toFixed(0)}, ${this.player.y.toFixed(0)}), Target(${this.playerTargetPos.x.toFixed(0)}, ${this.playerTargetPos.y.toFixed(0)}), Dist: ${distance.toFixed(1)}`);
            }
            // --- END LOGGING ---

            if (distance < 4) {
                console.log("Player reached target.");
                // ... (rest of stopping logic remains the same) ...

                this.player.body.reset(this.playerTargetPos.x, this.playerTargetPos.y);
                this.playerTargetPos = null;
                this.targetMarker.setVisible(false);

                if (interactionTarget) {
                    console.log("Arrived at interactable:", interactionTarget.getData('name'));
                    this.triggerInteraction(interactionTarget);
                    this.player.setData('interactionTarget', null);
                }
            }
        }
    }

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