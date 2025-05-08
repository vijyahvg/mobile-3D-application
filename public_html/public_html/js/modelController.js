// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', function() {
    // Check if model container exists before initializing
    if (document.getElementById('modelContainer')) {
        init();
    } else {
        console.error("Model container not found in the DOM");
    }
});

// Global variables
let scene, camera, renderer, controls;
let currentModel, mixer, animations = [];
let isWireframe = false;
let isRotating = true;
let lightsOn = true;
let ambientLight, directionalLight;
let clock; // For animation timing
let currentModelName = ''; // Track current model name
let rotationSpeed = 0.005;
let modelScaleFactor = 5;

// Control panel HTML template - Compact version
const controlPanelHTML = `
<div class="model-controls-panel">
    <button class="btn btn-sm btn-black control-panel-toggle" id="toggleControlPanel" title="Toggle Control Panel">
        <i class="bi bi-gear-fill"></i>
    </button>
    <div class="control-panel-content" id="controlPanelContent">
        <div class="control-section">
            <div class="section-title">Display</div>
            <div class="control-row">
                <label class="small">Background</label>
                <input type="color" class="form-control form-control-sm control-color" id="bgColorPicker" value="#f0f0f0">
                <button class="btn btn-sm btn-outline-secondary btn-xs" id="resetBgColor">Reset</button>
            </div>
            <div class="control-row">
                <label class="small">Scale</label>
                <input type="range" class="form-range control-range" id="modelScale" min="0.5" max="10" step="0.5" value="5">
            </div>
        </div>
        
        <div class="control-section">
            <div class="section-title">Camera</div>
            <div class="control-row btn-group btn-group-sm w-100">
                <button class="btn btn-sm btn-outline-primary btn-xs" id="camPosFront">Front</button>
                <button class="btn btn-sm btn-outline-primary btn-xs" id="camPosBack">Back</button>
                <button class="btn btn-sm btn-outline-primary btn-xs" id="camPosTop">Top</button>
            </div>
            <div class="control-row btn-group btn-group-sm w-100 mt-1">
                <button class="btn btn-sm btn-outline-primary btn-xs" id="camPosBottom">Bottom</button>
                <button class="btn btn-sm btn-outline-primary btn-xs" id="camPosLeft">Left</button>
                <button class="btn btn-sm btn-outline-primary btn-xs" id="camPosRight">Right</button>
            </div>
        </div>
        
        <div class="control-section">
            <div class="section-title">Lighting</div>
            <div class="control-row">
                <label class="small">Ambient Light</label>
                <input type="range" class="form-range control-range" id="ambientIntensity" min="0" max="1" step="0.1" value="0.4">
            </div>
            <div class="control-row">
                <label class="small">Main Light</label>
                <input type="range" class="form-range control-range" id="directionalIntensity" min="0" max="1" step="0.1" value="0.8">
            </div>
        </div>
        
        <div class="control-section">
            <div class="section-title">Animation</div>
            <div class="control-row">
                <label class="small">Rotation Speed</label>
                <input type="range" class="form-range control-range" id="rotationSpeed" min="0" max="0.02" step="0.001" value="0.005">
            </div>
            <div class="control-row btn-group btn-group-sm w-100">
                <button class="btn btn-sm btn-outline-primary btn-xs" id="playAnimation">Play</button>
                <button class="btn btn-sm btn-outline-primary btn-xs" id="pauseAnimation">Pause</button>
                <button class="btn btn-sm btn-outline-primary btn-xs" id="resetAnimation">Reset</button>
            </div>
        </div>
        
        <div class="control-section">
            <div class="control-row">
                <button class="btn btn-sm btn-outline-success w-100" id="takeScreenshot">Capture Screenshot</button>
            </div>
        </div>
    </div>
</div>
`;

// Initialize the scene
function init() {
    // Create clock for animations
    clock = new THREE.Clock();
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Get the model container
    const modelContainer = document.getElementById('modelContainer');
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
        45, // Field of view
        modelContainer.offsetWidth / modelContainer.offsetHeight, // Aspect ratio
        0.1, // Near clipping plane
        1000 // Far clipping plane
    );
    camera.position.set(0, 0, 10);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
        modelContainer.offsetWidth,
        modelContainer.offsetHeight
    );
    renderer.shadowMap.enabled = true;
    
    // Add renderer to DOM
    modelContainer.innerHTML = ''; // Clear container
    modelContainer.appendChild(renderer.domElement);
    
    // Create controls - note we're using THREE.OrbitControls not just OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Add lights
    setupLights();
    
    // Make it responsive
    window.addEventListener('resize', onWindowResize);
    
    // Load the default model (soda can)
    loadModel('soda_can');
    
    // Setup event listeners for UI controls
    setupControlButtons();
    
    // Add the control panel
    addControlPanel();
    
    // Start animation loop
    animate();
}

// Setup UI control buttons with proper state handling
function setupControlButtons() {
    const toggleWireframeBtn = document.getElementById('toggleWireframe');
    if (toggleWireframeBtn) {
        toggleWireframeBtn.addEventListener('click', function() {
            toggleWireframe();
            this.classList.toggle('active');
        });
    }
    
    const toggleRotationBtn = document.getElementById('toggleRotation');
    if (toggleRotationBtn) {
        // Set initial state to active since rotation is on by default
        toggleRotationBtn.classList.add('active');
        toggleRotationBtn.addEventListener('click', function() {
            toggleRotation();
            this.classList.toggle('active');
        });
    }
    
    const toggleLightsBtn = document.getElementById('toggleLights');
    if (toggleLightsBtn) {
        // Set initial state to active since lights are on by default
        toggleLightsBtn.classList.add('active');
        toggleLightsBtn.addEventListener('click', function() {
            toggleLights();
            this.classList.toggle('active');
        });
    }
}

// Setup scene lighting
function setupLights() {
    // Ambient light
    ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Directional light
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update the animation mixer
    if (mixer) {
        mixer.update(clock.getDelta());
    }
    
    // Apply rotation if enabled
    if (isRotating && currentModel) {
        currentModel.rotation.y += rotationSpeed;
    }
    
    // Update orbital controls
    controls.update();
    
    // Render scene
    renderer.render(scene, camera);
}

// Handle window resizing
function onWindowResize() {
    const modelContainer = document.getElementById('modelContainer');
    if (!modelContainer) return;
    
    // Update camera aspect ratio
    camera.aspect = modelContainer.offsetWidth / modelContainer.offsetHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size
    renderer.setSize(modelContainer.offsetWidth, modelContainer.offsetHeight);
}

function playSoundForModel(modelName) {
    let soundFile = '';

    // Map modelName to corresponding sound effect
    if (modelName === 'soda_can_ringpull') {
        soundFile = 'can-open.mp3';
    } else if (modelName === 'cancrush_video') {
        soundFile = 'can-crush.mp3';
    } else if (modelName === 'bottleA_cap') {
        soundFile = 'bottle-open.mp3';
    } else if (modelName === 'bottleC') {
        soundFile = 'bottle-crush.mp3';
    } else if (modelName === 'glasscap_open' || modelName === 'glassbottle_open') {
        soundFile = 'glass-open.mp3';
    } else if (modelName === 'glassbottle_crush') {
        soundFile = 'glass-crush.mp3';
    }

    if (soundFile) {
        const audio = new Audio(`assets/sounds/${soundFile}`);
        audio.play();
    }
}

// Load 3D model
function loadModel(modelName) {
    // Skip if trying to load the same model again
    if (modelName === currentModelName && currentModel) {
        return;
    }
    
    currentModelName = modelName;
    
    const modelContainer = document.getElementById('modelContainer');
    if (!modelContainer) return;
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'action-spinner';
    loadingDiv.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary mb-2" role="status"></div>
            <p class="fw-bold text-dark">Loading model...</p>
        </div>
    `;
    modelContainer.appendChild(loadingDiv);
    
    // Update model selection buttons
    updateModelSelectionButtons(modelName);
    
    // Clear previous model
    if (currentModel) {
        scene.remove(currentModel);
    }
    
    // Reset animations array
    animations = [];
    mixer = null;
    
    // Update model title
    updateModelTitle(modelName);
    
    // Update product info
    updateProductInfo(modelName);
    
    // Get the path to the model
    const modelPath = `assets/models/${modelName}.glb`;
    
    // Log the path for debugging
    console.log(`Loading model from: ${modelPath}`);
    
    // Create a loader
    const loader = new THREE.GLTFLoader();
    
    // Load the model
    loader.load(
        modelPath,
        function(gltf) {
            // Remove loading indicator
            if (loadingDiv.parentNode) {
                loadingDiv.parentNode.removeChild(loadingDiv);
            }
            
            currentModel = gltf.scene;
            
            // Center and scale the model
            const box = new THREE.Box3().setFromObject(currentModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 5 / maxDim;
            
            currentModel.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
            currentModel.scale.set(scale, scale, scale);
            
            // Handle animations if available
            if (gltf.animations && gltf.animations.length) {
                console.log(`Model has ${gltf.animations.length} animations`);
                mixer = new THREE.AnimationMixer(currentModel);
                
                gltf.animations.forEach((clip, index) => {
                    console.log(`Animation ${index}: "${clip.name}", Duration: ${clip.duration.toFixed(2)}s`);
                    const action = mixer.clipAction(clip);
                    animations.push(action);
                });
                
                // Auto-play animations for certain models based on filename
                // This is a broader check to catch all variants of model names
                if (modelName.includes('open') || 
                    modelName.includes('cap') || 
                    modelName.includes('ringpull') || 
                    modelName.includes('crush') || 
                    modelName.includes('empty')) {
                    console.log("Auto-playing animations for action model: " + modelName);
                    
                    // For crush animations, add a small delay to ensure model is loaded properly
                    if (modelName.includes('crush') || modelName === 'bottleC') {
                        console.log("Special handling for crush animation");
                        setTimeout(() => {
                            playAllAnimations();
                            playSoundForModel(modelName);

                        }, 500);
                    } else {
                        playAllAnimations();
                        playSoundForModel(modelName);

                    }
                }
            } else {
                console.log("Model has no animations");
                mixer = null;
            }
            
            // Apply existing wireframe state if needed
            if (isWireframe) {
                applyWireframe(currentModel);
            }
            
            // Add to scene
            scene.add(currentModel);
            
            // Log success
            console.log(`Model ${modelName} loaded successfully`);
        },
        function(xhr) {
            // Progress indicator
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            console.log(`${percent}% loaded`);
        },
        function(error) {
            // Error handling
            console.error('Error loading model:', error);
            
            // Remove loading indicator
            if (loadingDiv.parentNode) {
                loadingDiv.parentNode.removeChild(loadingDiv);
            }
            
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger m-3';
            errorDiv.textContent = 'Error loading model: ' + error.message;
            modelContainer.appendChild(errorDiv);
        }
    );
}

// Special function for bottle crush
function loadBottleCrush() {
    // First load the model
    loadModel('bottleC');
    
    // Then manually trigger animation after a delay
    setTimeout(() => {
        console.log("Manually triggering bottleC crush animation");
        playAllAnimations();
        playSoundForModel('bottleC');

    }, 800); // 800ms delay to ensure model is fully loaded
}

// Play all animations
function playAllAnimations() {
    if (!mixer || animations.length === 0) {
        console.warn("No animations available to play");
        return;
    }
    
    console.log(`Playing ${animations.length} animations`);
    
    // Reset and play all animations
    animations.forEach((action, index) => {
        console.log(`Playing animation ${index}`);
        
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
function pauseAllAnimations() {
    if (!mixer || animations.length === 0) return;
    
    animations.forEach(action => {
        action.paused = true;
    });
}

// Function to reset all animations
function resetAllAnimations() {
    if (!mixer || animations.length === 0) return;
    
    animations.forEach(action => {
        action.reset();
    });
}

// Update the model selection buttons
function updateModelSelectionButtons(modelName) {
    const selectionButtons = document.querySelectorAll('#modelSelectionButtons .list-group-item');
    
    selectionButtons.forEach(button => {
        button.classList.remove('active');
        
        // Get the model name from the onclick attribute
        const buttonModelName = button.getAttribute('onclick').match(/'([^']+)'/)[1];
        
        // Determine the base model type
        const isCanButton = buttonModelName === 'soda_can';
        const isPlasticButton = buttonModelName === 'complete_bottle';
        const isGlassButton = buttonModelName === 'glassbottle';
        
        // Determine the current model type with broader matching
        const isCan = modelName.startsWith('soda_can') || 
                     modelName.includes('cancrush') || 
                     modelName.startsWith('cola_can');
                     
        const isPlastic = modelName.startsWith('complete_bottle') || 
                         modelName.startsWith('bottle') || 
                         modelName.includes('empty_bottle');
                         
        const isGlass = modelName.startsWith('glass') || 
                       modelName.includes('empty_glass');
        
        // Set active class based on model type
        if ((isCanButton && isCan) || 
            (isPlasticButton && isPlastic) || 
            (isGlassButton && isGlass)) {
            button.classList.add('active');
        }
    });
}

// Update model title in UI
function updateModelTitle(modelName) {
    const titleElement = document.getElementById('modelTitle');
    if (!titleElement) return;
    
    // Cola can variants
    if (modelName === 'soda_can') {
        titleElement.textContent = 'Cola Can';
    }
    else if (modelName === 'soda_can_ringpull') {
        titleElement.textContent = 'Cola Can (Opening)';
    }
    else if (modelName === 'cancrush_video') {
        titleElement.textContent = 'Cola Can (Crushing)';
    }
    // Plastic bottle variants
    else if (modelName === 'complete_bottle') {
        titleElement.textContent = 'Plastic Bottle';
    }
    else if (modelName === 'bottleA_cap') {
        titleElement.textContent = 'Plastic Bottle (Opening)';
    }
    else if (modelName === 'bottleA') {
        titleElement.textContent = 'Plastic Bottle (Opening)';
    }
    else if (modelName === 'empty_bottle') {
        titleElement.textContent = 'Plastic Bottle (Empty)';
    }
    else if (modelName === 'bottleC') {
        titleElement.textContent = 'Plastic Bottle (Crushing)';
    }
    // Glass bottle variants
    else if (modelName === 'glassbottle') {
        titleElement.textContent = 'Glass Bottle';
    }
    else if (modelName === 'glassbottle_open') {
        titleElement.textContent = 'Glass Bottle (Opening)';
    }
    else if (modelName === 'glasscap_open') {
        titleElement.textContent = 'Glass Bottle (Opening)';
    }
    else if (modelName === 'empty_glassbottle') {
        titleElement.textContent = 'Glass Bottle (Empty)';
    }
    else if (modelName === 'glassbottle_crush') {
        titleElement.textContent = 'Glass Bottle (Crushing)';
    }
    else {
        titleElement.textContent = 'Model Viewer';
    }
}

// Update product info in UI
function updateProductInfo(modelName) {
    console.log(`Updating product info for model: ${modelName}`);
    
    // Handle cola can variants with broader matching
    if (modelName.startsWith('soda_can') || 
        modelName.startsWith('cola_can') || 
        modelName.includes('cancrush')) {
        // Hide all info divs
        document.querySelectorAll('#productInfo > div').forEach(div => {
            div.style.display = 'none';
        });
        
        // Show cola can info
        const infoDiv = document.getElementById('cola_can_info');
        if (infoDiv) {
            infoDiv.style.display = 'block';
        } else {
            console.warn('Cola can info div not found');
        }
        
        // Hide all description divs
        document.querySelectorAll('#productDescription > div').forEach(div => {
            div.style.display = 'none';
        });
        
        // Show cola can description
        const descDiv = document.getElementById('cola_can_desc');
        if (descDiv) {
            descDiv.style.display = 'block';
        } else {
            console.warn('Cola can description div not found');
        }
        
        // Hide all animation control divs
        document.querySelectorAll('[id$="_animations"]').forEach(div => {
            div.style.display = 'none';
        });
        
        // Show cola can animation controls
        const animDiv = document.getElementById('cola_can_animations');
        if (animDiv) {
            animDiv.style.display = 'block';
        } else {
            console.warn('Cola can animations div not found');
        }
    }
    // Handle plastic bottle variants with broader matching
    else if (modelName.startsWith('plastic_bottle') || 
             modelName.startsWith('complete_bottle') || 
             modelName.startsWith('bottle') || 
             modelName.includes('empty_bottle')) {
        // Hide all info divs
        document.querySelectorAll('#productInfo > div').forEach(div => {
            div.style.display = 'none';
        });
        
        // Show plastic bottle info
        const infoDiv = document.getElementById('plastic_bottle_info');
        if (infoDiv) {
            infoDiv.style.display = 'block';
        } else {
            console.warn('Plastic bottle info div not found');
        }
        
        // Hide all description divs
        document.querySelectorAll('#productDescription > div').forEach(div => {
            div.style.display = 'none';
        });
        
        // Show plastic bottle description
        const descDiv = document.getElementById('plastic_bottle_desc');
        if (descDiv) {
            descDiv.style.display = 'block';
        } else {
            console.warn('Plastic bottle description div not found');
        }
        
        // Hide all animation control divs
        document.querySelectorAll('[id$="_animations"]').forEach(div => {
            div.style.display = 'none';
        });
        
        // Show plastic bottle animation controls
        const animDiv = document.getElementById('plastic_bottle_animations');
        if (animDiv) {
            animDiv.style.display = 'block';
        } else {
            console.warn('Plastic bottle animations div not found');
        }
    }
    // Handle glass bottle variants with broader matching
    else if (modelName.startsWith('glass') || 
             modelName.includes('glasscap') || 
             modelName.includes('empty_glass')) {
        // Hide all info divs
        document.querySelectorAll('#productInfo > div').forEach(div => {
            div.style.display = 'none';
        });
        
        // Show glass bottle info
        const infoDiv = document.getElementById('glass_bottle_info');
        if (infoDiv) {
            infoDiv.style.display = 'block';
        } else {
            console.warn('Glass bottle info div not found');
        }
        
        // Hide all description divs
        document.querySelectorAll('#productDescription > div').forEach(div => {
            div.style.display = 'none';
        });
        
        // Show glass bottle description
        const descDiv = document.getElementById('glass_bottle_desc');
        if (descDiv) {
            descDiv.style.display = 'block';
        } else {
            console.warn('Glass bottle description div not found');
        }
        
        // Hide all animation control divs
        document.querySelectorAll('[id$="_animations"]').forEach(div => {
            div.style.display = 'none';
        });
        
        // Show glass bottle animation controls
        const animDiv = document.getElementById('glass_bottle_animations');
        if (animDiv) {
            animDiv.style.display = 'block';
        } else {
            console.warn('Glass bottle animations div not found');
        }
    } else {
        console.warn(`Unknown model type: ${modelName}`);
    }
}

// Add a CSS style block to the head
function addControlPanelStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .model-controls-panel {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 100;
            font-size: 0.85rem;
        }
        
        .control-panel-toggle {
            position: absolute;
            top: 0;
            right: 0;
            z-index: 101;
            padding: 5px 8px;
            border-radius: 4px;
        }
        
        .control-panel-content {
            background-color: rgba(33, 37, 41, 0.9);
            color: white;
            border-radius: 4px;
            padding: 10px;
            width: 230px;
            max-width: 90%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            display: none; /* Initially hidden */
            margin-top: 35px;
        }
        
        .control-section {
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .control-section:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        
        .section-title {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 0.9rem;
        }
        
        .control-row {
            display: flex;
            align-items: center;
            margin-bottom: 3px;
        }
        
        .control-row label {
            flex: 0 0 80px;
            margin-bottom: 0;
        }
        
        .control-color {
            width: 30px;
            height: 25px;
            padding: 0;
            margin-right: 5px;
        }
        
        .control-range {
            flex: 1;
            margin: 0;
            padding: 0;
            height: 5px;
        }
        
        .btn-xs {
            padding: 2px 4px;
            font-size: 0.75rem;
        }
    `;
    document.head.appendChild(styleElement);
}

// Insert the control panel into the page
function addControlPanel() {
    const modelContainer = document.getElementById('modelContainer');
    if (!modelContainer) return;
    
    // Add the styles first
    addControlPanelStyles();
    
    // Create a container for the control panel
    const controlPanelContainer = document.createElement('div');
    controlPanelContainer.innerHTML = controlPanelHTML;
    
    // Add the control panel to the model container
    modelContainer.appendChild(controlPanelContainer);
    
    // Initialize the control panel functionality
    initControlPanel();
    
    // Set up the toggle button
    const toggleButton = document.getElementById('toggleControlPanel');
    const controlPanelContent = document.getElementById('controlPanelContent');
    
    if (toggleButton && controlPanelContent) {
        toggleButton.addEventListener('click', function() {
            const isVisible = controlPanelContent.style.display !== 'none';
            controlPanelContent.style.display = isVisible ? 'none' : 'block';
            toggleButton.innerHTML = isVisible ? 
                '<i class="bi bi-gear-fill"></i>' : 
                '<i class="bi bi-x-lg"></i>';
        });
    }
}

// Initialize control panel functionality
function initControlPanel() {
    // Background color controls
    const bgColorPicker = document.getElementById('bgColorPicker');
    if (bgColorPicker) {
        bgColorPicker.addEventListener('input', function() {
            scene.background = new THREE.Color(this.value);
        });
    }
    
    const resetBgColor = document.getElementById('resetBgColor');
    if (resetBgColor) {
        resetBgColor.addEventListener('click', function() {
            scene.background = new THREE.Color(0xf0f0f0);
            bgColorPicker.value = '#f0f0f0';
        });
    }
    
    // Camera position controls
    const camPosFront = document.getElementById('camPosFront');
    if (camPosFront) {
        camPosFront.addEventListener('click', function() {
            setCameraPosition(0, 0, 10);
        });
    }
    
    const camPosBack = document.getElementById('camPosBack');
    if (camPosBack) {
        camPosBack.addEventListener('click', function() {
            setCameraPosition(0, 0, -10);
        });
    }
    
    const camPosTop = document.getElementById('camPosTop');
    if (camPosTop) {
        camPosTop.addEventListener('click', function() {
            setCameraPosition(0, 10, 0);
        });
    }
    
    const camPosBottom = document.getElementById('camPosBottom');
    if (camPosBottom) {
        camPosBottom.addEventListener('click', function() {
            setCameraPosition(0, -10, 0);
        });
    }
    
    const camPosLeft = document.getElementById('camPosLeft');
    if (camPosLeft) {
        camPosLeft.addEventListener('click', function() {
            setCameraPosition(-10, 0, 0);
        });
    }
    
    const camPosRight = document.getElementById('camPosRight');
    if (camPosRight) {
        camPosRight.addEventListener('click', function() {
            setCameraPosition(10, 0, 0);
        });
    }
    
    // Lighting controls
    const ambientIntensity = document.getElementById('ambientIntensity');
    if (ambientIntensity) {
        ambientIntensity.addEventListener('input', function() {
            ambientLight.intensity = parseFloat(this.value);
        });
    }
    
    const directionalIntensity = document.getElementById('directionalIntensity');
    if (directionalIntensity) {
        directionalIntensity.addEventListener('input', function() {
            directionalLight.intensity = parseFloat(this.value);
        });
    }
    
    // Model settings
    const rotationSpeedSlider = document.getElementById('rotationSpeed');
    if (rotationSpeedSlider) {
        rotationSpeedSlider.addEventListener('input', function() {
            rotationSpeed = parseFloat(this.value);
        });
    }
    
    const modelScaleSlider = document.getElementById('modelScale');
    if (modelScaleSlider) {
        modelScaleSlider.addEventListener('input', function() {
            modelScaleFactor = parseFloat(this.value);
            if (currentModel) {
                scaleModel(currentModel, modelScaleFactor);
            }
        });
    }
    
    // Animation controls
    const playAnimation = document.getElementById('playAnimation');
    if (playAnimation) {
        playAnimation.addEventListener('click', function() {
            playAllAnimations();
        });
    }
    
    const pauseAnimation = document.getElementById('pauseAnimation');
    if (pauseAnimation) {
        pauseAnimation.addEventListener('click', function() {
            pauseAllAnimations();
        });
    }
    
    const resetAnimation = document.getElementById('resetAnimation');
    if (resetAnimation) {
        resetAnimation.addEventListener('click', function() {
            resetAllAnimations();
        });
    }
    
    // Screenshot functionality
    const takeScreenshot = document.getElementById('takeScreenshot');
    if (takeScreenshot) {
        takeScreenshot.addEventListener('click', function() {
            captureScreenshot();
        });
    }
}

// Helper function to set camera position
function setCameraPosition(x, y, z) {
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
}

// Helper function to scale model
function scaleModel(model, scaleFactor) {
    // Get the original scale before applying the new factor
    const originalScale = 5 / modelScaleFactor;
    
    // Apply the new scale
    model.scale.set(originalScale * scaleFactor, originalScale * scaleFactor, originalScale * scaleFactor);
}

// Function to capture screenshot
function captureScreenshot() {
    // Render the scene
    renderer.render(scene, camera);
    
    // Get the canvas data
    const dataURL = renderer.domElement.toDataURL('image/png');
    
    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `${currentModelName || 'model'}_screenshot.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Toggle wireframe mode
function toggleWireframe() {
    isWireframe = !isWireframe;
    
    if (currentModel) {
        applyWireframe(currentModel);
    }
}

// Apply wireframe material to an object
function applyWireframe(object) {
    object.traverse(function(child) {
        if (child.isMesh) {
            if (isWireframe) {
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
}

// Toggle model rotation
function toggleRotation() {
    isRotating = !isRotating;
}

// Toggle lights
function toggleLights() {
    lightsOn = !lightsOn;
    
    if (lightsOn) {
        ambientLight.intensity = 0.4;
        directionalLight.intensity = 0.8;
    } else {
        ambientLight.intensity = 0.1;
        directionalLight.intensity = 0.2;
    }
}

// Make functions accessible to HTML
window.loadModel = loadModel;
window.loadBottleCrush = loadBottleCrush;
window.playAllAnimations = playAllAnimations;
window.toggleWireframe = toggleWireframe;
window.toggleRotation = toggleRotation;
window.toggleLights = toggleLights;