// Global variables for each model container
const containers = {
    can: {
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        model: null,
        isWireframe: false,
        isRotating: true,
        mixer: null,
        animations: [],
        clock: null,
        pendingAnimation: false  // Flag to indicate if an animation should be triggered after loading
    },
    plastic: {
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        model: null,
        isWireframe: false,
        isRotating: true,
        mixer: null,
        animations: [],
        clock: null,
        pendingAnimation: false  // Flag to indicate if an animation should be triggered after loading
    },
    glass: {
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        model: null,
        isWireframe: false,
        isRotating: true,
        mixer: null,
        animations: [],
        clock: null,
        pendingAnimation: false  // Flag to indicate if an animation should be triggered after loading
    }
};

// Rotation speed
let rotationSpeed = 0.005;

// Initialize everything
function init() {
    console.log("Gallery Controller initializing...");
    
    // Initialize each container with the CORRECT model names
    initContainer('can', 'soda_can');          // Using soda_can.glb
    initContainer('plastic', 'complete_bottle');
    initContainer('glass', 'glassbottle');     // Using glassbottle.glb
    
    // Setup event listeners for UI controls
    setupGlobalControls();
    
    // Start animation loop
    animate();
}

// Setup global control buttons
function setupGlobalControls() {
    const toggleAllWireframeBtn = document.getElementById('toggleAllWireframe');
    if (toggleAllWireframeBtn) {
        toggleAllWireframeBtn.addEventListener('click', toggleAllWireframe);
    } else {
        console.warn("toggleAllWireframe button not found");
    }
    
    const toggleAllRotationBtn = document.getElementById('toggleAllRotation');
    if (toggleAllRotationBtn) {
        toggleAllRotationBtn.addEventListener('click', toggleAllRotation);
    } else {
        console.warn("toggleAllRotation button not found");
    }
    
    const toggleAllLightsBtn = document.getElementById('toggleAllLights');
    if (toggleAllLightsBtn) {
        toggleAllLightsBtn.addEventListener('click', toggleAllLights);
    } else {
        console.warn("toggleAllLights button not found");
    }
}

// Initialize a single container
function initContainer(containerKey, modelName) {
    console.log(`Initializing container: ${containerKey} with model: ${modelName}`);
    
    const container = containers[containerKey];
    const domElement = document.getElementById(`${containerKey}Container`);
    
    if (!domElement) {
        console.error(`Container element #${containerKey}Container not found`);
        return;
    }
    
    // Create clock for animations
    container.clock = new THREE.Clock();
    
    // Create scene
    container.scene = new THREE.Scene();
    container.scene.background = new THREE.Color(0xf0f0f0);
    
    // Create camera
    container.camera = new THREE.PerspectiveCamera(
        45,
        domElement.offsetWidth / domElement.offsetHeight,
        0.1,
        1000
    );
    container.camera.position.set(0, 0, 10);
    
    // Create renderer
    container.renderer = new THREE.WebGLRenderer({ antialias: true });
    container.renderer.setSize(domElement.offsetWidth, domElement.offsetHeight);
    container.renderer.shadowMap.enabled = true;
    
    // Add renderer to DOM
    domElement.innerHTML = ''; // Clear container
    domElement.appendChild(container.renderer.domElement);
    
    // Create controls
    container.controls = new THREE.OrbitControls(container.camera, container.renderer.domElement);
    container.controls.enableDamping = true;
    container.controls.dampingFactor = 0.05;
    
    // Add lights
    setupLights(container);
    
    // Load model
    loadModel(containerKey, modelName);
    
    // Make it responsive
    window.addEventListener('resize', function() {
        onWindowResize(containerKey);
    });
}

// Load a specific model for a specific container
function loadModelForContainer(containerKey, modelName) {
    // Log the request
    console.log(`Loading model ${modelName} for container ${containerKey}`);
    
    // Reset pending animation flag
    containers[containerKey].pendingAnimation = false;
    
    // Load the new model
    loadModel(containerKey, modelName);
}

// Special function for bottle crush - identical to modelController.js but with pending animation flag
function loadBottleCrush(containerKey) {
    console.log(`Loading bottle crush for ${containerKey}`);
    
    // Store wireframe state before loading new model
    const wasWireframe = containers[containerKey].isWireframe;
    
    // For plastic bottle (bottleC)
    if (containerKey === 'plastic') {
        // Set pending animation flag
        containers[containerKey].pendingAnimation = true;
        
        // Load the model
        loadModel(containerKey, 'bottleC');
        
        // For wireframe mode, make sure wireframe is reapplied and animations work
        if (wasWireframe) {
            setTimeout(() => {
                // Apply wireframe if needed
                if (!containers[containerKey].isWireframe) {
                    containers[containerKey].isWireframe = true;
                    applyWireframe(containerKey);
                } else {
                    // If already in wireframe, just trigger the animation again
                    if (containers[containerKey].animations && containers[containerKey].animations.length > 0) {
                        containers[containerKey].animations.forEach(action => {
                            action.stop();
                            action.reset();
                            action.setLoop(THREE.LoopOnce);
                            action.clampWhenFinished = true;
                            action.timeScale = 1;
                            action.play();
                        });
                    }
                }
            }, 600);
        }
    }
    // For glass bottle (glassbottle_crush)
    else if (containerKey === 'glass') {
        // Set pending animation flag
        containers[containerKey].pendingAnimation = true;
        
        // Load the model
        loadModel(containerKey, 'glassbottle_crush');
        
        // For wireframe mode, make sure wireframe is reapplied and animations work
        if (wasWireframe) {
            setTimeout(() => {
                // Apply wireframe if needed
                if (!containers[containerKey].isWireframe) {
                    containers[containerKey].isWireframe = true;
                    applyWireframe(containerKey);
                } else {
                    // If already in wireframe, just trigger the animation again
                    if (containers[containerKey].animations && containers[containerKey].animations.length > 0) {
                        containers[containerKey].animations.forEach(action => {
                            action.stop();
                            action.reset();
                            action.setLoop(THREE.LoopOnce);
                            action.clampWhenFinished = true;
                            action.timeScale = 1;
                            action.play();
                        });
                    }
                }
            }, 600);
        }
    }
}

// Setup scene lighting
function setupLights(container) {
    // Ambient light
    container.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    container.scene.add(container.ambientLight);
    
    // Directional light
    container.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    container.directionalLight.position.set(1, 1, 1);
    container.directionalLight.castShadow = true;
    container.scene.add(container.directionalLight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update each container
    for (const key in containers) {
        const container = containers[key];
        
        // Update the animation mixer if available
        if (container.mixer) {
            container.mixer.update(container.clock.getDelta());
        }
        
        // Apply rotation if enabled
        if (container.isRotating && container.model) {
            container.model.rotation.y += rotationSpeed;
        }
        
        // Update orbital controls
        if (container.controls) {
            container.controls.update();
        }
        
        // Render scene
        if (container.renderer && container.scene && container.camera) {
            container.renderer.render(container.scene, container.camera);
        }
    }
}

// Handle window resizing
function onWindowResize(containerKey) {
    const container = containers[containerKey];
    const domElement = document.getElementById(`${containerKey}Container`);
    
    if (!domElement || !container.camera || !container.renderer) return;
    
    // Update camera aspect ratio
    container.camera.aspect = domElement.offsetWidth / domElement.offsetHeight;
    container.camera.updateProjectionMatrix();
    
    // Update renderer size
    container.renderer.setSize(domElement.offsetWidth, domElement.offsetHeight);
}

// Load 3D model
function loadModel(containerKey, modelName) {
    const container = containers[containerKey];
    const domElement = document.getElementById(`${containerKey}Container`);
    
    if (!domElement) {
        console.error(`Container #${containerKey}Container not found`);
        return;
    }
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'action-spinner';
    loadingDiv.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary mb-2" role="status"></div>
            <p class="fw-bold text-dark">Loading model...</p>
        </div>
    `;
    domElement.appendChild(loadingDiv);
    
    // Reset animations array
    container.animations = [];
    container.mixer = null;
    
    // Clear previous model
    if (container.model) {
        // FIXED: Use container.scene instead of scene
        container.scene.remove(container.model);
        container.model = null;
    }
    
    // Get the path to the model - EXACT same format as modelController.js
    const modelPath = `assets/models/${modelName}.glb`;
    
    // Log the path for debugging
    console.log(`Loading model from: ${modelPath}`);
    
    // Create a loader
    const loader = new THREE.GLTFLoader();
    
    // Load the model
    loader.load(
        modelPath,
        function(gltf) {
            console.log(`Model ${modelName} loaded successfully for ${containerKey}!`);
            
            // Remove loading indicator
            if (loadingDiv.parentNode) {
                loadingDiv.parentNode.removeChild(loadingDiv);
            }
            
            container.model = gltf.scene;
            // Store model name for easier identification (new line added)
            container.model.userData.modelName = modelName;
            
            // Center and scale the model
            const box = new THREE.Box3().setFromObject(container.model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 5 / maxDim;
            
            container.model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
            container.model.scale.set(scale, scale, scale);
            
            // Handle animations if available
            if (gltf.animations && gltf.animations.length) {
                console.log(`Model ${modelName} has ${gltf.animations.length} animations`);
                container.mixer = new THREE.AnimationMixer(container.model);
                
                gltf.animations.forEach((clip, index) => {
                    console.log(`Animation ${index}: "${clip.name}", Duration: ${clip.duration.toFixed(2)}s`);
                    const action = container.mixer.clipAction(clip);
                    container.animations.push(action);
                });
                
                // Auto-play animations for certain models based on filename
                if (modelName.includes('open') || 
                    modelName.includes('cap') || 
                    modelName.includes('ringpull') || 
                    modelName.includes('empty')) {
                    console.log("Auto-playing animations for action model: " + modelName);
                    playAllAnimations(containerKey);
                }
                
                // Check if we need to play crush animations (after the model is fully loaded)
                if (container.pendingAnimation || 
                    modelName.includes('crush') || 
                    modelName === 'bottleC') {
                    // Give a small delay to ensure model is initialized properly
                    setTimeout(() => {
                        console.log(`Playing crush animations for ${containerKey} with ${container.animations.length} animations`);
                        if (container.animations.length > 0) {
                            playAllAnimations(containerKey);
                        }
                    }, 500);
                    
                    // Reset the pending flag
                    container.pendingAnimation = false;
                }
            } else {
                console.log(`Model ${modelName} has no animations`);
            }
            
            // Apply existing wireframe state if needed
            if (container.isWireframe) {
                applyWireframe(containerKey);
            }
            
            // Add to scene
            container.scene.add(container.model);
        },
        function(xhr) {
            // Progress indicator
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            console.log(`${containerKey} model: ${percent}% loaded`);
        },
        function(error) {
            // Error handling
            console.error(`Error loading model for ${containerKey}:`, error);
            
            // Remove loading indicator
            if (loadingDiv.parentNode) {
                loadingDiv.parentNode.removeChild(loadingDiv);
            }
            
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger m-3';
            errorDiv.textContent = 'Error loading model: ' + error.message;
            domElement.appendChild(errorDiv);
            
            // Reset pending animation flag
            container.pendingAnimation = false;
        }
    );
}

// Play all animations for a container
function playAllAnimations(containerKey) {
    const container = containers[containerKey];
    
    if (!container.mixer || !container.animations || container.animations.length === 0) {
        console.warn(`No animations available to play for ${containerKey}`);
        return;
    }
    
    console.log(`Playing ${container.animations.length} animations for ${containerKey}`);
    
    // Reset and play all animations
    container.animations.forEach((action, index) => {
        console.log(`Playing animation ${index} for ${containerKey}`);
        
        // Stop any running animations first
        action.stop();
        
        // Reset the animation to the beginning
        action.reset();
        
        // Set the animation to play once (not loop)
        action.setLoop(THREE.LoopOnce);
        
        // Make sure animation completes
        action.clampWhenFinished = true;
        
        // Set normal playback speed
        action.timeScale = 1;
        
        // Start the animation
        action.play();
    });
}

// Function to pause all animations
function pauseAllAnimations(containerKey) {
    const container = containers[containerKey];
    
    if (!container.mixer || !container.animations || container.animations.length === 0) return;
    
    container.animations.forEach(action => {
        action.paused = true;
    });
}

// Function to reset all animations
function resetAllAnimations(containerKey) {
    const container = containers[containerKey];
    
    if (!container.mixer || !container.animations || container.animations.length === 0) return;
    
    container.animations.forEach(action => {
        action.reset();
    });
}

// Toggle wireframe mode for a specific model
function toggleWireframe(containerKey) {
    const container = containers[containerKey];
    container.isWireframe = !container.isWireframe;
    
    if (container.model) {
        applyWireframe(containerKey);
    }
}

// Apply wireframe material to an object
function applyWireframe(containerKey) {
    const container = containers[containerKey];
    
    if (!container.model) return;
    
    // Check if this is one of the crush model types
    const isCrushModel = 
        (containerKey === 'plastic' && container.model.userData && container.model.userData.modelName === 'bottleC') ||
        (containerKey === 'glass' && container.model.userData && container.model.userData.modelName === 'glassbottle_crush');
    
    // Using an identical pattern to modelController.js
    container.model.traverse(function(child) {
        if (child.isMesh) {
            if (container.isWireframe) {
                // Store original material if not already stored
                if (!child.userData.originalMaterial) {
                    child.userData.originalMaterial = child.material;
                }
                
                // Create wireframe material
                const wireframe = new THREE.WireframeGeometry(child.geometry);
                const line = new THREE.LineSegments(wireframe);
                line.material.depthTest = false;
                line.material.opacity = 0.25;
                line.material.transparent = true;
                line.material.color = new THREE.Color(0x000088);
                
                // Add wireframe to child
                child.add(line);
                child.material.visible = false;
            } else {
                // Restore original material
                if (child.userData.originalMaterial) {
                    child.material = child.userData.originalMaterial;
                    child.material.visible = true;
                    
                    // Remove wireframe children (only those that are wireframes)
                    for (let i = child.children.length - 1; i >= 0; i--) {
                        const childObj = child.children[i];
                        if (childObj instanceof THREE.LineSegments && 
                            childObj.geometry instanceof THREE.WireframeGeometry) {
                            child.remove(childObj);
                        }
                    }
                }
            }
        }
    });
    
    // Special handling for crush models to ensure animation works in wireframe
    if (isCrushModel) {
        // Ensure the crush animation plays in wireframe mode
        setTimeout(() => {
            console.log(`Ensuring crush animation works in wireframe mode for ${containerKey}`);
            
            // Force restart animations for the crush models
            if (container.animations && container.animations.length > 0) {
                container.animations.forEach(action => {
                    // Reset animation
                    action.stop();
                    action.reset();
                    
                    // Configure animation
                    action.setLoop(THREE.LoopOnce);
                    action.clampWhenFinished = true;
                    action.timeScale = 1;
                    
                    // Play animation
                    action.play();
                });
            }
        }, 100);
    }
}

// Toggle rotation for a specific model
function toggleRotation(containerKey) {
    const container = containers[containerKey];
    container.isRotating = !container.isRotating;
}

// Toggle lights for all models
function toggleAllLights() {
    // Get the current light state from the first container
    const firstContainer = containers[Object.keys(containers)[0]];
    const currentLightState = firstContainer.ambientLight.intensity > 0.2;
    
    for (const key in containers) {
        const container = containers[key];
        
        if (currentLightState) {
            // Lights are on, turn them down
            container.ambientLight.intensity = 0.1;
            container.directionalLight.intensity = 0.2;
        } else {
            // Lights are down, turn them up
            container.ambientLight.intensity = 0.4;
            container.directionalLight.intensity = 0.8;
        }
    }
}

// Toggle wireframe for all models
function toggleAllWireframe() {
    for (const key in containers) {
        toggleWireframe(key);
    }
}

// Toggle rotation for all models
function toggleAllRotation() {
    for (const key in containers) {
        toggleRotation(key);
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Make functions accessible globally for HTML buttons
window.loadModelForContainer = loadModelForContainer;
window.loadBottleCrush = loadBottleCrush;
window.toggleWireframe = toggleWireframe;
window.toggleRotation = toggleRotation;
window.toggleAllWireframe = toggleAllWireframe;
window.toggleAllRotation = toggleAllRotation;
window.toggleAllLights = toggleAllLights;
window.playAllAnimations = playAllAnimations;
window.pauseAllAnimations = pauseAllAnimations;
window.resetAllAnimations = resetAllAnimations;