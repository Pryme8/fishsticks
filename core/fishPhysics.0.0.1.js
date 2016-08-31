//fishsticks physics WebWorker
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

vec2.prototype.clone = function () {
    return new vec2(this.x, this.y); //Make a new Instances of the vector.
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

var self = {};
onmessage = function(e) {
	var type = null;
  		if(e.data.length){
  			type = e.data[0];
  		}
	switch(type){
	case "init" :  self = new Core(e.data[1]);
	break;
	case "create-scene" :  self._CreateScene(e.data[1]);
	break;
	case "get-scene-info" : self._GetSceneInfo();
	break;
	case "start-scene" :  self._StartScene(e.data[1]);
	break;
	case "create-primitive" :  self._createPrim(e.data[1], e.data[2]);
	break;
	case "set-obj-physics" :  self._setPhysics(e.data[1], e.data[2], e.data[3]);
	break;
	case "Add-Body" :  self._AddBody(e.data[1], e.data[2], e.data[3], e.data[4]);
	break;
	}
}

Core = function(args){
	this.gravity = new vec2(args.gravity[0], args.gravity[1]) || new vec2(0,0);
	this.scenes = [];
	this.currentScene = {name: null, ID: null};
	this._int = null;
	return this;
};


Core.prototype._run = function(){
	if(this.currentScene.ID != null){
	for(var e=0; e<this.scenes[this.currentScene.ID].stack.length; e++){
		var obj  = 	this.scenes[this.currentScene.ID].stack[e];
		if(!obj.physics.on){continue}
		//console.log('run!');
		
		var tempCalc = this._calc(obj);
		var hitResults = this._StartTest(obj, tempCalc);
		var hit = false;
		for(var i=0; i < hitResults.length; i++){
			if(typeof hitResults[i] == 'object' && hitResults[i].a.physics.mass > 0){
			hit = hitResults[i];
			
			}
		}	
		
		this._apply(tempCalc, hit);
	};
   }
};

Core.prototype._StartTest = function(obj, calcs){
	if(!obj.body.enabled){return false;}
	var results = [];
	for(var i=0; i<this.scenes[this.currentScene.ID].stack.length; i++){
		if(obj.stackID == i){continue}
		var b = this.scenes[this.currentScene.ID].stack[i].body;
		results.push(obj.body._hitTest(b, calcs));
		}
	return results;
};

Core.prototype._calc = function(obj){
	
	var response = {
		stackID : obj.stackID,
	};
	
	response.newVel = new vec2(
		obj.physics.velocity.x + (obj.physics.mass * this.gravity.x), //X
		obj.physics.velocity.y + (obj.physics.mass * this.gravity.y) //Y
	);
	response.newPos = new vec2(
		obj.position.x + response.newVel.x, //X
		obj.position.y + response.newVel.y //Y
	);
	
	//console.log(response);
	return response;
	
};

Core.prototype._apply = function(calc, hit){
	var id = calc.stackID;
	var scene = this.scenes[this.currentScene.ID];
	var p,v;
	if(hit == false){
		p = calc.newPos.clone();
		v = calc.newVel.clone();
	scene.stack[id].position.copy(p);
	scene.stack[id].physics.velocity.copy(v);

	calc.newPos = [p.x,p.y];
	calc.newVel = [v.x,v.y];
	
	}else{
	if(hit.a.physics.mass > 0 && hit.b.physics.mass > 0){
		//console.log("HIT!");
		console.log(hit);
		p = calc.newPos.clone().subtract(hit.overlapN.scale(20));
		v = calc.newVel.clone().reverse();
		var p2 = hit.b.position.clone();
		v2 = hit.b.physics.velocity.clone().reverse();
		var id2 = hit.b.stackID;
		scene.stack[id].position.copy(p);
		scene.stack[id].physics.velocity.copy(v);
		scene.stack[id2].position.copy(p2);
		scene.stack[id2].physics.velocity.copy(v2);
		
		calc2 = calc;
		calc2.stackID = id2;
		calc.newPos = [p.x,p.y];
		calc.newVel = [v.x,v.y];
		calc2.newPos = [p2.x,p2.y];
		calc2.newVel = [v2.x,v2.y];
		
		postMessage(['apply',calc2]);

	}else{
		
		p = calc.newPos.clone().subtract(hit.overlapN.scale(20));
		v = calc.newVel.clone().reverse();
	
	scene.stack[id].position.copy(p);
	scene.stack[id].physics.velocity.copy(v);

	calc.newPos = [p.x,p.y];
	calc.newVel = [v.x,v.y];
	}
	//clearInterval(this._int);
	}
	
	postMessage(['apply',calc]);
	

}

Core.prototype._GetSceneInfo = function(){
	 postMessage(this.currentScene);
	 return	
};


Core.prototype._CreateScene = function(scene){
	this.scenes.push(scene);
	postMessage(['Scene-Added']);
};

Core.prototype._StartScene = function(scene){
	var id = scene.ID;
	for(var i=0; i<this.scenes.length; i++){
		var s = this.scenes[i];
		s.on = false;
		s.active = false;
	}
	var s = this.scenes[id];
	if(s){
	this.currentScene.name = scene.name;
	this.currentScene.ID = scene.ID;
	s.on = true;
	s.active = true;
	}
	postMessage(['render-scene', id]);
	
	if(this._int == null){
		this._int = setInterval(function(){self._run();},1000/30);
	}
};

Core.prototype._createPrim = function(obj, sceneID){
	obj = this._parseObject(obj);
	this.scenes[sceneID].stack.push(obj);
	//console.log(this);
};

Core.prototype._parseObject = function(obj){
	obj.position = new vec2(obj.position[0],obj.position[1]);
	obj.physics.velocity = new vec2(obj.physics.velocity[0],obj.physics.velocity[1]);
	return obj;
}

Core.prototype._setPhysics = function(update, scene, id){
	obj = this.scenes[scene].stack[id];
	obj.physics.on = update.on;
	obj.physics.velocity =  new vec2(update.velocity[0], update.velocity[1]);
	obj.physics.mass = update.mass;
	obj.physics.drag = update.drag;
	obj.physics.torque = update.torque;
	obj.physics.bounce = update.bounce;
	postMessage(['objects-physics-updated']);
};



Core.prototype._AddBody = function(id, sceneID, type ,args){

	var target = this.scenes[sceneID].stack[id];

	if(type == 'circle'){
		var b = new Core.body.CIRCLE(target, {radius:args.radius || 1});
	}
	if(type == 'box'){
		var b = new Core.body.BOX(target, {width:args.width || 1, height:args.height || 1});		
	}
	if(type == 'poly'){
		//console.log("ADD BODY POINTS");
		console.log(args.points);
		var b = new Core.body.POLY(target, {points:args.points || []});		
	}
	target.body = b;
};


//COLLISION BODYS
Core.body = function(parent, args){
	args = this.args || args || {};
	this._parent = this._parent || parent;
	this.offset = this.offset || args.offset || new vec2();
	this.angle = this.angle || args.angle || 0;
	this.shape = this.shape || args.type || 'point';
	this.enabled = this.enabled || args.enabled || true;
	return this;
};

Core.body.prototype._hitTest = function(target, preCalc){
	var a = this;
	var b = target;
	var test = false;
	if(a.shape == "CIRCLE" && b.shape == "CIRCLE"){
	test = Core.Test.Circle2Circle(a._parent, b._parent, preCalc);
	}
	return test;
	
};

Core.body.CIRCLE = function (parent, args) {
	this.shape = "CIRCLE";
	this.offset = args.offset || new vec2();
    this.radius = args.radius || 1;
	this._parent = parent;
	this.enabled = args.enabled || true;
	this.args = args;
	Core.body.call(this, parent, args);
	
};

Core.body.CIRCLE.prototype = new Core.body();
Core.body.CIRCLE.prototype.constructor = Core.body.CIRCLE;

Core.body.CIRCLE.prototype.getAABB = function() {
    var r = this.radius;
    var corner = this._parent.position.clone().subtract(new vec2(r, r));
    return new HITBOX(corner, r*2, r*2, this._parent).toPolygon();
};

Core.body.BOX = function (parent, args) {
	//console.log('making-box body');
	this.shape = "BOX";
	this.offset = args.offset || new vec2();
    this.width = args.width || 1;
	this.height = args.height || 1;
	this._parent = parent;
	this.enabled = args.enabled || true;
	this.args = args;
	Core.body.call(this, parent, args);
};

Core.body.BOX.prototype.toPolygon = function() {
    var w = this.width;
    var h = this.height;
    return Core.body.POLY(this._parent, {points:
	[
	new vec2(), new vec2(w, 0), 
    new vec2(w,h), new vec2(0,h)
	]
	});
};

Core.body.BOX.prototype = new Core.body();
Core.body.BOX.prototype.constructor = Core.body.BOX;



Core.body.POLY = function(parent, args) {
   	this.shape = "POLY";
	this.offset = args.offset || new vec2();
	this._parent = parent;
	this.enabled = args.enabled || true;
	this.args = args;
	//console.log("ARGS POINTS:");
	//console.log(args.points);
    this.setPoints(args.points || []); // ALWAYS USE THE SET POINTS FUNCTION!
	Core.body.call(this, parent, args);
}

Core.body.POLY.prototype = new Core.body();
Core.body.POLY.prototype.constructor = Core.body.POLY;


Core.body.POLY.prototype.setPoints = function(points) {
  
    var l = !this.points || this.points.length !== points.length;
    if (l) {
		//RESET ARRAYS
     this.calcPoints = new Array(points.length);
     this.edges = new Array(points.length);
     this.normals = new Array(points.length);
 	}
	
    this.points = points;
    this._recalc();
    return this;
};

Core.body.POLY.prototype.setAngle = function(angle) {
    this.angle = angle;
    this._recalc();
    return this;
};

Core.body.POLY.prototype.setOffset = function(offset) {
    this.offset = offset;
    this._recalc();
    return this;
};

rotate = function(angle) {
    var points = this.points
    var len = points.length;
    for (var i = 0; i < len; i++) {
      points[i].rotate(angle);
    }
    this._recalc();
    return this;
};

Core.body.POLY.prototype.translate = function (x, y) {
    var points = this.points;
    var len = points.length;
    for (var i = 0; i < len; i++) {
      points[i].x += x;
      points[i].y += y;
    }
    this._recalc();
    return this;
};

Core.body.POLY.prototype._recalc = function() {

    var calcPoints = this.calcPoints;
    var edges = this.edges;
    var normals = this.normals;
 
    var points = this.points;

    var offset = this.offset;
    var angle =  this.angle;
    var len = points.length;
    var i;
    for (i = 0; i < len; i++) {
      var calcPoint = new vec2(points[i].x, points[i].y);
      calcPoint.x += offset.x;
      calcPoint.y += offset.y;
      if (angle !== 0) {
        calcPoint.rotate(angle);
      }
  
	  calcPoints[i] = calcPoint.clone();

    }
    // Calculate the edges/normals

    for (i = 0; i < len; i++) {
      var p1 = calcPoints[i].clone();
      var p2 = (i < len - 1) ? calcPoints[i + 1].clone() : calcPoints[0].clone();
      var e = p2.subtract(p1);
	  edges[i] = e.clone();
      normals[i] = e.perp().normalize();
    }
	this.calcPoints = calcPoints;
	this.normals = normals;
	this.edges = edges;
	
	//console.log(this);
    return this;
};

Core.body.POLY.prototype.getAABB = function() {
    var points = this.calcPoints;
    var len = points.length;
    var xMin = points[0].x
    var yMin = points[0].y
    var xMax = points[0].x
    var yMax = points[0].y
    for (var i = 1; i < len; i++) {
      var point = points[i];
      if (point.x < xMin) {
        xMin = point.x;
      }
      else if (point.x > xMax) {
        xMax = point.x;
      }
      if (point.y < yMin) {
        yMin = point.y;
      }
      else if (point.y > yMax) {
        yMax = point.y;
      }
    }
    return new HITBOX(this._parent.position.clone().add(new vec2(xMin, yMin)), xMax - xMin, yMax - yMin, this._parent).toPolygon();
};

Core.body.HITBOX = function(pos, w, h, parent) {
    this.position = pos || new vec3();
    this.w = w || 0;
    this.h = h || 0;
	this._parent = parent;
}

Core.body.HITBOX.prototype = new Core.body();
Core.body.HITBOX.prototype.constructor = Core.body.HITBOX;

Core.body.HITBOX.prototype.toPolygon = function() {
    var w = this.w;
    var h = this.h;
   return Core.body.POLY(this._parent, {points:
	[
	new vec2(), new vec2(w, 0), 
    new vec2(w,h), new vec2(0,h)
	]
	});
	

};





Core.Test = {};
Core.Test.Circle2Box = function(circle, box, preCalc){
	
	var circlePos = (preCalc.newPos).add(circle.body.offset);
	var boxPos = (box.position).add(box.body.offset);
    var radius = circle.body.radius;
    var radius2 = radius * radius;
    var width = box.body.width;
	var height = box.body.height;
	var hw = width*0.5, hh = height*0.5;
	
	var boxPoints = [
		new vec2(-hw, -hh).add(boxPos),
		new vec2(hw, -hh).add(boxPos),
		new vec2(hw, hh).add(boxPos),
		new vec2(-hw, hh).add(boxPos)
		];
	
		
	if(circlePos.y + radius > boxPoints[0].y ){
	return true;
	}
	
	
	return false;
};

  
Core.Test.Circle2Circle = function (a, b, preCalc) {
	

    var differenceV = b.position.clone().subtract(a.position);	
	
    var totalRadius = a.body.radius + b.body.radius;
	
    var totalRadiusSq = totalRadius * totalRadius;
	
    var distanceSq = differenceV.len2();
    if (distanceSq > totalRadiusSq) {
      return false;
    }
    
	var response = {};
  
      var dist = Math.sqrt(distanceSq);
      response.a = a;
      response.b = b;
      response.overlap = totalRadius - dist;
      response.overlapN = differenceV.clone().normalize();
      response.overlapV = differenceV.clone().scale(response.overlap);
      response.aInB= a.body.radius <= b.body.radius && dist <= b.body.radius - a.body.radius;
      response.bInA = b.body.radius <= a.body.radius && dist <= a.body.radius - b.body.radius;
   
    return response;
}


