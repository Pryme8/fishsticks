// fishsticks.js version 0.0.1 - Author: Andrew V Butt Sr. Pryme8@gmail.com
// This is an open source Javascript HTML5 Canvas 2D game Engine built for my tutorial
// http://pryme8.github.io/NeatFlax/webWork

//VECTOR 2 OPERATIONS:
vec2 = function(x,y){  //Create the Basic Vector Object.
	x = x || 0;  //Make sure there is some sort of value;
	y = y || 0;
	this.x = x;
	this.y = y;
	return this;
};

vec2.prototype.copy = function(vec) {
	this.x = vec.x;
	this.y = vec.y;
    return this;
};

vec2.prototype.clone = function (vec) {
    return new vec2(vec.x, vec.y); //Make a new Instances of the vector.
};

vec2.prototype.perp = function() { //Get the Perpendicular angle;
    var x = this.x;
	var y = this.y;
    this.x = y;
    this.y = -x;
    return this;
};

vec2.prototype.rotate = function (angle) { //Rotate a vec by an angle in radians.
    var x = this.x;
    var y = this.y;
    this.x = x * Math.cos(angle) - y * Math.sin(angle);
    this.y = x * Math.sin(angle) + y * Math.cos(angle);
    return this;
};

vec2.prototype.reverse = function() { //Reverse the Vector
    this.x = -this.x;
    this.y = -this.y;
    return this;
};

vec2.prototype.normalize = function() { //Normalize the Vector
    var d = this.len();
    if(d > 0) {
      this.x = this.x / d;
      this.y = this.y / d;
    }
    return this;
};

vec2.prototype.add = function(input) { //ADD OTHER VECTOR
    this.x += input.x;
    this.y += input.y;
    return this;
};

vec2.prototype.subtract = function(input) { //SUBTRACT OTHER VECTOR
    this.x -= input.x;
    this.y -= input.y;
    return this;
};

vec2.prototype.scale = function(x,y) { //SCALE THE VECTOR BY THE X or and X AND Y
    this.x *= x;
    this.y *= y || x;
    return this; 
};

vec2.prototype.dot = function(input) {
    return (this.x * input.x + this.y * input.y);
};


vec2.prototype.len2 = function() {
    return this.dot(this);
};
vec2.prototype.len = function() {
    return Math.sqrt(this.len2());
};

vec2.prototype.project = function(axis) {  //Project a vector onto anouther.
    var t = this.dot(axis) / axis.len2();
    this.x = t * axis.x;
    this.y = t * axis.y;
    return this;
};

vec2.prototype.projectN = function(axis) { //Project onto a vector of unit length.
    var t = this.dot(axis);
    this.x = t * axis.x;
    this.y = t * axis.y;
    return this;
};

vec2.prototype.reflect = function(axis) { //Reflect vector to a vector.
    var x = this.x;
    var y = this.y;
    this.project(axis).scale(2);
    this.x -= x;
    this.y -= y;
    return this;
};

vec2.prototype.reflectN = function(axis) {  //Reflect on an Arbitrary Axis
    var x = this.x;
    var y = this.y;
    this.projectN(axis).scale(2);
    this.x -= x;
    this.y -= y;
    return this;
};

vec2.prototype.getValue = function(v){  //Returns value of float or array,
	if((v == 'x' || v == 0) ){
		return parseFloat(this.x);
	}else if((v == 'y' || v == 1)){
		return parseFloat(this.y);
	}else{
		return [this.x,this.y];
	}
}

/*-- ENGINE STARTS HERE --*/


fs = function(canvas, args){
	if(!canvas){return false} // Check to see if the canvas argument is set.
	this._canvas = document.getElementById(canvas); //Get the Canvas
	if(!this._canvas){return false}//Break if no Canvas found with that ID	
	if(typeof args =='undefined'){args={}}//Check args object
	this.settings = args;
	if(!this.settings.fps){this.settings.fps=30;};
	this._ctx = this._canvas.getContext('2d');
	this._engine = new fs.ENGINE(this);//Start the Engine.

	this._pWork = new Worker('./core/fishPhysics.0.0.1.js');
	this._BindWorker();
	this._pWork.postMessage(['init', {gravity:[0,0.096]}]);
	
	this._engine.CreateScene({name:'Default-Scene', active:true});//Use the Engines CreateScene Meathod to Make a New Scene;
	//this._pWork.postMessage(['ChangeScene', JSON.stringify(this.GetActiveScene())]);
	this._int = null;
};

fs.prototype.GetActiveScene = function(){ //returns Active Scene Object.
	return this._engine.activeScene;	
};
fs.prototype.CanvasResize = function(){ //Gets the Canvas Information, and sets the Size Details.
	
};

fs.prototype._CheckPhysicsScene = function(){
	this._pWork.postMessage(['get-scene-info']);
	return
};

fs.prototype.StartScene = function(args){
	var self = this;
	if(this._engine.scenes[args.scene]){
	args.scene = this._engine.scenes[args.scene];
	}else{
	args.scene =  this.GetActiveScene();
	}
	var scene = args.scene;	
	this._pWork.postMessage(['start-scene', this.EncodeScene(scene), scene._GetSceneID()]);
	return
	
	/*
	
	this._int = setInterval(function(){self.DrawScene();},1000/self.settings.fps);*/
};

fs.prototype.EncodeScene = function(scene){
	s = {
		name: scene.name,
		ID : scene._GetSceneID(),
		stack: [],
	};

	for(var i=0; i<scene.stack.length; i++){
		s.stack.push(scene.stack[i].Encode());
	}
	
	return s;
};




/*-- ENGINE CONSTRUCTOR --*/
fs.ENGINE = function(parent){ 
	this._parent = parent; //The Core Object.
	this.scenes = [];      //Scenes Stored in Engine.
	this.activeScene = null;
	this.scale = 1; //Scale of the Engine Calculations;
	this.CENTERX = this._parent._canvas.width*0.5;
	this.CENTERY = this._parent._canvas.height*0.5;
	return this;
}

fs.ENGINE.prototype.DrawScene = function(){
	var ctx = this._parent._ctx;
	var c = this._parent._canvas;
	var objectCount = this.activeScene.stack.length;
	ctx.clearRect(0, 0, c.width, c.height);
	for(var i=0; i<objectCount; i++){
		var obj = this.activeScene.stack[i];
		if(obj.enabled == false){
			continue	
		}else{
			obj.Draw(ctx);	
		}
			
	}
	
};

fs.prototype.DrawScene = function(){this._engine.DrawScene();};



fs.ENGINE.prototype.CreateScene = function(args){ //Creates a new Scene.
	if(typeof args =='undefined'){args = {}}
	console.log('Creating-Scene');
		var s = new fs.SCENE(this._parent, args);
		this._parent._pWork.postMessage(['create-scene', s.Encode()]);
		this.scenes.push(s);
};
fs.ENGINE.prototype.SetActiveScene = function(scene){ //Creates a new Scene.
	if(typeof args =='undefined'){args = {}}
		this.activeScene = scene;
};

/*-- SCENE CONSTRUCTOR --*/
fs.SCENE = function(parent, args){ 
	this.name = args.name || 'New-Scene'; //Scene Name;
	this._parent = parent;
	this._engine = parent._engine;	
	this.stack = [];
	this.on = args.on || true;
	this.active = args.active || false;
	if(this.active && this.on){this._engine.SetActiveScene(this)};
	return this;
}

fs.SCENE.prototype.CreatePrim = function(type, name, args){
	var p = new fs[type](name,args,this);
	var sceneID = this._GetSceneID();
	this.stack.push(p);	
	p = this.stack[this.stack.length-1];
	p.stackID = this.stack.length-1;
	this._parent._pWork.postMessage(['create-primitive', p.Encode(), sceneID]);
	
	return p;
};

fs.SCENE.prototype._GetSceneID = function(){
	for(var i=0; i<this._engine.scenes.length; i++){
		if(this.name == this._engine.scenes[i].name){
		return i;	
		}
	}
	return 0;
};

fs.SCENE.prototype.Encode = function(){
	return this._parent.EncodeScene(this);
}

/*-- PRIMITIVE CONSTRUCTORS --*/
fs.PRIM = function(name, args, scene){
	args = args || {};
	this.scene = scene;
	this.name = name || 'New-Primative';
	this.transforms = {
		position : args.position || new vec2(0,0),
		rotation : args.rotation || 0,
	};
	this.bodys = this.bodys || [];
	this.enabled = this.enabled || false;
	
	return this
};

//ADD PHYSICS TO OBJECT
fs.PRIM.prototype.setPhysics = function(args){
	var oArgs = args;
	var update = new fs.PHYSICS(args);
	if(typeof oArgs.on !=='undefined'){update.on = oArgs.on}else{
		update.on = this.physics.on;	
	}
	if(typeof oArgs.velocity !=='undefined'){update.velocity = [oArgs.velocity.x,oArgs.velocity.y]}else{
		update.velocity = [this.physics.velocity.x || 0, this.physics.velocity.y || 0]	
	}
	if(typeof oArgs.torque !=='undefined'){update.torque = oArgs.torque}else{
		update.torque = this.physics.torque;
	}
	if(typeof oArgs.mass !=='undefined'){update.mass = oArgs.mass}else{
		update.mass = this.physics.mass;
	}
	if(typeof oArgs.drag !=='undefined'){update.drag = oArgs.drag}else{
		update.drag = this.physics.drag;
	}
	if(typeof oArgs.friction !=='undefined'){update.friction = oArgs.friction}else{
		update.friction = this.physics.friction;
	}
	if(typeof oArgs.bounce !=='undefined'){update.bounce = oArgs.bounce}else{
		update.bounce = this.physics.bounce;
	}
	
	console.log(update);
	var w = this.scene._parent._pWork;
	w.postMessage(['set-obj-physics', update, this.scene._GetSceneID(), this.stackID]);
}

fs.PRIM.prototype.Encode = function(){
	this.physics = this.physics || new fs.PHYSICS({on:false});
	e = {	
		name:this.name,
		stackID: this._GetStackID(),
		position: [this.transforms.position.x, this.transforms.position.y],
		rotation: this.transforms.rotation,
		physics: {
			on: this.physics.on || false,
			velocity: [this.physics.velocity.x || 0, this.physics.velocity.y || 0],
			torque: this.physics.torque || 0,
			mass : this.physics.settings.mass || 0,
			drag : this.physics.settings.drag || 1,
			friction : this.physics.settings.friction || 1,
			bounce : this.physics.settings.bounce || 0,		
		}
		
	}	
	return e;
}

fs.PRIM.prototype._GetStackID = function(){
		for(var i=0; i<this.scene.stack.length; i++){
			if(this.name == this.scene.stack[i].name){
				return i;	
			}
		}
	return 0;
};

/*-- CIRCLE PRIMITIVE --*/
fs.CIRCLE = function(name, args, scene) {     
	  args = args || {};
	  this.scene = scene;
	  this.name = name || 'New-Circle';
	  this.shape = {type:'circle', radius: args.radius || 1};
	  this.enabled = args.enabled || true;
	  this.bodys = [];  
	  this.args = args;  
	  fs.PRIM.call(this, name, args, scene);
	  
}
//Set Constuctors;
fs.CIRCLE.prototype = new fs.PRIM();
fs.CIRCLE.prototype.constructor = fs.CIRCLE;

fs.CIRCLE.prototype._AddBody = function(args){
	var id = this._GetStackID();
	var w = this.scene._parent._pWork;
	w.postMessage(['Add-Body', id, this.scene._GetSceneID(), 'circle', {radius:args.radius || this.shape.radius}]);
};


//DRAW PROTOTYPE;
fs.CIRCLE.prototype.Draw = function(ctx) {
	
	var cX, cY;
	cX = this.scene._engine.CENTERX;
	cY = this.scene._engine.CENTERY;
	
      ctx.fillStyle = this.args.fillColor || 'black';
      ctx.beginPath();
      ctx.arc(cX+this.transforms.position.x,
	  		  cY+this.transforms.position.y,
			  this.shape.radius, 0,
              Math.PI * 2, true);		
      ctx.closePath();
      ctx.fill();       
}

/*-- POLYGON PRIMITIVE --*/
fs.POLY = function(name, args, scene) {     
	  args = args || {};
	  this.scene = scene;
	  this.name = name || 'New-Polygon';
	  this.shape = {type:'poly', points: args.points || []};
	  this.enabled = args.enabled || true;	
	  this.args = args;	
	  this.bodys = [];  
	  fs.PRIM.call(this, name, args, scene);
	  
};
//Set Constuctors;
fs.POLY.prototype = new fs.PRIM();
fs.POLY.prototype.constructor = fs.POLY;

//DRAW PROTOTYPE;
fs.POLY.prototype.Draw = function(ctx) {
	var cX, cY;
	cX = this.scene._engine.CENTERX;
	cY = this.scene._engine.CENTERY;
      ctx.fillStyle = this.args.fillColor || 'black';
	  
		var pos = this.transforms.position;
		cX += pos.x;
		cY += pos.y
		ctx.moveTo(this.shape.points[0].x+cX,this.shape.points[0].y+cY);
		for(var i=1; i<this.shape.points.length; i++){
		ctx.lineTo(this.shape.points[i].x+cX,this.shape.points[i].y+cY);
		}
		ctx.lineTo(this.shape.points[0].x+cX,this.shape.points[0].y+cY);

		ctx.fill();		
}

fs.POLY.prototype._AddBody = function(args){
	var id = this._GetStackID();
	var w = this.scene._parent._pWork;
	args.offset = args.offset || new vec2();
	//console.log("First Add Body Request Points:");
	//console.log(args.points);
	w.postMessage(['Add-Body', id, this.scene._GetSceneID(), 'poly',
	{offset:[args.offset.x||0,args.offset.y||0], points:args.points}]);
};

/*-- BOX PRIMITIVE --*/
fs.BOX = function(name, args, scene) {     
	  args = args || {};
	  this.scene = scene;
	  this.name = name || 'New-Box';
	  this.shape = {type:'box', width: args.width || 1, height: args.height || 1};
	  this.enabled = args.enabled || true;	
	  this.args = args;	
	  this.bodys = [];  
	  fs.PRIM.call(this, name, args, scene);
	  
}
//Set Constuctors;
fs.BOX.prototype = new fs.PRIM();
fs.BOX.prototype.constructor = fs.BOX;

//DRAW PROTOTYPE;
fs.BOX.prototype.Draw = function(ctx) {
	var cX, cY;
	cX = this.scene._engine.CENTERX;
	cY = this.scene._engine.CENTERY;
	
      ctx.fillStyle = this.args.fillColor || 'black';
	  ctx.beginPath();
		var pos = this.transforms.position;
		cX+=pos.x;
		cY+=pos.y;
		ctx.fillRect(cX - (this.args.width*0.5) ,
                     cY - (this.args.height*0.5),
                   	 this.args.width,
                     this.args.height);
}

fs.BOX.prototype._AddBody = function(args){
	var id = this._GetStackID();
	var w = this.scene._parent._pWork;
	args.offset = args.offset || new vec2();
	w.postMessage(['Add-Body', id, this.scene._GetSceneID(), 'box',
	{offset:[args.offset.x||0,args.offset.y||0], width:args.width || this.shape.width, height: args.height || this.shape.height}]);
};



/*- PHYSICS CONTAINER CONSTRUCTOR -*/
fs.PHYSICS = function(args){
	var targs = args;
	targs.on = args.on || true; //Enable the Phsyics on this object.
	targs.mass = args.mass || 0; //Have Gravity and Impulses Effect this object. -1:1
	targs.drag = args.drag || 0.99999; //Amount of Drag the Object has while in the Air. <0:1 -> 1 is No Drag.
	targs.friction = args.friction || 0.5 ; //Amount of Contact Friction
	targs.bounce = args.bounce || 0.35; // 0 for no Bounce < 1 is upper range.
	this.velocity = args.intVel || new vec2();
	this.torque = args.intTorque || 0;
	this.settings = targs;
	return this;
};


/*-- PHYSICS WORKER STUFF --*/

fs.prototype._BindWorker = function(){
	var self = this;
	this._pWork.onmessage = function(e) {
 	type = e.data[0];
  		if(type == "Body-Added"){
				console.log("Body-Added");
				self._engine.scenes[e.data[2]].stack[e.data[1]].bodys.push(e.data[3]);
		}
		if(type == "Scene-Added"){
				console.log("Scene-Added");
		}
		if(type == "render-scene"){
				console.log("Starting-Scene Render");
				self._engine.scenes[e.data[1]]._int = setInterval(function(){self._engine.DrawScene();},1000/self.settings.fps);
		}
		if(type == "objects-physics-updated"){
			console.log("objects-physics-updated");
		}
		if(type == 'apply'){
					var calc = e.data[1];
					//console.log(calc);
					self.GetActiveScene().stack[calc.stackID].physics.velocity = new vec2(calc.newVel[0], calc.newVel[1]);
					self.GetActiveScene().stack[calc.stackID].transforms.position = new vec2(calc.newPos[0], calc.newPos[1]);
		}
	}
};


