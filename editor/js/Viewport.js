/**
 * @author mrdoob / http://mrdoob.com/
 */



var Viewport = function ( editor ) {
	var signals = editor.signals;

    signals.cameraReset.add( function ( ) {
        var camera = editor.camera;
        camera.position.set(cameraStartPosition[0], cameraStartPosition[1], cameraStartPosition[2]);
        camera.lookAt(new THREE.Vector3(0,0,0));
        var lookAtVector = new THREE.Vector3( 0, 0, -1 );
        lookAtVector.applyQuaternion(camera.quaternion);
        var sceneLight = scene.getObjectByName('InitPointLight');
        var x = camera.position.x - lookAtVector.x * 10;
        var y = camera.position.y - lookAtVector.y * 10;
        var z = camera.position.z - lookAtVector.z * 10;
        sceneLight.position.set(x, y, z);
        render();
    } );
    
	var container = new UI.Panel();
	container.setId( 'viewport' );
	container.setPosition( 'absolute' );

	container.add( new Viewport.Info( editor ) );

	var scene = editor.scene;
	var sceneHelpers = editor.sceneHelpers;

	var objects = [];

	// helpers

	var grid = new THREE.GridHelper( 500, 25 );
	sceneHelpers.add( grid );

	//

	var camera = editor.camera;
	camera.position.fromArray( editor.config.getKey( 'camera/position' ) );
	camera.lookAt( new THREE.Vector3().fromArray( editor.config.getKey( 'camera/target' ) ) );

	//

	var selectionBox = new THREE.BoxHelper();
	selectionBox.material.depthTest = false;
	selectionBox.material.transparent = true;
	selectionBox.visible = false;
	sceneHelpers.add( selectionBox );

	var transformControls = new THREE.TransformControls( camera, container.dom );
	transformControls.addEventListener( 'change', function () {

		var object = transformControls.object;

		if ( object !== undefined ) {

			if ( editor.helpers[ object.id ] !== undefined ) {

				editor.helpers[ object.id ].update();

			}

		}

		render();

	} );
	transformControls.addEventListener( 'mouseDown', function () {

		controls.enabled = false;

	} );
	transformControls.addEventListener( 'mouseUp', function () {

		signals.objectChanged.dispatch( transformControls.object );
		controls.enabled = true;

	} );

	sceneHelpers.add( transformControls );

	// fog

	var oldFogType = "None";
	var oldFogColor = 0xaaaaaa;
	var oldFogNear = 1;
	var oldFogFar = 5000;
	var oldFogDensity = 0.00025;

	// object picking

	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();

	// events

	var getIntersects = function ( point, object ) {

		mouse.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );

		raycaster.setFromCamera( mouse, camera );

		if ( object instanceof Array ) {

			return raycaster.intersectObjects( object );

		}

		return raycaster.intersectObject( object );

	};

	var onDownPosition = new THREE.Vector2();
	var onUpPosition = new THREE.Vector2();
	var onDoubleClickPosition = new THREE.Vector2();

	var getMousePosition = function ( dom, x, y ) {

		var rect = dom.getBoundingClientRect();
		return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];

	};

	var handleClick = function () {

		if ( onDownPosition.distanceTo( onUpPosition ) == 0 ) {

			var intersects = getIntersects( onUpPosition, objects );

			if ( intersects.length > 0 ) {

				var object = intersects[ 0 ].object;

				if ( object.userData.object !== undefined ) {

					// helper

					editor.select( object.userData.object );

				} else {

					editor.select( object );

				}

			} else {

				editor.select( null );

			}

			render();

		}

	};

	var onMouseDown = function ( event ) {

		event.preventDefault();

		var array = getMousePosition( container.dom, event.clientX, event.clientY );
		onDownPosition.fromArray( array );
        
		document.addEventListener( 'mouseup', onMouseUp, false );

	};

	var onMouseUp = function ( event ) {

		var array = getMousePosition( container.dom, event.clientX, event.clientY );
		onUpPosition.fromArray( array );

		handleClick();

		document.removeEventListener( 'mouseup', onMouseUp, false );

	};

	var onTouchStart = function ( event ) {

		var touch = event.changedTouches[ 0 ];

		var array = getMousePosition( container.dom, touch.clientX, touch.clientY );
		onDownPosition.fromArray( array );

		document.addEventListener( 'touchend', onTouchEnd, false );

	};

	var onTouchEnd = function ( event ) {

		var touch = event.changedTouches[ 0 ];

		var array = getMousePosition( container.dom, touch.clientX, touch.clientY );
		onUpPosition.fromArray( array );

		handleClick();

		document.removeEventListener( 'touchend', onTouchEnd, false );

	};

	var onDoubleClick = function ( event ) {

		var array = getMousePosition( container.dom, event.clientX, event.clientY );
		onDoubleClickPosition.fromArray( array );

		var intersects = getIntersects( onDoubleClickPosition, objects );

		if ( intersects.length > 0 ) {

			var intersect = intersects[ 0 ];

			signals.objectFocused.dispatch( intersect.object );

		}

	};

	container.dom.addEventListener( 'mousedown', onMouseDown, false );
	container.dom.addEventListener( 'touchstart', onTouchStart, false );
	container.dom.addEventListener( 'dblclick', onDoubleClick, false );

	// controls need to be added *after* main logic,
	// otherwise controls.enabled doesn't work.

	var controls = new THREE.EditorControls( camera, container.dom );
	controls.center.fromArray( editor.config.getKey( 'camera/target' ) );
	controls.addEventListener( 'change', function () {

		transformControls.update();
		signals.cameraChanged.dispatch( camera );

	} );
    
    /*var flyControls = new THREE.FlyControls(camera, container.dom);
    flyControls.movementSpeed = 25;
    flyControls.rollSpeed = Math.PI / 24;
    flyControls.autoForward = true;
    flyControls.dragToLook = true;
    flyControls.updateCamera = function(){
        transformControls.update();
		signals.cameraChanged.dispatch( camera );
    }*/

	// signals

	signals.editorCleared.add( function () {
        if(controls.center != null)
            controls.center.set( 0, 0, 0 );
		render();

	} );
    
    signals.editorInitCleared.add( function () {
       render(); 
    });

	signals.themeChanged.add( function ( value ) {

		switch ( value ) {

			case 'css/light.css':
				grid.setColors( 0x444444, 0x888888 );
				clearColor = 0xaaaaaa;
				break;
			case 'css/dark.css':
				grid.setColors( 0xbbbbbb, 0x888888 );
				clearColor = 0x333333;
				break;

		}

		renderer.setClearColor( clearColor );

		render();

	} );

	signals.transformModeChanged.add( function ( mode ) {

		transformControls.setMode( mode );

	} );

	signals.snapChanged.add( function ( dist ) {

		transformControls.setSnap( dist );

	} );

	signals.spaceChanged.add( function ( space ) {

		transformControls.setSpace( space );

	} );

	signals.rendererChanged.add( function ( type, antialias ) {

		container.dom.removeChild( renderer.domElement );

		renderer = createRenderer( type, antialias );
		renderer.setClearColor( clearColor );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( container.dom.offsetWidth, container.dom.offsetHeight );

		container.dom.appendChild( renderer.domElement );

		render();

	} );

	signals.sceneGraphChanged.add( function () {

		render();

	} );

	var saveTimeout;
    
    
	signals.cameraChanged.add( function () {
		if ( saveTimeout !== undefined ) {

			clearTimeout( saveTimeout );

		}

        
        // get camera look at vector
        var lookAtVector = new THREE.Vector3( 0, 0, -1 );
        lookAtVector.applyQuaternion(camera.quaternion);
        
        // reposition the light to cameras position
        //var sceneLight = scene.getObjectByName('InitPointLight');
        //sceneLight.position.set(camera.position.x, camera.position.y, camera.position.z);
        
        // reposition the light to cameras position using the cameras lookAtVector
        var sceneLight = scene.getObjectByName('InitPointLight');
        var x = camera.position.x - lookAtVector.x * 10;
        var y = camera.position.y - lookAtVector.y * 10;
        var z = camera.position.z - lookAtVector.z * 10;
        sceneLight.position.set(x, y, z);
        
        
		saveTimeout = setTimeout( function () {
            if(camera.position != null && controls.center != null)
                editor.config.setKey(
                    'camera/position', camera.position.toArray(),
                    'camera/target', controls.center.toArray()
                );
            
            
		}, 1000 );
		render();

	} );

	signals.objectSelected.add( function ( object ) {

		selectionBox.visible = false;
		transformControls.detach();

		if ( object !== null ) {

			if ( object.geometry !== undefined &&
				 object instanceof THREE.Sprite === false ) {

				selectionBox.update( object );
				selectionBox.visible = true;

			}

			transformControls.attach( object );

		}

		render();

	} );

	signals.objectFocused.add( function ( object ) {

		controls.focus( object );

	} );

	signals.geometryChanged.add( function ( geometry ) {

		selectionBox.update( editor.selected );

		render();

	} );

	signals.objectAdded.add( function ( object ) {

		var materialsNeedUpdate = false;

		object.traverse( function ( child ) {

			if ( child instanceof THREE.Light ) materialsNeedUpdate = true;

			objects.push( child );

		} );

		if ( materialsNeedUpdate === true ) updateMaterials();

	} );

	signals.objectChanged.add( function ( object ) {

		transformControls.update();

		if ( object.geometry !== undefined ) {

			selectionBox.update( object );

		}

		if ( object instanceof THREE.PerspectiveCamera ) {

			object.updateProjectionMatrix();

		}

		if ( editor.helpers[ object.id ] !== undefined ) {

			editor.helpers[ object.id ].update();

		}

		render();

	} );

	signals.objectRemoved.add( function ( object ) {

		var materialsNeedUpdate = false;

		object.traverse( function ( child ) {

			if ( child instanceof THREE.Light ) materialsNeedUpdate = true;

			objects.splice( objects.indexOf( child ), 1 );

		} );

		if ( materialsNeedUpdate === true ) updateMaterials();

	} );

	signals.helperAdded.add( function ( object ) {

		objects.push( object.getObjectByName( 'picker' ) );

	} );

	signals.helperRemoved.add( function ( object ) {

		objects.splice( objects.indexOf( object.getObjectByName( 'picker' ) ), 1 );

	} );

	signals.materialChanged.add( function ( material ) {

		render();

	} );

	signals.fogTypeChanged.add( function ( fogType ) {

		if ( fogType !== oldFogType ) {

			if ( fogType === "None" ) {

				scene.fog = null;

			} else if ( fogType === "Fog" ) {

				scene.fog = new THREE.Fog( oldFogColor, oldFogNear, oldFogFar );

			} else if ( fogType === "FogExp2" ) {

				scene.fog = new THREE.FogExp2( oldFogColor, oldFogDensity );

			}

			updateMaterials();

			oldFogType = fogType;

		}

		render();

	} );

	signals.fogColorChanged.add( function ( fogColor ) {

		oldFogColor = fogColor;

		updateFog( scene );

		render();

	} );

	signals.fogParametersChanged.add( function ( near, far, density ) {

		oldFogNear = near;
		oldFogFar = far;
		oldFogDensity = density;

		updateFog( scene );

		render();

	} );

	signals.windowResize.add( function () {

		camera.aspect = (container.dom.offsetWidth + 300) / (container.dom.offsetHeight + 32);
		camera.updateProjectionMatrix();
        renderer.setSize( container.dom.offsetWidth + 300, container.dom.offsetHeight + 32);
        //renderer.setSize( container.dom.offsetWidth, container.dom.offsetHeight);

		render();

	} );

	signals.showGridChanged.add( function ( showGrid ) {

		grid.visible = showGrid;
		render();

	} );

	var animations = [];

	signals.playAnimation.add( function ( animation ) {

		animations.push( animation );

	} );

	signals.stopAnimation.add( function ( animation ) {

		var index = animations.indexOf( animation );

		if ( index !== -1 ) {

			animations.splice( index, 1 );

		}

	} );

	//

	var createRenderer = function ( type, antialias ) {

		if ( type === 'WebGLRenderer' && System.support.webgl === false ) {

			type = 'CanvasRenderer';

		}

		var renderer = new THREE[ type ]( { antialias: antialias } );
		renderer.autoClear = false;
		renderer.autoUpdateScene = false;

		return renderer;

	};

	var clearColor;
	var renderer = createRenderer( editor.config.getKey( 'renderer' ), editor.config.getKey( 'renderer/antialias' ) );
	container.dom.appendChild( renderer.domElement );

	animate();

	//

	function updateMaterials() {

		editor.scene.traverse( function ( node ) {

			if ( node.material ) {

				node.material.needsUpdate = true;

				if ( node.material instanceof THREE.MeshFaceMaterial ) {

					for ( var i = 0; i < node.material.materials.length; i ++ ) {

						node.material.materials[ i ].needsUpdate = true;

					}

				}

			}

		} );

	}

	function updateFog( root ) {

		if ( root.fog ) {

			root.fog.color.setHex( oldFogColor );

			if ( root.fog.near !== undefined ) root.fog.near = oldFogNear;
			if ( root.fog.far !== undefined ) root.fog.far = oldFogFar;
			if ( root.fog.density !== undefined ) root.fog.density = oldFogDensity;

		}

	}

    
    // State of the different controls

    
    var controls = {
        left: false,
        up: false,
        right: false,
        down: false
    };


    // When the user presses a key 
    $(document).keydown(function (e) {
        var prevent = true;
        // Update the state of the attached control to "true"
        switch (e.keyCode) {
            case 37:
                controls.left = true;
                break;
            case 38:
                controls.up = true;
                break;
            case 39:
                controls.right = true;
                break;
            case 40:
                controls.down = true;
                break;
            default:
                prevent = false;
        }
        // Avoid the browser to react unexpectedly
        if (prevent) {
            e.preventDefault();
        } else {
            return;
        }
        // Update the character's direction
    });
    // When the user releases a key
    $(document).keyup(function (e) {
        var prevent = true;
        // Update the state of the attached control to "false"
        switch (e.keyCode) {
            case 37:
                controls.left = false;
                break;
            case 38:
                controls.up = false;
                break;
            case 39:
                controls.right = false;
                break;
            case 40:
                controls.down = false;
                break;
            default:
                prevent = false;
        }
        // Avoid the browser to react unexpectedly
        if (prevent) {
            e.preventDefault();
        } else {
            return;
        }
    });

    
    
	function animate() {
        
		requestAnimationFrame( animate );
        /*if(controls.left == true){
            /*editor.camera.translateX(100);
            //console.log(editor.camera.position);
            var lookAtVector = new THREE.Vector3( 0, 0, -1 );
            lookAtVector.applyQuaternion(editor.camera.quaternion);
            lookAtVector.setX(lookAtVector.x + 100)
            console.log(lookAtVector);
            controls.target.set(-1,0,0);
            editor.camera.lookAt(new THREE.Vector3(1000,0,0)); */ 
        //}
		// animations
        
		if ( THREE.AnimationHandler.animations.length > 0 ) {

			THREE.AnimationHandler.update( 0.016 );
            
			for ( var i = 0, l = sceneHelpers.children.length; i < l; i ++ ) {

				var helper = sceneHelpers.children[ i ];

				if ( helper instanceof THREE.SkeletonHelper ) {

					helper.update();

				}

			}

			render();

		}

	}

	function render() {
        
        
		sceneHelpers.updateMatrixWorld();
		scene.updateMatrixWorld();

		renderer.clear();
        
        
		renderer.render( scene, camera );

		if ( renderer instanceof THREE.RaytracingRenderer === false ) {

			renderer.render( sceneHelpers, camera );

		}

	}

	return container;

}

