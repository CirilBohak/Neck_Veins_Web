/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 */

THREE.EditorControls = function ( object, domElement ) {

	domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	this.enabled = true;
	this.center = new THREE.Vector3();

	// internals

	var scope = this;
	var vector = new THREE.Vector3();

	var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2 };
	var state = STATE.NONE;

	var center = this.center;
	var normalMatrix = new THREE.Matrix3();
	var pointer = new THREE.Vector2();
	var pointerOld = new THREE.Vector2();
    
    //keyboard vars 
    var moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
	var moveVector = new THREE.Vector3( 0, 0, 0 );
	var rotationVector = new THREE.Vector3( 0, 0, 0 );
    var movementSpeedMultiplier = 0;


	// events

	var changeEvent = { type: 'change' };

	this.focus = function ( target, frame ) {

		var scale = new THREE.Vector3();
		target.matrixWorld.decompose( center, new THREE.Quaternion(), scale );

		if ( frame && target.geometry ) {

			scale = ( scale.x + scale.y + scale.z ) / 3;
			center.add(target.geometry.boundingSphere.center.clone().multiplyScalar( scale ));
			var radius = target.geometry.boundingSphere.radius * ( scale );
			var pos = object.position.clone().sub( center ).normalize().multiplyScalar( radius * 2 );
			object.position.copy( center ).add( pos );

		}

		object.lookAt( center );

		scope.dispatchEvent( changeEvent );

	};

	this.pan = function ( delta ) {

		var distance = object.position.distanceTo( center );

		delta.multiplyScalar( distance * 0.001 );
		delta.applyMatrix3( normalMatrix.getNormalMatrix( object.matrix ) );

		object.position.add( delta );
		center.add( delta );

		scope.dispatchEvent( changeEvent );

	};

	this.zoom = function ( delta ) {

		var distance = object.position.distanceTo( center );

		delta.multiplyScalar( distance * 0.001 );

		if ( delta.length() > distance ) return;

		delta.applyMatrix3( normalMatrix.getNormalMatrix( object.matrix ) );

		object.position.add( delta );

		scope.dispatchEvent( changeEvent );

	};

	this.rotate = function ( delta ) {
        
		vector.copy( object.position ).sub( center );

		var theta = Math.atan2( vector.x, vector.z );
		var phi = Math.atan2( Math.sqrt( vector.x * vector.x + vector.z * vector.z ), vector.y );

		theta += delta.x;
		phi += delta.y;

		var EPS = 0.000001;

		phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

		var radius = vector.length();

		vector.x = radius * Math.sin( phi ) * Math.sin( theta );
		vector.y = radius * Math.cos( phi );
		vector.z = radius * Math.sin( phi ) * Math.cos( theta );
        //console.log(vector);
		object.position.copy( center ).add( vector );

		  object.lookAt( center );

		scope.dispatchEvent( changeEvent );

	};

	// mouse
    
    var mouseDown = false;
	var rotateStartPoint = new THREE.Vector3(0, 0, 1);
	var rotateEndPoint = new THREE.Vector3(0, 0, 1);

	var curQuaternion;
	var windowHalfX = window.innerWidth / 2;
	var windowHalfY = window.innerHeight / 2;
	var rotationSpeed = 10;
	var lastMoveTimestamp,
		moveReleaseTimeDelta = 50;

	var startPoint = {
		x: 0,
		y: 0
	};

	var deltaX = 0,
		deltaY = 0;
    
	function onMouseDown( event ) {
        isDragging = true;
		if ( scope.enabled === false ) return;

		event.preventDefault();

		if ( event.button === 0 ) {

			state = STATE.ROTATE;
            
            mouseDown = true;
            startPoint = {
                x: event.clientX,
                y: event.clientY
            };
            rotateStartPoint = rotateEndPoint = projectOnTrackball(0,0);

		} else if ( event.button === 1 ) {

			state = STATE.ZOOM;

		} /*else if ( event.button === 2 ) {

			state = STATE.PAN;

		}*/

		pointerOld.set( event.clientX, event.clientY );

		domElement.addEventListener( 'mousemove', onMouseMove, false );
		domElement.addEventListener( 'mouseup', onMouseUp, false );
		domElement.addEventListener( 'mouseout', onMouseUp, false );
		domElement.addEventListener( 'dblclick', onMouseUp, false );

	}
    
    function clamp(value, min, max)
	{
		return Math.min(Math.max(value, min), max);
	}
    
    function projectOnTrackball(touchX, touchY){
        var mouseOnBall = new THREE.Vector3();
        
        mouseOnBall.set(
            clamp(touchX / windowHalfX, -1, 1), clamp(-touchY / windowHalfY, -1, 1),
			0.0
		);
        
        var length = mouseOnBall.length();
        
        if(length > 1.0)
        {
            mouseOnBall.normalize();
        }
        else
        {
            mouseOnBall.z = Math.sqrt(1.0 - length * length);
        }
        
        return mouseOnBall;
    }

    
	function rotateMatrix(rotateStart, rotateEnd)
	{
		var axis = new THREE.Vector3(),
			quaternion = new THREE.Quaternion();

		var angle = Math.acos(rotateStart.dot(rotateEnd) / rotateStart.length() / rotateEnd.length());

		if (angle)
		{
			axis.crossVectors(rotateStart, rotateEnd).normalize();
			angle *= rotationSpeed;
			quaternion.setFromAxisAngle(axis, angle);
		}
		return quaternion;
	}
            

    function handleRotation()
	{  
		rotateEndPoint = projectOnTrackball(deltaX, deltaY);
        
        var cameraQuaternion = new THREE.Quaternion(myCamera.quaternion.x, myCamera.quaternion.y, myCamera.quaternion.z, myCamera.quaternion.w);
        
         var cameraInvQuaternion = new THREE.Quaternion(myCamera.quaternion.x, myCamera.quaternion.y, myCamera.quaternion.z, myCamera.quaternion.w);
        var cameraInvQuaternion = cameraInvQuaternion.inverse();
        console.log(cameraQuaternion);
        
        
		var rotateQuaternion = rotateMatrix(rotateStartPoint, rotateEndPoint);
        
        rotateQuaternion.multiplyQuaternions(cameraQuaternion, rotateQuaternion);
        rotateQuaternion.multiplyQuaternions(rotateQuaternion, cameraInvQuaternion);
        
		curQuaternion = sceneObject.quaternion;
		curQuaternion.multiplyQuaternions(rotateQuaternion, curQuaternion);
		curQuaternion.normalize();
		sceneObject.setRotationFromQuaternion(curQuaternion);
		rotateEndPoint = rotateStartPoint;
	}
    
    //functions for trackball controls
    /*function getMouseOnScreen(pageX, pageY){
		var vector = new THREE.Vector2();
        
        
        var box = domElement.getBoundingClientRect();
        // adjustments come from similar code in the jquery offset() function
        var d = domElement.ownerDocument.documentElement;
        this.screen.left = box.left + window.pageXOffset - d.clientLeft;
        this.screen.top = box.top + window.pageYOffset - d.clientTop;
        this.screen.width = box.width;
        this.screen.height = box.height;
        
        vector.set(
            ( pageX - this.screen.left ) / this.screen.width,
            ( pageY - this.screen.top ) / this.screen.height
        );
        return vector;
	}
    
    function getMouseProjectionOnBall (myObject, pageX, pageY) {

		var vector = new THREE.Vector3();
		var objectUp = new THREE.Vector3();
		var mouseOnBall = new THREE.Vector3();

        mouseOnBall.set(
            ( pageX - this.screen.width * 0.5 - this.screen.left ) / (this.screen.width*.5),
            ( this.screen.height * 0.5 + this.screen.top - pageY ) / (this.screen.height*.5),
            0.0
        );

        var length = mouseOnBall.length();

        if ( length > 1.0 ) {

            mouseOnBall.normalize();

        } else {

            mouseOnBall.z = Math.sqrt( 1.0 - length * length );

        }
        var eye = new THREE.Vector3(),
            target = new THREE.Vector3();
        eye.copy( myObject.position ).sub( target );
        console.log(eye);
        vector.copy( myObject.up ).setLength( mouseOnBall.y );
        
        vector.add( objectUp.copy( myObject.up ).cross( eye ).setLength( mouseOnBall.x ) );
        vector.add( eye.setLength( mouseOnBall.z ) );
        return vector;

	}*/
    
    function rotateAroundWorldAxis(object, axis, radians) {
        rotWorldMatrix = new THREE.Matrix4();
        rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
        rotWorldMatrix.multiply(object.matrix);                // pre-multiply
        object.matrix = rotWorldMatrix;
        object.rotation.setFromRotationMatrix(object.matrix);
    }
    


    function rotateAroundObjectAxis(object, axis, radians) {
        rotObjectMatrix = new THREE.Matrix4();
        rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
        object.matrix.multiply(rotObjectMatrix);
        object.rotation.setFromRotationMatrix(object.matrix);
    }
    
	function onMouseMove( event ) {
        //var myObject = scene.getObjectByName(sceneObjectName);
        //console.log(loadedObject.rotation);
        /*getMouseOnScreen(event.pageX, event.pageY);
        console.log(getMouseProjectionOnBall(sceneObject, event.pageX, event.pageY));*/
        
		if ( scope.enabled === false ) return;

		event.preventDefault();

		pointer.set( event.clientX, event.clientY );

		var movementX = pointer.x - pointerOld.x;
		var movementY = pointer.y - pointerOld.y;

		if ( state === STATE.ROTATE ) {

            /*var deltaMove = {
                x: event.offsetX - previousMousePosition.x,
                y: event.offsetY - previousMousePosition.y
            };
            
            if(isDragging){
                var deltaRotationQuaternion = new THREE.Quaternion()
                    .setFromEuler(new THREE.Euler(
                        deltaMove.y * 1 * Math.PI / 180,
                        deltaMove.x * 1 * Math.PI / 180,
                        0,
                        'XYZ'
                    ));
            }
            
            sceneObject.quaternion.multiplyQuaternions(deltaRotationQuaternion, sceneObject.quaternion);
            
            previousMousePosition = {
                x: event.offsetX,
                y: event.offsetY
            };*/
            
            deltaX = event.x - startPoint.x;
            deltaY = event.y - startPoint.y;

            handleRotation();

            startPoint.x = event.x;
            startPoint.y = event.y;

            lastMoveTimestamp = new Date();
            
            scope.dispatchEvent(changeEvent);
            
			//scope.rotate( new THREE.Vector3( - movementX * 0.005, - movementY * 0.005, 0 ) );
            
            /*var axis = new THREE.Vector3(0,1,0);
            rotateAroundObjectAxis(sceneObject, axis, Math.PI / 180 * movementX * 0.5);   //pi/180 = 
            axis = new THREE.Vector3(1,0,0);
            rotateAroundObjectAxis(sceneObject, axis, Math.PI / 180 * movementY * 0.5);
            scope.dispatchEvent( changeEvent );*/
            
            

		} else if ( state === STATE.ZOOM ) {

			scope.zoom( new THREE.Vector3( 0, 0, movementY ) );

		} /*else if ( state === STATE.PAN ) {

			scope.pan( new THREE.Vector3( - movementX, movementY, 0 ) );

		}*/

		pointerOld.set( event.clientX, event.clientY );

	}

	function onMouseUp( event ) {
        if (new Date().getTime() - lastMoveTimestamp.getTime() > moveReleaseTimeDelta)
		{
			deltaX = event.x - startPoint.x;
			deltaY = event.y - startPoint.y;
		}

		mouseDown = false;
		domElement.removeEventListener( 'mousemove', onMouseMove, false );
		domElement.removeEventListener( 'mouseup', onMouseUp, false );
		domElement.removeEventListener( 'mouseout', onMouseUp, false );
		domElement.removeEventListener( 'dblclick', onMouseUp, false );

		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		event.preventDefault();

		// if ( scope.enabled === false ) return;

		var delta = 0;

		if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

			delta = - event.wheelDelta;

		} else if ( event.detail ) { // Firefox

			delta = event.detail * 10;

		}

		scope.zoom( new THREE.Vector3( 0, 0, delta ) );

	}

	domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
	domElement.addEventListener( 'mousedown', onMouseDown, false );
	domElement.addEventListener( 'mousewheel', onMouseWheel, false );
	domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox

    
    // keyboard
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    
    function onKeyDown(event){
        if ( event.altKey ) {
			return;
		}

		//event.preventDefault();

		switch ( event.keyCode ) {

			case 16: /* shift */ movementSpeedMultiplier = .1; break;

			case 38: /*up*/ moveState.forward = 1; break;
			case 40: /*down*/ moveState.back = 1; break;

			case 37: /*left*/ moveState.left = 1; break;
			case 39: /*right*/ moveState.right = 1; break;

			case 82: /*R*/ moveState.up = 1; break;
			case 70: /*F*/ moveState.down = 1; break;

			case 83: /*S*/ moveState.pitchUp = 1; break;
			case 87: /*W*/ moveState.pitchDown = 1; break;

			case 68: /*D*/ moveState.yawLeft = 1; break;
			case 65: /*A*/ moveState.yawRight = 1; break;

			case 69: /*E*/ moveState.rollLeft = 1; break;
			case 81: /*Q*/ moveState.rollRight = 1; break;
		}
        
        updateMovementVector();
        updateRotationVector();

    }
    
    function onKeyUp(event){
        switch( event.keyCode ) {

			case 16: /* shift */ this.movementSpeedMultiplier = 1; break;

			case 38: /*up*/ moveState.forward = 0; break;
			case 40: /*down*/ moveState.back = 0; break;

			case 37: /*left*/ moveState.left = 0; break;
			case 39: /*right*/ moveState.right = 0; break;

			case 82: /*R*/ moveState.up = 0; break;
			case 70: /*F*/ moveState.down = 0; break;

			case 83: /*S*/ moveState.pitchUp = 0; break;
			case 87: /*W*/ moveState.pitchDown = 0; break;

			case 68: /*D*/ moveState.yawLeft = 0; break;
			case 65: /*A*/ moveState.yawRight = 0; break;

			case 69: /*E*/ moveState.rollLeft = 0; break;
			case 81: /*Q*/ moveState.rollRight = 0; break;

		}
        
        updateMovementVector();
        updateRotationVector();
    }
    
    function updateMovementVector() {

		var forward = ( moveState.forward) ? 1 : 0;

		moveVector.x = ( -moveState.left    + moveState.right );
		moveVector.y = ( -moveState.down    + moveState.up );
		moveVector.z = ( -forward + moveState.back );
        scope.pan( new THREE.Vector3( moveVector.x * 4, moveVector.y * 4, moveVector.z * 4) );

	}
    
    function updateRotationVector () {
        
		rotationVector.x = ( -moveState.pitchDown + moveState.pitchUp );
		rotationVector.y = ( -moveState.yawRight  + moveState.yawLeft );
		rotationVector.z = ( -moveState.rollRight + moveState.rollLeft );
        
        //scope.rotate( new THREE.Vector3( - rotationVector.x * 0.05, - rotationVector.y * 0.05, rotationVector.z * 0.05) );
        var axis = new THREE.Vector3(1,0,0);
        myCamera.rotateOnAxis(axis, - rotationVector.x * 0.02);
        axis = new THREE.Vector3(0,1,0);
        myCamera.rotateOnAxis(axis, - rotationVector.y * 0.02);
        axis = new THREE.Vector3(0,0,1);
        myCamera.rotateOnAxis(axis, - rotationVector.z * 0.02);
	}
    
	// touch

	var touch = new THREE.Vector3();

	var touches = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];
	var prevTouches = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];

	var prevDistance = null;

	function touchStart( event ) {

		if ( scope.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				touches[ 1 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				break;

			case 2:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				touches[ 1 ].set( event.touches[ 1 ].pageX, event.touches[ 1 ].pageY, 0 );
				prevDistance = touches[ 0 ].distanceTo( touches[ 1 ] );
				break;

		}

		prevTouches[ 0 ].copy( touches[ 0 ] );
		prevTouches[ 1 ].copy( touches[ 1 ] );

	}


	function touchMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		var getClosest = function( touch, touches ) {

			var closest = touches[ 0 ];

			for ( var i in touches ) {
				if ( closest.distanceTo(touch) > touches[ i ].distanceTo(touch) ) closest = touches[ i ];
			}

			return closest;

		}

		switch ( event.touches.length ) {

			case 1:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				touches[ 1 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				scope.rotate( touches[ 0 ].sub( getClosest( touches[ 0 ] ,prevTouches ) ).multiplyScalar( - 0.005 ) );
				break;

			case 2:
				touches[ 0 ].set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0 );
				touches[ 1 ].set( event.touches[ 1 ].pageX, event.touches[ 1 ].pageY, 0 );
				distance = touches[ 0 ].distanceTo( touches[ 1 ] );
				scope.zoom( new THREE.Vector3( 0, 0, prevDistance - distance ) );
				prevDistance = distance;


				var offset0 = touches[ 0 ].clone().sub( getClosest( touches[ 0 ] ,prevTouches ) );
				var offset1 = touches[ 1 ].clone().sub( getClosest( touches[ 1 ] ,prevTouches ) );
				offset0.x = -offset0.x;
				offset1.x = -offset1.x;

				scope.pan( offset0.add( offset1 ).multiplyScalar( 0.5 ) );

				break;

		}

		prevTouches[ 0 ].copy( touches[ 0 ] );
		prevTouches[ 1 ].copy( touches[ 1 ] );

	}

	domElement.addEventListener( 'touchstart', touchStart, false );
	domElement.addEventListener( 'touchmove', touchMove, false );

};

THREE.EditorControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.EditorControls.prototype.constructor = THREE.EditorControls;
