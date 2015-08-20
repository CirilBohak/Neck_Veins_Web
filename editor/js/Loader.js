/**
 * @author mrdoob / http://mrdoob.com/
 */

var Loader = function ( editor ) {
    
    var rotWorldMatrix;      
    function rotateAroundWorldAxis( object, axis, radians ) {
        rotWorldMatrix = new THREE.Matrix4();
        rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
        rotWorldMatrix.multiply(object.matrix);        // pre-multiply
        object.matrix = rotWorldMatrix;
        object.rotation.setFromRotationMatrix(object.matrix, object.order);
    } 
    
	var scope = this;
	var signals = editor.signals;

	this.loadFile = function ( file, file1 ) {
        var supportedExtensions = ['awd', 'babylon', 'babylonmeshdata', 'ctm', 'dae', 'js', 'json', '3geo', '3mat', '3obj', '3scn', 'obj', 'mhd', 'ply', 'stl', 'vtk'];
		var filename = file.name;
		var extension = filename.split( '.' ).pop().toLowerCase();
        if(typeof file1 != 'undefined'){
            var filenameRaw = file1.name;
            var extensionRaw = filenameRaw.split( '.' ).pop().toLowerCase();

            var buffer;
            if(supportedExtensions.indexOf(extensionRaw) > -1 && supportedExtensions.indexOf(extension) < 0){
                buffer = file;
                file = file1;
                file1 = buffer;
                buffer = extension;
                extension = extensionRaw;
                extensionRaw = buffer;
            }
        }
		switch ( extension ) {

			case 'awd':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var loader = new THREE.AWDLoader();
					var scene = loader.parse( event.target.result );

					editor.setScene( scene );

				}, false );
				reader.readAsArrayBuffer( file );

				break;

			case 'babylon':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;
					var json = JSON.parse( contents );

					var loader = new THREE.BabylonLoader();
					var scene = loader.parse( json );

					editor.setScene( scene );

				}, false );
				reader.readAsText( file );

				break;

			case 'babylonmeshdata':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;
					var json = JSON.parse( contents );

					var loader = new THREE.BabylonLoader();

					var geometry = loader.parseGeometry( json );
					var material = new THREE.MeshPhongMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );
				reader.readAsText( file );

				break;

			case 'ctm':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var data = new Uint8Array( event.target.result );

					var stream = new CTM.Stream( data );
					stream.offset = 0;

					var loader = new THREE.CTMLoader();
					loader.createModel( new CTM.File( stream ), function( geometry ) {

						geometry.sourceType = "ctm";
						geometry.sourceFile = file.name;

						var material = new THREE.MeshPhongMaterial();

						var mesh = new THREE.Mesh( geometry, material );
						mesh.name = filename;

						editor.addObject( mesh );
						editor.select( mesh );

					} );

				}, false );
				reader.readAsArrayBuffer( file );

				break;

			case 'dae':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var parser = new DOMParser();
					var xml = parser.parseFromString( contents, 'text/xml' );

					var loader = new THREE.ColladaLoader();
					loader.parse( xml, function ( collada ) {

						collada.scene.name = filename;

						editor.addObject( collada.scene );
						editor.select( collada.scene );

					} );

				}, false );
				reader.readAsText( file );

				break;

			case 'js':
			case 'json':

			case '3geo':
			case '3mat':
			case '3obj':
			case '3scn':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					// 2.0

					if ( contents.indexOf( 'postMessage' ) !== -1 ) {

						var blob = new Blob( [ contents ], { type: 'text/javascript' } );
						var url = URL.createObjectURL( blob );

						var worker = new Worker( url );

						worker.onmessage = function ( event ) {

							event.data.metadata = { version: 2 };
							handleJSON( event.data, file, filename );

						};

						worker.postMessage( Date.now() );

						return;

					}

					// >= 3.0

					var data;

					try {

						data = JSON.parse( contents );

					} catch ( error ) {

						alert( error );
						return;

					}

					handleJSON( data, file, filename );

				}, false );
				reader.readAsText( file );

				break;
            /* New and changed obj reader for this project */
			case 'obj':
                
				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {
                    
					var contents = event.target.result;
                    
					var object = new THREE.OBJLoader().parse( contents );
                    
                    var vertexAvgX = 0, 
                        vertexAvgY = 0, 
                        vertexAvgZ = 0;
                    
                    // Get mesh and add color to the mesh
                    
                    object.traverse(function(child){
                        if(child instanceof THREE.Mesh){
                            child.material.color.setRGB(1,0,0);
                            child.material.side = THREE.BackSide;
                        }
                        
                        if(child.geometry !== undefined){
                            var geometry = child.geometry;
                            var vertices = geometry.attributes.position.array;
                            //geometry.computeVertexNormals();
                            for(ij = 0; ij < geometry.attributes.normal.array.length; ij++){
                                geometry.attributes.normal.array[ij] = -geometry.attributes.normal.array[ij];
                            }
                            
                            
                            
                            //console.log(normals);
                            for(var i = 0; i < vertices.length; i = i + 3){
                                //console.log(vertices[i] + " " + vertices[i+1] + " " + vertices[i+2]);
                                vertexAvgX = vertexAvgX + vertices[i];
                                vertexAvgY = vertexAvgY + vertices[i+1];
                                vertexAvgZ = vertexAvgZ + vertices[i+2];
                                
                            }
                            vertexAvgX = Math.round(vertexAvgX / (vertices.length / 3) * 10) / 10;
                            vertexAvgY = Math.round(vertexAvgY / (vertices.length / 3) * 10) / 10;
                            vertexAvgZ = Math.round(vertexAvgZ / (vertices.length / 3) * 10) / 10;
                            //console.log(vertexAvgX + " " + vertexAvgY + " " + vertexAvgZ);
                            
                            
                            
                            geometry.attributes.position.needsUpdate = true;
                            for(var i = 0; i < vertices.length; i = i + 3){
                                //console.log(vertices[i] + " " + vertices[i+1] + " " + vertices[i+2]);
                                vertices[i] = vertices[i] - vertexAvgX;
                                vertices[i+1] = vertices[i+1] - vertexAvgY;
                                vertices[i+2] = vertices[i+2] - vertexAvgZ;
                            }

                        }
                        
                    });
                    
					object.name = filename;
                    //object.rotation.set(Math.PI/180 * -90, Math.PI/180 * -45, Math.PI/180 * -135);
                    //object.rotation.set(Math.PI/180 * -90, 1, 1);
                    // rotate around x axis
                    /*var quaternionX = new THREE.Quaternion();
                    quaternionX.setFromAxisAngle(new THREE.Vector3( 1, 0, 0 ), Math.PI/180 * -180); // axis must be normalized, angle in radians
                    object.quaternion.multiplyQuaternions( quaternionX, object.quaternion );*/
                    
                    
					editor.addObject( object );
                    sceneObject = editor.scene.getObjectByName(filename);
                    myCamera = editor.camera;
                    //change initial rotation
                    rotateAroundWorldAxis( sceneObject, new THREE.Vector3( 0, 1, 0 ), Math.PI/180 * -87.5 );
                    rotateAroundWorldAxis( sceneObject, new THREE.Vector3( 0, 0, 1 ), Math.PI/180 * -45 );
                    rotateAroundWorldAxis( sceneObject, new THREE.Vector3( 0, 1, 0 ), Math.PI/180 * -45 );
                    
                    var light = new THREE.PointLight( 0xffffff, 1, 0 ); 
                    // color, intensity, distance
                    light.name = 'InitPointLight';
                    
                    light.position.set(editor.camera.position.x, editor.camera.position.y, editor.camera.position.z + 10);
                    editor.addObject( light );
                    editor.camera.lookAt(new THREE.Vector3(0,0,0));         
                    cameraStartPosition = editor.camera.position.toArray();
                    
                    //define camera controls
                    
                    
                    
                    // x is red, y is green z is blue
                    var axis = new THREE.AxisHelper(100);
                    editor.scene.add(axis);
                    
                    
                    //console.log("camera position: x = " + editor.camera.position.x + "; y = " + editor.camera.position.y + "; z = " + editor.camera.position.z);
                    /*var controls = new THREE.OrbitControls(editor.camera);
                    controls.damping = 0.2;
				    controls.addEventListener( 'change', render );*/
                    

				}, false );
				reader.readAsText( file );

				break;
                
            case 'mhd':
                if(typeof file1 === 'undefined'){
                    alert("You have to select a mhd file and its corresponding raw file in order for us to open the 3D model.");
                }
                else{
                    var reader = new FileReader();
                    reader.addEventListener( 'load', function (event) {
                        
                        var contents = event.target.result;
                        mhdContent = {
                            Nx: null, Ny: null, Nz: null, // int
                            dx: null, dy: null, dz: null, // double
                            tx: null, ty: null, tz: null, // double
                            rotationMatrix: null, // double matrix 4x4
                            elementByteOrder: null, // boolean
                            elementType: null, //string
                            rawFile: null // string
                        };
                        
                        //matrixSize = contents.length;
                        //alert(matrixSize);


                        contents = contents.replace(/=/g,' ').replace(/\s\s+/g, ' ').trim().split( " " );
                        var i = 0;
                        while(i < contents.length){
                            switch (contents[i]) {
                                case "ObjectType":
                                    i++;
                                    break;
                                case "NDims":
                                    i++;
                                    break;
                                case "DimSize":
                                    mhdContent.Nx = parseInt(contents[i+1]);
                                    mhdContent.Ny = parseInt(contents[i+2]);
                                    mhdContent.Nz = parseInt(contents[i+3]);
                                    console.log("dim size before : " + i);
                                    i+=3;
                                    console.log("dim size after : " + i);
                                    break;
                                case "ElementSpacing":
                                    mhdContent.dx = parseFloat(contents[i+1]);
                                    mhdContent.dy = parseFloat(contents[i+2]);
                                    mhdContent.dz = parseFloat(contents[i+3]);
                                    i+=3;
                                    break;
                                case "Position":
                                    mhdContent.tx = parseFloat(contents[i+1]);
                                    mhdContent.ty = parseFloat(contents[i+2]);
                                    mhdContent.tz = parseFloat(contents[i+3]);
                                    i+=3;
                                    break;
                                case "Orientation":
                                    mhdContent.rotationMatrix = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
                                    for(var j = 0; j < 4; j++){
                                        for(var k = 0; k < 4; k++){
                                            if(j >= 3 || k >= 3){
                                                mhdContent.rotationMatrix[j][k] = ((j == k) ? 1 : 0);
                                            }
                                            else{
                                                mhdContent.rotationMatrix[j][k] = parseFloat(contents[i+1]);
                                                i+=1;
                                            }
                                        }
                                    }
                                    for(var j = 0; j < 4; j++){
                                        //console.log("row number " + j + ":   " + mhdContent.rotationMatrix[j][0] + " " + mhdContent.rotationMatrix[j][1] + " " + mhdContent.rotationMatrix[j][2] + " " + mhdContent.rotationMatrix[j][3]);
                                    }
                                    break;
                                case "AnatomicalOrientation":
                                    i+=1;
                                    break;
                                case "ElementByteOrderMSB":
                                    mhdContent.elementByteOrder = (( "false" == contents[i+1].toLowerCase()) ? false : true);
                                    i+=1;
                                    break;
                                case "ElementType":
                                    mhdContent.elementType = contents[i+1]; 
                                    i+=1;
                                    break;
                                case "ElementDataFile":
                                    mhdContent.rawFile = contents[i+1]; 
                                    i+=1; 
                                    break;
                            }
                            i++;
                        }
                        if(mhdContent.rawFile != file1.name){
                            alert("The second file does not match the raw file defined in the mhd file.");    
                        }else{
                            //get content of second file and initiate kernel   
                            
                            //FileReader.readAsBinaryString(Blob|File): The result property will contain the file/blob's data as a binary string. Every byte is represented by an integer in the range of 0 to 255.
                            start = 0;
                            end = file1.size; // this is a blob 
                            rawDataFromFile = "";
                            // start and end byte 
                            console.log("going in");
                            rawReader.readAsBinaryString(file1);
                            
                        }

                    }, false);
                    
                    var rawReader = new FileReader();
                    
                    rawReader.addEventListener( 'load', function (event) {
                        var rawData = event.target.result;
                        console.log("going into init");
                        marchingCubesInit(mhdContent, rawData);
                        

                    }, false);
                    
                    reader.readAsText( file );
                }
                break;
                
			case 'ply':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {
                    
					var contents = event.target.result;

					var geometry = new THREE.PLYLoader().parse( contents );
					geometry.sourceType = "ply";
					geometry.sourceFile = file.name;

					var material = new THREE.MeshPhongMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );
				reader.readAsText( file );

				break;

			case 'stl':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.STLLoader().parse( contents );
					geometry.sourceType = "stl";
					geometry.sourceFile = file.name;

					var material = new THREE.MeshPhongMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );

				if ( reader.readAsBinaryString !== undefined ) {

					reader.readAsBinaryString( file );

				} else {

					reader.readAsArrayBuffer( file );

				}

				break;

			/*
			case 'utf8':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.UTF8Loader().parse( contents );
					var material = new THREE.MeshLambertMaterial();

					var mesh = new THREE.Mesh( geometry, material );

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );
				reader.readAsBinaryString( file );

				break;
			*/

			case 'vtk':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.VTKLoader().parse( contents );
					geometry.sourceType = "vtk";
					geometry.sourceFile = file.name;

					var material = new THREE.MeshPhongMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );
				reader.readAsText( file );

				break;

			case 'wrl':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var result = new THREE.VRMLLoader().parse( contents );

					editor.setScene( result );

				}, false );
				reader.readAsText( file );

				break;

			default:

				alert( 'Unsupported file format (' + extension +  ').' );

				break;

		}

	}

	var handleJSON = function ( data, file, filename ) {

		if ( data.metadata === undefined ) { // 2.0

			data.metadata = { type: 'Geometry' };

		}

		if ( data.metadata.type === undefined ) { // 3.0

			data.metadata.type = 'Geometry';

		}

		if ( data.metadata.version === undefined ) {

			data.metadata.version = data.metadata.formatVersion;

		}

		if ( data.metadata.type === 'BufferGeometry' ) {

			var loader = new THREE.BufferGeometryLoader();
			var result = loader.parse( data );

			var mesh = new THREE.Mesh( result );

			editor.addObject( mesh );
			editor.select( mesh );

		} else if ( data.metadata.type.toLowerCase() === 'geometry' ) {

			var loader = new THREE.JSONLoader();
			var result = loader.parse( data );

			var geometry = result.geometry;
			var material;

			if ( result.materials !== undefined ) {

				if ( result.materials.length > 1 ) {

					material = new THREE.MeshFaceMaterial( result.materials );

				} else {

					material = result.materials[ 0 ];

				}

			} else {

				material = new THREE.MeshPhongMaterial();

			}

			geometry.sourceType = "ascii";
			geometry.sourceFile = file.name;

			var mesh;

			if ( geometry.animation && geometry.animation.hierarchy ) {

				mesh = new THREE.SkinnedMesh( geometry, material );

			} else {

				mesh = new THREE.Mesh( geometry, material );

			}

			mesh.name = filename;

			editor.addObject( mesh );
			editor.select( mesh );

		} else if ( data.metadata.type.toLowerCase() === 'object' ) {

			var loader = new THREE.ObjectLoader();
			var result = loader.parse( data );

			if ( result instanceof THREE.Scene ) {

				editor.setScene( result );

			} else {

				editor.addObject( result );
				editor.select( result );

			}

		} else if ( data.metadata.type.toLowerCase() === 'scene' ) {

			// DEPRECATED

			var loader = new THREE.SceneLoader();
			loader.parse( data, function ( result ) {

				editor.setScene( result.scene );

			}, '' );

		}

	};

}

function marchingCubesInit(mhdData, rawData){
    console.log("mhdData: " + mhdData.rawFile + " rawData " + rawData.length);
    
        if(window.webcl == undefined) {
        alert("Unfortunately your system does not support WebCL. " +
              "Make sure that you have both the OpenCL driver " +
              "and the WebCL browser extension installed.");
        return false;
    }
 
    // Get a list of available CL platforms, and another list of the
    // available devices on each platform. If there are no platforms,
    // or no available devices on any platform, then we can conclude
    // that WebCL is not available.
    
    try {
        
        console.log("started");
        
        // init basic stuff
        var platforms = webcl.getPlatforms();
        var devices = [];
        for (var i in platforms) {
            var plat = platforms[i];
            devices[i] = plat.getDevices();
        }
        
        var singleDevice = devices[0][0];
        //alert(singleDevice.getInfo(WebCL.DEVICE_NAME));
        
        var ctx = webcl.createContext ();
        var cmdQueue = ctx.createCommandQueue(singleDevice);
        
        var bufIn1 = ctx.createBuffer (WebCL.MEM_READ_WRITE, 4);
        

        //build kernel
        var kernelSrc = loadKernel("clMarchingCubes");
        var program = ctx.createProgram(kernelSrc);
        var device = ctx.getInfo(WebCL.CONTEXT_DEVICES)[0];

        try {
          program.build ([device], "");
        } catch(e) {
          alert ("Failed to build WebCL program. Error "
                 + program.getBuildInfo (device, 
                                                WebCL.PROGRAM_BUILD_STATUS)
                 + ":  " 
                 + program.getBuildInfo (device, 
                                                WebCL.PROGRAM_BUILD_LOG));
          throw e;
        }
        
        
        //var matrix1D = new Array(rawData.length/2),
        var matrix1D = new ArrayBuffer(rawData.length),
            buffer1,
            buffer2,
            i = 0,
            j = 0;
        
        var matrix1DView = new Int16Array(matrix1D);
        
        console.log("calculatig ...");
        console.log(matrix1D.byteLength );
        var rawLenght = rawData.length;
        while(i < rawLenght){
            buffer1 = rawData[i].charCodeAt(0);
            buffer2 = rawData[i+1].charCodeAt(0);
            buffer2<<=8;
            buffer2+=buffer1;
            matrix1DView[j] = buffer2;
            j = j + 1;
            i = i + 2;
        }
        delete rawData;
        for(var i = 54881318/2; i < 54881330/2; i++)
            console.log(matrix1DView[i].toString(2));
        console.log(matrix1D.byteLength );
        
        var sigma = 50/100;
        var threshold = 50/100;
        
        var gaussSize = Math.floor(2 * Math.ceil(3 * sigma / mhdContent.dx) + 1);
        var dimensions = new Array( mhdContent.Nx , mhdContent.Ny , mhdContent.Nz, gaussSize );
        
        
        // locateMemory for dimensions
        var buffer = new ArrayBuffer(dimensions.length * 4); //float has 4 bytes, it's a float buffer
        
        var bufferView = new Float32Array(buffer);
        
        var memory = ctx.createBuffer(webcl.MEM_READ_WRITE, dimensions.length * 4);
        
        for(i = 0; i < dimensions.length; i++)
            bufferView[i] = dimensions[i];
        
        // Write the buffer to OpenCL device memory
        cmdQueue.enqueueWriteBuffer(memory, false, 0, dimensions.length * 4, bufferView);
        
        
        // locateMemory for Matrix
        var memory1 = ctx.createBuffer(webcl.MEM_READ_WRITE, rawLenght);
        cmdQueue.enqueueWriteBuffer(memory1, false, 0, rawLenght, matrix1DView);
        
        alert("jaj");
        
        webcl.releaseAll();
        
    } catch (e) {
        alert(e.message);
    }
    
}

// returns the kernel source code
function loadKernel(id){
  var kernelElement = document.getElementById(id);
  var kernelSource = kernelElement.text;
  if (kernelElement.src != "") {
      var mHttpReq = new XMLHttpRequest();
      mHttpReq.open("GET", kernelElement.src, false);
      mHttpReq.send(null);
      kernelSource = mHttpReq.responseText;
  } 
  return kernelSource;
}
      
