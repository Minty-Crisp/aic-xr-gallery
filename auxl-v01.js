//
//Art Institute of Chicago XR Gallery v0.1
//
//Built w/ AUXL : A-Frame UX Library v0.1 Engine
//https://github.com/Minty-Crisp/AUXL
//
//Created by Minty-Crisp (mintycrisp.com)
//
//Warning: This website contains images that may contain nudity. Viewer discretion is advised. If you are not of legal age or do not wish to view such content, please navigate away from this website.
//
//Image|Art loader
//Add a AIC-User-Agent header with the name of your project and a contact email to your API requests
//curl 'https://api.artic.edu/api/v1/artworks/24645' \
//--header 'AIC-User-Agent: aic-bash (engineering@artic.edu)'

//
//A-Frame UX Library
AFRAME.registerSystem('auxl', {
//schema: {
	//bar: {type: 'number'},
	//style: {type: 'string', default: 'random'}
//},

init: function () {

//Establish a-frame objects
const sceneEl = document.querySelector('a-scene');
const head = document.querySelector('head');
let aThis = this;
this.expStarted = false;
//Menu
const stickyMenu = document.getElementById('stickyMenu');
const beginDiv = document.getElementById('beginDiv');
const startButton = document.getElementById('startButton');
const menuModeButton = document.getElementById('menuModeButton');
const audioButton = document.getElementById('audioButton');
const viewInfo = document.getElementById('viewInfo');
const expInfo = document.getElementById('expInfo');
const infoClose = document.getElementById('infoClose');
this.menuOpen = true;
this.infoOpen = false;
//Audio
this.audioEnabled = false;
//Controls
this.controls = 'Desktop';
this.vrHand = 'right';
this.mobilePermissionGranted = false;
let playerRig;
let camera;
let cameraUI;
let playerFloor;
let mouseController;
let vrController;
let vrControllerUI;

//Core, Layer & Aux currently spawned in scene.
this.spawned = {};
this.zoneSpawned = {};
this.nodeSpawned = {};
this.menuSpawned = {};
this.genSpawned = {};
this.npcSpawned = {};
this.carouselSpawned = {};

function clearSpawned(spawned){
	for(let spawn in spawned){
		//console.log(spawn);//name of ID
		//console.log(spawned[spawn]);//obj
		//console.log(aThis[spawn]);
		if(aThis[spawn]){
			if(aThis[spawn].type === 'core'){
				aThis[spawn].core.RemoveFromScene();
			} else if (aThis[spawn].type === 'layer'){
				aThis[spawn].layer.RemoveAllFromScene();
			} else if (spawned[spawn].type === 'gen'){
				aThis[spawn].DespawnAll();
			} else if (spawned[spawn].type === 'npc'){
				aThis[spawn].Despawn();
			}  else if (spawned[spawn].type === 'carousel'){
				aThis[spawn].Remove();
			} else {
				if(aThis[spawn].RemoveFromScene){
					aThis[spawn].RemoveFromScene();
				} else if(aThis[spawn].RemoveAllFromScene){
					aThis[spawn].RemoveAllFromScene();
				}
			}
		} else {
			if (spawned[spawn].type === 'menu'){
				spawned[spawn].obj.MenuRemove();
			} else {
				console.log('Despawn not compatible');
				console.log(spawn);
				console.log(spawned[spawn]);
				console.log(document.getElementById(spawn));
			}
		}
		//console.log(spawned[spawn]);//Book & Page spawned from
		delete spawned[spawn];
	}
}

this.running = {};
this.timeouts = {};
this.intervals = {};
this.interactions = {};
this.events = {};
//this.menus = {};
//this.npcs = {};
//this.carousels = {};

//
//Environmental Settings
this.timeInDay = 360000;

//
//HTML Menu
function toggleMenu(){
	if(aThis.menuOpen){
		//Close Menu
		beginDiv.style.display = 'none';
		aThis.menuOpen = false;
		if(aThis.infoOpen){
			toggleInfo();
		}
	} else {
		//Open Menu
		beginDiv.style.display = 'flex';
		aThis.menuOpen = true;
	}
}
stickyMenu.addEventListener('click', toggleMenu);

//
//Start Experience
function startExp(){
	if(aThis.expStarted){}else{
		let timeoutSpawn = setTimeout(function () {
			startButton.innerHTML = 'Resume'
			aThis.zone0.StartScene();
			updateControls();
			aThis.expStarted = true;
			dayNight();
			clearTimeout(timeoutSpawn);
		}, 425);
		playerSpawnAnim();
	}
	toggleMenu();
}
startButton.addEventListener('click', startExp);

//
//Controls
//VR
function disableVRControls(){
	//Disable VR Controls
	//vrController visible to true
	vrController.setAttribute('visible',false);
	//vrControllerUI visible to true
	vrControllerUI.setAttribute('visible',false);
	//vrController cursor property
	vrController.removeAttribute('cursor');
	//vrController raycaster property
	vrController.removeAttribute('raycaster');
	//vrController laser-controls property
	vrController.removeAttribute('laser-controls');
}
function enableVRControls(){
	//Enable VR Controls
	//vrController visible to true
	vrController.setAttribute('visible',true);
	//vrControllerUI visible to true
	vrControllerUI.setAttribute('visible',true);
	//vrController raycaster property
	vrController.setAttribute('raycaster',{enabled: 'true', autoRefresh: 'true', objects: '.clickable', far: 'Infinity', near: 0, interval: 0, lineColor: 'red', lineOpacity: 0.5, showLine: 'true', useWorldCoordinates: 'false'});
	//vrController cursor property
	vrController.setAttribute('cursor',{fuse: 'false', rayOrigin: 'vrController', mouseCursorStylesEnabled: 'true'});
	//vrController laser-controls property
	vrController.setAttribute('laser-controls',{hand: aThis.vrHand});
	//Update Controls
	aThis.controls = 'VR';
}
//Desktop
function disableDesktopControls(){
	//Disable Desktop Controls
	//Remove Desktop WASD Controls
	//playerRig.removeAttribute('wasd-controls');
	playerRig.removeAttribute('movement-controls');
	//Set mouseController to invisible
	mouseController.setAttribute('visible',false);
	//Set mouseController raycaster to false
	mouseController.removeAttribute('raycaster');
	//Remove cursor attribute
	mouseController.removeAttribute('cursor');
}
function enableDesktopControls(){
	//Enable Desktop Controls
	//Remove Desktop WASD Controls
	//playerRig.setAttribute('wasd-controls',{enabled: 'true', acceleration: 25});
	playerRig.setAttribute('movement-controls',{enabled: 'true', controls: 'keyboard', speed: 0.1, fly: false, constrainToNavMesh: false, camera: '#camera'});
	//Set mouseController to invisible
	mouseController.setAttribute('visible',true);
	//Set mouseController raycaster to false
	mouseController.setAttribute('raycaster',{enabled: 'true', autoRefresh: 'true', objects: '.clickable', far: 'Infinity', near: 0, interval: 0, lineColor: 'red', lineOpacity: 0.5, showLine: 'false', useWorldCoordinates: 'false'});
	//Remove cursor attribute
	mouseController.setAttribute('cursor',{fuse: 'false', rayOrigin: 'mouseController', mouseCursorStylesEnabled: 'true'});
	//Update Controls
	aThis.controls = 'Desktop';
}
//Mobile
function disableMobileControls(){
	sceneEl.setAttribute('device-orientation-permission-ui', {enabled: false});
	playerRig.removeAttribute('movement-controls');
	//Set mouseController to invisible
	mouseController.setAttribute('visible',false);
	//Set mouseController raycaster to false
	mouseController.removeAttribute('raycaster');
	//Remove cursor attribute
	mouseController.removeAttribute('cursor');
}
function enableMobileControls(){
//deviceorientationpermissiongranted
//deviceorientationpermissionrejected
//deviceorientationpermissionrequested
	sceneEl.setAttribute('device-orientation-permission-ui', {enabled: true});
	sceneEl.addEventListener('deviceorientationpermissiongranted', function(){
		aThis.mobilePermissionGranted = true;
	});
	sceneEl.addEventListener('deviceorientationpermissionrejected', function(){
		aThis.mobilePermissionGranted = false;
	});
	playerRig.setAttribute('movement-controls',{enabled: 'false', controls: 'touch', speed: 0.1, fly: false, constrainToNavMesh: false, camera: '#camera'});
	//Set mouseController to invisible
	mouseController.setAttribute('visible',true);
	//Set mouseController raycaster to false
	mouseController.setAttribute('raycaster',{enabled: 'true', autoRefresh: 'true', objects: '.clickable', far: 'Infinity', near: 0, interval: 0, lineColor: 'red', lineOpacity: 0.5, showLine: 'false', useWorldCoordinates: 'false'});
	//Remove cursor attribute
	mouseController.setAttribute('cursor',{fuse: 'false', rayOrigin: 'mouseController', mouseCursorStylesEnabled: 'true'});
	//Update Controls
	aThis.controls = 'Mobile';
}
//Update Controls
function updateControls(){
	if(aThis.controls === 'Desktop'){
		disableMobileControls();
		disableVRControls();
		enableDesktopControls();
	} else if(aThis.controls === 'Mobile'){
		disableVRControls();
		disableDesktopControls();
		enableMobileControls();
	} else if(aThis.controls === 'VR'){
		disableDesktopControls();
		disableMobileControls();
		enableVRControls();
	}
}
//Menu Button Controls
function changeControls(){
	if(aThis.controls === 'Desktop'){
		aThis.controls = 'VR';
		menuModeButton.innerHTML = 'Mode : VR';
		vrHandButton.style.display = 'flex';
	} else if(aThis.controls === 'VR'){
		vrHandButton.style.display = 'none';
		aThis.controls = 'Mobile';
		menuModeButton.innerHTML = 'Mode : Mobile';
	} else if(aThis.controls === 'Mobile'){
		aThis.controls = 'Desktop';
		menuModeButton.innerHTML = 'Mode : Desktop'
	}
	if(aThis.expStarted){
		updateControls();
	}
}
menuModeButton.addEventListener('click', changeControls);

function changeVRHand(){
	if(aThis.vrHand === 'right'){
		aThis.vrHand = 'left';
		vrHandButton.innerHTML = 'Hand : Left';
	} else {
		aThis.vrHand = 'right';
		vrHandButton.innerHTML = 'Hand : Right';
	}
	if(aThis.expStarted){
		updateControls();
	}
}
vrHandButton.addEventListener('click', changeVRHand);

//
//Audio
function toggleAudio(){
	if(aThis.audioEnabled){
		//Disable Audio
		aThis.audioEnabled = false;
		audioButton.innerHTML = 'Sound : Disabled';
	} else {
		//Enable Audio
		aThis.audioEnabled = true;
		audioButton.innerHTML = 'Sound : Enabled';
	}
}
audioButton.addEventListener('click', toggleAudio);

//
//Instructions
function toggleInfo(){
	if(aThis.infoOpen){
		//Close Info
		expInfo.style.display = 'none';
		aThis.infoOpen = false;
	} else {
		//Open Info
		expInfo.style.display = 'flex';
		aThis.infoOpen = true;
	}
}
viewInfo.addEventListener('click', toggleInfo);
infoClose.addEventListener('click', toggleInfo);

//
//Support

//Color Theory Hex Generator
//Color Theory Hex Generator
function colorsHexGen(color, family){

//Colors Generated :
//Base
//Complementary
//Split-complementary
//Triadic
//Tetradic
//Analagous
//Monochrome

let r;
let r0;
let g;
let g0;
let b;
let b0;
let base;
let baseRGB;
let familyCheck = false;
const colorFamily =['red','orange','yellow','lime','blue','cyan','magenta','maroon','olive','green','purple','teal','navy','silver','grey','black','white'];

//Support Functions
function HSLToRGB(h,s,l) {
	// Must be fractions of 1
	//s /= 100;
	//l /= 100;

	let c = (1 - Math.abs(2 * l - 1)) * s,
	  x = c * (1 - Math.abs((h / 60) % 2 - 1)),
	  m = l - c/2,
	  r = 0,
	  g = 0,
	  b = 0;

	if (0 <= h && h < 60) {
	r = c; g = x; b = 0;  
	} else if (60 <= h && h < 120) {
	r = x; g = c; b = 0;
	} else if (120 <= h && h < 180) {
	r = 0; g = c; b = x;
	} else if (180 <= h && h < 240) {
	r = 0; g = x; b = c;
	} else if (240 <= h && h < 300) {
	r = x; g = 0; b = c;
	} else if (300 <= h && h < 360) {
	r = c; g = 0; b = x;
	}
	r = Math.round((r + m) * 255);
	g = Math.round((g + m) * 255);
	b = Math.round((b + m) * 255);

	return {r,g,b};
}
function RGBToHex(r,g,b) {
	r = r.toString(16);
	g = g.toString(16);
	b = b.toString(16);

	if (r.length == 1)
	r = "0" + r;
	if (g.length == 1)
	g = "0" + g;
	if (b.length == 1)
	b = "0" + b;

	return "#" + r + g + b;
}
function hexToRGB(h) {
	let r = 0, g = 0, b = 0;

	// 3 digits
	if (h.length == 4) {
	r = "0x" + h[1] + h[1];
	g = "0x" + h[2] + h[2];
	b = "0x" + h[3] + h[3];

	// 6 digits
	} else if (h.length == 7) {
	r = "0x" + h[1] + h[2];
	g = "0x" + h[3] + h[4];
	b = "0x" + h[5] + h[6];
	}

	//return "rgb("+ +r + "," + +g + "," + +b + ")";
	return {r,g,b};
}
function randomColorFamily(){
	return colorFamily[Math.floor(Math.random()*(colorFamily.length-2))];
	//Ignore last 2 Black/White
}

//Check if color input is useable
if(color){
	if(color[0] === '#' && color.length === 4 || color[0] === '#' && color.length === 7){} else {
		color = false;
	}
}
//Check if family input is useable
if(family){
	for(let each in colorFamily){
		if(family === colorFamily[each]){
			familyCheck = true;
			break;
		}
	}
	if(familyCheck){} else {
		family = randomColorFamily();
	}
}

//Generate Color Values
if(color){
	//color is Hex
	base = color;
	baseRGB = hexToRGB(base);

	//convert Hex to RGB
	r = baseRGB.r;
	r0 = r/255;
	g = baseRGB.g;
	g0 = g/255;
	b = baseRGB.b;
	b0 = b/255;
} else {
	if(!family){
		family = randomColorFamily();
	}
	if(family === 'red'){
		r = Math.floor(Math.random()*55)+200;
		g = b = 0;
	} else if(family === 'orange'){
		r = Math.floor(Math.random()*105)+150;
		g = Math.floor(r*0.65);
		b = 0;
	} else if(family === 'yellow'){
		r = g = Math.floor(Math.random()*55)+200;
		b = 0;
	} else if(family === 'lime'){
		g = Math.floor(Math.random()*55)+200;
		r = b = 0;
	} else if(family === 'blue'){
		b = Math.floor(Math.random()*55)+200;
		r = g = 0;
	} else if(family === 'cyan'){
		g = b = Math.floor(Math.random()*55)+200;
		r = 0;
	} else if(family === 'magenta'){
		r = b = Math.floor(Math.random()*55)+200;
		g = 0;
	} else if(family === 'maroon'){
		r = Math.floor(Math.random()*28)+100;
		b = g = 0;
	} else if(family === 'olive'){
		r = g = Math.floor(Math.random()*28)+100;
		b = 0;
	} else if(family === 'green'){
		g = Math.floor(Math.random()*28)+100;
		r = b = 0;
	} else if(family === 'purple'){
		r = b = Math.floor(Math.random()*28)+100;
		g = 0;
	} else if(family === 'teal'){
		g = b = Math.floor(Math.random()*28)+100;
		r = 0;
	} else if(family === 'navy'){
		b = Math.floor(Math.random()*28)+100;
		r = g = 0;
	} else if(family === 'black'){
		r = g = b = Math.floor(Math.random()*42);
	} else if(family === 'white'){
		r = g = b = Math.floor(Math.random()*35)+220;
	} else if(family === 'silver'){
		r = g = b = Math.floor(Math.random()*42)+170;
	} else if(family === 'grey'){
		r = g = b = Math.floor(Math.random()*28)+100;
	}
	r0 = r/255;
	g0 = g/255;
	b0 = b/255;
	base = RGBToHex(r,g,b);
}

//Convert RGB to HSL for Color Theory support

//Luminosity
//Find max and min
let max = Math.max(r0, g0, b0);
let min = Math.min(r0, g0, b0);
let lum = (1 / 2) * (max + min);

//Hue
let hue;
if(max === r0){
	if(min === g0){
		//R > B > G
		hue = 60 * (6 * (b0-g0)/(r0-g0));
	} else {
		//R > G > B
		hue = 60 * ((g0-b0)/(r0-b0));
	}
} else if(max === g0){
	if(min === b0){
		//G > R > B
		hue = 60 * (2 - (r0-b0)/(g0-b0));
	} else {
		//G > B > R
		hue = 60 * (2 + (b0-r0)/(g0-r0));
	}
} else if(max === b0){
	if(min === r0){
		//B > G > R
		hue = 60 * (4 - (g0-r0)/(b0-r0));
	} else {
		//B > R > G
		hue = 60 * (4 + (r0-g0)/(b0-g0));
	}
}

//Saturation
let sat;
if(lum === 1){
sat = 0;
} else {
sat = ((max - min) / (1 - (lum*2 - 1)));
}

//Base HSL color... hue, sat, lum

//Complementary
let complRGB = HSLToRGB(Math.abs((hue + 180) - 360), sat, lum);
let compl = RGBToHex(complRGB.r, complRGB.g, complRGB.b);

//Split-complementary
let splitComplRGB = [
HSLToRGB(Math.abs((hue + 150) - 360), sat, lum),
HSLToRGB(Math.abs((hue + 210) - 360), sat, lum)
];
let splitCompl = [
RGBToHex(splitComplRGB[0].r, splitComplRGB[0].g, splitComplRGB[0].b),
RGBToHex(splitComplRGB[1].r, splitComplRGB[1].g, splitComplRGB[1].b)
];

//Triadic
let triadicRGB = [
HSLToRGB(Math.abs((hue + 120) - 360), sat, lum),
HSLToRGB(Math.abs((hue + 240) - 360), sat, lum)
];
let triadic = [
RGBToHex(triadicRGB[0].r, triadicRGB[0].g, triadicRGB[0].b),
RGBToHex(triadicRGB[1].r, triadicRGB[1].g, triadicRGB[1].b)
];

//Tetradic
let tetradicRGB = [
HSLToRGB(Math.abs((hue + 90) - 360), sat, lum),
HSLToRGB(Math.abs((hue + 180) - 360), sat, lum),
HSLToRGB(Math.abs((hue + 270) - 360), sat, lum)
];
let tetradic = [
RGBToHex(tetradicRGB[0].r, tetradicRGB[0].g, tetradicRGB[0].b),
RGBToHex(tetradicRGB[1].r, tetradicRGB[1].g, tetradicRGB[1].b),
RGBToHex(tetradicRGB[2].r, tetradicRGB[2].g, tetradicRGB[2].b)
];

//Analagous
let analagRGB = [
HSLToRGB(Math.abs((hue + 30) - 360), sat, lum),
HSLToRGB(Math.abs((hue + 60) - 360), sat, lum),
HSLToRGB(Math.abs((hue + 90) - 360), sat, lum)
];
let analag = [
RGBToHex(analagRGB[0].r, analagRGB[0].g, analagRGB[0].b),
RGBToHex(analagRGB[1].r, analagRGB[1].g, analagRGB[1].b),
RGBToHex(analagRGB[2].r, analagRGB[2].g, analagRGB[2].b)
];

//Monochrome (25-60% | 42%)
const spread = 0.42;
let light = RGBToHex(r*(1+spread),g*(1+spread),b*(1+spread));
let dark = RGBToHex(r*(1-spread),g*(1-spread),b*(1-spread));
//red_light = red_primary * (1 + scaling_factor)
//green_light = green_primary * (1 + scaling_factor)
//blue_light = blue_primary * (1 + scaling_factor)

//red_dark = red_primary * (1 - scaling_factor)
//green_dark = green_primary * (1 - scaling_factor)
//blue_dark = blue_primary * (1 - scaling_factor)

return {base, light, dark, compl, splitCompl, triadic, tetradic, analag};

}
let mainColor = colorsHexGen('#6ab0db');
/*
let newColor1 = colorsHexGen();
console.log(newColor1.base);
console.log(newColor1.compl);
console.log(newColor1.splitCompl[0]);
console.log(newColor1.splitCompl[1]);
console.log(newColor1.triadic[0]);
console.log(newColor1.triadic[1]);
console.log(newColor1.tetradic[0]);
console.log(newColor1.tetradic[1]);
console.log(newColor1.tetradic[2]);
console.log(newColor1.analag[0]);
console.log(newColor1.analag[1]);
console.log(newColor1.analag[2]);
//Color Families : red, orange, yellow, lime, blue, cyan, magenta, maroon, olive, green, purple, teal, navy, silver, gray, black, white
*/

//Entity Core
const Core = (data) => {

	//Import Data
	let core = JSON.parse(JSON.stringify(data));
	core.el = {};
	core.parent = false;
	let details = false;

	const Generate = () => {

		//Need additional gates if sources are needed to prevent spawning until script is fully downloaded.
		//
		//Check for external sources and append
		if(core.sources){
			//{['look-at']:'https://unpkg.com/aframe-look-at-component@1.0.0/dist/aframe-look-at-component.min.js',}
			//{threeGradShader: 'https://unpkg.com/@tlaukkan/aframe-three-color-gradient-shader@0.0.1/index.js',}
			//External JS Import
			//Multi-Property Values
			let propertyKeys = Object.keys(core.sources);
			let propertyValues = Object.values(core.sources);
			for (let propKey in propertyKeys) {
				//create new script element
				let newScript = document.createElement('script');
				//add src addtribute of componentValues[key]
				newScript.setAttribute('src', propertyValues[propKey]);
				console.log(propertyValues[propKey]);
				//append to Head
				head.appendChild(newScript);
			}//Component properties
		}

		core.el = {};

		if(core.entity === 'preAdded'){
			core.el = document.getElementById(core.id);
			//return core.el;
		} else if(core.entity){
			core.el = document.createElement(core.entity);
		} else {
			core.el = document.createElement('a-entity');
		}
		//console.log('generating...');
		//console.log(core);

		//Sound
		if(this.audioEnabled){
			if(core.sound){core.el.setAttribute('sound', core.sound)};
		}

		//Text
		if(core.text){core.el.setAttribute('text', core.text)};
		//console.log(JSON.stringify(data.id.id));

		//core.el.setAttribute('id', core.id.id);
		core.el.setAttribute('id', core.id);
		//core.el.classList.add(classes);
		//core.el.setAttribute(mixins);
		if(core.geometry){
			core.el.setAttribute('geometry', core.geometry);
		}
		if(core.material){
			core.el.setAttribute('material', core.material);
		}
		if(core.position){
			core.el.setAttribute('position', core.position);
		}
		if(core.rotation){
			core.el.setAttribute('rotation', core.rotation);
		}
		if(core.scale){
			core.el.setAttribute('scale', core.scale);
		}

		//core.el.setAttribute('animation__default', data.animations.default);

		//Add all classes
		for (let key in core.classes) {
			core.el.classList.add(core.classes[key]);
		}
		//There are a list of animations, loop through and set each as the object's keyName
		let animationKeys = Object.keys(core.animations);
		let animationValues = Object.values(core.animations);
		for (let key in animationKeys) {
			if(key === 0){} else {
				core.el.setAttribute('animation__'+animationKeys[key], animationValues[key]);
			}
		}

		//Check for Component Settings
		if(core.components){
		let componentKeys = Object.keys(core.components);
		let componentValues = Object.values(core.components);
		for (let key in componentKeys) {
			if(key === 0){} else {
				core.el.setAttribute(componentKeys[key],componentValues[key])
			}
		}
		}//Core Componenets

		//console.log(core.el);
		//console.log('Entity Generated');
		return core.el;
	}

	const AddToScene = (parent, layer, other) => {
		let needParent = parent || false;
		let fromLayer = layer || false;
		Generate();
		if(core.entity === 'preAdded'){} else {
			if(needParent){
				core.parent = needParent;
				needParent.appendChild(core.el);
				//Need a specific unspawn object form to add to this.spawned
			}else{
				sceneEl.appendChild(core.el);
			}
			if(fromLayer || other){} else {
				//console.log('Add to scene tracker')
				//console.log(core)
				AddToSceneTracker();
			}
		}
		//console.log(core)
	}

	const RemoveFromScene = (parent, layer, other) => {
		//loop through and remove all core.components which removes all event listeners before clearing from scene
		let componentKeys = Object.keys(core.components);
		for (let key in componentKeys) {
			if(key === 0){} else {
				GetEl().removeAttribute(componentKeys[key])
			}
		}
		let needParent = parent || false;
		let fromLayer = layer || false;
		if(needParent){
			//console.log(core.el)
			needParent.removeChild(core.el);
		}else{
			//console.log(core)
			//console.log(core.el)
			sceneEl.removeChild(core.el);
		}
		if(core.entity === 'preAdded'){} else {
			if(fromLayer || other){} else {
				RemoveFromSceneTracker();
			}
		}
	}

	const AddToSceneTracker = () => {
		//Scene Tracking of Assets
		if(aThis.zoneSpawned[core.id]){} else {
			aThis.nodeSpawned[core.id] = {type: 'core', obj: core};
		}
	}

	const RemoveFromSceneTracker = () => {
		//Clear Tracking of Asset
		delete aThis.nodeSpawned[core.id];
	}

	const ChangeSelf = ({property,value}) => {
		//console.log(property);
		//console.log(value);
		GetEl().setAttribute(property, value);
	}

	const ChangeSelfArray = (...setAlt) => {
		//console.log(setAlt);

		for(let a = 0; a < setAlt.length; a++){
			//console.log(setAlt[a].property);
			//console.log(setAlt[a].value);
			GetEl().setAttribute(setAlt[a].property, setAlt[a].value);
		}
	}

	const Animate = (animProps) => {
		//let el = document.getElementById(core.el.id);
		let name = 'animation__' + animProps.name || 'animation__customAnim';
		let property = animProps.property;
		let from = animProps.from || false;
		let to = animProps.to || false;
		let dur = animProps.dur || false;
		let delay = animProps.delay || false;
		let loop = animProps.loop || false;
		let dir = animProps.dir || false;
		let easing = animProps.easing || false;
		let elasticity = animProps.elasticity || false;
		let autoplay = animProps.autoplay || false;
		let enabled = animProps.enabled || false;
		let startEvents = animProps.startEvents || false;
		let pauseEvents = animProps.pauseEvents || false;
		let resumeEvents = animProps.resumeEvents || false;

		let anim = {
			property: 'object3D.rotation.y',
			to: 360,
			dur: 1000,
			delay: 0,
			loop: 'false',
			dir: 'normal',
			easing:'easeInOutSine',
			elasticity: 400,
			autoplay: 'true',
			enabled: 'true',
		};

		if(property){anim.property = property};
		if(from){anim.from = from};
		if(to){anim.to = to};
		if(dur){anim.dur = dur};
		if(delay){anim.delay = delay};
		if(loop){anim.loop = loop};
		if(dir){anim.dir = dir};
		if(easing){anim.easing = easing};
		if(elasticity){anim.elasticity = elasticity};
		if(autoplay){anim.autoplay = autoplay};
		if(enabled){anim.enabled = enabled};
		if(startEvents){anim.startEvents = startEvents};
		if(pauseEvents){anim.pauseEvents = pauseEvents};
		if(resumeEvents){anim.resumeEvents = resumeEvents};


		//console.log(name);
		//console.log(anim);
		//console.log(GetEl());
		GetEl().setAttribute(name, anim);
	}

	const GetEl = () => {
		//return core.id;
		let aEl = document.getElementById(core.id);
		return aEl;
	}

	const EmitEvent = (eventName) => {
		GetEl().emit(eventName,{})
		//console.log(GetEl());
		//console.log(eventName);
	}

	const SetFlag = ({flag, value}) => {
		core[flag] = value;
		//console.log(flag);
		//console.log(core[flag]);
	}

	const GetFlag = (varName) => {
		//console.log(varName)
		//console.log(core[varName])
		return core[varName];
	}

	const ClickRun = (el) => {
		//console.log('Click');
		//console.log(el);
	}

	const FuseClickRun = (el) => {
		//console.log('Fuse Click');
		//console.log(el);
	}

	const CursorDownRun = (el) => {
		//console.log('Cursor Down');
		//console.log(el);
	}

	const CursorEnterRun = (el) => {
		//console.log('Cursor Enter');
		//console.log(el);
	}

	const CursorLeaveRun = (el) => {
		//console.log('Cursor Leave');
		//console.log(el);
	}

	const CursorUpRun = (el) => {
		//console.log('Cursor Up');
		//console.log(el);
	}

	const prepDetails = (text) => {
		core.isOpen = false;
		//Main Screen
		core.detailMain = Core(aThis.detailMainData);
		//Update Position
		//core.detailMain.core.position.x = core.position.x + 0.1;
		//core.detailMain.core.position.y = core.position.y + 0.75;
		//core.detailMain.core.position.z = core.position.z + 0.25;
		core.detailMain.core.position.x = 0;
		core.detailMain.core.position.y = 1.5;
		core.detailMain.core.position.z = -2;
		//Import Display Text from Core or a detailObject
		if(text){
		core.detailMain.core.text.value = text;
		} else {
		core.detailMain.core.text.value = core.data;
		}
		//Close Button
		core.detailClose = Core(aThis.detailCloseData);
		//Detail Layer
		core.detailLayer = {
		parent: {core: core.detailMain}, 
		child0: {core: core.detailClose},
		}
		core.detailAll = Layer('detailAll',core.detailLayer);
		details = true;
	}

	function detailPrompt_open(){
	let elGenDelay = setTimeout(function () {
		core.detailMain.core.el.emit('open',{});
		core.detailClose.core.el.emit('open',{});
		core.isOpen = true;
		clearTimeout(elGenDelay);
	}, 25); //Delay
	}

	function detailPrompt_close(){
		core.detailMain.core.el.emit('close',{});
		core.detailClose.core.el.emit('close',{});
		let elDelDelay = setTimeout(function () {
			core.detailAll.RemoveAllFromScene();
			core.isOpen = false;
			clearTimeout(elDelDelay);
		}, 550); //Delay
	}

	function openClose(){
		//console.log('Running openClose');
		if(core.isOpen){
			//console.log('Is Open');
			core.isOpen = detailPrompt_close();
			core.detailClose.core.el.removeEventListener('click',{});
		} else {
			//console.log('Is Closed');
			core.detailAll.AddAllToScene();
			core.isOpen = detailPrompt_open();
			core.detailClose.core.el.addEventListener('click', function(){
				core.isOpen = detailPrompt_close();
				core.detailClose.core.el.removeEventListener('click',{});
			});
		}
	}

	const EnableDetail = (text) => {
		//When core is added to scene...
		if(text){
			prepDetails(text);
		} else if(details){} else {
			prepDetails();
		}
		//Add Event Listener
		GetEl().addEventListener('click', openClose);
	}

	const DisableDetail = () => {
		//When core is removed from the scene...
		//Remove Event Listener
		GetEl().removeEventListener('click', openClose);
	}

	return {core, Generate, AddToScene, RemoveFromScene, ChangeSelf, ChangeSelfArray, Animate, GetEl, EmitEvent, SetFlag, GetFlag, ClickRun, FuseClickRun, CursorDownRun, CursorEnterRun, CursorLeaveRun, CursorUpRun, EnableDetail, DisableDetail};
}

//
//layered Core
const Layer = (id, all) => {

	let layer = {id, all};
	layer.children = {};
	layer.secondParents = [];
	layer.thirdParents = [];

	const AddAllToScene = (other) => {
		for(let each in all){
			if(each === 'parent'){
				all[each].core.AddToScene(false, true);
			} else {
				for(let a in all[each]){
					if(a === 'core'){
						layer.children[all[each].core.core.id] = {obj: all[each][a], parent: all.parent.core.core.el};
						//console.log(layer.children)
						all[each][a].AddToScene(all.parent.core.core.el, true);
					} else {
						if(a === 'parent'){
							layer.children[all[each][a].core.core.id] = {obj: all[each][a].core, parent: all.parent.core.core.el};
							layer.secondParents.push(all[each][a].core);
							//console.log(layer.children)
							all[each][a].core.AddToScene(all.parent.core.core.el, true);
						} else {
							for(let b in all[each][a]){
								if(b === 'core'){
									layer.children[all[each][a].core.core.id] = {obj: all[each][a][b], parent: all[each].parent.core.core.el};
									//console.log(layer.children)
									all[each][a][b].AddToScene(all[each].parent.core.core.el, true);
								} else {
									if(b === 'parent'){
										layer.children[all[each][a][b].core.core.id] = {obj: all[each][a][b].core, parent: all[each].parent.core.core.el};
										layer.thirdParents.push(all[each][a][b].core);
										//console.log(layer.children)
										all[each][a][b].core.AddToScene(all[each].parent.core.core.el, true);
									} else {
										for(let c in all[each][a][b]){
											if(c === 'parent'){
												console.log('Add support for more layers')
											} else {
												layer.children[all[each][a][b].core.core.id] = {obj: all[each][a][b][c], parent: all[each][a].parent.core.core.el};
												//console.log(layer.children)
												all[each][a][b][c].AddToScene(all[each][a].parent.core.core.el, true);
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
		if(other){} else {
			AddToSceneTracker();
		}
	}

	function layerOrder(object) {
	let result = [[], [], [], []];
	function traverse(object, depth) {
		for (let key in object) {
			if (object.hasOwnProperty(key)) {
				if (key === 'core') {
					//console.log('Hit core');
					//console.log(object[key]);
					//console.log(result);
					result[depth].push(object[key]);
				} else if (key === "parent" && object[key].hasOwnProperty('core')) {
					//console.log('Hit a Parent');
					//console.log(object[key]);
					//console.log(result);
					result[depth].push(object[key].core);
				} else if (typeof object[key] === 'object') {
					//console.log('Hit End');
					//console.log(object[key]);
					//console.log(result);
					traverse(object[key], depth + 1);
				}
			}
		}
	}

	traverse(object, 0);
	return result;
	}
	let accessOrder = layerOrder(layer.all);

	const RemoveAllFromScene = (other) => {
		let removeOrder = layerOrder(layer.all).reverse();

		for(let layer of removeOrder){
			//console.log(layer);
			for(let each of layer){
				//console.log(each);
				if(each.core.parent){
					each.RemoveFromScene(each.core.parent);
				} else {
					each.RemoveFromScene();
				}
			}
		}
		RemoveFromSceneTracker();
	}

	const AddToSceneTracker = () => {
		if(aThis.zoneSpawned[layer.id]){} else {
    		aThis.nodeSpawned[layer.id] = {type: 'layer', obj: layer};
		}
    	//aThis.zoneSpawned[layer.id] = {type: 'layer', obj: this};
	}

	const RemoveFromSceneTracker = () => {
		delete aThis.nodeSpawned[layer.id];
		//delete aThis.zoneSpawned[layer.id];
	}

	const GetParentEl = () => {
		return layer.all.parent.core.GetEl();
	}

	const EmitEventParent = (eventName) => {
		all.parent.core.EmitEvent(eventName);
	}

	const ChangeParent = (property, value) => {
		all.parent.core.ChangeSelf(property, value);
	}

	const ChangeAll = (property, value) => {
		for(let section of accessOrder){
			//console.log(section);
			for(let each of section){
				//console.log(each);
				each.ChangeSelf(property, value);
			}
		}
	}

	const AnimateParent = (animProps) => {
		all.parent.core.Animate(animProps);
	}

	const AnimateAll = (animProps) => {
		for(let section of accessOrder){
			//console.log(section);
			for(let each of section){
				//console.log(each);
				each.Animate(animProps);
			}
		}
	}

	const GetChild = (child) => {

		//return specific child to access their indv change/animate/remove funcs

	}

	return {layer, AddAllToScene, RemoveAllFromScene, GetParentEl, EmitEventParent, ChangeParent, ChangeAll, AnimateParent, AnimateAll, GetChild};
}

//
//Player
const Player = (layer) => {

	layer.transition = 'fade';
	//instant
	//fade
	//sphere
	//blink

	//Controlled by swap-controls component
	//layer.controls = 'desktop';

	//Initialize Player
	layer.AddAllToScene(true);
	//document.getElementById('camera').setAttribute('camera', 'active', true);

	//Update Control Variables
	playerRig = document.getElementById('playerRig');
	camera = document.getElementById('camera');
	cameraUI = document.getElementById('cameraUI');
	playerFloor = document.getElementById('playerFloor');
	mouseController = document.getElementById('mouseController');
	vrController = document.getElementById('vrController');
	vrControllerUI = document.getElementById('vrControllerUI');

	const SetFlag = ({flag, value}) => {
		layer[flag] = value;
		//console.log(flag);
		//console.log(core[flag]);
	}

	const GetFlag = (varName) => {
		//console.log(varName)
		//console.log(core[varName])
		return layer[varName];
	}

	const TempDisableClick = () => {
	//Need to check which controls are currently enabled
	//mouseController
	//vrController
		let disableTimeout;
		if(layer.controls === 'desktop'){
			aThis.mouseController.ChangeSelf({property: 'raycaster',value: {enabled: 'true', autoRefresh: 'true', objects: '.disabled', far: 'Infinity', near: 0, interval: 0, lineColor: 'red', lineOpacity: 0.5, showLine: 'false', useWorldCoordinates: 'false'}});
			//Timeout
			disableTimeout = setTimeout(function () {
				aThis.mouseController.ChangeSelf({property: 'raycaster',value: {enabled: 'true', autoRefresh: 'true', objects: '.clickable', far: 'Infinity', near: 0, interval: 0, lineColor: 'red', lineOpacity: 0.5, showLine: 'false', useWorldCoordinates: 'false'}});
				clearTimeout(disableTimeout);
			}, 1000);
		} else if(layer.controls === 'vr'){
			aThis.vrController.ChangeSelf({property: 'raycaster', value: {enabled: 'true', autoRefresh: 'true', objects: '.disabled', far: 'Infinity', near: 0, interval: 0, lineColor: 'red', lineOpacity: 0.5, showLine: 'true', useWorldCoordinates: 'false'}});
			//Timeout
			disableTimeout = setTimeout(function () {
				aThis.vrController.ChangeSelf({property: 'raycaster', value: {enabled: 'true', autoRefresh: 'true', objects: '.clickable', far: 'Infinity', near: 0, interval: 0, lineColor: 'red', lineOpacity: 0.5, showLine: 'true', useWorldCoordinates: 'false'}});
				clearTimeout(disableTimeout);
			}, 1000);
		}


	//vrController raycaster property

	}

	return {layer, SetFlag, GetFlag, TempDisableClick}
}
//Spawn Function
function playerSpawnAnim(){
	if(aThis.player.layer.transition === 'blink'){
		aThis.player.TempDisableClick();
		aThis.blink1Screen.ChangeSelf({property: 'visible', value: 'true'});
		aThis.blink2Screen.ChangeSelf({property: 'visible', value: 'true'});
		aThis.blink1Screen.EmitEvent('blink');
		aThis.blink2Screen.EmitEvent('blink');
		timeout2 = setTimeout(function () {
			aThis.blink1Screen.ChangeSelf({property: 'visible', value: 'false'});
			aThis.blink2Screen.ChangeSelf({property: 'visible', value: 'false'});
			clearTimeout(timeout2);
		}, 1200);
	} else if (aThis.player.layer.transition === 'fade'){
		aThis.player.TempDisableClick();
		aThis.fadeScreen.ChangeSelf({property: 'visible', value: 'true'});
		aThis.fadeScreen.EmitEvent('fade');
		timeout2 = setTimeout(function () {
			aThis.fadeScreen.ChangeSelf({property: 'visible', value: 'false'});
			clearTimeout(timeout2);
		}, 1200);
	} else if (aThis.player.layer.transition === 'sphere'){
		aThis.player.TempDisableClick();
		aThis.sphereScreen.ChangeSelf({property: 'visible', value: 'true'});
		aThis.sphereScreen.EmitEvent('sphere');
		timeout2 = setTimeout(function () {
			aThis.sphereScreen.ChangeSelf({property: 'visible', value: 'false'});
			clearTimeout(timeout2);
		}, 1200);
	} else if (aThis.player.layer.transition === 'instant'){}
}
//
//Menu
const Menu = (menuData) => {

let menu = {};
//Import
menu.id = menuData.id || 'menu';
menu.prompt = menuData.prompt;
menu.options = menuData.options;
menu.actions = menuData.actions;
menu.data = Object.assign({}, menuData.data);
//Component settings to hit like This.ClickFuncName.Click()
menu.clickrun = {};
menu.clickrun.cursorObj = menuData.cursorObj || '';
menu.clickrun.method = menuData.method || 'Click';
menu.clickrun.params = menuData.params || 'null';
//Update Starting Position
menu.data.position.x = menuData.pos.x;
menu.data.position.y = menuData.pos.y;
menu.data.position.z = menuData.pos.z;
//Menu Options Total
let menuLength = Object.keys(menu.options).length;

//Menu Style
//Flat side with Text : Triangle, Square, Rectangle, Hex|Deca|Iso, Circle
//combo together for more flair/style or make a custom obj

//Menu Support
menu.layers = {};
menu.layer = {};
let prompt = {};
let menuOption = {};
let menuOptions = [];
let menuNum = 0;
//Testing
//console.log(menuData.id);
//console.log(menuData.clickObj);
//console.log(menu.clickObj);
	const MenuGen = () => {
		menuNum=0;
		menuOptions = [];
		menuOption = {};
		menu.data.id = menu.id + 'prompt';
		menu.data.text.value = menu.prompt;
		menu.data.material.color, menu.data.material.emissive = colorsHexGen().base;
		prompt = Core(menu.data);
		menu.layers = {
		parent: {core: prompt},}
		//Sub Menu Adjustments
		menu.data.position.x = menu.data.geometry.width * 1.15;
		menu.data.position.z = 0;
		if(menuLength === 1){
			menu.data.position.y = 0;
		} else {
			menu.data.position.y = (menu.data.geometry.height*0.75) * menuLength/2;
		}
		//components: {clickfunc: {clickObj: 'auxlObj'}},
		//components: {clickrun: {cursorObj: 'auxlObj', method: 'Method', params: null}},
		menu.data.components = {};
		menu.data.components.clickrun = {};
		menu.data.components.clickrun.cursorObj = menu.clickrun.cursorObj ;
		menu.data.components.clickrun.method = menu.clickrun.method;
		menu.data.components.clickrun.params = menu.clickrun.params;
		//generate 1 for each responses use option
		for(let menuItem in menu.options){
			if(menuLength === 1 || menuNum === 0){} else {
				menu.data.position.y -= (menu.data.geometry.height*1.15);
			}
			//menu.data.position.y -= 0.2;
			menu.data.material.color, menu.data.material.emissive = colorsHexGen().base;
			menu.data.text.value = menu.options[menuItem];
			menu.data.id = menu.id + 'option' + menuNum;
			menu.data.components.result = menu.actions['action'+menuNum];
			menuOption = Core(menu.data);
			//menuOption.AddToScene();
			menuOptions.push(menuOption);
			menu.layers['child'+menuNum] = {core: menuOptions[menuNum]}
			menuNum++;
		}
		//AddToSceneTracker();

		//Build layered Menu
		menu.layer = Layer(menu.id, menu.layers);
		menu.layer.AddAllToScene(true);
		//menu.layer.ChangeParent({property: 'look-at', value: '#camera'})
	}//MenuGen

	const MenuRemove = () => {
		menu.layer.RemoveAllFromScene(true);
		RemoveFromMenuSceneTracker();
	}

	const ToggleOptionClicking = () => {
		for(let options in menuOptions){
			menuOptions[options].GetEl().classList.toggle('clickable');
			//element.classList.toggle('clickable', false);
		}
	}

	const AddToMenuSceneTracker = (obj) => {
    	aThis.menuSpawned[menu.id] = {type: 'menu', obj};
	}

	const RemoveFromMenuSceneTracker = () => {
		delete aThis.menuSpawned[menu.id];
	}

	return {menu, MenuGen, MenuRemove, ToggleOptionClicking, AddToMenuSceneTracker, RemoveFromMenuSceneTracker};
}

//
//Scene Node ObjGen
//scenePlaceTownBuildingCastleLabrynthLevelAreaOfInterest
const SceneNode = (sceneData) => {
//Configure and Display Scene
let core = Object.assign({}, sceneData);

let textBubble= Core(this.sceneTextData);
let sceneText = SpeechSystem(textBubble);

	const IfElse = (objRef, {cond, ifTrue, ifFalse}) => {
//npcBook1:{IfElse: {cond: 'bookFlag1', ifTrue: {testBook1: 	{AddToScene: null},}, ifFalse: {testBook2: {AddToScene: null},},}},
		//ifTrue
		//ifFalse
		//for loop for above objects with key name as object and value key as method and that value the params
		//console.log(objRef)//this.obj name
		//console.log(cond)//cond name
		//console.log(ifTrue)
		//console.log(ifFalse)
		//console.log(aThis[objRef].GetFlag(cond))
		if(aThis[objRef].GetFlag(cond) === 'true') {
			//run ifTrue
			for(let a in ifTrue){
				//console.log(ifTrue);
				//console.log(a);
				//console.log(ifTrue[a]);
				for(let b in ifTrue[a]){
					AThisObjMethod(a,b,ifTrue[a][b]);
				}
			}
		} else if (aThis[objRef].GetFlag(cond) === 'false' || !aThis[objRef].GetFlag(cond)) {
			//run ifFalse
			for(let a in ifFalse){
				//console.log(ifFalse);
				//console.log(a);//this.object name should match objRef
				//console.log(ifFalse[a]);//method w/ params
				for(let b in ifFalse[a]){
					AThisObjMethod(a,b,ifFalse[a][b]);
				}
			}
		}

	}

	const SetFlag = (objRef, flagInfo) => {
		//access variables
		let flag = '';
		let value = '';
		let params = {};
		for(let a in flagInfo){
			//console.log(b);//flag, value
			if(a === 'flag'){
				flag = flagInfo[a];
			} else if (a === 'value'){
				value = flagInfo[a];
			}
		}
		params = {flag, value};
		//set this.obj.flag = value;
		//console.log(flag);
		//console.log(value);
		//console.log(params);
		//aThis[line][flag] = value;
		AThisObjMethod(objRef,'SetFlag',params);
	}

	const AddToTimeIntEvtTracker = ({name,type,method,params,event}) => {
		if(type === 'timeout'){
			aThis.running[name] = {type, name};
		} else if (type === 'interval'){
			aThis.running[name] = {type, name};
		} else if (type === 'interaction' || type === 'event'){
			aThis.running[name] = {type, name, method, params, event};
		}
	}

	const RemoveFromTimeIntEvtTracker = (name) => {
		delete aThis.running[name];
	}

	const ClearSceneTimeIntEvt = () => {
		//console.log(aThis.running)
		for(let ran in aThis.running){
		//console.log(ran);//name of ID
		//console.log(aThis.running[ran]);//object
			if(aThis.running[ran].type === 'timeout'){
					//console.log('clearing timeout');
					//console.log(aThis.running[ran].name);
					//console.log(aThis.timeouts[aThis.running[ran].name]);
					//clearTimeout(aThis.running[ran].name);
					clearTimeout(aThis.timeouts[aThis.running[ran].name]);
					//console.log(aThis.running)
			} else if (aThis.running[ran].type === 'interval'){
					//console.log('clearing interval');
					clearInterval(aThis.intervals[aThis.running[ran].name]);
			} else if (aThis.running[ran].type === 'interaction' || aThis.running[ran].type === 'event'){
				//Event
				//console.log('Need to remove an interaction.')
aThis[aThis.running[ran].name].GetEl().removeEventListener(aThis.running[ran].event, function(){
AThisObjMethod(aThis.running[ran].object,aThis.running[ran].method,aThis.running[ran].params);
});
			}
			RemoveFromTimeIntEvtTracker(ran);
		}

	}

	const ClearScene = () => {
		//Clear Core | Layer Scene Tracked Items
		//Run Exit section of current Node
		Exit();

		//console.log('Clearing Scene...')
		//console.log(aThis.nodeSpawned);
		//Clear Timeout, Intervals and Event Listeners first
		ClearSceneTimeIntEvt();
		clearSpawned(aThis.nodeSpawned);

		//What if these were added in Zone?
		clearSpawned(aThis.genSpawned);
		clearSpawned(aThis.menuSpawned);
		clearSpawned(aThis.npcSpawned);
		clearSpawned(aThis.carouselSpawned);
		/*
		for(let spawn in aThis.nodeSpawned){
			//console.log(spawn);//name of ID
			//console.log(aThis[spawn]);

			if(aThis[spawn]){
				if(aThis[spawn].type === 'core'){
						aThis[spawn].core.RemoveFromScene();
				} else if (aThis[spawn].type === 'layer'){
						aThis[spawn].layer.RemoveAllFromScene();
				} else {
					if(aThis[spawn].RemoveFromScene){
						aThis[spawn].RemoveFromScene();
					} else if(aThis[spawn].RemoveAllFromScene){
						aThis[spawn].RemoveAllFromScene();
					}
				}
			} else if(document.getElementById(spawn)){
				//console.log(spawn);
				//console.log(document.getElementById(spawn));
			}

			//console.log(aThis.nodeSpawned[spawn]);//Book & Page spawned from
			delete aThis.nodeSpawned[spawn];
		}*/
		//Clear Timeout, Intervals and Event Listeners as well
		//ClearSceneTimeIntEvt();
	}

	const AThisObjMethod = (object, func, params) => {
		//console.log(object);
		//console.log(func);
		//console.log(params);
		//console.log(aThis[object]);
		aThis[object][func](params);
	}

	function readTimeline(time){
	//find a specific timeline/key name and load up that
	//core : page/data/object
	//time : name of section within a core's pageData
	//line : a single line set of instructions within time
	//
	for(let line in core[time]){
		if(time === 'delay'){
			//console.log('Delay Running...');
			for(let a in core[time][line]){
				//console.log(time);//delay
				//console.log(line);//time of delay
				//console.log(core[time][line]);//this.object w/ method and params
				//console.log(a);//this.object name
				//console.log(core[time][line][a]);//func w/ params
				for(let b in core[time][line][a]){
					//console.log(b);//func name
					//console.log(core[time][line][a][b]);//params
					if(b === 'IfElse'){
						AddToTimeIntEvtTracker({name: line, type: 'timeout'});
						aThis.timeouts[line] = setTimeout(function () {
							//console.log('IfElse Timeout Hit')
							IfElse(a,core[time][line][a][b]);
							clearTimeout(aThis.timeouts[line]);
						}, line); //Delay
					} else if(b === 'SetFlag'){
						AddToTimeIntEvtTracker({name: line, type: 'timeout'});
						aThis.timeouts[line] = setTimeout(function () {
							//console.log('SetFlag Timeout Hit')
							SetFlag(a,core[time][line][a][b]);
							clearTimeout(aThis.timeouts[line]);
						}, line); //Delay


					} else {
						AddToTimeIntEvtTracker({name: line, type: 'timeout'});
						aThis.timeouts[line] = setTimeout(function () {
							//console.log('Timeout Hit')
							AThisObjMethod(a,b,core[time][line][a][b]);
							clearTimeout(aThis.timeouts[line]);
						}, line); //Delay
					}
				}
			}
		} else if(time === 'interval'){
			//5000: {run: {
			//hamComp:{SetFlag:{flag: 'testVar', value: 'false'},},}, 
			//loop: 'infinite',
			//end: 'TestVar'},
			//console.log('Interval Running...');
			for(let a in core[time][line]){
				//console.log(time);//interval
				//console.log(line);//time of interval
				//console.log(core[time][line]);//this.object w/ method and params
				//console.log(a);//run,loop,end
				//console.log(core[time][line][a]);//this.object name, func w/ params or params
				let ranTotal = 0;
				let loopTotal = core[time][line]['loop'];
				let endCond;
				if(core[time][line]['end']){
					endCond = core[time][line]['end'];
				}
				if(a === 'run'){
					for(let b in core[time][line][a]){
						for(let c in core[time][line][a][b]){
							//console.log(b);//this.obj name
							//console.log(core[time][line][a][b]);//method w/ params
							//console.log(c);//method
							//console.log(core[time][line][a][b][c]);//parms
							if(c === 'IfElse'){
								AddToTimeIntEvtTracker({name: line, type: 'interval'});
								aThis.intervals[line] = setInterval(function() {
									//Interval Functions
									//Check for End Condition
									if(aThis[b].GetFlag(endCond) === 'true'){
										clearInterval(aThis.intervals[line]);
										RemoveFromTimeIntEvtTracker(line);
									}
									//console.log('IfElse Interval Hit')
									IfElse(b,core[time][line][a][b][c]);
									//Check and update Loop Total
									if(loopTotal === 'infinite'){} else {
										ranTotal++;
										if(ranTotal >= loopTotal){
											clearInterval(aThis.intervals[line]);
											RemoveFromTimeIntEvtTracker(line);
										}
									}
								}, line); //Interval
							} else if(c === 'SetFlag'){
								AddToTimeIntEvtTracker({name: line, type: 'interval'});
								aThis.intervals[line] = setInterval(function() {
									//Interval Functions
									//Check for End Condition
									if(aThis[b].GetFlag(endCond) === 'true'){
										clearInterval(aThis.intervals[line]);
										RemoveFromTimeIntEvtTracker(line);
									}
									console.log('SetFlag Interval Hit')
									SetFlag(b,core[time][line][a][b][c]);
									//Check and update Loop Total
									if(loopTotal === 'infinite'){} else {
										ranTotal++;
										if(ranTotal >= loopTotal){
											clearInterval(aThis.intervals[line]);
											RemoveFromTimeIntEvtTracker(line);
										}
									}
								}, line); //Interval
							} else {
								let method = c;
								let params = core[time][line][a][b][c];
								AddToTimeIntEvtTracker({name: line, type: 'interval'});
								aThis.intervals[line] = setInterval(function() {
									//Interval Functions
									//Check for End Condition
									if(aThis[b].GetFlag(endCond) === 'true'){
										clearInterval(aThis.intervals[line]);
										RemoveFromTimeIntEvtTracker(line);
									}
									//console.log('Interval Hit')
									AThisObjMethod(b,method,params);
									//Check and update Loop Total
									if(loopTotal === 'infinite'){} else {
										ranTotal++;
										if(ranTotal >= loopTotal){
											clearInterval(aThis.intervals[line]);
											RemoveFromTimeIntEvtTracker(line);
										}
									}
									//clearInterval(interval);
								}, line); //Interval
							}
						}
					}
				}
			}
		} else if(time === 'interaction'){
			//console.log('Interaction Added...');
			for(let a in core[time][line]){
				//console.log(time);//interaction
				//console.log(line);//type of interaction | click
				//console.log(core[time][line]);//this.object w/ method and params
				//console.log(a);//this.object name
				//console.log(core[time][line][a]);//func w/ params
				for(let b in core[time][line][a]){
					//console.log(b);//func name
					//console.log(core[time][line][a][b]);//params
					let object = a;
					let method = b;
					let params = core[time][line][a][b];
					//aThis.interactions[object];
					//aThis.running[ran].name;
					AddToTimeIntEvtTracker({name: object, type: 'interaction', method, params, event: line});
					aThis[object].GetEl().addEventListener(line, function(){
						AThisObjMethod(object,method,params);
					});
				}
				//aThis[line][a](core[time][line][a]);
			}
		} else if(time === 'event'){
			//console.log('Listening for Event...');
			for(let a in core[time][line]){
				//console.log(time);//event
				//console.log(line);//event name
				//console.log(core[time][line]);//this.object w/ method and params
				//console.log(a);//this.object name
				//console.log(core[time][line][a]);//func w/ params
				for(let b in core[time][line][a]){
					//console.log(b);//func name
					//console.log(core[time][line][a][b]);//params
					let object = a;
					let method = b;
					let params = core[time][line][a][b];
					//aThis.interactions[object];
					//aThis.running[ran].name;
					AddToTimeIntEvtTracker({name: object, type: 'event', method, params, event: line});
					aThis[object].GetEl().addEventListener(line, function(){
						AThisObjMethod(object,method,params);
					});
				}
				//aThis[line][a](core[time][line][a]);
			}
		} else {
			//Reading non-special timeline, read normally
			for(let a in core[time][line]){
				if(time === 'start'){
					//console.log('Initializing an Object');
					//console.log(time);//start
					//console.log(line);//this.object name
					//console.log(core[time][line]);//func w/ params
					//console.log(a);//method name. can be universal like IfElse
					//console.log(core[time][line][a]);//params
					if(a === 'IfElse'){
						IfElse(line, core[time][line][a]);
					} else if (a === 'SetFlag') {
						SetFlag(line,core[time][line][a]);
					} else {
						AThisObjMethod(line,a,core[time][line][a]);
					}
				} else if(time === 'exit'){
					//console.log('Exiting Scene');
					//console.log(time);//exit
					//console.log(line);//this.object name
					//console.log(core[time][line]);//func w/ params
					//console.log(a);//method name. can be universal like IfElse
					//console.log(core[time][line][a]);//params
					if(a === 'IfElse'){
						IfElse(line,core[time][line][a]);
					} else if (a === 'SetFlag') {
						SetFlag(line,core[time][line][a]);
					} else {
						AThisObjMethod(line,a,core[time][line][a]);
					}
				} else if(time === 'zone'){
					if(a === 'IfElse'){
						console.log('IfElse shouldnt be used in Zone. Move to Start.');
						//IfElse(line,core[time][line][a]);
					} else if (a === 'SetFlag') {
						console.log('SetFlag shouldnt be used in Zone. Move to Start.');
						//SetFlag(line,core[time][line][a]);
					} else {
						//Check if Zone element already exists
						//console.log('Adding Zone Element');
						//Add to Zone Tracker
						if(a === 'AddToScene'){
							if(aThis.zoneSpawned[aThis[line].core.id]){} else {
								AddToZoneTracker('core', aThis[line]);
								AThisObjMethod(line,a,core[time][line][a]);
							}
						} else if(a === 'AddAllToScene'){
							if(aThis.zoneSpawned[aThis[line].layer.id]){} else {
								AddToZoneTracker('layer', aThis[line]);
								AThisObjMethod(line,a,core[time][line][a]);
							}
						}
					}
				} else if(time === 'info') {
					//Data only
				} else {
					console.log('Hit Other Timeline, Please Investigate');
					//console.log('Executing Timeline...');
					//console.log(time);//timeline
					//console.log(line);//this.obj name
					//console.log(core[time][line]);//method and params
					//console.log(a);//method
					//console.log(core[time][line][a]);//parms
					//console.log(aThis);//this.object
					//console.log(aThis[line]);//this.object
					//aThis[line][a](core[time][line][a]);
					//AThisObjMethod(line,a,core[time][line][a]);
				}
			}
		}
	}
	return;
	}

	const Info = () => {
		readTimeline('info');
	}

	const Zone = () => {
		readTimeline('zone');
	}

	const AddToZoneTracker = (type, obj) => {
		if(type === 'core'){
    		aThis.zoneSpawned[obj.core.id] = {type, obj};
		} else if(type === 'layer'){
    		aThis.zoneSpawned[obj.layer.id] = {type, obj};
		}
		//console.log(aThis.zoneSpawned)
	}

	const RemoveFromZoneTracker = (type) => {
		delete aThis.zoneSpawned[type.id];
	}

	const Start = () => {
		readTimeline('start');
	}

	const Delay = () => {
		readTimeline('delay');
	}

	const Interval = () => {
		readTimeline('interval');
	}

	const Event = () => {
		readTimeline('event');
	}

	const Interaction = () => {
		readTimeline('interaction');
	}

	const Exit = () => {
		readTimeline('exit');
		if(core.info.sceneText){
			sceneText.KillStop();
		}
	}

	const Map = () => {
		readTimeline('map');
	}

	const StartScene = () => {
		Start();
		Delay();
		Interval();
		Interaction();
		Event();
		sceneTextDisplay();
	}

	const sceneTextDisplay = () => {
		if(core.info.sceneText){
			sceneText.Start();
			sceneText.DisplaySpeech({role: core.info.name,speech: '...'});
			let sceneTextTimeout = setTimeout(function () {
				sceneText.DisplaySpeech({role: core.info.name,speech: core.info.description});
				clearTimeout(sceneTextTimeout);
			}, 1250); //Delay
		}
	}

	return {core, IfElse, SetFlag, ClearScene, AThisObjMethod, Info, Zone, Start, Delay, Interval, Event, Interaction, Exit, Map, StartScene}
}

//
//mapRegionDistrictTerritoryZoneSection
//Map Zone Gen & reader
const MapZone = (mapZoneData) => {
//Display Local Map and facilitate travel between Nodes
let core = {};
core.map = Object.assign({}, mapZoneData)
core.mapMenuData = false;
core.mapMenu;
core.nodes = {};
core.info;
core.currentNode;
core.zoneLoaded = false;
//core.nodes.nodeName.map = {connect0:{},connect1:{}};
//console.log('Running Map Zone...');
//console.log(mapZoneData);

//Map Movement Support
let timeout;
let timeout2;
let newNode;

	const ReadMapData = () => {
		for(let key in core.map){
			if(key === 'info'){
				core.info = core.map[key]
			} else {
				//console.log(key)//key - info, zone0Node0In1
				core.nodes[key] = aThis[key];
				//console.log(aThis[key])//this.nodeObj
				//console.log(core.map[key])//value - node connections
				for(let connect in core.map[key]){
					//console.log(core.map[key][connect]);//connect0, connect1
					for(let travel in core.map[key][connect]){
						//console.log(travel);//connect keys
						//console.log(core.map[key][connect][travel]);//connect values
						//inZone: true,
						//node: 'zone0Node0Out',
						//locked: true,
						//key: 'masterKey',
						//keepKey: true
					}
				}
			}
		}
	}
	//Prep for use on init
	ReadMapData();

	const StartScene = (nodeName) => {
		//core.currentNode = nodeName || Object.keys(core.nodes)[0];
		core.currentNode = nodeName || core.map.info.start;
		core.currentZone = core.info.id;
		if(core.zoneLoaded){} else {
			aThis[core.map.info.start].Zone();
			core.zoneLoaded = true;
		}
		aThis[core.currentNode].StartScene();
		//MoveMenuGen();
		//Gallery Prep
		//Prep Movement Flags
		aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'notMoving', value: true})
		aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'notPlaying', value: true})
		aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'rotate', value: 0})
		aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'autoRotate', value: 0})
		aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'loadingPage', value: false})
		aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'animating', value: false})
		aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'setting', value: 0})
		aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'info', value: false})
		aThis.buttonStopGallery.core.EnableDetail('Browse through the entire Art Institute of Chicago catalog of images in a casual viewing experiences. 8 frames surrounding the center displaying various images provided by AIC\'s public API. Control the image frames with a handful of buttons to jump to a random page, go back a page, go back a few images, view info, play the slideshow, go forward a few images, go to the next page and switch between 2 frame sizings. A random page number is loaded at the start from the 13209 available, so lots and lots of images to enjoy.');
		//Art Institute of Chicago API
		updateAll();
		//console.log('Scene Start');
		//console.log(core.currentNode);
	}

	const ClearScene = () => {
		aThis[core.currentNode].ClearScene();
	}

	const MoveMenuGen = () => {

		core.mapMenuData = {
			id: 'moveMenu',
			prompt: 'Move to...',
			options: {option0: '0'},
			actions: {action0: '0'},
			data: aThis.menuBaseData,
			cursorObj: core.currentZone,
			method: 'MenuMoveClick',
			pos: new THREE.Vector3(-2.5,0.75,-0.5),
		}
		//console.log(core.map);
		//console.log(core.map[core.currentNode]);
		let currNum = 0;
		let moveToNode;
		for(let connect in core.map[core.currentNode]){
			//console.log(connect);
			//core.map[core.currentNode][connect].inZone
			//core.map[core.currentNode][connect].node
			//core.map[core.currentNode][connect].travel
			//core.map[core.currentNode][connect].locked
			//core.map[core.currentNode][connect].key
			//core.map[core.currentNode][connect].keepKey

			//In Zone Node or Out of Zone Node
			if(core.nodes[core.map[core.currentNode][connect].node]){
				moveToNode = core.nodes[core.map[core.currentNode][connect].node];
			} else {
				moveToNode = aThis[core.map[core.currentNode][connect].node];
			}

			if(core.map[core.currentNode][connect].locked && !aThis.player.GetFlag(core.map[core.currentNode][connect].key)){
				core.mapMenuData.options['option'+currNum] = moveToNode.core.info.name + ' [Locked]';
			} else if(core.map[core.currentNode][connect].locked && aThis.player.GetFlag(core.map[core.currentNode][connect].key)){
				core.mapMenuData.options['option'+currNum] = moveToNode.core.info.name + ' [Unlocked]';
			} else {
				core.mapMenuData.options['option'+currNum] = moveToNode.core.info.name;
			}

			core.mapMenuData.actions['action'+currNum] = connect;
			//core.mapMenuData.actions['action'+currNum] = moveToNode.core.info.id;
			currNum++;

		}
		//core.map[core.currentNode][connect].inZone;
		//inZone
		//node
		//travel
		//locked
		//key
		//keepKey
		core.mapMenu = Menu(core.mapMenuData);
		core.mapMenu.MenuGen();
	}

	const MenuMoveClick = (el) => {
		let result = el.getAttribute('result');
		//console.log(result);//connect0
		Move(result);
	}

	const Move = (connect) => {

		newNode = core.map[core.currentNode][connect];

		if(newNode.locked && !aThis.player.GetFlag(newNode.key)){
			//console.log('Needs key');
			clearTimeout(timeout2);
			aThis.player.TempDisableClick();
			aThis.cameraUI.ChangeSelf({property: 'text', value: {value:'Requires : ' + newNode.key, width: 0.5, color: "#FFFFFF", align: "center", font: "exo2bold", side: 'double', opacity: 0},});
			aThis.cameraUI.ChangeSelf({property: 'visible', value: 'true'});
			aThis.cameraUI.EmitEvent('cameraMsg');
			timeout2 = setTimeout(function () {
				aThis.cameraUI.ChangeSelf({property: 'visible', value: 'false'});
				clearTimeout(timeout2);
			}, 3750);
			//Testing
			//aThis.player.SetFlag({flag: newNode.key, value: true})
			//console.log('Key given');
		} else {
			if(newNode.locked && aThis.player.GetFlag(newNode.key) && !newNode.keepKey){
				aThis.player.SetFlag({flag: newNode.key, value: false})
				//console.log('Key taken');
			}
			//Timeout
			timeout = setTimeout(function () {
					core.mapMenu.MenuRemove();
					ClearScene();
					//check if results name as a key exists in this zone
					if(core.nodes[newNode.node]){
						StartScene(newNode.node);
					} else {
						//switch zones / object control
						ClearZone();
						core.zoneLoaded = false;
						aThis[newNode.inZone].StartScene(newNode.node)
					}
				clearTimeout(timeout);
			}, 450);
			//Instant, Shrink/Grow, Fade, Sphere, Blink
			//console.log(aThis.player)
			//console.log(aThis.player.layer)
			//console.log(aThis.player.layer.transition)
			if(aThis.player.layer.transition === 'blink'){
				aThis.player.TempDisableClick();
				aThis.blink1Screen.ChangeSelf({property: 'visible', value: 'true'});
				aThis.blink2Screen.ChangeSelf({property: 'visible', value: 'true'});
				aThis.blink1Screen.EmitEvent('blink');
				aThis.blink2Screen.EmitEvent('blink');
				timeout2 = setTimeout(function () {
					aThis.blink1Screen.ChangeSelf({property: 'visible', value: 'false'});
					aThis.blink2Screen.ChangeSelf({property: 'visible', value: 'false'});
					clearTimeout(timeout2);
				}, 1050);
			} else if (aThis.player.layer.transition === 'fade'){
				aThis.player.TempDisableClick();
				aThis.fadeScreen.ChangeSelf({property: 'visible', value: 'true'});
				aThis.fadeScreen.EmitEvent('fade');
				timeout2 = setTimeout(function () {
					aThis.fadeScreen.ChangeSelf({property: 'visible', value: 'false'});
					clearTimeout(timeout2);
				}, 1050);
			} else if (aThis.player.layer.transition === 'sphere'){
				aThis.player.TempDisableClick();
				aThis.sphereScreen.ChangeSelf({property: 'visible', value: 'true'});
				aThis.sphereScreen.EmitEvent('sphere');
				timeout2 = setTimeout(function () {
					aThis.sphereScreen.ChangeSelf({property: 'visible', value: 'false'});
					clearTimeout(timeout2);
				}, 1050);
			} else if (aThis.player.layer.transition === 'instant'){}
		}
	}

	const ClearZone = () => {
	//Clear Core | Layer Scene Tracked Items
		//console.log('Clearing Scene...')
		//console.log(aThis.zoneSpawned);
		clearSpawned(aThis.zoneSpawned);
		/*
		for(let spawn in aThis.zoneSpawned){
			//console.log(spawn);//name of ID
			//console.log(aThis[spawn]);

			if(aThis[spawn]){
				if(aThis[spawn].type === 'core'){
						aThis[spawn].core.RemoveFromScene();
				} else if (aThis[spawn].type === 'layer'){
						aThis[spawn].layer.RemoveAllFromScene();
				} else {
					if(aThis[spawn].RemoveFromScene){
						aThis[spawn].RemoveFromScene();
					} else if(aThis[spawn].RemoveAllFromScene){
						aThis[spawn].RemoveAllFromScene();
					}
				}
			} else if(document.getElementById(spawn)){
				//console.log(spawn);
				//console.log(document.getElementById(spawn));
			}

			//console.log(aThis.zoneSpawned[spawn]);//Book & Page spawned from
			delete aThis.zoneSpawned[spawn];
		}*/
		//console.log(aThis.zoneSpawned);
	}

return {core, ReadMapData, StartScene, MoveMenuGen, MenuMoveClick, Move, ClearZone};
}

//
//Story Book - Linear, Tree, Quests, Jump, Menu, Conditionals, Flags...
const Book = (core, npc) => {
//facilitate interaction between user, objects and story.

	function* lineReader(book,time){
		for(let line in time){
			//console.log(line);//id,timeline,transition,textBubble,... key name
			//console.log(time[line]);//id,timeline,transition,textBubble,... value object

			//Ignore Page Data
			if(line === 'id' || line === 'description' ||line === 'tags' ||line === 'nextPage' ||line === 'prevPage' ||line === 'timeline'){
			//page data only
			} else if(line === 'pureFunction'){
				//pure functions
				//not object generated methods
				//Need a good check condition for this.func() and not this.obj.func()

				//console.log(line)
				//console.log(time)
				//console.log(time[line])
				//console.log(aThis[line])
				//aThis[line](time[line])
				//console.log('pureFunction');
				//console.log(aThis[line]);
				aThis[line](time[line])
			} else {
				//console.log(line);
				//console.log(time[line]);
				for(let a in time[line]){
					//console.log(a);//AddToScene / ChangeSelf
					//console.log(time[line]);//{AddToScene: null} / {ChangeSelf: {mat...}}
					//console.log(time[line][a]);//null / {material: {opacity: 0.5}}
					//console.log('Executing...');
					//console.log(line);
					//console.log(a);
					//console.log(aThis[line][a]);
					aThis[line][a](time[line][a]);
				}

			}//else

		}//for line in time
		//console.log(book);
		//console.log('Stop here please.');
		yield;

	}

	function* timeReader(book,page){
		for(let time in page){
			//console.log(time);//info,timeline0,timeline1,... key name
			//console.log(page[time]);//info,timeline0,timeline1,... value object
			book.currentTimeline = time;
			book.timelineQue.push([time,page[time]]);
			//Skip|Ignore Data til timeline# reach if jumping
			if(time === core.jumpTo){
				core.jumping = false;
				//console.log('timeline hit')
				//console.log(time)
			}
			if(core.jumping){
			//console.log('jumping');
			//console.log(time);
			}else{
			//console.log('Running');
			//console.log(time);
			yield* lineReader(book, page[time]);
			}


		}//Page
	}

	function* pageReader(book){
		for(let page in book.pages){
			//console.log(page);//page0,page1,... key name
			//console.log(pages[page]);//page0,page1,... value object
			book.currentPage = page;
			book.pageQue.push([page,book.pages[page]]);
			yield* timeReader(book, book.pages[page]);

		}//Page
	}

	function* bookReader(book){

	//let value;
	//let entry;
	//entry = {};
	//entry[key] = value;
	//pageDecrypt.push(entry);

	book.currentPage = 0;
	book.currentTimeline = 0;
	book.currentEntry = 0;
	book.currentDialog = 0;
	book.pageQue = [];
	book.timelineQue = [];
	book.entryQue = [];
	book.textBubbleQue = [];
	book.speaker = '';
	book.speaking = false;
	book.jumping = false;
	book.jumpTo;
	book.selectJumpMenu;
	for(let props in book.scene){
		//console.log(props);
		//console.log(book.scene[props]);
		if(props === 'floor'){
			if(book.scene[props] === 'default'){
				//nodeFloorCore.AddToScene();
			}
		} else if(props === 'background'){
			if(book.scene[props] === '3GradStarRot'){
				//skyLayerAll.AddAllToScene();
			}
		}
	};


	//Book Info & Contents
	//display this info in scene on a plane above controller 
	//for(let setting in book.info){
		//console.log(setting);
		//console.log(book.info[setting]);
		//Book Info
		//id
		//description
		//tags
	//};
	//Book Initialized
	//yield;//Do you want to continue|confirm?
	//Start reading Pages
	//Pages Ingo & Contents
	yield* pageReader(book);

	};

	let book = bookReader(core);

	function readTimeline({page,time}){
	//find a specific timeline/key name and load up that
	//aThis.bookOverviewAuxlFeatures.readTimeline('page0','timeline6');
	//page - 'page0'
	//time - 'timeline6'
		for(let line in core.pages[page][time]){
			if(line === 'pureFunction'){
				//Need a good check condition for this.func() and not this.obj.func()
				//console.log('pureFunction');
				//console.log(aThis[line]);
				aThis[line](time[line])
			} else {
				for(let a in core.pages[page][time][line]){
					//console.log('Executing...');
					//console.log(aThis[line][a]);
					aThis[line][a](core.pages[page][time][line][a]);
				}
			}
		}
	return;
}

	const Next = () => {
		//next yielded spot and update done var
		book.done = book.next().done;

		if(book.done){
			//console.log('All Done!');
		} else {
			//console.log('Continue...')
		}
	}

	const Jump = ({timeline, page}) => {

		//let toBook = book || false;
		let toPage = page || core.currentPage;
		core.jumpTo = timeline;

		//if exists
		if(core.pages[toPage][core.jumpTo]){
		   //book.currentTimeline - name of current timeline
			//console.log('It exists!');
			core.jumping = true;
		} else {
		   //console.log(timeline)
		   //console.log('Error Timeline does not exist.')
		}
	}

	const SelectJump = (jumpOptions) => {
	//gen a menu that displays options which when selected jump to a specific timeline#
		let selectedTime;
		let selectedPage = false;
		let selectJumpData = {
		id: 'selectJump',
		prompt: 'When to?',
		options: {},
		actions: {},
		data: aThis.menuBaseData,
		cursorObj: npc.core.id,
		pos: new THREE.Vector3(1,1.5,-0.5),
		method: 'Click',
		}

		for(let a = 0; a < jumpOptions.length; a++){
			selectJumpData.options['option'+a] = jumpOptions[a][0];
			selectJumpData.actions['action'+a] = jumpOptions[a][1];
		}

		book.selectJumpMenu = Menu(selectJumpData);
		book.selectJumpMenu.MenuGen();
		book.selectJumpMenu.AddToMenuSceneTracker(book.selectJumpMenu);
		//disable main el clickable class
		//Need to update after creating book control component
		npc.GetEl().classList.toggle('clickable', false);
	}

	return {core, book, Next, Jump, SelectJump, readTimeline};
}

//
//Speech System Textbubble
const SpeechSystem = (core) => {

	core.on = false;
	core.speaking = false;
	core.textDisplayInterval;

	const Start = () => {
		core.AddToScene(false,false,true);
		core.GetEl().addEventListener('mouseenter', Skip);
		core.on = true;
	}

	const Skip = () => {
		core.GetEl().emit('skip',{});
	}

	const Stop = () => {
		core.GetEl().removeEventListener('mouseenter', function(){});
		core.RemoveFromScene(false,false,true);
		core.on = false;
		//removeFromSceneTracker(core);
	}

	const Kill = (interval) => {
		core.speaking = false;
		clearInterval(core.textDisplayInterval);
	}

	const KillStop = () => {
		Kill();
		Stop();
	}

	const ChangeCore = (setAlt) => {
		core.ChangeSelf(setAlt)
	}

	const ChangeCoreArray = (...setAlt) => {
		core.ChangeSelfArray(...setAlt)
	}

	const DisplaySpeech = ({role,speech}) => {
		let startText = role + ' : ';
		let currText = startText;
		let currChar = 0;
		core.GetEl().setAttribute('text',{value: currText});
		core.speaking = true;

		core.GetEl().addEventListener('skip', function(){
			core.GetEl().setAttribute('text',{value: startText + speech});
			core.speaking = false;
			Kill();
			core.GetEl().removeEventListener('skip',{});
		});

	AddToTimeIntEvtTracker({name: 'textDisplayInterval', type: 'interval'});
		core.textDisplayInterval = setInterval(function() {
			//Interval Functions
			if(currChar < speech.length){
				currText += speech[currChar];
				currChar++;
			}
			if(currChar >= speech.length){
				core.speaking = false;
				Kill();
				core.GetEl().removeEventListener('skip',function(){});
			}
			if(core.on){
				core.GetEl().setAttribute('text',{value: currText});
			}
		}, 20); //Interval
		aThis.intervals.textDisplayInterval = core.textDisplayInterval;
	}

	const AddToTimeIntEvtTracker = ({name,type,method,params}) => {
		if(type === 'timeout'){
			aThis.running[name] = {type, name};
		} else if (type === 'interval'){
			aThis.running[name] = {type, name};
		} else if (type === 'event'){
			aThis.running[name] = {type, name, method, params};
		}
	}

	const RemoveFromTimeIntEvtTracker = (name) => {
		delete aThis.running[name];
	}

	return {core, Start, Skip, KillStop, ChangeCore, ChangeCoreArray, DisplaySpeech};
}

//
//NPC
const NPC = (core, bookData, textDisplay) => {

let npc = Object.assign({}, core);
let bubble = Object.assign({}, textDisplay);
let book;
//bubble.core.position.x = core.core.position.x;
//bubble.core.position.y = core.core.position.y - 0.5;
//bubble.core.position.z = core.core.position.z + 0.25;
let text = SpeechSystem(bubble);
let menuTimeout;

	const Spawn = () => {
		//Reset book on each spawn
		book = Book(bookData, npc);
		npc.AddToScene(false,false,true);
		EnableSpeech();
		AddToNPCSceneTracker();
		//Need an NPC tracker, so it can run DisableSpeech on scene change
		//console.log('Spawn');
	}

	const Despawn = () => {
		DisableSpeech();
		npc.RemoveFromScene(false,false,true);
		RemoveFromNPCSceneTracker();
	}

	const AddToNPCSceneTracker = () => {
    	aThis.npcSpawned[npc.core.id] = {type: 'npc', obj: npc};
	}

	const RemoveFromNPCSceneTracker = () => {
		delete aThis.npcSpawned[npc.core.id];
	}

	const EnableSpeech = () => {
		//console.log('Enable Speech');
		text.Start();
		npc.ChangeSelf({property: 'attach', value: {idname: text.core.core.id, position: text.core.core.position}})
		//Jump to Timeline0
		NextPage();
		NextPage();
		npc.GetEl().addEventListener('mouseenter', NextPage);
		npc.GetEl().addEventListener('click', ResetBook);
	}

	const DisableSpeech = () => {
		//console.log('Disable Speech');
		text.KillStop();
		npc.GetEl().removeEventListener('mouseenter', NextPage);
		npc.GetEl().removeEventListener('click', ResetBook);
	}

	const Speak = ({role,speech}) => {
		//console.log('Speak')
		//console.log(role)
		//console.log(speech)
		text.DisplaySpeech({role, speech});
	}

	const NextPage = () => {
		//Prevent pushing next speech until current is over or skipped to end
		//console.log('Next Page')
		//console.log(text.core.on)
		//console.log(text.core.speaking)
		if(text.core.on){
			if(text.core.speaking){} else {
				book.Next()
			}
		} else {
			book.Next()
		}
	}

	const ResetBook = (force) => {
		if(book.book.done || force){
			//console.log('Reseting Book...');
			//Reset Book
			book = Book(bookData, npc);
			NextPage();
			NextPage();
			//npc.ChangeSelf({property: 'material', value: {opacity: 1}});
			//npc.ChangeSelf({property: 'text', value: {value: 'Menu'}});
			//console.log('Book Ready!');
		} else {
			//console.log('Book is not done!')
		}
	}

	const Click = (el) => {
		let result = el.getAttribute('result');
		Jump({timeline: result});
		book.Next();

		//Need to update after creating book control component
		npc.GetEl().classList.toggle('clickable', true);
		//Timeout
		menuTimeout = setTimeout(function () {
			book.book.selectJumpMenu.MenuRemove();
			clearTimeout(menuTimeout);
		}, 250); //Delay
	}

	const Jump = ({timeline, page}) => {
		book.Jump({timeline, page})
	}

	const SelectJump = (jumpOptions) => {
		book.SelectJump(jumpOptions);
	}

	const AThisObjMethod = (object, func, params) => {
		//console.log(object);
		//console.log(func);
		//console.log(params);
		//console.log(aThis[object]);
		aThis[object][func](params);
	}

	const IfElse = (obj) => {
//objRef, {cond, ifTrue, ifFalse}
/*
IfElse: {
npc0:{cond: 'testVar',
ifTrue: {
npc0:{Speak:{role: 'Dev', speech:'Is True'}},
},
ifFalse: {
npc0:{Speak:{role: 'Dev', speech:'Is False'}},
},}
}*/
		//ifTrue
		//ifFalse
		//for loop for above objects with key name as object and value key as method and that value the params
		//console.log(obj)//entire ifElse object
		let objRef = Object.keys(obj);
		//console.log(Object.keys(obj))//this.obj name
		let cond = obj[objRef].cond;
		let ifTrue = obj[objRef].ifTrue;
		let ifFalse = obj[objRef].ifFalse;
		//console.log(cond)//cond name
		//console.log(ifTrue)
		//console.log(ifFalse)

		//console.log(aThis[objRef].GetFlag(cond))
		if(aThis[objRef].GetFlag(cond) === 'true') {
			//run ifTrue
			for(let a in ifTrue){
				//console.log(ifTrue);
				//console.log(a);
				//console.log(ifTrue[a]);
				for(let b in ifTrue[a]){
					AThisObjMethod(a,b,ifTrue[a][b]);
				}
			}
		} else if (aThis[objRef].GetFlag(cond) === 'false' || !aThis[objRef].GetFlag(cond)) {
			//run ifFalse
			for(let a in ifFalse){
				//console.log(ifFalse);
				//console.log(a);//this.object name should match objRef
				//console.log(ifFalse[a]);//method w/ params
				for(let b in ifFalse[a]){
					AThisObjMethod(a,b,ifFalse[a][b]);
				}
			}
		}

	}

	const SetFlag = ({flag, value}) => {
		npc[flag] = value;
		//console.log(flag);
		//console.log(core[flag]);
	}

	const GetFlag = (varName) => {
		//console.log(varName)
		//console.log(core[varName])
		return npc[varName];
	}

return {npc, Spawn, Despawn, EnableSpeech, DisableSpeech, Speak, NextPage, ResetBook, Click, Jump, SelectJump, AThisObjMethod, IfElse, SetFlag, GetFlag}
}

//
//Hamburger Menu Companion
const HamMenu = (name, core) => {

let ham = Object.assign({}, core);
ham.systemOpen = false;
ham.travelSettingsOpen = false;
ham.sceneSettingsOpen = false;

//Hamburger Menu Companion - Main Menu, Settings and Controls
//Travel Settings : Instant, Blink, Fade, Sphere
//Travel|Site Menu
//Scene Settings : Color Themes, Accessibility, Scene Info, etc...
let systemMenuButtons = {
travelSettings: 'Travel Settings',
sceneSettings: 'Scene Settings',
};

let travelSettingsButtons = {
instant: 'Instant Transition',
blink: 'Blink Transition',
fade: 'Fade In/Out Transition',
sphere: 'Sphere Transition',
};

let sceneSettingsButtons = {
theme: 'Color Theme',
accessibility: 'Accessibility Settings',
author: 'Made by Minty Crisp!',
};


//On menu clicks, toggle the clickable class for all menu options to prevent multi-clicking intentional or not

	//
	//Emoti Display
	const autoScriptEmoticon = () => {

	function* emotiSpeech() {
		yield '-_-';
		yield 'O_O';
		yield 'o_o';
		yield 'o_O';
		yield 'O_o';
		yield 'O_^';
		yield '^_o';
		yield '^_^';
		yield 'o_^';
		yield '^_O';
		yield '<_<';
		yield '>_>';
		yield '>_<';
		yield 'X_X';
		yield '*_*';
		yield '+_+';
		yield '0_0';
	}

		let emotiSpeechArray = [];
		//Only do 1 step per run, not all though?
		for (speech of emotiSpeech()) {
			//console.log(speech);
			emotiSpeechArray.push(speech);
		}
		let buddy;
		let buddyFaceMaterial = {value:'^_^', color: "#FFFFFF", align: "center", font: "exo2bold", zOffset: 0.135, side: 'double',}
		let b;
		let speechIntervalB;
		let speechTimeoutB = setTimeout(function () {
			b = 0;
			buddy = ham.GetEl();

			speechIntervalB = setInterval(function() {
				buddyFaceMaterial.value = emotiSpeechArray[b];
				buddy.setAttribute('text', buddyFaceMaterial);
				if(b === emotiSpeechArray.length){b = 0}else{b++}
			}, 2700); //Interval
		}, 250); //Delay

	}

	const Start = () => {
		ham.AddToScene(false, false, true);
		autoScriptEmoticon();
		ham.GetEl().addEventListener('click', openCloseMenu)
	}

	const Remove = () => {
		//disable autoScriptEmoticon();
		ham.GetEl().removeEventListener('click', openCloseMenu);
		ham.RemoveFromScene(false, false, true);
		ham.systemOpen = false;
	}

	const openCloseMenu = () => {
		if(ham.systemOpen){
			closeSystemMenu();
		} else if(ham.travelSettingsOpen){
			closeTravelSettingsMenu()
			systemMenuGen();
		} else if(ham.sceneSettingsOpen){
		} else {
			systemMenuGen();
		}
	}

	const systemMenuGen = () => {
		ham.systemOpen = true;
		ham.GetEl().classList.toggle('clickable');
		ham.systemMenuData = {
			id: 'systemMenu',
			prompt: 'System Menu',
			options: {option0: '0'},
			actions: {action0: '0'},
			data: aThis.menuBaseData,
			cursorObj: name,
			method: 'SystemMenuClick',
			pos: new THREE.Vector3(1.25,1.5,-0.25),
		}

		let currNum = 0;
		for(let options in systemMenuButtons){
			//console.log(options);
			ham.systemMenuData.options['option'+currNum] = systemMenuButtons[options];
			ham.systemMenuData.actions['action'+currNum] = options;
			currNum++;
		}
		ham.systemMenu = Menu(ham.systemMenuData);
		ham.systemMenu.MenuGen();
		ham.systemMenu.AddToMenuSceneTracker(ham.systemMenu);
		ham.GetEl().classList.toggle('clickable');
		//ham.systemMenu.menu.layer.AnimateParent(aThis.animClickData);
	}

	const closeSystemMenu = () => {
		ham.systemOpen = false;
		ham.systemMenu.MenuRemove();
		ham.systemMenu.RemoveFromMenuSceneTracker();
	}

	const SystemMenuClick = (el) => {
		let result = el.getAttribute('result');
		//console.log(result);//connect0
		//toggle clickable class
		//ham.systemMenu
		ham.systemMenu.ToggleOptionClicking();
		//Timeout
		let timeout = setTimeout(function () {
			if(result === 'travelSettings'){
				travelSettings();
			} else if(result === 'sceneSettings'){
				sceneSettings();
			}
			//Removing this menu breaks the mapZone travel menu
			closeSystemMenu();
			clearTimeout(timeout);
		}, 250);
	}

	const travelSettings = () => {
		//console.log('Travel Settings');
		travelSettingsMenuGen();
	}

	const travelSettingsMenuGen = () => {
		ham.travelSettingsOpen = true;
		ham.travelSettingsMenuData = {
			id: 'travelSettings',
			prompt: 'Travel Settings',
			options: {option0: '0'},
			actions: {action0: '0'},
			data: aThis.menuBaseData,
			cursorObj: name,
			method: 'TravelSettingsMenuClick',
			pos: new THREE.Vector3(0.5,1,-0.6),
			//layout: 'vertical',
		}

		let currNum = 0;
		for(let options in travelSettingsButtons){
			//console.log(options);
			ham.travelSettingsMenuData.options['option'+currNum] = travelSettingsButtons[options];
			ham.travelSettingsMenuData.actions['action'+currNum] = options;
			currNum++;
		}
		ham.travelSettingsMenu = Menu(ham.travelSettingsMenuData);
		ham.travelSettingsMenu.MenuGen();
		ham.systemMenu.AddToMenuSceneTracker(ham.travelSettingsMenu);

	}

	const closeTravelSettingsMenu = () => {
		ham.travelSettingsOpen = false;
		ham.travelSettingsMenu.MenuRemove();
		ham.travelSettingsMenu.RemoveFromMenuSceneTracker();
	}

	const TravelSettingsMenuClick = (el) => {
		let result = el.getAttribute('result');
		//console.log(result);
		//Display confirmation window on selection
		//Add animation feedback on click of button
		//instant
		//fade
		//sphere
		//blink
		ham.travelSettingsMenu.ToggleOptionClicking();
		aThis.player.layer.transition = result;
		//Timeout
		let timeout = setTimeout(function () {
			closeTravelSettingsMenu();
			clearTimeout(timeout);
		}, 250);
	}

	const sceneSettings = () => {
		//console.log('Scene Settings');
	}

return{ham, Start, Remove, SystemMenuClick, TravelSettingsMenuClick};
}

//
//Objs Gen Ring Spawn
const ObjsGenRing = (data) => {
	let gen = Object.assign({}, data);
	let ogData = Object.assign({}, data.objData);
	let objData = JSON.parse(JSON.stringify(data.objData));

	//gen.id
	//gen.objData
	//gen.total
	//gen.outerRingRadius
	//gen.innerRingRadius
	//gen.sameTypeRadius
	//gen.otherTypeRadius
	//gen.ranYPos
	//gen.yPosFlex
	//gen.ranScaleX
	//gen.ranScaleY
	//gen.ranScaleZ
	//gen.scaleFlex
	//gen.ranRotX
	//gen.ranRotY
	//gen.ranRotZ
	//gen.ranColor
	//gen.ranTexture

	let all = [];
	let posX;
	let posY;
	let posZ;
	let positionVec3;
	let scaleX;
	let scaleY;
	let scaleZ;
	let rotX;
	let rotY;
	let rotZ;
	let color;

	//Function to calculate distance between two points
	function distance(x1, z1, x2, z2) {
		return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2) * 1.0);
	}

	function randomPosition(radius, yPos){
		posX = Math.random() * (radius*2) - radius;
		posZ = Math.random() * (radius*2) - radius;
		return new THREE.Vector3(posX, yPos, posZ);
	}

	const genCores = () => {

		for(let a = 0; a < gen.total; a++){
			objData.id = ogData.id + a;

			//Color
			if(gen.ranColor){
				color = colorsHexGen().base;
				objData.material.color = color;
				if(objData.material.emissive){
					objData.material.emissive = color;
				}
			}
			//Texture
			if(gen.ranTexture){
				objData.material.src = patterns[Math.floor(Math.random()*patterns.length)];
			}
			//Rotation
			rotX = objData.rotation.x;
			rotY = objData.rotation.y;
			rotZ = objData.rotation.z;
			if(gen.ranRotX){
				rotX += Math.random() * 360;
			}
			if(gen.ranRotY){
				rotY += Math.random() * 360;
			}
			if(gen.ranRotZ){
				rotZ += Math.random() * 360;
			}
			objData.rotation = new THREE.Vector3(rotX, rotY, rotZ);

			//Scale
			scaleX = gen.objData.scale.x;
			scaleY = gen.objData.scale.y;
			scaleZ = gen.objData.scale.z;
			if(gen.ranScaleX){
				scaleX += Math.random() * gen.scaleFlex;
			}
			if(gen.ranScaleY){
				scaleY += Math.random() * gen.scaleFlex;
			}
			if(gen.ranScaleZ){
				scaleZ += Math.random() * gen.scaleFlex;
			}
			objData.scale = new THREE.Vector3(scaleX, scaleY, scaleZ);

			//Scale adjustment needs affect gen.sameTypeRadius
			//Need to spawn equal amount in each quadrant?
			posY = gen.objData.position.y;
			if(gen.ranYPos){
				posY += Math.random() * gen.yPosFlex;
			}

			//Position
			positionVec3 = randomPosition(gen.outerRingRadius, posY);
			objData.position = positionVec3;

			//Max attempts to check for avoiding collision
			let checking = 42;
			checkAllData: while (checking > 0) {
				if(a === 0){
					if(distance(positionVec3.x,positionVec3.z,0,0) < gen.innerRingRadius) {
						positionVec3 = randomPosition(gen.outerRingRadius, posY);
						checking--;
						continue checkAllData;
					} else {
						objData.position = positionVec3;
					}
				}
				for(let z=0; z < all.length; z++) {
					//Check the distance, if too close, change and repeat
					if(distance(positionVec3.x, positionVec3.z, all[z].core.position.x, all[z].core.position.z) < gen.sameTypeRadius || distance(positionVec3.x,positionVec3.z,0,0) < gen.innerRingRadius) {
						positionVec3 = randomPosition(gen.outerRingRadius, posY);
						checking--;
						continue checkAllData;
					} else {
						objData.position = positionVec3;
					}
				}
				break;
			}
			//Add randomized Core to All
			all.push(Core(objData));
		}
	}

	const SpawnAll = () => {
		for(let a = 0; a < gen.total; a++){
			all[a].AddToScene(false, false, true);
		}
		AddToSceneTracker();
	}

	const DespawnAll = () => {
		for(let a = 0; a < gen.total; a++){
			all[a].RemoveFromScene();
		}
		RemoveFromSceneTracker();
	}

	const AddToSceneTracker = () => {
		//Scene Tracking of Assets
		if(aThis.zoneSpawned[gen.id]){} else {
			aThis.genSpawned[gen.id] = {type: 'gen', obj: gen};
		}
	}

	const RemoveFromSceneTracker = () => {
		//Clear Tracking of Asset
		delete aThis.genSpawned[gen.id];
	}

	return {all, genCores, SpawnAll, DespawnAll, AddToSceneTracker, RemoveFromSceneTracker};
}

//
//Art Frame Gallery
const Gallery = (core) => {

	let playInterval;
	let settingTimeout;

	const GetEl = () => {
		return core.GetEl();
	}

	const Forward = () => {
		if(aThis.artFrameAllLayer.layer.all.parent.core.GetFlag('notMoving')){
			aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'notMoving', value: false})
			let current = this.artFrameAllLayer.layer.all.parent.core.GetFlag('rotate');
			if(current === 3){
				current = 0;
			} else {
				current++;
			}
			if(current === 0 || current === 2){
			currentPage++;
			}
			this.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'rotate', value: current})
			updateBackTwo();
			//Get current artFrameAllLayer rotation
			let rotY = aThis.artFrameAllLayer.GetParentEl().getAttribute('rotation').y;
			aThis.anim90Data.from = rotY;
			aThis.anim90Data.to = rotY - 90;
			aThis.artFrameAllLayer.AnimateParent(aThis.anim90Data);
			let timeout = setTimeout(function () {
				aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'notMoving', value: true})
			clearTimeout(timeout);
			}, aThis.anim90Data.dur+10); //Delay
		}
	}

	const Backward = () => {
		if(aThis.artFrameAllLayer.layer.all.parent.core.GetFlag('notMoving')){
			aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'notMoving', value: false})
			let current = this.artFrameAllLayer.layer.all.parent.core.GetFlag('rotate');
			if(current === 0){
				current = 3;
			} else {
				current--;
			}
			if(current === 0 || current === 2){
			currentPage--;
			}
			this.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'rotate', value: current})
			updateBackTwo();
			//Get current artFrameAllLayer rotation
			let rotY = aThis.artFrameAllLayer.GetParentEl().getAttribute('rotation').y;
			aThis.anim90Data.from = rotY;
			aThis.anim90Data.to = rotY + 90;
			aThis.artFrameAllLayer.AnimateParent(aThis.anim90Data);
			let timeout = setTimeout(function () {
				aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'notMoving', value: true})
				clearTimeout(timeout);
			}, aThis.anim90Data.dur+10); //Delay
		}
	}

	const PlayPause = () => {
		if(aThis.artFrameAllLayer.layer.all.parent.core.GetFlag('notPlaying')){
			aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'notPlaying', value: false})
			aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'notMoving', value: false})
			let current = aThis.artFrameAllLayer.layer.all.parent.core.GetFlag('autoRotate');
				currentPage++;
				playInterval = setInterval(function() {
					current = aThis.artFrameAllLayer.layer.all.parent.core.GetFlag('autoRotate');
					if(current === 7){
						current = 0;
						currentPage++;
					} else {
						current++;
					}
					aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'autoRotate', value: current})
					updateBack();
				}, aThis.anim360Data.dur/8); //Interval
			//Get current artFrameAllLayer rotation
			let rotY = aThis.artFrameAllLayer.GetParentEl().getAttribute('rotation').y;
			aThis.anim360Data.from = rotY;
			aThis.anim360Data.to = rotY - 360;
			aThis.artFrameAllLayer.AnimateParent(aThis.anim360Data);
			aThis.artFrameAllLayer.layer.all.parent.core.EmitEvent('play');

			aThis.buttonPlay.ChangeSelf({property: 'obj-model', value:{obj: './assets/3d/buttons/pause.obj'} });
			aThis.buttonPlayText.ChangeSelf({property: 'text', value: {value:'Pause', width: 20, color: mainColor.base, align: "center", font: "exo2bold", zOffset: 0, side: 'double'} })
		} else {
			aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'notPlaying', value: true})
			aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'notMoving', value: true})
			clearInterval(playInterval);
			//Stop current animation
			aThis.artFrameAllLayer.layer.all.parent.core.EmitEvent('pause');
			aThis.buttonPlay.ChangeSelf({property: 'obj-model', value:{obj: './assets/3d/buttons/play.obj'} })
			aThis.buttonPlayText.ChangeSelf({property: 'text', value: {value:'Play', width: 20, color: mainColor.base, align: "center", font: "exo2bold", zOffset: 0, side: 'double'} })
		}
	}

	const Stop = () => {
		if(aThis.artFrameAllLayer.layer.all.parent.core.GetFlag('notPlaying')){} else {
			//Stop current animation
			//aThis.artFrameAllLayer.layer.all.parent.core.EmitEvent('pause');
			let rotY = aThis.artFrameAllLayer.GetParentEl().getAttribute('rotation').y;
			aThis.anim45MiscData.from = rotY;
			aThis.anim45MiscData.to = 1;
			aThis.artFrameAllLayer.AnimateParent(aThis.anim45MiscData);

			aThis.buttonPlay.ChangeSelf({property: 'obj-model', value:{obj: './assets/3d/buttons/play.obj'} });
			aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'notPlaying', value: true})
			aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'notMoving', value: true})
		}
	}

	const NextPage = () => {
		if(aThis.artFrameAllLayer.layer.all.parent.core.GetFlag('loadingPage')){} else {
			aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'loadingPage', value: true})
			if(currentPage === aThis.maxPage){
				currentPage = 0;
			} else {
				currentPage++;
			}
			updateAll();
		}
	}

	const PrevPage = () => {
		if(aThis.artFrameAllLayer.layer.all.parent.core.GetFlag('loadingPage')){} else {
			aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'loadingPage', value: true})
			if(currentPage === 0){
				currentPage = aThis.maxPage;
			} else {
				currentPage--;
			}
			updateAll();
		}
	}

	const RandomPage = () => {
		if(aThis.artFrameAllLayer.layer.all.parent.core.GetFlag('loadingPage')){} else {
			aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'loadingPage', value: true})
			currentPage = Math.floor(Math.random()*aThis.maxPage);
			updateAll();
		}
	}

	const Settings = () => {
		if(aThis.artFrameAllLayer.layer.all.parent.core.GetFlag('animating')){} else {
			aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'animating', value: true})
			settingTimeout = setTimeout(function () {
				aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'animating', value: false})
				clearTimeout(settingTimeout);
			}, 2050); //Delay
			if(aThis.artFrameAllLayer.layer.all.parent.core.GetFlag('setting') === 0){
				aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'setting', value: 1})
				aThis.artFrame0.EmitEvent('to0');
				aThis.artFrame1.EmitEvent('to0');
				aThis.artFrame2.EmitEvent('to0');
				aThis.artFrame3.EmitEvent('to0');
				aThis.artFrame4.EmitEvent('to0');
				aThis.artFrame5.EmitEvent('to0');
				aThis.artFrame6.EmitEvent('to0');
				aThis.artFrame7.EmitEvent('to0');
			} else {
				aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'setting', value: 0})
				aThis.artFrame0.EmitEvent('to1');
				aThis.artFrame1.EmitEvent('to1');
				aThis.artFrame2.EmitEvent('to1');
				aThis.artFrame3.EmitEvent('to1');
				aThis.artFrame4.EmitEvent('to1');
				aThis.artFrame5.EmitEvent('to1');
				aThis.artFrame6.EmitEvent('to1');
				aThis.artFrame7.EmitEvent('to1');
			}
		}
	}

	const Info = () => {
		if(aThis.artFrameAllLayer.layer.all.parent.core.GetFlag('info')){
		aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'info', value: false});
		} else {
		aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'info', value: true});
		}

	}

	return {core,GetEl,Forward,Backward,PlayPause,Stop,NextPage,PrevPage,RandomPage,Settings, Info}
}

/********************************************************************/
//
//Materials Library
//

//Frame Material
let paintingMaterial = {shader: "flat", color: "#55a5be", opacity: 1, alphaTest: 0.1};

//Tiles
//Kenny
const pattern49 = './assets/img/tiles/kenny/pattern_49.png';

/********************************************************************/
//
//Data Library

//
//Player
//Works with Swap-Controls component which needs to be integrated
this.playerRigData = {
data:'Player Base',
id:'playerRig',
entity: 'preAdded',
sources: false,
text: false,
geometry: false,
material: false,
position: new THREE.Vector3(0,0,0.5),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations: false,
mixins: false,
classes: ['a-ent','player'],
components: {
//['wasd-controls']:{enabled: true, acceleration: 25},
//['movement-controls']:{enabled: true, controls: 'gamepad, keyboard, touch', speed: 0.3, fly: false, constrainToNavMesh: false, camera: '#camera',},
},};

this.cameraData = {
data:'Camera Entity',
id:'camera',
entity: 'preAdded',
sources: false,
text: false,
geometry: false,
material: false,
position: new THREE.Vector3(0,1.6,0),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations: false,
mixins: false,
classes: ['a-ent','player'],
components: {
['look-controls']:{enabled: true, reverseMouseDrag: false, reverseTouchDrag: false, touchEnabled: true, mouseEnabled: true, pointerLockEnabled: false, magicWindowTrackingEnabled: true},
['wasd-controls']:{enabled: false},
},};

this.cameraUIData = {
data:'Camera UI',
id:'cameraUI',
sources: false,
text: {value:'Message', width: 0.5, color: "#FFFFFF", align: "center", font: "exo2bold", side: 'double', opacity: 0},
geometry: {primitive: 'plane', width: 0.3, height: 0.15},
material: {shader: "flat", color: "#ac2d2d", opacity: 0.69, side: 'both'},
position: new THREE.Vector3(0,0.05,-0.5),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations: {
opacinbk:{property: 'components.material.material.opacity', from: 0, to: 0.82, dur: 750, delay: 0, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'cameraMsg',}, 
opacoutbk:{property: 'components.material.material.opacity', from: 0.82, to: 0, dur: 750, delay: 2000, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'cameraMsg',},
opacintxt:{property: 'text.opacity', from: 0, to: 0.82, dur: 750, delay: 0, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'cameraMsg',}, 
opacouttxt:{property: 'text.opacity', from: 0.82, to: 0, dur: 750, delay: 2000, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'cameraMsg',},
},
mixins: false,
classes: ['a-ent','player'],
components: {
visible: false,
},
}

this.mouseControllerData = {
data:'Mouse Controller',
id:'mouseController',
sources: false,
text: false,
geometry: {primitive: 'ring', radiusInner: 0.005, radiusOuter: 0.01},
material: {shader: "flat", color: "#228da7", opacity: 0.75, side: 'double'},
position: new THREE.Vector3(0,0,-0.5),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(0.75,0.75,0.75),
animations: {
click:{property: 'scale', from: '0.75 0.75 0.75', to: '0.15 0.15 0.15', dur: 100, delay: 0, loop: 'false', dir: 'normal', easing: 'easeInCubic', elasticity: 400, autoplay: false, enabled: true, startEvents: 'click'},
click2:{property: 'scale', from: '0.15 0.15 0.15', to: '0.25 0.25 0.25', dur: 25, delay: 100, loop: 'false', dir: 'normal', easing: 'easeInCubic', elasticity: 400, autoplay: false, enabled: true, startEvents: 'click'},
clickreset:{property: 'scale', from: '0.25 0.25 0.25', to: '0.75 0.75 0.75', dur: 300, delay: 400, loop: 'false', dir: 'normal', easing: 'easeInCubic', elasticity: 400, autoplay: false, enabled: true, startEvents: 'click'},
},
mixins: false,
classes: ['a-ent','player'],
components: {
raycaster:{enabled: 'true', autoRefresh: 'true', objects: '.clickable', origin: new THREE.Vector3(0,0,0), direction: new THREE.Vector3(0,0,-1), far: 'Infinity', near: 0, interval: 0, lineColor: 'red', lineOpacity: 0.5, showLine: 'false', useWorldCoordinates: 'false'},
cursor: {fuse: 'false', rayOrigin: 'mouseController', mouseCursorStylesEnabled: 'true'},
},};

this.vrControllerData = {
data:'VR Controller',
id:'vrController',
sources: false,
text: false,
geometry: {primitive: 'ring', radiusInner: 0.02, radiusOuter: 0.03},
material: {shader: "flat", color: "#228da7", opacity: 0.75, side: 'double'},
position: new THREE.Vector3(0,0,-1),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(0.15,0.15,0.15),
animations: false,
mixins: false,
classes: ['a-ent','player'],
components: {
//['detect-inputs']:null,
visible: 'false',
},
};

this.vrControllerUIData = {
data:'VR Controller UI',
id:'vrControllerUI',
sources: false,
text: {value:'Controller UI', width: 0.5, color: "#FFFFFF", align: "center", font: "exo2bold"},
geometry: {primitive: 'plane', width: 0.25, height: 0.1},
material: {shader: "flat", color: "#ac2d2d", opacity: 0.75, side: 'double'},
position: new THREE.Vector3(-0.15,-0.15,-0.25),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(0.5,0.5,0.5),
animations: false,
mixins: false,
classes: ['a-ent','player'],
components: {visible: 'false',},
};

this.playerFloorData = {
data:'Player Floor',
id:'playerFloor',
sources: false,
text: false,
geometry: {primitive: 'circle', radius: 1, segments: 32, thetaStart: 0, thetaLength: 360},
material: {shader: "flat", color: "#3EB489", opacity: 0.69, side: 'both'},
position: new THREE.Vector3(0,0.05,0),
rotation: new THREE.Vector3(-90,0,0),
scale: new THREE.Vector3(1,1,1),
animations: false,
mixins: false,
classes: ['a-ent','player'],
components: false,
};

this.fadeScreenData = {
data:'Fade Screen',
id:'fadeScreen',
sources: false,
text: false,
geometry: {primitive: 'plane', width: 1, height: 0.5},
material: {shader: "flat", color: "#000000", opacity: 0},
position: new THREE.Vector3(0,0,-0.15),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations: {
fadein:{property: 'components.material.material.opacity', from: 0, to: 1, dur: 400, delay: 0, loop: 'false', dir: 'normal', easing: 'easeOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'fade'},

fadeout:{property: 'components.material.material.opacity', from: 1, to: 0, dur: 400, delay: 800, loop: 'false', dir: 'normal', easing: 'easeInSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'fade'}, 
},
mixins: false,
classes: ['a-ent','player','clickable'],
components: {visible: false},
};

this.sphereScreenData = {
data:'Sphere Screen',
id:'sphereScreen',
sources: false,
text: false,
geometry: {primitive: 'sphere', radius: 0.125, segmentsWidth: 36, segmentsHeight: 18, phiLength: 360, phiStart: 0, thetaLength: 0, thetaStart: 90},
material: {shader: "flat", color: "#000000", opacity: 1, side: 'double'},
position: new THREE.Vector3(0,0,0),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations:{
spherein1:{property: 'geometry.thetaLength', from: 0, to: 180, dur: 400, delay: 0, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'sphere'},
spherein2: {property: 'geometry.thetaStart', from: 90, to: 0, dur: 400, delay: 0, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'sphere'},

sphereout1:{property: 'geometry.thetaLength', from: 180, to: 0, dur: 400, delay: 800, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'sphere'},
sphereout2: {property: 'geometry.thetaStart', from: 0, to: 90, dur: 400, delay: 800, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'sphere'},
},
mixins: false,
classes: ['a-ent','player'],
components: {visible: false},
};

this.blink1ScreenData = {
data:'Blink 1 Screen',
id:'blink1Screen',
sources: false,
text: false,
geometry: {primitive: 'plane', width: 5, height: 2},
material: {shader: "flat", color: "#000000", opacity: 0, side: 'double'},
position: new THREE.Vector3(0,2.5,-0.15),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations:{
blinkin:{property: 'object3D.position.y', from: 2.5, to: 1, dur: 400, delay: 0, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'blink'},
blinkopacin: {property: 'components.material.material.opacity', from: 0, to: 1, dur: 400, delay: 0, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'blink'},

blinkout:{property: 'object3D.position.y', from: 1, to: 2.5, dur: 400, delay: 800, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'blink'},
blinkopacout: {property: 'components.material.material.opacity', from: 1, to: 0, dur: 400, delay: 800, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'blink'},
},
mixins: false,
classes: ['a-ent','player'],
components: {visible: false},
};

this.blink2ScreenData = {
data:'Blink 2 Screen',
id:'blink2Screen',
sources: false,
text: false,
geometry: {primitive: 'plane', width: 5, height: 2},
material: {shader: "flat", color: "#000000", opacity: 0, side: 'double'},
position: new THREE.Vector3(0,-2.5,-0.15),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations:{
blinkin:{property: 'object3D.position.y', from: -2.5, to: -1, dur: 400, delay: 0, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'blink'},
blinkopacin: {property: 'components.material.material.opacity', from: 0, to: 1, dur: 400, delay: 0, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'blink'},

blinkout:{property: 'object3D.position.y', from: -1, to: -2.5, dur: 400, delay: 800, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'blink'},
blinkopacout: {property: 'components.material.material.opacity', from: 1, to: 0, dur: 400, delay: 800, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'blink'},
},
mixins: false,
classes: ['a-ent','player'],
components: {visible: false},
};

//
//Menu

//Menu Button Base
this.menuBaseData = {
data:'menu part',
id:'menuBaseTemp',
sources:false,
text: {value:'Hmmm...', wrapCount: 20, color: "#FFFFFF", font: "exo2bold", zOffset: 0.025, side: 'double', align: "center", baseline: 'center'},
geometry: {primitive: 'box', depth: 0.04, width: 0.4, height: 0.15},
material: {shader: "standard", color: "#c1664b", opacity: 1, metalness: 0.2, roughness: 0.8, emissive: "#c1664b", emissiveIntensity: 0.6},
position: new THREE.Vector3(0,0,0),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations:{
click1:{property: 'scale', from: '1 1 1', to: '1.05 1.05 1.05', dur: 125, delay: 0, loop: '1', dir: 'alternate', easing: 'easeInOutElastic', elasticity: 400, autoplay: false, enabled: true, startEvents: 'click'},
click2:{property: 'material.emissiveIntensity', from: '0.6',to: '0.8', dur: 125, delay: 0, loop: '1', dir: 'alternate', easing: 'easeInOutElastic', elasticity: 400, autoplay: false, enabled: true, startEvents: 'click'},
},
mixins: false,
classes: ['clickable','a-ent'],
components: {
['look-at']:'#camera',
},
};

//
//Details & Prompt

//Detail Main View
this.detailMainData = {
data:'detail main',
id:'detailMain',
sources:false,
text: {value:'Details...', color: "#FFFFFF", align: "center", font: "exo2bold", zOffset: 0.065, side: 'double'},
geometry: {primitive: 'box', depth: 0.1, width: 1, height: 1},
material: {shader: "standard", color: "#4bb8c1", opacity: 1, metalness: 0.2, roughness: 0.8, emissive: "#4bb8c1", emissiveIntensity: 0.6},
position: new THREE.Vector3(0,1.5,-1.5),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(0,0,0),
animations:{opening:{property: 'scale', from: '0.001 0.001 0.001', to: '1 1 1', dur: 500, delay: 50, loop: 'false', dir: 'linear', easing: 'easeInOutElastic', elasticity: 400, autoplay: true, enabled: true, startEvents: 'open'}, close: {property: 'scale', from: '1 1 1', to: '0.001 0.001 0.001', dur: 500, delay: 50, loop: false, dir: 'linear', easing: 'easeInOutElastic', elasticity: 400, autoplay: false, enabled: true, startEvents: 'close'}},
mixins: false,
classes: ['a-ent'],
components: {detailprompt:{type: 'detail'}},
};
//Detail Close Button
this.detailCloseData = {
data:'detail close',
id:'detailClose',
sources:false,
text: {value:'X', width: 3, color: "#FFFFFF", align: "center", font: "exo2bold", zOffset: 0.065, side: 'double'},
geometry: {primitive: 'box', depth: 0.1, width: 0.25, height: 0.25},
material: {shader: "standard", color: "#c14b4b", opacity: 1, metalness: 0.2, roughness: 0.8, emissive: "#c14b4b", emissiveIntensity: 0.6},
position: new THREE.Vector3(0.5,0.5,0.05),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(0,0,0),
animations:{opening:{property: 'scale', from: '0.001 0.001 0.001', to: '1 1 1', dur: 500, delay: 50, loop: 'false', dir: 'linear', easing: 'easeInOutElastic', elasticity: 400, autoplay: true, enabled: true, startEvents: 'open'}, close: {property: 'scale', from: '1 1 1', to: '0.001 0.001 0.001', dur: 500, delay: 50, loop: false, dir: 'linear', easing: 'easeInOutElastic', elasticity: 400, autoplay: false, enabled: true, startEvents: 'close'}},
mixins: false,
classes: ['clickable','a-ent'],
components: {detailprompt:{type: 'detail'}},
};

//
//Speech System TextBubble
//Scene Text
this.sceneTextData = {
data:'Scene display text.',
id:'sceneText',
sources:false,
text: {value:'... ... ...', color: "#FFFFFF", align: "left", font: "exo2bold", width: 1.9, zOffset: 0.025, side: 'front', wrapCount: 75, baseline: 'center'},
geometry: {primitive: 'box', depth: 0.025, width: 2, height: 0.3},
material: {shader: "standard", color: "#4bb8c1", opacity: 1, metalness: 0.2, roughness: 0.8, emissive: "#4bb8c1", emissiveIntensity: 0.6},
position: new THREE.Vector3(0,0.69,-0.8),
rotation: new THREE.Vector3(-30,0,0),
scale: new THREE.Vector3(1,1,1),
animations: false,
mixins: false,
classes: ['clickable','a-ent'],
components: false,
};

//
//Environment

//
//Lights

//Directional - Built-in
this.directionalLightData = {
data:'directionalLight',
id:'directionalLight',
entity: 'preAdded',
sources: false,
text: false,
geometry: false,
material: false,
position: new THREE.Vector3(-1,1,-1),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations: {
daylight:{property: 'light.intensity', from: 0.1, to: 1.25, dur: aThis.timeInDay/4, delay: 0, loop: 'true', dir: 'alternate', easing: 'linear', elasticity: 400, autoplay: false, enabled: true, startEvents: 'sunrise'},
daypos:{property: 'position', from: new THREE.Vector3(-1,1,-1), to: new THREE.Vector3(1,1,1), dur: aThis.timeInDay/2, delay: 0, loop: '1', dir: 'alternate', easing: 'linear', elasticity: 400, autoplay: false, enabled: true, startEvents: 'sunrise'},
},
mixins: false,
classes: ['a-ent'],
components: {
light: {type: 'directional', intensity: 0.1, castShadow: false},
},
};

//Ambient - Built-in
this.ambientLightData = {
data:'ambientLight',
id:'ambientLight',
entity: 'preAdded',
sources: false,
text: false,
geometry: false,
material: false,
position: new THREE.Vector3(0,0,0),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations: {
daylight:{property: 'light.intensity', from: 0.7, to: 0.4, dur: aThis.timeInDay/2, delay: 0, loop: 'true', dir: 'alternate', easing: 'linear', elasticity: 400, autoplay: false, enabled: true, startEvents: 'sunrise'},
daycolor:{property: 'light.color', from: '#99154E', to: '#fffb96', dur: aThis.timeInDay/4, delay: 0, loop: '1', dir: 'alternate', easing: 'linear', elasticity: 400, autoplay: false, enabled: true, startEvents: 'sunrise'},
},
mixins: false,
classes: ['a-ent'],
components: {
light: {type: 'ambient', intensity: 0.7, color: '#716a9a'},
},
};

//Directional 2
this.directionalLight2Data = {
data:'directionalLight2',
id:'directionalLight2',
sources: false,
text: false,
geometry: false,
material: false,
position: new THREE.Vector3(1,1,1),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations: {
nightlight:{property: 'light.intensity', from: 0.3, to: 0.1, dur: aThis.timeInDay/4, delay: 0, loop: 'true', dir: 'alternate', easing: 'linear', elasticity: 400, autoplay: false, enabled: true, startEvents: 'sunrise'},
daypos:{property: 'position', from: new THREE.Vector3(1,1,1), to: new THREE.Vector3(-1,1,-1), dur: aThis.timeInDay/2, delay: 0, loop: '1', dir: 'alternate', easing: 'linear', elasticity: 400, autoplay: false, enabled: true, startEvents: 'sunrise'},

},
mixins: false,
classes: ['a-ent'],
components: {
light: {type: 'directional', intensity: 0.3, castShadow: false},
},
};

//Sun
this.sunOuterData = {
data:'sunOuter',
id:'sunOuter',
sources: false,
text: false,
geometry: false,
material: false,
position: new THREE.Vector3(0,0,0),
rotation: new THREE.Vector3(-10,45,0),
scale: new THREE.Vector3(1,1,1),
animations:{daynight:{property: 'object3D.rotation.x', from: -5, to: 355, dur: aThis.timeInDay, delay: 0, loop: 'true', dir: 'normal', easing: 'linear', elasticity: 400, autoplay: false, enabled: true,startEvents: 'sunrise'},},
mixins: false,
classes: ['a-ent'],
components: false,
};
this.sunData = {
data:'sun',
id:'sun',
sources: false,
text: false,
geometry: {primitive: 'circle', radius: 30, segments: 32},
material: {shader: "standard", color: "#F0A500", opacity: 1, side: 'front', emissive: '#F0A500', emissiveIntensity: 1, roughness: 0.42},
position: new THREE.Vector3(0,0,-350),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations: false,
mixins: false,
classes: ['a-ent'],
components: false,
};

//Moon
this.moonOuterData = {
data:'moonOuter',
id:'moonOuter',
sources: false,
text: false,
geometry: false,
material: false,
position: new THREE.Vector3(0,0,0),
rotation: new THREE.Vector3(170,45,0),
scale: new THREE.Vector3(1,1,1),
animations:{daynight:{property: 'object3D.rotation.x', from: 175, to: 535, dur: aThis.timeInDay, delay: 0, loop: 'true', dir: 'normal', easing: 'linear', elasticity: 400, autoplay: false, enabled: true,startEvents: 'sunrise'},},
mixins: false,
classes: ['a-ent'],
components: false,
};
this.moonData = {
data:'moon',
id:'moon',
sources: false,
text: false,
geometry: {primitive: 'circle', radius: 24, segments: 32},
material: {shader: "standard", color: "#5c2196", opacity: 1, side: 'front', emissive: '#5c2196', emissiveIntensity: 0.75, roughness: 0.42},
position: new THREE.Vector3(0,0,-350),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations: false,
mixins: false,
classes: ['a-ent'],
components: false,
};

//Palm Tree
this.palmTreeData = {
data:'palmTree',
id:'palmTree',
sources: false,
text: false,
geometry: false,
material: {shader: "standard", color: "#1da21d", opacity: 1, metalness: 0.2, roughness: 0.42, emissive: "#1da21d", emissiveIntensity: 0.1, wireframe: false,},
position: new THREE.Vector3(0,-1,0),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,0.75,1),
animations: false,
mixins: false,
classes: ['a-ent'],
components:{
['obj-model']:{obj: './assets/3d/palmtree.obj'},
},
};

//
//Multi Palm Trees
this.multiPalmTreeData = {
id: 'multiPalmTree',
objData: aThis.palmTreeData,
total: 22,
outerRingRadius: 25,
innerRingRadius: 15,
sameTypeRadius: 7,
otherTypeRadius: 2,
yPos: 0,
ranYPos: false,
yPosFlex: 0,
ranScaleX: false,
ranScaleY: true,
ranScaleZ: false,
scaleFlex: 0.5,
ranRotX: false,
ranRotY: true,
ranRotZ: false,
ranColor: true,
ranTexture: false,
};

//Floor
//

//Node Floor
this.nodeFloorData = {
data:'full floor',
id:'nodeFloor',
sources:false,
text: false,
geometry: {primitive: 'sphere', radius: 100, segmentsWidth: 10, segmentsHeight: 10, phiLength: 180},
material: {shader: "standard", color: "#298625", opacity: 1, metalness: 0.6, roughness: 0.4, emissive: "#298625", emissiveIntensity: 0.2, side: 'front'},
position: new THREE.Vector3(0,-2,0),
rotation: new THREE.Vector3(-90,0,0),
scale: new THREE.Vector3(0.5,0.5,0.02),
animations: false,
mixins: false,
classes: ['a-ent'],
components: false,
};

//Background | Sky
//

//3GradDualSky
this.skyGradData = {
data: 'sky gradient',
id: 'skyGrad',
entity: 'a-sky',
sources: false,
text: false,
geometry: false,
material: {shader: 'threeColorGradientShader', topColor: '#613381', middleColor: '#99154E', bottomColor: '#b967ff'},
position: new THREE.Vector3(0,0,0),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations: {
sunrisetop:{property: 'material.topColor', from: '#613381', to: '#01cdfe', dur: aThis.timeInDay/6, delay: 0, loop: 'false', dir: 'normal', easing: 'linear', elasticity: 400, autoplay: false, enabled: true, startEvents: 'sunrise'},
sunrisemid:{property: 'material.middleColor', from: '#99154E', to: '#fffb96', dur: aThis.timeInDay/6, delay: 0, loop: 'false', dir: 'normal', easing: 'linear', elasticity: 400, autoplay: false, enabled: true, startEvents: 'sunrise'}, 
sunsettop:{property: 'material.topColor', from: '#01cdfe', to: '#613381', dur: aThis.timeInDay/6, delay: 0, loop: 'false', dir: 'normal', easing: 'linear', elasticity: 400, autoplay: false, enabled: true, startEvents: 'sunset'},
sunsetmid:{property: 'material.middleColor', from: '#fffb96', to: '#99154E', dur: aThis.timeInDay/6, delay: 0, loop: 'false', dir: 'normal', easing: 'linear', elasticity: 400, autoplay: false, enabled: true, startEvents: 'sunset'}, 
},
mixins: false,
classes: ['a-ent'],
components: false,
};

//Title
this.titleTextData = {
data: 'Title Text',
id:'titleText',
sources: false,
text: {value:'Art Institute of Chicago XR Gallery\n by Minty Crisp', width: 15, color: "#FFFFFF", align: "center", font: "exo2bold", zOffset: 0, side: 'double'},
geometry: false,
material: false,
position: new THREE.Vector3(0,8,-12),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations: false,
mixins: false,
classes: ['a-ent'],
components: false,
};

//Warning Message
this.warningTextData = {
data: 'Warning Text',
id:'warningText',
sources: false,
text: {value:'Warning: This website contains images that may contain nudity.\n Viewer discretion is advised.\n If you are not of legal age or do not wish to view such content,\n please navigate away from this website.', width: 15, color: "#FFFFFF", align: "center", font: "exo2bold", zOffset: 0, side: 'double'},
geometry: false,
material: false,
position: new THREE.Vector3(0,8,12),
rotation: new THREE.Vector3(0,180,0),
scale: new THREE.Vector3(1,1,1),
animations: false,
mixins: false,
classes: ['a-ent'],
components: false,
};

//Button Parent
this.buttonParentData = {
data: 'Button Parent',
id:'buttonParent',
sources: false,
text: false,
geometry: false,
material: false,
position: new THREE.Vector3(0,0,0),
rotation: new THREE.Vector3(0,80,0),
scale: new THREE.Vector3(1,1,1),
animations:{
scaleclick:{property: 'scale', from: '1 1 1', to: '1.05 1.05 1.05', dur: 125, delay: 0, loop: '1', dir: 'alternate', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'click'},
},
mixins: false,
classes: ['a-ent'],
components: false,
};

//Button Obj
this.buttonObjData = {
data: 'Button Obj',
id:'buttonObj',
sources: false,
text: false,
geometry: false,
material: {shader: "flat", color: mainColor.base, opacity: 1},
position: new THREE.Vector3(0,0.4,-2.5),
rotation: new THREE.Vector3(-30,0,0),
scale: new THREE.Vector3(0.1,0.1,0.1),
animations:false,
mixins: false,
classes: ['a-ent'],
components: false,
};

//Button Border
this.buttonBorderData = {
data: 'Button Border',
id:'buttonBorder',
sources: false,
text: false,
geometry: false,
material: {shader: "flat", color: mainColor.splitCompl[0], opacity: 1},
position: new THREE.Vector3(0,0,0),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations:false,
mixins: false,
classes: ['a-ent'],
components: {
['obj-model']:{obj: './assets/3d/buttons/border.obj'},
},
};

//Button Click Background
this.buttonClickData = {
data: 'Button Click Background',
id:'buttonClick',
sources: false,
text: false,
geometry: {primitive: 'circle', radius: 2, segments: 12},
material: {shader: "flat", color: mainColor.splitCompl[1], opacity: 0.5, side: 'double'},
position: new THREE.Vector3(0,0,0),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations:false,
mixins: false,
classes: ['clickable','a-ent'],
components: false,
};

//Button Click Background
this.buttonTextData = {
data: 'Button Text',
id:'buttonText',
sources: false,
text: {value:'Button', width: 20, color: mainColor.base, align: "center", font: "exo2bold", zOffset: 0, side: 'double'},
geometry: false,
material: false,
position: new THREE.Vector3(0,-2.75,0),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations:false,
mixins: false,
classes: ['clickable','a-ent'],
components: false,
};

//Art Frame Parent
this.artFrameParentData = {
data: 'Art Frame Parent',
id:'artFrameParent',
sources: false,
text: false,
geometry: false,
material: false,
position: new THREE.Vector3(0,0,0),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations: false,
mixins: false,
classes: ['a-ent'],
components: false,
};

//Art Frame
this.artFrameData = {
data: 'Art Frame',
id:'artFrame',
sources: false,
text: false,
geometry: {primitive: 'box', depth: 0.01, width: 4.4, height: 2.55},
material: paintingMaterial,
position: new THREE.Vector3(0,1.75,-6),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations: {
scale0:{property: 'scale', from: '1 1 1', to: '2 2 2', dur: 2000, delay: 0, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'to0'},
position0:{property: 'position', from: '0 1.75 -6', to: '0 3.5 -12', dur: 2000, delay: 0, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'to0'},
scale1:{property: 'scale', from: '2 2 2', to: '1 1 1', dur: 2000, delay: 0, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'to1'},
position1:{property: 'position', from: '0 3.5 -12', to: '0 1.75 -6', dur: 2000, delay: 0, loop: 'false', dir: 'normal', easing: 'easeInOutSine', elasticity: 400, autoplay: false, enabled: true, startEvents: 'to1'},
},
mixins: false,
classes: ['a-ent'],
components: false,
};

//Art Frame
this.artFrameTextData = {
data: 'Art Frame Text',
id:'artFrameText',
sources: false,
text: {value:'Art Frame Text', width: 3, color: "#FFFFFF", align: "center", font: "exo2bold", zOffset: 0, side: 'double'},
geometry: false,
material: false,
position: new THREE.Vector3(0,-1.5,0),
rotation: new THREE.Vector3(0,0,0),
scale: new THREE.Vector3(1,1,1),
animations: false,
mixins: false,
classes: ['a-ent'],
components: false,
};

//
//Animations

//Rotate 45
this.anim45Data = {
	name: 'anim45',
	property: 'object3D.rotation.y',
	from: '0',
	to: '45', 
	dur: 1000, 
	delay: 0, 
	loop: 'false', 
	dir: 'normal', 
	easing: 'easeInOutSine', 
	elasticity: 400, 
	autoplay: true, 
	enabled: true,
};
//Rotate 90
this.anim90Data = {
	name: 'anim90',
	property: 'object3D.rotation.y',
	from: '0',
	to: '90', 
	dur: 2500,
	delay: 0, 
	loop: 'false', 
	dir: 'normal', 
	easing: 'easeInOutSine', 
	elasticity: 400, 
	autoplay: true, 
	enabled: true,
};
//Rotate 360
this.anim360Data = {
	name: 'anim360',
	property: 'object3D.rotation.y',
	from: '0',
	to: '360', 
	dur: 120000, 
	delay: 0, 
	loop: 'true', 
	dir: 'normal', 
	easing: 'linear', 
	elasticity: 400, 
	autoplay: false, 
	enabled: true,
	startEvents: 'play',
	pauseEvents: 'pause',
};
//Rotate 45 from Misc
this.anim45MiscData = {
	name: 'anim45misc',
	property: 'object3D.rotation.y',
	from: '0',
	to: '1', 
	dur: 500, 
	delay: 0, 
	loop: 'false', 
	dir: 'normal', 
	easing: 'easeInOutSine', 
	elasticity: 400, 
	autoplay: true, 
	enabled: true,
};


//
//World Atlas Map & Node Data

//
//Zone 0
this.zone0Data = {
info:{
id: 'zone0',
name: 'Zone',
zoneNum: 0,
start: 'zone0Node0',
},
};

//
//Node0
this.zone0Node0Data = {
info:{
id:'zone0Node0',
name: 'Start',
description: 'Node 0',
sceneText: false,
},
zone:{},
start:{
nodeFloor:{ChangeSelf:{property: 'material', value: {src: pattern49, repeat: '100 100', color: "#298625", emissive: "#298625",},}},
titleText:{AddToScene:null},
warningText:{AddToScene:null},
buttonBackwardLayer:{AddAllToScene:null},
buttonHashtagLayer:{AddAllToScene:null},
buttonForwardLayer:{AddAllToScene:null},
buttonLeftSkipLayer:{AddAllToScene:null},
buttonPlayLayer:{AddAllToScene:null},
buttonRightSkipLayer:{AddAllToScene:null},
buttonSettingsLayer:{AddAllToScene:null},
buttonStopLayer:{AddAllToScene:null},
artFrameAllLayer:{AddAllToScene:null},
multiPalmTree:{genCores: null, SpawnAll: null},
},
delay:{
},
interval:{
},
event:{},
interaction:{
click: {
buttonForwardGallery:{Forward: null},
buttonBackwardGallery:{Backward: null},
buttonRightSkipGallery:{NextPage: null},
buttonLeftSkipGallery:{PrevPage: null},
buttonPlayGallery:{PlayPause: null},
buttonStopGallery:{Info: null},
buttonHashtagGallery:{RandomPage: null},
buttonSettingsGallery:{Settings: null},
},
},
exit:{},
map:{data: this.zone0Data.zone0Node0,},
};

/********************************************************************/
//Art Institute of Chicago API Support
//

//--header 'AIC-User-Agent: aic-xr-gallery (minty-crisp@protonmail.com)'
this.maxPage = 13209;
let art = {};
let currentPage = Math.floor(Math.random()*this.maxPage);

const img_url = "https://api.artic.edu/api/v1/artworks/";
let mainUrl = '';
let domain = '';
let id = '';
let end = '/full/843,/0/default.jpg';

async function getImgSrc(idNum){
	const response = await fetch(img_url + idNum);
	var data = await response.json();
	//console.log(data);

	//Get this once, then keep
	//console.log(data.config['iiif_url']);
	//	https://www.artic.edu/iiif/2

	//Append imageID
	//console.log(data.data['image_id']);
	//	1adf2696-8489-499b-cad2-821d7fde4b33

	//add this
	//	/full/843,/0/default.jpg

	domain = data.config['iiif_url'] + '/';
	id = data.data['image_id'];

	if(id){
		mainUrl = domain + id + end;
		//console.log(mainUrl)
		//Working Image
		//https://www.artic.edu/iiif/2/1adf2696-8489-499b-cad2-821d7fde4b33/full/843,/0/default.jpg
	} else {
		console.log('API missing image_id');
		mainUrl = './assets/img/api-error.jpg'
		//mainUrl = 'https://cdn.glitch.global/aee11787-4b00-4871-848e-af58f9f6147b/api-error.jpg?v=1673133033802'
	}
		return mainUrl;
}

async function updateFrame(frame, frameText, textValue, imgUrlWait){
	const imgSrc = await imgUrlWait;
	//console.log(frame)
	//console.log(imgSrc)
	aThis[frame].ChangeSelf({property: 'material', value:{src: imgSrc,shader: "flat", color: "#FFFFFF", opacity: 1}})
	aThis[frameText].ChangeSelf({property: 'text', value:{value: textValue, width: 3, color: "#FFFFFF", align: "center", font: "exo2bold", zOffset: 0, side: 'double'}})

}

const pageUrlPrefix = "https://api.artic.edu/api/v1/artworks?page=";
const pageUrlPostfix = '&limit=8';

async function getPage(num){

	if(art[num]){
		//console.log('Page exists, do not redownload');
	} else {
		let url = pageUrlPrefix + num + pageUrlPostfix;
		const response = await fetch(url);
		var data = await response.json();

		//Page Info
		//data.pagination.total
		//data.pagination.limit
		//data.pagination.offset
		//data.pagination.total_pages
		//data.pagination.current_page
		//data.pagination.prev_url
		//data.pagination.next_url
		art[data.pagination.current_page] = {};
		//0-8 image info
		//data.data.0.id
		//data.data.0.api_link
		//data.data.0.title
		//data.data.0.artist_title
		let imagesInfo = data.data;
		for(let each in imagesInfo){
			//console.log(imagesInfo[each].id);
			//console.log(imagesInfo[each].title);
			//console.log(imagesInfo[each].artist_title);
			art[data.pagination.current_page][each] = {};
			art[data.pagination.current_page][each].id = imagesInfo[each].id;
			art[data.pagination.current_page][each].title = imagesInfo[each].title;
			art[data.pagination.current_page][each].artist = imagesInfo[each].artist_title;
		}
	}
	//console.log(art);
	return true;
}

async function updateAll(){
	if(await getPage(currentPage)){
		for(let each in art[currentPage]){
			//console.log(art[currentPage][each]);
			//let srcUrl = await getImgSrc(art[currentPage][each].id);
			updateFrame('artFrame'+each, 'artFrameText'+each, art[currentPage][each].title, await getImgSrc(art[currentPage][each].id));
		}
aThis.artFrameAllLayer.layer.all.parent.core.SetFlag({flag:'loadingPage', value: false})
	}
}

async function updateBackTwo(){
	if(await getPage(currentPage)){
		let current = aThis.artFrameAllLayer.layer.all.parent.core.GetFlag('rotate');
		let update2 = [];
		let num;
		if(current === 0){
			update2 = [4,5];
		} else if(current === 1){
			update2 = [2,3];
		} else if(current === 2){
			update2 = [0,1];
		} else if(current === 3){
			update2 = [6,7];
		}
		for(let each in update2){
			num = update2[each];
			updateFrame('artFrame'+num, 'artFrameText'+num, art[currentPage][num].title, await getImgSrc(art[currentPage][num].id));
		}
	}
}

async function updateBack(){
	if(await getPage(currentPage)){
		let current = aThis.artFrameAllLayer.layer.all.parent.core.GetFlag('autoRotate');
		let num;
		if(current === 0){
			num = 3;
		} else if(current === 1){
			num = 2;
		} else if(current === 2){
			num = 1;
		} else if(current === 3){
			num = 0;
		} else if(current === 4){
			num = 7;
		} else if(current === 5){
			num = 6;
		} else if(current === 6){
			num = 5;
		} else if(current === 7){
			num = 4;
		}
		updateFrame('artFrame'+num, 'artFrameText'+num, art[currentPage][num].title, await getImgSrc(art[currentPage][num].id));
	}
}



/********************************************************************/
//
//Core, Layer & Aux Library

//
//Player
this.playerRig = Core(this.playerRigData);
this.camera = Core(this.cameraData);
this.cameraUI = Core(this.cameraUIData);
this.mouseController = Core(this.mouseControllerData);
this.vrController = Core(this.vrControllerData);
this.vrControllerUI = Core(this.vrControllerUIData);
this.playerFloor = Core(this.playerFloorData);
this.fadeScreen = Core(this.fadeScreenData);
this.sphereScreen = Core(this.sphereScreenData);
this.blink1Screen = Core(this.blink1ScreenData);
this.blink2Screen = Core(this.blink2ScreenData);

this.playerAll = {
parent: {core: this.playerRig},
child0: {
	parent: {core: this.camera},
	child0: {core: this.mouseController},
	child1: {core: this.cameraUI},
	child2: {core: this.fadeScreen},
	child3: {core: this.sphereScreen},
	child4: {core: this.blink1Screen},
	child5: {core: this.blink2Screen},
},
child1: {
	parent: {core: this.vrController},
	child0: {core: this.vrControllerUI},
},
child2: {core: this.playerFloor},
}

//SPECIAL : Player Base and Child Camera entity are already in HTML and Layer has special exceptions for it
this.playerLayer = Layer('playerLayer', this.playerAll);

//Main User Player
this.player = Player(this.playerLayer);

//
//Environment

//Lights
this.directionalLight = Core(this.directionalLightData);
this.directionalLight2 = Core(this.directionalLight2Data);
this.ambientLight = Core(this.ambientLightData);
//Sun
this.sunOuter = Core(this.sunOuterData);
this.sun = Core(this.sunData);
this.sunLayerData = {
parent: {core: this.sunOuter},
child0: {core: this.sun},
}
this.sunLayer = Layer('sunLayer', this.sunLayerData);
//Moon
this.moonOuter = Core(this.moonOuterData);
this.moon = Core(this.moonData);
this.moonLayerData = {
parent: {core: this.moonOuter},
child0: {core: this.moon},
}
this.moonLayer = Layer('moonLayer', this.moonLayerData);

//3Grad Dual Sky
this.skyGrad = Core(this.skyGradData);

//Node Floor
this.nodeFloor = Core(this.nodeFloorData);

//Palm Trees
this.palmTree = Core(this.palmTreeData);
this.multiPalmTree = ObjsGenRing(this.multiPalmTreeData);

//Display Text
this.titleText = Core(this.titleTextData);
this.warningText = Core(this.warningTextData);

//Buttons

//Backward
this.buttonParentData.id = 'buttonBackwardParent';
this.buttonParentData.rotation = new THREE.Vector3(0,22.5,0);
this.buttonBackwardParent = Core(this.buttonParentData);
this.buttonObjData.components = {['obj-model']:{obj: './assets/3d/buttons/backward.obj'}};
this.buttonObjData.id = 'buttonBackward';
this.buttonBorderData.id = 'buttonBackwardBorder';
this.buttonClickData.id = 'buttonBackwardClick';
this.buttonTextData.id = 'buttonBackwardText';
this.buttonTextData.text.value = 'Back';
this.buttonBackward = Core(this.buttonObjData);
this.buttonBackwardBorder = Core(this.buttonBorderData);
this.buttonBackwardClick = Core(this.buttonClickData);
this.buttonBackwardGallery = Gallery(this.buttonBackwardClick);
this.buttonBackwardText = Core(this.buttonTextData);
//Forward
this.buttonParentData.id = 'buttonForwardParent';
this.buttonParentData.rotation = new THREE.Vector3(0,-22.5,0);
this.buttonForwardParent = Core(this.buttonParentData);
this.buttonObjData.components = {['obj-model']:{obj: './assets/3d/buttons/forward.obj'}};
this.buttonObjData.id = 'buttonForward';
this.buttonBorderData.id = 'buttonForwardBorder';
this.buttonClickData.id = 'buttonForwardClick';
this.buttonTextData.id = 'buttonForwardText';
this.buttonTextData.text.value = 'Forward';
this.buttonForward = Core(this.buttonObjData);
this.buttonForwardBorder = Core(this.buttonBorderData);
this.buttonForwardClick = Core(this.buttonClickData);
this.buttonForwardGallery = Gallery(this.buttonForwardClick);
this.buttonForwardText = Core(this.buttonTextData);
//Left Skip
this.buttonParentData.id = 'buttonLeftSkipParent';
this.buttonParentData.rotation = new THREE.Vector3(0,37.5,0);
this.buttonLeftSkipParent = Core(this.buttonParentData);
this.buttonObjData.components = {['obj-model']:{obj: './assets/3d/buttons/left_skip.obj'}};
this.buttonObjData.id = 'buttonLeftSkip';
this.buttonBorderData.id = 'buttonLeftSkipBorder';
this.buttonClickData.id = 'buttonLeftSkipClick';
this.buttonTextData.id = 'buttonLeftSkipText';
this.buttonTextData.text.value = 'Back Page';
this.buttonLeftSkip = Core(this.buttonObjData);
this.buttonLeftSkipBorder = Core(this.buttonBorderData);
this.buttonLeftSkipClick = Core(this.buttonClickData);
this.buttonLeftSkipGallery = Gallery(this.buttonLeftSkipClick);
this.buttonLeftSkipText = Core(this.buttonTextData);
//Pause
//this.buttonObjData.components = {['obj-model']:{obj: './assets/3d/buttons/pause.obj'}};
//this.buttonObjData.id = 'buttonObjPause';
//this.buttonBorderData.id = 'buttonBorderPause';
//this.buttonClickData.id = 'buttonClickPause';
//this.buttonPause = Core(this.buttonObjData);
//this.buttonPauseBorder = Core(this.buttonBorderData);
//this.buttonPauseClick = Core(this.buttonClickData);
//Play
this.buttonParentData.id = 'buttonPlayParent';
this.buttonParentData.rotation = new THREE.Vector3(0,-7.5,0);
this.buttonPlayParent = Core(this.buttonParentData);
this.buttonObjData.components = {['obj-model']:{obj: './assets/3d/buttons/play.obj'}};
this.buttonObjData.id = 'buttonPlay';
this.buttonBorderData.id = 'buttonPlayBorder';
this.buttonClickData.id = 'buttonPlayClick';
this.buttonTextData.id = 'buttonPlayText';
this.buttonTextData.text.value = 'Play';
this.buttonPlay = Core(this.buttonObjData);
this.buttonPlayBorder = Core(this.buttonBorderData);
this.buttonPlayClick = Core(this.buttonClickData);
this.buttonPlayGallery = Gallery(this.buttonPlayClick);
this.buttonPlayText = Core(this.buttonTextData);
//Right Skip
this.buttonParentData.id = 'buttonRightSkipParent';
this.buttonParentData.rotation = new THREE.Vector3(0,-37.5,0);
this.buttonRightSkipParent = Core(this.buttonParentData);
this.buttonObjData.components = {['obj-model']:{obj: './assets/3d/buttons/right_skip.obj'}};
this.buttonObjData.id = 'buttonRightSkip';
this.buttonBorderData.id = 'buttonRightSkipBorder';
this.buttonClickData.id = 'buttonRightSkipClick';
this.buttonTextData.id = 'buttonRightSkipText';
this.buttonTextData.text.value = 'Next Page';
this.buttonRightSkip = Core(this.buttonObjData);
this.buttonRightSkipBorder = Core(this.buttonBorderData);
this.buttonRightSkipClick = Core(this.buttonClickData);
this.buttonRightSkipGallery = Gallery(this.buttonRightSkipClick);
this.buttonRightSkipText = Core(this.buttonTextData);
//Settings
this.buttonParentData.id = 'buttonSettingsParent';
this.buttonParentData.rotation = new THREE.Vector3(0,-52.5,0);
this.buttonSettingsParent = Core(this.buttonParentData);
this.buttonObjData.components = {['obj-model']:{obj: './assets/3d/buttons/settings.obj'}};
this.buttonObjData.id = 'buttonSettings';
this.buttonBorderData.id = 'buttonSettingsBorder';
this.buttonClickData.id = 'buttonSettingsClick';
this.buttonTextData.id = 'buttonSettingsText';
this.buttonTextData.text.value = 'Scale';
this.buttonSettings = Core(this.buttonObjData);
this.buttonSettingsBorder = Core(this.buttonBorderData);
this.buttonSettingsClick = Core(this.buttonClickData);
this.buttonSettingsGallery = Gallery(this.buttonSettingsClick);
this.buttonSettingsText = Core(this.buttonTextData);
//Stop
this.buttonParentData.id = 'buttonStopParent';
this.buttonParentData.rotation = new THREE.Vector3(0,7.5,0);
this.buttonStopParent = Core(this.buttonParentData);
this.buttonObjData.components = {['obj-model']:{obj: './assets/3d/buttons/stop.obj'}};
this.buttonObjData.id = 'buttonStop';
this.buttonBorderData.id = 'buttonStopBorder';
this.buttonClickData.id = 'buttonStopClick';
this.buttonTextData.id = 'buttonStopText';
this.buttonTextData.text.value = 'Info';
this.buttonStop = Core(this.buttonObjData);
this.buttonStopBorder = Core(this.buttonBorderData);
this.buttonStopClick = Core(this.buttonClickData);
this.buttonStopGallery = Gallery(this.buttonStopClick);
this.buttonStopText = Core(this.buttonTextData);
//Hashtag
this.buttonParentData.id = 'buttonHashtagParent';
this.buttonParentData.rotation = new THREE.Vector3(0,52.5,0);
this.buttonHashtagParent = Core(this.buttonParentData);
this.buttonObjData.components = {['obj-model']:{obj: './assets/3d/buttons/hashtag.obj'}};
this.buttonObjData.id = 'buttonHashtag';
this.buttonBorderData.id = 'buttonHashtagBorder';
this.buttonClickData.id = 'buttonHashtagClick';
this.buttonTextData.id = 'buttonHashtagText';
this.buttonTextData.text.value = 'Random Page';
this.buttonHashtag = Core(this.buttonObjData);
this.buttonHashtagBorder = Core(this.buttonBorderData);
this.buttonHashtagClick = Core(this.buttonClickData);
this.buttonHashtagGallery = Gallery(this.buttonHashtagClick);
this.buttonHashtagText = Core(this.buttonTextData);

//Button Backward Layer
this.buttonBackwardLayerData = {
parent: {core: this.buttonBackwardParent}, 
child0: {
	parent: {core: this.buttonBackward}, 
	child0: {core: this.buttonBackwardBorder},
	child1: {core: this.buttonBackwardClick},
	child2: {core: this.buttonBackwardText},
},
};
this.buttonBackwardLayer = Layer('buttonBackwardLayer',this.buttonBackwardLayerData);

//Button Hashtag Layer
this.buttonHashtagLayerData = {
parent: {core: this.buttonHashtagParent}, 
child0: {
	parent: {core: this.buttonHashtag}, 
	child0: {core: this.buttonHashtagBorder},
	child1: {core: this.buttonHashtagClick},
	child2: {core: this.buttonHashtagText},
},
};
this.buttonHashtagLayer = Layer('buttonHashtagLayer',this.buttonHashtagLayerData);

//Button Forward Layer
this.buttonForwardLayerData = {
parent: {core: this.buttonForwardParent}, 
child0: {
	parent: {core: this.buttonForward}, 
	child0: {core: this.buttonForwardBorder},
	child1: {core: this.buttonForwardClick},
	child2: {core: this.buttonForwardText},
},
};
this.buttonForwardLayer = Layer('buttonForwardLayer',this.buttonForwardLayerData);

//Button Left Skip Layer
this.buttonLeftSkipLayerData = {
parent: {core: this.buttonLeftSkipParent}, 
child0: {
	parent: {core: this.buttonLeftSkip}, 
	child0: {core: this.buttonLeftSkipBorder},
	child1: {core: this.buttonLeftSkipClick},
	child2: {core: this.buttonLeftSkipText},
},
};
this.buttonLeftSkipLayer = Layer('buttonLeftSkipLayer',this.buttonLeftSkipLayerData);

//Button Play Layer
this.buttonPlayLayerData = {
parent: {core: this.buttonPlayParent}, 
child0: {
	parent: {core: this.buttonPlay}, 
	child0: {core: this.buttonPlayBorder},
	child1: {core: this.buttonPlayClick},
	child2: {core: this.buttonPlayText},
},
};
this.buttonPlayLayer = Layer('buttonPlayLayer',this.buttonPlayLayerData);

//Button Right Skip Layer
this.buttonRightSkipLayerData = {
parent: {core: this.buttonRightSkipParent}, 
child0: {
	parent: {core: this.buttonRightSkip}, 
	child0: {core: this.buttonRightSkipBorder},
	child1: {core: this.buttonRightSkipClick},
	child2: {core: this.buttonRightSkipText},
},
};
this.buttonRightSkipLayer = Layer('buttonRightSkipLayer',this.buttonRightSkipLayerData);

//Button Settings Layer
this.buttonSettingsLayerData = {
parent: {core: this.buttonSettingsParent}, 
child0: {
	parent: {core: this.buttonSettings}, 
	child0: {core: this.buttonSettingsBorder},
	child1: {core: this.buttonSettingsClick},
	child2: {core: this.buttonSettingsText},
},
};
this.buttonSettingsLayer = Layer('buttonSettingsLayer',this.buttonSettingsLayerData);

//Button Stop Layer
this.buttonStopLayerData = {
parent: {core: this.buttonStopParent}, 
child0: {
	parent: {core: this.buttonStop}, 
	child0: {core: this.buttonStopBorder},
	child1: {core: this.buttonStopClick},
	child2: {core: this.buttonStopText},
},
};
this.buttonStopLayer = Layer('buttonStopLayer',this.buttonStopLayerData);

//Art Frame 0
this.artFrameParentData.id = 'artFrameParent0';
this.artFrameParentData.rotation = new THREE.Vector3(0,-315,0);
this.artFrameParent0 = Core(this.artFrameParentData);
this.artFrameData.id = 'artFrame0',
this.artFrame0 = Core(this.artFrameData);
this.artFrameTextData.id = 'artFrameText0';
this.artFrameText0 = Core(this.artFrameTextData);

//Art Frame 1
this.artFrameParentData.id = 'artFrameParent1';
this.artFrameParentData.rotation = new THREE.Vector3(0,0,0);
this.artFrameParent1 = Core(this.artFrameParentData);
this.artFrameData.id = 'artFrame1',
this.artFrame1 = Core(this.artFrameData);
this.artFrameTextData.id = 'artFrameText1';
this.artFrameText1 = Core(this.artFrameTextData);

//Art Frame 2
this.artFrameParentData.id = 'artFrameParent2';
this.artFrameParentData.rotation = new THREE.Vector3(0,-45,0);
this.artFrameParent2 = Core(this.artFrameParentData);
this.artFrameData.id = 'artFrame2',
this.artFrame2 = Core(this.artFrameData);
this.artFrameTextData.id = 'artFrameText2';
this.artFrameText2 = Core(this.artFrameTextData);

//Art Frame 3
this.artFrameParentData.id = 'artFrameParent3';
this.artFrameParentData.rotation = new THREE.Vector3(0,-90,0);
this.artFrameParent3 = Core(this.artFrameParentData);
this.artFrameData.id = 'artFrame3',
//this.artFrameData.material.opacity = 0.5,
this.artFrame3 = Core(this.artFrameData);
this.artFrameTextData.id = 'artFrameText3';
//this.artFrameTextData.text.opacity = 0.5;
this.artFrameText3 = Core(this.artFrameTextData);

//Art Frame 4
this.artFrameParentData.id = 'artFrameParent4';
this.artFrameParentData.rotation = new THREE.Vector3(0,-135,0);
this.artFrameParent4 = Core(this.artFrameParentData);
this.artFrameData.id = 'artFrame4',
//this.artFrameData.material.opacity = 0,
this.artFrame4 = Core(this.artFrameData);
this.artFrameTextData.id = 'artFrameText4';
//this.artFrameTextData.text.opacity = 0;
this.artFrameText4 = Core(this.artFrameTextData);

//Art Frame 5
this.artFrameParentData.id = 'artFrameParent5';
this.artFrameParentData.rotation = new THREE.Vector3(0,-180,0);
this.artFrameParent5 = Core(this.artFrameParentData);
this.artFrameData.id = 'artFrame5',
//this.artFrameData.material.opacity = 0,
this.artFrame5 = Core(this.artFrameData);
this.artFrameTextData.id = 'artFrameText5';
//this.artFrameTextData.text.opacity = 0;
this.artFrameText5 = Core(this.artFrameTextData);

//Art Frame 6
this.artFrameParentData.id = 'artFrameParent6';
this.artFrameParentData.rotation = new THREE.Vector3(0,-225,0);
this.artFrameParent6 = Core(this.artFrameParentData);
this.artFrameData.id = 'artFrame6',
//this.artFrameData.material.opacity = 0,
this.artFrame6 = Core(this.artFrameData);
this.artFrameTextData.id = 'artFrameText6';
//this.artFrameTextData.text.opacity = 0;
this.artFrameText6 = Core(this.artFrameTextData);

//Art Frame 7
this.artFrameParentData.id = 'artFrameParent7';
this.artFrameParentData.rotation = new THREE.Vector3(0,-270,0);
this.artFrameParent7 = Core(this.artFrameParentData);
this.artFrameData.id = 'artFrame7',
//this.artFrameData.material.opacity = 0.5,
this.artFrame7 = Core(this.artFrameData);
this.artFrameTextData.id = 'artFrameText7';
//this.artFrameTextData.text.opacity = 0.5;
this.artFrameText7 = Core(this.artFrameTextData);

//All Frame Parent
this.artFrameParentData.id = 'artFrameParentAll';
this.artFrameParentData.rotation = new THREE.Vector3(0,1,0);
this.artFrameParentAll = Core(this.artFrameParentData);
//All Frames
this.artFrameAllLayerData = {
parent: {core: this.artFrameParentAll},
child0: {
	parent: {core: this.artFrameParent0}, 
	child0: {
		parent: {core: this.artFrame0}, 
		child0: {core: this.artFrameText0}, 
	},
},
child1: {
	parent: {core: this.artFrameParent1}, 
	child0: {
		parent: {core: this.artFrame1}, 
		child0: {core: this.artFrameText1}, 
	},
},
child2: {
	parent: {core: this.artFrameParent2}, 
	child0: {
		parent: {core: this.artFrame2}, 
		child0: {core: this.artFrameText2}, 
	},
},
child3: {
	parent: {core: this.artFrameParent3}, 
	child0: {
		parent: {core: this.artFrame3}, 
		child0: {core: this.artFrameText3}, 
	},
},
child4: {
	parent: {core: this.artFrameParent4}, 
	child0: {
		parent: {core: this.artFrame4}, 
		child0: {core: this.artFrameText4}, 
	},
},
child5: {
	parent: {core: this.artFrameParent5}, 
	child0: {
		parent: {core: this.artFrame5}, 
		child0: {core: this.artFrameText5}, 
	},
},
child6: {
	parent: {core: this.artFrameParent6}, 
	child0: {
		parent: {core: this.artFrame6}, 
		child0: {core: this.artFrameText6}, 
	},
},
child7: {
	parent: {core: this.artFrameParent7}, 
	child0: {
		parent: {core: this.artFrame7}, 
		child0: {core: this.artFrameText7}, 
	},
},

};
this.artFrameAllLayer = Layer('artFrameAllLayer',this.artFrameAllLayerData);

//
//World Atlas & Map
//Define at end of Init to ensure all objects are ready

//Zone 0
//
//Starting Node
this.zone0Node0 = SceneNode(this.zone0Node0Data);
//Map Zone 0
this.zone0 = MapZone(this.zone0Data);

//
//Environmental Globals
this.directionalLight.AddToScene(false, false, true);
this.directionalLight2.AddToScene(false, false, true);
this.ambientLight.AddToScene(false, false, true);
this.skyGrad.AddToScene(false, false, true);
this.sunLayer.AddAllToScene(true);
this.moonLayer.AddAllToScene(true);
this.nodeFloor.AddToScene(false, false, true);

//DayNight
function dayNight(){

	aThis.directionalLight.EmitEvent('sunrise');
	aThis.directionalLight2.EmitEvent('sunrise');
	aThis.ambientLight.EmitEvent('sunrise');
	aThis.sunLayer.EmitEventParent('sunrise');
	aThis.moonLayer.EmitEventParent('sunrise');
	aThis.skyGrad.EmitEvent('sunrise');

	aThis.skyGrad.SetFlag({flag:'day', value: true});
	//SkyGrad Color Anim
	//Timeout
	let timeoutDayNight = setTimeout(function () {
		aThis.skyGrad.SetFlag({flag:'day', value: false});
		aThis.skyGrad.EmitEvent('sunset');
		let intervalDayNight = setInterval(function() {
			if(aThis.skyGrad.GetFlag('day')){
				aThis.skyGrad.SetFlag({flag:'day', value: false});
				aThis.skyGrad.EmitEvent('sunset');
			}else{
				aThis.skyGrad.SetFlag({flag:'day', value: true});
				aThis.skyGrad.EmitEvent('sunrise');
			}
		//clearInterval(intervalDayNight);
		}, aThis.timeInDay/2); //Interval
	}, aThis.timeInDay/2 - aThis.timeInDay/24); //Delay
}

},//Init


});//End of AUXL

//
//Dev - Detect Inputs
AFRAME.registerComponent('detect-inputs', {
//schema: {
	//bar: {type: 'number'},
	//baz: {type: 'string'}
//},

init: function () {
//Do something when component first attached.
//Called once when the component is initialized. Used to set up initial state and instantiate variables.

//Display Input Selections
//HMD View - Mouse Movement
//Main Trigger Click - Mouse Left Click
//Secondary Trigger Click - Mouse Right Click
//Joystick Directional - WASD
//Button 1 - Q
//Button 2 - E

const displayInput = document.querySelector('#displayInput');

let displayInputText = {value: 'No Input', color: 'white', align: 'center'}

function updateInput(input){

displayInputText.value = input;
displayInput.setAttribute('text',displayInputText);

}


//
//Event Listeners

//Desktop
//

//Mouse
//
//Left Click
document.body.addEventListener('click', function (e) {
	updateInput('main click');
});
//
//Right Click
document.body.addEventListener('contextmenu', function (e) {
	updateInput('secondary click');
});

//Keyboard
//
//Key Down - WASD | QE
document.body.addEventListener('keydown', function (e) {
	if (e.key === 'w' || e.key === 'W') {
		//Start moving player
		updateInput('up');
	} else if (e.key === 'a' || e.key === 'A') {
		//Start moving player
		updateInput('left');
	} else if (e.key === 's' || e.key === 'S') {
		//Start moving player
		updateInput('down');
	} else if (e.key === 'd' || e.key === 'D') {
		//Start moving player
		updateInput('right');
	} else if (e.key === 'q' || e.key === 'Q') {
		//Start moving player
		updateInput('button 1');
	} else if (e.key === 'e' || e.key === 'E') {
		//Start moving player
		updateInput('button 2');
	}
});//End keydown


//Quest
//

//Triggers
//
//Main Trigger
document.body.addEventListener('triggerdown', function (e) {
	updateInput('main trigger');
});

//
//Secondary Trigger
document.body.addEventListener('gripdown', function (e) {
	updateInput('secondary trigger');
});

//Buttons
//
//Right Controller - Button 1 (A)
document.body.addEventListener('abuttondown', function (e) {
	updateInput('button 1');
});
//
//Right Controller - Button 2 (B)
document.body.addEventListener('bbuttondown', function (e) {
	updateInput('button 2');
});
//
//Left Controller - Button 1 (X)
document.body.addEventListener('xbuttondown', function (e) {
	updateInput('button 1');
});
//
//Left Controller - Button 2 (Y)
document.body.addEventListener('ybuttondown', function (e) {
	updateInput('button 2');
});

//Joystick
//
//Left Controller
this.el.addEventListener('thumbstickmoved', function (e) {
	if (e.detail.y > 0.95) { 
		updateInput('down')
	}
	if (e.detail.y < -0.95) { 
		updateInput('up')
	}
	if (e.detail.x < -0.95) { 
		updateInput('left')
	}
	if (e.detail.x > 0.95) { 
		updateInput('right')
	}
});



    }//End Init
});

//
//Attach
AFRAME.registerComponent('attach', {
	dependencies: ['auxl'],
    schema: {
        idname: {type: 'string', default: 'ui'},
        position: {type: 'vec3'},
    },
    init: function () {
        //Do something when component first attached.
        //Thing To Attach
        this.attachee = document.getElementById(this.data.idname);
        //Empty Pos Vec3
        this.offset = new THREE.Vector3();
		if(this.data.position){
			this.offset.copy(this.data.position);
		} else {
        	this.offset.copy(this.attachee.object3D.position);
		}
        this.newPosVec3 = new THREE.Vector3();
    },

    update: function () {
        //Do something when component's data is updated.
    },

    remove: function () {
        //Do something the component or its entity is detached.
    },

    tick: function (time, timeDelta) {
        //Do something on every scene tick or frame.
        this.attached();
    },
    attached: function () {
        //attached
        //Clone current the entity this component is attached to's position
		//console.log(this.el.object3D.position);
        this.newPosVec3.copy(this.el.object3D.position);
        //Offsets
        this.newPosVec3.x += this.offset.x;
        this.newPosVec3.y += this.offset.y;
        this.newPosVec3.z += this.offset.z;
        //Set position for UI at 3js level for speed!
        this.attachee.object3D.position.copy(this.newPosVec3);
		//console.log(this.newPosVec3);
    },
});

//
//Click event listener for obj.Click(el) within auxl system
AFRAME.registerComponent('clickfunc', {
//el.setAttribute('clickfunc',{clickObj: 'auxlObj'})
//auxlObj is a string exact name for a this.auxlObj named object which has it's Click() func ran
	dependencies: ['auxl'],
    schema: {
        clickObj: {type: 'string', default: 'auxlObj'}
    },
    init: function () {
        //Do something when component first attached.
		this.auxl = document.querySelector('a-scene').systems.auxl;
    },//End initialization Function
	events: {
		click: function (evt) {
			//console.log('Clicked on ' + evt.target.id);
			//console.log(evt.target);
			//console.log(this.data.clickObj);//zone0?auxlObj
			this.auxl[this.data.clickObj].Click(evt.target);
		}
	}
});
//
AFRAME.registerComponent('clickrun', {
	dependencies: ['auxl'],
    schema: {
        cursorObj: {type: 'string', default: 'auxlObj'},
        method: {type: 'string', default: 'Click'},
        params: {type: 'string', default: 'null'}
    },
    init: function () {
        //Do something when component first attached.
		//console.log('clickrun attached');
		this.auxl = document.querySelector('a-scene').systems.auxl;
    },//End initialization Function
	events: {
		click: function (evt) {
			//console.log('Clicked on ' + evt.target.id);
			//console.log(evt.target);
			//console.log(this.data.cursorObj);
			//console.log(this.data.method);
			//console.log(this.data.params);
			if(this.auxl[this.data.cursorObj][this.data.method]){
				this.auxl[this.data.cursorObj][this.data.method](evt.target);
			}

		}
	}
});
//
AFRAME.registerComponent('fusingrun', {
	dependencies: ['auxl'],
    schema: {
        cursorObj: {type: 'string', default: 'auxlObj'},
        method: {type: 'string', default: 'methodName'},
        params: {type: 'string', default: 'null'}
    },
    init: function () {
        //Do something when component first attached.
		//console.log('clickrun attached');
		this.auxl = document.querySelector('a-scene').systems.auxl;
    },//End initialization Function
	events: {
		fusing: function (evt) {
			//console.log('Fused on ' + evt.target.id);
			//console.log(evt.target);
			//console.log(this.data.cursorObj);
			//console.log(this.data.method);
			//console.log(this.data.params);
			if(this.auxl[this.data.cursorObj][this.data.method]){
				this.auxl[this.data.cursorObj][this.data.method](evt.target);
			}

		}
	}
});
//
AFRAME.registerComponent('mousedownrun', {
	dependencies: ['auxl'],
    schema: {
        cursorObj: {type: 'string', default: 'auxlObj'},
        method: {type: 'string', default: 'methodName'},
        params: {type: 'string', default: 'null'}
    },
    init: function () {
        //Do something when component first attached.
		//console.log('clickrun attached');
		this.auxl = document.querySelector('a-scene').systems.auxl;
    },//End initialization Function
	events: {
		mousedown: function (evt) {
			//console.log('Cursor down on ' + evt.target.id);
			//console.log(evt.target);
			//console.log(this.data.cursorObj);
			//console.log(this.data.method);
			//console.log(this.data.params);
			if(this.auxl[this.data.cursorObj][this.data.method]){
				this.auxl[this.data.cursorObj][this.data.method](evt.target);
			}

		}
	}
});
//
AFRAME.registerComponent('mouseenterrun', {
	dependencies: ['auxl'],
    schema: {
        cursorObj: {type: 'string', default: 'auxlObj'},
        method: {type: 'string', default: 'methodName'},
        params: {type: 'string', default: 'null'}
    },
    init: function () {
        //Do something when component first attached.
		//console.log('clickrun attached');
		this.auxl = document.querySelector('a-scene').systems.auxl;
    },//End initialization Function
	events: {
		mouseenter: function (evt) {
			//console.log('Cursor entered on ' + evt.target.id);
			//console.log(evt.target);
			//console.log(this.data.cursorObj);
			//console.log(this.data.method);
			//console.log(this.data.params);
			if(this.auxl[this.data.cursorObj][this.data.method]){
				this.auxl[this.data.cursorObj][this.data.method](evt.target);
			}

		}
	}
});
//
AFRAME.registerComponent('mouseleaverun', {
	dependencies: ['auxl'],
    schema: {
        cursorObj: {type: 'string', default: 'auxlObj'},
        method: {type: 'string', default: 'methodName'},
        params: {type: 'string', default: 'null'}
    },
    init: function () {
        //Do something when component first attached.
		//console.log('clickrun attached');
		this.auxl = document.querySelector('a-scene').systems.auxl;
    },//End initialization Function
	events: {
		mouseleave: function (evt) {
			//console.log('Cursor left from ' + evt.target.id);
			//console.log(evt.target);
			//console.log(this.data.cursorObj);
			//console.log(this.data.method);
			//console.log(this.data.params);
			if(this.auxl[this.data.cursorObj][this.data.method]){
				this.auxl[this.data.cursorObj][this.data.method](evt.target);
			}

		}
	}
});
//
AFRAME.registerComponent('mouseuprun', {
	dependencies: ['auxl'],
    schema: {
        cursorObj: {type: 'string', default: 'auxlObj'},
        method: {type: 'string', default: 'methodName'},
        params: {type: 'string', default: 'null'}
    },
    init: function () {
        //Do something when component first attached.
		//console.log('clickrun attached');
		this.auxl = document.querySelector('a-scene').systems.auxl;
    },//End initialization Function
	events: {
		mouseup: function (evt) {
			//console.log('Cursor up from' + evt.target.id);
			//console.log(evt.target);
			//console.log(this.data.cursorObj);
			//console.log(this.data.method);
			//console.log(this.data.params);
			if(this.auxl[this.data.cursorObj][this.data.method]){
				this.auxl[this.data.cursorObj][this.data.method](evt.target);
			}

		}
	}
});

//External Components
/*
Look-At 
https://github.com/supermedium/superframe/tree/master/components/look-at/ 
*/
!function(e){function t(n){if(o[n])return o[n].exports;var i=o[n]={exports:{},id:n,loaded:!1};return e[n].call(i.exports,i,i.exports,t),i.loaded=!0,i.exports}var o={};return t.m=e,t.c=o,t.p="",t(0)}([function(e,t){var o=AFRAME.utils.debug,n=AFRAME.utils.coordinates,i=o("components:look-at:warn"),r=n.isCoordinates||n.isCoordinate;delete AFRAME.components["look-at"],AFRAME.registerComponent("look-at",{schema:{default:"0 0 0",parse:function(e){return r(e)||"object"==typeof e?n.parse(e):e},stringify:function(e){return"object"==typeof e?n.stringify(e):e}},init:function(){this.target3D=null,this.vector=new THREE.Vector3,this.cameraListener=AFRAME.utils.bind(this.cameraListener,this),this.el.addEventListener("componentinitialized",this.cameraListener),this.el.addEventListener("componentremoved",this.cameraListener)},update:function(){var e,t=this,o=t.data;return!o||"object"==typeof o&&!Object.keys(o).length?t.remove():"object"==typeof o?this.lookAt(new THREE.Vector3(o.x,o.y,o.z)):(e=t.el.sceneEl.querySelector(o),e?e.hasLoaded?t.beginTracking(e):e.addEventListener("loaded",function(){t.beginTracking(e)}):void i('"'+o+'" does not point to a valid entity to look-at'))},tick:function(){var e=new THREE.Vector3;return function(t){var o=this.target3D;o&&(o.getWorldPosition(e),this.lookAt(e))}}(),remove:function(){this.el.removeEventListener("componentinitialized",this.cameraListener),this.el.removeEventListener("componentremoved",this.cameraListener)},beginTracking:function(e){this.target3D=e.object3D},cameraListener:function(e){e.detail&&"camera"===e.detail.name&&this.update()},lookAt:function(e){var t=this.vector,o=this.el.object3D;this.el.getObject3D("camera")?t.subVectors(o.position,e).add(o.position):t.copy(e),o.lookAt(t)}})}]);

/* //threeColorGradientShader shader
https://github.com/tlaukkan/aframe-three-color-gradient-shader
if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}*/
AFRAME.registerShader('threeColorGradientShader', {
    schema: {
        topColor: {type: 'color', default: '1 0 0', is: 'uniform'},
        middleColor: {type: 'color', default: '0 1 0', is: 'uniform'},
        bottomColor: {type: 'color', default: '0 0 1', is: 'uniform'}
    },

    vertexShader: [
        'varying vec3 vWorldPosition;',
        'void main() {',
        ' vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
        ' vWorldPosition = worldPosition.xyz;',
        ' gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );',
        '}'
    ].join('\n'),

    fragmentShader: [
        'uniform vec3 bottomColor;',
        'uniform vec3 middleColor;',
        'uniform vec3 topColor;',
        'uniform float offset;',
        'varying vec3 vWorldPosition;',
        'void main() {',
        ' float h = normalize( vWorldPosition ).y;',
        ' if (h>0.0) {',
        '   gl_FragColor = vec4( mix( middleColor, topColor, max( pow( max(h, 0.0 ), 0.8 ), 0.0 ) ), 1.0 );',
        ' } else {',
        '   gl_FragColor = vec4( mix( middleColor, bottomColor, max( pow( max(-h, 0.0 ), 0.8 ), 0.0 ) ), 1.0 );',
        ' }',
        '}'
    ].join('\n')
});