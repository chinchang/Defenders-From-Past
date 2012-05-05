/*
Copyright (c) 2012 Kushagra Gour (chinchang457@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

;(function(){

/** 
* @class	Placeholder
* @param	radius		radius of the placeholder
**/
var DisplayObject = function (){
}
var p = DisplayObject.prototype;
p.x = 0;
p.y = 0;
p.width = 0;
p.height = 0;
p.hitarea = null;
p.scale_x = 1;
p.scale_y = 1;
p.rotation = 0;
p.alpha = 1;
p.visible = true;
p.hitTestPoint = null;
p.draw = function(context){};
p.update = function(dt){};
p.hitTestPoint = function(x, y){ return false; };
p.hitTestObject = function(obj){ 
	if(!this.hitarea || !obj.hitarea) return false;
	// make the hitareas into global cordinate
	var r1 = this.hitarea.clone();
	r1.x += this.x;
	r1.y += this.y;
	var r2 = obj.hitarea.clone();
	r2.x += obj.x;
	r2.y += obj.y;
	return r1.intersects(r2);
};


/** 
* @class	Turret
* @extends	DisplayObject
* @param	radius		radius of the placeholder
**/
var Turret = function (type){
	this.reload_time = 1;
	this.range = 80;
	this.local_time = 0;
	this.type = type;
	this.width = 38;
	this.height = 48;
	this.class = "Turret";
};

Turret.prototype = new DisplayObject();
Turret.prototype.draw = function(context){
	context.drawImage(images[turret_data[this.type].image], -this.width/2, -this.height);
	return;
};

Turret.prototype.update = function(dt){
	this.local_time += dt;
	// var angle = Math.atan2(stage.mouseY - this.y, stage.mouseX - this.x) / pi_by_180; 
	// this.rotation = angle;
};

// Tells if the turret can shoot an enemy or not
Turret.prototype.canShoot = function(enemy) {
	if (distance(this.x, this.y, enemy.x, enemy.y) <= this.range) return true;
	return false;
}

// Tells if the turret is ready to shoot
Turret.prototype.isReady = function() {
	return this.local_time > this.reload_time;
}
		
Turret.prototype.reset = function() {
	this.local_time = 0;
}


/**
* @class	Enemy
* @extends	DisplayObject
* @param	type 	type of enemy
*/
var Enemy = function(type, pid){
	this.speed_x = 0;
	this.speed_y = 0;
	this.speed = wave_data[current_wave].speed;
	this.type = type;
	this.health = 2;
	this.width = 25;
	this.height = 30;
	this.hitarea = new Rectangle(-this.width/2, -this.height, 30, 30);
	this.path_id = pid;
	this.current_path_index = 0;
	this.target_waypoint = getWaypointFromId(paths[this.path_id][this.current_path_index]);
	this.x = this.target_waypoint.x;
	this.y = this.target_waypoint.y;

}

Enemy.prototype = new DisplayObject();
Enemy.prototype.draw = function(context){
	context.drawImage(images[1], -this.width/2, -this.height);
	if(debug){
    	context.strokeStyle = "#F00";
		context.beginPath();
		context.rect(this.hitarea.x, this.hitarea.y, this.hitarea.width, this.hitarea.height);
		context.stroke();
	}
	return;
	context.fillStyle = "#F00";
	context.beginPath();
	context.arc(0, 0, 15, 0, Math.PI*2, true);
	context.closePath();
	context.fill();
}

Enemy.prototype.update = function(dt){
	if(PAUSE) return;
	// if waypoint reached, choose next waypoint
	if(distance(this.x, this.y, this.target_waypoint.x, this.target_waypoint.y) < 2){
		this.target_waypoint = this.chooseNextWaypoint();
		// if enemy reaches last point
		if(!this.target_waypoint){
			removeChild(this);
			health -= 1;
			if(!health){
				gameOver();
			}
		}
		var angle = Math.atan2(this.target_waypoint.y - this.y, this.target_waypoint.x - this.x); 
		this.speed_x = Math.cos(angle) * this.speed; 
		this.speed_y = Math.sin(angle) * this.speed; 
	}
	this.x += this.speed_x * dt;
	this.y += this.speed_y * dt;
}

Enemy.prototype.chooseNextWaypoint = function(){
	if(++this.current_path_index < paths[this.path_id].length){
		if(typeof paths[this.path_id][this.current_path_index] == 'number')
			return getWaypointFromId(paths[this.path_id][this.current_path_index]);
	}
	return false;
}

Enemy.prototype.updateHealth = function(amount){
	this.health += amount; // Increment the health by some amount
	return this.health;	
}

/** 
* @class	Placeholder
* @extends 	DisplayObject
* @param	radius		radius of the placeholder
**/
var Placeholder = function (r){
	this.radius = r;
	this.class = "Placeholder";
	this.visible = false;
	this.onMouseOver = function(e){
		ghost_turret.x = this.x; 
		ghost_turret.y = this.y;
		ghost_turret.visible = true;
	};
	this.onMouseOut = function(e){
		ghost_turret.visible = false;
	};
	this.onClicked = function(e){
		if(money >= turret_data[current_turret_type].cost){
			money -= turret_data[current_turret_type].cost;
			var turret = new Turret(current_turret_type);
			turret.x = this.x;
			turret.y = this.y;
			addChild(turret);			
			turrets.push(turret);
			removeChild(this);
		}
	};
};

Placeholder.prototype = new DisplayObject();

Placeholder.prototype.draw = function(context){
    context.fillStyle = "#D5544F";
	context.beginPath();
	context.arc(0, 0, this.radius, 0, Math.PI*2, true);
	context.closePath();
	context.fill();
};

Placeholder.prototype.hitTestPoint = function(x, y){
	return distance(this.x, this.y, x, y) < this.radius;
};

/**
* @class	Particle
* @extends 	DisplayObject
* @param	x 	position of particle on x axis
* @param	y 	position of particle on y axis
* @param	sx 	speed of particle on x axis
* @param	sy 	speed of particle on x axis
**/
var Particle = function(x, y, sx, sy){
	this.x = x;
	this.y = y;
	this.speed_x = sx;
	this.speed_y = sy;
	this.scale_x = 1;
	this.scale_y = 1;
	this.radius = 2;
};

Particle.prototype = new DisplayObject();
Particle.prototype.update = function(dt){
	this.x += this.speed_x * dt;
	this.y += this.speed_y * dt;
	this.scale_x += 5 * dt;
	this.scale_y += 5 * dt;
	this.alpha -= 1.5 * dt;
	if(this.alpha <= 0)
		removeChild(this);
};

Particle.prototype.draw = function(context){
    context.fillStyle = "#bdd8db";
	context.beginPath();
	context.arc(0, 0, this.radius, 0, Math.PI*2, true);
	context.fill();
};


/**
* @class	Bullet
* @extends 	DisplayObject
* @param	x 	position of particle on x axis
* @param	y 	position of particle on y axis
* @param	r 	radius of the bullet
**/
var Bullet = function(r, damage){
	this.radius = r;
	this.speed = 150;
	this.damage = damage;
	this.hitarea = new Rectangle(0, 0, this.radius<<1, this.radius<<1);
};

Bullet.prototype = new DisplayObject();
Bullet.prototype.update = function(dt){
	this.x += this.speed_x * dt;
	this.y += this.speed_y * dt;
};

Bullet.prototype.draw = function(context){
    context.fillStyle = "#EEEEEE";
	context.beginPath();
	context.arc(this.radius, this.radius, this.radius, 0, Math.PI*2, true);
	context.fill();
	if(debug){
    	context.strokeStyle = "#F00";
		context.beginPath();
		context.rect(this.hitarea.x, this.hitarea.y, this.hitarea.width, this.hitarea.height);
		context.stroke();
	}
};


/**
* @class	Waypoint
* @extends 	DisplayObject
* @param	id 	a integer to identify the waypoint
* @param	x 	position of particle on x axis
* @param	y 	position of particle on y axis
**/
var Waypoint = function(id, x, y){
	this.id = id;
	this.x = x;
	this.y = y;
	this.visible = false;
};
Waypoint.prototype = new DisplayObject();
Waypoint.prototype.draw = function(context){
	context.font = '14px Verdana';
	context.fillStyle = '#000';
	context.fillText(this.id, 0, 0);
};


/** 
* Game properties
**/
var PAUSE = false;

var health = 6,
	score = 0,
	money = 100,
	highscore = 0,
	gameover_text = null,
	global_timer = 0;

var ghost_turret,
	turrets = [],
	enemies = [],
	bullets = [],
	current_turret_type = 0;

var waypoints = [
	new Waypoint(1, 4, 12),
	new Waypoint(2, 256, 5),
	new Waypoint(3, 395, 51),
	new Waypoint(4, 92, 154),
	new Waypoint(5, 286, 155),
	new Waypoint(6, 266, 215),
	new Waypoint(7, 182, 274),
	new Waypoint(8, 113, 388),
	new Waypoint(9, 363, 486), 	
];

var placeholder_points = [
	{x: 159, y: 45},
	{x: 115, y: 88},
	{x: 35, y: 165},
	{x: 63, y: 202},
	{x: 99, y: 265},
	{x: 55, y: 360},
	{x: 56, y: 423},
	{x: 162, y: 471},
	{x: 366, y: 149},
	{x: 324, y: 205},
	{x: 252, y: 286},
	{x: 195, y: 374},
	{x: 266, y: 404},
	{x: 325, y: 430}, 
];

var paths = [
	[1, 4, 7, 8, 9],
	[2, 4, 7, 8, 9],
	[3, 5, 6, 7, 8, 9],
]; 

var turret_data = {
	0: {image: 0, damage: -1, range: 100, cost: 50}
};

var wave_data = [
		{enemies: 7, speed: 20, interval: 4},	
		{enemies: 10, speed: 30, interval: 4},	
		{enemies: 10, speed: 30, interval: 3},	
		{enemies: 20, speed: 40, interval: 3},	
		{enemies: 20, speed: 40, interval: 2},	
		{enemies: 10, speed: 40, interval: 2},	
		{enemies: 10, speed: 45, interval: 1},	
		{enemies: 10, speed: 45, interval: 1},	
		{enemies: 10, speed: 45, interval: 1},	
		{enemies: 10, speed: 45, interval: 1},	
	],
	current_wave = 0,
	num_enemy = 0;


var enemy_interval = 3;

var images = [	'images/einstein.png',
				'images/pi.png',
];

var image_count = 0;

function initGame(){
	drawBg();

	loadAssets();

	for(var i = placeholder_points.length; i--;){
		var placeholder = new Placeholder(15);
		placeholder.x = placeholder_points[i].x;
		placeholder.y = placeholder_points[i].y;
		addChild(placeholder);
	}

	/*ghost_turret = new Turret(20);
	ghost_turret.alpha = 0.5;
	ghost_turret.visible = false;
	addChild(ghost_turret);
	*/

	// Add waypoints on the field
	for(var i=waypoints.length; i--;){
		addChild(waypoints[i]);
	}

	// score text
	var score_text = new DisplayObject();
	score_text.x = 200,
	score_text.y = 530,
	score_text.draw = function(context){
		context.font = '30px Verdana';
		context.fillStyle = 'rgb(0, 0, 0)';
		context.fillText(score, 0, 0);
	}
	addChild(score_text);

	// highscore text
	var hscore_text = new DisplayObject();
	hscore_text.x = 202,
	hscore_text.y = 540,
	hscore_text.draw = function(context){
		context.font = '12px Verdana';
		context.fillStyle = 'rgb(0, 0, 0)';
		context.fillText('BEST: ' + highscore, 0, 0);
	}
	addChild(hscore_text);	

	// money text
	var money_text = new DisplayObject();
	money_text.x = 75,
	money_text.y = 530,
	money_text.draw = function(context){
		context.font = '30px Verdana';
		context.fillStyle = 'rgb(0, 0, 0)';
		context.fillText(money, 0, 0);
	}
	addChild(money_text);

	// health text
	var health_text = new DisplayObject();
	health_text.x = 370,
	health_text.y = 484,
	health_text.draw = function(context){
		context.font = '18px Verdana';
		context.fillStyle = 'rgb(0, 0, 0)';
		context.fillText(health, 0, 0);
	}
	addChild(health_text);

	// gameover text
	gameover_text = new DisplayObject();
	gameover_text.x = 50,
	gameover_text.y = 254,
	gameover_text.visible = false;
	gameover_text.draw = function(context){
		context.font = '30px Verdana';
		context.fillStyle = 'rgb(0, 0, 0)';
		context.fillText('Game Over \n(Refresh)', 0, 0);
	}
	addChild(gameover_text);

	num_enemy = wave_data[current_wave].interval;
}

function createEnemy(){
	// place an enemy on a random path
	var e = new Enemy(0, Math.floor(Math.random() * paths.length));
	enemies.push(e);
	addChild(e);
}

function loadAssets(){
	for(var i=images.length; i--;){
		var image = new Image();
		image.src = images[i];
		(function(index, img){
			image.onload = function(){
				images[index] = img;
				// if(++image_count == images.length) startGame();
			}
		})(i, image);
	}
}

/**
* Draws the background in a separate canvas
**/
function drawBg(){
	var bg = new Image();
	bg.src = 'images/bg.png';
	var bgc = document.createElement('canvas');
	bgc.id = 'c_bottom';
	bgc.setAttribute('width', canvas.width);
	bgc.setAttribute('height', canvas.height);
	document.getElementById('canvas_container').appendChild(bgc);

	var ctx = bgc.getContext('2d');
	bg.onload = function(){
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(bg, 0, 0);
	}
}
/**
* Emits some particles
**/
function emitParticles(count, position){
	for(var i=count;i--;){
		addChild(new Particle(position.x - (Math.random() * 20 - 10), position.y, 10 - Math.random() * 20, 10 - Math.random() * 20));
	}
}

function shoot(turret, enemy){
	// calculate angle from the turret to the enemy
	var angle = Math.atan2(enemy.y - turret.y, enemy.x - turret.x); 
	
	// create a new bullet
	var new_bullet = new Bullet(3, turret_data[turret.type].damage);
	new_bullet.x = turret.x + Math.cos(angle) * 25;
	new_bullet.y = turret.y + Math.sin(angle) * 25;
	new_bullet.speed_x = Math.cos(angle) * new_bullet.speed; 
	new_bullet.speed_y = Math.sin(angle) * new_bullet.speed;
	bullets.push(new_bullet); 
	addChild(new_bullet);
}

function getWaypointFromId(id){
	for(var i = waypoints.length; i--;)
		if(waypoints[i].id == id) return waypoints[i];
	return false; 
}

function gameOver(){
	PAUSE = true;
	gameover_text.visible = true;
	resetScore();
	saveScore();
}

function onStageClicked(e){
	// console.log('new Waypoint(' + e.offsetX + ',' + e.offsetY + ')'); return;
	// console.log('{x: ' + e.offsetX + ', y: ' + e.offsetY + '},'); return;	
}

/**
* We put the main game logic here...kinda main game loop
* It checks for
* 	1) collisions
*	2) make turrets shoot
* 	3) creates enemies
**/ 
function onStageUpdated(dt){
	if(PAUSE) return;
	global_timer += dt;

	if(global_timer > wave_data[current_wave].interval){
		global_timer = 0;
		createEnemy();
		if(num_enemy-- == 0){
			current_wave++;
			num_enemy = wave_data[current_wave].enemies;
		}

	}

	var enemy, turret, bullet;

	// Update turrets
	for(var i = turrets.length; i--;) {
		turret = turrets[i];
		// if the turret isn't ready to shoot, then continue to next turret
		if (!turret.isReady()) continue;
		// iterate over all enemies
		for(var j = enemies.length; j--;) {
			enemy = enemies[j];
			// if the turret can shoot this enemy, shoot!
			if (turret.canShoot(enemy)) {
				shoot(turret, enemy);
				turret.reset();
				// break out of loop and check no more enemies
				break;
			}
		}
	}

	for (var i = bullets.length; i--;) {
		bullet = bullets[i];
		// if the bullet isn't defined, continue with the next iteration
		if (!bullet) continue;
		// if its out of bound, remove it from stage
		if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
			bullets.splice(i, 1); 
			removeChild(bullet);
			continue;
		}
		
		// check the current bullet for collision with every enemy on the field
		for (var j = enemies.length; j--;) {
			enemy = enemies[j];
			// if the collsision occured remove the bullet and update health of enemy
			if (bullet.hitTestObject(enemy)) {
				bullets.splice(i, 1);
				removeChild(bullet);
				emitParticles(5, {x: bullet.x, y: bullet.y});
				// if the enemy is dead, remove him as well
				if (enemy.updateHealth(bullet.damage) <= 0) {
					enemies.splice(j, 1);
					removeChild(enemy);
					money += 10;
					score += 50;
				}
				break;
			}
		}
	}
}



/**
* Game Core (WARNING: Handle with care)
**/

/**
* A stage can't be instantiated and all properties and methods are static
* @class	Stage
**/
var FPS = 60,
	pi_by_180 = Math.PI / 180,
	canvas = null,
	ctx = null,
	buffer_canvas = null,
	buffer_canvas_ctx = null,
	game_objects = [],
	last_time = 0,
	debug = 0,
	stage = null,
	supportsLocalStorage = false;


var Stage = function(){
	this.mouseX = null;
	this.mouseY = null;
	this.hitTestPoint = function(x, y) {
		return true;
	};
	this.onMouseMove = function(e){ 
		this.mouseX = e.offsetX || e.layerX;
		this.mouseY = e.offsetY || e.layerY;
	};
};

window.addEventListener('load', init);

function init(e){
	averagefps = {x: 0, y: 0};
	canvas = document.getElementById("c_top");
	ctx = canvas.getContext('2d');
	buffer_canvas = document.createElement('canvas')
	buffer_canvas.width = canvas.width;
	buffer_canvas.height = canvas.height;
	buffer_canvas_ctx = buffer_canvas.getContext('2d');

	game_objects = [];
	stage = new Stage();
	stage.onClicked = function(e){
		onStageClicked(e);
	}

	stage.update = function(dt){
		onStageUpdated(dt);
	}
	addChild(stage);

	// detect if the browser has localstorage support
	try{
		if(window['localStorage'] != null){
			supportsLocalStorage = true;
			if(!(highscore = window.localStorage.getItem('dfp_score'))){
				highscore = 0;
				localStorage.setItem('dfp_score', 0)
			}
		}
	} catch(e){
		supportsLocalStorage = false;
	}

	// fps text
	var fps_text = {
		x: 5,
		y: 15,
		fps: 0,
		visible: true,
		update: function(dt){
			this.fps = Math.round(1/dt); 
			if(this.fps !== Infinity){
				averagefps.x = (averagefps.x * averagefps.y + this.fps) / ++averagefps.y; 
			}
		},

		draw: function(context){
			if(!debug) return;
			context.font = '12px Verdana';
    		context.fillStyle = '#FFF';
 			context.fillText(this.fps + ' fps', 0, 0);
		}
	};
	addChild(fps_text);

	// Entities text
	var entities_text = {
		x: 50,
		y: 15,
		visible: true,
		draw: function(context){
			if(!debug) return;
			context.font = '12px Verdana';
    		context.fillStyle = '#FFF';
 			context.fillText(game_objects.length + ' Entities', 0, 0);
		}
	};
	addChild(entities_text);

	initGame();
	
	canvas.addEventListener('click', onClicked);
	canvas.addEventListener('mouseover', onMouseOver);
	canvas.addEventListener('mouseout', onMouseOut);
	canvas.addEventListener('mousemove', onMouseMove);
	window.addEventListener('keypress', onKeyPress);

	gameLoop();
}

function gameLoop(){
	update();
	draw();
	setTimeout(gameLoop, 1000/FPS);
}

function onKeyPress(e){
	if({68:1,100:1}[e.which]){
		debug ^= 1;
	}
}

/**
* Send Click event to all listeners
* @function	onClicked
**/
function onClicked(e){
	for(var i = game_objects.length; i--;){
		var obj = game_objects[i]; 
		if((typeof obj.onClicked == 'function') && (typeof obj.hitTestPoint == 'function')){
			var x = e.offsetX || e.layerX;
			var y = e.offsetY || e.layerY;
			if(obj.hitTestPoint(x, y)) { 
				obj.onClicked(e); 
			}
		}
	}
}

/**
* Send MouseOver event to all listeners
* @function	onMouseOver
**/
function onMouseOver(e){
	for(var i = game_objects.length; i--;){
		var obj = game_objects[i];
		if((typeof obj.onMouseOver == 'function') && (typeof obj.hitTestPoint == 'function')){
			var x = e.offsetX || e.layerX;
			var y = e.offsetY || e.layerY;
			if(obj.hitTestPoint(x, y))
				obj.onMouseOver(e);
		}
	}
}

/**
* Send MouseOut event to all listeners
* @function	onMouseOver
**/
function onMouseOut(e){
	for(var i = game_objects.length; i--;){
		var obj = game_objects[i];
		if((typeof obj.onMouseOut == 'function') && (typeof obj.hitTestPoint == 'function')){
			var x = e.offsetX || e.layerX;
			var y = e.offsetY || e.layerY;
			if(obj.hitTestPoint(x, y))
				obj.onMouseOut(e);
		}
	}
}

/**
* Send MouseOut event to all listeners
* @function	onMouseOver
**/
function onMouseMove(e){
	for(var i = game_objects.length; i--;){
		var obj = game_objects[i];
		if((typeof obj.onMouseMove == 'function') && (typeof obj.hitTestPoint == 'function')){
			var x = e.offsetX || e.layerX;
			var y = e.offsetY || e.layerY;
			if(obj.hitTestPoint(x, y)) 
				obj.onMouseMove(e);
		}
	}
}


/*
 * Game's update function called from gameloop
 * Updates all game entities
 */
function update(){
	// get the time past the previous frame
	var current_time = new Date().getTime();
	if(!last_time) last_time = current_time;
	var dt = (current_time - last_time) / 1000;
	last_time = current_time;

	for(var i = game_objects.length; i--;){
		var obj = game_objects[i];
		if(typeof obj.update == 'function'){
			obj.update(dt);
		}
	}
}

/*
 * Game's draw function called from gameloop
 * Draws all game entities
 */
function draw(){
	clearScreen(buffer_canvas_ctx, '#9CC5C9');
	// use double buffering technique to remove flickr :)
	var context = buffer_canvas_ctx;
	for(var i = 0, l = game_objects.length; i < l; i++){
		var obj = game_objects[i];
		if(typeof obj.draw == 'function' && obj.visible){
			context.save();
			!isNaN(obj.x) && !isNaN(obj.y) && context.translate(obj.x, obj.y); 
			!isNaN(obj.scale_x) && !isNaN(obj.scale_y) && context.scale(obj.scale_x, obj.scale_y); 
			!isNaN(obj.rotation) && context.rotate(obj.rotation * pi_by_180); 
			!isNaN(obj.alpha) && (context.globalAlpha = obj.alpha); 
			obj.draw(context);
			context.restore();
		}
	}
	clearScreen(ctx);
	ctx.drawImage(buffer_canvas, 0, 0);
}

function clearScreen(context, color){
    // context.fillStyle = color;
    context.clearRect(0, 0, canvas.width, canvas.height);
    // context.fillRect(0, 0, canvas.width, canvas.height);
}

function addChild(c){
	game_objects.push(c);
}

function removeChild(c){
	for(var i=game_objects.length; i--;)
		if(game_objects[i] === c){
			delete c;
			game_objects.splice(i, 1);
			break;
		}
}

function setChildIndex(child, i){
	for(var j=-1, l=game_objects.length; ++j<l;){
		if(game_objects[j] === child && j != i){
			game_objects.splice(j, 1);
			game_objects.splice(i, 0, child);
		}
	}
}

function resetScore(){
	score > highscore ? highscore = score : null;
	score = 0;
}

function saveScore(){
	localStorage.setItem('dfp_score', highscore);
}

/**
* Geometry class and functions
**/

/**
* @class Rectangle
* @param	x 	x cordinate
* @param	y 	y cordinate
* @param	w 	width
* @param	h 	height
**/
var Rectangle = function(x, y, w, h){	
	this.x = x;
	this.y = y;
	this.width = w;
	this.height = h;
}

Rectangle.prototype.clone = function(){
	return new Rectangle(this.x, this.y, this.width, this.height);
}

Rectangle.prototype.intersects = function(rect){
	return !(rect.x > this.x + this.width
		|| rect.x + rect.width < this.x
		|| rect.y > this.y + this.height
		|| rect.y + rect.height < this.y);
		
}

function distance(x1, y1, x2, y2){
	var dx = x1 - x2;
	var dy = y1 - y2;
	return Math.abs(Math.sqrt(dx * dx + dy * dy));
}

})();
